"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const pdfParse = require("pdf-parse");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.mjs");
try {
    const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}
catch (error) {
    console.warn('PDF.js worker not configured, will use pdf-parse fallback');
}
let MedicalRecordService = class MedicalRecordService {
    constructor(httpService) {
        this.httpService = httpService;
        this.extractedDataStore = new Map();
        this.fileStore = new Map();
        this.BASE_API = 'https://emr-utils-test-363382968588.asia-south1.run.app';
    }
    async extractFiles(body, files, userInfo, options = { format: true }) {
        const url = `${this.BASE_API}/extract-record`;
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
        });
        try {
            const payload = {
                folder: `consumer/medical-records`,
                bucket: process.env.EMR_BUCKET || 'emr-dev-bucket'
            };
            const requestOptions = await this.getRequestHeader(22);
            const uploadResponse = this.httpService.post(`${this.BASE_API}/store-files`, formData);
            formData.append('data', JSON.stringify(payload));
            const extraction = this.httpService.post(url, formData, requestOptions);
            const [filesInfo, extractedText] = await Promise.all([
                (0, rxjs_1.lastValueFrom)(uploadResponse),
                (0, rxjs_1.lastValueFrom)(extraction)
            ]);
            console.log("file extraction completed");
            let allFiles = [];
            let existingExtractionData;
            const extractedData = await this.getExtractedData(extractedText.data || extractedText, userInfo, options);
            return extractedData;
        }
        catch (error) {
            console.error('Medical record extraction failed:', error);
            console.log('Falling back to local processing...');
            try {
                const localResults = [];
                for (const file of files) {
                    console.log(`Processing file locally: ${file.originalname}`);
                    const extractedText = await this.extractTextFromFile(file);
                    console.log(`Local text extraction result: ${extractedText.length} characters`);
                    const processedData = await this.processHistoryExtraction({
                        id: 0,
                        transcript: extractedText,
                        filename: file.originalname
                    }, userInfo, { ...options, raw: true });
                    localResults.push(processedData);
                }
                console.log(`Local processing completed for ${localResults.length} files`);
                return localResults;
            }
            catch (localError) {
                console.error('Local processing also failed:', localError);
                throw new common_1.HttpException("Failed to process medical records", 500);
            }
        }
    }
    async getExtractedData(extractedText, userInfo, options) {
        console.log('=== GET EXTRACTED DATA ===');
        console.log('Input type:', typeof extractedText);
        console.log('Is array:', Array.isArray(extractedText));
        const extractedData = [];
        const batchSize = 3;
        const textArray = Array.isArray(extractedText) ? extractedText : [extractedText];
        console.log('Processing', textArray.length, 'items');
        for (let i = 0; i < textArray.length; i += batchSize) {
            const batch = textArray.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map((item, index) => {
                console.log(`Processing item ${i + index + 1}:`, typeof item, item?.name || 'no name');
                return this.processHistoryExtraction({
                    id: 0,
                    transcript: item,
                    filename: item.name || item.originalname || `file_${i + index + 1}`
                }, userInfo, { ...options, raw: true });
            }));
            extractedData.push(...batchResults);
        }
        console.log('=== EXTRACTED DATA COMPLETE ===');
        console.log('Total extracted items:', extractedData.length);
        return extractedData;
    }
    async processHistoryExtraction(body, userInfo, options = { format: true }) {
        console.log('=== PROCESSING HISTORY EXTRACTION ===');
        console.log('Processing file:', body.filename);
        let extractedText = '';
        if (typeof body.transcript === 'string') {
            extractedText = body.transcript;
        }
        else if (body.transcript && body.transcript.text) {
            const textData = body.transcript.text;
            extractedText = Object.values(textData).join('\n');
        }
        else {
            extractedText = JSON.stringify(body.transcript);
        }
        console.log('Extracted text length:', extractedText.length);
        console.log('Using extracted text, length:', extractedText.length);
        try {
            const payload = {
                "unstructured_text": this.jsonToKeyValueString(extractedText)
            };
            const requestOptions = await this.getRequestHeader(12);
            const endpoint = process.env["AI_ENDPOINT"] + "/v1/enhanced-emr/extract-history";
            console.log(endpoint);
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.post(endpoint, payload, requestOptions));
            console.log(response);
            const processTranscript = response.data;
            const clinicalData = processTranscript.other_relevant_clinical_details;
            processTranscript.other_clinical_data = clinicalData?.length ? this.formatClinicalDetails(clinicalData) : '';
            delete processTranscript.other_relevant_clinical_details;
            console.log('=== EMR API EXTRACTION SUCCESS ===');
            console.log('Investigations count:', processTranscript.investigations?.length || 0);
            console.log('Imaging reports count:', processTranscript.imaging_radiology_reports?.length || 0);
            return { fileName: body?.filename || 'untitled', extraction: processTranscript };
        }
        catch (error) {
            console.log('EMR API extraction failed, using local fallback:', error.message);
            const structuredData = this.extractStructuredData(extractedText, body.filename || 'unknown');
            structuredData.other_clinical_data = structuredData.other_relevant_clinical_details || '';
            delete structuredData.other_relevant_clinical_details;
            return {
                fileName: body.filename || 'untitled',
                extraction: structuredData
            };
        }
    }
    async getRequestHeader(promptId) {
        return {
            authRequired: false,
            headers: {
                'prompt-id': promptId
            }
        };
    }
    jsonToKeyValueString(obj) {
        if (typeof obj === 'string')
            return obj;
        const convertToKeyValue = (data, prefix = '') => {
            const result = [];
            if (typeof data === 'object' && data !== null) {
                for (const [key, value] of Object.entries(data)) {
                    const newKey = prefix ? `${prefix}.${key}` : key;
                    if (typeof value === 'object' && value !== null) {
                        result.push(...convertToKeyValue(value, newKey));
                    }
                    else {
                        result.push(`${newKey}: ${value}`);
                    }
                }
            }
            else {
                result.push(`${prefix}: ${data}`);
            }
            return result;
        };
        return convertToKeyValue(obj).join('\n');
    }
    formatClinicalDetails(details) {
        return details
            .map((d) => {
            const date = new Date(d.result_timestamp);
            const formattedDate = date.toLocaleDateString();
            return `${formattedDate}\n${d.detail_text}`;
        })
            .join('\n\n');
    }
    async extractTextFromFile(file) {
        console.log('=== EXTRACTING TEXT FROM FILE ===');
        console.log('File name:', file.originalname);
        console.log('File type:', file.mimetype);
        console.log('File size:', file.size);
        try {
            if (file.mimetype === 'application/pdf' && file.buffer) {
                console.log('Attempting PDF parsing...');
                const pdfData = await pdfParse(file.buffer);
                if (pdfData.text && pdfData.text.length > 50) {
                    console.log('PDF parsing successful, text length:', pdfData.text.length);
                    return pdfData.text;
                }
            }
        }
        catch (error) {
            console.log('PDF parsing failed:', error.message);
        }
        console.log('Text extraction failed, returning empty string');
        return '';
    }
    async extractTextFromPdf(file) {
        try {
            if (file.mimetype === 'application/pdf' && file.buffer) {
                console.log(`Attempting to extract text from PDF: ${file.originalname} using PDF.js`);
                try {
                    const uint8Array = new Uint8Array(file.buffer);
                    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
                    console.log(`PDF loaded, total pages: ${pdf.numPages}`);
                    const textByPage = {};
                    let totalTextLength = 0;
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        textByPage[`Page ${pageNum}`] = pageText;
                        totalTextLength += pageText.length;
                        console.log(`Extracted text from page ${pageNum}, length: ${pageText.length}`);
                    }
                    const allText = Object.values(textByPage).join('\n');
                    console.log(`PDF.js extraction result: ${allText.length} characters extracted`);
                    if (allText.trim().length > 100) {
                        console.log('✅ PDF.js extraction successful - text-based PDF');
                        return allText;
                    }
                    console.log('⚠️ PDF.js extracted minimal text - likely image-based PDF, trying OCR...');
                    return await this.extractTextWithOCR(pdf, file.originalname);
                }
                catch (pdfjsError) {
                    console.warn('PDF.js extraction failed, falling back to pdf-parse:', pdfjsError.message);
                }
                try {
                    const pdfParseModule = pdfParse;
                    const parseFunction = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule.default;
                    if (typeof parseFunction === 'function') {
                        const pdfData = await parseFunction(file.buffer);
                        const text = pdfData.text || '';
                        console.log(`pdf-parse extraction result: ${text.length} characters extracted`);
                        if (text.trim().length > 100) {
                            console.log('✅ pdf-parse extraction successful');
                            return text;
                        }
                        console.log('⚠️ pdf-parse extracted minimal text - trying OCR as last resort...');
                        const uint8Array = new Uint8Array(file.buffer);
                        const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
                        return await this.extractTextWithOCR(pdf, file.originalname);
                    }
                    else {
                        console.error('pdf-parse is not a function, type:', typeof parseFunction);
                    }
                }
                catch (pdfParseError) {
                    console.error('pdf-parse extraction failed:', pdfParseError.message);
                }
            }
            console.log('File is not a PDF or has no buffer');
            return '';
        }
        catch (error) {
            console.error('PDF extraction failed:', error.message);
            return '';
        }
    }
    async extractTextWithOCR(pdf, filename) {
        console.log('=== OCR EXTRACTION NOT YET IMPLEMENTED ===');
        console.log(`OCR would process ${pdf.numPages} pages with Tesseract`);
        console.log('For scanned PDFs, please use a text-based PDF or implement proper canvas-to-image conversion');
        return '';
    }
    async generateDownloadContent(blobName) {
        const fileName = blobName.split('/').pop() || '';
        const storedData = this.extractedDataStore.get(blobName);
        let content;
        if (storedData && storedData.extractedText) {
            content = storedData.extractedText;
        }
        else {
            content = this.getFallbackTextByName(fileName);
        }
        const fullContent = `EXTRACTED MEDICAL REPORT\n\nFile: ${fileName}\nExtracted: ${new Date().toLocaleDateString()}\n\n=== PAGE 1 ===\n\n${content}`;
        return fullContent;
    }
    async generatePreviewContent(blobName) {
        const fileName = blobName.split('/').pop() || '';
        const storedData = this.extractedDataStore.get(blobName);
        let content;
        if (storedData && storedData.extractedText) {
            content = storedData.extractedText;
        }
        else {
            content = this.getFallbackTextByName(fileName);
        }
        const preview = content.substring(0, 300);
        return `${fileName}\n\n${preview}${content.length > 300 ? '...' : ''}`;
    }
    getFallbackTextByName(fileName) {
        return `Medical Record: ${fileName}\n\nNo text content available for this file.`;
    }
    async getOriginalFile(blobName) {
        console.log(`Retrieving file: ${blobName}`);
        console.log('Available files:', Array.from(this.fileStore.keys()));
        const file = this.fileStore.get(blobName);
        if (!file) {
            throw new Error(`File not found: ${blobName}`);
        }
        return file;
    }
    parseBillingInvestigations(text) {
        console.log('=== PARSING BILLING INVESTIGATIONS ===');
        const investigations = [];
        const investigationSections = [];
        const mainInvestigationMatch = text.match(/Investigation([\s\S]*?)(?:IPD Registration|Pharmacy|Room Charges|Radiologist|Total|Grand Total|Net Amount|$)/i);
        if (mainInvestigationMatch) {
            investigationSections.push(mainInvestigationMatch[1]);
        }
        const pagePattern = /Page \d+[\s\S]*?Investigation([\s\S]*?)(?=Page \d+|$)/gi;
        let pageMatch;
        while ((pageMatch = pagePattern.exec(text)) !== null) {
            if (pageMatch[1] && pageMatch[1].trim().length > 50) {
                investigationSections.push(pageMatch[1]);
            }
        }
        console.log(`Found ${investigationSections.length} investigation section(s) to process`);
        if (investigationSections.length > 0) {
            const combinedSectionText = investigationSections.join('\n');
            console.log('Combined investigation text length:', combinedSectionText.length);
            console.log('Investigation text preview:', combinedSectionText.substring(0, 500));
            const billingLinePattern = /(\d{2}\.\d{2}\.\d{2})\s+([A-Za-z][A-Za-z0-9\s\/\(\)\-\.]+?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g;
            let lineMatch;
            const extractedTests = new Set();
            while ((lineMatch = billingLinePattern.exec(combinedSectionText)) !== null) {
                const dateStr = lineMatch[1];
                const testName = lineMatch[2].trim();
                const quantity = lineMatch[3];
                const rate = lineMatch[4];
                const amount = lineMatch[5];
                if (testName.length < 2 ||
                    testName.match(/^(Page|Total|Amount|Rate|Qty|Date|Sr|No)/i) ||
                    testName.match(/^\d+$/)) {
                    continue;
                }
                const dateParts = dateStr.split('.');
                const year = parseInt(dateParts[2]) > 50 ? `19${dateParts[2]}` : `20${dateParts[2]}`;
                const testDate = `${year}-${dateParts[1]}-${dateParts[0]}`;
                const testKey = `${testName.toLowerCase()}_${testDate}`;
                if (!extractedTests.has(testKey)) {
                    extractedTests.add(testKey);
                    console.log(`Found test in billing: ${testName} (${testDate}) - Qty: ${quantity}, Rate: ${rate}, Amount: ${amount}`);
                    investigations.push({
                        result_timestamp: testDate,
                        investigation_name: testName,
                        result: 'Pending/Not Available',
                        unit: '',
                        reference_range: '',
                        flag: 'PENDING',
                        note: `Test ordered - Qty: ${quantity}, Rate: ₹${rate}, Amount: ₹${amount} (Results not included in billing document)`
                    });
                }
            }
            if (investigations.length < 5) {
                console.log('Regex parsing found few results, trying line-by-line parsing...');
                const lines = combinedSectionText.split('\n');
                const datePattern = /(\d{2}\.\d{2}\.\d{2})/;
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.length < 10 ||
                        trimmedLine.match(/^(Investigation|Date|Sr|No|Page|Total|Amount)/i)) {
                        continue;
                    }
                    const dateMatch = trimmedLine.match(/^(\d{2}\.\d{2}\.\d{2})\s+(.+)/);
                    if (dateMatch) {
                        const dateStr = dateMatch[1];
                        const restOfLine = dateMatch[2];
                        const testNameMatch = restOfLine.match(/^([A-Za-z][A-Za-z0-9\s\/\(\)\-\.]+?)(?:\s+\d+\s+\d+|\s+\d+\.\d+)/);
                        if (testNameMatch) {
                            const testName = testNameMatch[1].trim();
                            const dateParts = dateStr.split('.');
                            const year = parseInt(dateParts[2]) > 50 ? `19${dateParts[2]}` : `20${dateParts[2]}`;
                            const testDate = `${year}-${dateParts[1]}-${dateParts[0]}`;
                            const testKey = `${testName.toLowerCase()}_${testDate}`;
                            if (!extractedTests.has(testKey) && testName.length > 2) {
                                extractedTests.add(testKey);
                                console.log(`Found test (line parsing): ${testName} (${testDate})`);
                                investigations.push({
                                    result_timestamp: testDate,
                                    investigation_name: testName,
                                    result: 'Pending/Not Available',
                                    unit: '',
                                    reference_range: '',
                                    flag: 'PENDING',
                                    note: 'Test ordered - results not included in billing document'
                                });
                            }
                        }
                    }
                }
            }
        }
        console.log(`Extracted ${investigations.length} investigations from billing document`);
        return investigations;
    }
    extractStructuredData(text, filename) {
        console.log('=== EXTRACT STRUCTURED DATA ===');
        console.log('Input text length:', text.length);
        console.log('Text preview (first 1000 chars):', text.substring(0, 1000));
        const hasBillingKeywords = text.match(/IPD PATIENT BILL|FINAL BILL|Invoice|Receipt|Payment|Amount|Rate|Qty|Total Amount|Net Amount/i);
        const hasInvestigationSection = text.match(/Investigation/i);
        const hasLabResultHeaders = text.match(/Result\s*\t\s*Unit\s*\t\s*Range|Test\s*\t\s*Result\s*\t\s*Unit/i);
        const hasBillingAmounts = text.match(/\d+\.\d{2}\s+\d+\.\d{2}\s+\d+\.\d{2}/);
        const isBillingDocument = hasBillingKeywords && hasInvestigationSection && !hasLabResultHeaders && hasBillingAmounts;
        console.log('=== DOCUMENT TYPE DETECTION ===');
        console.log('Has billing keywords:', !!hasBillingKeywords);
        console.log('Has investigation section:', !!hasInvestigationSection);
        console.log('Has lab result headers:', !!hasLabResultHeaders);
        console.log('Has billing amounts pattern:', !!hasBillingAmounts);
        console.log('Is billing document:', isBillingDocument);
        let investigations = [];
        let imagingReports = [];
        let otherClinicalData = '';
        let parseResult = null;
        if (isBillingDocument) {
            console.log('=== DETECTED BILLING DOCUMENT FORMAT ===');
            console.log('Processing billing document...');
            investigations = this.parseBillingInvestigations(text);
        }
        else {
            console.log('=== PROCESSING AS REGULAR LAB REPORT ===');
            console.log('Text contains numeric values:', /\d+\.?\d*/.test(text));
            console.log('Text contains lab-related keywords:', /(creatinine|hemoglobin|platelet|wbc|rbc|glucose|cholesterol)/i.test(text));
            parseResult = this.parseLabResults(text);
            investigations = parseResult.results;
            console.log('Lab results parsing completed, found:', investigations.length, 'results');
            imagingReports = this.extractImagingReports(text, filename);
            otherClinicalData = this.extractOtherClinicalData(text);
        }
        console.log(`=== EXTRACT STRUCTURED DATA COMPLETE ===`);
        console.log(`File: ${filename}`);
        console.log(`Extracted ${investigations.length} investigations`);
        console.log(`Extracted ${imagingReports.length} imaging reports`);
        console.log('All investigations:', investigations);
        console.log('All imaging reports:', imagingReports);
        const debugInfo = {
            textLength: text.length,
            firstLines: text.split('\n').slice(0, 20),
            containsNumbers: /\d+\.?\d*/.test(text),
            containsLabKeywords: /(creatinine|hemoglobin|platelet|wbc|rbc|glucose|cholesterol)/i.test(text),
            documentType: isBillingDocument ? 'billing' : 'lab_report',
            detection: {
                hasBillingKeywords,
                hasInvestigationSection,
                hasLabResultHeaders,
                hasBillingAmounts
            },
            investigationsCount: investigations.length,
            sampleInvestigation: investigations.length > 0 ? investigations[0] : null,
            parsing: parseResult?.debug || null,
            textSample: text.substring(0, 2000),
            linesWithNumbers: text.split('\n').filter(line => /\d+\.?\d*/.test(line.trim())).slice(0, 10)
        };
        return {
            investigations: investigations,
            imaging_radiology_reports: imagingReports,
            other_clinical_data: otherClinicalData,
        };
    }
    parseLabResults(text) {
        console.log('=== LAB RESULTS PARSING WITH IMPROVED ACCURACY ===');
        console.log('Input text length:', text.length);
        console.log('Text preview (first 2000 chars):', text.substring(0, 2000));
        const results = [];
        let lines = text.split(/\r?\n|\r/);
        if (lines.length === 1) {
            console.log('Only one line detected, trying alternative splitting...');
            lines = text.split(/\s{3,}/);
        }
        console.log(`After splitting: ${lines.length} lines`);
        console.log('First 10 lines after splitting:', lines.slice(0, 10));
        const datePatterns = [
            /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
            /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g,
            /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/g,
            /Date[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
            /Collected[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
        ];
        let extractedDate = new Date().toISOString().split('T')[0];
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                const dateStr = match[1] || match[0];
                console.log('Found date string:', dateStr);
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                        const month = parts[1].padStart(2, '0');
                        const day = parts[0].padStart(2, '0');
                        extractedDate = `${year}-${month}-${day}`;
                    }
                }
                else if (dateStr.includes('-')) {
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                        const month = parts[1].padStart(2, '0');
                        const day = parts[0].padStart(2, '0');
                        extractedDate = `${year}-${month}-${day}`;
                    }
                }
                else if (dateStr.includes('.')) {
                    const parts = dateStr.split('.');
                    if (parts.length === 3) {
                        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                        const month = parts[1].padStart(2, '0');
                        const day = parts[0].padStart(2, '0');
                        extractedDate = `${year}-${month}-${day}`;
                    }
                }
                console.log('Parsed date:', extractedDate);
                break;
            }
        }
        console.log('Using date:', extractedDate);
        console.log('=== STEP-BY-STEP IMPROVED PARSING ===');
        const potentialTestLines = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            console.log(`Analyzing line ${i}: "${line}"`);
            if (line.length < 5) {
                console.log('  -> Skipping: too short');
                continue;
            }
            if (this.isHeaderLine(line)) {
                console.log('  -> Skipping: header line');
                continue;
            }
            if (this.shouldSkipMethodologyLine(line)) {
                console.log('  -> Skipping: methodology/metadata line');
                continue;
            }
            const hasNumericValue = /\d+\.?\d*/.test(line);
            if (!hasNumericValue) {
                console.log('  -> Skipping: no numeric value');
                continue;
            }
            const hasTestNamePattern = /\([A-Za-z\s]+\)|\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(line);
            if (!hasTestNamePattern && !line.includes('(') && !line.includes(')')) {
                console.log('  -> Skipping: no test name pattern');
                continue;
            }
            console.log('  -> POTENTIAL TEST LINE FOUND');
            potentialTestLines.push({ line, index: i });
        }
        console.log(`Found ${potentialTestLines.length} potential test lines`);
        for (const { line, index } of potentialTestLines) {
            console.log(`\n=== PARSING LINE ${index} ===`);
            console.log(`Line content: "${line}"`);
            const parts = line.split(/\s{2,}/).map(p => p.trim()).filter(p => p);
            console.log('  -> Split into parts:', parts);
            if (parts.length < 2) {
                console.log('  -> Not enough parts, skipping');
                continue;
            }
            let testName = '';
            let value = '';
            let flag = 'Normal';
            let unit = '';
            let range = '';
            let valueIndex = -1;
            for (let j = 0; j < parts.length; j++) {
                if (/^\d+\.?\d*$/.test(parts[j]) && !parts[j].includes('/') && !parts[j].includes('-')) {
                    valueIndex = j;
                    value = parts[j];
                    break;
                }
            }
            if (valueIndex === -1) {
                console.log('  -> No valid numeric value found, skipping');
                continue;
            }
            const rawTestName = parts.slice(0, valueIndex).join(' ');
            console.log('  -> Raw test name:', rawTestName);
            testName = this.cleanTestNameForParsing(rawTestName);
            console.log('  -> Cleaned test name:', testName);
            const remaining = parts.slice(valueIndex + 1);
            console.log('  -> Remaining parts:', remaining);
            for (let j = 0; j < remaining.length; j++) {
                const part = remaining[j];
                if (/^(H|L|N|Normal|High|Low|BorderlineHigh|BorderlineLow)$/i.test(part)) {
                    flag = this.normalizeFlag(part);
                    remaining.splice(j, 1);
                    console.log('  -> Found flag:', flag);
                    break;
                }
            }
            for (let j = 0; j < remaining.length; j++) {
                const part = remaining[j];
                if (/^[a-zA-Z\/\%\^\d\.]+$/.test(part) &&
                    part.length <= 15 &&
                    !/^\d/.test(part) &&
                    !part.includes(' - ') &&
                    !part.includes('<') &&
                    !part.includes('>')) {
                    unit = part;
                    remaining.splice(j, 1);
                    console.log('  -> Found unit:', unit);
                    break;
                }
            }
            range = remaining.join(' ').trim();
            console.log('  -> Reference range:', range);
            if (testName && value && this.isValidLabResult(testName, value)) {
                const result = {
                    investigation_name: testName,
                    result: value.replace(/,/g, ''),
                    unit: unit,
                    reference_range: range,
                    flag: flag,
                    result_timestamp: extractedDate
                };
                console.log('✓ SUCCESS: Parsed result:', result);
                results.push(result);
            }
            else {
                console.log('  -> Validation failed:', { testName, value, valid: this.isValidLabResult(testName, value) });
            }
        }
        console.log(`\n=== PARSING COMPLETE ===`);
        console.log(`Total results found: ${results.length}`);
        const uniqueResults = this.cleanLabResults(results);
        console.log(`After deduplication: ${uniqueResults.length} unique results`);
        const parsingDebug = {
            totalLinesProcessed: lines.length,
            potentialTestLines: potentialTestLines.length,
            resultsBeforeDedup: results.length,
            resultsAfterDedup: uniqueResults.length,
            sampleRawResult: results.length > 0 ? results[0] : null,
            sampleCleanResult: uniqueResults.length > 0 ? uniqueResults[0] : null,
            parsingMethod: 'improved_accuracy_v2'
        };
        return { results: uniqueResults, debug: parsingDebug };
    }
    shouldSkipMethodologyLine(line) {
        const skipKeywords = [
            'sample type',
            'note:',
            'please correlate',
            'mayo clinical laboratories',
            'kinetic',
            'spectrophotometry',
            'electrical',
            'calculation',
            'immunoturbidimetry',
            'flow cytometry',
            'colorimetric',
            'enzymatic',
            'diazo',
            'tris buffer',
            'amp buffer',
            'ifcc',
            'jc factored',
            'oxidhemoglobin',
            'electrical impedance',
            '- - -',
            'type',
            'diabetes',
            'years/f',
            'normal',
            'this',
            'pulmonary embolism',
            'anticoagulant therapy',
            'false',
            'assay based on',
            'method',
            'technique',
            'technology',
            'reference range',
            'reference interval',
            'clinical significance',
            'interpretation',
            'comment',
            'remark',
            'source:',
            'update in reference',
            'effect from',
            'correlation clinically',
            'laboratory method',
            'test methodology',
            'analytical method',
            'measurement method'
        ];
        const lowerLine = line.toLowerCase();
        const shouldSkip = skipKeywords.some(keyword => lowerLine.includes(keyword));
        const skipPatterns = [
            /^\s*-+\s*$/,
            /^\s*\d+\s*\/\s*\d+\s*$/,
            /^\s*page\s+\d+/i,
            /^\s*continued/i,
            /^\s*end of report/i,
            /^\s*report generated/i,
            /^\s*printed on/i,
            /^\s*total pages/i
        ];
        const patternSkip = skipPatterns.some(pattern => pattern.test(lowerLine));
        return shouldSkip || patternSkip;
    }
    normalizeFlag(flagText) {
        if (!flagText)
            return 'Normal';
        const normalized = flagText.toUpperCase().trim();
        switch (normalized) {
            case 'H':
            case 'HIGH':
                return 'High';
            case 'L':
            case 'LOW':
                return 'Low';
            case 'N':
            case 'NORMAL':
                return 'Normal';
            case 'BORDERLINEHIGH':
                return 'BorderlineHigh';
            case 'BORDERLINELOW':
                return 'BorderlineLow';
            default:
                return 'Normal';
        }
    }
    cleanTestNameForParsing(testName) {
        if (!testName)
            return '';
        const prefixesToRemove = [
            'kinetic colorimetric assay based on jaffe method',
            'spectrophotometry',
            'electrical impedance',
            'calculation',
            'immunoturbidimetry',
            'flow cytometry',
            'colorimetric assay',
            'enzymatic colorimetric assay',
            'tris buffer',
            'amp buffer',
            'ifcc',
            'jc factored',
            'oxidhemoglobin',
            'mayo clinical laboratories',
            'kinetic colorimetric',
            'colorimetric assay',
            'assay based on',
            'electrical impedance',
            'spectrophotometric',
            'immunoassay',
            'chemiluminescence',
            'electrochemical',
            'turbidimetric',
            'nephelometric'
        ];
        let cleaned = testName.toLowerCase().trim();
        for (const prefix of prefixesToRemove) {
            const regex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i');
            cleaned = cleaned.replace(regex, '');
        }
        cleaned = cleaned.replace(/^[-–—]+\s*/, '');
        cleaned = cleaned.replace(/\s*[-–—]+\s*$/, '');
        cleaned = cleaned.replace(/\s+mg\/dl\s+\d+\.?\d*\s*-\s*\d+\.?\d*/gi, '');
        cleaned = cleaned.replace(/\s+g\/dl\s+\d+\.?\d*\s*-\s*\d+\.?\d*/gi, '');
        cleaned = cleaned.replace(/\s+mmol\/l\s+\d+\.?\d*\s*-\s*\d+\.?\d*/gi, '');
        cleaned = cleaned.replace(/\s+iu\/l\s+\d+\.?\d*\s*-\s*\d+\.?\d*/gi, '');
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        return cleaned.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .filter(word => word.length > 0)
            .join(' ');
    }
    parseSpecificLabFormat(text, defaultDate) {
        console.log('=== PARSING SPECIFIC LAB FORMAT ===');
        const results = [];
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.length < 10)
                continue;
            const parts = trimmedLine.split('\t').map(p => p.trim());
            if (parts.length >= 6) {
                const [date, testName, value, unit, range, status] = parts;
                if (this.isValidLabResult(testName, value)) {
                    const result = {
                        date: date || defaultDate,
                        investigation_name: testName,
                        result: value.replace(/,/g, ''),
                        unit: unit,
                        reference_range: range,
                        flag: status || 'NORMAL'
                    };
                    console.log('Parsed specific format result:', result);
                    results.push(result);
                }
            }
        }
        console.log(`Found ${results.length} results in specific format`);
        return results;
    }
    isValidLabResult(testName, value) {
        if (!testName || !value || testName.length < 3)
            return false;
        const invalidNames = ['patient', 'date', 'report', 'laboratory', 'page', 'ref', 'sample', 'collected', 'registered', 'reported', 'unable', 'extract', 'text', 'from', 'pdf', 'error', 'failed', 'corrupted'];
        const lowerName = testName.toLowerCase();
        if (invalidNames.some(invalid => lowerName.includes(invalid)))
            return false;
        if (!/^[0-9\.\,]+$/.test(value.replace(/,/g, '')))
            return false;
        if (!/[a-zA-Z]/.test(testName))
            return false;
        if (lowerName.includes('unable') || lowerName.includes('extract') || lowerName.includes('error'))
            return false;
        return true;
    }
    isHeaderLine(line) {
        const headerKeywords = ['test', 'investigation', 'result', 'value', 'unit', 'range', 'reference', 'normal', 'status', 'flag'];
        const lowerLine = line.toLowerCase();
        const keywordCount = headerKeywords.filter(keyword => lowerLine.includes(keyword)).length;
        return keywordCount >= 2;
    }
    extractUnit(text) {
        const unitPatterns = [
            /([a-zA-Z\/\%\^\d]+)$/,
            /\s([a-zA-Z\/\%\^\d]+)\s/,
            /([a-zA-Z\/\%\^\d]+)\s*\(/
        ];
        for (const pattern of unitPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        return '';
    }
    cleanLabResults(results) {
        const cleanedResults = [];
        const seen = new Set();
        for (const result of results) {
            const key = `${result.investigation_name.toLowerCase()}_${result.result}`;
            if (seen.has(key))
                continue;
            result.investigation_name = result.investigation_name.replace(/\s+/g, ' ').trim();
            result.unit = result.unit.replace(/[^a-zA-Z\/\%\^\d]/g, '');
            result.reference_range = result.reference_range.replace(/\s+/g, ' ').trim();
            seen.add(key);
            cleanedResults.push(result);
        }
        return cleanedResults;
    }
    determineFlag(value, range) {
        if (!range || !value)
            return 'Normal';
        const cleanRange = range.toLowerCase().trim();
        if (cleanRange.includes('high') || cleanRange.includes('elevated'))
            return 'High';
        if (cleanRange.includes('low') || cleanRange.includes('decreased'))
            return 'Low';
        if (cleanRange.includes('normal'))
            return 'Normal';
        if (cleanRange.includes('abnormal'))
            return 'BorderlineHigh';
        const patterns = [
            /([0-9\.]+)\s*[-–—]\s*([0-9\.]+)/,
            /<\s*=?\s*([0-9\.]+)/,
            />\s*=?\s*([0-9\.]+)/,
            /up\s+to\s+([0-9\.]+)/i,
            /<\s*or\s*=\s*([0-9\.]+)/i,
            /([0-9\.]+)\s+[-–—]\s+([0-9\.]+)/
        ];
        for (const pattern of patterns) {
            const match = cleanRange.match(pattern);
            if (match) {
                if (pattern.source.includes('[-–—]')) {
                    const min = parseFloat(match[1]);
                    const max = parseFloat(match[2]);
                    if (value < min)
                        return 'Low';
                    if (value > max)
                        return 'High';
                    return 'Normal';
                }
                else if (pattern.source.includes('<')) {
                    const threshold = parseFloat(match[1]);
                    return value >= threshold ? 'High' : 'Normal';
                }
                else if (pattern.source.includes('>')) {
                    const threshold = parseFloat(match[1]);
                    return value <= threshold ? 'Low' : 'Normal';
                }
                else if (pattern.source.includes('up')) {
                    const threshold = parseFloat(match[1]);
                    return value > threshold ? 'High' : 'Normal';
                }
            }
        }
        return 'Normal';
    }
    extractValue(text, regex) {
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    }
    extractImagingReports(text, filename) {
        const reports = [];
        const lowerText = text.toLowerCase();
        const lowerFilename = filename.toLowerCase();
        const imagingKeywords = ['x-ray', 'ct scan', 'mri', 'ultrasound', 'mammography', 'radiology', 'imaging', 'scan', 'radiological'];
        const hasImagingContent = imagingKeywords.some(keyword => lowerText.includes(keyword) || lowerFilename.includes(keyword));
        if (hasImagingContent) {
            const bodyPart = this.extractValue(text, /(?:body part|region|area)[:\s]*([^\n:]+)/i) ||
                this.extractValue(text, /(?:examination of)[:\s]*([^\n:]+)/i) ||
                this.detectBodyPartFromText(text);
            const scanType = this.extractValue(text, /(?:scan type|modality|technique)[:\s]*([^\n:]+)/i) ||
                this.detectScanTypeFromText(text);
            const findings = this.extractValue(text, /(?:findings|observations)[:\s]*([^\n:]+(?:\n[^\n:]+)*)/i) ||
                this.extractLongTextSection(text, ['findings', 'observations']);
            const impression = this.extractValue(text, /(?:impression|conclusion|diagnosis)[:\s]*([^\n:]+(?:\n[^\n:]+)*)/i) ||
                this.extractLongTextSection(text, ['impression', 'conclusion', 'diagnosis']);
            reports.push({
                scan_type: scanType || 'Not specified',
                findings: findings || 'No specific findings documented',
                body_part: bodyPart || 'Not specified',
                impression: impression || 'No impression documented'
            });
        }
        return reports;
    }
    detectBodyPartFromText(text) {
        const bodyParts = ['chest', 'abdomen', 'head', 'brain', 'spine', 'pelvis', 'knee', 'shoulder', 'hand', 'foot', 'neck', 'heart', 'lung', 'liver', 'kidney'];
        const lowerText = text.toLowerCase();
        for (const part of bodyParts) {
            if (lowerText.includes(part)) {
                return part.charAt(0).toUpperCase() + part.slice(1);
            }
        }
        return '';
    }
    detectScanTypeFromText(text) {
        const scanTypes = ['x-ray', 'ct', 'mri', 'ultrasound', 'mammography', 'pet scan', 'bone scan'];
        const lowerText = text.toLowerCase();
        for (const type of scanTypes) {
            if (lowerText.includes(type)) {
                return type.toUpperCase();
            }
        }
        return '';
    }
    extractLongTextSection(text, keywords) {
        const lines = text.split('\n');
        let startIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            const lowerLine = lines[i].toLowerCase();
            if (keywords.some(keyword => lowerLine.includes(keyword))) {
                startIndex = i;
                break;
            }
        }
        if (startIndex === -1)
            return '';
        const sectionLines = [];
        for (let i = startIndex; i < lines.length && i < startIndex + 10; i++) {
            const line = lines[i].trim();
            if (line.length > 0) {
                sectionLines.push(line);
            }
        }
        return sectionLines.join(' ').substring(0, 500);
    }
    extractOtherClinicalData(text) {
        console.log('=== EXTRACTING OTHER CLINICAL DATA ===');
        const details = [];
        const nameMatch = text.match(/(?:Patient Name|Name)[:\s]*([^\n]+)/i);
        const ageMatch = text.match(/(?:Age|Age\/Sex)[:\s]*([^\n]+)/i);
        const genderMatch = text.match(/(?:Gender|Sex)[:\s]*([^\n]+)/i);
        const dobMatch = text.match(/(?:DOB|Date of Birth)[:\s]*([^\n]+)/i);
        if (nameMatch)
            details.push(`Patient Name: ${nameMatch[1].trim()}`);
        if (dobMatch)
            details.push(`Date of Birth: ${dobMatch[1].trim()}`);
        if (ageMatch)
            details.push(`Age/Gender: ${ageMatch[1].trim()}`);
        else if (genderMatch)
            details.push(`Gender: ${genderMatch[1].trim()}`);
        const doctorMatch = text.match(/(?:Ref\.?\s*Physician|Doctor|Consultant)[:\s]*([^\n]+)/i);
        if (doctorMatch)
            details.push(`Referring Physician: ${doctorMatch[1].trim()}`);
        const clinicalSections = [
            { pattern: /(?:Clinical\s+Notes?|Notes?)[:\s]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i, label: 'Clinical Notes' },
            { pattern: /(?:Interpretation|Clinical\s+Significance)[:\s]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i, label: 'Interpretation' },
            { pattern: /(?:Recommendations?|Advice)[:\s]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i, label: 'Recommendations' },
            { pattern: /(?:Comments?)[:\s]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i, label: 'Comments' },
            { pattern: /(?:Remarks?)[:\s]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i, label: 'Remarks' },
            { pattern: /(?:Diagnosis)[:\s]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i, label: 'Diagnosis' },
            { pattern: /(?:History|Medical\s+History)[:\s]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i, label: 'Medical History' },
            { pattern: /(?:Indication|Clinical\s+Indication)[:\s]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i, label: 'Clinical Indication' }
        ];
        for (const section of clinicalSections) {
            const match = text.match(section.pattern);
            if (match && match[1]) {
                const content = match[1].trim();
                if (content.length > 10) {
                    details.push(`\n${section.label}:\n${content.substring(0, 500)}`);
                }
            }
        }
        const notePattern = /(?:Note|Important|Warning|Caution)[:\s]*([^\n]+(?:\n(?!\n)[^\n]+)*)/gi;
        let noteMatch;
        while ((noteMatch = notePattern.exec(text)) !== null) {
            const content = noteMatch[1].trim();
            if (content.length > 10 && !details.some(d => d.includes(content.substring(0, 50)))) {
                details.push(`\nNote: ${content.substring(0, 300)}`);
            }
        }
        const methodPattern = /(?:Method|Methodology|Technique|Technology)[:\s]*([^\n]+)/gi;
        const methods = [];
        let methodMatch;
        while ((methodMatch = methodPattern.exec(text)) !== null) {
            const method = methodMatch[1].trim();
            if (method.length > 5 && method.length < 200) {
                methods.push(method);
            }
        }
        if (methods.length > 0) {
            details.push(`\nMethodology:\n${methods.slice(0, 5).join('\n')}`);
        }
        if (details.length === 0) {
            const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
            const medicalKeywords = ['patient', 'clinical', 'diagnosis', 'treatment', 'condition', 'symptoms', 'findings', 'test', 'result', 'analysis'];
            const relevantParagraphs = paragraphs.filter(p => {
                const lowerP = p.toLowerCase();
                return medicalKeywords.some(keyword => lowerP.includes(keyword));
            });
            if (relevantParagraphs.length > 0) {
                details.push('\nClinical Information:\n' + relevantParagraphs.slice(0, 3).join('\n\n').substring(0, 1000));
            }
        }
        const result = details.join('\n');
        console.log(`Extracted clinical data length: ${result.length} characters`);
        console.log('Clinical data preview:', result.substring(0, 200));
        return result;
    }
    async extractFileWithOCR(files) {
        const results = [];
        for (const file of files) {
            const ocrResult = await this.performOCRExtraction(file);
            const medicalContent = this.extractMedicalContentFromOCR(ocrResult.extractedText);
            results.push({
                fileName: file.originalname,
                ocrExtraction: ocrResult,
                medicalContent: medicalContent
            });
        }
        return results;
    }
    async performOCRExtraction(file) {
        const cloudUrl = `https://cloud-storage.com/files/${Date.now()}_${file.originalname}`;
        let extractedText = '';
        if (file.mimetype === 'application/pdf' && file.buffer) {
            try {
                console.log('Attempting PDF parsing for OCR...');
                const pdfData = await pdfParse(file.buffer);
                if (pdfData.text && pdfData.text.length > 50) {
                    extractedText = pdfData.text;
                    console.log('PDF OCR extraction successful, text length:', extractedText.length);
                }
                else {
                    console.log('PDF text too short');
                    extractedText = '';
                }
            }
            catch (error) {
                console.log('PDF OCR extraction failed:', error.message);
                extractedText = '';
            }
        }
        else {
            extractedText = '';
        }
        if (extractedText.toLowerCase().includes('unable to extract') || extractedText.toLowerCase().includes('error') || extractedText.length < 50) {
            console.log('Detected error text or insufficient content');
            extractedText = '';
        }
        return {
            cloudUrl: cloudUrl,
            extractedText: extractedText,
            status: 'success'
        };
    }
    extractMedicalContentFromOCR(ocrText) {
        const patientName = this.extractValue(ocrText, /Name[:\s]*([^\n:]+)/i) ||
            this.extractValue(ocrText, /Patient[:\s]*([^\n:]+)/i) || 'Unknown Patient';
        const dob = this.extractValue(ocrText, /DOB[:\s]*([^\n:]+)/i) || '';
        const ageGender = this.extractValue(ocrText, /Age\/Gender[:\s]*([^\n:]+)/i) || '';
        const refPhysician = this.extractValue(ocrText, /Ref\.Physician[:\s]*([^\n:]+)/i) || '';
        const centre = this.extractValue(ocrText, /Centre[:\s]*([^\n:]+)/i) || '';
        const refNo = this.extractValue(ocrText, /Ref No[:\s]*([^\n:]+)/i) || '';
        const sampleNo = this.extractValue(ocrText, /Sample No[:\s]*([^\n:]+)/i) || '';
        const collected = this.extractValue(ocrText, /Collected[:\s]*([^\n:]+)/i) || '';
        const investigations = this.parseLabResults(ocrText);
        const imagingReports = this.extractImagingReports(ocrText, 'ocr-file');
        const otherClinicalData = this.extractOtherClinicalData(ocrText);
        return {
            patient_demographics: {
                name: patientName.trim(),
                dob: dob.trim(),
                age_gender: ageGender.trim(),
                ref_physician: refPhysician.trim(),
                centre: centre.trim(),
                ref_no: refNo.trim(),
                sample_no: sampleNo.trim(),
                collected: collected.trim()
            },
            investigations: investigations,
            imaging_radiology_reports: imagingReports,
            other_relevant_clinical_details: otherClinicalData,
            extraction_timestamp: new Date().toISOString()
        };
    }
};
exports.MedicalRecordService = MedicalRecordService;
exports.MedicalRecordService = MedicalRecordService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], MedicalRecordService);
//# sourceMappingURL=medical-record.service.js.map
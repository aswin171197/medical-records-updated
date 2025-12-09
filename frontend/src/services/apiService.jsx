// src/services/apiService.js
import * as pdfjsLib from 'pdfjs-dist';
// removed dependency on ./httpService to avoid missing .get/.post issues

// Set up PDF.js worker (fallback to CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = process.env.REACT_APP_PDF_WORKER || '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/* -------------------------
   Small fetch-based HTTP helpers
   ------------------------- */
const API_BASE = process.env.REACT_APP_API_URL || 'https://medical-records-fullapp-3.onrender.com';

const buildHeaders = (extra = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
};

const apiGet = async (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(options.headers || {}),
    credentials: options.credentials || 'same-origin'
  });

  const text = await res.text().catch(() => '');
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  // Keep axios-like shape: { data, status, headers }
  return {
    data,
    status: res.status,
    headers: (() => {
      try {
        return Object.fromEntries(res.headers.entries());
      } catch (e) {
        return {};
      }
    })()
  };
};

const apiPost = async (path, body = {}, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const isFormData = body instanceof FormData;
  const res = await fetch(url, {
    method: 'POST',
    headers: isFormData ? { Authorization: buildHeaders().Authorization || '' } : buildHeaders(options.headers || {}),
    credentials: options.credentials || 'same-origin',
    body: isFormData ? body : JSON.stringify(body)
  });

  const text = await res.text().catch(() => '');
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  return {
    data,
    status: res.status,
    headers: (() => {
      try {
        return Object.fromEntries(res.headers.entries());
      } catch (e) {
        return {};
      }
    })()
  };
};

const apiDelete = async (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(options.headers || {}),
    credentials: options.credentials || 'same-origin'
  });

  const text = await res.text().catch(() => '');
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  return {
    data,
    status: res.status,
    headers: (() => {
      try {
        return Object.fromEntries(res.headers.entries());
      } catch (e) {
        return {};
      }
    })()
  };
};

/* -------------------------
   Your PDF text extraction + transform + upload code (unchanged logic)
   - I only removed the external httpService dependency
   - Kept debug logs you had
   ------------------------- */

/**
 * Extract text from PDF file URL
 * @param {string} pdfUrl - URL of the PDF file
 * @returns {Promise<Object>} Object with page-by-page text content
 */
const extractTextFromPdfUrl = async (pdfUrl) => {
  try {
    console.log('=== EXTRACTING TEXT FROM PDF URL ===');
    console.log('PDF URL:', pdfUrl);
    
    // Fetch the PDF file with CORS mode
    const response = await fetch(pdfUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('PDF downloaded, size:', arrayBuffer.byteLength, 'bytes');
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    console.log(`PDF loaded, total pages: ${pdf.numPages}`);
    
    const textByPage = {};
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      textByPage[`Page ${pageNum}`] = pageText;
      console.log(`Extracted text from page ${pageNum}, length: ${pageText.length}`);
    }
    
    return textByPage;
  } catch (error) {
    console.error('Error extracting text from PDF URL:', error);
    throw error;
  }
};

/**
 * Transform raw text data into structured format
 * (kept your original transformToStructuredData function)
 */
const transformToStructuredData = (rawData) => {
  const investigations = [];
  const imagingReports = [];
  let clinicalNotes = '';

  if (rawData.text) {
    const allText = Object.values(rawData.text).join('\n');

    console.log('=== TRANSFORM TO STRUCTURED DATA ===');
    console.log('Raw data keys:', Object.keys(rawData));
    console.log('Text object keys:', Object.keys(rawData.text));
    console.log('Full text length:', allText.length);
    console.log('Text preview (first 1000 chars):', allText.substring(0, 1000));
    console.log('Text preview (chars 1000-2000):', allText.substring(1000, 2000));
    
    // Extract date from text - try multiple formats
    let extractedDate = new Date().toISOString().split('T')[0];
    
    // Try DD-MM-YYYY or DD.MM.YYYY format
    const dateMatch1 = allText.match(/(\d{2})[-\/\.](\d{2})[-\/\.](\d{4})/);
    if (dateMatch1) {
      extractedDate = `${dateMatch1[3]}-${dateMatch1[2]}-${dateMatch1[1]}`;
    }
    
    // Try Admission/Discharge date format
    const admissionMatch = allText.match(/Admission:\s*(\d{2})-(\d{2})-(\d{4})/i);
    if (admissionMatch) {
      extractedDate = `${admissionMatch[3]}-${admissionMatch[2]}-${admissionMatch[1]}`;
    }
    
    console.log('Extracted date:', extractedDate);
    
    // Parse lab investigations from text
    const labTests = [
      { name: 'Creatinine (Serum)', pattern: /Creatinine \(Serum\)[\s\S]*?Result(\d+\.\d+)Flag([LHN]?)Units(\w+\/\w+)Reference Range([\d\.-]+)/i, unit: 'mg/dL', range: '0.59 - 1.04' },
      { name: 'CRP (C-Reactive Protein)', pattern: /CRP \(C-Reactive Protein\)(\d+\.\d+)([HLN]?)mg\/L< ([\d\.]+)/i, unit: 'mg/L', range: '< 6.0' },
      { name: 'Ferritin', pattern: /Ferritin(\d+\.\d+)ng\/ml([\d\s-]+)/i, unit: 'ng/ml', range: '10 - 291' },
      { name: 'Hemoglobin', pattern: /Hemoglobin(\d+\.\d+)[\s\S]*?g\/dl([\d\.-]+)/i, unit: 'g/dl', range: '12.0 - 15.5' },
      { name: 'RBC Count', pattern: /RBC Count(\d+\.\d+)[\s\S]*?10\^6\/pL([\d\.-]+)/i, unit: '10^6/pL', range: '3.9 - 5.0' },
      { name: 'Hematocrit', pattern: /Hematocrit(\d+\.\d+)[\s\S]*?%([\d\.-]+)/i, unit: '%', range: '35.0 - 45.0' },
      { name: 'MCV', pattern: /MCV(\d+\.\d+)[\s\S]*?fL([\d\.-]+)/i, unit: 'fL', range: '82.0 - 98.0' },
      { name: 'MCH', pattern: /MCH(\d+\.\d+)pg([\d\.-]+)/i, unit: 'pg', range: '27.0 - 32.0' },
      { name: 'MCHC', pattern: /MCHC(\d+\.\d+)[\s\S]*?g\/dL([\d\.-]+)/i, unit: 'g/dL', range: '32.0 - 37.0' },
      { name: 'RDW', pattern: /RDW(\d+\.\d+)[\s\S]*?%([\d\.-]+)/i, unit: '%', range: '11.9 - 15.5' },
      { name: 'Platelet Count', pattern: /Platelet Count(\d+)[\s\S]*?10\^3\/pL([\d\s-]+)/i, unit: '10^3/pL', range: '150 - 450' },
      { name: 'MPV', pattern: /MPV(\d+\.\d+)[\s\S]*?fL/i, unit: 'fL', range: '7.6 - 10.8' },
      { name: 'WBC Count', pattern: /WBC Count(\d+\.\d+)[\s\S]*?10\^3\/L([\d\.-]+)/i, unit: '10^3/L', range: '4.0 - 11.0' },
      { name: 'Neutrophils', pattern: /Neutrophils(\d+)[\s\S]*?%([\d-]+)/i, unit: '%', range: '40 - 75' },
      { name: 'Lymphocytes', pattern: /Lymphocytes(\d+)[\s\S]*?%([\d-]+)/i, unit: '%', range: '30 - 60' },
      { name: 'Eosinophils', pattern: /Eosinophils(\d+)[\s\S]*?%([\d-]+)/i, unit: '%', range: '0 - 6' },
      { name: 'Monocytes', pattern: /Monocytes(\d+)[\s\S]*?%([\d-]+)/i, unit: '%', range: '1 - 6' },
      { name: 'Basophils', pattern: /Basophils(\d+)[\s\S]*?%([\d-]+)/i, unit: '%', range: '0 - 1' },
      { name: 'D-Dimer', pattern: /D-Dimer(\d+)ResultFlag([HLN]?)[\s\S]*?ng\/ml[\s\S]*?< (\d+)/i, unit: 'ng/ml', range: '< 255' },
      { name: 'ESR (Erythrocyte Sedimentation Rate)', pattern: /ESR \(Erythrocyte SedimentationRate\)Result(\d+)Flag([HLN]?)Units/i, unit: 'mm/hour', range: '< 20' },
      { name: 'ALT (Alanine Aminotransferase)', pattern: /ALT \(Alanine Aminotransferase\)(\d+)([HLN]?)U\/L< or = (\d+)/i, unit: 'U/L', range: '≤ 32' },
      { name: 'AST (Aspartate Aminotransferase)', pattern: /AST \(AspartateAminotransferase\)(\d+)([HLN]?)U\/L< or = (\d+)/i, unit: 'U/L', range: '≤ 33' },
      { name: 'ALP (Alkaline Phosphatase)', pattern: /ALP \(Alkaline Phosphatase\)(\d+)([HLN]?)U\/L([\d-]+)/i, unit: 'U/L', range: '35 - 104' },
      { name: 'GGT (Gamma Glutamyl Transferase)', pattern: /GGT \(Gamma Glutamyl[\s]*Transferase\)(\d+)([HLN]?)U\/L([\d-]+)/i, unit: 'U/L', range: '6 - 42' },
      { name: 'Total Bilirubin', pattern: /Total Bilirubin(\d+\.\d+)([HLN]?)mg\/dl/i, unit: 'mg/dl', range: 'Up to 1.2' },
      { name: 'Direct Bilirubin', pattern: /Direct Bilirubin(\d+\.\d+)mg\/dl/i, unit: 'mg/dl', range: '≤ 0.30' },
      { name: 'Indirect Bilirubin', pattern: /Indirect Bilirubin(\d+\.\d+)mg\/dL/i, unit: 'mg/dL', range: '≤ 0.90' },
      { name: 'Total Protein', pattern: /Total Protein(\d+\.\d+)[\s\S]*?g\/dL([\d\.-]+)/i, unit: 'g/dL', range: '6.5 - 8.7' },
      { name: 'Albumin', pattern: /Albumin(\d+\.\d+)[\s\S]*?g\/dL([\d\.-]+)/i, unit: 'g/dL', range: '3.5 - 5.2' },
      { name: 'Globulin', pattern: /Globulin(\d+\.\d+)[\s\S]*?g\/dL([\d\.-]+)/i, unit: 'g/dL', range: '2.0 - 3.5' },
      { name: 'A/G Ratio', pattern: /A\/G Ratio(\d+\.\d+)([\d\.-]+)/i, unit: '', range: '0.8 - 2.0' }
    ];
    
    // Check if this is a hospital billing document
    const isBillingDocument = allText.match(/IPD PATIENT BILL|BILL|Invoice|Receipt|Payment/i) &&
                              allText.match(/Investigation/i) &&
                              !allText.match(/Result\s*\t\s*Unit\s*\t\s*Range/i);

    console.log('=== DOCUMENT TYPE DETECTION ===');
    console.log('Contains IPD PATIENT BILL/BILL/Invoice/Receipt/Payment:', !!allText.match(/IPD PATIENT BILL|BILL|Invoice|Receipt|Payment/i));
    console.log('Contains Investigation:', !!allText.match(/Investigation/i));
    console.log('Contains Result\\tUnit\\tRange:', !!allText.match(/Result\s*\t\s*Unit\s*\t\s*Range/i));
    console.log('Is billing document:', isBillingDocument);

    if (isBillingDocument) {
      console.log('=== DETECTED BILLING DOCUMENT FORMAT ===');
      console.log('This appears to be a hospital bill, not a lab report with results');
      console.log('Processing ALL pages of the billing document...');
      
      // Extract ALL investigation sections from billing document (across all pages)
      // Don't stop at "Page" - continue through all pages
      const investigationSections = [];
      
      // Method 1: Extract main Investigation section (may span multiple pages)
      const mainInvestigationMatch = allText.match(/Investigation([\s\S]*?)(?:IPD Registration|Pharmacy|Room Charges|Radiologist|Total|Grand Total|Net Amount|$)/i);
      if (mainInvestigationMatch) {
        investigationSections.push(mainInvestigationMatch[1]);
      }
      
      // Method 2: Also look for continuation patterns across pages
      // Some PDFs split sections across pages with "Page X" markers
      const pagePattern = /Page \d+[\s\S]*?Investigation([\s\S]*?)(?=Page \d+|$)/gi;
      let pageMatch;
      while ((pageMatch = pagePattern.exec(allText)) !== null) {
        if (pageMatch[1] && pageMatch[1].trim().length > 50) {
          investigationSections.push(pageMatch[1]);
        }
      }
      
      console.log(`Found ${investigationSections.length} investigation section(s) to process`);
      
      if (investigationSections.length > 0) {
        // Combine all sections
        const combinedSectionText = investigationSections.join('\n');
        console.log('Combined investigation text length:', combinedSectionText.length);
        console.log('Investigation text preview:', combinedSectionText.substring(0, 500));
        
        // Parse billing lines dynamically - extract ALL tests, not just predefined ones
        // Billing format: DATE TEST_NAME QUANTITY RATE AMOUNT
        // Example: 03.05.24 CBC 1 500 5000
        const billingLinePattern = /(\d{2}\.\d{2}\.\d{2})\s+([A-Za-z][A-Za-z0-9\s\/\(\)\-\.]+?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g;
        
        let lineMatch;
        const extractedTests = new Set(); // Track unique tests
        
        while ((lineMatch = billingLinePattern.exec(combinedSectionText)) !== null) {
          const dateStr = lineMatch[1];
          const testName = lineMatch[2].trim();
          const quantity = lineMatch[3];
          const rate = lineMatch[4];
          const amount = lineMatch[5];
          
          // Skip if test name is too short or looks like a header/footer
          if (testName.length < 2 || 
              testName.match(/^(Page|Total|Amount|Rate|Qty|Date|Sr|No)/i) ||
              testName.match(/^\d+$/)) {
            continue;
          }
          
          // Parse date
          const dateParts = dateStr.split('.');
          const year = parseInt(dateParts[2]) > 50 ? `19${dateParts[2]}` : `20${dateParts[2]}`;
          const testDate = `${year}-${dateParts[1]}-${dateParts[0]}`;
          
          // Create unique key to avoid duplicates
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
        
        // Fallback: If regex parsing didn't work well, try line-by-line parsing
        if (investigations.length < 5) {
          console.log('Regex parsing found few results, trying line-by-line parsing...');
          
          const lines = combinedSectionText.split('\n');
          const datePattern = /(\d{2}\.\d{2}\.\d{2})/;
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip empty lines, headers, and very short lines
            if (trimmedLine.length < 10 || 
                trimmedLine.match(/^(Investigation|Date|Sr|No|Page|Total|Amount)/i)) {
              continue;
            }
            
            // Check if line starts with a date
            const dateMatch = trimmedLine.match(/^(\d{2}\.\d{2}\.\d{2})\s+(.+)/);
            if (dateMatch) {
              const dateStr = dateMatch[1];
              const restOfLine = dateMatch[2];
              
              // Extract test name (everything before the numbers at the end)
              const testNameMatch = restOfLine.match(/^([A-Za-z][A-Za-z0-9\s\/\(\)\-\.]+?)(?:\s+\d+\s+\d+|\s+\d+\.\d+)/);
              if (testNameMatch) {
                const testName = testNameMatch[1].trim();
                
                // Parse date
                const dateParts = dateStr.split('.');
                const year = parseInt(dateParts[2]) > 50 ? `19${dateParts[2]}` : `20${dateParts[2]}`;
                const testDate = `${year}-${dateParts[1]}-${dateParts[0]}`;
                
                // Create unique key
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
        
        console.log(`Extracted ${investigations.length} investigations from billing document (across all pages)`);
        
        // Also extract imaging tests from the same Investigation section
        // Imaging tests contain keywords like X-RAY, USG, CT, MRI, ECHO, etc.
        console.log('=== EXTRACTING IMAGING FROM INVESTIGATION SECTION ===');
        const imagingKeywords = [
          'X-RAY', 'XRAY', 'X RAY', 'X RAY', 
          'CT SCAN', 'CT-SCAN', 'CT ', 
          'MRI', 'MRI SCAN',
          'ULTRASOUND', 'USG', 'SONOGRAPHY', 
          'MAMMOGRAPHY', 'MAMMO', 
          'ECHO', 'ECHOCARDIOGRAPHY',
          'DOPPLER', 
          'PET SCAN', 'PET-SCAN', 
          'BONE SCAN',
          'RADIOGRAPHY', 'RADIOGRAPH',
          'SCAN'
        ];
        
        // Go through all extracted investigations and identify imaging tests
        console.log(`Checking ${investigations.length} investigations for imaging tests...`);
        investigations.forEach((inv, index) => {
          const upperTestName = inv.investigation_name.toUpperCase();
          console.log(`[${index + 1}] Checking: "${inv.investigation_name}" (uppercase: "${upperTestName}")`);
          
          const isImagingTest = imagingKeywords.some(keyword => {
            const matches = upperTestName.includes(keyword);
            if (matches) {
              console.log(`  ✓ Matched keyword: "${keyword}"`);
            }
            return matches;
          });
          
          console.log(`  → Is imaging test? ${isImagingTest}`);
          
          if (isImagingTest) {
            // Determine body part and scan type from test name
            let bodyPart = 'Not specified';
            let scanType = 'IMAGING';
            
            // Determine scan type (check for various formats)
            if (upperTestName.includes('X-RAY') || upperTestName.includes('XRAY') || upperTestName.includes('X RAY') || 
                upperTestName.includes('RADIOGRAPHY') || upperTestName.includes('RADIOGRAPH')) {
              scanType = 'X-RAY';
            } else if (upperTestName.includes('USG') || upperTestName.includes('ULTRASOUND') || upperTestName.includes('SONOGRAPHY')) {
              scanType = 'ULTRASOUND';
            } else if (upperTestName.includes('CT SCAN') || upperTestName.includes('CT-SCAN') || upperTestName.includes('CT ')) {
              scanType = 'CT SCAN';
            } else if (upperTestName.includes('MRI')) {
              scanType = 'MRI';
            } else if (upperTestName.includes('ECHO')) {
              scanType = 'ECHOCARDIOGRAPHY';
            } else if (upperTestName.includes('DOPPLER')) {
              scanType = 'DOPPLER';
            } else if (upperTestName.includes('MAMMOGRAPHY') || upperTestName.includes('MAMMO')) {
              scanType = 'MAMMOGRAPHY';
            } else if (upperTestName.includes('PET')) {
              scanType = 'PET SCAN';
            } else if (upperTestName.includes('BONE SCAN')) {
              scanType = 'BONE SCAN';
            } else if (upperTestName.includes('SCAN')) {
              scanType = 'SCAN';
            }
            
            // Determine body part (check most specific first)
            if (upperTestName.includes('WHOLE ABDOMEN') || upperTestName.includes('WHOLEABDOMEN')) {
              bodyPart = 'Whole Abdomen';
            } else if (upperTestName.includes('WHOLE BODY') || upperTestName.includes('WHOLEBODY')) {
              bodyPart = 'Whole Body';
            } else if (upperTestName.includes('CHEST')) {
              bodyPart = 'Chest';
            } else if (upperTestName.includes('ABDOMEN')) {
              bodyPart = 'Abdomen';
            } else if (upperTestName.includes('PELVIS')) {
              bodyPart = 'Pelvis';
            } else if (upperTestName.includes('HEAD') || upperTestName.includes('BRAIN') || upperTestName.includes('SKULL')) {
              bodyPart = 'Head/Brain';
            } else if (upperTestName.includes('SPINE') || upperTestName.includes('CERVICAL') || upperTestName.includes('LUMBAR') || upperTestName.includes('THORACIC')) {
              bodyPart = 'Spine';
            } else if (upperTestName.includes('HEART') || upperTestName.includes('CARDIAC')) {
              bodyPart = 'Heart';
            } else if (upperTestName.includes('KIDNEY') || upperTestName.includes('RENAL')) {
              bodyPart = 'Kidney';
            } else if (upperTestName.includes('LIVER') || upperTestName.includes('HEPATIC')) {
              bodyPart = 'Liver';
            } else if (upperTestName.includes('NECK')) {
              bodyPart = 'Neck';
            } else if (upperTestName.includes('BREAST')) {
              bodyPart = 'Breast';
            } else if (upperTestName.includes('KNEE') || upperTestName.includes('ANKLE') || upperTestName.includes('ELBOW') || upperTestName.includes('WRIST') || upperTestName.includes('SHOULDER') || upperTestName.includes('HIP')) {
              bodyPart = 'Extremity/Joint';
            } else if (upperTestName.includes('HAND') || upperTestName.includes('FOOT') || upperTestName.includes('ARM') || upperTestName.includes('LEG')) {
              bodyPart = 'Extremity';
            }
            
            console.log(`✓ Imaging test identified: ${inv.investigation_name} → ${scanType} of ${bodyPart}`);
            
            imagingReports.push({
              body_part: bodyPart,
              scan_type: scanType,
              findings: `Pending/Not Available - ${inv.investigation_name} ordered`,
              impression: inv.note || 'Results not included in billing document',
              result_timestamp: inv.result_timestamp
            });
          }
        });
        
        console.log(`Extracted ${imagingReports.length} imaging reports from Investigation section`);
      }
      
      // Extract patient information for clinical notes
      const patientInfo = [];
      const nameMatch = allText.match(/Name:\s*([^\n]+)/i);
      const ageMatch = allText.match(/Age[\/\s]*Sex:\s*([^\n]+)/i);
      const admissionMatch2 = allText.match(/Admission:\s*([^\n]+)/i);
      const dischargeMatch = allText.match(/Discharge:\s*([^\n]+)/i);
      const consultantMatch = allText.match(/Consultant\s*:\s*([^\n]+)/i);
      const hospitalMatch = allText.match(/([A-Z\s]+HOSPITAL|[A-Z\s]+CLINIC|[A-Z\s]+MEDICAL)/i);
      const billNoMatch = allText.match(/Bill No[.:]?\s*([^\n]+)/i);
      const totalAmountMatch = allText.match(/(?:Net Amount|Grand Total|Total Amount)[:\s]*(?:Rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)/i);
      
      if (hospitalMatch) patientInfo.push(`Hospital: ${hospitalMatch[1].trim()}`);
      if (billNoMatch) patientInfo.push(`Bill No: ${billNoMatch[1].trim()}`);
      if (nameMatch) patientInfo.push(`Patient: ${nameMatch[1].trim()}`);
      if (ageMatch) patientInfo.push(`Age/Sex: ${ageMatch[1].trim()}`);
      if (admissionMatch2) patientInfo.push(`Admission: ${admissionMatch2[1].trim()}`);
      if (dischargeMatch) patientInfo.push(`Discharge: ${dischargeMatch[1].trim()}`);
      if (consultantMatch) patientInfo.push(`Consultant: ${consultantMatch[1].trim()}`);
      if (totalAmountMatch) patientInfo.push(`Total Amount: ₹${totalAmountMatch[1].trim()}`);
      
      // Add summary of extracted items
      const summaryLines = [];
      if (investigations.length > 0) {
        summaryLines.push(`\n📋 Lab Investigations Ordered: ${investigations.length} tests`);
        summaryLines.push(`Tests: ${investigations.map(inv => inv.investigation_name).join(', ')}`);
      }
      if (imagingReports.length > 0) {
        summaryLines.push(`\n🔬 Imaging/Radiology Ordered: ${imagingReports.length} scans`);
        summaryLines.push(`Scans: ${imagingReports.map(img => `${img.scan_type} (${img.body_part})`).join(', ')}`);
      }
      
      clinicalNotes = `Hospital Billing Document\n\n${patientInfo.join('\n')}${summaryLines.join('\n')}\n\n⚠️ IMPORTANT: This is a billing document showing tests that were ORDERED and BILLED.\nActual test RESULTS are not included in this document.\n\nTo view test results, please upload the corresponding lab report PDF.`;
    }
    
    // Parse tab-separated data if present (for actual lab reports)
    const tabDataMatch = allText.match(/Date\s*\t\s*Investigation\s*\t\s*Result[\s\S]*/) || 
                         allText.match(/Date\s+Investigation\s+Result\s+Unit\s+Range\s+Status[\s\S]*/) ||
                         allText.match(/\d{2}\/\d{2}\/\d{4}\s+[A-Za-z]/); // Also match if we see date followed by text
    
    if (tabDataMatch && !isBillingDocument) {
      console.log('=== PARSING TAB-SEPARATED LAB REPORT DATA ===');
      const lines = tabDataMatch[0].split('\n').filter(line => line.trim() && !line.match(/^Date\s*\t/i) && !line.match(/^Date\s+Investigation/i));
      console.log(`Found ${lines.length} lines to parse`);
      
      // More specific unwanted terms - only skip obvious non-test data
      const unwantedPatterns = [
        /^patient\s*:/i,
        /^name\s*:/i,
        /^age\s*:/i,
        /^gender\s*:/i,
        /^address\s*:/i,
        /^phone\s*:/i,
        /^doctor\s*:/i,
        /^hospital\s*:/i,
        /^date\s*:/i,
        /^page\s+\d+/i,
        /^printed\s+on/i,
        /^collected\s+on/i
      ];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines or lines that match unwanted patterns
        if (!line || unwantedPatterns.some(pattern => pattern.test(line))) {
          continue;
        }
        
        // Split by tab or multiple spaces
        const parts = line.split(/\t+|\s{2,}/).map(part => part.trim()).filter(part => part);
        console.log(`Line ${i + 1} parts (${parts.length}):`, parts);
        
        // Need at least: Date, Investigation Name, Result
        if (parts.length >= 3) {
          const dateStr = parts[0];
          const investigationName = parts[1];
          const result = parts[2];
          const unit = parts[3] || '';
          const referenceRange = parts[4] || '';
          const flag = parts[5] || '';
          
          // Validate date format (DD/MM/YYYY or similar)
          if (!dateStr.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/)) {
            console.log(`Skipping - invalid date format: ${dateStr}`);
            continue;
          }
          
          // Skip if investigation name is too short or looks like metadata
          if (investigationName.length < 2 || investigationName.match(/^(Date|Sr|No|Page|Total)$/i)) {
            console.log(`Skipping - invalid investigation name: ${investigationName}`);
            continue;
          }
          
          // Skip if result is empty or looks like a header
          if (!result || result.match(/^(Result|Value|Unit|Range|Status)$/i)) {
            console.log(`Skipping - invalid result: ${result}`);
            continue;
          }
          
          // Parse date (DD/MM/YYYY format)
          let formattedDate = extractedDate;
          if (dateStr.includes('/')) {
            const dateParts = dateStr.split('/');
            if (dateParts.length === 3) {
              // Handle both DD/MM/YYYY and MM/DD/YYYY
              const day = dateParts[0].padStart(2, '0');
              const month = dateParts[1].padStart(2, '0');
              const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
              formattedDate = `${year}-${month}-${day}`;
            }
          } else if (dateStr.includes('-')) {
            const dateParts = dateStr.split('-');
            if (dateParts.length === 3) {
              const day = dateParts[0].padStart(2, '0');
              const month = dateParts[1].padStart(2, '0');
              const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
              formattedDate = `${year}-${month}-${day}`;
            }
          }
          
          // Determine flag if not provided
          let finalFlag = flag;
          if (!finalFlag || finalFlag === '') {
            // Check if result contains flag indicators
            if (result.toUpperCase().includes('HIGH') || flag.toUpperCase() === 'HIGH') {
              finalFlag = 'HIGH';
            } else if (result.toUpperCase().includes('LOW') || flag.toUpperCase() === 'LOW') {
              finalFlag = 'LOW';
            } else if (result.toUpperCase().includes('POSITIVE')) {
              finalFlag = 'ABNORMAL';
            } else if (result.toUpperCase().includes('NEGATIVE')) {
              finalFlag = 'NORMAL';
            } else {
              finalFlag = 'NORMAL';
            }
          }
          
          const investigation = {
            result_timestamp: formattedDate,
            investigation_name: investigationName,
            result: result,
            unit: unit,
            reference_range: referenceRange,
            flag: finalFlag
          };
          
          console.log('✓ Valid investigation added:', investigation);
          investigations.push(investigation);
        }
      }
      
      console.log(`Total valid investigations parsed from tab data: ${investigations.length}`);
    }
    
    // Fallback to regex parsing if no tab data found
    if (investigations.length === 0) {
      labTests.forEach(test => {
        const match = allText.match(test.pattern);
        if (match && match[1] && /^\d+(\.\d+)?$/.test(match[1])) { // Only accept numeric results
          let flag = 'NORMAL';
          if (match[2]) {
            flag = match[2] === 'H' ? 'HIGH' : match[2] === 'L' ? 'LOW' : 'NORMAL';
          }
          
          investigations.push({
            result_timestamp: extractedDate,
            investigation_name: test.name,
            result: match[1],
            unit: test.unit,
            reference_range: test.range,
            flag: flag
          });
        }
      });
    }
    
    // Check for imaging keywords and create imaging reports
    const imagingKeywords = ['X-RAY', 'XRAY', 'CT SCAN', 'MRI', 'ULTRASOUND', 'USG', 'MAMMOGRAPHY', 'ECHO', 'DOPPLER', 'NUCLEAR SCAN', 'PET SCAN', 'BONE SCAN', 'ANGIOGRAPHY', 'RADIOGRAPH', 'SCAN', 'IMAGING'];
    const upperText = allText.toUpperCase();
    const hasImaging = imagingKeywords.some(keyword => upperText.includes(keyword));

    console.log('=== IMAGING DETECTION ===');
    console.log('Imaging keywords found:', imagingKeywords.filter(keyword => upperText.includes(keyword)));
    console.log('Has imaging content:', hasImaging);

    if (hasImaging) {
      console.log('=== EXTRACTING IMAGING REPORTS ===');
      
      // For billing documents, extract from Radiologist section (across all pages)
      if (isBillingDocument) {
        console.log('Extracting imaging reports from billing document (all pages)...');
        
        // Extract ALL Radiologist sections (may span multiple pages)
        const radiologistSections = [];
        
        // Method 1: Extract main Radiologist section
        const mainRadiologistMatch = allText.match(/Radiologist([\s\S]*?)(?:Room Charges|Pharmacy|IPD Registration|Total|Grand Total|Net Amount|$)/i);
        if (mainRadiologistMatch) {
          radiologistSections.push(mainRadiologistMatch[1]);
        }
        
        // Method 2: Look for continuation patterns across pages
        const pageRadiologistPattern = /Page \d+[\s\S]*?Radiologist([\s\S]*?)(?=Page \d+|$)/gi;
        let pageRadMatch;
        while ((pageRadMatch = pageRadiologistPattern.exec(allText)) !== null) {
          if (pageRadMatch[1] && pageRadMatch[1].trim().length > 30) {
            radiologistSections.push(pageRadMatch[1]);
          }
        }
        
        if (radiologistSections.length > 0) {
          console.log(`Found ${radiologistSections.length} radiologist section(s) to process`);
          const combinedRadiologistText = radiologistSections.join('\n');
          
          // Parse imaging lines dynamically - extract ALL imaging tests
          // Billing format: DATE IMAGING_TEST_NAME QUANTITY RATE AMOUNT
          const imagingLinePattern = /(\d{2}\.\d{2}\.\d{2})\s+([A-Za-z][A-Za-z0-9\s\/\(\)\-\.]+?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g;
          
          let imagingMatch;
          const extractedImaging = new Set(); // Track unique imaging tests
          
          while ((imagingMatch = imagingLinePattern.exec(combinedRadiologistText)) !== null) {
            const dateStr = imagingMatch[1];
            const testName = imagingMatch[2].trim();
            const quantity = imagingMatch[3];
            const rate = imagingMatch[4];
            const amount = imagingMatch[5];
            
            // Skip if test name is too short or looks like a header
            if (testName.length < 3 || 
                testName.match(/^(Page|Total|Amount|Rate|Qty|Date|Sr|No)/i) ||
                testName.match(/^\d+$/)) {
              continue;
            }
            
            // Parse date
            const dateParts = dateStr.split('.');
            const year = parseInt(dateParts[2]) > 50 ? `19${dateParts[2]}` : `20${dateParts[2]}`;
            const testDate = `${year}-${dateParts[1]}-${dateParts[0]}`;
            
            // Determine body part and scan type from test name
            let bodyPart = 'Not specified';
            let scanType = 'IMAGING';
            
            const upperTestName = testName.toUpperCase();
            
            // Determine scan type
            if (upperTestName.includes('X-RAY') || upperTestName.includes('XRAY')) {
              scanType = 'X-RAY';
            } else if (upperTestName.includes('USG') || upperTestName.includes('ULTRASOUND') || upperTestName.includes('SONOGRAPHY')) {
              scanType = 'ULTRASOUND';
            } else if (upperTestName.includes('CT SCAN') || upperTestName.includes('CT-SCAN')) {
              scanType = 'CT SCAN';
            } else if (upperTestName.includes('MRI')) {
              scanType = 'MRI';
            } else if (upperTestName.includes('ECHO')) {
              scanType = 'ECHOCARDIOGRAPHY';
            } else if (upperTestName.includes('DOPPLER')) {
              scanType = 'DOPPLER';
            } else if (upperTestName.includes('MAMMOGRAPHY') || upperTestName.includes('MAMMO')) {
              scanType = 'MAMMOGRAPHY';
            } else if (upperTestName.includes('PET')) {
              scanType = 'PET SCAN';
            }
            
            // Determine body part
            if (upperTestName.includes('CHEST')) {
              bodyPart = 'Chest';
            } else if (upperTestName.includes('ABDOMEN')) {
              bodyPart = 'Abdomen';
            } else if (upperTestName.includes('PELVIS')) {
              bodyPart = 'Pelvis';
            } else if (upperTestName.includes('HEAD') || upperTestName.includes('BRAIN')) {
              bodyPart = 'Head/Brain';
            } else if (upperTestName.includes('SPINE')) {
              bodyPart = 'Spine';
            } else if (upperTestName.includes('HEART')) {
              bodyPart = 'Heart';
            } else if (upperTestName.includes('KIDNEY')) {
              bodyPart = 'Kidney';
            } else if (upperTestName.includes('LIVER')) {
              bodyPart = 'Liver';
            } else if (upperTestName.includes('WHOLE BODY')) {
              bodyPart = 'Whole Body';
            }
            
            // Create unique key
            const imagingKey = `${testName.toLowerCase()}_${testDate}`;
            
            if (!extractedImaging.has(imagingKey)) {
              extractedImaging.add(imagingKey);
              
              console.log(`Found imaging test in billing: ${testName} (${testDate}) - ${scanType} of ${bodyPart}`);
              
              imagingReports.push({
                body_part: bodyPart,
                scan_type: scanType,
                findings: `Pending/Not Available - ${testName} ordered`,
                impression: `Results not included in billing document. Qty: ${quantity}, Rate: ₹${rate}, Amount: ₹${amount}`,
                result_timestamp: testDate
              });
            }
          }
          
          // Fallback: If regex parsing didn't work well, try line-by-line parsing
          if (imagingReports.length === 0) {
            console.log('Regex parsing found no imaging, trying line-by-line parsing...');
            
            const lines = combinedRadiologistText.split('\n');
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              
              // Skip empty lines, headers, and very short lines
              if (trimmedLine.length < 10 || 
                  trimmedLine.match(/^(Radiologist|Date|Sr|No|Page|Total|Amount)/i)) {
                continue;
              }
              
              // Check if line starts with a date
              const dateMatch = trimmedLine.match(/^(\d{2}\.\d{2}\.\d{2})\s+(.+)/);
              if (dateMatch) {
                const dateStr = dateMatch[1];
                const restOfLine = dateMatch[2];
                
                // Extract test name (everything before the numbers at the end)
                const testNameMatch = restOfLine.match(/^([A-Za-z][A-Za-z0-9\s\/\(\)\-\.]+?)(?:\s+\d+\s+\d+|\s+\d+\.\d+)/);
                if (testNameMatch) {
                  const testName = testNameMatch[1].trim();
                  
                  // Parse date
                  const dateParts = dateStr.split('.');
                  const year = parseInt(dateParts[2]) > 50 ? `19${dateParts[2]}` : `20${dateParts[2]}`;
                  const testDate = `${year}-${dateParts[1]}-${dateParts[0]}`;
                  
                  // Determine body part and scan type
                  let bodyPart = 'Not specified';
                  let scanType = 'IMAGING';
                  
                  const upperTestName = testName.toUpperCase();
                  
                  if (upperTestName.includes('X-RAY') || upperTestName.includes('XRAY')) {
                    scanType = 'X-RAY';
                  } else if (upperTestName.includes('USG') || upperTestName.includes('ULTRASOUND')) {
                    scanType = 'ULTRASOUND';
                  } else if (upperTestName.includes('CT')) {
                    scanType = 'CT SCAN';
                  } else if (upperTestName.includes('MRI')) {
                    scanType = 'MRI';
                  } else if (upperTestName.includes('ECHO')) {
                    scanType = 'ECHOCARDIOGRAPHY';
                  }
                  
                  if (upperTestName.includes('CHEST')) {
                    bodyPart = 'Chest';
                  } else if (upperTestName.includes('ABDOMEN')) {
                    bodyPart = 'Abdomen';
                  } else if (upperTestName.includes('PELVIS')) {
                    bodyPart = 'Pelvis';
                  }
                  
                  // Create unique key
                  const imagingKey = `${testName.toLowerCase()}_${testDate}`;
                  
                  if (!extractedImaging.has(imagingKey) && testName.length > 3) {
                    extractedImaging.add(imagingKey);
                    
                    console.log(`Found imaging (line parsing): ${testName} (${testDate})`);
                    
                    imagingReports.push({
                      body_part: bodyPart,
                      scan_type: scanType,
                      findings: `Pending/Not Available - ${testName} ordered`,
                      impression: 'Results not included in billing document',
                      result_timestamp: testDate
                    });
                  }
                }
              }
            }
          }
          
          console.log(`Extracted ${imagingReports.length} imaging reports from billing document (across all pages)`);
        }
      } else {
        // For actual imaging reports, extract detailed information with proper section parsing
        console.log('=== EXTRACTING FROM ACTUAL RADIOLOGY REPORT ===');

        // Determine scan type from document content
        let scanType = 'Not specified';
        const upperText2 = allText.toUpperCase();

        if (upperText2.includes('X-RAY') || upperText2.includes('XRAY') || upperText2.includes('RADIOGRAPH')) {
          scanType = 'X-RAY';
        } else if (upperText2.includes('CT SCAN') || upperText2.includes('CT-SCAN') || upperText2.includes('COMPUTED TOMOGRAPHY')) {
          scanType = 'CT SCAN';
        } else if (upperText2.includes('MRI') || upperText2.includes('MAGNETIC RESONANCE')) {
          scanType = 'MRI';
        } else if (upperText2.includes('ULTRASOUND') || upperText2.includes('USG') || upperText2.includes('SONOGRAPHY')) {
          scanType = 'ULTRASOUND';
        } else if (upperText2.includes('ECHOCARDIOGRAPHY') || upperText2.includes('ECHO')) {
          scanType = 'ECHOCARDIOGRAPHY';
        } else if (upperText2.includes('DOPPLER')) {
          scanType = 'DOPPLER';
        } else if (upperText2.includes('MAMMOGRAPHY') || upperText2.includes('MAMMO')) {
          scanType = 'MAMMOGRAPHY';
        } else if (upperText2.includes('PET SCAN') || upperText2.includes('POSITRON EMISSION')) {
          scanType = 'PET SCAN';
        } else if (upperText2.includes('BONE SCAN') || upperText2.includes('NUCLEAR MEDICINE')) {
          scanType = 'BONE SCAN';
        }

        // Determine body part from document content
        let bodyPart = 'Not specified';
        const bodyPartPatterns = [
          { pattern: /(?:whole abdomen|whole abdominal)/i, part: 'Whole Abdomen' },
          { pattern: /(?:whole body|wholebody)/i, part: 'Whole Body' },
          { pattern: /chest/i, part: 'Chest' },
          { pattern: /abdomen/i, part: 'Abdomen' },
          { pattern: /pelvis/i, part: 'Pelvis' },
          { pattern: /(?:head|brain|skull|cerebral)/i, part: 'Head/Brain' },
          { pattern: /(?:spine|cervical|thoracic|lumbar)/i, part: 'Spine' },
          { pattern: /(?:heart|cardiac)/i, part: 'Heart' },
          { pattern: /(?:kidney|renal)/i, part: 'Kidney' },
          { pattern: /(?:liver|hepatic)/i, part: 'Liver' },
          { pattern: /neck/i, part: 'Neck' },
          { pattern: /breast/i, part: 'Breast' },
          { pattern: /(?:knee|ankle|elbow|wrist|shoulder|hip|joint)/i, part: 'Extremity/Joint' },
          { pattern: /(?:hand|foot|arm|leg|extremity)/i, part: 'Extremity' }
        ];

        for (const { pattern, part } of bodyPartPatterns) {
          if (pattern.test(allText)) {
            bodyPart = part;
            break;
          }
        }

        // Extract findings section
        let findings = '';
        const findingsPatterns = [
          /findings?[:\s-]*([\s\S]*?)(?:impression|conclusion|recommendation|dr\.|md\.|\*\*\*|$)/i,
          /observation[:\s-]*([\s\S]*?)(?:impression|conclusion|recommendation|dr\.|md\.|\*\*\*|$)/i,
          /description[:\s-]*([\s\S]*?)(?:impression|conclusion|recommendation|dr\.|md\.|\*\*\*|$)/i
        ];

        for (const pattern of findingsPatterns) {
          const match = allText.match(pattern);
          if (match && match[1] && match[1].trim().length > 20) {
            findings = match[1].trim();
            console.log('Found findings section, length:', findings.length);
            break;
          }
        }

        // If no structured findings found, take relevant content (excluding headers)
        if (!findings) {
          // Remove common headers and extract meaningful content
          const lines = allText.split('\n');
          const contentLines = lines.filter(line =>
            line.trim().length > 10 &&
            !line.match(/^(radiology|report|patient|name|age|sex|date|study|examination|clinical|history|indication|technique|comparison)/i)
          );
          findings = contentLines.slice(0, 10).join('\n').substring(0, 800);
        }

        // Extract impression section
        let impression = '';
        const impressionPatterns = [
          /impression[:\s-]*([\s\S]*?)(?:recommendation|advice|dr\.|md\.|\*\*\*|$)/i,
          /conclusion[:\s-]*([\s\S]*?)(?:recommendation|advice|dr\.|md\.|\*\*\*|$)/i,
          /summary[:\s-]*([\s\S]*?)(?:recommendation|advice|dr\.|md\.|\*\*\*|$)/i
        ];

        for (const pattern of impressionPatterns) {
          const match = allText.match(pattern);
          if (match && match[1] && match[1].trim().length > 10) {
            impression = match[1].trim();
            console.log('Found impression section, length:', impression.length);
            break;
          }
        }

        // If no impression found, use a default or extract from end of findings
        if (!impression) {
          impression = findings.length > 100 ? findings.substring(0, 200) + '...' : findings;
        }

        // Clean up findings and impression
        findings = findings.replace(/\n{3,}/g, '\n\n').trim();
        impression = impression.replace(/\n{3,}/g, '\n\n').trim();

        console.log(`Extracted radiology report: ${scanType} of ${bodyPart}`);
        console.log(`Findings length: ${findings.length}, Impression length: ${impression.length}`);

        imagingReports.push({
          body_part: bodyPart,
          scan_type: scanType,
          findings: findings || 'Findings extracted from radiology report',
          impression: impression || 'Impression extracted from radiology report',
          result_timestamp: extractedDate
        });
      }

      console.log(`Extracted ${imagingReports.length} imaging reports`);
    }

    // Extract clinical notes (only if not already set by billing document parser)
    if (!clinicalNotes) {
      const interpretationMatches = allText.match(/Interpretation[:\s-]*([\s\S]*?)(?:Dr\.|M\.D|\*\*\*|$)/gi);
      if (interpretationMatches) {
        const notes = [];
        interpretationMatches.forEach(match => {
          const content = match.replace(/Interpretation[:\s-]*/i, '').trim();
          if (content && content.length > 10) {
            notes.push(content);
          }
        });
        clinicalNotes = notes.join('\n\n');
      }

      if (!clinicalNotes && allText.length > 100 && !isBillingDocument) {
        // Don't include the tab data in clinical notes if we already parsed it
        const cleanText = allText.replace(/Date\s*\t\s*Investigation[\s\S]*?(?=\n\n|$)/, '').trim();
        clinicalNotes = cleanText.length > 100 ? cleanText.substring(0, 300) + '...' : cleanText;
      }
    }
  }

  console.log('=== FINAL EXTRACTION RESULTS ===');
  console.log('Investigations extracted:', investigations.length);
  console.log('Imaging reports extracted:', imagingReports.length);
  console.log('Clinical notes length:', clinicalNotes.length);
  console.log('Clinical notes preview:', clinicalNotes.substring(0, 200));

  return {
    fileName: rawData.name,
    extraction: {
      investigations: investigations,
      imaging_radiology_reports: imagingReports,
      other_relevant_clinical_details: clinicalNotes
    },
    text: rawData.text || {}
  };
};

/**
 * Convert unstructured API response to structured format
 * @param {Object} rawResponse - Raw API response
 * @returns {Array} Structured data array
 */
const convertToStructuredData = (rawResponse) => {
  // Handle Angular API response format (structured data)
  if (rawResponse.status && rawResponse.data && rawResponse.data.extractedData) {
    return rawResponse.data.extractedData;
  }

  // Handle React text-based response format
  if (Array.isArray(rawResponse)) {
    return rawResponse.map(item => {
      // If item has text field, transform it to structured format
      if (item.text) {
        return transformToStructuredData(item);
      }
      // If already structured, return as is
      return item;
    });
  }

  return [];
};

/**
 * Upload medical record files and extract data using OP EMR API
 * @param {File[]} files - Array of files to upload
 * @param {Object} userInfo - User information
 * @param {Object} body - Additional data for the request
 * @returns {Promise} Promise with the response
 */
const uploadMedicalRecords = async (files, userInfo, body = {}) => {
  try {
    if (files.length === 0) {
      throw new Error('No files selected');
    }

    console.log('=== API SERVICE DEBUG ===');
    console.log('Attempting to call backend API...');
    console.log('User info:', userInfo);
    console.log('Files count:', files.length);
    console.log('File names:', files.map(f => f.name));

    const payload = {
      files: files,
      data: {
        patientId: userInfo.id,
        appointmentId: body.appointmentId || 0,
        id: body.id || 0
      }
    };

    // Step 2: Extract records
    console.log('Step 2: Extracting records...');
    const extractFormData = new FormData();
    files.forEach(file => {
      extractFormData.append('files', file);
    });

    const backendUrl = process.env.REACT_APP_API_URL || 'https://medical-records-fullapp-3.onrender.com';
    console.log('=== API SERVICE BACKEND URL DEBUG ===');
    console.log('process.env.REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('Final backendUrl:', backendUrl);
    console.log('Full endpoint URL:', `${backendUrl}/medical-record/extract-files`);

    const response = await fetch(`${backendUrl}/medical-record/extract-files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: extractFormData
    });

    console.log('Extract-record response status:', response.status);
    console.log('Extract-record response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Extract-record error:', errorText);
      throw new Error(`Extract record failed! status: ${response.status}`);
    }

    const rawData = await response.json();
    console.log('=== RAW BACKEND DATA ===');
    console.log('Full backend response:', JSON.stringify(rawData, null, 2));
    console.log('Backend response type:', typeof rawData);
    console.log('Backend response keys:', Object.keys(rawData));
    console.log('Backend response has success field:', rawData.hasOwnProperty('success'));
    console.log('Backend response success value:', rawData.success);
    console.log('Backend response message:', rawData.message);
    console.log('Backend response data:', rawData.data);

    // Process the backend response (the same logic you already had)
    let extractedData = [];
    let responseId = null;
    let responseMeta = null;

    if (rawData.status && rawData.data) {
      responseId = rawData.data.id;
      responseMeta = rawData.data.meta;

      const hasInvestigationData = rawData.data.investigation &&
                                   Array.isArray(rawData.data.investigation) &&
                                   rawData.data.investigation.length > 0;
      const hasImagingData = rawData.data.imagingAndRadiology &&
                            Array.isArray(rawData.data.imagingAndRadiology) &&
                            rawData.data.imagingAndRadiology.length > 0;
      const hasClinicalNotes = rawData.data.additionalNotes || rawData.data.remarks;

      if (hasInvestigationData || hasImagingData || hasClinicalNotes) {
        extractedData = [{
          fileName: responseMeta?.files?.[0]?.filename || files[0].name,
          blob_name: responseMeta?.files?.[0]?.blob_name || `medical-record/${Date.now()}_${files[0].name}`,
          extraction: {
            investigations: rawData.data.investigation || [],
            imaging_radiology_reports: rawData.data.imagingAndRadiology || [],
            other_relevant_clinical_details: rawData.data.additionalNotes || rawData.data.remarks || ''
          },
          text: {},
          recordId: responseId
        }];
      } else {
        // Backend stored file but didn't extract structured data -> extract text client-side and transform
        const pdfUrl = responseMeta?.files?.[0]?.url;

        if (pdfUrl) {
          try {
            const textByPage = await extractTextFromPdfUrl(pdfUrl);
            const rawDataForTransform = {
              name: responseMeta?.files?.[0]?.filename || files[0].name,
              text: textByPage
            };

            const transformed = transformToStructuredData(rawDataForTransform);

            extractedData = [{
              fileName: responseMeta?.files?.[0]?.filename || files[0].name,
              blob_name: responseMeta?.files?.[0]?.blob_name || `medical-record/${Date.now()}_${files[0].name}`,
              extraction: transformed.extraction,
              text: textByPage,
              recordId: responseId,
              fileUrl: pdfUrl
            }];
          } catch (pdfError) {
            console.error('Failed to extract text from PDF:', pdfError);
            extractedData = [{
              fileName: responseMeta?.files?.[0]?.filename || files[0].name,
              blob_name: responseMeta?.files?.[0]?.blob_name || `medical-record/${Date.now()}_${files[0].name}`,
              extraction: {
                investigations: [],
                imaging_radiology_reports: [],
                other_relevant_clinical_details: ''
              },
              text: {},
              recordId: responseId,
              fileUrl: pdfUrl,
              error: pdfError.message
            }];
          }
        } else {
          extractedData = [{
            fileName: responseMeta?.files?.[0]?.filename || files[0].name,
            blob_name: responseMeta?.files?.[0]?.blob_name || `medical-record/${Date.now()}_${files[0].name}`,
            extraction: {
              investigations: [],
              imaging_radiology_reports: [],
              other_relevant_clinical_details: ''
            },
            text: {},
            recordId: responseId,
            error: 'No PDF URL provided'
          }];
        }
      }
    } else if (Array.isArray(rawData)) {
      extractedData = rawData.map(item => {
        if (item.text && typeof item.text === 'object') {
          const hasBackendData = (item.investigations && item.investigations.length > 0) ||
                                 (item.imaging_radiology_reports && item.imaging_radiology_reports.length > 0) ||
                                 (item.other_relevant_clinical_details && item.other_relevant_clinical_details.length > 0);

          if (hasBackendData) {
            return {
              fileName: item.name || files[0].name,
              blob_name: `medical-record/${Date.now()}_${files[0].name}`,
              extraction: {
                investigations: item.investigations || [],
                imaging_radiology_reports: item.imaging_radiology_reports || [],
                other_relevant_clinical_details: item.other_relevant_clinical_details || ''
              },
              text: item.text
            };
          } else {
            const transformed = transformToStructuredData(item);
            return {
              fileName: transformed.fileName,
              blob_name: `medical-record/${Date.now()}_${files[0].name}`,
              extraction: transformed.extraction,
              text: transformed.text
            };
          }
        }
        return item;
      });
    } else if (rawData.extractedData) {
      extractedData = rawData.extractedData;
    } else {
      const hasBackendData = (rawData.investigations && rawData.investigations.length > 0) ||
                             (rawData.imaging_radiology_reports && rawData.imaging_radiology_reports.length > 0) ||
                             (rawData.other_relevant_clinical_details && rawData.other_relevant_clinical_details.length > 0);

      if (rawData.text && typeof rawData.text === 'object' && !hasBackendData) {
        const transformed = transformToStructuredData(rawData);
        extractedData = [{
          fileName: transformed.fileName,
          blob_name: rawData.blob_name || `medical-record/${Date.now()}_${files[0].name}`,
          extraction: transformed.extraction,
          text: transformed.text
        }];
      } else {
        extractedData = [{
          fileName: rawData.name || files[0].name,
          blob_name: rawData.blob_name || `medical-record/${Date.now()}_${files[0].name}`,
          extraction: {
            investigations: rawData.investigations || [],
            imaging_radiology_reports: rawData.imaging_radiology_reports || [],
            other_relevant_clinical_details: rawData.other_relevant_clinical_details || ''
          },
          text: rawData.text || {}
        }];
      }
    }

    console.log('=== EXTRACTED DATA ===');
    console.log('Extracted data array length:', extractedData.length);
    if (extractedData.length > 0) {
      console.log('First item:', extractedData[0]);
      console.log('First item extraction:', extractedData[0].extraction);
      if (extractedData[0].extraction) {
        console.log('Investigations count:', extractedData[0].extraction.investigations?.length || 0);
        console.log('Imaging reports count:', extractedData[0].extraction.imaging_radiology_reports?.length || 0);
        console.log('Sample investigation:', extractedData[0].extraction.investigations?.[0]);
      }
    }

    return {
      id: rawData.id || Date.now(),
      blob_name: extractedData[0]?.blob_name || `medical-record/${Date.now()}_${files[0].name}`,
      extractedData: extractedData,
      meta: { files: [] }
    };

  } catch (error) {
    console.error('Error uploading files:', error);
    if (error.response?.status === 404) {
      throw new Error('Upload endpoint not found. Please check if the backend server is running.');
    }
    throw error;
  }
};

/**
 * Download a medical record file
 * @param {Object} payload - The payload with blob_name
 * @returns {Promise} Promise with the file data
 */
const downloadFile = async (payload) => {
  try {
    const response = await fetch('https://op-emr-api-895601048579.asia-south1.run.app/medical-record/download-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ blob_name: payload.blob_name })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.arrayBuffer();

  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

/**
 * Get user information from localStorage
 * @returns {Object} User information
 */
const getUserInfo = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    throw new Error('User not authenticated');
  }

  const user = JSON.parse(userStr);

  if (!user.id) {
    throw new Error('User ID not found');
  }

  if (!user.orgId) {
    user.orgId = user.id;
  }

  return user;
};

/**
 * Generate a blob name for a file
 * @param {File} file - The file object
 * @param {Object} userInfo - User information
 * @returns {string} The blob name
 */
const generateBlobName = (file, userInfo) => {
  const uuid = Date.now().toString(36) + Math.random().toString(36).substring(2);
  return `medical-record/${uuid}_${file.name}`;
};

/**
 * Preview a medical record file
 * @param {Object} payload - The payload with blob_name
 * @returns {Promise} Promise with the preview text
 */
const previewFile = async (payload) => {
  try {
    const response = await fetch('https://emr-core-dev-1047793541775.us-central1.run.app/preview-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-name': 'medical-record-preview'
      },
      body: JSON.stringify({ blob_name: payload.blob_name })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();

  } catch (error) {
    console.error('OP EMR API preview failed:', error);
    const fileName = payload.blob_name.split('/').pop() || '';
    return `${fileName}\n\nPreview not available`;
  }
};

/* -------------------------
   Final export — includes get/post wrappers
   so components like ChatHistory can call apiService.get('/chat-history')
   ------------------------- */
export default {
  uploadMedicalRecords,
  downloadFile,
  previewFile,
  getUserInfo,
  generateBlobName,
  // fetch wrappers compatible with existing usage
  get: apiGet,
  post: apiPost,
  delete: apiDelete
};

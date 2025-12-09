/**
 * Medical Data Parser Utility
 * Handles parsing and transformation of medical report data
 * between React (page-based) and Angular (structured) formats
 */

/**
 * Parse React-style medical data (page-based text structure)
 * @param {Object} data - Medical data with structure { name, text: { "Page 1": "...", "Page 2": "..." } }
 * @returns {Object} Structured medical data
 */
export const parseReactMedicalData = (data) => {
  if (!data || !data.text) {
    return createEmptyMedicalStructure();
  }

  // Combine all pages into single text for parsing
  const fullText = Object.values(data.text).join('\n\n');
  
  return {
    fileName: data.name || 'Untitled Report',
    patientDemographics: extractPatientDemographics(fullText),
    investigations: extractInvestigations(fullText),
    imagingReports: extractImagingReports(fullText),
    clinicalDetails: extractClinicalDetails(fullText),
    metadata: {
      pageCount: Object.keys(data.text).length,
      extractionDate: new Date().toISOString()
    }
  };
};

/**
 * Convert structured data to Angular format
 * @param {Object} data - Structured medical data
 * @returns {Object} Angular-formatted data
 */
export const toAngularFormat = (data) => {
  return {
    patient_demographics: data.patientDemographics,
    investigations: data.investigations.map(inv => ({
      result_timestamp: inv.date || new Date().toISOString(),
      investigation_name: inv.name,
      result: inv.value,
      unit: inv.unit,
      reference_range: inv.range,
      flag: inv.status,
      methodology: inv.methodology
    })),
    imaging_radiology_reports: data.imagingReports.map(report => ({
      body_part: report.bodyPart,
      scan_type: report.scanType,
      findings: report.findings,
      impression: report.impression,
      result_timestamp: report.date || new Date().toISOString()
    })),
    other_relevant_clinical_details: data.clinicalDetails,
    extraction_timestamp: new Date().toISOString()
  };
};

/**
 * Extract patient demographics from text
 */
const extractPatientDemographics = (text) => {
  return {
    name: extractField(text, /Name[:\s]*([^\n]+)/i),
    dob: extractField(text, /DOB[:\s]*([^\n]+)/i),
    age: extractField(text, /Age[\/:\s]*(\d+\s*Years?)/i),
    gender: extractField(text, /Gender[:\s]*([MF])/i) || extractField(text, /\/([MF])/),
    refNo: extractField(text, /Ref\.?\s*No\.?[:\s]*([^\n]+)/i),
    sampleNo: extractField(text, /Sample\s*No\.?[:\s]*([^\n]+)/i),
    physician: extractField(text, /Ref\.?\s*Physician[:\s]*([^\n]+)/i),
    centre: extractField(text, /Centre[:\s]*([^\n]+)/i),
    collectedDate: extractField(text, /Collected[:\s]*([^\n]+)/i),
    reportedDate: extractField(text, /Reported[:\s]*([^\n]+)/i)
  };
};

/**
 * Extract investigation/lab results from text
 */
const extractInvestigations = (text) => {
  const investigations = [];
  const lines = text.split('\n');
  
  // Look for table-like structures
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Match patterns like: "Test Name    Result    Unit    Range    Status"
    const testMatch = line.match(/^([A-Za-z\s\(\)]+?)\s+([\d\.]+)\s*([A-Za-z\/\%]+)?\s+([\d\.\s\-<>]+)?\s*([HLN])?$/);
    
    if (testMatch) {
      investigations.push({
        name: testMatch[1].trim(),
        value: testMatch[2],
        unit: testMatch[3] || '',
        range: testMatch[4] || '',
        status: determineStatus(testMatch[5]),
        date: extractDateFromContext(text, i)
      });
    }
    
    // Alternative pattern: Look for specific test markers
    if (line.includes('Test / Parameters') || line.includes('Result') || line.includes('Reference Range')) {
      // This is likely a header row, continue to next lines for data
      continue;
    }
  }
  
  // Also try to extract from specific known test formats
  investigations.push(...extractSpecificTests(text));
  
  return investigations.filter((inv, index, self) => 
    index === self.findIndex(t => t.name === inv.name && t.value === inv.value)
  );
};

/**
 * Extract specific known test results
 */
const extractSpecificTests = (text) => {
  const tests = [];
  const testPatterns = [
    { name: 'Hemoglobin', pattern: /Hemoglobin\s+([\d\.]+)\s*([a-zA-Z\/]+)?/i },
    { name: 'Creatinine', pattern: /Creatinine.*?\s+([\d\.]+)\s*([a-zA-Z\/]+)?/i },
    { name: 'CRP', pattern: /CRP.*?\s+([\d\.]+)\s*([a-zA-Z\/]+)?/i },
    { name: 'Ferritin', pattern: /Ferritin\s+([\d\.]+)\s*([a-zA-Z\/]+)?/i },
    { name: 'ESR', pattern: /ESR.*?\s+([\d\.]+)\s*([a-zA-Z\/]+)?/i },
    { name: 'D-Dimer', pattern: /D-Dimer\s+([\d\.]+)\s*([a-zA-Z\/]+)?/i },
    { name: 'ALT', pattern: /ALT.*?\s+([\d\.]+)\s*([UL\/]+)?/i },
    { name: 'AST', pattern: /AST.*?\s+([\d\.]+)\s*([UL\/]+)?/i },
    { name: 'WBC Count', pattern: /WBC Count\s+([\d\.]+)\s*([a-zA-Z\/\^]+)?/i },
    { name: 'RBC Count', pattern: /RBC Count\s+([\d\.]+)\s*([a-zA-Z\/\^]+)?/i },
    { name: 'Platelet Count', pattern: /Platelet Count\s+([\d\.]+)\s*([a-zA-Z\/\^]+)?/i }
  ];
  
  for (const test of testPatterns) {
    const match = text.match(test.pattern);
    if (match) {
      // Find reference range near the test result
      const contextStart = Math.max(0, match.index - 200);
      const contextEnd = Math.min(text.length, match.index + 200);
      const context = text.substring(contextStart, contextEnd);
      
      const rangeMatch = context.match(/Reference Range[:\s]*([\d\.\s\-<>]+)/i) ||
                        context.match(/([\d\.]+\s*[-–]\s*[\d\.]+)/);
      
      const range = rangeMatch ? rangeMatch[1].trim() : '';
      
      tests.push({
        name: test.name,
        value: match[1],
        unit: match[2] || '',
        range: range,
        status: 'Normal',
        date: extractDateFromContext(text, match.index)
      });
    }
  }
  
  return tests;
};

/**
 * Extract imaging/radiology reports
 */
const extractImagingReports = (text) => {
  const reports = [];
  
  // Check if document contains imaging keywords
  const imagingKeywords = ['x-ray', 'ct scan', 'mri', 'ultrasound', 'radiology', 'imaging'];
  const hasImaging = imagingKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );
  
  if (hasImaging) {
    reports.push({
      bodyPart: extractField(text, /(?:body part|region)[:\s]*([^\n]+)/i) || 'Not specified',
      scanType: extractField(text, /(?:scan type|modality)[:\s]*([^\n]+)/i) || detectScanType(text),
      findings: extractSection(text, ['findings', 'observations']),
      impression: extractSection(text, ['impression', 'conclusion']),
      date: extractField(text, /Reported[:\s]*([^\n]+)/i) || new Date().toISOString()
    });
  }
  
  return reports;
};

/**
 * Extract clinical details and notes
 */
const extractClinicalDetails = (text) => {
  const sections = [];
  
  // Extract interpretation sections
  const interpretations = text.match(/Interpretation[:\s]*([^\*]+)/gi);
  if (interpretations) {
    sections.push(...interpretations.map(int => int.trim()));
  }
  
  // Extract note sections
  const notes = text.match(/Note[:\s]*([^\*\n]+)/gi);
  if (notes) {
    sections.push(...notes.map(note => note.trim()));
  }
  
  return sections.join('\n\n');
};

/**
 * Helper: Extract field value using regex
 */
const extractField = (text, regex) => {
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};

/**
 * Helper: Extract section content
 */
const extractSection = (text, keywords) => {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\\s]*([^\\*]+?)(?=\\n\\n|$)`, 'is');
    const match = text.match(regex);
    if (match) {
      return match[1].trim().substring(0, 500); // Limit length
    }
  }
  return '';
};

/**
 * Helper: Detect scan type from text
 */
const detectScanType = (text) => {
  const scanTypes = ['x-ray', 'ct', 'mri', 'ultrasound', 'mammography'];
  const lowerText = text.toLowerCase();
  
  for (const type of scanTypes) {
    if (lowerText.includes(type)) {
      return type.toUpperCase();
    }
  }
  
  return 'Not specified';
};

/**
 * Helper: Determine status from flag
 */
const determineStatus = (flag) => {
  if (!flag) return 'Normal';
  
  const flagMap = {
    'H': 'High',
    'L': 'Low',
    'N': 'Normal',
    '*': 'Abnormal'
  };
  
  return flagMap[flag] || 'Normal';
};

/**
 * Helper: Extract date from surrounding context
 */
const extractDateFromContext = (text, position) => {
  const contextStart = Math.max(0, position - 500);
  const contextEnd = Math.min(text.length, position + 100);
  const context = text.substring(contextStart, contextEnd);
  
  const dateMatch = context.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  return dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
};

/**
 * Create empty medical structure
 */
const createEmptyMedicalStructure = () => {
  return {
    fileName: 'Untitled',
    patientDemographics: {},
    investigations: [],
    imagingReports: [],
    clinicalDetails: '',
    metadata: {
      pageCount: 0,
      extractionDate: new Date().toISOString()
    }
  };
};

/**
 * Format data for display in UI
 */
export const formatForDisplay = (data) => {
  return {
    patient: {
      name: data.patientDemographics?.name || 'Unknown',
      age: data.patientDemographics?.age || 'N/A',
      gender: data.patientDemographics?.gender || 'N/A'
    },
    tests: data.investigations.map(inv => ({
      name: inv.name,
      result: `${inv.value} ${inv.unit}`,
      reference: inv.range,
      status: inv.status,
      flag: getStatusColor(inv.status)
    })),
    imaging: data.imagingReports.map(report => ({
      type: report.scanType,
      bodyPart: report.bodyPart,
      summary: report.impression || report.findings.substring(0, 100)
    })),
    notes: data.clinicalDetails
  };
};

/**
 * Get color code for status
 */
const getStatusColor = (status) => {
  const colorMap = {
    'Normal': 'success',
    'High': 'error',
    'Low': 'warning',
    'Abnormal': 'error',
    'BorderlineHigh': 'warning',
    'BorderlineLow': 'warning'
  };
  
  return colorMap[status] || 'default';
};

/**
 * Export medical data to different formats
 */
export const exportMedicalData = {
  toJSON: (data) => JSON.stringify(data, null, 2),
  
  toCSV: (data) => {
    if (!data.investigations || data.investigations.length === 0) {
      return 'No investigation data available';
    }
    
    const headers = ['Test Name', 'Result', 'Unit', 'Reference Range', 'Status', 'Date'];
    const rows = data.investigations.map(inv => [
      inv.name,
      inv.value,
      inv.unit,
      inv.range,
      inv.status,
      inv.date
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },
  
  toHTML: (data) => {
    const patient = data.patientDemographics;
    const tests = data.investigations;
    
    return `
      <html>
        <head>
          <title>Medical Report - ${patient.name || 'Unknown'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3498db; color: white; }
            .high { color: red; font-weight: bold; }
            .low { color: orange; font-weight: bold; }
            .normal { color: green; }
          </style>
        </head>
        <body>
          <h1>Medical Report</h1>
          <h2>Patient Information</h2>
          <p><strong>Name:</strong> ${patient.name || 'N/A'}</p>
          <p><strong>Age/Gender:</strong> ${patient.age || 'N/A'} / ${patient.gender || 'N/A'}</p>
          <p><strong>Ref No:</strong> ${patient.refNo || 'N/A'}</p>
          
          <h2>Investigation Results</h2>
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tests.map(test => `
                <tr>
                  <td>${test.name}</td>
                  <td class="${test.status.toLowerCase()}">${test.value}</td>
                  <td>${test.unit}</td>
                  <td>${test.range}</td>
                  <td class="${test.status.toLowerCase()}">${test.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }
};

export default {
  parseReactMedicalData,
  toAngularFormat,
  formatForDisplay,
  exportMedicalData
};

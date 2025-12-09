/**
 * Example usage of Medical Data Parser and Viewer
 * This shows how to work with React-style medical data (page-based)
 * and convert it to Angular format or display it in React
 */

import { parseReactMedicalData, toAngularFormat, formatForDisplay } from '../utils/medicalDataParser';

// Your sample React data structure
export const sampleReactData = {
  "name": "sample-4.pdf",
  "text": {
    "Page 1": "Laboratory Investigation ReportbısytechMEDICAL LABORATORY-Ref No.:990002569Sample No.:2201566389Collected:25/01/2022 08:00:20 PMRegistered:25/01/2022 09:21PMReported:26/01/2022 01:30AMAge/Gender:49 Years/FRef.Physician:Dr. HUMEIRA BADSHACentre:Dr. HUMEIRA BADSHA MEDICAL CENTERTest / ParametersCreatinine (Serum)RA1 WITH HEPATIC PANEL PROFILE (DR. HUMEIRA BADSHA MEDICAL CENTER)Result0.42FlagLUnitsmg/dLReference Range0.59 - 1.04MethodologyKinetic colorimetric assaybased on Jaffe methodSample Type :SerumNote : Please correlate clinically.Please note update in referrence range with effect from 31/10/2020 (Source: Mayo Clinical Laboratories).CRP (C-Reactive Protein)39.5Hmg/L< 6.0Please note change inImmunoturbidimetryreference range. Sample Type : SerumNote: Please correlate clinically.Ferritin96.50ng/ml10 - 291CLIASample Type :SerumInterpretation :-Increased level is seen in haemochromatosis, porphyria, rheumatoid arthritis, liver disease, hyperthyroidism, adult stills disease, type2 diabetes, leukemia, Hodgkins lymphoma, iron poisoning, in inflammation , frequent blood transfusion, alcohol abuse Decreasedlevel is seen in any Iron deficiency conditions such as heavy menstrual bleeding, pregnancy, not enough iron in the diet, or bleedinginside the intestinal tract (from ulcers, colon polyps , colon cancer, hemorrhoids , or other conditions).Dr.Adley Mark FernandesM.D(Pathology)Pathologistis an electronically authenticated report.Laboratory Technologist ThisFinal ReportPage 1 of 5Printed on: 26/01/2022 01:58AMFax: +971 4 3988569 Web: www.biosytech.com*** End Of Report ***P.O.Box: 49527, Dubai, UAE Tel: +971 4 3988567",
    "Page 2": "Laboratory Investigation ReportbısytechMEDICAL LABORATORYRef No.:990002569Sample No.:2201566389Collected:25/01/2022 08:00:20 PMRegistered:25/01/2022 09:21PMReported:25/01/2022 10:17PMTextAge/Gender:49 Years/FRef.Physician:Dr. HUMEIRA BADSHACentre:Dr. HUMEIRA BADSHA MEDICAL CENTERBhavya ThendankandyRA1 WITH HEPATIC PANEL PROFILE (DR. HUMEIRA BADSHA MEDICAL CENTER)Test / ParametersCBC (Complete Blood Count)Hemoglobin13.1RBC Count4.57Hematocrit39.0MCV85.3MCH28.7pg27.0 - 32.0MCHC33.7RDW13.9Platelet Count277MPV8.7WBC Count8.7Neutrophils61Lymphocytes31ResultFlagUnitsg/dl10^6/pL3.9 - 5.0%35.0 - 45.0fL82.0 - 98.0g/dL32.0 - 37.0%11.9 - 15.510^3/pL150 - 450fL10^3/L%40 - 75%30 - 60Eosinophils2%0 - 6Monocytes6%1 - 6Basophils0Sample Type :EDTA whole blood6%0 - 1Flow CytometryDr.Adley Mark FernandesM.D(Pathology)Reference RangeMethodology12.0 - 15.57.6 - 10.84.0 - 11.0Spectrophotometry(Oxyhemoglobin)Electrical ImpedanceCalculationCalculationCalculationCalculationCalculationElectrical ImpedanceCalculationElectrical ImpedanceFlow CytometryFlow CytometryFlow CytometryFlow CytometryMurshidha MuringakodanPathologist2is an electronically authenticated report.Final ReportPage 2 of 5Laboratory Technologist ThisPrinted on: 26/01/2022 01:58AMP.O.Box: 49527, Dubai, UAE Tel: +971 4 3988567Fax: +971 4 3988569 Web: www.biosytech.com"
  }
};

// Example 1: Parse React data to structured format
export const parseExample = () => {
  console.log('=== PARSING REACT DATA ===');
  const structuredData = parseReactMedicalData(sampleReactData);
  
  console.log('Parsed Data:', structuredData);
  console.log('Patient:', structuredData.patientDemographics);
  console.log('Investigations Count:', structuredData.investigations.length);
  console.log('Investigations:', structuredData.investigations);
  
  return structuredData;
};

// Example 2: Convert to Angular format
export const angularFormatExample = () => {
  console.log('=== CONVERTING TO ANGULAR FORMAT ===');
  const structuredData = parseReactMedicalData(sampleReactData);
  const angularData = toAngularFormat(structuredData);
  
  console.log('Angular Format:', angularData);
  
  return angularData;
};

// Example 3: Format for display in UI
export const displayFormatExample = () => {
  console.log('=== FORMATTING FOR DISPLAY ===');
  const structuredData = parseReactMedicalData(sampleReactData);
  const displayData = formatForDisplay(structuredData);
  
  console.log('Display Data:', displayData);
  console.log('Tests for Display:', displayData.tests);
  
  return displayData;
};

// Example 4: Working with multiple documents
export const multiDocumentExample = (documents) => {
  console.log('=== PROCESSING MULTIPLE DOCUMENTS ===');
  
  const allResults = documents.map(doc => {
    const parsed = parseReactMedicalData(doc);
    return {
      fileName: doc.name,
      patientName: parsed.patientDemographics.name,
      testCount: parsed.investigations.length,
      imagingCount: parsed.imagingReports.length,
      data: parsed
    };
  });
  
  console.log('Processed Documents:', allResults);
  return allResults;
};

// Example 5: Filter and aggregate lab results
export const aggregateLabResults = (document) => {
  console.log('=== AGGREGATING LAB RESULTS ===');
  const structuredData = parseReactMedicalData(document);
  
  // Group by status
  const byStatus = structuredData.investigations.reduce((acc, test) => {
    const status = test.status || 'Normal';
    if (!acc[status]) acc[status] = [];
    acc[status].push(test);
    return acc;
  }, {});
  
  console.log('Tests by Status:', byStatus);
  
  // Find abnormal results
  const abnormal = structuredData.investigations.filter(
    test => test.status === 'High' || test.status === 'Low'
  );
  
  console.log('Abnormal Results:', abnormal);
  
  return {
    byStatus,
    abnormal,
    totalTests: structuredData.investigations.length,
    abnormalCount: abnormal.length
  };
};

// Example 6: Extract specific test results
export const extractSpecificTests = (document, testNames) => {
  console.log('=== EXTRACTING SPECIFIC TESTS ===');
  const structuredData = parseReactMedicalData(document);
  
  const specificTests = structuredData.investigations.filter(test =>
    testNames.some(name => 
      test.name.toLowerCase().includes(name.toLowerCase())
    )
  );
  
  console.log('Specific Tests Found:', specificTests);
  return specificTests;
};

// Example Usage in React Component:
/*
import React, { useState, useEffect } from 'react';
import { parseReactMedicalData } from './utils/medicalDataParser';
import MedicalDataViewer from './components/MedicalDataViewer';

const MyComponent = () => {
  const [medicalData, setMedicalData] = useState(null);
  
  useEffect(() => {
    // Your data from backend or state
    const data = {
      name: "lab-report.pdf",
      text: {
        "Page 1": "...",
        "Page 2": "..."
      }
    };
    
    setMedicalData(data);
  }, []);
  
  return (
    <div>
      <MedicalDataViewer rawData={medicalData} />
    </div>
  );
};
*/

// Example: Integration with your existing MedicalRecords component
export const integrationExample = () => {
  return `
  // In your MedicalRecords.js component:
  
  import { parseReactMedicalData, toAngularFormat } from '../utils/medicalDataParser';
  
  // After uploading a file:
  const handleUploadFiles = async () => {
    const result = await apiService.uploadMedicalRecords(files, userInfo, body);
    
    // Parse the extracted data
    if (result.extractedData?.[0]?.text) {
      const reactData = {
        name: files[0].name,
        text: result.extractedData[0].text
      };
      
      // Convert to structured format
      const structuredData = parseReactMedicalData(reactData);
      
      // Convert to Angular format for backend
      const angularData = toAngularFormat(structuredData);
      
      // Set investigations and imaging reports
      setInvestigations(angularData.investigations);
      setImagingReports(angularData.imaging_radiology_reports);
      setOtherClinicalData(angularData.other_relevant_clinical_details);
    }
  };
  `;
};

export default {
  parseExample,
  angularFormatExample,
  displayFormatExample,
  multiDocumentExample,
  aggregateLabResults,
  extractSpecificTests,
  integrationExample
};

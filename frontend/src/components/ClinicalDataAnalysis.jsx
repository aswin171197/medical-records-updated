import React, { useState, useEffect } from 'react';
import './ClinicalDataAnalysis.css';

const ClinicalDataAnalysis = ({ extractedData, onDataChange }) => {
  const [clinicalData, setClinicalData] = useState({
    symptoms: [{ symptom_description: '', location: '', duration: '', severity: '', character: '' }],
    diagnoses: [{ diagnosis_description: '', diagnosis_type: '', status: '', icd_code: '' }],
    treatments: [{ route: '', dosage: '', duration: '', frequency: '', medication_name: '', treatment_description: '' }],
    currentMedications: [{ dosage: '', frequency: '', medication_name: '', medication_details: '' }],
    followup: [{ followup_type: '', timeframe: '', details: '' }],
    allergies: [{ allergen: '', reaction: '', severity: '', allergy_details: '' }],
    remarks: [{ context: '', remark_text: '' }],
    history: [{ onset: '', status: '', details: '', history_type: '', significance: '' }],
    findings: [{ body_system: '', significance: '', finding_description: '' }],
    vitalSigns: [{ vital_sign: '', value: '', unit: '', interpretation: '' }],
    comorbidities: [{ co_morbidity_name: '', co_morbidity_description: '', status: '', icd_code: '' }],
    investigations: [{ investigation_name: '', result: '', unit: '', reference_range: '', flag: 'NORMAL' }],
    clinicalScores: [{ score_name: '', value: '', unit: '', interpretation: '' }],
    followupInvestigations: [{ investigation_name: '', reason: '', timeframe: '' }],
    imagingRadiologyReports: [{ scan_type: '', body_part: '', findings: '', impression: '' }],
    otherClinicalDetails: [{ detail_type: '', detail_text: '' }],
    additionalNotes: '',
    other_clinical_data: ''
  });

  const [activeSection, setActiveSection] = useState('symptoms');

  useEffect(() => {
    if (extractedData && extractedData.length > 0) {
      populateWithExtractedData(extractedData[0]);
    }
  }, [extractedData]);

  const populateWithExtractedData = (data) => {
    console.log('=== POPULATING WITH EXTRACTED DATA ===');
    console.log('Received data:', JSON.stringify(data, null, 2));
    
    if (!data || !data.text) {
      console.log('No text data found in:', data);
      return;
    }

    // Parse the extracted text to populate clinical data
    const parsedData = parseExtractedText(data.text);
    console.log('Parsed data:', parsedData);
    
    setClinicalData(prev => ({
      ...prev,
      ...parsedData
    }));
  };

  const parseExtractedText = (textData) => {
    console.log('=== PARSING EXTRACTED TEXT ===');
    console.log('Text data type:', typeof textData);
    console.log('Text data:', textData);
    
    const allText = Object.values(textData).join(' ');
    console.log('Combined text length:', allText.length);
    console.log('Sample text (first 500 chars):', allText.substring(0, 500));
    
    // Extract investigations from lab report
        // const investigations = [];
        
        // More comprehensive lab value extraction patterns
        /*const labPatterns = [
          /([A-Za-z\s\(\)]+)\s*(\d+\.?\d*)\s*([A-Za-z\/\%]+)?\s*(?:Reference Range|Ref\.?\s*Range)?\s*:?\s*([\d\.<>\-\s]+)?/gi,
          /([A-Za-z\s]+):\s*(\d+\.?\d*)\s*([A-Za-z\/\%]+)?/gi
        ];
        
        labPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(allText)) !== null) {
            const name = match[1].trim();
            const result = match[2];
            const unit = match[3] || '';
            const refRange = match[4] || '';
            
            // Filter out common non-lab terms
            if (name.length > 3 && 
                !name.toLowerCase().includes('patient') && 
                !name.toLowerCase().includes('date') &&
                !name.toLowerCase().includes('age') &&
                !name.toLowerCase().includes('gender') &&
                result) {
              investigations.push({
                investigation_name: name,
                result: result,
                unit: unit,
                reference_range: refRange,
                flag: 'NORMAL'
              });
            }
          }
        });*/
        
        console.log('Extracted investigations:', investigations);
    
    console.log('Extracted investigations:', investigations);

    // Extract patient demographics
    const ageMatch = allText.match(/Age[\s\/]*Gender[:\s]*(\d+)\s*Years?[\s\/]*([MF])/i);
    const demographics = ageMatch ? {
      age: ageMatch[1],
      gender: ageMatch[2] === 'M' ? 'Male' : 'Female'
    } : {};
    
    console.log('Extracted demographics:', demographics);

    // Extract symptoms from clinical notes
    const symptoms = [];
    const symptomKeywords = ['pain', 'ache', 'fever', 'nausea', 'fatigue', 'weakness', 'cough', 'headache', 'bleeding'];
    symptomKeywords.forEach(keyword => {
      if (allText.toLowerCase().includes(keyword)) {
        symptoms.push({
          symptom_description: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          location: '',
          duration: '',
          severity: 'Moderate',
          character: ''
        });
      }
    });
    
    console.log('Extracted symptoms:', symptoms);

    const result = {
      investigations: investigations.length > 0 ? investigations : [{ investigation_name: '', result: '', unit: '', reference_range: '', flag: 'NORMAL' }],
      symptoms: symptoms.length > 0 ? symptoms : [{ symptom_description: '', location: '', duration: '', severity: '', character: '' }],
      patientDemographics: demographics
    };
    
    console.log('Final parsed result:', result);
    return result;
  };

  const addToArray = (arrayName) => {
    setClinicalData(prev => {
      const newItem = getEmptyItem(arrayName);
      return {
        ...prev,
        [arrayName]: [...prev[arrayName], newItem]
      };
    });
  };

  const removeFromArray = (arrayName, index) => {
    setClinicalData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (arrayName, index, field, value) => {
    setClinicalData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
    onDataChange && onDataChange(clinicalData);
  };

  const getEmptyItem = (arrayName) => {
    const templates = {
      symptoms: { symptom_description: '', location: '', duration: '', severity: '', character: '' },
      diagnoses: { diagnosis_description: '', diagnosis_type: '', status: '', icd_code: '' },
      treatments: { route: '', dosage: '', duration: '', frequency: '', medication_name: '', treatment_description: '' },
      currentMedications: { dosage: '', frequency: '', medication_name: '', medication_details: '' },
      investigations: { investigation_name: '', result: '', unit: '', reference_range: '', flag: 'NORMAL' },
      imagingRadiologyReports: { scan_type: '', body_part: '', findings: '', impression: '' }
    };
    return templates[arrayName] || {};
  };

  const renderArraySection = (arrayName, title, fields) => (
    <div className="clinical-section">
      <div className="section-header">
        <h3>{title}</h3>
        <button onClick={() => addToArray(arrayName)} className="add-btn">+ Add</button>
      </div>
      {clinicalData[arrayName].map((item, index) => (
        <div key={index} className="item-form">
          <div className="item-header">
            <span>Item {index + 1}</span>
            {clinicalData[arrayName].length > 1 && (
              <button onClick={() => removeFromArray(arrayName, index)} className="remove-btn">Remove</button>
            )}
          </div>
          <div className="form-grid">
            {fields.map(field => (
              <div key={field.key} className="form-field">
                <label>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={item[field.key] || ''}
                    onChange={(e) => updateArrayItem(arrayName, index, field.key, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={item[field.key] || ''}
                    onChange={(e) => updateArrayItem(arrayName, index, field.key, e.target.value)}
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={item[field.key] || ''}
                    onChange={(e) => updateArrayItem(arrayName, index, field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const sections = {
    symptoms: {
      title: 'Symptoms',
      fields: [
        { key: 'symptom_description', label: 'Description', type: 'textarea' },
        { key: 'location', label: 'Location' },
        { key: 'duration', label: 'Duration' },
        { key: 'severity', label: 'Severity', type: 'select', options: ['Mild', 'Moderate', 'Severe'] },
        { key: 'character', label: 'Character' }
      ]
    },
    investigations: {
      title: 'Lab Investigations',
      fields: [
        { key: 'investigation_name', label: 'Test Name' },
        { key: 'result', label: 'Result' },
        { key: 'unit', label: 'Unit' },
        { key: 'reference_range', label: 'Reference Range' },
        { key: 'flag', label: 'Flag', type: 'select', options: ['NORMAL', 'HIGH', 'LOW', 'ABNORMAL', 'BORDERLINE_HIGH', 'BORDERLINE_LOW'] }
      ]
    },
    diagnoses: {
      title: 'Diagnoses',
      fields: [
        { key: 'diagnosis_description', label: 'Description', type: 'textarea' },
        { key: 'diagnosis_type', label: 'Type', type: 'select', options: ['Primary', 'Secondary', 'Differential'] },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Resolved', 'Chronic'] },
        { key: 'icd_code', label: 'ICD Code' }
      ]
    },
    imagingRadiologyReports: {
      title: 'Imaging & Radiology',
      fields: [
        { key: 'scan_type', label: 'Scan Type' },
        { key: 'body_part', label: 'Body Part' },
        { key: 'findings', label: 'Findings', type: 'textarea' },
        { key: 'impression', label: 'Impression', type: 'textarea' }
      ]
    }
  };

  return (
    <div className="clinical-data-analysis">
      <div className="analysis-header">
        <h2>Clinical Data Analysis</h2>
      </div>
      
      <div className="section-tabs">
        {Object.keys(sections).map(key => (
          <button
            key={key}
            className={`tab ${activeSection === key ? 'active' : ''}`}
            onClick={() => setActiveSection(key)}
          >
            {sections[key].title}
          </button>
        ))}
      </div>

      <div className="analysis-content">
        {renderArraySection(activeSection, sections[activeSection].title, sections[activeSection].fields)}
      </div>
    </div>
  );
};

export default ClinicalDataAnalysis;
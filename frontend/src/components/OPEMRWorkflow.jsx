import React, { useState, useRef } from 'react';
import {
  Typography,
  Button,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as ApproveIcon,
  ExpandMore as ExpandMoreIcon,
  Science as LabIcon,
  CameraAlt as ImagingIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import apiService from '../services/apiService';

const OPEMRWorkflow = ({ user }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [extractedContent, setExtractedContent] = useState({ labs: [], radiology: [], others: [] });
  const [documentTags, setDocumentTags] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const fileInputRef = useRef(null);

  const steps = [
    'Upload Files',
    'Review Extracted Content', 
    'Tag Your Documents',
    'Finalize Upload'
  ];

  // Step 1: Upload Files
  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const userInfo = apiService.getUserInfo();
      const body = {
        patientId: userInfo.id,
        appointmentId: 0,
        id: 0
      };

      const results = [];
      for (const file of files) {
        const result = await apiService.uploadMedicalRecords([file], userInfo, body);
        results.push({
          file: file,
          fileName: file.name,
          extractedData: result.extractedData || null,
          type: getFileType(file.type)
        });
      }

      setUploadedFiles(results);
      categorizeDocuments(results);
      setActiveStep(1);
      
      setNotification({
        open: true,
        message: `${files.length} file(s) uploaded and processed successfully`,
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || 'Failed to upload files',
        severity: 'error'
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType.includes('pdf')) return 'Lab Report';
    if (mimeType.includes('image')) return 'Imaging';
    return 'Document';
  };

  // Step 2: Categorize documents automatically
  const categorizeDocuments = (files) => {
    const categories = { labs: [], radiology: [], others: [] };
    
    files.forEach((fileData, index) => {
      const extracted = fileData.extractedData?.[0]?.extraction || fileData.extractedData?.[0];
      
      if (extracted?.investigations?.length > 0) {
        categories.labs.push({ ...fileData, index });
      } else if (extracted?.imaging_radiology_reports?.length > 0) {
        categories.radiology.push({ ...fileData, index });
      } else {
        categories.others.push({ ...fileData, index });
      }
    });
    
    setExtractedContent(categories);
  };

  // Step 3: Tag documents
  const handleTagChange = (fileIndex, field, value) => {
    setDocumentTags(prev => ({
      ...prev,
      [fileIndex]: {
        ...prev[fileIndex],
        [field]: value
      }
    }));
  };

  // Step 4: Finalize upload
  const handleFinalizeUpload = async () => {
    try {
      const finalData = uploadedFiles.map((fileData, index) => ({
        ...fileData,
        tags: documentTags[index] || {},
        isApproved: true
      }));

      // Save to localStorage for now
      const existingRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
      const newRecords = finalData.map(data => ({
        id: Date.now() + Math.random(),
        title: data.fileName,
        date: new Date().toISOString().split('T')[0],
        type: data.type,
        file: data.fileName,
        extractedData: data.extractedData,
        tags: data.tags,
        isApproved: true
      }));

      localStorage.setItem('medicalRecords', JSON.stringify([...newRecords, ...existingRecords]));
      
      setNotification({
        open: true,
        message: 'Documents successfully processed and saved!',
        severity: 'success'
      });

      // Reset workflow
      setActiveStep(0);
      setUploadedFiles([]);
      setExtractedContent({ labs: [], radiology: [], others: [] });
      setDocumentTags({});
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error finalizing upload',
        severity: 'error'
      });
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>
              Upload Medical Documents
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Select PDF, Word, JPG, PNG files. Processing may take 1-2 minutes depending on file size.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={isUploading ? <CircularProgress size={24} color="inherit" /> : <UploadIcon />}
              onClick={handleFileUpload}
              disabled={isUploading}
              sx={{ px: 4, py: 2 }}
            >
              {isUploading ? 'Processing...' : 'Choose Files'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Review Extracted Content
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Documents have been automatically sorted into Labs, Radiology, or Others. Click on any heading to view or edit the extracted content.
            </Typography>

            {/* Labs Section */}
            <Accordion defaultExpanded={extractedContent.labs.length > 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LabIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Laboratory Reports
                  </Typography>
                  <Chip label={extractedContent.labs.length} size="small" color="success" sx={{ ml: 2 }} />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {extractedContent.labs.length === 0 ? (
                  <Typography color="text.secondary">No laboratory reports found.</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {extractedContent.labs.map((item, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {item.fileName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.extractedData?.[0]?.extraction?.investigations?.length || 0} investigations found
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Radiology Section */}
            <Accordion sx={{ mt: 2 }} defaultExpanded={extractedContent.radiology.length > 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ImagingIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Radiology Reports
                  </Typography>
                  <Chip label={extractedContent.radiology.length} size="small" color="secondary" sx={{ ml: 2 }} />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {extractedContent.radiology.length === 0 ? (
                  <Typography color="text.secondary">No radiology reports found.</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {extractedContent.radiology.map((item, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {item.fileName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.extractedData?.[0]?.extraction?.imaging_radiology_reports?.length || 0} imaging reports found
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Others Section */}
            <Accordion sx={{ mt: 2 }} defaultExpanded={extractedContent.others.length > 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DocumentIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Other Documents
                  </Typography>
                  <Chip label={extractedContent.others.length} size="small" color="warning" sx={{ ml: 2 }} />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {extractedContent.others.length === 0 ? (
                  <Typography color="text.secondary">No other documents found.</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {extractedContent.others.map((item, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {item.fileName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              General document
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </AccordionDetails>
            </Accordion>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button variant="contained" onClick={() => setActiveStep(2)}>
                Continue to Tagging
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Tag Your Documents
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Select Record Type and Record Date for each document. Current Records = documents from patient's current visit.
            </Typography>

            <Grid container spacing={3}>
              {uploadedFiles.map((fileData, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        {fileData.fileName}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Record Type</InputLabel>
                            <Select
                              value={documentTags[index]?.recordType || ''}
                              onChange={(e) => handleTagChange(index, 'recordType', e.target.value)}
                              label="Record Type"
                            >
                              <MenuItem value="current">Current Record</MenuItem>
                              <MenuItem value="past">Past Record</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Record Date"
                            value={documentTags[index]?.recordDate || ''}
                            onChange={(e) => handleTagChange(index, 'recordDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                onClick={() => setActiveStep(3)}
                disabled={uploadedFiles.some((_, index) => !documentTags[index]?.recordType || !documentTags[index]?.recordDate)}
              >
                Continue to Finalize
              </Button>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Finalize Upload
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Review your documents and tags. Once approved, document data will appear in the consolidated summary.
            </Typography>

            <Grid container spacing={2}>
              {uploadedFiles.map((fileData, index) => (
                <Grid item xs={12} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {fileData.fileName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Type: {documentTags[index]?.recordType || 'Not set'} | 
                            Date: {documentTags[index]?.recordDate || 'Not set'}
                          </Typography>
                        </Box>
                        <Chip 
                          label={fileData.type} 
                          color={fileData.type === 'Lab Report' ? 'success' : fileData.type === 'Imaging' ? 'secondary' : 'default'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 4, textAlign: 'center', p: 3, backgroundColor: '#e8f5e8', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Ready to Approve
              </Typography>
              <Typography sx={{ mb: 3, color: 'text.secondary' }}>
                Click the green Approve button to finalize the upload. Document data will appear in the consolidated summary.
              </Typography>
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={handleFinalizeUpload}
                startIcon={<ApproveIcon />}
                sx={{ px: 4, py: 1.5 }}
              >
                Approve Documents
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Medical Document Upload
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Paper sx={{ p: 3 }}>
        {renderStepContent()}
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OPEMRWorkflow;
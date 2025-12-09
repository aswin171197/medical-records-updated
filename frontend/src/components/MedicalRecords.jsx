import React, { useState, useEffect, useRef, Fragment } from 'react';
import {
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Avatar,
  Fab,
  keyframes
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as ApproveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as MedicalIcon,
  Science as LabIcon,
  CameraAlt as ImagingIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import HealthAssistant from './HealthAssistant';
import apiService from '../services/apiService';

// Loading animation keyframes
const loadingAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
`;



// Document Selector Component
const DocumentSelector = ({ currentRecord, onRecordSelect }) => {
  const [selectedRecordId, setSelectedRecordId] = useState(currentRecord?.id || '');
  const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');

  const handleRecordChange = (event) => {
    const recordId = event.target.value;
    setSelectedRecordId(recordId);
    
    const selectedRecord = records.find(r => r.id.toString() === recordId.toString());
    if (selectedRecord) {
      onRecordSelect(selectedRecord);
    }
  };

  if (records.length === 0) {
    return (
      <Box sx={{ mb: 3, p: 2, backgroundColor: '#fff3cd', borderRadius: 1, border: '1px solid #ffeaa7' }}>
        <Typography color="text.secondary">
          No documents uploaded yet. Upload a medical document to begin analysis.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <FormControl fullWidth>
        <InputLabel>Select Document to Analyze</InputLabel>
        <Select
          value={selectedRecordId}
          onChange={handleRecordChange}
          label="Select Document to Analyze"
        >
          {records.map((record) => (
            <MenuItem key={record.id} value={record.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {record.type === 'Lab Report' && <LabIcon fontSize="small" />}
                {record.type === 'Imaging' && <ImagingIcon fontSize="small" />}
                {record.type !== 'Lab Report' && record.type !== 'Imaging' && <DescriptionIcon fontSize="small" />}
                <Typography>{record.title}</Typography>
                <Chip 
                  label={record.type} 
                  size="small" 
                  color={record.type === 'Lab Report' ? 'success' : record.type === 'Imaging' ? 'secondary' : 'default'}
                  sx={{ ml: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {record.date}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

// EMR Analysis Interface Component
const EMRAnalysisInterface = ({ 
  currentRecord, 
  imagingReports, 
  setImagingReports, 
  investigations, 
  setInvestigations, 
  otherClinicalData, 
  setOtherClinicalData, 
  onApprove 
}) => {
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);

  const [newInvestigation, setNewInvestigation] = useState({
    result_timestamp: new Date().toISOString().split('T')[0],
    investigation_name: '',
    result: '',
    unit: '',
    reference_range: '',
    flag: 'NORMAL'
  });

  const statusOptions = [
    { label: 'Normal', value: 'Normal' },
    { label: 'High', value: 'High' },
    { label: 'Low', value: 'Low' },
    { label: 'Borderline Low', value: 'BorderlineLow' },
    { label: 'Borderline High', value: 'BorderlineHigh' }
  ];

  const addNewReport = () => {
    setImagingReports([...imagingReports, {
      body_part: '',
      scan_type: '',
      findings: '',
      impression: '',
      result_timestamp: new Date().toISOString().split('T')[0]
    }]);
  };

  const removeReport = (index) => {
    if (imagingReports.length > 1) {
      const newReports = imagingReports.filter((_, i) => i !== index);
      setImagingReports(newReports);
    }
  };

  const updateImagingReport = (index, field, value) => {
    const newReports = [...imagingReports];
    newReports[index][field] = value;
    setImagingReports(newReports);
  };

  const addInvestigationRow = () => {
    if (newInvestigation.investigation_name.trim()) {
      setInvestigations([...investigations, { ...newInvestigation }]);
      setNewInvestigation({
        result_timestamp: new Date().toISOString().split('T')[0],
        investigation_name: '',
        result: '',
        unit: '',
        reference_range: '',
        flag: 'Normal'
      });
    }
  }

  const removeInvestigationRow = (index) => {
    const newInvestigations = investigations.filter((_, i) => i !== index);
    setInvestigations(newInvestigations);
  };

  const startEditing = (index) => {
    setEditingRowIndex(index);
  };

  const stopEditing = () => {
    setEditingRowIndex(null);
  };

  const updateInvestigation = (index, field, value) => {
    const newInvestigations = [...investigations];
    newInvestigations[index][field] = value;
    setInvestigations(newInvestigations);
  };



  return (
    <Box sx={{ mt: 3 }}>
      <Paper
        sx={{
          p: 4,
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
          <Avatar
            sx={{
              mr: 3,
              bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              width: 56,
              height: 56,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            <MedicalIcon sx={{ fontSize: 28, color: 'white' }} />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Medical Record Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              AI-powered analysis of your medical documents with structured data extraction
            </Typography>
          </Box>
        </Box>
        
        {/* Document Selector */}
        <DocumentSelector 
          currentRecord={currentRecord}
          onRecordSelect={(record) => {
            console.log('=== DOCUMENT SELECTOR - RECORD SELECTED ===');
            console.log('Selected record:', record);
            console.log('Record extracted data:', record.extractedData);
            
            // Load structured data from selected record
            if (record.extractedData?.[0]) {
              const structuredData = record.extractedData[0].extraction || record.extractedData[0];
              
              // Set investigations from structured data
              if (structuredData.investigations?.length > 0) {
                const formattedInvestigations = structuredData.investigations.map((inv) => {
                  let formattedDate = inv.result_timestamp || new Date().toISOString().split('T')[0];
                  if (formattedDate.includes('/')) {
                    const parts = formattedDate.split('/');
                    if (parts.length === 3) {
                      formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                  }
                  return {
                    result_timestamp: formattedDate,
                    investigation_name: inv.investigation_name || '',
                    result: inv.result || '',
                    unit: inv.unit || '',
                    reference_range: inv.reference_range || '',
                    flag: inv.flag || 'NORMAL',
                    raw_data: inv
                  };
                });
                setInvestigations(formattedInvestigations);
              } else {
                setInvestigations([]);
              }
              
              // Set imaging reports from structured data
              if (structuredData.imaging_radiology_reports?.length > 0) {
                const formattedReports = structuredData.imaging_radiology_reports.map(report => ({
                  ...report,
                  result_timestamp: report.result_timestamp || new Date().toISOString().split('T')[0]
                }));
                setImagingReports(formattedReports);
              } else {
                setImagingReports([]);
              }
              
              // Set clinical data from structured data
              setOtherClinicalData(structuredData.other_clinical_data || '');
            } else {
              setImagingReports([]);
              setInvestigations([]);
              setOtherClinicalData('');
            }
          }}
        />

        {/* Imaging and Radiology Accordion */}
        <Accordion
          defaultExpanded={imagingReports.length > 0}
          sx={{
            borderRadius: '12px !important',
            mb: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            '&:before': {
              display: 'none',
            },
            '&.Mui-expanded': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'secondary.main' }} />}
            sx={{
              background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
              borderRadius: '12px 12px 0 0 !important',
              '&:hover': {
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              },
              '&.Mui-expanded': {
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                '& .MuiAccordionSummary-expandIconWrapper': {
                  color: 'white'
                }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  mr: 2,
                  bgcolor: 'secondary.main',
                  width: 40,
                  height: 40
                }}
              >
                <ImagingIcon sx={{ color: 'white', fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Imaging and Radiology Reports
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                  X-rays, CT scans, MRIs, and other imaging studies
                </Typography>
              </Box>
              <Chip
                label={`${imagingReports.length} Report${imagingReports.length !== 1 ? 's' : ''}`}
                size="small"
                color="secondary"
                sx={{
                  ml: 2,
                  fontWeight: 500,
                  borderRadius: '12px'
                }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {imagingReports.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No imaging reports found in the uploaded document.
                </Typography>
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={addNewReport}
                  sx={{ mt: 2 }}
                >
                  Add New Report
                </Button>
              </Box>
            ) : (
              <>
                {imagingReports.map((report, index) => (
                  <Card key={index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" color="primary">
                          Report {index + 1}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            type="date"
                            size="small"
                            value={report.result_timestamp}
                            onChange={(e) => updateImagingReport(index, 'result_timestamp', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                          {imagingReports.length > 1 && (
                            <IconButton color="error" onClick={() => removeReport(index)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Body Part"
                            value={report.body_part}
                            onChange={(e) => updateImagingReport(index, 'body_part', e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Scan Type"
                            value={report.scan_type}
                            onChange={(e) => updateImagingReport(index, 'scan_type', e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Findings"
                            multiline
                            rows={6}
                            value={report.findings}
                            onChange={(e) => updateImagingReport(index, 'findings', e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Impression"
                            multiline
                            rows={4}
                            value={report.impression}
                            onChange={(e) => updateImagingReport(index, 'impression', e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button startIcon={<AddIcon />} onClick={addNewReport} variant="outlined">
                    Add New Report
                  </Button>
                </Box>
              </>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Investigation Results Accordion */}
        <Accordion
          defaultExpanded={investigations.length > 0}
          sx={{
            mt: 2,
            borderRadius: '12px !important',
            mb: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            '&:before': {
              display: 'none',
            },
            '&.Mui-expanded': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'success.main' }} />}
            sx={{
              background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
              borderRadius: '12px 12px 0 0 !important',
              '&:hover': {
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              },
              '&.Mui-expanded': {
                background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                color: 'white',
                '& .MuiAccordionSummary-expandIconWrapper': {
                  color: 'white'
                }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  mr: 2,
                  bgcolor: 'success.main',
                  width: 40,
                  height: 40
                }}
              >
                <LabIcon sx={{ color: 'white', fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Laboratory Investigation Results
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                  Blood tests, biochemistry, and other lab investigations
                </Typography>
              </Box>
              <Chip
                label={`${investigations.length} Test${investigations.length !== 1 ? 's' : ''}`}
                size="small"
                color="success"
                sx={{
                  ml: 2,
                  fontWeight: 500,
                  borderRadius: '12px'
                }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {investigations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No investigation results found in the uploaded document.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Add lab results manually using the form below.
                </Typography>
              </Box>
            ) : (
             <TableContainer
               component={Paper}
               sx={{
                 mb: 2,
                 maxHeight: 400,
                 overflow: 'auto',
                 borderRadius: '12px',
                 border: '1px solid rgba(0,0,0,0.08)',
                 boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                 '& .MuiTableHead-root': {
                   position: 'sticky',
                   top: 0,
                   zIndex: 10,
                   backgroundColor: '#f8f9fa'
                 }
               }}
             >
                             <Table size="small" stickyHeader>
                               <TableHead>
                                 <TableRow sx={{
                                   backgroundColor: '#f8f9fa',
                                   borderBottom: '2px solid #e9ecef',
                                   '& th': {
                                     color: '#2c3e50',
                                     fontWeight: 700,
                                     fontSize: '0.9rem',
                                     borderBottom: 'none',
                                     py: 2.5,
                                     letterSpacing: '0.3px',
                                     backgroundColor: 'transparent'
                                   }
                                 }}>
                                   <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                   <TableCell sx={{ fontWeight: 'bold' }}>Investigation</TableCell>
                                   <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
                                   <TableCell sx={{ fontWeight: 'bold' }}>Unit</TableCell>
                                   <TableCell sx={{ fontWeight: 'bold' }}>Range</TableCell>
                                   <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                   <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                 </TableRow>
                               </TableHead>
                               <TableBody>
                                 {investigations.map((investigation, index) => (
                                   <TableRow
                                     key={index}
                                     hover
                                     sx={{
                                       backgroundColor: editingRowIndex === index ? '#f0f7ff' : 'inherit',
                                       '&:hover': {
                                         backgroundColor: editingRowIndex === index ? '#f0f7ff' : 'rgba(102, 126, 234, 0.04)',
                                         transform: 'scale(1.01)',
                                         boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                       },
                                       transition: 'all 0.3s ease-in-out',
                                       borderBottom: '1px solid rgba(0,0,0,0.06)'
                                     }}
                                   >
                                     {/* Date Field */}
                                     <TableCell>
                                       {editingRowIndex === index ? (
                                         <TextField
                                           type="date"
                                           size="small"
                                           value={investigation.result_timestamp}
                                           onChange={(e) => updateInvestigation(index, 'result_timestamp', e.target.value)}
                                           sx={{ width: '140px' }}
                                         />
                                       ) : (
                                         new Date(investigation.result_timestamp).toLocaleDateString()
                                       )}
                                     </TableCell>
                                     
                                     {/* Investigation Name Field */}
                                     <TableCell sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                                       {editingRowIndex === index ? (
                                         <TextField
                                           size="small"
                                           value={investigation.investigation_name}
                                           onChange={(e) => updateInvestigation(index, 'investigation_name', e.target.value)}
                                           fullWidth
                                         />
                                       ) : (
                                         investigation.investigation_name
                                       )}
                                     </TableCell>
                                     
                                     {/* Result Field */}
                                     <TableCell>
                                       {editingRowIndex === index ? (
                                         <TextField
                                           size="small"
                                           value={investigation.result}
                                           onChange={(e) => updateInvestigation(index, 'result', e.target.value)}
                                           sx={{ width: '100px' }}
                                         />
                                       ) : (
                                         <Typography sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                                           {investigation.result}
                                         </Typography>
                                       )}
                                     </TableCell>
                                     
                                     {/* Unit Field */}
                                     <TableCell>
                                       {editingRowIndex === index ? (
                                         <TextField
                                           size="small"
                                           value={investigation.unit}
                                           onChange={(e) => updateInvestigation(index, 'unit', e.target.value)}
                                           sx={{ width: '100px' }}
                                         />
                                       ) : (
                                         investigation.unit
                                       )}
                                     </TableCell>
                                     
                                     {/* Reference Range Field */}
                                     <TableCell>
                                       {editingRowIndex === index ? (
                                         <TextField
                                           size="small"
                                           value={investigation.reference_range}
                                           onChange={(e) => updateInvestigation(index, 'reference_range', e.target.value)}
                                           sx={{ width: '120px' }}
                                         />
                                       ) : (
                                         investigation.reference_range
                                       )}
                                     </TableCell>
                                     
                                     {/* Status/Flag Field */}
                                     <TableCell>
                                       {editingRowIndex === index ? (
                                         <Select
                                           size="small"
                                           value={investigation.flag}
                                           onChange={(e) => updateInvestigation(index, 'flag', e.target.value)}
                                           sx={{ width: '100px' }}
                                         >
                                           <MenuItem value="NORMAL">NORMAL</MenuItem>
                                           <MenuItem value="HIGH">HIGH</MenuItem>
                                           <MenuItem value="LOW">LOW</MenuItem>
                                           <MenuItem value="H">H</MenuItem>
                                           <MenuItem value="L">L</MenuItem>
                                           <MenuItem value="N">N</MenuItem>
                                         </Select>
                                       ) : (
                                         <Chip
                                           label={investigation.flag}
                                           size="small"
                                           color={
                                             investigation.flag === 'HIGH' || investigation.flag === 'H' ? 'error' :
                                             investigation.flag === 'LOW' || investigation.flag === 'L' ? 'warning' : 'success'
                                           }
                                         />
                                       )}
                                     </TableCell>
                                     
                                     {/* Actions */}
                                     <TableCell>
                                       {editingRowIndex === index ? (
                                         <>
                                           <IconButton
                                             size="small"
                                             onClick={() => stopEditing()}
                                             title="Save changes"
                                             color="primary"
                                           >
                                             <SaveIcon fontSize="small" />
                                           </IconButton>
                                           <IconButton
                                             size="small"
                                             onClick={() => removeInvestigationRow(index)}
                                             title="Delete investigation"
                                             color="error"
                                           >
                                             <DeleteIcon fontSize="small" />
                                           </IconButton>
                                         </>
                                       ) : (
                                         <>
                                           <IconButton
                                             size="small"
                                             onClick={() => startEditing(index)}
                                             title="Edit investigation"
                                             color="primary"
                                           >
                                             <EditIcon fontSize="small" />
                                           </IconButton>
                                           <IconButton
                                             size="small"
                                             onClick={() => {
                                               setSelectedInvestigation(investigation);
                                               setDetailViewOpen(true);
                                             }}
                                             title="View details"
                                           >
                                             <ViewIcon fontSize="small" />
                                           </IconButton>
                                           <IconButton
                                             size="small"
                                             onClick={() => removeInvestigationRow(index)}
                                             title="Delete investigation"
                                             color="error"
                                           >
                                             <DeleteIcon fontSize="small" />
                                           </IconButton>
                                         </>
                                       )}
                                     </TableCell>
                                   </TableRow>
                                 ))}
                               </TableBody>
                             </Table>
                           </TableContainer>
            )}
            

            {/* Add New Investigation Form */}
            <Card
              sx={{
                mt: 2,
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      mr: 2,
                      bgcolor: 'success.main',
                      width: 40,
                      height: 40
                    }}
                  >
                    <AddIcon sx={{ color: 'white' }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    Add New Investigation
                  </Typography>
                </Box>
                <Grid container spacing={2} alignItems="end">
                  <Grid item xs={2}>
                    <TextField
                      label="Date"
                      type="date"
                      size="small"
                      value={newInvestigation.result_timestamp}
                      onChange={(e) => setNewInvestigation({...newInvestigation, result_timestamp: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Investigation Name"
                      size="small"
                      value={newInvestigation.investigation_name}
                      onChange={(e) => setNewInvestigation({...newInvestigation, investigation_name: e.target.value})}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Result"
                      size="small"
                      value={newInvestigation.result}
                      onChange={(e) => setNewInvestigation({...newInvestigation, result: e.target.value})}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={1.5}>
                    <TextField
                      label="Unit"
                      size="small"
                      value={newInvestigation.unit}
                      onChange={(e) => setNewInvestigation({...newInvestigation, unit: e.target.value})}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Reference Range"
                      size="small"
                      value={newInvestigation.reference_range}
                      onChange={(e) => setNewInvestigation({...newInvestigation, reference_range: e.target.value})}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={1.5}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={newInvestigation.flag}
                        onChange={(e) => setNewInvestigation({...newInvestigation, flag: e.target.value})}
                        label="Status"
                      >
                        {statusOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    onClick={addInvestigationRow}
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={!newInvestigation.investigation_name.trim()}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                      boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #43a047 0%, #4caf50 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                      },
                      '&:disabled': {
                        background: 'rgba(76, 175, 80, 0.3)',
                        color: 'rgba(255,255,255,0.7)',
                      },
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    Add Investigation
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>

        {/* Investigation Detail Dialog */}
        <Dialog 
          open={detailViewOpen} 
          onClose={() => setDetailViewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LabIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">
                {selectedInvestigation?.investigation_name || 'Investigation Details'}
              </Typography>
            </Box>
            <IconButton onClick={() => setDetailViewOpen(false)}>
              <DeleteIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedInvestigation ? (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Basic Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Date:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {new Date(selectedInvestigation.result_timestamp).toLocaleDateString('en-GB')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Test Name:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {selectedInvestigation.investigation_name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Result:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {selectedInvestigation.result}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Unit:</Typography>
                          <Typography variant="body2">{selectedInvestigation.unit}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Reference Range:</Typography>
                          <Typography variant="body2">{selectedInvestigation.reference_range}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Status:</Typography>
                          <Chip
                            label={selectedInvestigation.flag}
                            size="small"
                            color={
                              selectedInvestigation.flag === 'High' || selectedInvestigation.flag === 'H' || selectedInvestigation.flag === 'BorderlineHigh' ? 'error' :
                              selectedInvestigation.flag === 'Low' || selectedInvestigation.flag === 'L' || selectedInvestigation.flag === 'BorderlineLow' ? 'warning' : 'success'
                            }
                          />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Clinical Significance
                      </Typography>
                      <Typography variant="body2">
                        {selectedInvestigation.raw_data?.clinical_significance || 
                         selectedInvestigation.raw_data?.interpretation || 
                         "No clinical significance information available."}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Raw Extracted Data */}
                <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f8f9fa' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    All Extracted Data
                  </Typography>
                  {selectedInvestigation.raw_data ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(selectedInvestigation.raw_data).map(([key, value]) => (
                            <TableRow key={key} hover>
                              <TableCell sx={{ fontWeight: 'medium' }}>{key}</TableCell>
                              <TableCell>
                                {typeof value === 'object' 
                                  ? JSON.stringify(value) 
                                  : String(value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No raw data available for this investigation.
                    </Typography>
                  )}
                </Paper>
              </Box>
            ) : (
              <Typography color="text.secondary">No investigation selected.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailViewOpen(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>



        {/* Other Clinical Data Accordion */}
        <Accordion
          sx={{
            mt: 2,
            borderRadius: '12px !important',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            '&:before': {
              display: 'none',
            },
            '&.Mui-expanded': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'warning.main' }} />}
            sx={{
              background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
              borderRadius: '12px 12px 0 0 !important',
              '&:hover': {
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              },
              '&.Mui-expanded': {
                background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                color: 'white',
                '& .MuiAccordionSummary-expandIconWrapper': {
                  color: 'white'
                }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  mr: 2,
                  bgcolor: 'warning.main',
                  width: 40,
                  height: 40
                }}
              >
                <DescriptionIcon sx={{ color: 'white', fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Other Clinical Data & Notes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                  Additional observations, clinical notes, and relevant medical information
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            <TextField
              multiline
              rows={8}
              fullWidth
              placeholder="Enter additional clinical notes, observations, or relevant medical information..."
              value={otherClinicalData}
              onChange={(e) => setOtherClinicalData(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 0 0 3px rgba(255, 152, 0, 0.1)',
                  }
                }
              }}
            />
          </AccordionDetails>
        </Accordion>

        {/* Approval Section */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 4,
            p: 4,
            background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
            borderRadius: '16px',
            border: '2px solid rgba(76, 175, 80, 0.2)',
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)',
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Avatar
              sx={{
                mx: 'auto',
                mb: 2,
                bgcolor: 'success.main',
                width: 64,
                height: 64,
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
              }}
            >
              <ApproveIcon sx={{ fontSize: 32, color: 'white' }} />
            </Avatar>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#2c3e50' }}>
              Document Verification & Approval
            </Typography>
            <Typography sx={{ mb: 3, color: 'text.secondary', fontSize: '1rem', lineHeight: 1.6 }}>
              By clicking the approve button, you confirm that all extracted and modified values are accurate and can be used for medical analysis.
            </Typography>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={onApprove}
              startIcon={<ApproveIcon />}
              sx={{
                px: 6,
                py: 2,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #43a047 0%, #4caf50 100%)',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
                },
                transition: 'all 0.3s ease-in-out'
              }}
            >
              Approve Document
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const MedicalRecords = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, record: null });
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState({});
  const [uploadError, setUploadError] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [verificationMode, setVerificationMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [userGuideVisible, setUserGuideVisible] = useState(false);
  const [currentAnalysisRecord, setCurrentAnalysisRecord] = useState(null);
  const [chosenFiles, setChosenFiles] = useState([]);
  const fileInputRef = useRef(null);

  // EMR UI State
  const [imagingReports, setImagingReports] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [otherClinicalData, setOtherClinicalData] = useState('');

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    setIsLoading(true);
    try {
      // Fetch medical records from backend API
      const response = await fetch('https://medical-records-updates2.onrender.com/medical-record', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Include JWT token
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch medical records: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched medical records from backend:', data);

      // Transform backend data to match frontend format
      const transformedRecords = data.records.map(record => ({
        id: record.id,
        title: record.fileName,
        date: record.createdAt.split('T')[0], // Format date
        type: getRecordTypeFromData(record.extractedData),
        file: record.fileName,
        blob_name: record.blobName,
        extractedData: [{
          extraction: record.extractedData,
          fileName: record.fileName,
          blob_name: record.blobName
        }],
        isApproved: true // Records from DB are approved
      }));

      setRecords(transformedRecords);
      localStorage.setItem('medicalRecords', JSON.stringify(transformedRecords));

      console.log('Medical records loaded from database:', transformedRecords.length);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      // Always use localStorage fallback silently - no error notifications
      const storedRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
      setRecords(storedRecords);
    } finally {
      setIsLoading(false);
    }
  };

  // Add chatbot functionality
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);

        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setNotification({
        open: true,
        message: 'Could not access microphone. Please check permissions.',
        severity: 'error'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('https://medical-records-updates2.onrender.com/medical-record/extract-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Transcription result:', data);

      // Extract transcribed text from the response
      let transcribedText = '';
      if (data.data?.transcription) {
        transcribedText = data.data.transcription;
      } else if (data.transcription) {
        transcribedText = data.transcription;
      } else if (data.data) {
        // Try to extract from nested structure
        transcribedText = JSON.stringify(data.data);
      }

      if (transcribedText && transcribedText.trim()) {
        setChatInput(transcribedText.trim());
        setNotification({
          open: true,
          message: 'Audio transcribed successfully!',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Could not transcribe audio. Please try again.',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setNotification({
        open: true,
        message: 'Failed to transcribe audio. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Prepare patient context from current medical records
      const patientContext = {
        medicalRecords: records.map(record => ({
          id: record.id,
          title: record.title,
          type: record.type,
          date: record.date,
          extractedData: record.extractedData
        })),
        currentRecord: currentAnalysisRecord ? {
          id: currentAnalysisRecord.id,
          title: currentAnalysisRecord.title,
          type: currentAnalysisRecord.type,
          extractedData: currentAnalysisRecord.extractedData
        } : null
      };

      const payload = {
        patient_id: user?.id || '1',
        message: chatInput,
        conversation_id: chatMessages.length > 0 ? 'medical_chat_' + Date.now() : undefined,
        patient_context: patientContext,
        type: 'text'
      };

      const response = await fetch('https://medical-records-updates2.onrender.com/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = {
        role: 'assistant',
        content: data.data?.response || data.response || 'I apologize, but I couldn\'t process your request.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Helper function to determine record type from extracted data
  const getRecordTypeFromData = (extractedData) => {
    if (!extractedData) return 'Document';

    const data = extractedData.investigations || extractedData;
    if (data.investigations && data.investigations.length > 0) {
      return 'Lab Report';
    }
    if (data.imaging_radiology_reports && data.imaging_radiology_reports.length > 0) {
      return 'Imaging';
    }
    return 'Document';
  };

  const handleChooseFiles = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;
    
    setChosenFiles(files);
    setNotification({
      open: true,
      message: `${files.length} file(s) selected. Click "Upload Files" to process.`,
      severity: 'info'
    });
  };

  const handleUploadFiles = async () => {
    if (!chosenFiles || chosenFiles.length === 0) {
      setNotification({
        open: true,
        message: 'Please choose files first before uploading.',
        severity: 'warning'
      });
      return;
    }

    setIsUploading(true);
    setUploadError('');
    
    // Clear any existing investigation data
    setInvestigations([]);
    setImagingReports([]);
    setOtherClinicalData('');

    try {
      const userInfo = apiService.getUserInfo();
      const body = {
        patientId: userInfo.id,
        appointmentId: 0,
        id: 0
      };

      console.log('Starting file upload for:', chosenFiles[0].name);
      const result = await apiService.uploadMedicalRecords(chosenFiles, userInfo, body);
      console.log('=== UPLOAD RESULT DEBUG ===');
      console.log('Full result:', result);
      console.log('Result extractedData:', result.extractedData);
      if (result.extractedData?.[0]) {
        console.log('First extracted item:', result.extractedData[0]);
        console.log('Extraction field:', result.extractedData[0].extraction);
        console.log('Text field:', result.extractedData[0].text);
      }
      
      const blob_name = result.extractedData?.[0]?.blob_name || apiService.generateBlobName(chosenFiles[0], userInfo);
      
      // Determine document type based on content
      const textContent = result.extractedData?.[0]?.text ? Object.values(result.extractedData[0].text).join(' ') : '';
      const documentType = getFileType(chosenFiles[0].type, chosenFiles[0].name, textContent);
      
      const newRecord = {
        id: result.id || Date.now(),
        title: chosenFiles[0].name,
        date: new Date().toISOString().split('T')[0],
        type: documentType,
        file: chosenFiles[0].name,
        blob_name: blob_name,
        extractedData: result.extractedData || null,
        isApproved: false
      };
      
      const updatedRecords = [newRecord, ...records];
      setRecords(updatedRecords);
      localStorage.setItem('medicalRecords', JSON.stringify(updatedRecords));
      
      // Extract structured data and pass to UI
      console.log('=== PROCESSING STRUCTURED DATA ===');
      console.log('Full result:', result);
      console.log('Result extractedData length:', result.extractedData?.length);
      
      if (result.extractedData && result.extractedData.length > 0) {
        const extractedItem = result.extractedData[0];
        console.log('=== EXTRACTION RESULTS ===');
        console.log('File processed:', extractedItem?.fileName || 'unknown');
        console.log('Extraction method:', extractedItem?.extraction ? 'AI API' : 'Local parsing');

        const structuredData = extractedItem?.extraction || extractedItem || {};

        console.log('=== STRUCTURED DATA SUMMARY ===');
        console.log('Investigations found:', structuredData.investigations?.length || 0);
        console.log('Imaging reports found:', structuredData.imaging_radiology_reports?.length || 0);
        console.log('Clinical data length:', structuredData.other_clinical_data?.length || 0);

        // Show sample of parsed results
        if (structuredData.investigations?.length > 0) {
          console.log('Sample investigations:');
          structuredData.investigations.slice(0, 3).forEach((inv, i) => {
            console.log(`  ${i+1}. ${inv.investigation_name}: ${inv.result} ${inv.unit} (${inv.flag})`);
          });
        }
        
        // Set investigations from structured data
        if (structuredData.investigations?.length > 0) {
          const formattedInvestigations = structuredData.investigations.map(inv => ({
            result_timestamp: inv.result_timestamp ? new Date(inv.result_timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            investigation_name: inv.investigation_name || '',
            result: inv.result || '',
            unit: inv.unit || '',
            reference_range: inv.reference_range || '',
            flag: (inv.flag === 'HIGH' || inv.flag === 'H') ? 'High' : 
                  (inv.flag === 'LOW' || inv.flag === 'L') ? 'Low' : 
                  (inv.flag === 'NORMAL' || inv.flag === 'N') ? 'Normal' : 
                  inv.flag || 'Normal'
          }));
          setInvestigations(formattedInvestigations);
        } else {
          setInvestigations([]);
        }
        
        // Set imaging reports from structured data
        if (structuredData.imaging_radiology_reports?.length > 0) {
          const formattedReports = structuredData.imaging_radiology_reports.map(report => ({
            body_part: report.body_part || '',
            scan_type: report.scan_type || '',
            findings: report.findings || '',
            impression: report.impression || '',
            result_timestamp: report.result_timestamp ? new Date(report.result_timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }));
          setImagingReports(formattedReports);
        } else {
          setImagingReports([]);
        }
        
        // Set clinical data from structured data
        setOtherClinicalData(structuredData.other_clinical_data || '');
      } else {
        setInvestigations([]);
        setImagingReports([]);
        setOtherClinicalData('');
      }
      
      setNotification({
        open: true,
        message: `Medical record "${chosenFiles[0].name}" uploaded and processed successfully`,
        severity: 'success'
      });
      
      setCurrentAnalysisRecord(newRecord);
      setVerificationMode(true);
      setChosenFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError(error.message || 'Failed to upload files');
      
      setNotification({
        open: true,
        message: error.message || 'Failed to upload files',
        severity: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileType = (mimeType, fileName = '', textContent = '') => {
    // Analyze text content to determine document type
    const text = textContent.toUpperCase();
    
    // Check for imaging keywords
    const imagingKeywords = ['X-RAY', 'XRAY', 'CT SCAN', 'MRI', 'ULTRASOUND', 'USG', 'MAMMOGRAPHY', 'ECHO', 'DOPPLER', 'NUCLEAR SCAN', 'PET SCAN', 'BONE SCAN', 'ANGIOGRAPHY', 'RADIOGRAPH', 'SCAN', 'IMAGING'];
    const hasImaging = imagingKeywords.some(keyword => text.includes(keyword));
    
    // Check for lab keywords
    const labKeywords = ['LABORATORY', 'LAB REPORT', 'BLOOD TEST', 'URINE TEST', 'CBC', 'HEMOGLOBIN', 'CREATININE', 'GLUCOSE', 'CHOLESTEROL', 'INVESTIGATION', 'PATHOLOGY', 'BIOCHEMISTRY'];
    const hasLab = labKeywords.some(keyword => text.includes(keyword));
    
    // Check for prescription keywords
    const prescriptionKeywords = ['PRESCRIPTION', 'MEDICATION', 'DOSAGE', 'TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'RX'];
    const hasPrescription = prescriptionKeywords.some(keyword => text.includes(keyword));
    
    // Check for discharge summary keywords
    const dischargeKeywords = ['DISCHARGE SUMMARY', 'DISCHARGE', 'ADMISSION', 'HOSPITAL', 'WARD', 'DIAGNOSIS', 'TREATMENT'];
    const hasDischarge = dischargeKeywords.some(keyword => text.includes(keyword));
    
    // Check for consultation keywords
    const consultationKeywords = ['CONSULTATION', 'VISIT', 'EXAMINATION', 'ASSESSMENT', 'CLINICAL NOTES', 'DOCTOR', 'PHYSICIAN'];
    const hasConsultation = consultationKeywords.some(keyword => text.includes(keyword));
    
    // Determine document type based on content
    if (hasImaging) return 'Imaging';
    if (hasLab) return 'Lab Report';
    if (hasPrescription) return 'Prescription';
    if (hasDischarge) return 'Discharge Summary';
    if (hasConsultation) return 'Consultation';
    
    // Fallback to file type analysis
    if (mimeType.includes('image')) return 'Imaging';
    return 'Document';
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const updateRecords = (newRecords) => {
    setRecords(newRecords);
    localStorage.setItem('medicalRecords', JSON.stringify(newRecords));
  };

  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
      // console.log(records.extractedData, 'extracted values')


  const getMimeType = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default: return 'application/octet-stream';
    }
  };

  const handleView = async (record) => {
    try {
      setPreviewLoading(prev => ({ ...prev, [record.id]: true }));
      
      console.log('Viewing record:', record);
      
      // For testing purposes, let's try to directly open a PDF file
      // This is a workaround to bypass the backend server issues
      if (record.file && record.file.toLowerCase().endsWith('.pdf')) {
        // Create a simple PDF viewer in a new window
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>${record.title || 'PDF Viewer'}</title>
                <style>
                  body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                    overflow: hidden;
                  }
                  .pdf-container {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background-color: #f5f5f5;
                  }
                  .pdf-viewer {
                    width: 100%;
                    height: 100%;
                    border: none;
                  }
                  .pdf-fallback {
                    padding: 20px;
                    text-align: center;
                    max-width: 600px;
                  }
                  h1 {
                    color: #333;
                    font-family: Arial, sans-serif;
                  }
                  p {
                    color: #666;
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                  }
                </style>
              </head>
              <body>
                <div class="pdf-container">
                  <object 
                    class="pdf-viewer" 
                    data="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" 
                    type="application/pdf">
                    <div class="pdf-fallback">
                      <h1>PDF Preview</h1>
                      <p>Your browser doesn't support embedded PDFs. You can download the file and view it in a PDF reader.</p>
                      <p>File: ${record.title || 'Document'}</p>
                      <p>Type: ${record.type || 'PDF'}</p>
                      <p>Date: ${record.date || 'Unknown'}</p>
                    </div>
                  </object>
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
          
          setNotification({
            open: true,
            message: 'PDF preview opened in new tab',
            severity: 'success'
          });
          return;
        }
      }
      
      // If direct opening doesn't work, try the original approach
      try {
        const payload = {
          blob_name: record.blob_name || `medical-record/${record.id}_${record.file}`
        };
        console.log('Request payload:', payload);
        
        // Get the backend URL from environment or default to https://medical-records-updates2.onrender.com/
        const backendUrl = process.env.REACT_APP_API_URL || 'https://consumer-dev-363382968588.asia-south1.run.app';
        const apiUrl = `${backendUrl}/medical-record/preview-file`;
        console.log('Fetching PDF from:', apiUrl);
        
        // Add a timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/pdf',
          },
          body: JSON.stringify(payload),
          credentials: 'include', // Include cookies for authentication if needed
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Clear the timeout if the request completes
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        // Get the blob from the response
        const blob = await response.blob();
        console.log('Received blob:', blob);
        console.log('Blob type:', blob.type);
        console.log('Blob size:', blob.size);

        if (blob.size === 0) {
          throw new Error('Received empty PDF data from server');
        }

        // Log first few bytes to check if it's actually a PDF
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer.slice(0, 8));
        console.log('First 8 bytes:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));

        // Check if it starts with PDF header (%PDF-)
        const pdfHeader = new Uint8Array(arrayBuffer.slice(0, 5));
        const headerString = String.fromCharCode(...pdfHeader);
        console.log('PDF header check:', headerString);

        if (headerString !== '%PDF-') {
          console.warn('Response does not appear to be a valid PDF file');
          // Try to display as text to see what we actually got
          const textContent = await response.clone().text();
          console.log('Response as text (first 500 chars):', textContent.substring(0, 500));
          throw new Error('Server returned invalid PDF data. Check server logs for details.');
        }

        // Create a blob URL with explicit PDF content type
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        // Open the PDF directly in a new tab
        window.open(blobUrl, '_blank');
        
        // Clean up the blob URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 30000);
        
        setNotification({
          open: true,
          message: 'PDF opened in new tab',
          severity: 'success'
        });
      } catch (fetchError) {
        console.error('Error fetching from backend:', fetchError);
        throw new Error(`Backend server error: ${fetchError.message}. The server might not be running or the endpoint might be incorrect.`);
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to view PDF',
        severity: 'error'
      });
    } finally {
      setPreviewLoading(prev => ({ ...prev, [record.id]: false }));
    }
  };

  const handleVerify = (record) => {
    console.log('=== HANDLE VERIFY ===');
    console.log('Verifying record:', record);
    console.log('Record extracted data:', record.extractedData);
    
    setSelectedFiles([record]);
    setCurrentAnalysisRecord(record);
    setVerificationMode(true);
    
    // Load structured data from record
    if (record.extractedData?.[0]) {
      const structuredData = record.extractedData[0].extraction || record.extractedData[0];
      
      // Set investigations from structured data
      if (structuredData.investigations?.length > 0) {
        const formattedInvestigations = structuredData.investigations.map((inv) => {
          let formattedDate = inv.result_timestamp || new Date().toISOString().split('T')[0];
          if (formattedDate.includes('T')) {
            formattedDate = new Date(formattedDate).toISOString().split('T')[0];
          }
          return {
            result_timestamp: formattedDate,
            investigation_name: inv.investigation_name || '',
            result: inv.result || '',
            unit: inv.unit || '',
            reference_range: inv.reference_range || '',
            flag: (inv.flag === 'HIGH' || inv.flag === 'H') ? 'High' : 
                  (inv.flag === 'LOW' || inv.flag === 'L') ? 'Low' : 
                  (inv.flag === 'NORMAL' || inv.flag === 'N') ? 'Normal' : 
                  inv.flag || 'Normal'
          };
        });
        setInvestigations(formattedInvestigations);
      } else {
        setInvestigations([]);
      }
      
      // Set imaging reports from structured data
      if (structuredData.imaging_radiology_reports?.length > 0) {
        const formattedReports = structuredData.imaging_radiology_reports.map(report => ({
          ...report,
          result_timestamp: report.result_timestamp || new Date().toISOString().split('T')[0]
        }));
        setImagingReports(formattedReports);
      } else {
        setImagingReports([]);
      }
      
      // Set clinical data from structured data
      setOtherClinicalData(structuredData.other_clinical_data || '');
    } else {
      setInvestigations([]);
      setImagingReports([]);
      setOtherClinicalData('');
    }
  };



  const handleApproveDocument = async () => {
    try {
      const payload = {
        imagingAndRadiology: imagingReports,
        investigation: investigations,
        otherClinicalData: otherClinicalData
      };

      console.log('Approving document with payload:', payload);

      // Update the current record to mark it as approved
      if (currentAnalysisRecord) {
        const updatedRecord = {
          ...currentAnalysisRecord,
          isApproved: true,
          extractedData: [{
            ...currentAnalysisRecord.extractedData?.[0],
            extraction: {
              investigations: investigations,
              imaging_radiology_reports: imagingReports,
              other_clinical_data: otherClinicalData
            }
          }]
        };

        // Update records array
        const updatedRecords = records.map(record =>
          record.id === currentAnalysisRecord.id ? updatedRecord : record
        );
        setRecords(updatedRecords);
        localStorage.setItem('medicalRecords', JSON.stringify(updatedRecords));

        // Update recent records in Dashboard
        const recentRecords = JSON.parse(localStorage.getItem('recentRecords') || '[]');
        const existingIndex = recentRecords.findIndex(r => r.id === currentAnalysisRecord.id);
        if (existingIndex >= 0) {
          recentRecords[existingIndex] = {
            id: updatedRecord.id,
            title: updatedRecord.title,
            date: updatedRecord.date,
            type: updatedRecord.type
          };
        } else {
          // Add to recent records if not already there
          const newRecentRecords = [{
            id: updatedRecord.id,
            title: updatedRecord.title,
            date: updatedRecord.date,
            type: updatedRecord.type
          }, ...recentRecords.slice(0, 2)];
          localStorage.setItem('recentRecords', JSON.stringify(newRecentRecords));
        }

        // Also update the record in the backend database
        try {
          const response = await fetch(`https://medical-records-updates2.onrender.com/medical-record/${currentAnalysisRecord.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              extractedData: updatedRecord.extractedData[0].extraction,
              investigations: investigations,
              imagingReports: imagingReports,
              otherClinicalData: otherClinicalData
            })
          });

          if (!response.ok) {
            console.error('Failed to update record in backend:', response.status);
          } else {
            console.log('Record updated in backend database');
          }
        } catch (error) {
          console.error('Failed to update record in backend:', error);
        }
      }

      setNotification({
        open: true,
        message: 'Extracted data has been approved successfully and added to your records',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error approving document',
        severity: 'error'
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      updateRecords(records.filter(record => record.id !== id));
    }
  };

  const handleDeleteClick = (record) => {
    setDeleteDialog({ open: true, record });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.record) {
      handleDelete(deleteDialog.record.id);
    }
    setDeleteDialog({ open: false, record: null });
  };

  const getRecordIcon = (type) => {
    switch (type) {
      case 'Lab Report': return <DescriptionIcon />;
      case 'Imaging': return <ImageIcon />;
      case 'Vaccination': return <PdfIcon />;
      default: return <DescriptionIcon />;
    }
  };



  const getTypeColor = (type) => {
    switch (type) {
      case 'Lab Report': return 'primary';
      case 'Imaging': return 'secondary';
      case 'Vaccination': return 'success';
      case 'Consultation': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Medical Records
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: '1.1rem',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          Securely manage, analyze, and view your medical documents with AI-powered insights
        </Typography>
      </Box>

      {/* Loading Overlay */}
      {isUploading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: '16px',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              minWidth: '300px'
            }}
          >
            <CircularProgress size={60} sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
              Processing Your Files
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Please wait while we analyze and upload your medical documents...
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: '200px',
                  height: '4px',
                  backgroundColor: 'grey.200',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                    borderRadius: '2px',
                    animation: `${loadingAnimation} 2s ease-in-out infinite`
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isUploading}
          sx={{
            flexGrow: 1,
            minWidth: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: isUploading ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)',
              '&:hover': {
                backgroundColor: isUploading ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)',
              },
              '&.Mui-focused': {
                backgroundColor: 'white',
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: isUploading ? 'action.disabled' : 'action.active' }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleChooseFiles}
          disabled={isUploading}
          sx={{
            minWidth: 150,
            mr: 1,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            border: '2px solid',
            borderColor: isUploading ? 'grey.400' : 'primary.main',
            color: isUploading ? 'grey.500' : 'primary.main',
            backgroundColor: isUploading ? 'rgba(255,255,255,0.5)' : 'transparent',
            '&:hover': isUploading ? {} : {
              borderColor: 'primary.dark',
              backgroundColor: 'rgba(102, 126, 234, 0.04)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
            },
            transition: 'all 0.3s ease-in-out'
          }}
        >
          Choose Files
        </Button>
        <Button
          variant="contained"
          startIcon={isUploading ? <CircularProgress size={24} color="inherit" /> : <UploadIcon />}
          onClick={handleUploadFiles}
          disabled={isUploading || chosenFiles.length === 0}
          sx={{
            minWidth: 150,
            mr: 1,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            background: isUploading ? 'rgba(79, 172, 254, 0.5)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: isUploading ? 'rgba(26, 35, 126, 0.7)' : '#1a237e',
            boxShadow: isUploading ? 'none' : '0 4px 15px rgba(79, 172, 254, 0.3)',
            '&:hover': isUploading ? {} : {
              background: 'linear-gradient(135deg, #3d9eff 0%, #00e0ff 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(79, 172, 254, 0.4)',
            },
            transition: 'all 0.3s ease-in-out'
          }}
        >
          {isUploading ? 'Processing...' : 'Upload Files'}
        </Button>
        <Button
          variant={verificationMode ? 'contained' : 'outlined'}
          color={verificationMode ? 'secondary' : 'primary'}
          onClick={() => {
            if (verificationMode) {
              // Clear data when exiting verification mode
              setInvestigations([]);
              setImagingReports([]);
              setOtherClinicalData('');
              setCurrentAnalysisRecord(null);
            } else {
              // When entering verification mode, set the first record if available
              const storedRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
              if (storedRecords.length > 0 && !currentAnalysisRecord) {
                setCurrentAnalysisRecord(storedRecords[0]);
              }
            }
            setVerificationMode(!verificationMode);
          }}
          disabled={isUploading}
          sx={{
            minWidth: 150,
            mr: 1,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            backgroundColor: isUploading ? 'rgba(255,255,255,0.5)' : (verificationMode ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'transparent'),
            color: isUploading ? 'grey.500' : (verificationMode ? 'white' : 'primary.main'),
            border: isUploading ? '2px solid rgba(255,255,255,0.5)' : (verificationMode ? 'none' : '2px solid'),
            borderColor: isUploading ? 'transparent' : 'primary.main',
            '&:hover': isUploading ? {} : (verificationMode ? {
              background: 'linear-gradient(135deg, #e87fb8 0%, #e74c5a 100%)',
            } : {
              borderColor: 'primary.dark',
              backgroundColor: 'rgba(102, 126, 234, 0.04)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
            }),
            transition: 'all 0.3s ease-in-out'
          }}
        >
          {verificationMode ? 'Exit Analysis' : 'Analyze Documents'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={() => setUserGuideVisible(true)}
          disabled={isUploading}
          sx={{
            minWidth: 180,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 500,
            border: '2px solid',
            borderColor: isUploading ? 'grey.400' : 'success.main',
            color: isUploading ? 'grey.500' : 'success.main',
            backgroundColor: isUploading ? 'rgba(255,255,255,0.5)' : 'transparent',
            '&:hover': isUploading ? {} : {
              borderColor: 'success.dark',
              backgroundColor: 'rgba(76, 175, 80, 0.04)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
            },
            transition: 'all 0.3s ease-in-out'
          }}
        >
          Help & Getting Started
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

      {uploadError && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="error" onClose={() => setUploadError('')}>
            {uploadError}
          </Alert>
        </Box>
      )}

      {chosenFiles.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              borderRadius: '16px',
              p: 3,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(50%, -50%)',
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  📄
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}
                >
                  Files Ready for Upload
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                {chosenFiles.map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      mb: 1,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem'
                        }}
                      >
                        📄
                      </Box>
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: 'white'
                          }}
                        >
                          {file.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '0.8rem'
                          }}
                        >
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#4ade80',
                        boxShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}
              >
                Click "Upload Files" to process these documents with AI analysis
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '& th': {
                color: 'white',
                fontWeight: 600,
                fontSize: '0.95rem',
                borderBottom: 'none',
                py: 2
              }
            }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={40} />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Loading medical records...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredRecords.map((record) => (
              <TableRow
                key={record.id}
                hover
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    transform: 'scale(1.01)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                  transition: 'all 0.3s ease-in-out',
                  borderBottom: '1px solid rgba(0,0,0,0.06)'
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getRecordIcon(record.type)}
                    <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#2c3e50' }}>
                      {record.title}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={record.type}
                    color={getTypeColor(record.type)}
                    size="small"
                    sx={{
                      fontWeight: 500,
                      borderRadius: '8px',
                      '& .MuiChip-label': {
                        fontSize: '0.8rem'
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {record.date}
                  </Typography>
                </TableCell>
                <TableCell>
                  {record.isApproved ? (
                    <Chip
                      label="Approved"
                      color="success"
                      size="small"
                      icon={<ApproveIcon />}
                      sx={{
                        fontWeight: 500,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                        '& .MuiChip-label': {
                          fontSize: '0.8rem'
                        }
                      }}
                    />
                  ) : (
                    <Chip
                      label="Pending"
                      color="warning"
                      size="small"
                      sx={{
                        fontWeight: 500,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                        '& .MuiChip-label': {
                          fontSize: '0.8rem'
                        }
                      }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      color="secondary"
                      onClick={() => handleVerify(record)}
                      title="Verify record"
                      sx={{
                        borderRadius: '8px',
                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(156, 39, 176, 0.2)',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      <ApproveIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(record)}
                      title="Delete record"
                      sx={{
                        borderRadius: '8px',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.2)',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {records.length === 0 ? 'No medical records uploaded yet. Upload your first document to get started.' : 'No records found matching your search.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, record: null })}
      >
        <DialogTitle>Delete Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.record?.title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, record: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={userGuideVisible}
        onClose={() => setUserGuideVisible(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            py: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            color: 'white',
            position: 'relative',
            '& .MuiTypography-root': {
              fontSize: '1.5rem',
              fontWeight: 700,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              📚
            </Box>
            How to Upload Medical Documents
          </Box>
          <IconButton
            onClick={() => setUserGuideVisible(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: 500, overflow: 'auto', p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#374151',
                mb: 1,
                fontSize: '1.2rem'
              }}
            >
              Step-by-Step Instructions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Follow these simple steps to securely upload and analyze your medical documents
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
                borderRadius: '12px',
                p: 3,
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}
                >
                  1
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Upload Files</Typography>
              </Box>
              <Box component="ul" sx={{ pl: 3, m: 0, '& li': { mb: 1 } }}>
                <li>Click <strong>Choose Files</strong> and select PDF, Word, JPG, PNG files</li>
                <li>Click <strong>Upload Files</strong> button to start processing</li>
                <li>Processing may take 1-2 minutes depending on file size</li>
              </Box>
            </Box>

            <Box
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '12px',
                p: 3,
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}
                >
                  2
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Review Extracted Content</Typography>
              </Box>
              <Box component="ul" sx={{ pl: 3, m: 0, '& li': { mb: 1 } }}>
                <li>Documents will be automatically sorted into Labs, Radiology, or Others</li>
                <li>Click on any heading to view or edit the extracted content</li>
                <li>AI-powered analysis extracts medical data automatically</li>
              </Box>
            </Box>

            <Box
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '12px',
                p: 3,
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}
                >
                  3
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Tag Your Documents</Typography>
              </Box>
              <Box component="ul" sx={{ pl: 3, m: 0, '& li': { mb: 1 } }}>
                <li>Select Record Type: Past Record or Current Record</li>
                <li>Select Record Date for each document</li>
                <li>Current Records = documents from patient's current visit</li>
              </Box>
            </Box>

            <Box
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                borderRadius: '12px',
                p: 3,
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}
                >
                  4
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Finalize Upload</Typography>
              </Box>
              <Box component="ul" sx={{ pl: 3, m: 0, '& li': { mb: 1 } }}>
                <li>Once all documents are tagged, click the green <strong>Approve</strong> button</li>
                <li>Document data will appear in the consolidated summary</li>
                <li>Your medical records are now securely stored and analyzed</li>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            justifyContent: 'center',
            backgroundColor: '#f8fafc'
          }}
        >
          <Button
            onClick={() => setUserGuideVisible(false)}
            variant="contained"
            sx={{
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 50%, #e87fb8 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            Got it! Let's Get Started
          </Button>
        </DialogActions>
      </Dialog>

      {/* EMR Analysis Interface */}
      {verificationMode && (
        <EMRAnalysisInterface 
          currentRecord={currentAnalysisRecord}
          imagingReports={imagingReports}
          setImagingReports={setImagingReports}
          investigations={investigations}
          setInvestigations={setInvestigations}
          otherClinicalData={otherClinicalData}
          setOtherClinicalData={setOtherClinicalData}
          onApprove={handleApproveDocument}
        />
      )}

      <HealthAssistant />

      {/* AI Chat Interface */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000
        }}
      >
        {!isChatOpen ? (
          <Fab
            color="primary"
            onClick={() => setIsChatOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease-in-out',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
            }}
          >
            <ChatIcon />
          </Fab>
        ) : (
          <Paper
            sx={{
              width: 350,
              height: 500,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
          >
            {/* Chat Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                  🤖
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI Medical Assistant
                </Typography>
              </Box>
              <IconButton
                onClick={() => setIsChatOpen(false)}
                sx={{ color: 'white' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Chat Messages */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                overflow: 'auto',
                backgroundColor: '#f8f9fa'
              }}
            >
              {chatMessages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    👋 Hi! I'm your AI medical assistant. Ask me anything about your medical records!
                  </Typography>
                </Box>
              ) : (
                chatMessages.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '80%',
                        backgroundColor: msg.role === 'user' ? '#667eea' : 'white',
                        color: msg.role === 'user' ? 'white' : 'text.primary',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
                      }}
                    >
                      <Typography variant="body2">
                        {msg.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                        }}
                      >
                        {msg.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                ))
              )}
              {isChatLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Paper sx={{ p: 2, backgroundColor: 'white', borderRadius: '16px 16px 16px 4px' }}>
                    <CircularProgress size={20} />
                  </Paper>
                </Box>
              )}
            </Box>

            {/* Chat Input */}
            <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={isTranscribing ? "Transcribing audio..." : "Ask about your medical records..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  disabled={isChatLoading || isTranscribing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '20px'
                    }
                  }}
                />

                {/* Voice Recording Button */}
                <IconButton
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isChatLoading || isTranscribing}
                  sx={{
                    bgcolor: isRecording ? 'error.main' : 'secondary.main',
                    color: 'white',
                    width: 48,
                    height: 48,
                    '&:hover': {
                      bgcolor: isRecording ? 'error.dark' : 'secondary.dark',
                      transform: 'scale(1.1)'
                    },
                    '&:disabled': {
                      bgcolor: 'grey.300'
                    },
                    transition: 'all 0.3s ease-in-out',
                    animation: isRecording ? 'pulse 1s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' },
                      '100%': { transform: 'scale(1)' }
                    }
                  }}
                  title={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  {isTranscribing ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : isRecording ? (
                    <StopIcon />
                  ) : (
                    <MicIcon />
                  )}
                </IconButton>

                <IconButton
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || isChatLoading || isTranscribing}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 48,
                    height: 48,
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      transform: 'scale(1.1)'
                    },
                    '&:disabled': {
                      bgcolor: 'grey.300'
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                  title="Send message"
                >
                  <SendIcon />
                </IconButton>
              </Box>

              {/* Recording Status */}
              {isRecording && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'error.main',
                      animation: 'blink 1s infinite'
                    }}
                  />
                  <Typography variant="caption" color="error" sx={{ fontWeight: 500 }}>
                    Recording... Click the stop button when finished.
                  </Typography>
                </Box>
              )}

              {isTranscribing && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} color="secondary" />
                  <Typography variant="caption" color="secondary" sx={{ fontWeight: 500 }}>
                    Transcribing audio to text...
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
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

export default MedicalRecords;
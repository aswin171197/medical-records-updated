import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  keyframes
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Chat as ChatIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Folder as FolderIcon,
  CalendarToday as CalendarIcon,
  Event as EventIcon,
  SmartToy as AssistantIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as MedicalIcon,
  Science as LabIcon,
  CameraAlt as ImagingIcon
} from '@mui/icons-material';

import apiService from '../services/apiService';

// Document Selector Component
const DocumentSelector = ({ currentRecord, onRecordSelect }) => {
  const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
  const [selectedRecordId, setSelectedRecordId] = useState('');

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
          value={currentRecord?.id || ''}
          onChange={handleRecordChange}
          label="Select Document to Analyze"
        >
          {records.map((record) => (
            <MenuItem key={record.id} value={record.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {record.type === 'Lab Report' && <DescriptionIcon fontSize="small" />}
                {record.type === 'Imaging' && <AssessmentIcon fontSize="small" />}
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

const Dashboard = ({ user }) => {
  const [recentRecords, setRecentRecords] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [chosenFiles, setChosenFiles] = useState([]);
  const fileInputRef = useRef(null);

  // EMR UI State
  const [imagingReports, setImagingReports] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [otherClinicalData, setOtherClinicalData] = useState('');
  const [verificationMode, setVerificationMode] = useState(false);
  const [currentAnalysisRecord, setCurrentAnalysisRecord] = useState(null);
  const [records, setRecords] = useState([]);

  // Manual record creation state
  const [manualRecordText, setManualRecordText] = useState('');
  const [manualRecordTitle, setManualRecordTitle] = useState('');
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);

  // Load recent records from localStorage on component mount
  useEffect(() => {
    const storedRecentRecords = JSON.parse(localStorage.getItem('recentRecords') || '[]');
    // Sort by date descending (most recent first)
    const sortedRecentRecords = storedRecentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    setRecentRecords(sortedRecentRecords);
  }, []);

  const handleChooseFiles = () => {
    // Trigger the hidden file input
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

    try {
      // Get user info from localStorage
      const userInfo = apiService.getUserInfo();
      const body = {
        patientId: userInfo.id,
        appointmentId: 0, // Default value if not available
        id: 0 // Default value for new record
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
            flag: inv.flag || 'NORMAL'
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

      // Update recent records in Dashboard - sort by date descending (most recent first)
      setRecentRecords(prev => {
        const updated = [newRecord, ...prev.slice(0, 2)];
        return updated.sort((a, b) => new Date(b.date) - new Date(a.date));
      });

      setNotification({
        open: true,
        message: `Medical record "${chosenFiles[0].name}" uploaded and processed successfully`,
        severity: 'success'
      });

      setCurrentAnalysisRecord(newRecord);
      setVerificationMode(true);
      setChosenFiles([]);

      // Navigate to medical records page after processing
      setTimeout(() => {
        window.location.href = '/medical-records';
      }, 2000);
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

  const handleCreateManualRecord = async () => {
    if (!manualRecordText.trim() || !manualRecordTitle.trim()) {
      setNotification({
        open: true,
        message: 'Please enter both title and medical information',
        severity: 'warning'
      });
      return;
    }

    setIsCreatingRecord(true);

    try {
      // Create a manual record
      const newRecord = {
        id: Date.now(),
        title: manualRecordTitle.trim(),
        date: new Date().toISOString().split('T')[0],
        type: 'Manual Entry',
        file: manualRecordTitle.trim(),
        blob_name: `manual-record/${Date.now()}_${manualRecordTitle.trim().replace(/\s+/g, '_')}`,
        extractedData: [{
          extraction: {
            investigations: [],
            imaging_radiology_reports: [],
            other_relevant_clinical_details: manualRecordText.trim()
          },
          text: {},
          recordId: Date.now()
        }],
        isApproved: true // Manual entries are auto-approved
      };

      const updatedRecords = [newRecord, ...records];
      setRecords(updatedRecords);
      localStorage.setItem('medicalRecords', JSON.stringify(updatedRecords));

      // Update recent records
      setRecentRecords(prev => {
        const updated = [newRecord, ...prev.slice(0, 2)];
        return updated.sort((a, b) => new Date(b.date) - new Date(a.date));
      });

      // Clear form
      setManualRecordText('');
      setManualRecordTitle('');

      setNotification({
        open: true,
        message: `Manual record "${newRecord.title}" created successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating manual record:', error);
      setNotification({
        open: true,
        message: 'Failed to create manual record',
        severity: 'error'
      });
    } finally {
      setIsCreatingRecord(false);
    }
  };

  // Function to get approved medical data for the bot
  const getApprovedMedicalData = () => {
    try {
      const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
      const approvedRecords = records.filter(record => record.isApproved);

      if (approvedRecords.length > 0) {
        // Combine all approved medical data
        const combinedData = approvedRecords.map(record => {
          if (record.extractedData?.[0]?.extraction) {
            const extraction = record.extractedData[0].extraction;

            let dataString = `Medical Record: ${record.title}\n`;

            // Add investigations
            if (extraction.investigations?.length > 0) {
              dataString += '\nLaboratory Investigations:\n';
              extraction.investigations.forEach(inv => {
                dataString += `- ${inv.investigation_name}: ${inv.result} ${inv.unit} (${inv.flag}) on ${inv.result_timestamp}\n`;
              });
            }

            // Add imaging reports
            if (extraction.imaging_radiology_reports?.length > 0) {
              dataString += '\nImaging and Radiology Reports:\n';
              extraction.imaging_radiology_reports.forEach(report => {
                dataString += `- ${report.body_part} ${report.scan_type}: ${report.findings} - ${report.impression} on ${report.result_timestamp}\n`;
              });
            }

            // Add clinical data
            if (extraction.other_clinical_data) {
              dataString += `\nOther Clinical Data:\n${extraction.other_clinical_data}\n`;
            }

            return dataString;
          }
          return '';
        }).filter(Boolean).join('\n---\n');

        return combinedData.trim() || null;
      }
    } catch (error) {
      console.error('Error getting approved medical data:', error);
    }
    return null;
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

        // Update recent records in Dashboard - sort by date descending (most recent first)
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
          recentRecords.unshift({
            id: updatedRecord.id,
            title: updatedRecord.title,
            date: updatedRecord.date,
            type: updatedRecord.type
          });
        }
        // Sort by date descending and keep only top 3
        const sortedRecentRecords = recentRecords
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3);
        localStorage.setItem('recentRecords', JSON.stringify(sortedRecentRecords));
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

  const getRecordIcon = (type) => {
    switch (type) {
      case 'Lab Report': return <DescriptionIcon />;
      case 'Imaging': return <AssessmentIcon />;
      case 'Consultation': return <ChatIcon />;
      default: return <DescriptionIcon />;
    }
  };

  return (
    <Box>
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
          Welcome back, {user.name}!
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
          Manage your medical records and get personalized health insights with our AI-powered assistant
        </Typography>
      </Box>

      {/* Health Assistant Grid - Featured at the top */}
      <Grid container spacing={2} sx={{ width: '100%', margin: 0, mb: 3 }}>
        <Grid item xs={12}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(50%, -50%)',
              }
            }}
          >
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                    <AssistantIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Health Assistant
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                      Your Personal Health Companion
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 500 }}>
                      Get instant answers about your medical records, health questions, and wellness guidance.
                      Available 24/7 to help you understand your health data better.
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '2px solid rgba(255,255,255,0.3)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                        border: '2px solid rgba(255,255,255,0.5)',
                      }
                    }}
                    startIcon={<AssistantIcon />}
                    onClick={() => {
                      // Trigger the health assistant modal
                      const event = new CustomEvent('openHealthAssistant');
                      window.dispatchEvent(event);
                    }}
                  >
                    Start Chat
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{
                      color: 'white',
                      border: '2px solid rgba(255,255,255,0.5)',
                      '&:hover': {
                        border: '2px solid white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      }
                    }}
                    component={Link}
                    to="/chat-history"
                  >
                    View Chat History
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Dashboard Grid */}
      <Grid container spacing={2} sx={{ width: '100%', margin: 0, mb: 3 }}>
        {/* Manual Record Creation */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    mr: 2,
                    width: 48,
                    height: 48,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  <EditIcon />
                </Avatar>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: 600,
                    color: '#2c3e50'
                  }}
                >
                  Quick Data Entry
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  lineHeight: 1.6,
                  fontSize: '0.95rem'
                }}
              >
                Type medical information directly to create a record instantly
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Record Title"
                  placeholder="e.g., Doctor Visit Notes, Symptoms"
                  value={manualRecordTitle}
                  onChange={(e) => setManualRecordTitle(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                    }
                  }}
                />

                <TextField
                  label="Medical Information"
                  multiline
                  rows={6}
                  placeholder="Enter symptoms, diagnosis, treatment notes, medications, or any medical information..."
                  value={manualRecordText}
                  onChange={(e) => setManualRecordText(e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                    }
                  }}
                />

                <Button
                  variant="contained"
                  onClick={handleCreateManualRecord}
                  disabled={!manualRecordText.trim() || !manualRecordTitle.trim() || isCreatingRecord}
                  startIcon={isCreatingRecord ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    },
                    '&:disabled': {
                      background: 'rgba(102, 126, 234, 0.3)',
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  {isCreatingRecord ? 'Creating...' : 'Create Record'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    mr: 2,
                    width: 48,
                    height: 48,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  <UploadIcon />
                </Avatar>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: 600,
                    color: '#2c3e50'
                  }}
                >
                  Upload Records
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  lineHeight: 1.6,
                  fontSize: '0.95rem'
                }}
              >
                Upload your medical documents, lab results, or imaging files securely
              </Typography>
            </CardContent>
            <CardActions sx={{ p: 3, pt: 0, flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, width: '100%', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  component={Link}
                  to="/medical-records"
                  sx={{
                    flex: 1,
                    minWidth: 150,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: '#1a237e',
                    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #3d9eff 0%, #00e0ff 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(79, 172, 254, 0.4)',
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  Upload File
                </Button>
              </Box>
            </CardActions>
            {chosenFiles.length > 0 && (
              <Box sx={{ p: 2, pt: 0 }}>
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
            {uploadError && (
              <Box sx={{ p: 2, pt: 0 }}>
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: '8px',
                    '& .MuiAlert-icon': {
                      color: '#d32f2f'
                    }
                  }}
                >
                  {uploadError}
                </Alert>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      mr: 2,
                      width: 48,
                      height: 48,
                      boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)'
                    }}
                  >
                    <FolderIcon sx={{ color: 'white' }} />
                  </Avatar>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      color: 'white'
                    }}
                  >
                    Recent Records
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to="/medical-records"
                  size="small"
                  sx={{
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.5)',
                    }
                  }}
                >
                  View All
                </Button>
              </Box>
              <List dense sx={{ color: 'white' }}>
                {recentRecords.map((record, index) => (
                  <React.Fragment key={record.id}>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            width: 40,
                            height: 40
                          }}
                        >
                          {getRecordIcon(record.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '0.95rem'
                            }}
                          >
                            {record.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '0.85rem'
                              }}
                            >
                              {record.date}
                            </Typography>
                            <Chip
                              label={record.type}
                              size="small"
                              variant="outlined"
                              sx={{
                                mt: 0.5,
                                color: 'white',
                                borderColor: 'rgba(255,255,255,0.5)',
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentRecords.length - 1 && (
                      <Divider
                        variant="inset"
                        component="li"
                        sx={{
                          borderColor: 'rgba(255,255,255,0.2)',
                          ml: 7
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats moved to bottom */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    mr: 2,
                    width: 48,
                    height: 48,
                    boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)'
                  }}
                >
                  <AssessmentIcon sx={{ color: 'white' }} />
                </Avatar>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: 600,
                    color: 'white'
                  }}
                >
                  Patient Summary
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6
                  }}
                >
                  AI-powered health insights and summary will be displayed here once you upload medical records
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      fontStyle: 'italic'
                    }}
                  >
                    Coming soon with advanced analytics
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

      {/* Health Assistant - Now clearly visible and accessible */}


      {/* Notification Snackbar */}
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

export default Dashboard;

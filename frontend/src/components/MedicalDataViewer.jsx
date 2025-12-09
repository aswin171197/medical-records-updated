import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Tabs,
  Tab,
  Button,
  Divider
} from '@mui/material';
import {
  Science as LabIcon,
  Person as PersonIcon,
  Image as ImagingIcon,
  Download as DownloadIcon,
  Description as NotesIcon
} from '@mui/icons-material';
import { 
  parseReactMedicalData, 
  formatForDisplay, 
  exportMedicalData 
} from '../utils/medicalDataParser';

/**
 * Medical Data Viewer Component
 * Displays parsed medical data in a structured format
 */
const MedicalDataViewer = ({ rawData }) => {
  const [parsedData, setParsedData] = useState(null);
  const [displayData, setDisplayData] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (rawData) {
      // Parse the raw React-style data
      const parsed = parseReactMedicalData(rawData);
      setParsedData(parsed);
      
      // Format for display
      const formatted = formatForDisplay(parsed);
      setDisplayData(formatted);
    }
  }, [rawData]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleExport = (format) => {
    if (!parsedData) return;
    
    let content;
    let filename;
    let mimeType;
    
    switch (format) {
      case 'json':
        content = exportMedicalData.toJSON(parsedData);
        filename = 'medical-report.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        content = exportMedicalData.toCSV(parsedData);
        filename = 'medical-report.csv';
        mimeType = 'text/csv';
        break;
      case 'html':
        content = exportMedicalData.toHTML(parsedData);
        filename = 'medical-report.html';
        mimeType = 'text/html';
        break;
      default:
        return;
    }
    
    // Create download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!displayData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No medical data to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with Export Options */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Medical Report Viewer
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('json')}
          >
            Export JSON
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('html')}
          >
            Export HTML
          </Button>
        </Box>
      </Box>

      {/* Patient Demographics Card */}
      <Card sx={{ mb: 3, backgroundColor: '#f8f9fa' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Patient Information
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Name</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {displayData.patient.name}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Age</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {displayData.patient.age}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Gender</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {displayData.patient.gender}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<LabIcon />} 
            label={`Lab Results (${displayData.tests.length})`} 
            iconPosition="start"
          />
          <Tab 
            icon={<ImagingIcon />} 
            label={`Imaging (${displayData.imaging.length})`}
            iconPosition="start"
          />
          <Tab 
            icon={<NotesIcon />} 
            label="Clinical Notes" 
            iconPosition="start"
          />
        </Tabs>

        {/* Lab Results Tab */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Test Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Reference Range</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayData.tests.map((test, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{test.name}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{test.result}</TableCell>
                      <TableCell>{test.reference}</TableCell>
                      <TableCell>
                        <Chip
                          label={test.status}
                          color={test.flag}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {displayData.tests.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No laboratory results found
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Imaging Tab */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            {displayData.imaging.length > 0 ? (
              displayData.imaging.map((report, index) => (
                <Card key={index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {report.type}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Body Part
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {report.bodyPart}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Summary
                        </Typography>
                        <Typography variant="body1">
                          {report.summary}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No imaging reports found
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Clinical Notes Tab */}
        {currentTab === 2 && (
          <Box sx={{ p: 3 }}>
            {displayData.notes ? (
              <Card sx={{ backgroundColor: '#f8f9fa' }}>
                <CardContent>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {displayData.notes}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No clinical notes available
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Metadata Footer */}
      <Card sx={{ backgroundColor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary">
            Document: {parsedData?.fileName} | 
            Pages: {parsedData?.metadata.pageCount} | 
            Extracted: {new Date(parsedData?.metadata.extractionDate).toLocaleString()}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MedicalDataViewer;

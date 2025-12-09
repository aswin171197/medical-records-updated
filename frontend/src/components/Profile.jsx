import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Visibility as ViewIcon,
  Science as LabIcon,
  Image as ImagingIcon
} from '@mui/icons-material';



// Medical Records History Component
const MedicalRecordsHistory = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecords = () => {
      try {
        const storedRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
        setRecords(storedRecords);
      } catch (error) {
        console.error('Error loading medical records:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRecords();
  }, []);

  const getRecordIcon = (type) => {
    switch (type) {
      case 'Lab Report': return <LabIcon sx={{ color: 'success.main' }} />;
      case 'Imaging': return <ImagingIcon sx={{ color: 'secondary.main' }} />;
      default: return <DescriptionIcon sx={{ color: 'primary.main' }} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Lab Report': return 'success';
      case 'Imaging': return 'secondary';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Medical Records History ({records.length} records)
      </Typography>
      
      {records.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Medical Records Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload your first medical document to get started
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {records.map((record) => (
            <Grid item xs={12} sm={6} md={4} key={record.id}>
              <Card
                sx={{
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getRecordIcon(record.type)}
                    <Typography
                      variant="h6"
                      sx={{
                        ml: 1,
                        fontWeight: 600,
                        fontSize: '1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}
                    >
                      {record.title}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={record.type}
                      color={getTypeColor(record.type)}
                      size="small"
                      sx={{ mb: 1, fontWeight: 500 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Date: {record.date}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip
                      label={record.isApproved ? 'Approved' : 'Pending'}
                      color={record.isApproved ? 'success' : 'warning'}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => {
                        // Store the selected record in sessionStorage for the MedicalRecords page
                        sessionStorage.setItem('selectedRecord', JSON.stringify(record));
                        // Navigate to medical records page
                        navigate('/medical-records');
                      }}
                      sx={{ textTransform: 'none' }}
                    >
                      View
                    </Button>
                  </Box>

                  {record.extractedData?.[0]?.extraction && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Content Summary:
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {record.extractedData[0].extraction.investigations?.length > 0 && (
                          <Chip
                            label={`${record.extractedData[0].extraction.investigations.length} Lab Tests`}
                            size="small"
                            variant="outlined"
                            color="success"
                          />
                        )}
                        {record.extractedData[0].extraction.imaging_radiology_reports?.length > 0 && (
                          <Chip
                            label={`${record.extractedData[0].extraction.imaging_radiology_reports.length} Imaging`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        )}
                        {record.extractedData[0].extraction.other_clinical_data && (
                          <Chip
                            label="Clinical Notes"
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

const Profile = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [fetchedUser, setFetchedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    mobile: user.mobile || '',
    age: user.age || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSuccessDialogOpen, setDeleteSuccessDialogOpen] = useState(false);

  useEffect(() => {
    // Mock loading profile from localStorage
    setFetchedUser(user);
    setLoading(false);
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mock update profile by updating localStorage
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        age: formData.age,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setFetchedUser(updatedUser);
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    // In a real app, this would update the password
    alert('Password changed successfully!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        onLogout();
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'https://medical-records-fullapp-3.onrender.com'}/auth/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear localStorage after successful deletion
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('medicalRecords');
        setDeleteSuccessDialogOpen(true);
        // Logout after a short delay to show the success message
        setTimeout(() => {
          onLogout();
        }, 3000);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete account: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete account. Please try again.');
    }
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!fetchedUser) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" color="error">
          Failed to load profile. Please try again.
        </Typography>
      </Box>
    );
  }

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
          User Profile
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
          Manage your account information, update your details, and secure your profile
        </Typography>
      </Box>

      <Card
        sx={{
          mb: 3,
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minHeight: '64px',
              borderRadius: '12px 12px 0 0',
              mx: 1,
              '&.Mui-selected': {
                backgroundColor: 'white',
                color: 'primary.main',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.8)',
              },
              transition: 'all 0.3s ease-in-out'
            },
            '& .MuiTabs-indicator': {
              display: 'none'
            }
          }}
        >
          <Tab
            value="profile"
            icon={<PersonIcon />}
            label="Profile Information"
            iconPosition="start"
            sx={{
              '& .MuiTab-iconWrapper': {
                mr: 1
              }
            }}
          />
          <Tab
            value="password"
            icon={<LockIcon />}
            label="Change Password"
            iconPosition="start"
            sx={{
              '& .MuiTab-iconWrapper': {
                mr: 1
              }
            }}
          />
          <Tab
            value="records"
            icon={<DescriptionIcon />}
            label="Medical Records"
            iconPosition="start"
            sx={{
              '& .MuiTab-iconWrapper': {
                mr: 1
              }
            }}
          />
        </Tabs>

        {activeTab === 'profile' && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 1 }}>
              {!isEditing ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleProfileSubmit}
                    color="success"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isEditing ? 'rgba(255,255,255,0.8)' : 'rgba(248,249,250,0.5)',
                      '&:hover': {
                        backgroundColor: isEditing ? 'rgba(255,255,255,0.9)' : 'rgba(248,249,250,0.5)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(248,249,250,0.3)',
                        color: 'text.secondary',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isEditing ? 'rgba(255,255,255,0.8)' : 'rgba(248,249,250,0.5)',
                      '&:hover': {
                        backgroundColor: isEditing ? 'rgba(255,255,255,0.9)' : 'rgba(248,249,250,0.5)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(248,249,250,0.3)',
                        color: 'text.secondary',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isEditing ? 'rgba(255,255,255,0.8)' : 'rgba(248,249,250,0.5)',
                      '&:hover': {
                        backgroundColor: isEditing ? 'rgba(255,255,255,0.9)' : 'rgba(248,249,250,0.5)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(248,249,250,0.3)',
                        color: 'text.secondary',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Age"
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isEditing ? 'rgba(255,255,255,0.8)' : 'rgba(248,249,250,0.5)',
                      '&:hover': {
                        backgroundColor: isEditing ? 'rgba(255,255,255,0.9)' : 'rgba(248,249,250,0.5)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(248,249,250,0.3)',
                        color: 'text.secondary',
                      }
                    }
                  }}
                />
              </Grid>

            </Grid>
          </CardContent>
        )}

        {activeTab === 'password' && (
          <CardContent>
            <Box component="form" onSubmit={handlePasswordSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.9)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'white',
                          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.9)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'white',
                          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    variant="outlined"
                    error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                    helperText={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== '' ? 'Passwords do not match' : ''}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.9)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'white',
                          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<LockIcon />}
                    disabled={passwordData.newPassword !== passwordData.confirmPassword}
                    sx={{ mt: 2 }}
                  >
                    Change Password
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        )}

        {activeTab === 'records' && (
          <CardContent>
            <MedicalRecordsHistory />
          </CardContent>
        )}
      </Card>

      <Box sx={{ textAlign: 'center', display: 'flex', gap: 3, justifyContent: 'center', mt: 4 }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialogOpen(true)}
          size="large"
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            border: '2px solid',
            borderColor: 'error.main',
            '&:hover': {
              borderColor: 'error.dark',
              backgroundColor: 'rgba(244, 67, 54, 0.04)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(244, 67, 54, 0.3)',
            },
            transition: 'all 0.3s ease-in-out'
          }}
        >
          Delete Account
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          size="large"
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            border: '2px solid',
            borderColor: 'primary.main',
            '&:hover': {
              borderColor: 'primary.dark',
              backgroundColor: 'rgba(102, 126, 234, 0.04)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
            },
            transition: 'all 0.3s ease-in-out'
          }}
        >
          Logout
        </Button>
      </Box>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Account
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data, including medical records and login information.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Account Deletion Success Dialog */}
      <Dialog
        open={deleteSuccessDialogOpen}
        onClose={() => setDeleteSuccessDialogOpen(false)}
        aria-labelledby="delete-success-dialog-title"
        aria-describedby="delete-success-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: 2,
            textAlign: 'center',
            minWidth: '400px'
          }
        }}
      >
        <DialogContent sx={{ pb: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)'
              }}
            >
              <DeleteIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography
              id="delete-success-dialog-title"
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 700,
                color: '#2c3e50',
                mb: 2
              }}
            >
              Account Deleted Successfully
            </Typography>
            <Typography
              id="delete-success-dialog-description"
              variant="body1"
              sx={{
                color: 'text.secondary',
                lineHeight: 1.6,
                mb: 2
              }}
            >
              Your account and all associated data have been permanently removed from our system.
              We appreciate you using our medical records management platform.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              You will be redirected to the login page shortly...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>


    </Box>
  );
};

export default Profile;

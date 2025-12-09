 import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PersonAdd as SignupIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { Select, MenuItem } from '@mui/material';
import OtpVerification from './OtpVerification';
import ForgotPassword from './ForgotPassword';


const Signup = ({ onSignup }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [signupMethod, setSignupMethod] = useState('password');
  const [countryCode, setCountryCode] = useState('+91');
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const countryCodes = [
    { code: '+1', flag: '🇺🇸', name: 'United States' },
    { code: '+1', flag: '🇨🇦', name: 'Canada' },
    { code: '+7', flag: '🇷🇺', name: 'Russia' },
    { code: '+20', flag: '🇪🇬', name: 'Egypt' },
    { code: '+27', flag: '🇿🇦', name: 'South Africa' },
    { code: '+30', flag: '🇬🇷', name: 'Greece' },
    { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
    { code: '+32', flag: '🇧🇪', name: 'Belgium' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+34', flag: '🇪🇸', name: 'Spain' },
    { code: '+36', flag: '🇭🇺', name: 'Hungary' },
    { code: '+39', flag: '🇮🇹', name: 'Italy' },
    { code: '+40', flag: '🇷🇴', name: 'Romania' },
    { code: '+41', flag: '🇨🇭', name: 'Switzerland' },
    { code: '+43', flag: '🇦🇹', name: 'Austria' },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '+45', flag: '🇩🇰', name: 'Denmark' },
    { code: '+46', flag: '🇸🇪', name: 'Sweden' },
    { code: '+47', flag: '🇳🇴', name: 'Norway' },
    { code: '+48', flag: '🇵🇱', name: 'Poland' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+51', flag: '🇵🇪', name: 'Peru' },
    { code: '+52', flag: '🇲🇽', name: 'Mexico' },
    { code: '+53', flag: '🇨🇺', name: 'Cuba' },
    { code: '+54', flag: '🇦🇷', name: 'Argentina' },
    { code: '+55', flag: '🇧🇷', name: 'Brazil' },
    { code: '+56', flag: '🇨🇱', name: 'Chile' },
    { code: '+57', flag: '🇨🇴', name: 'Colombia' },
    { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
    { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
    { code: '+63', flag: '🇵🇭', name: 'Philippines' },
    { code: '+64', flag: '🇳🇿', name: 'New Zealand' },
    { code: '+65', flag: '🇸🇬', name: 'Singapore' },
    { code: '+66', flag: '🇹🇭', name: 'Thailand' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' },
    { code: '+82', flag: '🇰🇷', name: 'South Korea' },
    { code: '+84', flag: '🇻🇳', name: 'Vietnam' },
    { code: '+86', flag: '🇨🇳', name: 'China' },
    { code: '+90', flag: '🇹🇷', name: 'Turkey' },
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
    { code: '+93', flag: '🇦🇫', name: 'Afghanistan' },
    { code: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
    { code: '+95', flag: '🇲🇲', name: 'Myanmar' },
    { code: '+98', flag: '🇮🇷', name: 'Iran' },
    { code: '+212', flag: '🇲🇦', name: 'Morocco' },
    { code: '+213', flag: '🇩🇿', name: 'Algeria' },
    { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
    { code: '+218', flag: '🇱🇾', name: 'Libya' },
    { code: '+220', flag: '🇬🇲', name: 'Gambia' },
    { code: '+221', flag: '🇸🇳', name: 'Senegal' },
    { code: '+222', flag: '🇲🇷', name: 'Mauritania' },
    { code: '+223', flag: '🇲🇱', name: 'Mali' },
    { code: '+224', flag: '🇬🇳', name: 'Guinea' },
    { code: '+225', flag: '🇨🇮', name: 'Ivory Coast' },
    { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
    { code: '+227', flag: '🇳🇪', name: 'Niger' },
    { code: '+228', flag: '🇹🇬', name: 'Togo' },
    { code: '+229', flag: '🇧🇯', name: 'Benin' },
    { code: '+230', flag: '🇲🇺', name: 'Mauritius' },
    { code: '+231', flag: '🇱🇷', name: 'Liberia' },
    { code: '+232', flag: '🇸🇱', name: 'Sierra Leone' },
    { code: '+233', flag: '🇬🇭', name: 'Ghana' },
    { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
    { code: '+235', flag: '🇹🇩', name: 'Chad' },
    { code: '+236', flag: '🇨🇫', name: 'Central African Republic' },
    { code: '+237', flag: '🇨🇲', name: 'Cameroon' },
    { code: '+238', flag: '🇨🇻', name: 'Cape Verde' },
    { code: '+239', flag: '🇸🇹', name: 'São Tomé and Príncipe' },
    { code: '+240', flag: '🇬🇶', name: 'Equatorial Guinea' },
    { code: '+241', flag: '🇬🇦', name: 'Gabon' },
    { code: '+242', flag: '🇨🇬', name: 'Republic of the Congo' },
    { code: '+243', flag: '🇨🇩', name: 'Democratic Republic of the Congo' },
    { code: '+244', flag: '🇦🇴', name: 'Angola' },
    { code: '+245', flag: '🇬🇼', name: 'Guinea-Bissau' },
    { code: '+246', flag: '🇮🇴', name: 'British Indian Ocean Territory' },
    { code: '+248', flag: '🇸🇨', name: 'Seychelles' },
    { code: '+249', flag: '🇸🇩', name: 'Sudan' },
    { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
    { code: '+251', flag: '🇪🇹', name: 'Ethiopia' },
    { code: '+252', flag: '🇸🇴', name: 'Somalia' },
    { code: '+253', flag: '🇩🇯', name: 'Djibouti' },
    { code: '+254', flag: '🇰🇪', name: 'Kenya' },
    { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
    { code: '+256', flag: '🇺🇬', name: 'Uganda' },
    { code: '+257', flag: '🇧🇮', name: 'Burundi' },
    { code: '+258', flag: '🇲🇿', name: 'Mozambique' },
    { code: '+260', flag: '🇿🇲', name: 'Zambia' },
    { code: '+261', flag: '🇲🇬', name: 'Madagascar' },
    { code: '+262', flag: '🇷🇪', name: 'Réunion' },
    { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
    { code: '+264', flag: '🇳🇦', name: 'Namibia' },
    { code: '+265', flag: '🇲🇼', name: 'Malawi' },
    { code: '+266', flag: '🇱🇸', name: 'Lesotho' },
    { code: '+267', flag: '🇧🇼', name: 'Botswana' },
    { code: '+268', flag: '🇸🇿', name: 'Eswatini' },
    { code: '+269', flag: '🇰🇲', name: 'Comoros' },
    { code: '+290', flag: '🇸🇭', name: 'Saint Helena' },
    { code: '+291', flag: '🇪🇷', name: 'Eritrea' },
    { code: '+297', flag: '🇦🇼', name: 'Aruba' },
    { code: '+298', flag: '🇫🇴', name: 'Faroe Islands' },
    { code: '+299', flag: '🇬🇱', name: 'Greenland' },
    { code: '+350', flag: '🇬🇮', name: 'Gibraltar' },
    { code: '+351', flag: '🇵🇹', name: 'Portugal' },
    { code: '+352', flag: '🇱🇺', name: 'Luxembourg' },
    { code: '+353', flag: '🇮🇪', name: 'Ireland' },
    { code: '+354', flag: '🇮🇸', name: 'Iceland' },
    { code: '+355', flag: '🇦🇱', name: 'Albania' },
    { code: '+356', flag: '🇲🇹', name: 'Malta' },
    { code: '+357', flag: '🇨🇾', name: 'Cyprus' },
    { code: '+358', flag: '🇫🇮', name: 'Finland' },
    { code: '+359', flag: '🇧🇬', name: 'Bulgaria' },
    { code: '+370', flag: '🇱🇹', name: 'Lithuania' },
    { code: '+371', flag: '🇱🇻', name: 'Latvia' },
    { code: '+372', flag: '🇪🇪', name: 'Estonia' },
    { code: '+373', flag: '🇲🇩', name: 'Moldova' },
    { code: '+374', flag: '🇦🇲', name: 'Armenia' },
    { code: '+375', flag: '🇧🇾', name: 'Belarus' },
    { code: '+376', flag: '🇦🇩', name: 'Andorra' },
    { code: '+377', flag: '🇲🇨', name: 'Monaco' },
    { code: '+378', flag: '🇸🇲', name: 'San Marino' },
    { code: '+380', flag: '🇺🇦', name: 'Ukraine' },
    { code: '+381', flag: '🇷🇸', name: 'Serbia' },
    { code: '+382', flag: '🇲🇪', name: 'Montenegro' },
    { code: '+383', flag: '🇽🇰', name: 'Kosovo' },
    { code: '+385', flag: '🇭🇷', name: 'Croatia' },
    { code: '+386', flag: '🇸🇮', name: 'Slovenia' },
    { code: '+387', flag: '🇧🇦', name: 'Bosnia and Herzegovina' },
    { code: '+389', flag: '🇲🇰', name: 'North Macedonia' },
    { code: '+420', flag: '🇨🇿', name: 'Czech Republic' },
    { code: '+421', flag: '🇸🇰', name: 'Slovakia' },
    { code: '+423', flag: '🇱🇮', name: 'Liechtenstein' },
    { code: '+500', flag: '🇫🇰', name: 'Falkland Islands' },
    { code: '+501', flag: '🇧🇿', name: 'Belize' },
    { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
    { code: '+503', flag: '🇸🇻', name: 'El Salvador' },
    { code: '+504', flag: '🇭🇳', name: 'Honduras' },
    { code: '+505', flag: '🇳🇮', name: 'Nicaragua' },
    { code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
    { code: '+507', flag: '🇵🇦', name: 'Panama' },
    { code: '+508', flag: '🇵🇲', name: 'Saint Pierre and Miquelon' },
    { code: '+509', flag: '🇭🇹', name: 'Haiti' },
    { code: '+590', flag: '🇬🇵', name: 'Guadeloupe' },
    { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
    { code: '+592', flag: '🇬🇾', name: 'Guyana' },
    { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
    { code: '+594', flag: '🇬🇫', name: 'French Guiana' },
    { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
    { code: '+596', flag: '🇲🇶', name: 'Martinique' },
    { code: '+597', flag: '🇸🇷', name: 'Suriname' },
    { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
    { code: '+599', flag: '🇧🇶', name: 'Caribbean Netherlands' },
    { code: '+670', flag: '🇹🇱', name: 'East Timor' },
    { code: '+672', flag: '🇦🇶', name: 'Antarctica' },
    { code: '+673', flag: '🇧🇳', name: 'Brunei' },
    { code: '+674', flag: '🇳🇷', name: 'Nauru' },
    { code: '+675', flag: '🇵🇬', name: 'Papua New Guinea' },
    { code: '+676', flag: '🇹🇴', name: 'Tonga' },
    { code: '+677', flag: '🇸🇧', name: 'Solomon Islands' },
    { code: '+678', flag: '🇻🇺', name: 'Vanuatu' },
    { code: '+679', flag: '🇫🇯', name: 'Fiji' },
    { code: '+680', flag: '🇵🇼', name: 'Palau' },
    { code: '+681', flag: '🇼🇫', name: 'Wallis and Futuna' },
    { code: '+682', flag: '🇨🇰', name: 'Cook Islands' },
    { code: '+683', flag: '🇳🇺', name: 'Niue' },
    { code: '+684', flag: '🇦🇸', name: 'American Samoa' },
    { code: '+685', flag: '🇼🇸', name: 'Samoa' },
    { code: '+686', flag: '🇰🇮', name: 'Kiribati' },
    { code: '+687', flag: '🇳🇨', name: 'New Caledonia' },
    { code: '+688', flag: '🇹🇻', name: 'Tuvalu' },
    { code: '+689', flag: '🇵🇫', name: 'French Polynesia' },
    { code: '+690', flag: '🇹🇰', name: 'Tokelau' },
    { code: '+691', flag: '🇫🇲', name: 'Micronesia' },
    { code: '+692', flag: '🇲🇭', name: 'Marshall Islands' },
    { code: '+850', flag: '🇰🇵', name: 'North Korea' },
    { code: '+852', flag: '🇭🇰', name: 'Hong Kong' },
    { code: '+853', flag: '🇲🇴', name: 'Macau' },
    { code: '+855', flag: '🇰🇭', name: 'Cambodia' },
    { code: '+856', flag: '🇱🇦', name: 'Laos' },
    { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
    { code: '+886', flag: '🇹🇼', name: 'Taiwan' },
    { code: '+960', flag: '🇲🇻', name: 'Maldives' },
    { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
    { code: '+962', flag: '🇯🇴', name: 'Jordan' },
    { code: '+963', flag: '🇸🇾', name: 'Syria' },
    { code: '+964', flag: '🇮🇶', name: 'Iraq' },
    { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+967', flag: '🇾🇪', name: 'Yemen' },
    { code: '+968', flag: '🇴🇲', name: 'Oman' },
    { code: '+970', flag: '🇵🇸', name: 'Palestine' },
    { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
    { code: '+972', flag: '🇮🇱', name: 'Israel' },
    { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
    { code: '+974', flag: '🇶🇦', name: 'Qatar' },
    { code: '+975', flag: '🇧🇹', name: 'Bhutan' },
    { code: '+976', flag: '🇲🇳', name: 'Mongolia' },
    { code: '+977', flag: '🇳🇵', name: 'Nepal' },
    { code: '+992', flag: '🇹🇯', name: 'Tajikistan' },
    { code: '+993', flag: '🇹🇲', name: 'Turkmenistan' },
    { code: '+994', flag: '🇦🇿', name: 'Azerbaijan' },
    { code: '+995', flag: '🇬🇪', name: 'Georgia' },
    { code: '+996', flag: '🇰🇬', name: 'Kyrgyzstan' },
    { code: '+998', flag: '🇺🇿', name: 'Uzbekistan' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for mobile number - only allow digits and limit to 10
    if (name === 'mobile') {
      const numericValue = value.replace(/\D/g, ''); // Remove all non-digits
      if (numericValue.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.age.trim()) {
        newErrors.age = 'Age is required';
    } else if (isNaN(formData.age) || formData.age <= 0 || formData.age > 120) {
        newErrors.age = 'Please enter a valid age (1-120)';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.mobile.trim()) {
        newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
        newErrors.mobile = 'Mobile number must be exactly 10 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      await performPasswordSignup();
    } catch (error) {
      setGeneralError(error.response?.data?.message || error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const performPasswordSignup = async () => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'https://medical-records-fullapp-3.onrender.com'}/auth/signup`, {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      mobile: countryCode + formData.mobile.replace(/\D/g, ''), // Combine country code with mobile
      age: parseInt(formData.age)
    });
    // After signup, redirect to login
    navigate('/login');
  };

  const handleOtpVerify = async (otp) => {
    setIsLoading(true);
    try {
      const mobile = countryCode + formData.mobile.replace(/\D/g, ''); // Combine country code with mobile
      const response = await axios.post(`${process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'https://medical-records-fullapp-3.onrender.com'}/auth/verify-otp-signup`, {
        mobile: mobile,
        otp: otp
      });

      // Backend returns { message, access_token, user }
      const { user, access_token } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      onSignup(user);
      setShowOtpDialog(false);
      navigate('/');
    } catch (error) {
      console.error('OTP verification error:', error);
      setGeneralError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Paper
            elevation={24}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 50%, #2563eb 100%)',
                backgroundSize: '200% 100%',
              }
            }}
          >
            {/* Logo/Icon Section */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 25px rgba(37, 99, 235, 0.2)',
                }}
              >
                <SignupIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  mb: 1,
                  fontWeight: 700,
                  color: '#1e293b',
                  textAlign: 'center'
                }}
              >
                Create Account
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#666',
                  textAlign: 'center',
                  fontWeight: 400
                }}
              >
                Join us to securely manage your medical records
              </Typography>
            </Box>

            {/* General Error Alert */}
            {generalError && (
              <Alert
                severity="error"
                sx={{
                  width: '100%',
                  mb: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)',
                  '& .MuiAlert-icon': {
                    color: '#f44336',
                  },
                }}
              >
                {generalError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              <Grid container spacing={3} sx={{ width: '100%', maxWidth: '700px' }}>
                {/* Full Name */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      Full Name *
                    </Typography>
                    <TextField
                      name="name"
                      required
                      fullWidth
                      id="name"
                      autoFocus
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#ef4444',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          marginTop: '6px',
                          marginLeft: 0,
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '16px 14px',
                          fontSize: '0.95rem',
                          color: '#374151',
                        },
                      }}
                    />
                  </Box>
                </Grid>

                {/* Age */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      Age *
                    </Typography>
                    <TextField
                      name="age"
                      required
                      fullWidth
                      id="age"
                      type="number"
                      placeholder="Enter your age"
                      value={formData.age}
                      onChange={handleChange}
                      error={!!errors.age}
                      helperText={errors.age}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#ef4444',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          marginTop: '6px',
                          marginLeft: 0,
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '16px 14px',
                          fontSize: '0.95rem',
                          color: '#374151',
                        },
                      }}
                    />
                  </Box>
                </Grid>



                {/* Email Address */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      Email Address *
                    </Typography>
                    <TextField
                      name="email"
                      required
                      fullWidth
                      id="email"
                      autoComplete="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <EmailIcon sx={{ color: '#667eea', mr: 1, fontSize: 20 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8fafc',
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '& fieldset': {
                            borderColor: '#e2e8f0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#ef4444',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          marginTop: '6px',
                          marginLeft: 0,
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '16px 14px',
                          fontSize: '0.95rem',
                          color: '#374151',
                        },
                      }}
                    />
                  </Box>
                </Grid>

                {/* Mobile Number */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      Mobile Number *
                    </Typography>
                    <TextField
                      name="mobile"
                      required
                      fullWidth
                      id="mobile"
                      placeholder="Enter your mobile number"
                      value={formData.mobile}
                      onChange={handleChange}
                      error={!!errors.mobile}
                      helperText={errors.mobile}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                            <PhoneIcon sx={{ color: '#667eea', fontSize: 20 }} />
                            <Select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              disabled={isLoading}
                              variant="standard"
                              disableUnderline
                              sx={{
                                width: 65,
                                '& .MuiSelect-select': {
                                  padding: '2px 4px',
                                  fontSize: '0.8rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: 'transparent',
                                  color: '#667eea',
                                  fontWeight: 600,
                                },
                                '& .MuiSelect-icon': {
                                  color: '#667eea',
                                  right: 0,
                                  fontSize: '1rem',
                                },
                              }}
                            >
                              {countryCodes.map((country) => (
                                <MenuItem key={country.code} value={country.code}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <span>{country.flag}</span>
                                    <span style={{ fontSize: '0.8rem' }}>{country.code}</span>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8fafc',
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '& fieldset': {
                            borderColor: '#e2e8f0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#ef4444',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          marginTop: '6px',
                          marginLeft: 0,
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '16px 14px',
                          fontSize: '0.95rem',
                          color: '#374151',
                        },
                      }}
                    />
                  </Box>
                </Grid>

                {/* Password */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      Password *
                    </Typography>
                    <TextField
                      name="password"
                      required
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      error={!!errors.password}
                      helperText={errors.password}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <LockIcon sx={{ color: '#667eea', mr: 1, fontSize: 20 }} />
                        ),
                        endAdornment: (
                          <Box
                            sx={{
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              mr: 1
                            }}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <VisibilityOff sx={{ color: '#667eea', fontSize: 20 }} />
                            ) : (
                              <Visibility sx={{ color: '#667eea', fontSize: 20 }} />
                            )}
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8fafc',
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '& fieldset': {
                            borderColor: '#e2e8f0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#ef4444',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          marginTop: '6px',
                          marginLeft: 0,
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '16px 14px',
                          fontSize: '0.95rem',
                          color: '#374151',
                        },
                      }}
                    />
                  </Box>
                </Grid>

                {/* Confirm Password */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      Confirm Password *
                    </Typography>
                    <TextField
                      name="confirmPassword"
                      required
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      disabled={isLoading}
                      InputProps={{
                        startAdornment: (
                          <LockIcon sx={{ color: '#667eea', mr: 1, fontSize: 20 }} />
                        ),
                        endAdornment: (
                          <Box
                            sx={{
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              mr: 1
                            }}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff sx={{ color: '#667eea', fontSize: 20 }} />
                            ) : (
                              <Visibility sx={{ color: '#667eea', fontSize: 20 }} />
                            )}
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8fafc',
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '& fieldset': {
                            borderColor: '#e2e8f0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            borderWidth: '2px',
                            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#ef4444',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          marginTop: '6px',
                          marginLeft: 0,
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '16px 14px',
                          fontSize: '0.95rem',
                          color: '#374151',
                        },
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>

              {/* Sign Up Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  mb: 3,
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#1d4ed8',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    backgroundColor: '#9ca3af',
                    boxShadow: 'none',
                    transform: 'none',
                  }
                }}
              >
                {isLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                    <span>Creating Account...</span>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SignupIcon sx={{ fontSize: 20 }} />
                    <span>Sign Up</span>
                  </Box>
                )}
              </Button>

              {/* Sign In Link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#6b7280',
                    fontSize: '0.9rem'
                  }}
                >
                  Already have an account?{' '}
                  <RouterLink
                    to="/login"
                    style={{
                      color: '#667eea',
                      textDecoration: 'none',
                      fontWeight: 600,
                      transition: 'color 0.2s ease-in-out'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#5a6fd8'}
                    onMouseLeave={(e) => e.target.style.color = '#667eea'}
                  >
                    Sign in
                  </RouterLink>
                </Typography>
              </Box>
            </Box>

            {/* OTP Verification Dialog */}
            <OtpVerification
              open={showOtpDialog}
              onClose={() => setShowOtpDialog(false)}
              onVerify={handleOtpVerify}
              emailOrMobile={isMobile || signupMethod === 'otp' ? `${countryCode} ${formData.emailOrMobile}` : formData.emailOrMobile}
              isLoading={isLoading}
            />

            {/* Forgot Password Dialog */}
            <ForgotPassword
              open={showForgotPasswordDialog}
              onClose={() => setShowForgotPasswordDialog(false)}
            />
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Signup;

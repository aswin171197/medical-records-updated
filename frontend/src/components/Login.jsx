import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  Link,
  Alert,
  Grid,
  Divider,
  IconButton,
  CircularProgress,

} from '@mui/material';
import {
  Login as LoginIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { Select, MenuItem } from '@mui/material';
import OtpVerification from './OtpVerification';
import ForgotPassword from './ForgotPassword';




const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrMobile: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showLabels, setShowLabels] = useState({
    emailOrMobile: true,
    password: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [loginMethod, setLoginMethod] = useState('password');
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [countryCode, setCountryCode] = useState('+91');
  const [showPassword, setShowPassword] = useState(false);

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

  // Check backend status on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:3000/'}/auth/test-token`, {
          timeout: 3000
        });
        setBackendStatus('online');
      } catch (error) {
        console.error('Backend status check failed:', error);
        setBackendStatus('offline');
      }
    };

    checkBackendStatus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For OTP login, filter out non-numeric characters
    let processedValue = value;
    if (name === 'emailOrMobile' && loginMethod === 'otp') {
      processedValue = value.replace(/\D/g, ''); // Only allow digits
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    // Hide label when user starts typing, show when field is empty
    setShowLabels(prev => ({
      ...prev,
      [name]: processedValue.trim() === ''
    }));

    // Detect if input is mobile number (digits, spaces, dashes allowed)
    if (name === 'emailOrMobile') {
      if (loginMethod === 'otp') {
        // For OTP login, always treat as mobile
        setIsMobile(true);
      } else {
        // For password login, detect based on input - switch to mobile as soon as digits are entered
        const cleaned = processedValue.replace(/[\s\-]/g, '');
        const isMobileInput = /^\+?\d+$/.test(cleaned) && cleaned.length > 0;
        setIsMobile(isMobileInput);
      }
    }
    // For non-emailOrMobile fields, maintain the current mobile state
    // Only reset to false if explicitly switching away from mobile input

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Debug: Log the value and icon type
    console.log('Input value:', processedValue, 'Field:', name, 'isMobile:', isMobile, 'loginMethod:', loginMethod);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.emailOrMobile.trim()) {
      newErrors.emailOrMobile = loginMethod === 'otp' ? 'Mobile number is required' : 'Email address is required';
    } else {
      if (loginMethod === 'otp') {
        // For OTP login, only validate as exactly 10 digits mobile
        const cleanNumber = formData.emailOrMobile.replace(/\D/g, '');
        if (cleanNumber.length !== 10) {
          newErrors.emailOrMobile = 'Please enter exactly 10 digits for mobile number';
        }
      } else {
        // For password login, only allow email
        if (!/\S+@\S+\.\S+/.test(formData.emailOrMobile)) {
          newErrors.emailOrMobile = 'Please enter a valid email address';
        }
      }
    }

    if (loginMethod === 'password' && !formData.password) {
      newErrors.password = 'Password is required';
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
      if (loginMethod === 'otp') {
        // Send OTP
        await sendOtp();
        setShowOtpDialog(true);
      } else {
        // Password login - ensure dialogs are closed
        setShowForgotPasswordDialog(false);
        setShowOtpDialog(false);
        await performPasswordLogin();
      }
    } catch (error) {
      setGeneralError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

const sendOtp = async () => {
  try {
    const mobile = countryCode + formData.emailOrMobile.replace(/\D/g, ''); // Combine country code with mobile
    const response = await axios.post(`${process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:3000/'}/auth/send-otp-login`, {
      mobile: mobile
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || (error.response?.status === 401 && error.response?.data?.message?.includes('not found'))) {
      throw new Error('Mobile number not found. Please check your mobile number or sign up for a new account.');
    }
    throw error;
  }
};

const performPasswordLogin = async () => {
  setShowForgotPasswordDialog(false);

  try {
    // For password login, always send as email
    const loginData = {
      email: formData.emailOrMobile,
      password: formData.password
    };

    const response = await axios.post(`${process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:3000/'}/auth/login`, loginData);
    console.log(response);
    // Backend returns { message, access_token, user }
    const { user, access_token } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    onLogin(user);
    navigate('/');
    return user;
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle different error types
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error(`Cannot connect to server. Please ensure the backend is running on ${process.env.REACT_APP_API_URL || 'http://localhost:3000/'}/`);
    } else if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;
      
      if (status === 404 || (status === 401 && (message?.includes('not found') || message?.includes('does not exist')))) {
        throw new Error('Email address not found. Please check your email or sign up for a new account.');
      } else if (status === 401) {
        // Check if it's a user not found case based on message content
        if (message?.toLowerCase().includes('user') && (message?.toLowerCase().includes('not found') || message?.toLowerCase().includes('does not exist'))) {
          throw new Error('Email address not found. Please check your email or sign up for a new account.');
        }
        throw new Error(message || 'Invalid email or password. Please try again.');
      } else if (status === 400) {
        throw new Error(message || 'Invalid request. Please check your email format.');
      } else {
        throw new Error(message || `Server error (${status}). Please try again later.`);
      }
    } else {
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
};

const handleOtpVerify = async (otp) => {
  setIsLoading(true);
  try {
    const mobile = countryCode + formData.emailOrMobile.replace(/\D/g, ''); // Combine country code with mobile
    const response = await axios.post(`${process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:3000/'}/auth/verify-otp-login`, {
      mobile: mobile,
      otp: otp
    });

    // Backend returns { message, access_token, user }
    const { user, access_token } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    onLogin(user);
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
      <Container component="main" maxWidth="sm">
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
            <Box sx={{ textAlign: 'center', mb: 3 }}>
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
                <LoginIcon sx={{ fontSize: 40, color: 'white' }} />
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
                Medical Records
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#666',
                  textAlign: 'center',
                  fontWeight: 400
                }}
              >
                Secure access to your health records
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
              {/* Login Method Toggle */}
              <Box sx={{
                display: 'flex',
                gap: 1,
                mb: 4,
                justifyContent: 'center',
                p: 1,
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(37, 99, 235, 0.1)'
              }}>
                <Button
                  variant={loginMethod === 'password' ? 'contained' : 'outlined'}
                  onClick={() => setLoginMethod('password')}
                  disabled={isLoading}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    backgroundColor: loginMethod === 'password' ? '#2563eb' : 'transparent',
                    color: loginMethod === 'password' ? 'white' : '#2563eb',
                    borderColor: '#2563eb',
                    '&:hover': {
                      backgroundColor: loginMethod === 'password' ? '#1d4ed8' : 'rgba(37, 99, 235, 0.08)',
                      borderColor: '#2563eb',
                    }
                  }}
                >
                  Password
                </Button>
                <Button
                  variant={loginMethod === 'otp' ? 'contained' : 'outlined'}
                  onClick={() => setLoginMethod('otp')}
                  disabled={isLoading}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    backgroundColor: loginMethod === 'otp' ? '#2563eb' : 'transparent',
                    color: loginMethod === 'otp' ? 'white' : '#2563eb',
                    borderColor: '#2563eb',
                    '&:hover': {
                      backgroundColor: loginMethod === 'otp' ? '#1d4ed8' : 'rgba(37, 99, 235, 0.08)',
                      borderColor: '#2563eb',
                    }
                  }}
                >
                  OTP Login
                </Button>
              </Box>

              {/* Email/Mobile Input */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 1.5,
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: '0.95rem'
                  }}
                >
                  {loginMethod === 'otp' ? 'Mobile Number' : 'Email Address'}
                </Typography>
                <TextField
                  fullWidth
                  id="emailOrMobile"
                  name="emailOrMobile"
                  type={loginMethod === 'otp' ? 'tel' : 'email'}
                  autoComplete={loginMethod === 'otp' ? 'tel' : 'email'}
                  autoFocus={loginMethod !== 'otp'}
                  value={formData.emailOrMobile}
                  onChange={handleChange}
                  error={!!errors.emailOrMobile}
                  helperText={errors.emailOrMobile}
                  disabled={isLoading}
                  placeholder={loginMethod === 'otp' ? 'Enter your mobile number' : 'Enter your email address'}
                  inputProps={{
                    maxLength: loginMethod === 'otp' ? 10 : undefined,
                    pattern: loginMethod === 'otp' ? '[0-9]*' : undefined,
                  }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                        {loginMethod === 'otp' ? (
                          <>
                            <PhoneIcon sx={{ color: '#2563eb', fontSize: 20 }} />
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
                                  color: '#2563eb',
                                  fontWeight: 600,
                                },
                                '& .MuiSelect-icon': {
                                  color: '#2563eb',
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
                          </>
                        ) : (
                          <EmailIcon sx={{ color: '#2563eb', fontSize: 20 }} />
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
                        borderColor: '#2563eb',
                        borderWidth: '2px',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2563eb',
                        borderWidth: '2px',
                        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'transparent',
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
                      '&::placeholder': {
                        color: '#9ca3af',
                        opacity: 1,
                      }
                    },
                  }}
                />
              </Box>



            {loginMethod === 'password' && (
              <>
                {showLabels.password && (
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      mb: 2,
                      color: '#333',
                      fontWeight: 'bold',
                      textAlign: 'left'
                    }}
                  >
                    Password
                  </Typography>
                )}

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <LockIcon sx={{ color: '#2563eb', mr: 1 }} />
                    ),
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#2563eb' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      marginTop: '6px',
                      marginLeft: 0,
                    },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '& fieldset': {
                        borderColor: '#e2e8f0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#2563eb',
                        borderWidth: '2px',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2563eb',
                        borderWidth: '2px',
                        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'transparent',
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '16px 14px',
                      fontSize: '0.95rem',
                      color: '#374151',
                      '&::placeholder': {
                        color: '#9ca3af',
                        opacity: 1,
                      }
                    },
                  }}
                />
              </>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
                sx={{ color: '#333' }}
              />
              <Link
                component="button"
                variant="body2"
                onClick={() => setShowForgotPasswordDialog(true)}
                sx={{
                  color: '#333',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  padding: 0,
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={16} /> : <LoginIcon />}
              disabled={isLoading}
              sx={{
                mt: 3,
                mb: 2,
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#1d4ed8',
                }
              }}
            >
              {isLoading ? 'Signing In...' : `Sign In ${loginMethod === 'otp' ? 'with OTP' : 'with Password'}`}
            </Button>
            




            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(51, 51, 51, 0.8)' }}>
                Don't have an account?{' '}
                <RouterLink
                  to="/signup"
                  style={{ color: '#333', textDecoration: 'underline', fontWeight: 'bold' }}
                >
                  Sign up
                </RouterLink>
              </Typography>
            </Box>
          </Box>

          {/* OTP Verification Dialog */}
          <OtpVerification
            open={showOtpDialog}
            onClose={() => setShowOtpDialog(false)}
            onVerify={handleOtpVerify}
            emailOrMobile={isMobile || loginMethod === 'otp' ? `${countryCode} ${formData.emailOrMobile}` : formData.emailOrMobile}
            isLoading={isLoading}
          />

          {/* Forgot Password Dialog */}
          <ForgotPassword
            open={showForgotPasswordDialog}
            onClose={() => setShowForgotPasswordDialog(false)}
          />
        </Paper>
      </Box>


      {/* Custom CSS for left-aligned input */}
      <style jsx>{`
        /* Ensure icons are visible */
        .left-aligned-input .MuiOutlinedInput-root .MuiInputAdornment-root .MuiSvgIcon-root {
          color: #667eea !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Basic left alignment for input text */
        .left-aligned-input .MuiOutlinedInput-input {
          text-align: left !important;
          color: #333 !important;
          direction: ltr !important;
          padding-left: 12px !important;
        }

        /* Ensure input starts properly with icons */
        .left-aligned-input .MuiOutlinedInput-inputAdornedStart {
          padding-left: 12px !important;
        }
      `}</style>
    </Container>
    </Box>
  );
};

export default Login;
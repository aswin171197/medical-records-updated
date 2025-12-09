import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { CheckCircle as SuccessIcon, Error as ErrorIcon } from '@mui/icons-material';
import HealthAssistant from './HealthAssistant';

const OtpVerification = ({ open, onClose, onVerify, emailOrMobile, isLoading = false }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (open) {
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(300);
      setCanResend(false);
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear error when user starts typing
    if (errors.otp) {
      setErrors({});
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }

    onVerify(otpValue);
  };

  const handleResend = () => {
    setTimeLeft(300);
    setCanResend(false);
    // In a real app, this would trigger a new OTP send
    console.log('Resending OTP to:', emailOrMobile);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Verify Your Account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          We've sent a 6-digit verification code to
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5 }}>
          {emailOrMobile}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {/* OTP Input Fields */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
            {otp.map((digit, index) => (
              <TextField
                key={index}
                inputRef={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                variant="outlined"
                sx={{
                  width: 50,
                  height: 50,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: errors.otp ? 'error.main' : 'primary.main',
                    },
                    '&:hover fieldset': {
                      borderColor: errors.otp ? 'error.main' : 'primary.dark',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: errors.otp ? 'error.main' : 'primary.main',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    padding: 0,
                  },
                }}
                inputProps={{
                  maxLength: 1,
                  style: { textAlign: 'center' }
                }}
              />
            ))}
          </Box>

          {errors.otp && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {errors.otp}
            </Alert>
          )}

          {/* Timer and Resend */}
          <Box sx={{ textAlign: 'center' }}>
            {!canResend ? (
              <Typography variant="body2" color="text.secondary">
                Resend code in {formatTime(timeLeft)}
              </Typography>
            ) : (
              <Button
                variant="text"
                onClick={handleResend}
                sx={{ textTransform: 'none' }}
              >
                Resend verification code
              </Button>
            )}
          </Box>

          {/* Instructions */}
          <Alert severity="info" sx={{ width: '100%' }}>
            <Typography variant="body2">
              Didn't receive the code? Check your spam folder or try resending.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isLoading}
          sx={{ flex: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          disabled={isLoading || otp.join('').length !== 6}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
          sx={{ flex: 1 }}
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OtpVerification;

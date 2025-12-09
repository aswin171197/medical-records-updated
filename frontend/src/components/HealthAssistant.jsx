import React, { useState, useEffect } from 'react';
import {
  Fab,
  Tooltip,
  Badge,
  Box,
  Typography,
  IconButton,
  Paper
} from '@mui/material';
import {
  SmartToy as AssistantIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon
} from '@mui/icons-material';
import ChatModal from './AiChatV3';

const HealthAssistant = ({ isMinimized = false, onToggleMinimize, triggerOpen = false, medicalData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [pulse, setPulse] = useState(true);

  // Handle external trigger to open the assistant
  useEffect(() => {
    if (triggerOpen && !isOpen) {
      setIsOpen(true);
      setShowWelcome(true);
    }
  }, [triggerOpen, isOpen]);

  // Listen for custom events to open the assistant
  useEffect(() => {
    const handleOpenAssistant = () => {
      setIsOpen(true);
      setShowWelcome(true);
    };

    window.addEventListener('openHealthAssistant', handleOpenAssistant);

    return () => {
      window.removeEventListener('openHealthAssistant', handleOpenAssistant);
    };
  }, []);

  // Stop pulsing after 10 seconds to avoid being annoying
  useEffect(() => {
    const timer = setTimeout(() => {
      setPulse(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowWelcome(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowWelcome(true);
  };

  return (
    <>
      {/* Main FAB Button */}
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Health Assistant
            </Typography>
            <Typography variant="body2">
              Get instant help with your health records and questions
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
              Click to start chatting • Available 24/7
            </Typography>
          </Box>
        }
        placement="left"
        arrow
      >
        <Fab
          color="success"
          aria-label="health-assistant"
          onClick={handleToggle}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            width: 64,
            height: 64,
            boxShadow: pulse
              ? '0 0 0 0 rgba(76, 175, 80, 0.7)'
              : '0 4px 20px rgba(76, 175, 80, 0.3)',
            animation: pulse ? 'pulse 2s infinite' : 'none',
            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
            '&:hover': {
              boxShadow: '0 6px 25px rgba(76, 175, 80, 0.4)',
              transform: 'scale(1.1)',
              background: 'linear-gradient(45deg, #66bb6a 30%, #4caf50 90%)',
            },
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <Badge
            color="error"
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#ff5722',
                color: 'white',
                boxShadow: '0 0 0 2px #fff',
                '&::after': {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  animation: 'ripple 1.2s infinite ease-in-out',
                  border: '1px solid currentColor',
                  content: '""',
                },
              },
            }}
          >
            <AssistantIcon sx={{ fontSize: 28 }} />
          </Badge>
        </Fab>
      </Tooltip>

      {/* Status Indicator */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          zIndex: 999,
          p: 1,
          borderRadius: 2,
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          opacity: showWelcome ? 1 : 0,
          transform: showWelcome ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.3s ease-in-out',
          pointerEvents: showWelcome ? 'auto' : 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssistantIcon sx={{ color: 'success.main', fontSize: 20 }} />
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              Health Assistant Online
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              Ready to help with your questions
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setShowWelcome(false)}
            sx={{ ml: 1 }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Paper>

      {/* Chat Modal */}
      {isOpen && (
        <ChatModal
          open={isOpen}
          onClose={handleClose}
        />
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }
        @keyframes ripple {
          0% {
            transform: scale(0.8);
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default HealthAssistant;

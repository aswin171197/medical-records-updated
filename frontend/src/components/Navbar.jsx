import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
  Tooltip,
  Badge
} from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon, SmartToy as AssistantIcon } from '@mui/icons-material';
import HealthAssistant from './HealthAssistant';

const Navbar = ({ user, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [triggerAssistant, setTriggerAssistant] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    onLogout();
    setMobileOpen(false);
  };

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  const handleAssistantClick = (e) => {
    e.preventDefault();
    setTriggerAssistant(true);
    // Reset the trigger after a short delay to allow for re-triggering
    setTimeout(() => setTriggerAssistant(false), 100);
  };

  const navItems = [
    { text: 'Dashboard', path: '/' },
    { text: 'Medical Records', path: '/medical-records' },
    { text: 'Chat History', path: '/chat-history' },
    { text: 'Profile', path: '/profile' }
  ];

  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        height: '100%',
        color: 'white'
      }}
    >
      <Typography
        variant="h6"
        sx={{
          my: 3,
          fontWeight: 700,
          fontSize: '1.4rem',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}
      >
        Medical Records App
      </Typography>
      <List sx={{ px: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              sx={{
                textAlign: 'center',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                mb: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                },
                transition: 'all 0.3s ease-in-out'
              }}
              onClick={handleLinkClick}
            >
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: '1rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={handleAssistantClick}
            sx={{
              textAlign: 'center',
              borderRadius: '10px',
              backgroundColor: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              mb: 1,
              '&:hover': {
                backgroundColor: 'rgba(74, 222, 128, 0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)',
              },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <AssistantIcon sx={{ color: '#4ade80' }} />
                  Health Assistant
                </Box>
              }
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '1rem'
              }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              textAlign: 'center',
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '1rem'
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        component="nav"
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Toolbar sx={{ minHeight: '64px', px: 3 }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: '1.5rem',
              letterSpacing: '0.5px',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              '&:hover': {
                textDecoration: 'none',
                color: 'rgba(255,255,255,0.9)',
                transform: 'scale(1.02)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            Medical Records App
          </Typography>

          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  onClick={handleLinkClick}
                  sx={{
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    textTransform: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      transition: 'left 0.5s ease-in-out',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      '&::before': {
                        left: '100%',
                      }
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  {item.text}
                </Button>
              ))}
              <Tooltip title="Health Assistant - Get instant help">
                <IconButton
                  onClick={handleAssistantClick}
                  sx={{
                    color: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    border: '1px solid rgba(74, 222, 128, 0.3)',
                    borderRadius: '10px',
                    p: 1,
                    mr: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(74, 222, 128, 0.2)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)',
                    },
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  <Badge color="error" variant="dot">
                    <AssistantIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Button
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  textTransform: 'none',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  },
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              borderTopRightRadius: '16px',
              borderBottomRightRadius: '16px',
              border: 'none'
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Health Assistant - Available globally across all pages */}
      <HealthAssistant triggerOpen={triggerAssistant} />
    </Box>
  );
};

export default Navbar;

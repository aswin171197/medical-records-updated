import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import MedicalRecords from './components/MedicalRecords';
import ChatHistory from './components/ChatHistory';
import HealthAssistant from './components/HealthAssistant';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import SetPassword from './components/SetPassword';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

const PrivateRoute = ({ user }) => {
  return user ? (
    <>
      <Outlet />
      <HealthAssistant />
    </>
  ) : <Navigate to="/login" replace />;
};

const NavbarWrapper = ({ user, onLogout }) => {
  const location = useLocation();
  const authRoutes = ['/login', '/signup'];

  if (!user || authRoutes.includes(location.pathname)) {
    return null;
  }

  return <Navbar user={user} onLogout={onLogout} />;
};

function App() {
  const [user, setUser] = useState(null);

  // Simulate user authentication persistence
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleSignup = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <NavbarWrapper user={user} onLogout={handleLogout} />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
            <Route element={<PrivateRoute user={user} />}>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/medical-records" element={<MedicalRecords user={user} />} />
              <Route path="/chat-history" element={<ChatHistory user={user} />} />
              <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
              <Route path="/set-password" element={<SetPassword />} />
            </Route>
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;

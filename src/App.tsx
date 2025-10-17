import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Language,
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './config/firebase';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import ScenarioSimulator from './components/ScenarioSimulator';
import BehavioralInsights from './components/BehavioralInsights';
import AutonomousAgents from './components/AutonomousAgents';
import InvestmentPortfolio from './components/InvestmentPortfolio';
import FinancialGoals from './components/FinancialGoals';
import FinancialInclusion from './components/FinancialInclusion';
import ExplainableAI from './components/ExplainableAI';
import UnifiedDataView from './components/UnifiedDataView';
import TaxOptimization from './components/TaxOptimization';
import CreditScoreMonitor from './components/CreditScoreMonitor';
import RiskAutoSellAgentSetup from './components/RiskAutoSellAgentSetup';
import DynamicAgentsHub from './components/DynamicAgentsHub';
import Profile from './components/Profile';
import Login from './components/Login';
import './App.css';

// Separate component for the layout that uses useLocation
function AppLayout() {
  const { user, setUser, darkMode, toggleDarkMode, language, setLanguage, chatOpen, setChatOpen } = useAppStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const location = useLocation();

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1e40af', // Deep professional blue
        light: '#3b82f6',
        dark: '#1e3a8a',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#64748b', // Neutral slate
        light: '#94a3b8',
        dark: '#475569',
      },
      success: {
        main: '#059669', // Emerald green
        light: '#10b981',
        dark: '#047857',
      },
      warning: {
        main: '#d97706', // Amber
        light: '#f59e0b',
        dark: '#b45309',
      },
      error: {
        main: '#dc2626', // Professional red
        light: '#ef4444',
        dark: '#b91c1c',
      },
      info: {
        main: '#0284c7', // Sky blue
        light: '#0ea5e9',
        dark: '#0369a1',
      },
      background: {
        default: darkMode ? '#0f172a' : '#f1f5f9', // Slate background
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#f1f5f9' : '#1e293b',
        secondary: darkMode ? '#94a3b8' : '#64748b',
      },
      divider: darkMode ? '#334155' : '#e2e8f0',
      grey: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Open Sans", "Helvetica Neue", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      subtitle1: {
        fontSize: '1rem',
        lineHeight: 1.5,
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        fontWeight: 500,
        fontSize: '0.875rem',
        textTransform: 'none',
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      ...Array(18).fill('none'),
    ] as any,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease-in-out',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: 'rgba(30, 64, 175, 0.04)',
            },
          },
          text: {
            '&:hover': {
              backgroundColor: 'rgba(30, 64, 175, 0.04)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            boxShadow: darkMode
              ? '0 4px 6px rgba(0, 0, 0, 0.3)'
              : '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
            '&:hover': {
              boxShadow: darkMode
                ? '0 10px 15px rgba(0, 0, 0, 0.4)'
                : '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          },
          elevation2: {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          },
          elevation3: {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'all 0.2s ease-in-out',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3b82f6',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            fontSize: '0.75rem',
            borderRadius: 6,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            height: 6,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
          },
        },
      },
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          preferredLanguage: language,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          consentGiven: [],
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: 'en' | 'hi' | 'te' | 'ta' | 'ml') => {
    setLanguage(lang);
    setLangAnchorEl(null);
  };

  const languageNames = {
    en: 'English',
    hi: 'हिंदी (Hindi)',
    te: 'తెలుగు (Telugu)',
    ta: 'தமிழ் (Tamil)',
    ml: 'മലയാളം (Malayalam)',
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* App Bar */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{
            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#f1f5f9' : '#1e293b',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
          }}
        >
            <Toolbar sx={{ py: 1 }}>
              <Typography 
                variant="h6" 
                component={Link} 
                to="/" 
                sx={{ 
                  flexGrow: 0, 
                  fontWeight: 700,
                  textDecoration: 'none',
                  color: 'primary.main',
                  mr: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  💰
                </Box>
                FinanceAI Pro
              </Typography>

              {user && (
                <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                  <Tabs 
                    value={
                      ["/", "/unified-data", "/portfolio", "/tax-optimization", "/credit-score-monitor", "/risk-agent"].includes(location.pathname) 
                        ? location.pathname 
                        : false
                    }
                    textColor="primary"
                    TabIndicatorProps={{
                      style: {
                        backgroundColor: '#1e40af',
                        height: 3,
                        borderRadius: '3px 3px 0 0',
                      }
                    }}
                    sx={{ 
                      '& .MuiTab-root': { 
                        color: darkMode ? '#94a3b8' : '#64748b',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        minHeight: 48,
                        textTransform: 'none',
                        px: 2,
                        '&:hover': {
                          color: darkMode ? '#f1f5f9' : '#1e293b',
                          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(30, 64, 175, 0.04)',
                        },
                      },
                      '& .Mui-selected': { 
                        color: '#1e40af',
                        fontWeight: 600,
                      }
                    }}
                  >
                    <Tab label="Dashboard" value="/" component={Link} to="/" />
                    <Tab label="Accounts" value="/unified-data" component={Link} to="/unified-data" />
                    <Tab label="Portfolio" value="/portfolio" component={Link} to="/portfolio" />
                    <Tab label="Tax" value="/tax-optimization" component={Link} to="/tax-optimization" />
                    <Tab label="Credit" value="/credit-score-monitor" component={Link} to="/credit-score-monitor" />
                    <Tab label="🤖 AI Agents" value="/dynamic-agents-hub" component={Link} to="/dynamic-agents-hub" />
                  </Tabs>
                </Box>
              )}

              {!user && <Box sx={{ flexGrow: 1 }} />}

              {user && (
                <>
                  {/* Language Selector */}
                  <IconButton
                    color="inherit"
                    onClick={(e) => setLangAnchorEl(e.currentTarget)}
                    sx={{ mr: 1 }}
                  >
                    <Language />
                  </IconButton>
                  <Menu
                    anchorEl={langAnchorEl}
                    open={Boolean(langAnchorEl)}
                    onClose={() => setLangAnchorEl(null)}
                  >
                    {Object.entries(languageNames).map(([code, name]) => (
                      <MenuItem
                        key={code}
                        onClick={() => handleLanguageChange(code as any)}
                        selected={language === code}
                      >
                        {name}
                      </MenuItem>
                    ))}
                  </Menu>

                  {/* Theme Toggle */}
                  <IconButton color="inherit" onClick={toggleDarkMode} sx={{ mr: 1 }}>
                    {darkMode ? <Brightness7 /> : <Brightness4 />}
                  </IconButton>

                  {/* User Menu */}
                  <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <AccountCircle />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                  >
                    <MenuItem disabled>
                      <Typography variant="body2">{user.email}</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { setAnchorEl(null); window.location.href = '/profile'; }}>
                      <AccountCircle fontSize="small" sx={{ mr: 1 }} />
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <Logout fontSize="small" sx={{ mr: 1 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              )}

              {!user && (
                <Button color="inherit" href="/login">
                  Login
                </Button>
              )}
            </Toolbar>
          </AppBar>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1 }}>
            <Routes>
              <Route
                path="/login"
                element={!user ? <Login /> : <Navigate to="/" replace />}
              />
              <Route
                path="/"
                element={
                  user ? (
                    <Dashboard />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route 
                path="/portfolio" 
                element={user ? <InvestmentPortfolio /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/goals" 
                element={user ? <FinancialGoals /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/scenario-simulator" 
                element={user ? <ScenarioSimulator /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/insights" 
                element={user ? <BehavioralInsights /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/agents" 
                element={user ? <AutonomousAgents /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/financial-inclusion" 
                element={user ? <FinancialInclusion /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/explainable-ai" 
                element={user ? <ExplainableAI /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/unified-data" 
                element={user ? <UnifiedDataView /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/tax-optimization" 
                element={user ? <TaxOptimization /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/credit-score-monitor" 
                element={user ? <CreditScoreMonitor /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/risk-agent" 
                element={user ? <RiskAutoSellAgentSetup /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/dynamic-agents-hub" 
                element={user ? <DynamicAgentsHub /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/profile" 
                element={user ? <Profile /> : <Navigate to="/" replace />} 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>

          {/* ChatBot Drawer */}
          {user && <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} />}

          {/* Footer */}
          <Box
            component="footer"
            sx={{
              py: 3,
              px: 2,
              mt: 'auto',
              backgroundColor: (theme) =>
                theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
            }}
          >
            <Container maxWidth="lg">
              <Typography variant="body2" color="text.secondary" align="center">
                © 2025 FinanceAI Pro - Built for Vibeathon Hackathon
              </Typography>
              <Typography variant="caption" color="text.secondary" align="center" display="block">
                Compliant with RBI guidelines • Secure • Privacy-first
              </Typography>
            </Container>
          </Box>
        </Box>
    </ThemeProvider>
  );
}

// Main App component with Router
function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;

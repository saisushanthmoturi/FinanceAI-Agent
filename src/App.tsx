import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Avatar,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Language,
  Logout,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { logoutUser, ensureUserProfile } from './services/authService';
import { useTranslation } from './hooks/useTranslation';


// Lazy load components for better performance
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
import AIFinancialAdvisor from './components/AIFinancialAdvisor';
import CreditScoreMonitor from './components/CreditScoreMonitor';
import RiskAutoSellAgentSetup from './components/RiskAutoSellAgentSetup';
import DynamicAgentsHub from './components/DynamicAgentsHub';
import StockMonitoringDashboard from './components/StockMonitoringDashboard';
import RiskMonitoringDashboard from './components/RiskMonitoringDashboard';
import EnhancedProfile from './components/EnhancedProfile';
import FinancialReport from './components/FinancialReport';
import Login from './components/Login';
import './App.css';

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    style={{ height: '100%', width: '100%' }}
  >
    {children}
  </motion.div>
);

function AppLayout() {
  const { user, setUser, darkMode, toggleDarkMode, language, setLanguage, chatOpen, setChatOpen } = useAppStore();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isMobile = useMediaQuery('(max-width:600px)');

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1e40af',
        light: '#3b82f6',
        dark: '#1e3a8a',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#64748b',
        light: '#94a3b8',
        dark: '#475569',
      },
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc',
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#f1f5f9' : '#1e293b',
        secondary: darkMode ? '#94a3b8' : '#64748b',
      },
    },
    typography: {
      fontFamily: '"Inter", "Outfit", system-ui, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontWeight: 800, letterSpacing: '-0.01em' },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 20px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          contained: {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 15px -3px rgba(30, 64, 175, 0.3)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            color: darkMode ? '#f1f5f9' : '#1e293b',
          },
        },
      },
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await ensureUserProfile(firebaseUser);
          setUser({
            id: userProfile.uid,
            email: userProfile.email,
            displayName: userProfile.displayName || 'User',
            preferredLanguage: language,
            createdAt: userProfile.createdAt,
            lastLoginAt: userProfile.lastLoginAt,
            consentGiven: [],
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            preferredLanguage: language,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            consentGiven: [],
          });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      if (user) await logoutUser(user.id);
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

  const menuItems = [
    { label: t('dashboard'), path: '/' },
    { label: t('report'), path: '/financial-report' },
    { label: t('portfolio'), path: '/portfolio' },
    { label: t('tax'), path: '/tax-optimization' },
    { label: t('agents'), path: '/dynamic-agents-hub' },
    { label: t('stocks'), path: '/stock-monitor' },
    { label: t('risk'), path: '/risk-monitor' },
  ];


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ py: 1, px: { xs: 2, md: 4 } }}>
            <Typography 
              variant="h6" 
              component={Link} 
              to="/" 
              sx={{ 
                fontWeight: 800,
                textDecoration: 'none',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mr: 4,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
                }}
              >
                💰
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>FinanceAI Pro</Box>
            </Typography>

            {user && !isMobile && (
              <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    sx={{
                      color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                      bgcolor: location.pathname === item.path ? 'rgba(30, 64, 175, 0.08)' : 'transparent',
                      fontWeight: location.pathname === item.path ? 700 : 500,
                      '&:hover': { bgcolor: 'rgba(30, 64, 175, 0.05)' },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Switch Theme">
                <IconButton onClick={toggleDarkMode}>
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
              
              {user && (
                <>
                  <Tooltip title="Language">
                    <IconButton onClick={(e) => setLangAnchorEl(e.currentTarget)}>
                      <Language />
                    </IconButton>
                  </Tooltip>
                  
                  <Box 
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      cursor: 'pointer',
                      ml: 1,
                      p: 0.5,
                      pr: 1.5,
                      borderRadius: 10,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: 'primary.main',
                        fontSize: '0.875rem',
                        fontWeight: 700
                      }}
                    >
                      {user.displayName?.[0] || 'U'}
                    </Avatar>
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                      <Typography variant="body2" fontWeight={700}>
                        {user.displayName}
                      </Typography>
                    </Box>
                    <KeyboardArrowDown fontSize="small" sx={{ color: 'text.secondary' }} />
                  </Box>
                </>
              )}

              {!user && location.pathname !== '/login' && (
                <Button variant="contained" component={Link} to="/login">
                  Sign In
                </Button>
              )}
            </Box>

            <Menu
              anchorEl={langAnchorEl}
              open={Boolean(langAnchorEl)}
              onClose={() => setLangAnchorEl(null)}
              PaperProps={{ sx: { borderRadius: 2, minWidth: 150, mt: 1.5 } }}
            >
              {[
                { code: 'en', name: 'English' },
                { code: 'hi', name: 'हिंदी' },
                { code: 'te', name: 'తెలుగు' },
                { code: 'ta', name: 'தமிழ்' },
                { code: 'ml', name: 'മലയാളം' }
              ].map((lang) => (
                <MenuItem 
                  key={lang.code} 
                  onClick={() => handleLanguageChange(lang.code as any)}
                  selected={language === lang.code}
                >
                  {lang.name}
                </MenuItem>
              ))}
            </Menu>


            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{ sx: { borderRadius: 2, minWidth: 200, mt: 1.5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>{user?.displayName}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>Profile Settings</MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, md: 4 } }}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/login" element={!user ? <PageWrapper><Login /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/" element={user ? <PageWrapper><Dashboard /></PageWrapper> : <Navigate to="/login" replace />} />
              <Route path="/financial-report" element={user ? <PageWrapper><FinancialReport /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/portfolio" element={user ? <PageWrapper><InvestmentPortfolio /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/goals" element={user ? <PageWrapper><FinancialGoals /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/scenario-simulator" element={user ? <PageWrapper><ScenarioSimulator /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/insights" element={user ? <PageWrapper><BehavioralInsights /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/agents" element={user ? <PageWrapper><AutonomousAgents /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/financial-inclusion" element={user ? <PageWrapper><FinancialInclusion /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/explainable-ai" element={user ? <PageWrapper><ExplainableAI /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/unified-data" element={user ? <PageWrapper><UnifiedDataView /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/tax-optimization" element={user ? <PageWrapper><TaxOptimization /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/ai-financial-advisor" element={user ? <PageWrapper><AIFinancialAdvisor /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/credit-score-monitor" element={user ? <PageWrapper><CreditScoreMonitor /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/risk-agent" element={user ? <PageWrapper><RiskAutoSellAgentSetup /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/dynamic-agents-hub" element={user ? <PageWrapper><DynamicAgentsHub /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/stock-monitor" element={user ? <PageWrapper><StockMonitoringDashboard /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/risk-monitor" element={user ? <PageWrapper><RiskMonitoringDashboard /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="/profile" element={user ? <PageWrapper><EnhancedProfile /></PageWrapper> : <Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Box>

        {user && <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} />}

        <Box component="footer" sx={{ py: 4, px: 2, bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderTop: '1px solid', borderColor: 'divider' }}>
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary" align="center" fontWeight={600}>
              © 2025 FinanceAI Pro • Enterprise Intelligence Platform
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1, opacity: 0.8 }}>
              Bank-grade security • RBI Regulated • SOC 2 Certified
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;


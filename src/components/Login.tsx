import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link as MuiLink,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  Email,
  Lock,
} from '@mui/icons-material';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // For demo purposes - bypass authentication
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f8fafc',
      }}
    >
      {/* Left Side - Branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          p: 6,
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: 'white',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
              }}
            >
              💰
            </Box>
            <Typography variant="h4" fontWeight={700}>
              FinanceAI Pro
            </Typography>
          </Box>
          
          <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
            Corporate Finance
            <br />
            Intelligence Platform
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, maxWidth: 480 }}>
            Advanced AI-powered financial analytics, portfolio management, and intelligent automation
            for modern finance professionals.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              'Real-time financial data aggregation',
              'AI-driven insights and recommendations',
              'Tax optimization and credit monitoring',
              'Enterprise-grade security & compliance',
            ].map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✓
                </Box>
                <Typography variant="body2">{feature}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          © 2025 FinanceAI Pro • Trusted by finance professionals worldwide
        </Typography>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={2}
            sx={{
              p: 5,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Header */}
            <Box mb={4}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isSignUp 
                  ? 'Start your journey with enterprise finance intelligence' 
                  : 'Sign in to access your financial dashboard'}
              </Typography>
            </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin}>
            <TextField
              fullWidth
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {isSignUp && (
              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mb: 2.5,
                fontSize: '0.938rem',
                fontWeight: 600,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
              or continue with
            </Typography>
          </Divider>

          {/* Social Login */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<Google />}
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{ mb: 2.5, py: 1.5 }}
          >
            Google Workspace
          </Button>

          {/* Demo Mode */}
          <Button
            fullWidth
            variant="text"
            size="large"
            onClick={handleDemoLogin}
            disabled={loading}
            sx={{
              mb: 3,
              py: 1.5,
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(30, 64, 175, 0.04)',
              },
            }}
          >
            Try Demo Account →
          </Button>

          {/* Toggle Sign Up/Sign In */}
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <MuiLink
                component="button"
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                sx={{ 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </MuiLink>
            </Typography>
          </Box>

          {/* Security Badge */}
          <Alert 
            severity="info" 
            icon={<Lock sx={{ fontSize: 18 }} />} 
            sx={{ 
              mt: 4,
              borderRadius: 2,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              '& .MuiAlert-icon': {
                color: '#64748b',
              }
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Enterprise-grade security • RBI compliant • SOC 2 certified • GDPR ready
            </Typography>
          </Alert>
          </Paper>

          {/* Footer Note */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: 'block', textAlign: 'center' }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Login;

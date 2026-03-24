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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  Email,
  Lock,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  type RegistrationData,
} from '../services/authService';
import { useTranslation } from '../hooks/useTranslation';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const registrationData: RegistrationData = {
          email,
          password,
          displayName: displayName.trim(),
        };

        await registerUser(registrationData);
        setSuccess('Account created successfully!');
        setTimeout(() => navigate('/'), 1500);
      } else {
        await loginUser({ email, password });
        setSuccess('Login successful!');
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Left Side - Hero Section */}
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
            <Box sx={{ fontSize: '2rem' }}>💰</Box>
            <Typography variant="h4" fontWeight={800}>FinanceAI Pro</Typography>
          </Box>
          
          <Typography variant="h3" fontWeight={800} gutterBottom sx={{ mb: 3, lineHeight: 1.2 }}>
            {t('hero.title')}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 6, opacity: 0.9, fontSize: '1.1rem', maxWidth: 500 }}>
            {t('hero.subtitle')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {(t('hero.features') as string[]).map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  width: 28, height: 28, borderRadius: '50%', 
                  bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center' 
                }}>✓</Box>
                <Typography variant="body1">{feature}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          © 2025 FinanceAI Pro • {t('hero.trusted')}
        </Typography>
      </Box>

      {/* Right Side - Auth Form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Box mb={4} textAlign="center">
              <Typography variant="h4" fontWeight={800} gutterBottom>
                {isSignUp ? t('auth.signUp') : t('auth.signIn')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isSignUp ? 'Create your professional account' : 'Welcome back! Please enter your details'}
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Google />}
              onClick={handleGoogleLogin}
              sx={{ mb: 3, py: 1.5, borderRadius: 2, color: 'text.primary', borderColor: '#e2e8f0' }}
            >
              {t('auth.google')}
            </Button>

            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">{t('auth.or')}</Typography>
            </Divider>

            <form onSubmit={handleEmailLogin}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {isSignUp && (
                  <TextField
                    fullWidth
                    label={t('auth.name')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment>,
                    }}
                  />
                )}

                <TextField
                  fullWidth
                  label={t('auth.email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment>,
                  }}
                />

                <TextField
                  fullWidth
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {isSignUp && (
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={loading}
                  sx={{ mt: 2, py: 1.5, borderRadius: 2, fontWeight: 700 }}
                >
                  {loading ? <CircularProgress size={24} /> : (isSignUp ? t('auth.signUp') : t('auth.signIn'))}
                </Button>
              </Box>
            </form>

            <Box mt={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Button 
                  onClick={() => setIsSignUp(!isSignUp)} 
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  {isSignUp ? t('auth.signIn') : t('auth.signUp')}
                </Button>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Login;

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Security,
  AccountBalance,
  Visibility,
  VisibilityOff,
  Lock,
  CheckCircle,
  Verified,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import type { UserBankAccount } from '../types/bank';
import ActivityLogViewer from './ActivityLogViewer';

const Profile: React.FC = () => {
  const { user, language } = useAppStore();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [verificationDialog, setVerificationDialog] = useState(false);
  const [verificationPassword, setVerificationPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<UserBankAccount[]>([]);

  // Load bank accounts (in production, fetch from Firestore)
  useEffect(() => {
    if (user) {
      loadBankAccounts();
    }
  }, [user]);

  const loadBankAccounts = async () => {
    // In production, fetch from Firestore
    // For demo, using mock data
    const mockAccounts: UserBankAccount[] = [
      {
        id: 'bank-1',
        userId: user?.id || '',
        accountHolderName: user?.displayName || 'John Doe',
        bankName: 'HDFC Bank',
        accountNumber: '50100012345678',
        ifscCode: 'HDFC0001234',
        accountType: 'savings',
        branch: 'Mumbai Main',
        isPrimary: true,
        isVerified: true,
        addedAt: new Date('2024-01-15'),
        lastUpdated: new Date('2024-01-15'),
      },
      {
        id: 'bank-2',
        userId: user?.id || '',
        accountHolderName: user?.displayName || 'John Doe',
        bankName: 'ICICI Bank',
        accountNumber: '00112233445566',
        ifscCode: 'ICIC0000123',
        accountType: 'current',
        branch: 'Delhi Branch',
        isPrimary: false,
        isVerified: true,
        addedAt: new Date('2024-03-20'),
        lastUpdated: new Date('2024-03-20'),
      },
    ];
    setBankAccounts(mockAccounts);
  };

  const handleVerifyPassword = () => {
    // In production, verify against Firebase Auth
    // For demo, accept any password matching "password" or email
    if (verificationPassword === 'password' || verificationPassword === user?.email) {
      setIsVerified(true);
      setShowBankDetails(true);
      setVerificationDialog(false);
      setVerificationError('');
      setVerificationPassword('');
    } else {
      setVerificationError(
        language === 'en' 
          ? 'Incorrect password. Please try again.' 
          : 'गलत पासवर्ड। कृपया पुन: प्रयास करें।'
      );
    }
  };

  const handleRequestBankDetails = () => {
    if (isVerified) {
      setShowBankDetails(true);
    } else {
      setVerificationDialog(true);
    }
  };

  const handleCloseBankDetails = () => {
    setShowBankDetails(false);
    setIsVerified(false);
  };

  const maskAccountNumber = (accountNumber: string) => {
    const visible = accountNumber.slice(-4);
    return `****${visible}`;
  };

  const content = {
    en: {
      title: 'My Profile',
      subtitle: 'Manage your account information and settings',
      personalInfo: 'Personal Information',
      bankAccounts: 'Bank Accounts',
      viewBankDetails: 'View Bank Details',
      hideBankDetails: 'Hide Bank Details',
      verifyPassword: 'Verify Password to View',
      passwordVerification: 'Password Verification',
      enterPassword: 'Enter your password to view sensitive bank details',
      password: 'Password',
      verify: 'Verify',
      cancel: 'Cancel',
      accountNumber: 'Account Number',
      ifscCode: 'IFSC Code',
      accountType: 'Account Type',
      branch: 'Branch',
      primary: 'Primary',
      verified: 'Verified',
      addedOn: 'Added on',
      securityNote: 'For your security, bank details are masked until verified.',
      incorrectPassword: 'Incorrect password. Please try again.',
    },
    hi: {
      title: 'मेरा प्रोफाइल',
      subtitle: 'अपनी खाता जानकारी और सेटिंग्स प्रबंधित करें',
      personalInfo: 'व्यक्तिगत जानकारी',
      bankAccounts: 'बैंक खाते',
      viewBankDetails: 'बैंक विवरण देखें',
      hideBankDetails: 'बैंक विवरण छिपाएं',
      verifyPassword: 'देखने के लिए पासवर्ड सत्यापित करें',
      passwordVerification: 'पासवर्ड सत्यापन',
      enterPassword: 'संवेदनशील बैंक विवरण देखने के लिए अपना पासवर्ड दर्ज करें',
      password: 'पासवर्ड',
      verify: 'सत्यापित करें',
      cancel: 'रद्द करें',
      accountNumber: 'खाता संख्या',
      ifscCode: 'IFSC कोड',
      accountType: 'खाता प्रकार',
      branch: 'शाखा',
      primary: 'प्राथमिक',
      verified: 'सत्यापित',
      addedOn: 'जोड़ा गया',
      securityNote: 'आपकी सुरक्षा के लिए, बैंक विवरण सत्यापित होने तक मास्क किए जाते हैं।',
      incorrectPassword: 'गलत पासवर्ड। कृपया पुन: प्रयास करें।',
    },
  };

  const t = content[language as keyof typeof content] || content.en;

  if (!user) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          {t.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t.subtitle}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" sx={{ py: 3 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.main',
                    fontSize: '3rem',
                    mb: 2,
                  }}
                >
                  {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {user.displayName || 'User'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                <Chip
                  icon={<Verified />}
                  label={language === 'en' ? 'Verified Account' : 'सत्यापित खाता'}
                  color="success"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Information */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  {t.personalInfo}
                </Typography>
                <IconButton size="small" color="primary">
                  <Edit />
                </IconButton>
              </Box>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Person color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={language === 'en' ? 'Full Name' : 'पूरा नाम'}
                    secondary={user.displayName || 'Not set'}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={language === 'en' ? 'Email Address' : 'ईमेल पता'}
                    secondary={user.email}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Phone color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={language === 'en' ? 'Phone Number' : 'फ़ोन नंबर'}
                    secondary={user.phoneNumber || '+91 98765 43210'}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={language === 'en' ? 'Location' : 'स्थान'}
                    secondary="Mumbai, Maharashtra, India"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Bank Accounts */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  <AccountBalance sx={{ verticalAlign: 'middle', mr: 1 }} />
                  {t.bankAccounts}
                </Typography>
                {!showBankDetails ? (
                  <Button
                    variant="outlined"
                    startIcon={<Lock />}
                    onClick={handleRequestBankDetails}
                    color="primary"
                  >
                    {t.verifyPassword}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityOff />}
                    onClick={handleCloseBankDetails}
                    color="secondary"
                  >
                    {t.hideBankDetails}
                  </Button>
                )}
              </Box>

              {!showBankDetails && (
                <Alert severity="info" icon={<Security />} sx={{ mb: 2 }}>
                  {t.securityNote}
                </Alert>
              )}

              {isVerified && (
                <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                  {language === 'en'
                    ? '✓ Password verified. Bank details are now visible.'
                    : '✓ पासवर्ड सत्यापित। बैंक विवरण अब दिखाई दे रहे हैं।'}
                </Alert>
              )}

              <Grid container spacing={2}>
                {bankAccounts.map((account) => (
                  <Grid item xs={12} md={6} key={account.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {account.bankName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} Account
                            </Typography>
                          </Box>
                          <Box>
                            {account.isPrimary && (
                              <Chip label={t.primary} color="primary" size="small" sx={{ mb: 0.5 }} />
                            )}
                            {account.isVerified && (
                              <Chip
                                icon={<CheckCircle />}
                                label={t.verified}
                                color="success"
                                size="small"
                              />
                            )}
                          </Box>
                        </Box>

                        <List dense disablePadding>
                          <ListItem disablePadding sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={t.accountNumber}
                              secondary={
                                showBankDetails ? account.accountNumber : maskAccountNumber(account.accountNumber)
                              }
                              primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                              secondaryTypographyProps={{
                                variant: 'body2',
                                fontWeight: 'bold',
                                fontFamily: 'monospace',
                              }}
                            />
                          </ListItem>
                          <ListItem disablePadding sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={t.ifscCode}
                              secondary={showBankDetails ? account.ifscCode : '****'}
                              primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                              secondaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                            />
                          </ListItem>
                          {account.branch && (
                            <ListItem disablePadding sx={{ py: 0.5 }}>
                              <ListItemText
                                primary={t.branch}
                                secondary={account.branch}
                                primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                secondaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          )}
                          <ListItem disablePadding sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={t.addedOn}
                              secondary={account.addedAt.toLocaleDateString(language === 'en' ? 'en-IN' : 'hi-IN')}
                              primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                              secondaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Log Section */}
        <Grid item xs={12}>
          <ActivityLogViewer />
        </Grid>
      </Grid>

      {/* Password Verification Dialog */}
      <Dialog open={verificationDialog} onClose={() => setVerificationDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Security color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {t.passwordVerification}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t.enterPassword}
          </Alert>
          <TextField
            fullWidth
            label={t.password}
            type={showPassword ? 'text' : 'password'}
            value={verificationPassword}
            onChange={(e) => {
              setVerificationPassword(e.target.value);
              setVerificationError('');
            }}
            error={!!verificationError}
            helperText={verificationError}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleVerifyPassword();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            autoFocus
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            {language === 'en'
              ? '💡 Demo: Use "password" or your email to unlock'
              : '💡 डेमो: अनलॉक करने के लिए "password" या अपना ईमेल उपयोग करें'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialog(false)}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleVerifyPassword} disabled={!verificationPassword}>
            {t.verify}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;

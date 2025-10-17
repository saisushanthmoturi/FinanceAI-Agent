import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Stack,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  TrendingUp,
  Add,
  Sync,
  CheckCircle,
  Error,
  Info,
  Security,
  Visibility,
  VisibilityOff,
  Link as LinkIcon,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import type { BankAccountFormData } from '../types/bank';

interface DataSource {
  id: string;
  name: string;
  type: 'bank' | 'investment' | 'credit' | 'insurance' | 'crypto';
  status: 'connected' | 'pending' | 'error' | 'disconnected';
  lastSync: Date;
  accounts?: number;
  icon: React.ReactNode;
}

const UnifiedDataView: React.FC = () => {
  const { language, user } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBankDialog, setOpenBankDialog] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [bankFormData, setBankFormData] = useState<BankAccountFormData>({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'savings',
    branch: '',
    isPrimary: false,
  });

  // Demo data sources
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: 'hdfc',
      name: 'HDFC Bank',
      type: 'bank',
      status: 'connected',
      lastSync: new Date(),
      accounts: 2,
      icon: <AccountBalance />,
    },
    {
      id: 'icici',
      name: 'ICICI Bank',
      type: 'bank',
      status: 'connected',
      lastSync: new Date(Date.now() - 3600000),
      accounts: 1,
      icon: <AccountBalance />,
    },
    {
      id: 'zerodha',
      name: 'Zerodha',
      type: 'investment',
      status: 'connected',
      lastSync: new Date(Date.now() - 7200000),
      accounts: 1,
      icon: <TrendingUp />,
    },
    {
      id: 'amex',
      name: 'American Express',
      type: 'credit',
      status: 'pending',
      lastSync: new Date(Date.now() - 86400000),
      accounts: 1,
      icon: <CreditCard />,
    },
  ]);

  const content = {
    en: {
      title: 'Unified Data Aggregation',
      subtitle: 'All your financial accounts in one place',
      syncAll: 'Sync All',
      addNew: 'Add New Connection',
      connected: 'Connected Sources',
      available: 'Available to Connect',
      security: 'Security & Privacy',
      lastSynced: 'Last synced',
      accounts: 'accounts',
      status: 'Status',
      actions: 'Actions',
    },
    hi: {
      title: 'एकीकृत डेटा एकत्रीकरण',
      subtitle: 'एक ही स्थान पर आपके सभी वित्तीय खाते',
      syncAll: 'सभी को सिंक करें',
      addNew: 'नया कनेक्शन जोड़ें',
      connected: 'जुड़े स्रोत',
      available: 'कनेक्ट करने के लिए उपलब्ध',
      security: 'सुरक्षा और गोपनीयता',
      lastSynced: 'अंतिम सिंक',
      accounts: 'खाते',
      status: 'स्थिति',
      actions: 'कार्रवाई',
    },
  };

  const t = content[language as keyof typeof content] || content.en;

  const handleSyncAll = async () => {
    setSyncing(true);
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDataSources(prev =>
      prev.map(source => ({
        ...source,
        lastSync: new Date(),
        status: source.status === 'error' ? 'connected' : source.status,
      }))
    );
    
    setSyncing(false);
  };

  const handleConnect = (_sourceId: string) => {
    setOpenDialog(true);
  };

  const handleAddBankAccount = () => {
    setOpenBankDialog(true);
  };

  const handleSaveBankAccount = () => {
    if (!user) return;
    
    // Validate form
    if (bankFormData.accountNumber !== bankFormData.confirmAccountNumber) {
      alert(language === 'en' ? 'Account numbers do not match' : 'खाता संख्या मेल नहीं खाती');
      return;
    }
    
    // In production, save to Firestore
    console.log('Saving bank account:', { userId: user.id, ...bankFormData });
    
    alert(
      language === 'en'
        ? 'Bank account added successfully!'
        : 'बैंक खाता सफलतापूर्वक जोड़ा गया!'
    );
    
    setOpenBankDialog(false);
    setBankFormData({
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      accountType: 'savings',
      branch: '',
      isPrimary: false,
    });
  };

  const handleDisconnect = (sourceId: string) => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === sourceId ? { ...source, status: 'disconnected' } : source
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle />;
      case 'pending':
        return <Info />;
      case 'error':
        return <Error />;
      default:
        return <Info />;
    }
  };

  const availableSources = [
    { id: 'sbi', name: 'State Bank of India', type: 'bank', icon: <AccountBalance /> },
    { id: 'axis', name: 'Axis Bank', type: 'bank', icon: <AccountBalance /> },
    { id: 'groww', name: 'Groww', type: 'investment', icon: <TrendingUp /> },
    { id: 'upstox', name: 'Upstox', type: 'investment', icon: <TrendingUp /> },
    { id: 'visa', name: 'Visa Credit Card', type: 'credit', icon: <CreditCard /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          {t.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t.subtitle}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <Sync />}
            onClick={handleSyncAll}
            disabled={syncing}
          >
            {t.syncAll}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            {t.addNew}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<AccountBalanceWallet />}
            onClick={handleAddBankAccount}
            color="secondary"
          >
            {language === 'en' ? 'Add Bank Account' : 'बैंक खाता जोड़ें'}
          </Button>
        </Stack>
      </Box>

      {/* Sync Progress */}
      {syncing && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            {language === 'en' ? 'Syncing your accounts...' : 'आपके खातों को सिंक किया जा रहा है...'}
          </Typography>
          <LinearProgress sx={{ mt: 1 }} />
        </Alert>
      )}

      {/* Security Notice */}
      <Alert severity="success" icon={<Security />} sx={{ mb: 4 }}>
        <Typography variant="body1" fontWeight="bold" gutterBottom>
          {t.security}
        </Typography>
        <Typography variant="body2">
          {language === 'en'
            ? '🔒 Bank-grade encryption • RBI-approved Account Aggregator • No data stored on our servers • You control what we access'
            : '🔒 बैंक-ग्रेड एन्क्रिप्शन • RBI-अनुमोदित खाता एकत्रीकरण • हमारे सर्वर पर कोई डेटा संग्रहीत नहीं • आप नियंत्रित करते हैं कि हम क्या एक्सेस करते हैं'}
        </Typography>
      </Alert>

      {/* Connected Sources */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          {t.connected}
        </Typography>
        <Grid container spacing={3}>
          {dataSources
            .filter(source => source.status !== 'disconnected')
            .map((source) => (
              <Grid item xs={12} md={6} key={source.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                        {source.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {source.name}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <Chip
                            icon={getStatusIcon(source.status)}
                            label={source.status.toUpperCase()}
                            color={getStatusColor(source.status) as any}
                            size="small"
                          />
                          <Chip
                            label={`${source.accounts} ${t.accounts}`}
                            variant="outlined"
                            size="small"
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {t.lastSynced}:{' '}
                          {source.lastSync.toLocaleTimeString(language === 'en' ? 'en-IN' : 'hi-IN')}
                        </Typography>
                      </Box>
                      <Stack direction="column" spacing={1}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleSyncAll()}
                          disabled={syncing}
                        >
                          <Sync />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDisconnect(source.id)}
                        >
                          <LinkIcon />
                        </IconButton>
                      </Stack>
                    </Stack>

                    {/* Account Details */}
                    {source.status === 'connected' && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <List dense disablePadding>
                          {source.type === 'bank' && (
                            <>
                              <ListItem disablePadding>
                                <ListItemText
                                  primary={language === 'en' ? 'Savings Account' : 'बचत खाता'}
                                  secondary={`****${Math.floor(Math.random() * 9000 + 1000)}`}
                                />
                              </ListItem>
                              {source.accounts && source.accounts > 1 && (
                                <ListItem disablePadding>
                                  <ListItemText
                                    primary={language === 'en' ? 'Current Account' : 'चालू खाता'}
                                    secondary={`****${Math.floor(Math.random() * 9000 + 1000)}`}
                                  />
                                </ListItem>
                              )}
                            </>
                          )}
                          {source.type === 'investment' && (
                            <ListItem disablePadding>
                              <ListItemText
                                primary={language === 'en' ? 'Demat Account' : 'डीमैट खाता'}
                                secondary={`****${Math.floor(Math.random() * 9000 + 1000)}`}
                              />
                            </ListItem>
                          )}
                          {source.type === 'credit' && (
                            <ListItem disablePadding>
                              <ListItemText
                                primary={language === 'en' ? 'Credit Card' : 'क्रेडिट कार्ड'}
                                secondary={`****${Math.floor(Math.random() * 9000 + 1000)}`}
                              />
                            </ListItem>
                          )}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>

      {/* Available Sources */}
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          {t.available}
        </Typography>
        <Grid container spacing={2}>
          {availableSources.map((source) => (
            <Grid item xs={12} sm={6} md={4} key={source.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleConnect(source.id)}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>{source.icon}</Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {source.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                        {source.type}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Connection Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {language === 'en' ? 'Connect New Account' : 'नया खाता कनेक्ट करें'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            {language === 'en'
              ? 'This uses RBI-approved Account Aggregator framework for secure data access'
              : 'यह सुरक्षित डेटा एक्सेस के लिए RBI-अनुमोदित खाता एकत्रीकरण ढांचे का उपयोग करता है'}
          </Alert>
          
          <TextField
            fullWidth
            label={language === 'en' ? 'Account Number / User ID' : 'खाता संख्या / यूज़र आईडी'}
            margin="normal"
            variant="outlined"
          />
          
          <TextField
            fullWidth
            label={language === 'en' ? 'Password' : 'पासवर्ड'}
            type={showCredentials ? 'text' : 'password'}
            margin="normal"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowCredentials(!showCredentials)} edge="end">
                  {showCredentials ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />

          <Alert severity="success" sx={{ mt: 2 }}>
            {language === 'en'
              ? '✅ Your credentials are encrypted and never stored on our servers'
              : '✅ आपकी साख एन्क्रिप्ट की जाती है और कभी भी हमारे सर्वर पर संग्रहीत नहीं की जाती'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            {language === 'en' ? 'Cancel' : 'रद्द करें'}
          </Button>
          <Button variant="contained" onClick={() => {
            // Simulate connection
            setOpenDialog(false);
          }}>
            {language === 'en' ? 'Connect' : 'कनेक्ट करें'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Aggregation Stats */}
      <Card sx={{ mt: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" color="white" gutterBottom fontWeight="bold">
            📊 {language === 'en' ? 'Aggregation Overview' : 'एकत्रीकरण अवलोकन'}
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h3" fontWeight="bold">
                  {dataSources.filter(s => s.status === 'connected').length}
                </Typography>
                <Typography variant="body1">
                  {language === 'en' ? 'Connected Sources' : 'जुड़े स्रोत'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h3" fontWeight="bold">
                  {dataSources.reduce((acc, s) => acc + (s.accounts || 0), 0)}
                </Typography>
                <Typography variant="body1">
                  {language === 'en' ? 'Total Accounts' : 'कुल खाते'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h3" fontWeight="bold">
                  100%
                </Typography>
                <Typography variant="body1">
                  {language === 'en' ? 'Data Accuracy' : 'डेटा सटीकता'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Bank Account Dialog */}
      <Dialog open={openBankDialog} onClose={() => setOpenBankDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <AccountBalanceWallet color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {language === 'en' ? 'Add Bank Account Details' : 'बैंक खाता विवरण जोड़ें'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            {language === 'en'
              ? 'Add your bank account details for direct transfers and payments. All data is encrypted and secure.'
              : 'सीधे स्थानांतरण और भुगतान के लिए अपना बैंक खाता विवरण जोड़ें। सभी डेटा एन्क्रिप्ट और सुरक्षित है।'}
          </Alert>

          <TextField
            fullWidth
            label={language === 'en' ? 'Account Holder Name' : 'खाता धारक का नाम'}
            value={bankFormData.accountHolderName}
            onChange={(e) => setBankFormData({ ...bankFormData, accountHolderName: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label={language === 'en' ? 'Bank Name' : 'बैंक का नाम'}
            value={bankFormData.bankName}
            onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            select
            label={language === 'en' ? 'Account Type' : 'खाता प्रकार'}
            value={bankFormData.accountType}
            onChange={(e) => setBankFormData({ ...bankFormData, accountType: e.target.value as any })}
            margin="normal"
            required
          >
            <MenuItem value="savings">{language === 'en' ? 'Savings' : 'बचत'}</MenuItem>
            <MenuItem value="current">{language === 'en' ? 'Current' : 'चालू'}</MenuItem>
            <MenuItem value="salary">{language === 'en' ? 'Salary' : 'वेतन'}</MenuItem>
            <MenuItem value="nre">{language === 'en' ? 'NRE' : 'NRE'}</MenuItem>
            <MenuItem value="nro">{language === 'en' ? 'NRO' : 'NRO'}</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label={language === 'en' ? 'Account Number' : 'खाता संख्या'}
            value={bankFormData.accountNumber}
            onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label={language === 'en' ? 'Confirm Account Number' : 'खाता संख्या की पुष्टि करें'}
            value={bankFormData.confirmAccountNumber}
            onChange={(e) => setBankFormData({ ...bankFormData, confirmAccountNumber: e.target.value })}
            margin="normal"
            required
            error={
              bankFormData.confirmAccountNumber !== '' &&
              bankFormData.accountNumber !== bankFormData.confirmAccountNumber
            }
            helperText={
              bankFormData.confirmAccountNumber !== '' &&
              bankFormData.accountNumber !== bankFormData.confirmAccountNumber
                ? language === 'en'
                  ? 'Account numbers do not match'
                  : 'खाता संख्या मेल नहीं खाती'
                : ''
            }
          />

          <TextField
            fullWidth
            label={language === 'en' ? 'IFSC Code' : 'IFSC कोड'}
            value={bankFormData.ifscCode}
            onChange={(e) => setBankFormData({ ...bankFormData, ifscCode: e.target.value.toUpperCase() })}
            margin="normal"
            required
            inputProps={{ maxLength: 11 }}
          />

          <TextField
            fullWidth
            label={language === 'en' ? 'Branch (Optional)' : 'शाखा (वैकल्पिक)'}
            value={bankFormData.branch}
            onChange={(e) => setBankFormData({ ...bankFormData, branch: e.target.value })}
            margin="normal"
          />

          <Divider sx={{ my: 2 }} />

          <Alert severity="success" icon={<Security />}>
            {language === 'en'
              ? '🔒 Your bank details are encrypted with bank-grade security and stored securely.'
              : '🔒 आपके बैंक विवरण बैंक-ग्रेड सुरक्षा के साथ एन्क्रिप्ट किए गए हैं और सुरक्षित रूप से संग्रहीत हैं।'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBankDialog(false)}>
            {language === 'en' ? 'Cancel' : 'रद्द करें'}
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveBankAccount}
            disabled={
              !bankFormData.accountHolderName ||
              !bankFormData.bankName ||
              !bankFormData.accountNumber ||
              !bankFormData.ifscCode ||
              bankFormData.accountNumber !== bankFormData.confirmAccountNumber
            }
          >
            {language === 'en' ? 'Save Account' : 'खाता सहेजें'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UnifiedDataView;

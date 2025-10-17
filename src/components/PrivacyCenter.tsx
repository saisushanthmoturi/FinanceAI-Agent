import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Security,
  Lock,
  Visibility,
  Delete,
  Download,
  Shield,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';

interface ConsentItem {
  id: string;
  service: string;
  description: string;
  enabled: boolean;
  required: boolean;
  dataTypes: string[];
}

const PrivacyCenter: React.FC = () => {
  const { user } = useAppStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [consents, setConsents] = useState<ConsentItem[]>([
    {
      id: '1',
      service: 'Financial Account Aggregation',
      description: 'Access to your bank accounts, credit cards, and investment accounts',
      enabled: true,
      required: true,
      dataTypes: ['Account Balance', 'Transaction History', 'Account Details'],
    },
    {
      id: '2',
      service: 'AI Financial Analysis',
      description: 'AI-powered insights and recommendations based on your financial data',
      enabled: true,
      required: false,
      dataTypes: ['Spending Patterns', 'Income Sources', 'Investment Portfolio'],
    },
    {
      id: '3',
      service: 'Behavioral Pattern Detection',
      description: 'Emotion-aware spending analysis and behavioral bias detection',
      enabled: true,
      required: false,
      dataTypes: ['Transaction Timestamps', 'Purchase Categories', 'Spending Emotions'],
    },
    {
      id: '4',
      service: 'Autonomous Financial Agents',
      description: 'AI agents to auto-execute financial actions with your consent',
      enabled: false,
      required: false,
      dataTypes: ['Account Access', 'Transaction Authorization', 'Bill Payment'],
    },
    {
      id: '5',
      service: 'Voice Assistant',
      description: 'Voice commands and speech-to-text for hands-free interaction',
      enabled: false,
      required: false,
      dataTypes: ['Voice Recordings', 'Speech Patterns'],
    },
    {
      id: '6',
      service: 'Multi-lingual Support',
      description: 'Translation and localization services',
      enabled: true,
      required: false,
      dataTypes: ['Language Preference', 'Regional Settings'],
    },
  ]);

  const toggleConsent = (id: string) => {
    setConsents((prev) =>
      prev.map((consent) =>
        consent.id === id && !consent.required
          ? { ...consent, enabled: !consent.enabled }
          : consent
      )
    );
  };

  const handleExportData = () => {
    alert('Your data export will be emailed to you within 24 hours.');
  };

  const handleDeleteAccount = () => {
    alert('Account deletion request submitted. You will receive a confirmation email.');
    setDeleteDialogOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <Security sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Privacy & Security Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your data, permissions, and security settings
            </Typography>
          </Box>
        </Box>
        <Alert severity="success" icon={<CheckCircle />}>
          <strong>🔒 Your data is secure.</strong> All information is encrypted end-to-end and stored securely. You have full control over what you share.
        </Alert>
      </Box>

      <Grid container spacing={3}>
        {/* Data Privacy Overview */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Shield sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    RBI Compliant
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Meets all regulatory standards
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="End-to-end encryption"
                    secondary="AES-256 encryption"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Data minimization"
                    secondary="Only essential data collected"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Regular security audits"
                    secondary="Quarterly penetration testing"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Your Rights */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Your Rights
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Under RBI and data protection laws
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Visibility color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Right to Access" secondary="View all your data anytime" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Download color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Right to Portability"
                    secondary="Export your data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Delete color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Right to Erasure" secondary="Delete your account" />
                </ListItem>
              </List>
              <Box mt={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportData}
                  sx={{ mb: 1 }}
                >
                  Export My Data
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Account
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Usage Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Data Usage Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Last 30 days
              </Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Active Consents</Typography>
                  <Chip
                    label={`${consents.filter((c) => c.enabled).length}/${consents.length}`}
                    color="success"
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">AI Queries</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    127
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Data Sync Events</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    45
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Account Accessed</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
              <Alert severity="info" icon={<Info />}>
                <Typography variant="caption">
                  All activity is logged and auditable for your security.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Consent Management */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Granular Consent Management
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Control exactly what data you share and with which services. Changes take effect immediately.
            </Typography>

            <Grid container spacing={2}>
              {consents.map((consent) => (
                <Grid key={consent.id} size={{ xs: 12, md: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: consent.enabled ? 'success.main' : 'grey.300',
                      borderWidth: 2,
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {consent.service}
                            </Typography>
                            {consent.required && (
                              <Chip
                                label="Required"
                                size="small"
                                color="error"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {consent.description}
                          </Typography>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                              Data Types:
                            </Typography>
                            {consent.dataTypes.map((type, idx) => (
                              <Chip
                                key={idx}
                                label={type}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={consent.enabled}
                              onChange={() => toggleConsent(consent.id)}
                              disabled={consent.required}
                            />
                          }
                          label=""
                        />
                      </Box>
                      {consent.enabled && (
                        <Alert severity="success" icon={<CheckCircle />}>
                          <Typography variant="caption">
                            Active • Data shared securely
                          </Typography>
                        </Alert>
                      )}
                      {!consent.enabled && !consent.required && (
                        <Alert severity="warning" icon={<Warning />}>
                          <Typography variant="caption">
                            Disabled • Feature may not work properly
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Security Settings */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Security Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Two-Factor Authentication (2FA)"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Add an extra layer of security to your account
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Login Alerts"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Get notified of new login attempts
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Session Timeout"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Auto-logout after 15 minutes of inactivity
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Warning color="error" sx={{ mr: 1 }} />
            Delete Account
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              This action cannot be undone!
            </Typography>
          </Alert>
          <Typography variant="body2" paragraph>
            Deleting your account will:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Permanently delete all your financial data" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Remove all AI insights and recommendations" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Cancel all active subscriptions" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Revoke all third-party access" />
            </ListItem>
          </List>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This process may take up to 30 days to complete as per regulatory requirements.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteAccount}>
            Yes, Delete My Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PrivacyCenter;

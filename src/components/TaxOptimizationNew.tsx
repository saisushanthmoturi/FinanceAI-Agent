/**
 * Tax Optimization Page
 * 
 * Comprehensive tax planning tool with:
 * - Salary-based tax calculation
 * - Old vs New regime comparison
 * - Personalized tax-saving recommendations
 * - Investment suggestions
 * - Loan benefits calculator
 */

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ExpandMore,
  CheckCircle,
  TrendingUp,
  AccountBalance,
  Home,
  HealthAndSafety,
  Favorite,
  Edit,
  Save,
  CompareArrows,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import {
  generateTaxOptimizationReport,
  updateFinancialInfo,
  type TaxOptimizationReport,
} from '../services/taxOptimizationService';
import { getUserProfile, type UserProfile } from '../services/authService';

const TaxOptimization: React.FC = () => {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [taxReport, setTaxReport] = useState<TaxOptimizationReport | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    annualSalary: '',
    taxRegime: 'new' as 'old' | 'new',
    age: '',
    employmentType: 'salaried' as 'salaried' | 'self-employed' | 'business',
    hasHomeLoan: false,
    hasEducationLoan: false,
    hasHealthInsurance: false,
    dependents: '',
    pan: '',
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const profile = await getUserProfile(user.id);
      setUserProfile(profile);

      // Load form data from profile
      if (profile.financialInfo) {
        setFormData({
          annualSalary: profile.financialInfo.annualSalary?.toString() || '',
          taxRegime: profile.financialInfo.taxRegime || 'new',
          age: profile.financialInfo.age?.toString() || '',
          employmentType: profile.financialInfo.employmentType || 'salaried',
          hasHomeLoan: profile.financialInfo.hasHomeLoan || false,
          hasEducationLoan: profile.financialInfo.hasEducationLoan || false,
          hasHealthInsurance: profile.financialInfo.hasHealthInsurance || false,
          dependents: profile.financialInfo.dependents?.toString() || '',
          pan: profile.financialInfo.pan || '',
        });

        // Generate tax report if salary exists
        if (profile.financialInfo.annualSalary) {
          const report = await generateTaxOptimizationReport(user.id);
          setTaxReport(report);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFinancialInfo = async () => {
    if (!user) return;

    try {
      const financialInfo = {
        annualSalary: parseFloat(formData.annualSalary) || 0,
        taxRegime: formData.taxRegime,
        age: parseInt(formData.age) || 0,
        employmentType: formData.employmentType,
        hasHomeLoan: formData.hasHomeLoan,
        hasEducationLoan: formData.hasEducationLoan,
        hasHealthInsurance: formData.hasHealthInsurance,
        dependents: parseInt(formData.dependents) || 0,
        pan: formData.pan,
      };

      await updateFinancialInfo(user.id, financialInfo);
      setEditDialogOpen(false);
      await loadUserData();
    } catch (error) {
      console.error('Error saving financial info:', error);
      alert('Failed to save financial information');
    }
  };

  const getSchemeIcon = (category: string) => {
    switch (category) {
      case 'investment':
        return <TrendingUp color="primary" />;
      case 'insurance':
        return <HealthAndSafety color="success" />;
      case 'loan':
        return <Home color="warning" />;
      case 'savings':
        return <AccountBalance color="info" />;
      case 'donation':
        return <Favorite color="error" />;
      default:
        return <CheckCircle />;
    }
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            💰 Tax Optimization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Smart tax planning to maximize your savings
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<CompareArrows />}
            onClick={() => setCompareDialogOpen(true)}
            disabled={!taxReport}
          >
            Compare Regimes
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => setEditDialogOpen(true)}
          >
            Update Profile
          </Button>
        </Box>
      </Box>

      {/* Salary Not Configured Alert */}
      {!userProfile?.financialInfo?.annualSalary && (
        <Alert severity="warning" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={() => setEditDialogOpen(true)}>
            Add Now
          </Button>
        }>
          <Typography variant="subtitle2" fontWeight="bold">
            Complete Your Profile
          </Typography>
          <Typography variant="body2">
            Add your salary and financial details to get personalized tax-saving recommendations.
          </Typography>
        </Alert>
      )}

      {/* Tax Summary Cards */}
      {taxReport && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Annual Salary
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{(taxReport.currentTax.grossIncome / 100000).toFixed(2)}L
                  </Typography>
                  <Chip
                    label={`${formData.taxRegime.toUpperCase()} Regime`}
                    size="small"
                    sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Tax Liability
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    ₹{(taxReport.currentTax.totalTaxLiability / 1000).toFixed(0)}K
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Effective Rate: {taxReport.currentTax.effectiveTaxRate.toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Optimized Tax
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    ₹{(taxReport.optimizedTax.totalTaxLiability / 1000).toFixed(0)}K
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Effective Rate: {taxReport.optimizedTax.effectiveTaxRate.toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={3} sx={{ bgcolor: 'success.50' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Potential Savings
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        ₹{(taxReport.totalSavings / 1000).toFixed(0)}K
                      </Typography>
                      <Chip
                        label={`${taxReport.savingsPercentage.toFixed(1)}% Savings`}
                        size="small"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                    <TrendingUp sx={{ fontSize: 48, color: 'success.main', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tax Breakdown */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Tax Calculation Breakdown
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Current Tax (Minimal Deductions)
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Gross Income" secondary={`₹${taxReport.currentTax.grossIncome.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Total Deductions" secondary={`₹${taxReport.currentTax.totalDeductions.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Taxable Income" secondary={`₹${taxReport.currentTax.taxableIncome.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Tax Before Rebate" secondary={`₹${taxReport.currentTax.taxBeforeRebate.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Rebate u/s 87A" secondary={`₹${taxReport.currentTax.rebate.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Health & Education Cess (4%)" secondary={`₹${taxReport.currentTax.cess.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary={<strong>Total Tax Liability</strong>} 
                      secondary={<strong style={{ color: '#dc2626' }}>₹{taxReport.currentTax.totalTaxLiability.toLocaleString('en-IN')}</strong>} 
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Optimized Tax (Maximum Deductions)
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Gross Income" secondary={`₹${taxReport.optimizedTax.grossIncome.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Total Deductions" secondary={`₹${taxReport.optimizedTax.totalDeductions.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Taxable Income" secondary={`₹${taxReport.optimizedTax.taxableIncome.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Tax Before Rebate" secondary={`₹${taxReport.optimizedTax.taxBeforeRebate.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Rebate u/s 87A" secondary={`₹${taxReport.optimizedTax.rebate.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Health & Education Cess (4%)" secondary={`₹${taxReport.optimizedTax.cess.toLocaleString('en-IN')}`} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary={<strong>Total Tax Liability</strong>} 
                      secondary={<strong style={{ color: '#059669' }}>₹{taxReport.optimizedTax.totalTaxLiability.toLocaleString('en-IN')}</strong>} 
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>

          {/* Tax-Saving Recommendations */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🎯 Recommended Tax-Saving Schemes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Personalized recommendations based on your salary: ₹{(taxReport.currentTax.grossIncome / 100000).toFixed(2)}L
            </Typography>

            {taxReport.recommendations.map((scheme) => (
              <Accordion key={scheme.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" width="100%">
                    {getSchemeIcon(scheme.category)}
                    <Box sx={{ ml: 2, flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {scheme.name}
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip label={scheme.section} size="small" variant="outlined" />
                        <Chip label={`Max: ₹${(scheme.maxLimit / 1000).toFixed(0)}K`} size="small" />
                        <Chip 
                          label={`Save: ₹${(scheme.potentialSaving / 1000).toFixed(0)}K`} 
                          size="small" 
                          color="success" 
                        />
                        {scheme.risk && (
                          <Chip 
                            label={`${scheme.risk.toUpperCase()} Risk`} 
                            size="small" 
                            color={getRiskColor(scheme.risk)} 
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {scheme.description}
                  </Typography>
                  
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                    Benefits:
                  </Typography>
                  <List dense>
                    {scheme.benefits.map((benefit, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={benefit} />
                      </ListItem>
                    ))}
                  </List>

                  <Box display="flex" gap={2} mt={2}>
                    {scheme.lockInPeriod && (
                      <Chip label={`Lock-in: ${scheme.lockInPeriod}`} size="small" variant="outlined" />
                    )}
                    {scheme.returns && (
                      <Chip label={`Returns: ${scheme.returns}`} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>Eligibility:</strong> {scheme.eligibility}
                  </Alert>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>

          {/* Action Plan */}
          <Paper elevation={3} sx={{ p: 3, bgcolor: 'primary.50' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
              📋 Action Plan for Maximum Tax Savings
            </Typography>
            <List>
              {taxReport.actionPlan.map((action, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={action} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </>
      )}

      {/* Edit Financial Info Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Update Financial Information</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Annual Salary (₹)"
                type="number"
                value={formData.annualSalary}
                onChange={(e) => setFormData({ ...formData, annualSalary: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tax Regime</InputLabel>
                <Select
                  value={formData.taxRegime}
                  label="Tax Regime"
                  onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value as 'old' | 'new' })}
                >
                  <MenuItem value="new">New Tax Regime (Default)</MenuItem>
                  <MenuItem value="old">Old Tax Regime</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={formData.employmentType}
                  label="Employment Type"
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                >
                  <MenuItem value="salaried">Salaried</MenuItem>
                  <MenuItem value="self-employed">Self-Employed</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="PAN"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Number of Dependents"
                type="number"
                value={formData.dependents}
                onChange={(e) => setFormData({ ...formData, dependents: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasHomeLoan}
                    onChange={(e) => setFormData({ ...formData, hasHomeLoan: e.target.checked })}
                  />
                }
                label="I have a Home Loan"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasEducationLoan}
                    onChange={(e) => setFormData({ ...formData, hasEducationLoan: e.target.checked })}
                  />
                }
                label="I have an Education Loan"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasHealthInsurance}
                    onChange={(e) => setFormData({ ...formData, hasHealthInsurance: e.target.checked })}
                  />
                }
                label="I have Health Insurance"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveFinancialInfo}>
            Save & Generate Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare Regimes Dialog */}
      <Dialog open={compareDialogOpen} onClose={() => setCompareDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Old vs New Tax Regime Comparison</DialogTitle>
        <DialogContent>
          {taxReport && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  The Old Regime allows deductions under sections 80C, 80D, 24(b), etc., while the New Regime offers lower tax rates but fewer deductions.
                </Typography>
              </Alert>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Old Regime</Typography>
                      <Typography variant="h4" color="primary">
                        ₹{(taxReport.currentTax.totalTaxLiability / 1000).toFixed(0)}K
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        With maximum deductions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>New Regime</Typography>
                      <Typography variant="h4" color="success.main">
                        ₹{(taxReport.optimizedTax.totalTaxLiability / 1000).toFixed(0)}K
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Minimal deductions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Recommendation:
                </Typography>
                <Typography variant="body2">
                  Based on your income and deductions, the <strong>{formData.taxRegime.toUpperCase()} regime</strong> is beneficial for you.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TaxOptimization;

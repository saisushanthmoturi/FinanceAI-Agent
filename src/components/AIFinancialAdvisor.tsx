/**
 * AI Financial Advisor Component
 * 
 * Interactive financial planning tool that helps users:
 * - Set financial goals (car, home, travel, etc.)
 * - Get personalized investment recommendations
 * - Compare savings vs investment scenarios
 * - Receive actionable monthly plans
 */

import { useState } from 'react';
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
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ExpandMore,
  TrendingUp,
  AccountBalance,
  DirectionsCar,
  Home,
  Flight,
  School,
  MedicalServices,
  Add,
  Delete,
  CompareArrows,
  CheckCircle,

  Lightbulb,
  CalendarMonth,
  Savings,
  ShowChart,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import {
  generateFinancialAdvisorReport,
  compareSavingsVsInvestment,
  type UserFinancialInput,
  type FinancialGoal,
  type FinancialAdvisorReport,
} from '../services/aiFinancialAdvisor';

const AIFinancialAdvisor: React.FC = () => {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [report, setReport] = useState<FinancialAdvisorReport | null>(null);
  const [addGoalDialogOpen, setAddGoalDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  // User financial input
  const [financialInput, setFinancialInput] = useState<UserFinancialInput>({
    monthlySalary: 0,
    monthlyExpenses: 0,
    currentSavings: 0,
    savingsPercentage: 20,
    riskProfile: 'moderate',
    goals: [],
  });

  // New goal form
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    currentSavings: '',
    timelineMonths: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    category: 'other' as FinancialGoal['category'],
  });

  const steps = ['Financial Profile', 'Add Goals', 'Get AI Plan'];

  const handleNext = () => {
    console.log('handleNext called, activeStep:', activeStep);
    console.log('Goals count:', financialInput.goals.length);
    console.log('Monthly salary:', financialInput.monthlySalary);
    
    if (activeStep === 0 && !financialInput.monthlySalary) {
      alert('Please enter your monthly salary');
      return;
    }
    if (activeStep === 1 && financialInput.goals.length === 0) {
      alert('Please add at least one financial goal');
      return;
    }
    if (activeStep === 1) {
      // Generate report when leaving step 1 (Add Goals)
      console.log('Triggering generateReport from handleNext...');
      generateReport();
    } else {
      console.log('Moving to next step...');
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.timelineMonths) {
      alert('Please fill all required fields');
      return;
    }

    const goal: FinancialGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentSavings: parseFloat(newGoal.currentSavings) || 0,
      timelineMonths: parseInt(newGoal.timelineMonths),
      priority: newGoal.priority,
      category: newGoal.category,
      createdAt: new Date(),
    };

    setFinancialInput({
      ...financialInput,
      goals: [...financialInput.goals, goal],
    });

    setNewGoal({
      title: '',
      targetAmount: '',
      currentSavings: '',
      timelineMonths: '',
      priority: 'medium',
      category: 'other',
    });

    setAddGoalDialogOpen(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    setFinancialInput({
      ...financialInput,
      goals: financialInput.goals.filter((g) => g.id !== goalId),
    });
  };

  const generateReport = async () => {
    console.log('=== generateReport START ===');
    
    if (!user) {
      console.error('❌ No user found');
      setSnackbarMessage('Please log in to continue');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    console.log('✅ User found:', user.id, user.displayName);
    console.log('📊 Financial Input:', JSON.stringify(financialInput, null, 2));
    console.log('🎯 Goals:', financialInput.goals);

    // Validate before proceeding
    if (!financialInput.monthlySalary || financialInput.monthlySalary <= 0) {
      console.error('❌ Invalid monthly salary:', financialInput.monthlySalary);
      setSnackbarMessage('Please enter a valid monthly salary');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!financialInput.goals || financialInput.goals.length === 0) {
      console.error('❌ No goals added');
      setSnackbarMessage('Please add at least one financial goal');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      console.log('🔄 Setting loading state...');
      setLoading(true);
      
      setSnackbarMessage('Generating your personalized financial plan...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      
      console.log('📈 Moving to step 2 (loading screen)...');
      setActiveStep(2); // Move to loading screen
      
      console.log('🚀 Calling generateFinancialAdvisorReport service...');
      const advisorReport = await generateFinancialAdvisorReport(user.id, financialInput);
      
      console.log('✅ Report generated successfully!');
      console.log('📄 Report:', advisorReport);
      
      setReport(advisorReport);
      
      console.log('📊 Moving to step 3 (results)...');
      setActiveStep(3); // Move to results
      
      setSnackbarMessage('Financial plan generated successfully! 🎉');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      console.log('=== generateReport SUCCESS ===');
    } catch (error) {
      console.error('❌ Error generating report:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      setSnackbarMessage(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setActiveStep(1); // Go back to goals step
    } finally {
      console.log('🔚 Clearing loading state...');
      setLoading(false);
      console.log('=== generateReport END ===');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'home':
        return <Home color="primary" />;
      case 'vehicle':
        return <DirectionsCar color="success" />;
      case 'travel':
        return <Flight color="info" />;
      case 'education':
        return <School color="warning" />;
      case 'emergency':
        return <MedicalServices color="error" />;
      case 'retirement':
        return <Savings color="secondary" />;
      default:
        return <AccountBalance />;
    }
  };



  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            🤖 AI Financial Advisor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Smart goal-based financial planning with personalized investment recommendations
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step 1: Financial Profile */}
      {activeStep === 0 && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            📊 Your Financial Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Let's understand your current financial situation
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Monthly Salary (₹)"
                type="number"
                value={financialInput.monthlySalary || ''}
                onChange={(e) =>
                  setFinancialInput({
                    ...financialInput,
                    monthlySalary: parseFloat(e.target.value) || 0,
                  })
                }
                required
                helperText="Your net monthly income after taxes"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Monthly Expenses (₹)"
                type="number"
                value={financialInput.monthlyExpenses || ''}
                onChange={(e) =>
                  setFinancialInput({
                    ...financialInput,
                    monthlyExpenses: parseFloat(e.target.value) || 0,
                  })
                }
                required
                helperText="Rent, bills, groceries, EMIs, etc."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Current Savings (₹)"
                type="number"
                value={financialInput.currentSavings || ''}
                onChange={(e) =>
                  setFinancialInput({
                    ...financialInput,
                    currentSavings: parseFloat(e.target.value) || 0,
                  })
                }
                helperText="Total savings in bank/investments"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Savings Percentage (%)"
                type="number"
                value={financialInput.savingsPercentage}
                onChange={(e) =>
                  setFinancialInput({
                    ...financialInput,
                    savingsPercentage: parseFloat(e.target.value) || 20,
                  })
                }
                helperText="What % of salary do you save monthly?"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Risk Profile</InputLabel>
                <Select
                  value={financialInput.riskProfile}
                  label="Risk Profile"
                  onChange={(e) =>
                    setFinancialInput({
                      ...financialInput,
                      riskProfile: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="conservative">
                    Conservative (Low Risk, Steady Returns)
                  </MenuItem>
                  <MenuItem value="moderate">
                    Moderate (Balanced Risk & Growth)
                  </MenuItem>
                  <MenuItem value="aggressive">
                    Aggressive (High Risk, High Returns)
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {financialInput.monthlySalary > 0 && (
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Monthly Surplus: ₹
                {(financialInput.monthlySalary - financialInput.monthlyExpenses).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                This is what you can invest towards your goals every month
              </Typography>
            </Alert>
          )}

          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button variant="contained" onClick={handleNext} size="large">
              Next: Add Goals
            </Button>
          </Box>
        </Paper>
      )}

      {/* Step 2: Add Goals */}
      {activeStep === 1 && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                🎯 Your Financial Goals
              </Typography>
              <Typography variant="body2" color="text.secondary">
                What do you want to achieve? (Car, Home, Travel, etc.)
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddGoalDialogOpen(true)}
            >
              Add Goal
            </Button>
          </Box>

          {financialInput.goals.length === 0 ? (
            <Alert severity="info">
              <Typography variant="subtitle2">No goals added yet</Typography>
              <Typography variant="body2">
                Click "Add Goal" to start planning your financial future
              </Typography>
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {financialInput.goals.map((goal) => (
                <Grid size={{ xs: 12, md: 6 }} key={goal.id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box display="flex" alignItems="center" gap={2}>
                          {getCategoryIcon(goal.category)}
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {goal.title}
                            </Typography>
                            <Chip
                              label={goal.priority.toUpperCase()}
                              size="small"
                              color={
                                goal.priority === 'high'
                                  ? 'error'
                                  : goal.priority === 'medium'
                                  ? 'warning'
                                  : 'default'
                              }
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>

                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary">
                          Target Amount: ₹{goal.targetAmount.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Timeline: {Math.ceil(goal.timelineMonths / 12)} years
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Current Savings: ₹{goal.currentSavings.toLocaleString()}
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={(goal.currentSavings / goal.targetAmount) * 100}
                        sx={{ mt: 2 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button onClick={handleBack}>Back</Button>
            <Button variant="contained" onClick={handleNext} size="large">
              Generate AI Plan
            </Button>
          </Box>
        </Paper>
      )}

      {/* Step 3: Loading / Report */}
      {activeStep === 2 && loading && (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">Analyzing your financial goals...</Typography>
          <Typography variant="body2" color="text.secondary">
            Our AI is creating a personalized investment plan for you
          </Typography>
        </Paper>
      )}

      {/* Step 4: AI Report */}
      {activeStep === 3 && report && (
        <>
          {/* Financial Health Score */}
          <Card elevation={3} sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Financial Health Score
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Based on your profile and goals
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h1" fontWeight="bold">
                    {report.financialHealthScore}
                  </Typography>
                  <Typography variant="caption">out of 100</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={3}>
                <CardContent>
                  <Savings sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Monthly Capacity
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₹{report.monthlySavingsCapacity.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={3}>
                <CardContent>
                  <ShowChart sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Monthly Investment
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₹{report.overallStrategy.totalMonthlyInvestment.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={3}>
                <CardContent>
                  <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Expected Returns
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {report.overallStrategy.expectedReturns}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    per year
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card elevation={3}>
                <CardContent>
                  <CalendarMonth sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Timeline
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {report.overallStrategy.timeline}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Warnings */}
          {report.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                ⚠️ Important Warnings
              </Typography>
              <List dense>
                {report.warnings.map((warning, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}

          {/* Insights */}
          {report.insights.length > 0 && (
            <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'info.50' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom color="info.main">
                💡 AI Insights
              </Typography>
              <List>
                {report.insights.map((insight, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Lightbulb color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={insight} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Goal Plans */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🎯 Your Goals & Investment Plan
            </Typography>

            {report.goalPlans.map((plan) => (
              <Accordion key={plan.goal.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" width="100%">
                    {getCategoryIcon(plan.goal.category)}
                    <Box sx={{ ml: 2, flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {plan.goal.title}
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip
                          label={`₹${plan.goal.targetAmount.toLocaleString()}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${Math.ceil(plan.goal.timelineMonths / 12)} years`}
                          size="small"
                          icon={<CalendarMonth />}
                        />
                        <Chip
                          label={plan.achievable ? 'Achievable' : 'Needs Adjustment'}
                          size="small"
                          color={plan.achievable ? 'success' : 'warning'}
                        />
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        💰 Monthly Investment Required
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        ₹{plan.monthlyRequiredInvestment.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (vs ₹{plan.monthlyRequiredSavings.toLocaleString()} if just saving)
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        ⚠️ Risk Level
                      </Typography>
                      <Chip
                        label={plan.riskAnalysis.level.toUpperCase()}
                        color={
                          plan.riskAnalysis.level === 'low'
                            ? 'success'
                            : plan.riskAnalysis.level === 'medium'
                            ? 'warning'
                            : 'error'
                        }
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {plan.riskAnalysis.explanation}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                    📈 Recommended Investments:
                  </Typography>
                  <List dense>
                    {plan.recommendedInvestments.map((inv, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TrendingUp color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={inv.name}
                          secondary={`${inv.expectedReturn}% annual return | ${inv.risk} risk`}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      AI Suggestions:
                    </Typography>
                    {plan.suggestions.map((suggestion, index) => (
                      <Typography key={index} variant="body2">
                        • {suggestion}
                      </Typography>
                    ))}
                  </Alert>

                  <Button
                    variant="outlined"
                    startIcon={<CompareArrows />}
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setSelectedGoal(plan.goal);
                      setCompareDialogOpen(true);
                    }}
                  >
                    Compare Savings vs Investment
                  </Button>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>

          {/* Portfolio Allocation */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📊 Recommended Portfolio Allocation
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Low Risk (FD, PPF)</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {report.overallStrategy.portfolioAllocation.lowRisk}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={report.overallStrategy.portfolioAllocation.lowRisk}
                color="success"
                sx={{ mb: 2, height: 10, borderRadius: 1 }}
              />

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Medium Risk (Mutual Funds)</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {report.overallStrategy.portfolioAllocation.mediumRisk}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={report.overallStrategy.portfolioAllocation.mediumRisk}
                color="warning"
                sx={{ mb: 2, height: 10, borderRadius: 1 }}
              />

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">High Risk (Stocks, High-growth MF)</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {report.overallStrategy.portfolioAllocation.highRisk}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={report.overallStrategy.portfolioAllocation.highRisk}
                color="error"
                sx={{ mb: 2, height: 10, borderRadius: 1 }}
              />
            </Box>
          </Paper>

          {/* Action Plan */}
          <Paper elevation={3} sx={{ p: 3, bgcolor: 'success.50' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="success.main">
              ✅ Your Action Plan
            </Typography>

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
              Immediate Actions:
            </Typography>
            <List dense>
              {report.actionPlan.immediate.map((action, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary={action} />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
              Monthly Tasks:
            </Typography>
            <List dense>
              {report.actionPlan.monthly.map((action, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={action} />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
              Quarterly Reviews:
            </Typography>
            <List dense>
              {report.actionPlan.quarterly.map((action, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle color="info" />
                  </ListItemIcon>
                  <ListItemText primary={action} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button onClick={() => setActiveStep(0)}>Start Over</Button>
            <Button variant="contained" onClick={() => window.print()}>
              Download Plan (PDF)
            </Button>
          </Box>
        </>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={addGoalDialogOpen} onClose={() => setAddGoalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Financial Goal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Goal Title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="e.g., Buy a car, Foreign trip, etc."
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newGoal.category}
                  label="Category"
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                >
                  <MenuItem value="home">🏠 Home</MenuItem>
                  <MenuItem value="vehicle">🚗 Vehicle</MenuItem>
                  <MenuItem value="travel">✈️ Travel</MenuItem>
                  <MenuItem value="education">📚 Education</MenuItem>
                  <MenuItem value="emergency">🏥 Emergency Fund</MenuItem>
                  <MenuItem value="retirement">💰 Retirement</MenuItem>
                  <MenuItem value="other">📌 Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newGoal.priority}
                  label="Priority"
                  onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as any })}
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Target Amount (₹)"
                type="number"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Current Savings (₹)"
                type="number"
                value={newGoal.currentSavings}
                onChange={(e) => setNewGoal({ ...newGoal, currentSavings: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Timeline (months)"
                type="number"
                value={newGoal.timelineMonths}
                onChange={(e) => setNewGoal({ ...newGoal, timelineMonths: e.target.value })}
                helperText="In how many months do you want to achieve this?"
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddGoalDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddGoal}>
            Add Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={compareDialogOpen} onClose={() => setCompareDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>💰 Savings vs Investment Comparison</DialogTitle>
        <DialogContent>
          {selectedGoal && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedGoal.title}
              </Typography>

              {(() => {
                const comparison = compareSavingsVsInvestment(selectedGoal, financialInput.riskProfile);
                return (
                  <>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ bgcolor: 'grey.100' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Just Savings
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Monthly Amount
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                              ₹{comparison.savings.monthlyAmount.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                              Total Paid: ₹{comparison.savings.totalPaid.toLocaleString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ bgcolor: 'success.50' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom color="success.main">
                              With Investment
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Monthly Amount
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                              ₹{comparison.investment.monthlyAmount.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                              Total Paid: ₹{comparison.investment.totalPaid.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" display="block" color="success.main">
                              Returns: ₹{comparison.investment.returns.toLocaleString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Alert severity="success" sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {comparison.advantage}
                      </Typography>
                    </Alert>
                  </>
                );
              })()}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AIFinancialAdvisor;

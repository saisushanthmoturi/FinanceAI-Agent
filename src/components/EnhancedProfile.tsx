/**
 * Enhanced Profile Page
 * 
 * Comprehensive user profile with:
 * - Portfolio & Investment Details
 * - Tax Optimization History
 * - Future Financial Plans
 * - Active AI Agents
 * - Personal Information
 * - Financial Health Score
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
  Avatar,
  Chip,
  Alert,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  TrendingUp,
  AccountBalance,
  Assessment,
  CalendarMonth,
  SmartToy,
  Add,
  ExpandMore,
  CheckCircle,
  PlayArrow,
  Pause,
  Receipt,
  Home,
  DirectionsCar,
  Flight,
  School,
  Business,
  Savings,
  ShowChart,
  AttachMoney,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import {
  getUserProfileData,
  addInvestment,
  addFuturePlan,
  updateAgent,
  type UserProfileData,
  type Investment,
  type FuturePlan,
  type ActiveAgent,
} from '../services/profileService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedProfile: React.FC = () => {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [addInvestmentDialog, setAddInvestmentDialog] = useState(false);
  const [addPlanDialog, setAddPlanDialog] = useState(false);
  
  // Investment form
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    type: 'mutual_fund' as Investment['type'],
    category: 'equity' as Investment['category'],
    amount: '',
    investedAmount: '',
    returns: '',
    riskLevel: 'medium' as Investment['riskLevel'],
    sipAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  // Plan form
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentSavings: '',
    monthlyContribution: '',
    targetDate: '',
    category: 'other' as FuturePlan['category'],
    priority: 'medium' as FuturePlan['priority'],
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Loading profile data for user:', user.id);
      const data = await getUserProfileData(user.id);
      console.log('Profile data loaded:', data);
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async () => {
    if (!user) return;
    
    try {
      const amount = parseFloat(newInvestment.amount) || 0;
      const investedAmount = parseFloat(newInvestment.investedAmount) || 0;
      const returns = amount - investedAmount;
      const returnsPercentage = investedAmount > 0 ? (returns / investedAmount) * 100 : 0;
      
      await addInvestment(user.id, {
        name: newInvestment.name,
        type: newInvestment.type,
        category: newInvestment.category,
        amount,
        investedAmount,
        returns,
        returnsPercentage,
        sipAmount: newInvestment.sipAmount ? parseFloat(newInvestment.sipAmount) : undefined,
        startDate: new Date(newInvestment.startDate),
        riskLevel: newInvestment.riskLevel,
        status: 'active',
        notes: newInvestment.notes,
      });
      
      setAddInvestmentDialog(false);
      await loadProfileData(); // Reload data
      
      // Reset form
      setNewInvestment({
        name: '',
        type: 'mutual_fund',
        category: 'equity',
        amount: '',
        investedAmount: '',
        returns: '',
        riskLevel: 'medium',
        sipAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error) {
      console.error('Error adding investment:', error);
      alert('Failed to add investment');
    }
  };

  const handleAddPlan = async () => {
    if (!user) return;
    
    try {
      const targetAmount = parseFloat(newPlan.targetAmount) || 0;
      const currentSavings = parseFloat(newPlan.currentSavings) || 0;
      const progress = targetAmount > 0 ? (currentSavings / targetAmount) * 100 : 0;
      
      await addFuturePlan(user.id, {
        title: newPlan.title,
        description: newPlan.description,
        targetAmount,
        currentSavings,
        monthlyContribution: parseFloat(newPlan.monthlyContribution) || 0,
        targetDate: new Date(newPlan.targetDate),
        category: newPlan.category,
        priority: newPlan.priority,
        status: 'in_progress',
        progress,
        recommendedInvestments: [],
        milestones: [],
      });
      
      setAddPlanDialog(false);
      await loadProfileData();
      
      // Reset form
      setNewPlan({
        title: '',
        description: '',
        targetAmount: '',
        currentSavings: '',
        monthlyContribution: '',
        targetDate: '',
        category: 'other',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error adding plan:', error);
      alert('Failed to add plan');
    }
  };

  const handleToggleAgent = async (agent: ActiveAgent) => {
    try {
      const newStatus = agent.status === 'active' ? 'paused' : 'active';
      await updateAgent(agent.id, { status: newStatus });
      await loadProfileData();
    } catch (error) {
      console.error('Error toggling agent:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactElement> = {
      home: <Home />,
      vehicle: <DirectionsCar />,
      education: <School />,
      travel: <Flight />,
      business: <Business />,
      retirement: <Savings />,
      other: <AccountBalance />,
    };
    return icons[category] || <AccountBalance />;
  };

  const getAgentIcon = (type: string) => {
    const icons: Record<string, React.ReactElement> = {
      tax_optimizer: <Receipt />,
      investment_advisor: <ShowChart />,
      risk_monitor: <Assessment />,
      goal_planner: <CalendarMonth />,
      expense_tracker: <AttachMoney />,
    };
    return icons[type] || <SmartToy />;
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

  if (!profileData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load profile data</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with Profile Summary */}
      <Card elevation={3} sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 2 }}>
              <Avatar
                sx={{ width: 100, height: 100, bgcolor: 'white', color: 'primary.main', fontSize: 40 }}
              >
                {profileData.displayName.charAt(0).toUpperCase()}
              </Avatar>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {profileData.displayName}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {profileData.email}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip label={profileData.riskProfile.toUpperCase()} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                {profileData.occupation && <Chip label={profileData.occupation} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 'auto' }} textAlign="center">
              <Typography variant="h2" fontWeight="bold">
                {profileData.financialHealthScore}
              </Typography>
              <Typography variant="caption">Financial Health Score</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalance color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Portfolio
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ₹{(profileData.portfolio.currentValue / 100000).toFixed(2)}L
              </Typography>
              <Chip 
                label={`${profileData.portfolio.returnsPercentage >= 0 ? '+' : ''}${profileData.portfolio.returnsPercentage.toFixed(2)}%`}
                color={profileData.portfolio.returnsPercentage >= 0 ? 'success' : 'error'}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Returns
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                ₹{(profileData.portfolio.totalReturns / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Invested: ₹{(profileData.portfolio.totalInvested / 100000).toFixed(2)}L
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Receipt color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Tax Saved (This Year)
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                ₹{profileData.currentYearTax ? (profileData.currentYearTax.taxSaved / 1000).toFixed(0) : 0}K
              </Typography>
              <Typography variant="caption" color="text.secondary">
                FY {profileData.currentYearTax?.financialYear || '2024-25'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SmartToy color="info" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Active AI Agents
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {profileData.activeAgents.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Saving ₹{(profileData.activeAgents.reduce((sum, a) => sum + a.savingsGenerated, 0) / 1000).toFixed(0)}K
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Different Sections */}
      <Paper elevation={3}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Portfolio & Investments" icon={<AccountBalance />} iconPosition="start" />
          <Tab label="Tax History" icon={<Receipt />} iconPosition="start" />
          <Tab label="Future Plans" icon={<CalendarMonth />} iconPosition="start" />
          <Tab label="AI Agents" icon={<SmartToy />} iconPosition="start" />
        </Tabs>

        {/* Tab 1: Portfolio & Investments */}
        <TabPanel value={activeTab} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              My Investments
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setAddInvestmentDialog(true)}>
              Add Investment
            </Button>
          </Box>

          {/* Portfolio Allocation */}
          <Card elevation={2} sx={{ mb: 3, bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Portfolio Allocation
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {Object.entries(profileData.portfolio.allocation).map(([key, value]) => (
                  <Grid size={{ xs: 12, md: 2.4 }} key={key}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" textTransform="capitalize">
                        {key.replace('realEstate', 'Real Estate')}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={value} 
                        sx={{ height: 8, borderRadius: 1, my: 0.5 }}
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {value.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Investments List */}
          {profileData.portfolio.investments.length === 0 ? (
            <Alert severity="info">
              No investments found. Add your first investment to start tracking your portfolio.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {profileData.portfolio.investments.map((investment) => (
                <Grid size={{ xs: 12, md: 6 }} key={investment.id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {investment.name}
                          </Typography>
                          <Box display="flex" gap={0.5} mt={0.5}>
                            <Chip label={investment.type.replace('_', ' ').toUpperCase()} size="small" variant="outlined" />
                            <Chip 
                              label={investment.riskLevel.toUpperCase()} 
                              size="small" 
                              color={investment.riskLevel === 'low' ? 'success' : investment.riskLevel === 'high' ? 'error' : 'warning'}
                            />
                          </Box>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="h6" fontWeight="bold">
                            ₹{(investment.amount / 1000).toFixed(0)}K
                          </Typography>
                          <Chip 
                            label={`${investment.returnsPercentage >= 0 ? '+' : ''}${investment.returnsPercentage.toFixed(2)}%`}
                            size="small"
                            color={investment.returnsPercentage >= 0 ? 'success' : 'error'}
                          />
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <List dense>
                        <ListItem disablePadding>
                          <ListItemText primary="Invested" secondary={`₹${investment.investedAmount.toLocaleString('en-IN')}`} />
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemText primary="Returns" secondary={`₹${investment.returns.toLocaleString('en-IN')}`} />
                        </ListItem>
                        {investment.sipAmount && (
                          <ListItem disablePadding>
                            <ListItemText primary="Monthly SIP" secondary={`₹${investment.sipAmount.toLocaleString('en-IN')}`} />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Tab 2: Tax History */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            Tax Optimization History
          </Typography>

          {profileData.taxHistory.length === 0 ? (
            <Alert severity="info">
              No tax records found. Visit Tax Optimization page to start saving on taxes.
            </Alert>
          ) : (
            profileData.taxHistory.map((tax) => (
              <Accordion key={tax.id}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Receipt color="primary" sx={{ mr: 2 }} />
                    <Box flexGrow={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        FY {tax.financialYear}
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip label={tax.taxRegime.toUpperCase()} size="small" variant="outlined" />
                        <Chip label={tax.status.replace('_', ' ').toUpperCase()} size="small" color="primary" />
                        <Chip label={`Saved: ₹${(tax.taxSaved / 1000).toFixed(0)}K`} size="small" color="success" />
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="Annual Salary" secondary={`₹${tax.annualSalary.toLocaleString('en-IN')}`} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Total Tax Paid" secondary={`₹${tax.totalTaxPaid.toLocaleString('en-IN')}`} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Total Deductions" secondary={`₹${tax.totalDeductions.toLocaleString('en-IN')}`} />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Investment Breakdown:
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="Section 80C" secondary={`₹${tax.investments.section80C?.toLocaleString('en-IN') || 0}`} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Section 80D" secondary={`₹${tax.investments.section80D?.toLocaleString('en-IN') || 0}`} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Home Loan (24)" secondary={`₹${tax.investments.section24?.toLocaleString('en-IN') || 0}`} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="NPS (80CCD)" secondary={`₹${tax.investments.nps?.toLocaleString('en-IN') || 0}`} />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </TabPanel>

        {/* Tab 3: Future Plans */}
        <TabPanel value={activeTab} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              My Financial Goals
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setAddPlanDialog(true)}>
              Add Goal
            </Button>
          </Box>

          {profileData.futurePlans.length === 0 ? (
            <Alert severity="info">
              No goals found. Add your first financial goal to start planning your future.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {profileData.futurePlans.map((plan) => (
                <Grid size={{ xs: 12, md: 6 }} key={plan.id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Box display="flex" alignItems="start" mb={2}>
                        <Box
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            p: 1.5,
                            borderRadius: 2,
                            mr: 2,
                          }}
                        >
                          {getCategoryIcon(plan.category)}
                        </Box>
                        <Box flexGrow={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {plan.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {plan.description}
                          </Typography>
                          <Box display="flex" gap={0.5} mt={1}>
                            <Chip label={plan.priority.toUpperCase()} size="small" color={plan.priority === 'high' ? 'error' : plan.priority === 'medium' ? 'warning' : 'info'} />
                            <Chip label={plan.status.replace('_', ' ').toUpperCase()} size="small" variant="outlined" />
                          </Box>
                        </Box>
                      </Box>

                      <Box mb={2}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            Progress: {plan.progress.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" fontWeight="bold">
                            ₹{(plan.currentSavings / 1000).toFixed(0)}K / ₹{(plan.targetAmount / 1000).toFixed(0)}K
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={plan.progress} sx={{ height: 8, borderRadius: 1 }} />
                      </Box>

                      <List dense>
                        <ListItem disablePadding>
                          <ListItemText primary="Monthly Contribution" secondary={`₹${plan.monthlyContribution.toLocaleString('en-IN')}`} />
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemText 
                            primary="Target Date" 
                            secondary={new Date(plan.targetDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })} 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Tab 4: AI Agents */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" fontWeight="bold" mb={3}>
            Active AI Financial Agents
          </Typography>

          {profileData.activeAgents.length === 0 ? (
            <Alert severity="info">
              No active agents found. AI agents help automate your financial tasks and optimize savings.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {profileData.activeAgents.map((agent) => (
                <Grid size={{ xs: 12, md: 6 }} key={agent.id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Box display="flex" alignItems="start">
                          <Box
                            sx={{
                              bgcolor: agent.status === 'active' ? 'success.main' : 'grey.400',
                              color: 'white',
                              p: 1.5,
                              borderRadius: 2,
                              mr: 2,
                            }}
                          >
                            {getAgentIcon(agent.agentType)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {agent.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {agent.description}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton onClick={() => handleToggleAgent(agent)} size="small">
                          {agent.status === 'active' ? <Pause /> : <PlayArrow />}
                        </IconButton>
                      </Box>

                      <Chip 
                        label={agent.status.toUpperCase()} 
                        size="small" 
                        color={agent.status === 'active' ? 'success' : 'default'}
                        sx={{ mb: 2 }}
                      />

                      <List dense>
                        <ListItem disablePadding>
                          <ListItemText primary="Last Action" secondary={agent.lastAction} />
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemText 
                            primary="Last Active" 
                            secondary={new Date(agent.lastActionDate).toLocaleDateString('en-IN')} 
                          />
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemText primary="Actions Performed" secondary={agent.actionsPerformed} />
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemText 
                            primary="Savings Generated" 
                            secondary={`₹${agent.savingsGenerated.toLocaleString('en-IN')}`}
                            secondaryTypographyProps={{ color: 'success.main', fontWeight: 'bold' }}
                          />
                        </ListItem>
                      </List>

                      {agent.insights.length > 0 && (
                        <Box mt={2} p={1.5} bgcolor="info.50" borderRadius={1}>
                          <Typography variant="caption" fontWeight="bold" color="info.main">
                            Latest Insights:
                          </Typography>
                          <List dense>
                            {agent.insights.slice(0, 2).map((insight, idx) => (
                              <ListItem key={idx} disablePadding>
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                  <CheckCircle fontSize="small" color="info" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={insight} 
                                  primaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Add Investment Dialog */}
      <Dialog open={addInvestmentDialog} onClose={() => setAddInvestmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Investment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Investment Name"
                value={newInvestment.name}
                onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newInvestment.type}
                  label="Type"
                  onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value as Investment['type'] })}
                >
                  <MenuItem value="mutual_fund">Mutual Fund</MenuItem>
                  <MenuItem value="stock">Stock</MenuItem>
                  <MenuItem value="fd">Fixed Deposit</MenuItem>
                  <MenuItem value="ppf">PPF</MenuItem>
                  <MenuItem value="nps">NPS</MenuItem>
                  <MenuItem value="gold">Gold</MenuItem>
                  <MenuItem value="real_estate">Real Estate</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newInvestment.category}
                  label="Category"
                  onChange={(e) => setNewInvestment({ ...newInvestment, category: e.target.value as Investment['category'] })}
                >
                  <MenuItem value="equity">Equity</MenuItem>
                  <MenuItem value="debt">Debt</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                  <MenuItem value="gold">Gold</MenuItem>
                  <MenuItem value="real_estate">Real Estate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Current Value (₹)"
                type="number"
                value={newInvestment.amount}
                onChange={(e) => setNewInvestment({ ...newInvestment, amount: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Invested Amount (₹)"
                type="number"
                value={newInvestment.investedAmount}
                onChange={(e) => setNewInvestment({ ...newInvestment, investedAmount: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Monthly SIP (₹) - Optional"
                type="number"
                value={newInvestment.sipAmount}
                onChange={(e) => setNewInvestment({ ...newInvestment, sipAmount: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Risk Level</InputLabel>
                <Select
                  value={newInvestment.riskLevel}
                  label="Risk Level"
                  onChange={(e) => setNewInvestment({ ...newInvestment, riskLevel: e.target.value as Investment['riskLevel'] })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={newInvestment.startDate}
                onChange={(e) => setNewInvestment({ ...newInvestment, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={newInvestment.notes}
                onChange={(e) => setNewInvestment({ ...newInvestment, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddInvestmentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddInvestment}>Add Investment</Button>
        </DialogActions>
      </Dialog>

      {/* Add Plan Dialog */}
      <Dialog open={addPlanDialog} onClose={() => setAddPlanDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Financial Goal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Goal Title"
                value={newPlan.title}
                onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Target Amount (₹)"
                type="number"
                value={newPlan.targetAmount}
                onChange={(e) => setNewPlan({ ...newPlan, targetAmount: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Current Savings (₹)"
                type="number"
                value={newPlan.currentSavings}
                onChange={(e) => setNewPlan({ ...newPlan, currentSavings: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Monthly Contribution (₹)"
                type="number"
                value={newPlan.monthlyContribution}
                onChange={(e) => setNewPlan({ ...newPlan, monthlyContribution: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Target Date"
                type="date"
                value={newPlan.targetDate}
                onChange={(e) => setNewPlan({ ...newPlan, targetDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newPlan.category}
                  label="Category"
                  onChange={(e) => setNewPlan({ ...newPlan, category: e.target.value as FuturePlan['category'] })}
                >
                  <MenuItem value="home">Home</MenuItem>
                  <MenuItem value="vehicle">Vehicle</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                  <MenuItem value="retirement">Retirement</MenuItem>
                  <MenuItem value="travel">Travel</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newPlan.priority}
                  label="Priority"
                  onChange={(e) => setNewPlan({ ...newPlan, priority: e.target.value as FuturePlan['priority'] })}
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPlanDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPlan}>Add Goal</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EnhancedProfile;

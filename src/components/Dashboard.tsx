import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  TrendingUp,
  AccountBalance,
  Savings,
  ShowChart,
  Psychology,
  SmartToy,
  Chat,
  Refresh,
  Receipt,
  Security,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import { accountAggregatorService } from '../services/accountAggregator';
import { geminiService } from '../services/gemini';
import { agentService } from '../services/agentService';
import FinancialHealthScore from './FinancialHealthScore.tsx';
import AccountsList from './AccountsList.tsx';
import RecentTransactions from './RecentTransactions.tsx';
import type { DashboardData } from '../types';

const Dashboard: React.FC = () => {
  const { user, dashboardData, setDashboardData, loading, setLoading, setChatOpen } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [taxSavings, setTaxSavings] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadTaxSavings();
    }
  }, [user]);

  const loadTaxSavings = async () => {
    if (!user) return;
    try {
      const agents = await agentService.getAllAgents(user.id);
      const taxAgent = agents.find(a => a.id === 'agent-tax');
      if (taxAgent) {
        setTaxSavings(taxAgent.totalSavings);
      }
    } catch (error) {
      console.error('Error loading tax savings:', error);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch accounts
      const accounts = await accountAggregatorService.getUserAccounts(user.id);

      // Calculate totals (all accounts are assets for demo)
      const totalAssets = accounts.reduce((sum, a) => sum + a.balance, 0);
      const totalLiabilities = 0; // No liabilities in demo

      const totalNetWorth = totalAssets - totalLiabilities;

      // Mock data for demo (replace with actual calculations)
      const monthlyIncome = 100000;
      const monthlyExpenses = 65000;
      const monthlyDebt = 10000;
      const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;

      // Calculate financial health score
      const healthScore = await geminiService.calculateFinancialHealthScore(
        monthlyIncome,
        monthlyExpenses,
        monthlyIncome - monthlyExpenses,
        totalAssets,
        monthlyDebt,
        500000, // insurance
        200000  // emergency fund
      );

      const data: DashboardData = {
        totalNetWorth,
        totalAssets,
        totalLiabilities,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        accounts,
        recentTransactions: [],
        healthScore,
      };

      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      // In production, you'd have the consent ID stored
      const consentId = 'mock_consent_id';
      await accountAggregatorService.syncAllAccounts(user.id, consentId);
      await loadDashboardData();
    } catch (error) {
      console.error('Error syncing accounts:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Container>
        <Typography variant="h5">No data available</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Financial Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.displayName}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={syncing ? <CircularProgress size={20} /> : <Refresh />}
            onClick={handleSync}
            disabled={syncing}
          >
            Sync Accounts
          </Button>
          <IconButton
            color="primary"
            onClick={() => setChatOpen(true)}
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <Chat />
          </IconButton>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp color="primary" />
                <Typography variant="subtitle2" color="text.secondary" ml={1}>
                  Net Worth
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ₹{dashboardData.totalNetWorth.toLocaleString('en-IN')}
              </Typography>
              <Chip label="+12.5% this month" color="success" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalance color="primary" />
                <Typography variant="subtitle2" color="text.secondary" ml={1}>
                  Total Assets
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ₹{dashboardData.totalAssets.toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Savings color="primary" />
                <Typography variant="subtitle2" color="text.secondary" ml={1}>
                  Savings Rate
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {dashboardData.savingsRate.toFixed(1)}%
              </Typography>
              <Chip 
                label={dashboardData.savingsRate > 20 ? "Excellent!" : "Improve"} 
                color={dashboardData.savingsRate > 20 ? "success" : "warning"} 
                size="small" 
                sx={{ mt: 1 }} 
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ShowChart color="primary" />
                <Typography variant="subtitle2" color="text.secondary" ml={1}>
                  Monthly Income
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ₹{dashboardData.monthlyIncome.toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tax Savings Banner */}
      {taxSavings > 0 && (
        <Card 
          elevation={3} 
          sx={{ 
            mb: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Receipt sx={{ fontSize: 48 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    AI Tax Savings This Year
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
                    ₹{taxSavings.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    Saved through smart tax optimization strategies
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
                onClick={() => navigate('/tax-optimization')}
              >
                View Details
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Financial Health Score */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FinancialHealthScore score={dashboardData.healthScore} />
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              AI-Powered Features
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Psychology />}
                  sx={{ py: 2 }}
                  onClick={() => navigate('/scenario-simulator')}
                >
                  Scenario Simulator
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<SmartToy />}
                  sx={{ py: 2 }}
                  onClick={() => navigate('/agents')}
                >
                  Financial Agents
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Security />}
                  sx={{ py: 2 }}
                  onClick={() => navigate('/risk-agent')}
                >
                  Risk Agent
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Psychology />}
                  sx={{ py: 2 }}
                  onClick={() => navigate('/insights')}
                >
                  Behavioral Insights
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Chat />}
                  sx={{ py: 2 }}
                  onClick={() => setChatOpen(true)}
                >
                  Ask AI Advisor
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Accounts List */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AccountsList accounts={dashboardData.accounts} />
        </Grid>

        {/* Recent Transactions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <RecentTransactions transactions={dashboardData.recentTransactions} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;

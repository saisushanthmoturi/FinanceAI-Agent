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
} from '@mui/material';

import { Grid2 as Grid } from '@mui/material';
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
  TipsAndUpdates,
  Assessment,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import { accountAggregatorService } from '../services/accountAggregator';
import { geminiService } from '../services/gemini';
import { agentService } from '../services/agentService';
import FinancialHealthScore from './FinancialHealthScore.tsx';
import AccountsList from './AccountsList.tsx';
import RecentTransactions from './RecentTransactions.tsx';
import ManualTransactionModal from './ManualTransactionModal.tsx';
import { seedDataService } from '../services/seedDataService';
import { AutoFixHigh } from '@mui/icons-material';
import type { DashboardData } from '../types';
import { useTranslation } from '../hooks/useTranslation';




const Dashboard: React.FC = () => {
  const { user, dashboardData, setDashboardData, loading, setLoading, setChatOpen } = useAppStore();
  const { t } = useTranslation();

  const [syncing, setSyncing] = useState(false);
  const [taxSavings, setTaxSavings] = useState(0);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
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
        recentTransactions: [
          { id: 't-1', accountId: 'acc-1', date: new Date(), amount: 1500, type: 'debit', category: 'Food', description: 'Lunch at Starbucks', merchant: 'Starbucks' },
          { id: 't-2', accountId: 'acc-2', date: new Date(Date.now() - 86400000), amount: 125000, type: 'credit', category: 'Salary', description: 'Monthly Salary', merchant: 'TCS' },
          { id: 't-3', accountId: 'acc-1', date: new Date(Date.now() - 172800000), amount: 4500, type: 'debit', category: 'Shopping', description: 'Amazon Purchase', merchant: 'Amazon' },
          { id: 't-4', accountId: 'acc-3', date: new Date(Date.now() - 259200000), amount: 25000, type: 'debit', category: 'Rent', description: 'House Rent', merchant: 'NoBroker' },
        ],

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

  const handleSeedData = async () => {
    if (!user) return;
    
    try {
      setIsSeeding(true);
      await seedDataService.seedAllData(user.id, user.displayName || 'User', user.email);
      alert('✅ Demo data generated successfully! Refreshing page...');
      window.location.reload();
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('❌ Failed to generate demo data. Check console for details.');
    } finally {
      setIsSeeding(false);
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
    <>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t('welcome')}, {user?.displayName}!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Here's what's happening with your money today
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={isSeeding ? <CircularProgress size={20} /> : <AutoFixHigh />}
              onClick={handleSeedData}
              disabled={isSeeding}
              sx={{ borderRadius: 10 }}
            >
              {isSeeding ? '...' : t('genDemoData')}
            </Button>
            <Button
              variant="contained"
              startIcon={<TrendingUp />}
              onClick={() => setTransactionModalOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
              }}
            >
              Add Transaction
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? <CircularProgress size={20} /> : t('syncData')}
            </Button>
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
                    {t('netWorth')}
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
                    {t('assets')}
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
                    {t('savingsRate')}
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
                    {t('income')}
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
              <Card 
                elevation={2} 
                sx={{ 
                  mb: 2, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
                onClick={() => navigate('/ai-financial-advisor')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <TipsAndUpdates sx={{ fontSize: 48 }} />
                    <Box flexGrow={1}>
                      <Typography variant="h6" fontWeight="bold">
                        🤖 AI Financial Advisor
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                        Get personalized goal-based financial plans
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      sx={{ 
                        bgcolor: 'white', 
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'grey.100' }
                      }}
                    >
                      Start Planning
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Receipt />}
                    sx={{ py: 2 }}
                    onClick={() => navigate('/tax-optimization')}
                  >
                    Tax Optimization
                  </Button>
                </Grid>
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

          {/* Financial Report Feature */}
          <Grid size={{ xs: 12, md: 12 }}>
            <Card 
              elevation={6}
              sx={{ 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.01)' }
              }}
              onClick={() => navigate('/financial-report')}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={3}>
                  <Assessment sx={{ fontSize: 48 }} />
                  <Box flexGrow={1}>
                    <Typography variant="h5" fontWeight="bold">
                      📊 My Complete Financial Report
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                      Comprehensive analysis of Portfolio, Tax, Goals and AI insights
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    sx={{ 
                      bgcolor: 'white', 
                      color: 'warning.main',
                      px: 4,
                      fontWeight: 'bold',
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    Generate Report
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      
      <ManualTransactionModal 
        open={transactionModalOpen} 
        onClose={() => setTransactionModalOpen(false)} 
      />
    </>
  );
};



export default Dashboard;

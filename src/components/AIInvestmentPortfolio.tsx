/**
 * AI-Powered Investment Portfolio Component
 * Features:
 * - Browse real stocks with live data
 * - AI-powered recommendations
 * - Bank payment authorization
 * - Real-time portfolio tracking
 * - Investment alerts and notifications
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Badge,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ShowChart,
  TrendingUp,
  TrendingDown,
  Search,
  Psychology,
  AccountBalance,
  Notifications,
  Lock,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  ShoppingCart,
  Assessment,
  Timeline,
  Security,
  Payment,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { 
  aiPortfolioService, 
  type StockRecommendation, 
  type MutualFundRecommendation,
  type PortfolioInvestment,
  type BankPaymentRequest,
  type InvestmentAlert,
  type AIInvestmentStrategy,
} from '../services/aiPortfolioService';
import { userProfileService } from '../services/userProfileService';

const CHART_COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#0288d1'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`portfolio-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AIInvestmentPortfolio: React.FC = () => {
  const { user } = useAppStore();
  const [tabValue, setTabValue] = useState(0);
  
  // Browse & Recommendations
  const [stockRecommendations, setStockRecommendations] = useState<StockRecommendation[]>([]);
  const [mutualFundRecommendations, setMutualFundRecommendations] = useState<MutualFundRecommendation[]>([]);
  const [investmentAmount, setInvestmentAmount] = useState<number>(50000);
  const [riskProfile, setRiskProfile] = useState<'Conservative' | 'Moderate' | 'Aggressive'>('Moderate');
  const [loading, setLoading] = useState(false);
  const [aiStrategy, setAiStrategy] = useState<AIInvestmentStrategy | null>(null);
  
  // Portfolio Tracking
  const [portfolio, setPortfolio] = useState<PortfolioInvestment[]>([]);
  const [portfolioAlerts, setPortfolioAlerts] = useState<InvestmentAlert[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [portfolioProfitLoss, setPortfolioProfitLoss] = useState<number>(0);
  
  // Payment & Investment
  const [selectedInvestment, setSelectedInvestment] = useState<StockRecommendation | MutualFundRecommendation | null>(null);
  const [customInvestmentAmount, setCustomInvestmentAmount] = useState<number>(0);
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<BankPaymentRequest[]>([]);
  const [bankAccount, setBankAccount] = useState({
    accountNumber: '',
    ifscCode: '',
    bankName: 'HDFC Bank',
  });
  const [paymentGateway, setPaymentGateway] = useState<'UPI' | 'Net Banking' | 'Debit Card'>('UPI');
  const [password, setPassword] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });

  useEffect(() => {
    if (user) {
      loadInitialData();
      loadPortfolio();
      loadPendingPayments();
      
      // Auto-refresh portfolio every 5 minutes
      const interval = setInterval(() => {
        refreshPortfolioPrices();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      if (!user) return;
      
      const profile = await userProfileService.getProfile(user.id);
      
      if (!profile) {
        showSnackbar('Please set up your profile first', 'error');
        setLoading(false);
        return;
      }
      
      // Load AI recommendations
      const stocks = await aiPortfolioService.getStockRecommendations(
        profile,
        investmentAmount,
        riskProfile
      );
      setStockRecommendations(stocks);
      
      const mutualFunds = await aiPortfolioService.getMutualFundRecommendations(
        investmentAmount,
        true
      );
      setMutualFundRecommendations(mutualFunds);
      
      // Create AI strategy
      const strategy = await aiPortfolioService.createAIInvestmentStrategy(
        profile,
        investmentAmount,
        riskProfile
      );
      setAiStrategy(strategy);
      
    } catch (error) {
      console.error('Error loading investment data:', error);
      showSnackbar('Failed to load investment recommendations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolio = async () => {
    if (!user) return;
    
    try {
      const investments = await aiPortfolioService.getPortfolio(user.id);
      setPortfolio(investments);
      
      // Calculate totals
      const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
      const totalPL = investments.reduce((sum, inv) => sum + inv.profitLoss, 0);
      setPortfolioValue(totalValue);
      setPortfolioProfitLoss(totalPL);
      
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  };

  const loadPendingPayments = async () => {
    if (!user) return;
    
    try {
      const payments = await aiPortfolioService.getPendingPaymentRequests(user.id);
      setPendingPayments(payments);
    } catch (error) {
      console.error('Error loading pending payments:', error);
    }
  };

  const refreshPortfolioPrices = async () => {
    if (!user) return;
    
    try {
      const alerts = await aiPortfolioService.updatePortfolioPrices(user.id);
      setPortfolioAlerts(alerts);
      
      if (alerts.length > 0) {
        showSnackbar(`${alerts.length} new alert(s) for your investments`, 'warning');
      }
      
      await loadPortfolio();
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
    }
  };

  const handleSearchRecommendations = async () => {
    await loadInitialData();
  };

  const handleInvestClick = (investment: StockRecommendation | MutualFundRecommendation) => {
    setSelectedInvestment(investment);
    
    // Set default investment amount based on type
    if ('currentPrice' in investment) {
      // Stock
      setCustomInvestmentAmount(investment.minimumInvestment);
    } else {
      // Mutual Fund
      setCustomInvestmentAmount(investment.minimumInvestment);
    }
    
    setInvestDialogOpen(true);
  };

  const handleProceedToPayment = async () => {
    if (!selectedInvestment || !user) return;
    
    if (customInvestmentAmount < ('minimumInvestment' in selectedInvestment ? selectedInvestment.minimumInvestment : 500)) {
      showSnackbar('Investment amount below minimum', 'error');
      return;
    }
    
    setInvestDialogOpen(false);
    setPaymentDialogOpen(true);
  };

  const handleAuthorizePayment = async () => {
    if (!selectedInvestment || !user) return;
    
    setProcessingPayment(true);
    
    try {
      // Calculate quantity
      const price = 'currentPrice' in selectedInvestment ? selectedInvestment.currentPrice : selectedInvestment.nav;
      const quantity = Math.floor(customInvestmentAmount / price);
      
      // Create payment request
      const paymentRequest = await aiPortfolioService.requestBankPaymentAuthorization(
        user.id,
        {
          type: 'symbol' in selectedInvestment ? 'Stock' : 'Mutual Fund',
          symbol: 'symbol' in selectedInvestment ? selectedInvestment.symbol : selectedInvestment.fundName,
          name: 'companyName' in selectedInvestment ? selectedInvestment.companyName : selectedInvestment.fundName,
          amount: customInvestmentAmount,
          quantity,
        },
        bankAccount,
        paymentGateway
      );
      
      // Authorize payment with password
      const result = await aiPortfolioService.authorizePayment(paymentRequest.requestId, password);
      
      if (result.status === 'success') {
        // Add to portfolio
        await aiPortfolioService.addToPortfolio(user.id, {
          type: 'symbol' in selectedInvestment ? 'Stock' : 'Mutual Fund',
          symbol: 'symbol' in selectedInvestment ? selectedInvestment.symbol : selectedInvestment.fundName,
          name: 'companyName' in selectedInvestment ? selectedInvestment.companyName : selectedInvestment.fundName,
          quantity,
          purchasePrice: price,
        });
        
        showSnackbar('Investment successful! Added to your portfolio.', 'success');
        
        // Reload portfolio
        await loadPortfolio();
        await loadPendingPayments();
        
        // Reset state
        setPaymentDialogOpen(false);
        setSelectedInvestment(null);
        setPassword('');
        setBankAccount({ accountNumber: '', ifscCode: '', bankName: 'HDFC Bank' });
      } else {
        showSnackbar(result.message, 'error');
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      showSnackbar('Payment failed. Please try again.', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          <Psychology sx={{ mr: 1, verticalAlign: 'bottom' }} />
          AI Investment Portfolio
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered stock recommendations, automated portfolio tracking, and secure investment execution
        </Typography>
      </Box>

      {/* Pending Payments Alert */}
      {pendingPayments.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={loadPendingPayments}>
              Refresh
            </Button>
          }
        >
          <strong>{pendingPayments.length} pending payment authorization(s)</strong> - Review and authorize to complete investments
        </Alert>
      )}

      {/* Portfolio Summary Cards */}
      {portfolio.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Portfolio Value
                  </Typography>
                  <AccountBalance color="primary" />
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }} fontWeight="bold">
                  {formatCurrency(portfolioValue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Profit/Loss
                  </Typography>
                  {portfolioProfitLoss >= 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                </Box>
                <Typography 
                  variant="h4" 
                  sx={{ mt: 1 }} 
                  fontWeight="bold"
                  color={portfolioProfitLoss >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(Math.abs(portfolioProfitLoss))}
                </Typography>
                <Typography variant="body2" color={portfolioProfitLoss >= 0 ? 'success.main' : 'error.main'}>
                  {formatPercent((portfolioProfitLoss / (portfolioValue - portfolioProfitLoss)) * 100)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Active Investments
                  </Typography>
                  <Badge badgeContent={portfolioAlerts.length} color="error">
                    <Notifications color="action" />
                  </Badge>
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }} fontWeight="bold">
                  {portfolio.length}
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<Refresh />}
                  onClick={refreshPortfolioPrices}
                  sx={{ mt: 1 }}
                >
                  Update Prices
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper elevation={3}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Search />} label="Browse & AI Recommendations" />
          <Tab icon={<ShowChart />} label="My Portfolio" />
          <Tab icon={<Timeline />} label="AI Strategy" />
          <Tab icon={<Notifications />} label={`Alerts (${portfolioAlerts.length})`} />
        </Tabs>

        {/* Tab 1: Browse & Recommendations */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Investment Amount"
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  InputProps={{
                    startAdornment: '₹',
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Risk Profile</InputLabel>
                  <Select
                    value={riskProfile}
                    label="Risk Profile"
                    onChange={(e) => setRiskProfile(e.target.value as any)}
                  >
                    <MenuItem value="Conservative">Conservative</MenuItem>
                    <MenuItem value="Moderate">Moderate</MenuItem>
                    <MenuItem value="Aggressive">Aggressive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Psychology />}
                  onClick={handleSearchRecommendations}
                  disabled={loading}
                >
                  Get AI Recommendations
                </Button>
              </Grid>
            </Grid>
          </Box>

          {loading && <LinearProgress sx={{ mb: 3 }} />}

          {/* Stock Recommendations */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            <ShowChart sx={{ mr: 1, verticalAlign: 'bottom' }} />
            AI-Recommended Stocks
          </Typography>
          
          <Grid container spacing={3}>
            {stockRecommendations.map((stock) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={stock.symbol}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {stock.symbol}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stock.companyName}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`AI: ${stock.aiRating}/10`} 
                        color="primary" 
                        size="small"
                        icon={<Psychology />}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={stock.sector} size="small" />
                      <Chip 
                        label={stock.riskLevel} 
                        size="small" 
                        color={getRiskColor(stock.riskLevel) as any}
                      />
                      <Chip label={stock.investmentHorizon} size="small" variant="outlined" />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={1}>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">Current Price</Typography>
                        <Typography variant="h6" fontWeight="bold">{formatCurrency(stock.currentPrice)}</Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">Target Price</Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(stock.targetPrice)}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">Potential Return</Typography>
                        <Typography variant="body1" color="success.main" fontWeight="bold">
                          +{stock.potentialReturn}%
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">Min. Investment</Typography>
                        <Typography variant="body1">{formatCurrency(stock.minimumInvestment)}</Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <Psychology sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      AI Analysis:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {stock.aiAnalysis}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`RSI: ${stock.technicalIndicators.rsi}`} 
                        size="small" 
                        variant="outlined"
                      />
                      <Chip 
                        label={stock.technicalIndicators.movingAverage} 
                        size="small" 
                        variant="outlined"
                        color={stock.technicalIndicators.movingAverage === 'Bullish' ? 'success' : 'default'}
                      />
                      <Chip 
                        label={`P/E: ${stock.fundamentals.peRatio}`} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCart />}
                      onClick={() => handleInvestClick(stock)}
                    >
                      Invest Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Mutual Fund Recommendations */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            <Assessment sx={{ mr: 1, verticalAlign: 'bottom' }} />
            AI-Recommended Mutual Funds
          </Typography>
          
          <Grid container spacing={3}>
            {mutualFundRecommendations.map((fund, index) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {fund.fundName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {fund.fundHouse}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`AI: ${fund.aiRating}/10`} 
                        color="primary" 
                        size="small"
                        icon={<Psychology />}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={fund.category} size="small" />
                      <Chip 
                        label={fund.riskLevel} 
                        size="small" 
                        color={getRiskColor(fund.riskLevel) as any}
                      />
                      {fund.taxBenefit && <Chip label="Tax Saver" size="small" color="success" />}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={1}>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">NAV</Typography>
                        <Typography variant="h6" fontWeight="bold">{formatCurrency(fund.nav)}</Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">1Y Return</Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          +{fund.returns.oneYear}%
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">3Y Return</Typography>
                        <Typography variant="body1" color="success.main">+{fund.returns.threeYear}%</Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">5Y Return</Typography>
                        <Typography variant="body1" color="success.main">+{fund.returns.fiveYear}%</Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <Psychology sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      AI Analysis:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {fund.aiAnalysis}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`Expense: ${fund.expenseRatio}%`} 
                        size="small" 
                        variant="outlined"
                      />
                      <Chip 
                        label={`Min: ${formatCurrency(fund.minimumInvestment)}`} 
                        size="small" 
                        variant="outlined"
                      />
                      <Chip 
                        label={`SIP: ${formatCurrency(fund.recommendedSIP)}`} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCart />}
                      onClick={() => handleInvestClick(fund)}
                    >
                      Invest Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Tab 2: My Portfolio */}
        <TabPanel value={tabValue} index={1}>
          {portfolio.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ShowChart sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Investments Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start investing with AI-powered recommendations
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<Psychology />}
                onClick={() => setTabValue(0)}
              >
                Browse Recommendations
              </Button>
            </Box>
          ) : (
            <>
              {/* Portfolio Chart */}
              <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Portfolio Performance</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={portfolio.map(inv => ({
                    name: inv.symbol,
                    invested: inv.investmentAmount,
                    current: inv.currentValue,
                    pl: inv.profitLoss,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="invested" 
                      stackId="1"
                      stroke="#1976d2" 
                      fill="#1976d2" 
                      name="Invested"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pl" 
                      stackId="1"
                      stroke="#2e7d32" 
                      fill="#2e7d32" 
                      name="Profit/Loss"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>

              {/* Investment List */}
              <Grid container spacing={3}>
                {portfolio.map((investment) => (
                  <Grid size={{ xs: 12, md: 6 }} key={investment.id}>
                    <Card elevation={2}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {investment.symbol}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {investment.name}
                            </Typography>
                          </Box>
                          <Chip 
                            label={investment.type} 
                            size="small" 
                            color="primary"
                          />
                        </Box>

                        <Grid container spacing={2}>
                          <Grid size={6}>
                            <Typography variant="body2" color="text.secondary">Quantity</Typography>
                            <Typography variant="body1" fontWeight="bold">{investment.quantity}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="body2" color="text.secondary">Purchase Price</Typography>
                            <Typography variant="body1">{formatCurrency(investment.purchasePrice)}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="body2" color="text.secondary">Current Price</Typography>
                            <Typography variant="body1">{formatCurrency(investment.currentPrice)}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="body2" color="text.secondary">Current Value</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {formatCurrency(investment.currentValue)}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Profit/Loss</Typography>
                            <Typography 
                              variant="h6" 
                              fontWeight="bold"
                              color={investment.profitLoss >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatCurrency(Math.abs(investment.profitLoss))}
                            </Typography>
                            <Typography 
                              variant="body2"
                              color={investment.profitLoss >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatPercent(investment.profitLossPercent)}
                            </Typography>
                          </Box>
                          {investment.profitLoss >= 0 ? (
                            <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                          ) : (
                            <TrendingDown sx={{ fontSize: 40, color: 'error.main' }} />
                          )}
                        </Box>

                        {investment.alerts.length > 0 && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            {investment.alerts[investment.alerts.length - 1].message}
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </TabPanel>

        {/* Tab 3: AI Strategy */}
        <TabPanel value={tabValue} index={2}>
          {aiStrategy ? (
            <>
              <Alert severity="info" icon={<Psychology />} sx={{ mb: 3 }}>
                <strong>AI Investment Strategy</strong><br />
                {aiStrategy.aiInsights}
              </Alert>

              <Grid container spacing={3}>
                {/* Asset Allocation */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Asset Allocation</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Stocks', value: aiStrategy.assetAllocation.stocks },
                            { name: 'Mutual Funds', value: aiStrategy.assetAllocation.mutualFunds },
                            { name: 'Bonds', value: aiStrategy.assetAllocation.bonds },
                            { name: 'Cash', value: aiStrategy.assetAllocation.cash },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {CHART_COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                {/* Strategy Details */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Strategy Details</Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><Assessment /></ListItemIcon>
                        <ListItemText 
                          primary="Risk Profile" 
                          secondary={aiStrategy.riskProfile}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><TrendingUp /></ListItemIcon>
                        <ListItemText 
                          primary="Expected Return" 
                          secondary={`${aiStrategy.expectedPortfolioReturn.toFixed(2)}% annually`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Timeline /></ListItemIcon>
                        <ListItemText 
                          primary="Time Horizon" 
                          secondary={aiStrategy.timeHorizon}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Refresh /></ListItemIcon>
                        <ListItemText 
                          primary="Rebalancing" 
                          secondary={aiStrategy.rebalancingFrequency}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Psychology sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Strategy Created Yet
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<Psychology />}
                onClick={handleSearchRecommendations}
              >
                Create AI Strategy
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Tab 4: Alerts */}
        <TabPanel value={tabValue} index={3}>
          {portfolioAlerts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Active Alerts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your portfolio is performing well!
              </Typography>
            </Box>
          ) : (
            <List>
              {portfolioAlerts.map((alert, index) => (
                <ListItem key={alert.id} divider={index < portfolioAlerts.length - 1}>
                  <ListItemIcon>
                    {alert.type === 'Stop Loss' ? (
                      <Warning color="error" />
                    ) : alert.type === 'Target Reached' ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Info color="info" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.message}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {alert.actionRecommended}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                  <Chip 
                    label={alert.priority} 
                    size="small"
                    color={alert.priority === 'High' ? 'error' : alert.priority === 'Medium' ? 'warning' : 'default'}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </Paper>

      {/* Investment Dialog */}
      <Dialog 
        open={investDialogOpen} 
        onClose={() => setInvestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart />
            Invest in {selectedInvestment && ('companyName' in selectedInvestment ? selectedInvestment.companyName : selectedInvestment?.fundName)}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvestment && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Minimum Investment:</strong> {formatCurrency('minimumInvestment' in selectedInvestment ? selectedInvestment.minimumInvestment : 500)}
              </Alert>

              <TextField
                fullWidth
                label="Investment Amount"
                type="number"
                value={customInvestmentAmount}
                onChange={(e) => setCustomInvestmentAmount(Number(e.target.value))}
                InputProps={{
                  startAdornment: '₹',
                }}
                sx={{ mb: 3 }}
              />

              {'currentPrice' in selectedInvestment && (
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    You will get approximately:
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {Math.floor(customInvestmentAmount / selectedInvestment.currentPrice)} shares
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @ {formatCurrency(selectedInvestment.currentPrice)} per share
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvestDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleProceedToPayment}
            startIcon={<Payment />}
          >
            Proceed to Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Authorization Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => !processingPayment && setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security color="primary" />
            Secure Payment Authorization
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>⚠️ Payment Confirmation Required</strong><br />
            You are about to invest {formatCurrency(customInvestmentAmount)}. Please authorize this payment.
          </Alert>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentGateway}
              label="Payment Method"
              onChange={(e) => setPaymentGateway(e.target.value as any)}
            >
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="Net Banking">Net Banking</MenuItem>
              <MenuItem value="Debit Card">Debit Card</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Bank Name"
            value={bankAccount.bankName}
            onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Account Number"
            value={bankAccount.accountNumber}
            onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="IFSC Code"
            value={bankAccount.ifscCode}
            onChange={(e) => setBankAccount({ ...bankAccount, ifscCode: e.target.value.toUpperCase() })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="password"
            label="Enter Password to Authorize"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Your password is required for security"
          />

          {processingPayment && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)} disabled={processingPayment}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleAuthorizePayment}
            startIcon={processingPayment ? <CircularProgress size={20} color="inherit" /> : <Lock />}
            disabled={!password || !bankAccount.accountNumber || !bankAccount.ifscCode || processingPayment}
          >
            Authorize Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AIInvestmentPortfolio;

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
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
  CircularProgress,
  Snackbar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ShowChart,
  TrendingUp,
  TrendingDown,
  AddCircle,
  Info,
  PieChart as PieChartIcon,
  Timeline,
  AccountBalance,
  Delete as DeleteIcon,
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
import type { Investment, AssetType } from '../services/portfolioService';
import {
  addInvestment,
  getUserInvestments,
  deleteInvestment,
  calculatePortfolioSummary,
} from '../services/portfolioService';

interface PortfolioPerformance {
  month: string;
  value: number;
  invested: number;
  returns: number;
}

const InvestmentPortfolio: React.FC = () => {
  const { user } = useAppStore();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [performance, setPerformance] = useState<PortfolioPerformance[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'stocks' as AssetType,
    quantity: '',
    buyPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const userInvestments = await getUserInvestments(user.id);
      setInvestments(userInvestments);

      const summary = calculatePortfolioSummary(userInvestments);
      setTotalValue(summary.totalCurrentValue);
      setTotalInvested(summary.totalInvested);
      setTotalReturns(summary.totalReturns);

      // Mock performance data for now
      const mockPerformance: PortfolioPerformance[] = [
        { month: 'Apr', value: summary.totalCurrentValue * 0.8, invested: summary.totalInvested, returns: summary.totalReturns * 0.8 },
        { month: 'May', value: summary.totalCurrentValue * 0.85, invested: summary.totalInvested, returns: summary.totalReturns * 0.85 },
        { month: 'Jun', value: summary.totalCurrentValue * 0.90, invested: summary.totalInvested, returns: summary.totalReturns * 0.90 },
        { month: 'Jul', value: summary.totalCurrentValue * 0.93, invested: summary.totalInvested, returns: summary.totalReturns * 0.93 },
        { month: 'Aug', value: summary.totalCurrentValue * 0.96, invested: summary.totalInvested, returns: summary.totalReturns * 0.96 },
        { month: 'Sep', value: summary.totalCurrentValue * 0.98, invested: summary.totalInvested, returns: summary.totalReturns * 0.98 },
        { month: 'Oct', value: summary.totalCurrentValue, invested: summary.totalInvested, returns: summary.totalReturns },
      ];
      setPerformance(mockPerformance);

      console.log(`✅ Loaded ${userInvestments.length} investments`);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      showSnackbar('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async () => {
    try {
      if (!user) return;

      const quantity = parseFloat(formData.quantity);
      const buyPrice = parseFloat(formData.buyPrice);

      if (!formData.name || !quantity || !buyPrice) {
        showSnackbar('Please fill all required fields');
        return;
      }

      const amount = quantity * buyPrice;

      await addInvestment(user.id, {
        name: formData.name,
        type: formData.type,
        quantity,
        buyPrice,
        amount,
        purchaseDate: new Date(formData.purchaseDate),
        notes: formData.notes,
      });

      showSnackbar(`Added ${formData.name} to portfolio`);
      setAddDialogOpen(false);
      
      // Reset form
      setFormData({
        name: '',
        type: 'stocks',
        quantity: '',
        buyPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
      });

      // Reload data
      await loadPortfolioData();
    } catch (error) {
      console.error('Error adding investment:', error);
      showSnackbar('Failed to add investment');
    }
  };

  const handleDeleteInvestment = async (investmentId: string) => {
    try {
      if (!user) return;

      await deleteInvestment(user.id, investmentId);
      showSnackbar('Investment removed');
      await loadPortfolioData();
    } catch (error) {
      console.error('Error deleting investment:', error);
      showSnackbar('Failed to remove investment');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const getInvestmentIcon = (type: string) => {
    switch (type) {
      case 'stocks':
        return <ShowChart />;
      case 'mutual_funds':
        return <Timeline />;
      case 'bonds':
        return <AccountBalance />;
      default:
        return <PieChartIcon />;
    }
  };

  const getInvestmentColor = (type: string) => {
    const colors: Record<string, string> = {
      stocks: '#3b82f6',
      mutual_funds: '#8b5cf6',
      bonds: '#10b981',
      gold: '#f59e0b',
      crypto: '#ef4444',
      real_estate: '#06b6d4',
    };
    return colors[type] || '#6366f1';
  };

  const allocationData = investments.map((inv) => ({
    name: inv.name,
    value: inv.allocation,
    color: getInvestmentColor(inv.type),
  }));

  const returnsPercentage = totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Investment Portfolio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and analyze your investments in real-time
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() => setAddDialogOpen(true)}
          size="large"
        >
          Add Investment
        </Button>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                Total Portfolio Value
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                ₹{(totalValue / 100000).toFixed(2)}L
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                Across {investments.length} investments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Invested
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                ₹{(totalInvested / 100000).toFixed(2)}L
              </Typography>
              <Chip
                label="Principal Amount"
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Returns
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    ₹{(totalReturns / 100000).toFixed(2)}L
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 48, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Returns %
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {returnsPercentage.toFixed(2)}%
              </Typography>
              <Chip
                label={returnsPercentage > 0 ? 'Profit' : 'Loss'}
                size="small"
                color={returnsPercentage > 0 ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Portfolio Performance */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Portfolio Performance
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={performance}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                <RechartsTooltip
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  name="Current Value"
                />
                <Area
                  type="monotone"
                  dataKey="invested"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorInvested)"
                  name="Invested Amount"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Asset Allocation */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Asset Allocation
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value }: any) => `${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {investments.map((inv) => (
                <Box key={inv.id} display="flex" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 1,
                        bgcolor: getInvestmentColor(inv.type),
                        mr: 1,
                      }}
                    />
                    <Typography variant="caption">{inv.type}</Typography>
                  </Box>
                  <Typography variant="caption" fontWeight="bold">
                    {inv.allocation}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Investment List */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Your Investments
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {investments.map((investment) => (
            <Grid key={investment.id} size={{ xs: 12, md: 6 }}>
              <Card
                elevation={2}
                sx={{
                  borderLeft: 4,
                  borderColor: getInvestmentColor(investment.type),
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: `${getInvestmentColor(investment.type)}20`,
                          color: getInvestmentColor(investment.type),
                          mr: 2,
                        }}
                      >
                        {getInvestmentIcon(investment.type)}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {investment.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {investment.type.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`${(investment.returnsPercentage ?? 0) > 0 ? '+' : ''}${(investment.returnsPercentage ?? 0).toFixed(1)}%`}
                        color={(investment.returnsPercentage ?? 0) > 0 ? 'success' : 'error'}
                        size="small"
                        icon={(investment.returnsPercentage ?? 0) > 0 ? <TrendingUp /> : <TrendingDown />}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteInvestment(investment.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Invested
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{(investment.amount / 1000).toFixed(0)}K
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Current
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{((investment.currentValue ?? investment.amount) / 1000).toFixed(0)}K
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Returns
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={(investment.returns ?? 0) > 0 ? 'success.main' : 'error.main'}
                      >
                        ₹{((investment.returns ?? 0) / 1000).toFixed(0)}K
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* AI Insights */}
      <Alert severity="info" icon={<Info />} sx={{ mt: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          AI Portfolio Analysis
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Your portfolio is well-diversified with {investments.length} asset classes</li>
          <li>Current allocation: {investments[0]?.allocation}% in equity, which is optimal for your age</li>
          <li>Consider rebalancing if equity exceeds 70%</li>
          <li>Expected annual return: 12-15% based on historical performance</li>
        </ul>
      </Alert>
        </>
      )}

      {/* Add Investment Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Investment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Investment Name"
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetType })}
            >
              <MenuItem value="stocks">Stocks</MenuItem>
              <MenuItem value="mutual_funds">Mutual Funds</MenuItem>
              <MenuItem value="bonds">Bonds</MenuItem>
              <MenuItem value="gold">Gold</MenuItem>
              <MenuItem value="crypto">Cryptocurrency</MenuItem>
              <MenuItem value="real_estate">Real Estate</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            variant="outlined"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Buy Price (₹)"
            type="number"
            variant="outlined"
            value={formData.buyPrice}
            onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Purchase Date"
            type="date"
            variant="outlined"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Notes (Optional)"
            variant="outlined"
            multiline
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddInvestment}>
            Add Investment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default InvestmentPortfolio;

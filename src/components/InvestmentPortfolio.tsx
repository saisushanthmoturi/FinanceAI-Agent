import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  AddCircle,
  TrendingUp,
  TrendingDown,
  Delete,
  PieChart as PieChartIcon,
  Timeline,
  Info,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import type { Investment, AssetType } from '../services/portfolioService';
import { useTranslation } from '../hooks/useTranslation';
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
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'mutual_funds', label: 'Mutual Funds' },
  { value: 'bonds', label: 'Bonds' },
  { value: 'gold', label: 'Gold' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'fixed_deposit', label: 'Fixed Deposit' },
  { value: 'etf', label: 'ETF' },
];

const InvestmentPortfolio: React.FC = () => {
  const { user } = useAppStore();
  const { t } = useTranslation();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [performance, setPerformance] = useState<PortfolioPerformance[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState<Partial<Investment>>({
    name: '',
    type: 'stocks',
    quantity: 0,
    buyPrice: 0,
    amount: 0,
    purchaseDate: new Date(),
  });

  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user]);

  const loadPortfolioData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserInvestments(user.id);
      setInvestments(data);
      
      const summary = calculatePortfolioSummary(data);
      setTotalValue(summary.totalCurrentValue);
      setTotalInvested(summary.totalInvested);

      // Generate mock performance data
      const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
      const performanceData = months.map((month, index) => {
        const factor = 1 + (index * 0.05);
        return {
          month,
          value: summary.totalCurrentValue * factor,
          invested: summary.totalInvested,
        };
      });
      setPerformance(performanceData);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async () => {
    if (!user || !newInvestment.name || !newInvestment.quantity || !newInvestment.buyPrice) return;

    try {
      const investmentToAdd = {
        name: newInvestment.name,
        type: newInvestment.type as AssetType,
        quantity: Number(newInvestment.quantity),
        buyPrice: Number(newInvestment.buyPrice),
        amount: Number(newInvestment.quantity) * Number(newInvestment.buyPrice),
        purchaseDate: newInvestment.purchaseDate || new Date(),
      };

      await addInvestment(user.id, investmentToAdd);
      setAddDialogOpen(false);
      loadPortfolioData();
      // Reset form
      setNewInvestment({
        name: '',
        type: 'stocks',
        quantity: 0,
        buyPrice: 0,
        amount: 0,
        purchaseDate: new Date(),
      });
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteInvestment(user.id, id);
      loadPortfolioData();
    } catch (error) {
      console.error('Error deleting investment:', error);
    }
  };

  const totalReturns = totalValue - totalInvested;
  const returnsPercentage = totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0;

  const getInvestmentColor = (type: AssetType) => {
    switch (type) {
      case 'stocks': return '#3b82f6';
      case 'mutual_funds': return '#8b5cf6';
      case 'crypto': return '#f59e0b';
      case 'gold': return '#fbbf24';
      case 'real_estate': return '#10b981';
      default: return '#64748b';
    }
  };

  const allocationData = Object.entries(
    investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + (inv.currentValue || inv.amount);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name,
    value: Math.round((value / totalValue) * 100),
    color: getInvestmentColor(name as AssetType),
  }));

  const formatValue = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {t('portfolioData.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('portfolioData.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() => setAddDialogOpen(true)}
          size="large"
        >
          {t('portfolioData.addInvestment')}
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
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    {t('portfolioData.totalValue')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatValue(totalValue)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                    {t('portfolioData.across')} {investments.length} {t('dashboard').toLowerCase()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('portfolioData.totalInvested')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatValue(totalInvested)}
                  </Typography>
                  <Chip label="Principal Amount" size="small" variant="outlined" sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card elevation={3}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('portfolioData.totalReturns')}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color={(totalReturns >= 0) ? "success.main" : "error.main"}>
                        {formatValue(totalReturns)}
                      </Typography>
                    </Box>
                    {totalReturns >= 0 ? 
                      <TrendingUp sx={{ fontSize: 48, color: 'success.main', opacity: 0.7 }} /> :
                      <TrendingDown sx={{ fontSize: 48, color: 'error.main', opacity: 0.7 }} />
                    }
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('portfolioData.returnsPercentage')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={returnsPercentage >= 0 ? "success.main" : "error.main"}>
                    {returnsPercentage.toFixed(2)}%
                  </Typography>
                  <Chip label={returnsPercentage >= 0 ? 'Profit' : 'Loss'} size="small" color={returnsPercentage >= 0 ? 'success' : 'error'} sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {t('portfolioData.pnl')}
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={performance}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <RechartsTooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorValue)" name="Current Value" />
                    <Area type="monotone" dataKey="invested" stroke="#3b82f6" fillOpacity={0} fill="transparent" name="Invested" />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  {t('portfolioData.allocation')}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
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
                  {allocationData.map((data) => (
                    <Box key={data.name} display="flex" justifyContent="space-between" mb={1}>
                      <Box display="flex" alignItems="center">
                        <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: data.color, mr: 1 }} />
                        <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{data.name.replace('_', ' ')}</Typography>
                      </Box>
                      <Typography variant="caption" fontWeight="bold">{data.value}%</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Investment List */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {t('portfolioData.title')}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {investments.map((investment) => (
                <Grid key={investment.id} size={{ xs: 12, md: 6 }}>
                  <Card elevation={2} sx={{ borderLeft: 4, borderColor: getInvestmentColor(investment.type) }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">{investment.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                            {investment.type.replace('_', ' ')}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => handleDelete(investment.id)} color="error">
                          <Delete size-small="true" />
                        </IconButton>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 4 }}>
                          <Typography variant="caption" color="text.secondary">{t('portfolioData.invested')}</Typography>
                          <Typography variant="body2" fontWeight="bold">{formatValue(investment.amount)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Typography variant="caption" color="text.secondary">{t('portfolioData.current')}</Typography>
                          <Typography variant="body2" fontWeight="bold">{formatValue(investment.currentValue || investment.amount)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Typography variant="caption" color="text.secondary">{t('portfolioData.returns')}</Typography>
                          <Typography variant="body2" fontWeight="bold" color={(investment.returns ?? 0) >= 0 ? 'success.main' : 'error.main'}>
                            {formatValue(investment.returns ?? 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('portfolioData.addInvestment')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Asset Name"
              value={newInvestment.name}
              onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
              placeholder="e.g., Apple Inc, Bitcoin"
            />
            <TextField
              fullWidth
              select
              label={t('portfolioData.type')}
              value={newInvestment.type}
              onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value as AssetType })}
            >
              {ASSET_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label={t('portfolioData.quantity')}
                type="number"
                value={newInvestment.quantity}
                onChange={(e) => setNewInvestment({ ...newInvestment, quantity: Number(e.target.value) })}
              />
              <TextField
                fullWidth
                label={t('portfolioData.avgPrice')}
                type="number"
                value={newInvestment.buyPrice}
                onChange={(e) => setNewInvestment({ ...newInvestment, buyPrice: Number(e.target.value) })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddInvestment}>Add</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InvestmentPortfolio;

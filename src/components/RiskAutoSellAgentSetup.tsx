/**
 * Risk & Auto-Sell Agent Setup Component
 * 
 * Allows users to:
 * - Configure their risk profile
 * - Set stop-loss for individual holdings
 * - Manage whitelist/blacklist
 * - View pending sell orders
 * - View audit logs
 * - Start/stop monitoring
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
  Button,
  TextField,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
  Snackbar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Security,
  PlayArrow,
  Stop,
  Settings,
  Notifications,
  History,
  Add,
  Delete,
  Warning,
  CheckCircle,
  Cancel,
  TrendingDown,
  SmartToy,
  Assessment,
  Shield,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import {
  riskAutoSellAgent,
  type UserRiskProfile,
  type PendingSellOrder,
  type AutoSellLog,
  type Holding,
  type StopLossConfig,
} from '../services/riskAutoSellAgent';

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
      id={`agent-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const RiskAutoSellAgentSetup: React.FC = () => {
  const { user } = useAppStore();
  const [tabValue, setTabValue] = useState(0);
  
  // Agent state
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [riskProfile, setRiskProfile] = useState<UserRiskProfile | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingSellOrder[]>([]);
  const [logs, setLogs] = useState<AutoSellLog[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [stopLossDialogOpen, setStopLossDialogOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [stopLossPrice, setStopLossPrice] = useState<number>(0);
  const [stopLossPercent, setStopLossPercent] = useState<number>(5);
  const [usePercent, setUsePercent] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadAgentData();
    }
  }, [user]);

  const loadAgentData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check if agent is already monitoring
      const storedState = localStorage.getItem(`agent_monitoring_${user.id}`);
      if (storedState === 'true') {
        setIsMonitoring(true);
      }

      // Load risk profile
      const profile = await loadRiskProfile();
      setRiskProfile(profile);

      // Load holdings
      await loadHoldings();

      // Load pending orders
      await loadPendingOrders();

      // Load logs
      await loadLogs();

    } catch (error) {
      console.error('Error loading agent data:', error);
      showSnackbar('Failed to load agent data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRiskProfile = async (): Promise<UserRiskProfile> => {
    if (!user) throw new Error('User not found');
    
    const stored = localStorage.getItem(`risk_profile_${user.id}`);
    if (stored) {
      return JSON.parse(stored);
    }

    // Return default profile
    const defaultProfile: UserRiskProfile = {
      userId: user.id,
      riskLevel: 'moderate',
      maxPortfolioLossPercent: 10,
      autoSellEnabled: false, // Disabled by default
      confirmationWindowMinutes: 5,
      sustainedDropMinutes: 2,
      highValueThresholdPercent: 15,
      highValueThresholdAmount: 100000,
      whitelist: [],
      blacklist: [],
    };

    // Save default
    localStorage.setItem(`risk_profile_${user.id}`, JSON.stringify(defaultProfile));
    return defaultProfile;
  };

  const loadHoldings = async () => {
    if (!user) return;
    
    // Get holdings from portfolio
    const portfolio = JSON.parse(localStorage.getItem(`portfolio_${user.id}`) || '[]');
    const holdingsData: Holding[] = portfolio.map((inv: any) => ({
      id: inv.id,
      userId: user.id,
      ticker: inv.symbol,
      companyName: inv.name,
      quantity: inv.quantity,
      purchasePrice: inv.purchasePrice,
      currentPrice: inv.currentPrice,
      marketValue: inv.currentValue,
      profitLoss: inv.profitLoss,
      profitLossPercent: inv.profitLossPercent,
      sector: 'Unknown',
      exchange: 'NSE' as const,
      lastUpdated: new Date(),
    }));
    
    setHoldings(holdingsData);
  };

  const loadPendingOrders = async () => {
    if (!user) return;
    
    const orders = await riskAutoSellAgent.getPendingSellOrders(user.id);
    setPendingOrders(orders);
  };

  const loadLogs = async () => {
    if (!user) return;
    
    const logsData = await riskAutoSellAgent.getAutoSellLogs(user.id, 50);
    setLogs(logsData);
  };

  const handleStartMonitoring = async () => {
    if (!user) return;
    
    if (!riskProfile?.autoSellEnabled) {
      showSnackbar('Please enable auto-sell in settings first', 'warning');
      setTabValue(1); // Switch to settings tab
      return;
    }

    setLoading(true);
    try {
      await riskAutoSellAgent.startMonitoring(user.id);
      setIsMonitoring(true);
      localStorage.setItem(`agent_monitoring_${user.id}`, 'true');
      showSnackbar('✅ Risk monitoring started! Agent will check every 60 seconds.', 'success');
    } catch (error) {
      console.error('Error starting monitoring:', error);
      showSnackbar('Failed to start monitoring', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStopMonitoring = () => {
    if (!user) return;
    
    riskAutoSellAgent.stopMonitoring();
    setIsMonitoring(false);
    localStorage.setItem(`agent_monitoring_${user.id}`, 'false');
    showSnackbar('⏹️ Risk monitoring stopped', 'info');
  };

  const handleUpdateRiskProfile = async (updates: Partial<UserRiskProfile>) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await riskAutoSellAgent.updateRiskProfile(user.id, updates);
      if (result.success) {
        const updatedProfile = await loadRiskProfile();
        setRiskProfile(updatedProfile);
        showSnackbar('Risk profile updated successfully', 'success');
      } else {
        showSnackbar(result.message, 'error');
      }
    } catch (error) {
      console.error('Error updating risk profile:', error);
      showSnackbar('Failed to update risk profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStopLossDialog = (holding: Holding) => {
    setSelectedHolding(holding);
    
    // Check if stop-loss already exists
    const configs = JSON.parse(localStorage.getItem(`stop_loss_configs_${user?.id}`) || '[]');
    const existingConfig = configs.find((c: StopLossConfig) => c.ticker === holding.ticker);
    
    if (existingConfig) {
      if (existingConfig.stopLossPrice) {
        setUsePercent(false);
        setStopLossPrice(existingConfig.stopLossPrice);
      } else if (existingConfig.stopLossPercent) {
        setUsePercent(true);
        setStopLossPercent(existingConfig.stopLossPercent);
      }
    } else {
      // Calculate default 5% below purchase price
      setStopLossPrice(holding.purchasePrice * 0.95);
      setStopLossPercent(5);
    }
    
    setStopLossDialogOpen(true);
  };

  const handleSetStopLoss = async () => {
    if (!user || !selectedHolding) return;
    
    setLoading(true);
    try {
      const result = await riskAutoSellAgent.setStopLoss(
        user.id,
        selectedHolding.ticker,
        usePercent ? undefined : stopLossPrice,
        usePercent ? stopLossPercent : undefined
      );

      if (result.success) {
        showSnackbar(result.message, 'success');
        setStopLossDialogOpen(false);
        await loadAgentData();
      } else {
        showSnackbar(result.message, 'error');
      }
    } catch (error) {
      console.error('Error setting stop-loss:', error);
      showSnackbar('Failed to set stop-loss', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStopLoss = async (ticker: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await riskAutoSellAgent.removeStopLoss(user.id, ticker);
      if (result.success) {
        showSnackbar(result.message, 'success');
        await loadAgentData();
      } else {
        showSnackbar(result.message, 'error');
      }
    } catch (error) {
      console.error('Error removing stop-loss:', error);
      showSnackbar('Failed to remove stop-loss', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await riskAutoSellAgent.confirmSellOrder(orderId, user.id);
      if (result.success) {
        showSnackbar(result.message, 'success');
        await loadAgentData();
      } else {
        showSnackbar(result.message, 'error');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      showSnackbar('Failed to confirm order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await riskAutoSellAgent.cancelSellOrder(orderId, user.id);
      if (result.success) {
        showSnackbar(result.message, 'success');
        await loadAgentData();
      } else {
        showSnackbar(result.message, 'error');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      showSnackbar('Failed to cancel order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStopLossConfig = (ticker: string): StopLossConfig | undefined => {
    if (!user) return undefined;
    const configs = JSON.parse(localStorage.getItem(`stop_loss_configs_${user.id}`) || '[]');
    return configs.find((c: StopLossConfig) => c.ticker === ticker && c.isActive);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Please log in to access the Risk & Auto-Sell Agent</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SmartToy sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Risk & Auto-Sell Agent
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI-powered stop-loss monitoring and automatic sell execution
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {isMonitoring ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={handleStopMonitoring}
                size="large"
              >
                Stop Monitoring
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrow />}
                onClick={handleStartMonitoring}
                size="large"
                disabled={!riskProfile?.autoSellEnabled}
              >
                Start Monitoring
              </Button>
            )}
          </Box>
        </Box>

        {/* Status Banner */}
        <Alert 
          severity={isMonitoring ? 'success' : 'info'}
          icon={isMonitoring ? <CheckCircle /> : <Warning />}
        >
          <strong>Agent Status:</strong> {isMonitoring ? '🟢 Active - Monitoring every 60 seconds' : '🔴 Inactive - Click "Start Monitoring" to activate'}
          {!riskProfile?.autoSellEnabled && ' (Auto-sell is disabled in settings)'}
        </Alert>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs */}
      <Paper elevation={3}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Assessment />} label="Holdings & Stop-Loss" />
          <Tab icon={<Settings />} label="Risk Settings" />
          <Tab icon={<Notifications />} label={`Pending Orders (${pendingOrders.length})`} />
          <Tab icon={<History />} label="Audit Logs" />
        </Tabs>

        {/* Tab 1: Holdings & Stop-Loss */}
        <TabPanel value={tabValue} index={0}>
          {holdings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Shield sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Holdings Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add investments to your portfolio to set up stop-loss protection
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {holdings.map((holding) => {
                const stopLossConfig = getStopLossConfig(holding.ticker);
                const hasStopLoss = !!stopLossConfig;

                return (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={holding.id}>
                    <Card elevation={2}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {holding.ticker}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {holding.companyName}
                            </Typography>
                          </Box>
                          {hasStopLoss ? (
                            <Chip 
                              label="Protected" 
                              color="success" 
                              size="small"
                              icon={<Shield />}
                            />
                          ) : (
                            <Chip 
                              label="No Stop-Loss" 
                              color="default" 
                              size="small"
                              icon={<Warning />}
                            />
                          )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={1}>
                          <Grid size={6}>
                            <Typography variant="body2" color="text.secondary">Quantity</Typography>
                            <Typography variant="body1" fontWeight="bold">{holding.quantity}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="body2" color="text.secondary">Purchase Price</Typography>
                            <Typography variant="body1">{formatCurrency(holding.purchasePrice)}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="body2" color="text.secondary">Current Price</Typography>
                            <Typography variant="body1">{formatCurrency(holding.currentPrice)}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="body2" color="text.secondary">Market Value</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {formatCurrency(holding.marketValue)}
                            </Typography>
                          </Grid>
                        </Grid>

                        {hasStopLoss && stopLossConfig && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Alert severity="info" sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                <strong>Stop-Loss:</strong>{' '}
                                {stopLossConfig.stopLossPrice 
                                  ? formatCurrency(stopLossConfig.stopLossPrice)
                                  : `${stopLossConfig.stopLossPercent}% below purchase`}
                              </Typography>
                              {stopLossConfig.stopLossPercent && (
                                <Typography variant="caption" color="text.secondary">
                                  = {formatCurrency(holding.purchasePrice * (1 - stopLossConfig.stopLossPercent / 100))}
                                </Typography>
                              )}
                            </Alert>
                          </>
                        )}
                      </CardContent>

                      <CardActions>
                        {hasStopLoss ? (
                          <>
                            <Button
                              size="small"
                              startIcon={<Settings />}
                              onClick={() => handleOpenStopLossDialog(holding)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => handleRemoveStopLoss(holding.ticker)}
                            >
                              Remove
                            </Button>
                          </>
                        ) : (
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => handleOpenStopLossDialog(holding)}
                          >
                            Set Stop-Loss
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        {/* Tab 2: Risk Settings */}
        <TabPanel value={tabValue} index={1}>
          {riskProfile && (
            <Grid container spacing={3}>
              {/* Global Settings */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Settings sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Global Settings
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={riskProfile.autoSellEnabled}
                          onChange={(e) => handleUpdateRiskProfile({ autoSellEnabled: e.target.checked })}
                        />
                      }
                      label="Enable Auto-Sell"
                    />

                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Risk Level</InputLabel>
                      <Select
                        value={riskProfile.riskLevel}
                        label="Risk Level"
                        onChange={(e) => handleUpdateRiskProfile({ riskLevel: e.target.value as any })}
                      >
                        <MenuItem value="conservative">Conservative</MenuItem>
                        <MenuItem value="moderate">Moderate</MenuItem>
                        <MenuItem value="aggressive">Aggressive</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Max Portfolio Loss %"
                      type="number"
                      value={riskProfile.maxPortfolioLossPercent}
                      onChange={(e) => handleUpdateRiskProfile({ maxPortfolioLossPercent: Number(e.target.value) })}
                      sx={{ mt: 2 }}
                      helperText="Maximum acceptable portfolio loss percentage"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Confirmation Settings */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Security sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Confirmation Settings
                    </Typography>

                    <TextField
                      fullWidth
                      label="Confirmation Window (minutes)"
                      type="number"
                      value={riskProfile.confirmationWindowMinutes}
                      onChange={(e) => handleUpdateRiskProfile({ confirmationWindowMinutes: Number(e.target.value) })}
                      helperText="0 = immediate execution (whitelisted only)"
                    />

                    <TextField
                      fullWidth
                      label="Sustained Drop Detection (minutes)"
                      type="number"
                      value={riskProfile.sustainedDropMinutes}
                      onChange={(e) => handleUpdateRiskProfile({ sustainedDropMinutes: Number(e.target.value) })}
                      sx={{ mt: 2 }}
                      helperText="Wait for sustained drop to avoid flash crashes"
                    />

                    <TextField
                      fullWidth
                      label="High-Value Threshold %"
                      type="number"
                      value={riskProfile.highValueThresholdPercent}
                      onChange={(e) => handleUpdateRiskProfile({ highValueThresholdPercent: Number(e.target.value) })}
                      sx={{ mt: 2 }}
                      helperText="% of portfolio requiring two-step confirmation"
                    />

                    <TextField
                      fullWidth
                      label="High-Value Threshold Amount"
                      type="number"
                      value={riskProfile.highValueThresholdAmount}
                      onChange={(e) => handleUpdateRiskProfile({ highValueThresholdAmount: Number(e.target.value) })}
                      sx={{ mt: 2 }}
                      helperText="Absolute amount requiring two-step (₹)"
                      InputProps={{
                        startAdornment: '₹',
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Whitelist/Blacklist */}
              <Grid size={12}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Assessment sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Whitelist / Blacklist
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Whitelist (Always Auto-Sell)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          {riskProfile.whitelist.map((ticker) => (
                            <Chip
                              key={ticker}
                              label={ticker}
                              onDelete={() => {
                                const updatedWhitelist = riskProfile.whitelist.filter(t => t !== ticker);
                                handleUpdateRiskProfile({ whitelist: updatedWhitelist });
                              }}
                              color="success"
                            />
                          ))}
                          {riskProfile.whitelist.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              No whitelisted tickers
                            </Typography>
                          )}
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Blacklist (Never Auto-Sell)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          {riskProfile.blacklist.map((ticker) => (
                            <Chip
                              key={ticker}
                              label={ticker}
                              onDelete={() => {
                                const updatedBlacklist = riskProfile.blacklist.filter(t => t !== ticker);
                                handleUpdateRiskProfile({ blacklist: updatedBlacklist });
                              }}
                              color="error"
                            />
                          ))}
                          {riskProfile.blacklist.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              No blacklisted tickers
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>Tip:</strong> Add tickers from your holdings to whitelist for immediate auto-sell or blacklist to prevent auto-sell.
                      </Typography>
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 3: Pending Orders */}
        <TabPanel value={tabValue} index={2}>
          {pendingOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Pending Orders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All your holdings are within safe limits
              </Typography>
            </Box>
          ) : (
            <List>
              {pendingOrders.map((order, index) => (
                <ListItem
                  key={order.id}
                  divider={index < pendingOrders.length - 1}
                  sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {order.ticker} - {order.companyName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Order ID: {order.id}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.requiresTwoStepConfirmation ? '2-Step Required' : 'Auto-Execute'}
                      color={order.requiresTwoStepConfirmation ? 'warning' : 'info'}
                      size="small"
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={3}>
                      <Typography variant="body2" color="text.secondary">Quantity</Typography>
                      <Typography variant="body1" fontWeight="bold">{order.quantity} shares</Typography>
                    </Grid>
                    <Grid size={3}>
                      <Typography variant="body2" color="text.secondary">Current Price</Typography>
                      <Typography variant="body1">{formatCurrency(order.currentPrice)}</Typography>
                    </Grid>
                    <Grid size={3}>
                      <Typography variant="body2" color="text.secondary">Stop-Loss</Typography>
                      <Typography variant="body1">{formatCurrency(order.stopLossPrice)}</Typography>
                    </Grid>
                    <Grid size={3}>
                      <Typography variant="body2" color="text.secondary">Change</Typography>
                      <Typography variant="body1" color="error.main" fontWeight="bold">
                        {order.percentChange.toFixed(2)}%
                      </Typography>
                    </Grid>
                  </Grid>

                  <Alert severity={order.requiresTwoStepConfirmation ? 'warning' : 'info'} sx={{ mb: 2 }}>
                    {order.requiresTwoStepConfirmation ? (
                      <>
                        <strong>⚠️ High-Value Security</strong><br />
                        This represents {order.portfolioValuePercent.toFixed(2)}% of your portfolio. Manual confirmation required.
                      </>
                    ) : (
                      <>
                        <strong>⏰ Auto-Execute Pending</strong><br />
                        Will execute automatically at {order.expiresAt.toLocaleString()} unless cancelled.
                      </>
                    )}
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => handleConfirmOrder(order.id)}
                    >
                      Confirm Sell
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Cancel Order
                    </Button>
                    <Chip
                      label={`Expires: ${order.expiresAt.toLocaleTimeString()}`}
                      variant="outlined"
                      size="small"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Tab 4: Audit Logs */}
        <TabPanel value={tabValue} index={3}>
          {logs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <History sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Activity Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start monitoring to see agent activity logs
              </Typography>
            </Box>
          ) : (
            <List>
              {logs.map((log, index) => (
                <ListItem key={log.id} divider={index < logs.length - 1}>
                  <ListItemIcon>
                    {log.action === 'triggered' && <TrendingDown color="warning" />}
                    {log.action === 'confirmed' && <CheckCircle color="info" />}
                    {log.action === 'cancelled' && <Cancel color="error" />}
                    {log.action === 'executed' && <CheckCircle color="success" />}
                    {log.action === 'failed' && <Warning color="error" />}
                    {log.action === 'expired' && <Warning color="warning" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${log.action.toUpperCase()}: ${log.ticker}`}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {log.details.userAction && `Action: ${log.details.userAction} | `}
                          {log.details.triggerPrice && `Trigger: ${formatCurrency(log.details.triggerPrice)} | `}
                          {log.details.executionPrice && `Executed: ${formatCurrency(log.details.executionPrice)} | `}
                          {log.details.tradeId && `Trade: ${log.details.tradeId}`}
                          {log.details.reason && `Reason: ${log.details.reason}`}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </Paper>

      {/* Stop-Loss Dialog */}
      <Dialog 
        open={stopLossDialogOpen} 
        onClose={() => setStopLossDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Set Stop-Loss for {selectedHolding?.ticker}
        </DialogTitle>
        <DialogContent>
          {selectedHolding && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Current Price:</strong> {formatCurrency(selectedHolding.currentPrice)}<br />
                  <strong>Purchase Price:</strong> {formatCurrency(selectedHolding.purchasePrice)}
                </Typography>
              </Alert>

              <FormControlLabel
                control={
                  <Switch
                    checked={usePercent}
                    onChange={(e) => setUsePercent(e.target.checked)}
                  />
                }
                label="Use Percentage-Based Stop-Loss"
              />

              {usePercent ? (
                <TextField
                  fullWidth
                  label="Stop-Loss Percentage"
                  type="number"
                  value={stopLossPercent}
                  onChange={(e) => setStopLossPercent(Number(e.target.value))}
                  sx={{ mt: 2 }}
                  helperText={`Will trigger at ${formatCurrency(selectedHolding.purchasePrice * (1 - stopLossPercent / 100))}`}
                  InputProps={{
                    endAdornment: '%',
                  }}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Stop-Loss Price"
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(Number(e.target.value))}
                  sx={{ mt: 2 }}
                  helperText={`${((stopLossPrice / selectedHolding.purchasePrice - 1) * 100).toFixed(2)}% ${stopLossPrice < selectedHolding.purchasePrice ? 'below' : 'above'} purchase price`}
                  InputProps={{
                    startAdornment: '₹',
                  }}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopLossDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSetStopLoss} disabled={loading}>
            Set Stop-Loss
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default RiskAutoSellAgentSetup;


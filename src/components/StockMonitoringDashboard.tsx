/**
 * Real-Time Stock Monitoring Component
 * 
 * Features:
 * - Add stocks to watchlist with threshold
 * - View active watchlist
 * - Receive real-time price alerts
 * - Toast notifications for price changes
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  CircularProgress,
  Snackbar,
  InputAdornment,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  CurrencyBitcoin as CryptoIcon,
  ShowChart as StockIcon,
} from '@mui/icons-material';
import { stockMonitoringAgent } from '../services/stockMonitoringAgent';
import type { WatchlistItem, PriceAlert, AssetType, RiskAlert, PortfolioPosition } from '../services/stockMonitoringAgent';
import { getCurrentUser } from '../services/authService';

export const StockMonitoringDashboard: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([]);
  const [symbol, setSymbol] = useState('');
  const [threshold, setThreshold] = useState<number>(5);
  const [assetType, setAssetType] = useState<AssetType>('stock');
  
  // Portfolio tracking fields
  const [trackPortfolio, setTrackPortfolio] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [boughtPrice, setBoughtPrice] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<PriceAlert | null>(null);
  const [riskSnackbarOpen, setRiskSnackbarOpen] = useState(false);
  const [currentRiskAlert, setCurrentRiskAlert] = useState<RiskAlert | null>(null);

  // Get authenticated user ID
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid || 'demo-user'; // Fallback to demo-user

  // Load watchlist and portfolio on mount
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Load initial data
        await loadWatchlist();
        await loadPortfolio();
        
        // Register user for monitoring (loads data and starts monitoring)
        await stockMonitoringAgent.registerUserForMonitoring(userId);
      } catch (err) {
        console.error('Error initializing dashboard:', err);
        setError('Failed to initialize monitoring');
      }
    };

    initializeDashboard();
  }, [userId]);

  // Subscribe to price alerts
  useEffect(() => {
    const unsubscribe = stockMonitoringAgent.subscribeToAlerts(userId, (alert) => {
      console.log('🔔 Received alert:', alert);
      
      // Add to alerts list
      setAlerts(prev => [alert, ...prev].slice(0, 10)); // Keep last 10 alerts
      
      // Show snackbar
      setCurrentAlert(alert);
      setSnackbarOpen(true);
      
      // Play notification sound
      playNotificationSound();
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Subscribe to risk alerts
  useEffect(() => {
    const unsubscribe = stockMonitoringAgent.subscribeToRiskAlerts(userId, (alert) => {
      console.log('🚨 Received risk alert:', alert);
      
      // Add to risk alerts list
      setRiskAlerts(prev => [alert, ...prev].slice(0, 10));
      
      // Show risk snackbar
      setCurrentRiskAlert(alert);
      setRiskSnackbarOpen(true);
      
      // Play urgent notification sound
      playUrgentNotificationSound();
      
      // Reload portfolio to show updated values
      loadPortfolio();
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const loadWatchlist = async () => {
    try {
      const items = await stockMonitoringAgent.getWatchlist(userId);
      setWatchlist(items);
    } catch (err) {
      console.error('Error loading watchlist:', err);
    }
  };

  const loadPortfolio = async () => {
    try {
      const items = await stockMonitoringAgent.getPortfolio(userId);
      setPortfolio(items);
    } catch (err) {
      console.error('Error loading portfolio:', err);
    }
  };

  const handleAddStock = async () => {
    if (!symbol.trim()) {
      setError(`Please enter a ${assetType} symbol`);
      return;
    }

    if (threshold <= 0 || threshold > 100) {
      setError('Threshold must be between 0 and 100');
      return;
    }

    if (trackPortfolio) {
      if (quantity <= 0) {
        setError('Quantity must be greater than 0');
        return;
      }
      if (boughtPrice <= 0) {
        setError('Bought price must be greater than 0');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const portfolioData = trackPortfolio 
        ? { quantity, boughtPrice }
        : undefined;

      await stockMonitoringAgent.addToWatchlist(
        userId, 
        symbol.trim(), 
        threshold, 
        assetType,
        portfolioData
      );
      
      const assetLabel = assetType === 'crypto' ? '₿' : '📈';
      let message = `✅ Added ${assetLabel} ${symbol.toUpperCase()} to watchlist`;
      if (trackPortfolio) {
        message += ` with portfolio tracking (${quantity} @ $${boughtPrice})`;
      }
      setSuccessMessage(message);
      
      setSymbol('');
      setThreshold(5);
      setQuantity(1);
      setBoughtPrice(0);
      setTrackPortfolio(false);
      loadWatchlist();
      loadPortfolio();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to add ${assetType}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStock = async (itemId: string) => {
    const success = await stockMonitoringAgent.removeFromWatchlist(userId, itemId);
    
    if (success) {
      setSuccessMessage('Removed from watchlist');
      loadWatchlist();
      loadPortfolio();
    } else {
      setError('Failed to remove stock');
    }
  };

  /**
   * Play notification sound using Web Audio API
   * Creates a simple beep tone for alerts
   */
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  };

  /**
   * Play urgent notification sound for risk alerts
   * Creates a more prominent double-beep pattern
   */
  const playUrgentNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First beep
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      oscillator1.frequency.value = 1000;
      oscillator1.type = 'sine';
      gainNode1.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.2);
      
      // Second beep (slightly delayed and higher pitch)
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 1200;
      oscillator2.type = 'sine';
      gainNode2.gain.setValueAtTime(0.4, audioContext.currentTime + 0.25);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.45);
      oscillator2.start(audioContext.currentTime + 0.25);
      oscillator2.stop(audioContext.currentTime + 0.45);
    } catch (e) {
      console.warn('Could not play urgent notification sound:', e);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (changePercent: number) => {
    const sign = changePercent > 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getAlertColor = (direction: 'up' | 'down') => {
    return direction === 'up' ? 'success' : 'error';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          📊 Real-Time Asset Monitor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Add stocks & crypto to your watchlist and get instant alerts when prices change by your threshold
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Add Stock Form */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add to Watchlist
              </Typography>

              <Box sx={{ mt: 2 }}>
                {/* Asset Type Selector */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    variant={assetType === 'stock' ? 'contained' : 'outlined'}
                    onClick={() => setAssetType('stock')}
                    startIcon={<StockIcon />}
                    fullWidth
                  >
                    Stocks
                  </Button>
                  <Button
                    variant={assetType === 'crypto' ? 'contained' : 'outlined'}
                    onClick={() => setAssetType('crypto')}
                    startIcon={<CryptoIcon />}
                    fullWidth
                  >
                    Crypto
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  label={assetType === 'stock' ? 'Stock Symbol' : 'Crypto Symbol'}
                  placeholder={assetType === 'stock' ? 'e.g., AAPL, MSFT, GOOGL' : 'e.g., BTCUSDT, ETHUSDT, BNBUSDT'}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  disabled={loading}
                  sx={{ mb: 2 }}
                  helperText={assetType === 'crypto' ? 'Enter crypto trading pair (e.g., BTCUSDT for Bitcoin/USDT)' : 'Enter stock ticker symbol'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {assetType === 'crypto' ? <CryptoIcon /> : <TrendingUpIcon />}
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Alert Threshold (%)"
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  disabled={loading}
                  sx={{ mb: 2 }}
                  helperText="Alert me when price changes by this percentage"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">%</InputAdornment>
                    ),
                    inputProps: { min: 0.1, max: 100, step: 0.5 },
                  }}
                />

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {successMessage && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                  onClick={handleAddStock}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add to Watchlist'}
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Monitoring Status */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Monitoring Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Checking prices every 10 seconds
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Watchlist */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Watchlist ({watchlist.length})
              </Typography>

              {watchlist.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                  <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No assets in watchlist yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add your first stock or crypto to start monitoring
                  </Typography>
                </Paper>
              ) : (
                <List>
                  {watchlist.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.assetType === 'crypto' ? <CryptoIcon fontSize="small" color="warning" /> : <StockIcon fontSize="small" color="primary" />}
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {item.symbol}
                            </Typography>
                            <Chip
                              label={`${item.threshold}%`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={item.assetType}
                              size="small"
                              color={item.assetType === 'crypto' ? 'warning' : 'info'}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            {item.currentPrice && (
                              <Typography variant="body2" color="text.secondary">
                                Current: {item.assetType === 'crypto' ? `$${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatPrice(item.currentPrice)}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              Added: {new Date(item.addedAt).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Remove from watchlist">
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveStock(item.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Alerts
              </Typography>

              {alerts.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary">
                    No alerts yet. You'll see price alerts here when thresholds are triggered.
                  </Typography>
                </Paper>
              ) : (
                <List>
                  {alerts.map((alert) => (
                    <ListItem
                      key={alert.id}
                      sx={{
                        border: 1,
                        borderColor: getAlertColor(alert.direction) + '.main',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: getAlertColor(alert.direction) + '.light',
                        opacity: 0.9,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        {alert.direction === 'up' ? (
                          <TrendingUpIcon color="success" />
                        ) : (
                          <TrendingDownIcon color="error" />
                        )}
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {alert.symbol} {alert.direction === 'up' ? '↑' : '↓'} {formatChange(alert.changePercent)}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2">
                            {formatPrice(alert.oldPrice)} → {formatPrice(alert.newPrice)} •{' '}
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Portfolio Summary */}
        {portfolio.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  💼 Portfolio Summary ({portfolio.length} positions)
                </Typography>
                <List>
                  {portfolio.map((position) => {
                    const getRiskColor = (risk: string) => {
                      switch (risk) {
                        case 'critical': return 'error';
                        case 'high': return 'warning';
                        case 'medium': return 'info';
                        default: return 'success';
                      }
                    };

                    const profitLoss = position.profitLoss ?? 0;
                    const profitLossPercent = position.profitLossPercent ?? 0;
                    const isProfit = profitLoss >= 0;
                    const currentPrice = position.currentPrice ?? position.boughtPrice;
                    const currentValue = position.currentValue ?? position.invested;

                    return (
                      <ListItem
                        key={position.symbol}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: 'background.paper',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {position.symbol}
                              </Typography>
                              <Chip
                                label={position.riskLevel.toUpperCase()}
                                size="small"
                                color={getRiskColor(position.riskLevel)}
                                sx={{ fontWeight: 'bold' }}
                              />
                              <Chip
                                label={`${position.quantity} @ $${position.boughtPrice.toFixed(2)}`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Current: ${currentPrice.toFixed(2)} | Value: ${currentValue.toFixed(2)}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: isProfit ? 'success.main' : 'error.main',
                                  fontWeight: 'bold'
                                }}
                              >
                                P&L: {isProfit ? '+' : ''}${profitLoss.toFixed(2)} ({isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Risk Alerts */}
        {riskAlerts.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'error.light', borderColor: 'error.main', border: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'error.dark', fontWeight: 'bold' }}>
                  🚨 Risk Alerts ({riskAlerts.length})
                </Typography>
                <List>
                  {riskAlerts.map((alert, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: 1,
                        borderColor: 'error.dark',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                              {alert.symbol} - {alert.riskLevel.toUpperCase()} RISK
                            </Typography>
                            <Chip
                              label={`${alert.profitLossPercent.toFixed(2)}%`}
                              size="small"
                              color="error"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              💡 {alert.recommendation}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(alert.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Alert Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={currentAlert?.direction === 'up' ? 'success' : 'error'}
          sx={{ width: '100%' }}
          icon={currentAlert?.direction === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {currentAlert?.symbol} Price Alert!
          </Typography>
          <Typography variant="body2">
            Changed {currentAlert && formatChange(currentAlert.changePercent)}
          </Typography>
          <Typography variant="caption">
            {currentAlert && formatPrice(currentAlert.oldPrice)} → {currentAlert && formatPrice(currentAlert.newPrice)}
          </Typography>
        </Alert>
      </Snackbar>

      {/* Risk Alert Snackbar */}
      <Snackbar
        open={riskSnackbarOpen}
        autoHideDuration={10000}
        onClose={() => setRiskSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setRiskSnackbarOpen(false)}
          severity="error"
          sx={{ width: '100%', bgcolor: 'error.dark', color: 'white' }}
          icon={<NotificationsIcon />}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            🚨 {currentRiskAlert?.symbol} - {currentRiskAlert?.riskLevel.toUpperCase()} RISK!
          </Typography>
          <Typography variant="body2">
            P&L: {currentRiskAlert?.profitLossPercent.toFixed(2)}%
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
            💡 {currentRiskAlert?.recommendation}
          </Typography>
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StockMonitoringDashboard;

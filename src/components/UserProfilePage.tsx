/**
 * User Profile Page Component
 * 
 * Complete user dashboard showing:
 * - Personal information
 * - Portfolio summary
 * - Active agents
 * - Activity logs
 * - Security settings
 * - Account preferences
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon,
  SmartToy as AgentIcon,
  TrendingUp as PortfolioIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Verified as VerifiedIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getCurrentUser, getUserProfile, type UserProfile } from '../services/authService';
import { getUserAgents, type Agent } from '../services/agentMarketplace';
import { getPortfolioPositions } from '../services/watchlistService';
import ActivityLogViewer from './ActivityLogViewer';
import type { PortfolioPosition } from '../services/stockMonitoringAgent';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const UserProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentUser = getCurrentUser();
  const userId = currentUser?.uid;

  useEffect(() => {
    if (userId) {
      loadProfileData();
    }
  }, [userId]);

  // Auto-refresh when component becomes visible (user navigates to profile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        handleRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        throw new Error('Not authenticated');
      }

      // Load all profile data in parallel
      const [userProfile, userAgents, userPortfolio] = await Promise.all([
        getUserProfile(userId),
        getUserAgents(userId),
        getPortfolioPositions(userId),
      ]);

      setProfile(userProfile);
      setAgents(userAgents);
      setPortfolio(userPortfolio);
      console.log(`✅ Loaded profile data: ${userAgents.length} agents, ${userPortfolio.length} positions`);
    } catch (err: any) {
      console.error('Error loading profile data:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!userId) return;
    
    try {
      setRefreshing(true);
      console.log('🔄 Refreshing profile data...');
      
      // Reload all data
      const [userAgents, userPortfolio] = await Promise.all([
        getUserAgents(userId),
        getPortfolioPositions(userId),
      ]);

      setAgents(userAgents);
      setPortfolio(userPortfolio);
      console.log(`✅ Refreshed: ${userAgents.length} agents, ${userPortfolio.length} positions`);
    } catch (err: any) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate portfolio summary
  const portfolioSummary = React.useMemo(() => {
    const totalInvested = portfolio.reduce((sum, p) => sum + p.invested, 0);
    const totalCurrentValue = portfolio.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
    const highRiskCount = portfolio.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPercent,
      positions: portfolio.length,
      highRiskCount,
    };
  }, [portfolio]);

  // Calculate agent statistics
  const agentStats = React.useMemo(() => {
    const activeCount = agents.filter(a => a.status === 'active').length;
    const totalExecutions = agents.reduce((sum, a) => sum + a.executionCount, 0);
    const totalSaved = agents.reduce((sum, a) => sum + (a.totalSaved || 0), 0);

    return {
      total: agents.length,
      active: activeCount,
      inactive: agents.length - activeCount,
      totalExecutions,
      totalSaved,
    };
  }, [agents]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading profile...</Typography>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error || 'Failed to load profile'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                src={profile.photoURL || undefined}
                alt={profile.displayName || 'User'}
                sx={{ width: 100, height: 100 }}
              >
                {profile.displayName?.charAt(0) || 'U'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom>
                {profile.displayName || 'User Profile'}
                {profile.emailVerified && (
                  <Chip
                    icon={<VerifiedIcon />}
                    label="Verified"
                    color="primary"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                <EmailIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
                {profile.email}
              </Typography>
              {profile.phoneNumber && (
                <Typography variant="body2" color="text.secondary">
                  <PhoneIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
                  {profile.phoneNumber}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                <CalendarIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 1 }} />
                Member since {profile.createdAt.toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setTabValue(4)}
                >
                  Edit Profile
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" color="primary">
              {portfolioSummary.positions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Portfolio Positions
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography
              variant="h6"
              color={portfolioSummary.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
            >
              {portfolioSummary.totalProfitLoss >= 0 ? '+' : ''}$
              {portfolioSummary.totalProfitLoss.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total P/L ({portfolioSummary.totalProfitLossPercent.toFixed(2)}%)
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" color="primary">
              {agentStats.active} / {agentStats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Agents
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" color="success.main">
              ${agentStats.totalSaved.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Saved by Agents
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
            <Tab icon={<PersonIcon />} label="Overview" />
            <Tab icon={<PortfolioIcon />} label="Portfolio" />
            <Tab icon={<AgentIcon />} label={`Agents (${agents.length})`} />
            <Tab icon={<HistoryIcon />} label="Activity" />
            <Tab icon={<SettingsIcon />} label="Settings" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Full Name"
                    secondary={profile.displayName || 'Not set'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={profile.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Login"
                    secondary={profile.lastLoginAt.toLocaleString()}
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Security & Preferences
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Verification"
                    secondary={profile.emailVerified ? 'Verified' : 'Not verified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary={profile.preferences?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Notifications"
                    secondary={profile.preferences?.notifications ? 'Enabled' : 'Disabled'}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Portfolio Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Portfolio Summary
            </Typography>
            <Button
              variant="text"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Invested
                </Typography>
                <Typography variant="h5">${portfolioSummary.totalInvested.toFixed(2)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Value
                </Typography>
                <Typography variant="h5">${portfolioSummary.totalCurrentValue.toFixed(2)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Profit/Loss
                </Typography>
                <Typography
                  variant="h5"
                  color={portfolioSummary.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                >
                  {portfolioSummary.totalProfitLoss >= 0 ? '+' : ''}$
                  {portfolioSummary.totalProfitLoss.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Positions ({portfolio.length})
          </Typography>
          
          {portfolio.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Your portfolio is empty. Add stocks to monitor by visiting the{' '}
                <strong>📊 Stock Monitor</strong> section.
              </Typography>
            </Alert>
          ) : (
            <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Bought Price</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="right">P/L</TableCell>
                  <TableCell>Risk</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolio.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <strong>{position.symbol}</strong>
                    </TableCell>
                    <TableCell>
                      <Chip label={position.assetType} size="small" />
                    </TableCell>
                    <TableCell align="right">{position.quantity}</TableCell>
                    <TableCell align="right">${position.boughtPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">${position.currentPrice?.toFixed(2) || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography
                        color={(position.profitLoss || 0) >= 0 ? 'success.main' : 'error.main'}
                      >
                        {(position.profitLoss || 0) >= 0 ? '+' : ''}$
                        {position.profitLoss?.toFixed(2) || '0.00'}
                        <br />
                        <Typography variant="caption">
                          ({(position.profitLossPercent || 0).toFixed(2)}%)
                        </Typography>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={position.riskLevel.toUpperCase()}
                        size="small"
                        color={
                          position.riskLevel === 'critical'
                            ? 'error'
                            : position.riskLevel === 'high'
                            ? 'warning'
                            : position.riskLevel === 'medium'
                            ? 'info'
                            : 'success'
                        }
                      />
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={position.riskScore}
                          color={
                            position.riskLevel === 'critical'
                              ? 'error'
                              : position.riskLevel === 'high'
                              ? 'warning'
                              : 'success'
                          }
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          )
        }
        </TabPanel>

        {/* Agents Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Your AI Agents ({agents.length})
            </Typography>
            <Button
              variant="text"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>

          {agents.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                You haven't created any AI agents yet. Visit the{' '}
                <strong>🤖 AI Agents</strong> section to create your first autonomous financial agent.
              </Typography>
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {agents.map((agent) => (
                <Grid item xs={12} md={6} key={agent.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={1}>
                          <AgentIcon color="primary" />
                          <Typography variant="h6">{agent.name}</Typography>
                        </Box>
                        <Chip
                          label={agent.status.toUpperCase()}
                          color={agent.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        {agent.description}
                      </Typography>
                      <Divider />
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Type
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {agent.type.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Executions
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {agent.executionCount}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Success Rate
                          </Typography>
                          <Typography variant="body2" fontWeight="medium" color="success.main">
                            {agent.executionCount > 0
                              ? ((agent.successCount / agent.executionCount) * 100).toFixed(1)
                              : 0}
                            %
                          </Typography>
                        </Grid>
                      </Grid>
                      {agent.totalSaved !== undefined && agent.totalSaved > 0 && (
                        <Box mt={2}>
                          <Typography variant="caption" color="text.secondary">
                            Total Saved
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            ${agent.totalSaved.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      {agent.lastExecutedAt && (
                        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                          Last executed: {new Date(agent.lastExecutedAt).toLocaleString()}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" display="block">
                        Created: {agent.createdAt.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={tabValue} index={3}>
          <ActivityLogViewer />
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Account Settings
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Settings management coming soon. You can update your profile, security preferences, and notification settings here.
          </Alert>
        </TabPanel>
      </Card>
    </Container>
  );
};

/**
 * Risk Monitoring Dashboard
 * 
 * Enables users to activate Risk & Sell Agent and monitor portfolio risks in real-time
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Warning,
  CheckCircle,
  Error,
  Info,
  Email,
  Security,
  TrendingDown,
  Assessment,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import {
  monitorUserPortfolioRisk,
  checkAndExecuteRiskAgent,
  generatePortfolioRiskReport,
  type RiskAssessment,
} from '../services/portfolioRiskMonitor';
import { getUserAgents, activateAgent, deactivateAgent } from '../services/agentMarketplace';

const RiskMonitoringDashboard: React.FC = () => {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [riskAgentActive, setRiskAgentActive] = useState(false);
  const [riskAgentId, setRiskAgentId] = useState<string | null>(null);
  const [riskReport, setRiskReport] = useState<any>(null);
  const [lastMonitorTime, setLastMonitorTime] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadRiskData();
      // Auto-refresh every 5 minutes
      const interval = setInterval(loadRiskData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadRiskData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check if risk agent is active
      const agents = await getUserAgents(user.id);
      const riskAgent = agents.find(a => a.type === 'risk_and_sell');
      
      if (riskAgent) {
        setRiskAgentId(riskAgent.id);
        setRiskAgentActive(riskAgent.status === 'active');
      }

      // Get risk assessments
      const assessments = await monitorUserPortfolioRisk(user.id);
      setRiskAssessments(assessments);

      // Generate risk report
      const report = await generatePortfolioRiskReport(user.id);
      setRiskReport(report);

      setLastMonitorTime(new Date());
    } catch (error) {
      console.error('Error loading risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRiskAgent = async () => {
    if (!user || !riskAgentId) return;

    try {
      if (riskAgentActive) {
        await deactivateAgent(user.id, riskAgentId);
        setRiskAgentActive(false);
      } else {
        await activateAgent(user.id, riskAgentId);
        setRiskAgentActive(true);
        // Immediately run monitoring
        await handleMonitorNow();
      }
    } catch (error) {
      console.error('Error toggling risk agent:', error);
    }
  };

  const handleMonitorNow = async () => {
    if (!user) return;

    try {
      setMonitoring(true);
      await checkAndExecuteRiskAgent(user.id);
      await loadRiskData();
    } catch (error) {
      console.error('Error monitoring portfolio:', error);
    } finally {
      setMonitoring(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return <Error color="error" />;
      case 'high': return <Warning color="warning" />;
      case 'medium': return <Info color="info" />;
      default: return <CheckCircle color="success" />;
    }
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            🛡️ Risk Monitoring Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Automatically monitor your portfolio and receive email alerts for risky investments
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleMonitorNow}
          disabled={monitoring}
          startIcon={monitoring ? <CircularProgress size={20} /> : <Assessment />}
        >
          {monitoring ? 'Monitoring...' : 'Monitor Now'}
        </Button>
      </Box>

      {/* Risk Agent Control */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🤖 Risk & Sell Agent
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Automatically monitors investments and sends email alerts when high-risk positions are detected
            </Typography>
            {lastMonitorTime && (
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1 }}>
                Last monitored: {lastMonitorTime.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={riskAgentActive}
                onChange={handleToggleRiskAgent}
                disabled={!riskAgentId}
                color="default"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#10b981',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#10b981',
                  },
                }}
              />
            }
            label={
              <Typography variant="body1" fontWeight="bold">
                {riskAgentActive ? 'ACTIVE' : 'INACTIVE'}
              </Typography>
            }
            labelPlacement="start"
          />
        </Box>
      </Paper>

      {/* Email Alert Info */}
      {riskAgentActive && (
        <Alert 
          severity="success" 
          icon={<Email />} 
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            📧 Email Alerts Enabled
          </Typography>
          <Typography variant="body2">
            You'll receive instant email notifications at <strong>{user?.email}</strong> whenever a high-risk investment is detected.
            The system monitors your portfolio every 5 minutes and immediately sends alerts for critical risks.
          </Typography>
        </Alert>
      )}

      {/* Risk Summary Cards */}
      {riskReport && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Investments
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {riskReport.totalInvestments}
                    </Typography>
                  </Box>
                  <Security sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average Risk Score
                </Typography>
                <Typography variant="h4" fontWeight="bold" color={riskReport.averageRiskScore > 60 ? 'error.main' : 'success.main'}>
                  {riskReport.averageRiskScore.toFixed(0)}/100
                </Typography>
                <Chip
                  label={riskReport.averageRiskScore > 60 ? 'High Risk' : 'Low Risk'}
                  size="small"
                  color={riskReport.averageRiskScore > 60 ? 'error' : 'success'}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Critical Risks
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {riskReport.riskDistribution.critical}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Immediate attention needed
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Loss
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      ₹{Math.abs(riskReport.totalLoss).toFixed(0)}
                    </Typography>
                  </Box>
                  <TrendingDown sx={{ fontSize: 48, color: 'error.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Risk Distribution */}
      {riskReport && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Risk Distribution
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.entries(riskReport.riskDistribution).map(([level, count]) => (
              <Grid key={level} size={{ xs: 6, md: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight="bold" color={`${getRiskColor(level)}.main`}>
                    {count as number}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                    {level} Risk
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Risk Assessments List */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Investment Risk Analysis
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        {riskAssessments.length === 0 ? (
          <Alert severity="info">
            No investments found. Add investments to your portfolio to start monitoring.
          </Alert>
        ) : (
          <List>
            {riskAssessments.map((risk) => (
              <ListItem
                key={risk.investmentId}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 2,
                  bgcolor: risk.riskLevel === 'critical' ? 'error.50' : 'background.paper',
                }}
              >
                <ListItemIcon>
                  {getRiskIcon(risk.riskLevel)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {risk.investmentName}
                      </Typography>
                      <Chip
                        label={risk.type}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${risk.riskLevel.toUpperCase()}`}
                        size="small"
                        color={getRiskColor(risk.riskLevel)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Risk Score:</strong> {risk.riskScore}/100 | 
                        <strong> Loss:</strong> {risk.lossPercentage.toFixed(2)}% (₹{Math.abs(risk.currentLoss).toFixed(2)})
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Reasons:</strong> {risk.reasons.join(', ')}
                      </Typography>
                      <Alert severity={risk.riskLevel === 'critical' ? 'error' : 'warning'} sx={{ mt: 1 }}>
                        {risk.recommendation}
                      </Alert>
                      {risk.shouldAlert && (
                        <Chip
                          label="📧 Email Alert Sent"
                          size="small"
                          color="info"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Recommendations */}
      {riskReport && riskReport.recommendations.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mt: 3, bgcolor: 'warning.50' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom color="warning.dark">
            ⚠️ Recommended Actions
          </Typography>
          <List>
            {riskReport.recommendations.map((rec: string, index: number) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Warning color="warning" />
                </ListItemIcon>
                <ListItemText primary={rec} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default RiskMonitoringDashboard;

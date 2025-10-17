import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  SmartToy,
  Savings,
  ShowChart,
  PhoneAndroid,
  MonetizationOn,
  PlayArrow,
  Pause,
  CheckCircle,
  Info,
  TrendingUp,
  AutoAwesome,
  Schedule,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import type { FinancialAgent, AgentAction } from '../types';
import { agentService } from '../services/agentService';

const AutonomousAgents: React.FC = () => {
  const { user } = useAppStore();
  const [agents, setAgents] = useState<FinancialAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<FinancialAgent | null>(null);
  const [consentDialog, setConsentDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<AgentAction | null>(null);

  useEffect(() => {
    if (user) {
      loadAgents();
    }
  }, [user]);

  const loadAgents = async () => {
    if (!user) return;
    
    try {
      const fetchedAgents = await agentService.getAllAgents(user.id);
      setAgents(fetchedAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const toggleAgentStatus = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          return {
            ...agent,
            status: agent.status === 'active' ? 'paused' : 'active',
          };
        }
        return agent;
      })
    );
  };

  const handleConsentApproval = () => {
    if (!pendingAction) return;

    // Update action status
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === pendingAction.agentId && agent.lastAction) {
          return {
            ...agent,
            status: 'active',
            lastAction: {
              ...agent.lastAction,
              status: 'completed',
              consentGiven: true,
              result: 'Action approved and executed successfully',
            },
            totalActionsTaken: agent.totalActionsTaken + 1,
            totalSavings: agent.totalSavings + (pendingAction.amount || 0) * 12, // Annual savings
          };
        }
        return agent;
      })
    );

    setConsentDialog(false);
    setPendingAction(null);
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return <Savings />;
      case 'investment':
      case 'rebalancing':
        return <ShowChart />;
      case 'bill_negotiation':
        return <PhoneAndroid />;
      case 'subscription':
        return <MonetizationOn />;
      default:
        return <SmartToy />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'default';
      case 'awaiting_consent':
        return 'warning';
      default:
        return 'info';
    }
  };

  const totalSavings = agents.reduce((sum, agent) => sum + agent.totalSavings, 0);
  const totalActions = agents.reduce((sum, agent) => sum + agent.totalActionsTaken, 0);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <AutoAwesome sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Autonomous Financial Agents
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI agents working 24/7 to optimize your finances
              </Typography>
            </Box>
          </Box>
        </Box>

        <Alert severity="success" icon={<CheckCircle />}>
          <strong>Total Savings Generated:</strong> ₹{totalSavings.toLocaleString('en-IN')} across{' '}
          {totalActions} automated actions
        </Alert>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Active Agents
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {agents.filter((a) => a.status === 'active').length}
                  </Typography>
                </Box>
                <SmartToy color="primary" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Savings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    ₹{(totalSavings / 1000).toFixed(0)}K
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Actions Taken
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {totalActions}
                  </Typography>
                </Box>
                <CheckCircle color="info" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pending Consent
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {agents.filter((a) => a.status === 'awaiting_consent').length}
                  </Typography>
                </Box>
                <Schedule color="warning" sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Agents List */}
      <Grid container spacing={3}>
        {agents.map((agent) => (
          <Grid key={agent.id} size={{ xs: 12, md: 6 }}>
            <Card
              elevation={3}
              sx={{
                border: agent.status === 'awaiting_consent' ? 2 : 0,
                borderColor: 'warning.main',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {agent.status === 'awaiting_consent' && (
                <Chip
                  label="Action Required"
                  color="warning"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 16,
                    fontWeight: 'bold',
                  }}
                />
              )}

              <CardContent>
                <Box display="flex" alignItems="start" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'white',
                        mr: 2,
                      }}
                    >
                      {getAgentIcon(agent.type)}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {agent.name}
                      </Typography>
                      <Chip
                        label={agent.status.replace('_', ' ')}
                        color={getStatusColor(agent.status)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={agent.status === 'active'}
                        onChange={() => toggleAgentStatus(agent.id)}
                        disabled={agent.status === 'awaiting_consent'}
                      />
                    }
                    label=""
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {agent.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Total Savings
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      ₹{agent.totalSavings.toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Actions Taken
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {agent.totalActionsTaken}
                    </Typography>
                  </Grid>
                </Grid>

                {agent.lastAction && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Last Action:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {agent.lastAction.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        {agent.lastAction.timestamp.toLocaleDateString('en-IN')}
                      </Typography>
                    </Box>
                  </>
                )}

                <Box mt={2} display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Info />}
                    onClick={() => setSelectedAgent(agent)}
                    fullWidth
                  >
                    View Details
                  </Button>
                  {agent.status === 'awaiting_consent' && agent.lastAction && (
                    <Button
                      variant="contained"
                      size="small"
                      color="warning"
                      onClick={() => {
                        setPendingAction(agent.lastAction!);
                        setConsentDialog(true);
                      }}
                      fullWidth
                    >
                      Review Action
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Agent Details Dialog */}
      <Dialog
        open={selectedAgent !== null}
        onClose={() => setSelectedAgent(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedAgent && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                {getAgentIcon(selectedAgent.type)}
                <Typography variant="h6" fontWeight="bold" ml={1}>
                  {selectedAgent.name}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedAgent.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box mt={1}>
                    <Chip
                      label={selectedAgent.status.replace('_', ' ')}
                      color={getStatusColor(selectedAgent.status)}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Savings
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    ₹{selectedAgent.totalSavings.toLocaleString('en-IN')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Actions
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedAgent.totalActionsTaken}
                  </Typography>
                </Grid>
              </Grid>

              {selectedAgent.lastAction && (
                <Alert severity="info">
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Last Action Details
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Description:</strong> {selectedAgent.lastAction.description}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Explanation:</strong> {selectedAgent.lastAction.explanation}
                  </Typography>
                  {selectedAgent.lastAction.result && (
                    <Typography variant="body2">
                      <strong>Result:</strong> {selectedAgent.lastAction.result}
                    </Typography>
                  )}
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAgent(null)}>Close</Button>
              <Button
                variant="contained"
                startIcon={selectedAgent.status === 'active' ? <Pause /> : <PlayArrow />}
                onClick={() => {
                  toggleAgentStatus(selectedAgent.id);
                  setSelectedAgent(null);
                }}
              >
                {selectedAgent.status === 'active' ? 'Pause Agent' : 'Activate Agent'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Consent Dialog */}
      <Dialog open={consentDialog} onClose={() => setConsentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Info color="warning" sx={{ mr: 1 }} />
            Action Requires Your Consent
          </Box>
        </DialogTitle>
        <DialogContent>
          {pendingAction && (
            <>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Review this proposed action carefully before approving
              </Alert>

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Proposed Action:
              </Typography>
              <Typography variant="body1" paragraph>
                {pendingAction.description}
              </Typography>

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Explanation:
              </Typography>
              <Typography variant="body2" paragraph>
                {pendingAction.explanation}
              </Typography>

              {pendingAction.amount && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'success.light',
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" color="success.dark">
                    Estimated Monthly Savings
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.dark">
                    ₹{pendingAction.amount.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" color="success.dark">
                    Annual: ₹{(pendingAction.amount * 12).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConsentDialog(false)}>Deny</Button>
          <Button variant="contained" color="success" onClick={handleConsentApproval}>
            Approve & Execute
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AutonomousAgents;

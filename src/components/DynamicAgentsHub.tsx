/**
 * Dynamic Agents Hub
 * 
 * Central hub for creating, managing, and monitoring all dynamic AI agents
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  IconButton,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Divider,
  Paper,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Savings as SavingsIcon,
  Label as LabelIcon,
  Lightbulb as LightbulbIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import { dynamicAgentFactory, DYNAMIC_AGENT_TEMPLATES } from '../services/dynamicAgents';
import type { AgentTemplate, CustomAgent } from '../services/customAgentBuilder';
import { getUserAgents, activateAgent, deactivateAgent, deleteAgent, type Agent } from '../services/agentMarketplace';
import { useAppStore } from '../store/useAppStore';

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
      aria-labelledby={`agent-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const DynamicAgentsHub: React.FC = () => {
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [myAgents, setMyAgents] = useState<Agent[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load user's agents
  useEffect(() => {
    if (user) {
      loadMyAgents();
    }
  }, [user]);

  const loadMyAgents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const agents = await getUserAgents(user.id);
      setMyAgents(agents);
      console.log('✅ Loaded agents:', agents);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAgent = async (agentId: string, enabled: boolean) => {
    if (!user) return;
    
    try {
      console.log(`🔄 Toggling agent ${agentId} to ${enabled ? 'active' : 'inactive'}`);
      
      if (enabled) {
        await activateAgent(user.id, agentId);
        console.log('✅ Agent activated');
      } else {
        await deactivateAgent(user.id, agentId);
        console.log('✅ Agent deactivated');
      }
      
      // Reload agents to get updated status
      await loadMyAgents();
    } catch (error) {
      console.error('Error toggling agent:', error);
      alert('Failed to toggle agent. Please try again.');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this agent? This cannot be undone.')) {
      try {
        await deleteAgent(user.id, agentId);
        await loadMyAgents();
        console.log('✅ Agent deleted');
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert('Failed to delete agent. Please try again.');
      }
    }
  };

  const filteredTemplates = DYNAMIC_AGENT_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'risk_and_sell':
        return <TrendingUpIcon />;
      case 'rebalancing':
        return <SavingsIcon />;
      case 'tax_loss_harvesting':
        return <LabelIcon />;
      default:
        return <BotIcon />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          🤖 AI Agents Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create, manage, and monitor your autonomous financial AI agents
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="My Agents" icon={<BotIcon />} iconPosition="start" />
          <Tab label="Agent Marketplace" icon={<AddIcon />} iconPosition="start" />
          <Tab label="Create Custom" icon={<LightbulbIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab 1: My Agents */}
      <TabPanel value={activeTab} index={0}>
        {loading ? (
          <LinearProgress />
        ) : myAgents.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <BotIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No agents yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Get started by creating your first AI agent from the marketplace
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setActiveTab(1)}
            >
              Browse Marketplace
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {myAgents.map((agent) => (
              <Grid item xs={12} md={6} lg={4} key={agent.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getAgentIcon(agent.type)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{agent.name}</Typography>
                        <Chip
                          label={agent.status}
                          size="small"
                          color={agent.status === 'active' ? 'success' : 'default'}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={agent.status === 'active'}
                            onChange={(e) => handleToggleAgent(agent.id, e.target.checked)}
                          />
                        }
                        label=""
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {agent.description}
                    </Typography>

                    {/* Agent Stats */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(agent.createdAt).toLocaleDateString()}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Last Run: {agent.lastExecutedAt ? new Date(agent.lastExecutedAt).toLocaleString() : 'Never'}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Execution Mode: {agent.executionMode}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit Agent">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Audit Trail">
                        <IconButton size="small">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Agent">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAgent(agent.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Tab 2: Agent Marketplace */}
      <TabPanel value={activeTab} index={1}>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search agents by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Agent Templates */}
        <Grid container spacing={3}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ mr: 1 }}>
                      {template.template.icon}
                    </Typography>
                    <Typography variant="h6">{template.name}</Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>

                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box>
                      <Rating value={template.rating} precision={0.1} size="small" readOnly />
                      <Typography variant="caption" color="text.secondary">
                        {template.rating}/5
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {template.usageCount} users
                      </Typography>
                    </Box>
                  </Box>

                  <Chip label={template.difficulty} size="small" sx={{ mb: 1 }} />
                  <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 2 }}>
                    {template.estimatedImpact}
                  </Typography>

                  {/* Tags */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {template.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>

                  {/* Examples */}
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Examples:
                  </Typography>
                  <List dense>
                    {template.examples.slice(0, 2).map((example, idx) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={example}
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowCreateDialog(true);
                    }}
                  >
                    Create Agent
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tab 3: Create Custom Agent */}
      <TabPanel value={activeTab} index={2}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Coming Soon:</strong> Build custom agents using natural language or code.
            Describe what you want your agent to do, and our AI will generate it!
          </Typography>
        </Alert>

        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LightbulbIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Custom Agent Builder
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            This feature is under development. You'll soon be able to:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <BotIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Describe your agent in natural language" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <BotIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Write custom trigger conditions" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <BotIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Define complex multi-step actions" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <BotIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Share your agents in the marketplace" />
            </ListItem>
          </List>
        </Paper>
      </TabPanel>

      {/* Create Agent Dialog */}
      {selectedTemplate && (
        <CreateAgentDialog
          template={selectedTemplate}
          open={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
            setSelectedTemplate(null);
          }}
          onSuccess={async () => {
            setShowCreateDialog(false);
            setSelectedTemplate(null);
            await loadMyAgents();
            setActiveTab(0); // Switch to My Agents tab
          }}
        />
      )}
    </Container>
  );
};

// ==================== CREATE AGENT DIALOG ====================

interface CreateAgentDialogProps {
  template: AgentTemplate;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAgentDialog: React.FC<CreateAgentDialogProps> = ({
  template,
  open,
  onClose,
  onSuccess,
}) => {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!user) {
    return null; // Don't render if no user
  }
  
  const userId = user.id;

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create agent based on template
      let customAgent: CustomAgent;

      if (template.id === 'template_risk_auto_sell') {
        customAgent = await dynamicAgentFactory.createRiskAutoSellAgent(userId, {
          holdings: [
            {
              symbol: 'INFY',
              quantity: 10,
              purchasePrice: 1500,
              stopLossPercentage: 5,
            },
          ],
          notificationChannels: ['push', 'in_app'],
          requireConfirmation: true,
          confirmationTimeoutMinutes: 30,
        });
      } else if (template.id === 'template_auto_savings') {
        customAgent = await dynamicAgentFactory.createAutoSavingsAgent(userId, {
          fromAccount: 'checking',
          toAccount: 'savings',
          savingsRule: 'percentage',
          percentage: 20,
          schedule: {
            type: 'monthly',
            value: '1',
          },
          minBalance: 5000,
          notificationChannels: ['push', 'in_app'],
        });
      } else if (template.id === 'template_expense_classification') {
        customAgent = await dynamicAgentFactory.createExpenseClassificationAgent(userId, {
          categories: ['personal', 'family', 'rent', 'utilities', 'entertainment', 'groceries', 'other'],
          autoApply: true,
          confidenceThreshold: 0.8,
          notificationChannels: ['in_app'],
        });
      } else if (template.id === 'template_opportunity_recommendation') {
        customAgent = await dynamicAgentFactory.createOpportunityRecommendationAgent(userId, {
          riskProfile: 'moderate',
          investmentHorizon: 'medium',
          monthlyInvestmentBudget: 10000,
          preferences: {
            equity: true,
            debt: true,
            mutualFunds: true,
            gold: false,
            realEstate: false,
            crypto: false,
          },
          notificationChannels: ['push', 'in_app'],
          recommendationFrequency: 'weekly',
        });
      } else {
        throw new Error('Unknown template');
      }

      console.log('✅ Agent created successfully:', customAgent.id);
      onSuccess();
    } catch (err) {
      console.error('Error creating agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {template.template.icon} Create {template.name}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {template.description}
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          This will create a demo agent with default settings. You can customize it later.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          What this agent will do:
        </Typography>
        <List dense>
          {template.examples.map((example, idx) => (
            <ListItem key={idx}>
              <ListItemIcon>
                <BotIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary={example} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <LinearProgress /> : <AddIcon />}
        >
          {loading ? 'Creating...' : 'Create Agent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DynamicAgentsHub;

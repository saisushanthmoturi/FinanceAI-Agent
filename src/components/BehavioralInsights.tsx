import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Psychology,
  Warning,
  TrendingUp,
  Lightbulb,
  EmojiEmotions,
  ShoppingCart,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/gemini';
import type { BehaviorPattern, Nudge, Transaction } from '../types';

const BehavioralInsights: React.FC = () => {
  const { dashboardData } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<BehaviorPattern | null>(null);

  useEffect(() => {
    loadBehavioralData();
  }, []);

  const loadBehavioralData = async () => {
    setLoading(true);
    try {
      // Generate mock transactions for demo
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          accountId: 'acc1',
          date: new Date('2025-10-15'),
          amount: 5000,
          type: 'debit',
          category: 'Shopping',
          description: 'Online shopping - Late night',
          emotionTag: 'impulse',
        },
        {
          id: '2',
          accountId: 'acc1',
          date: new Date('2025-10-14'),
          amount: 15000,
          type: 'debit',
          category: 'Stocks',
          description: 'Stock purchase during market dip',
          emotionTag: 'panic',
        },
        {
          id: '3',
          accountId: 'acc1',
          date: new Date('2025-10-13'),
          amount: 8000,
          type: 'debit',
          category: 'Electronics',
          description: 'Gadget purchase - New model launch',
          emotionTag: 'fomo',
        },
        {
          id: '4',
          accountId: 'acc1',
          date: new Date('2025-10-12'),
          amount: 3000,
          type: 'debit',
          category: 'Food',
          description: 'Restaurant - Weekend',
          emotionTag: 'planned',
        },
        {
          id: '5',
          accountId: 'acc1',
          date: new Date('2025-10-11'),
          amount: 12000,
          type: 'debit',
          category: 'Shopping',
          description: 'Flash sale purchase',
          emotionTag: 'impulse',
        },
      ];

      const transactions = dashboardData?.recentTransactions || mockTransactions;
      const analysis = await geminiService.detectBehavioralPatterns(transactions);

      // Set patterns or use fallback
      const detectedPatterns: BehaviorPattern[] = analysis.patterns?.length
        ? analysis.patterns.map((p: any) => ({
            userId: 'user1',
            type: p.type,
            frequency: p.frequency,
            averageAmount: p.averageAmount,
            triggers: p.triggers,
            detectedAt: new Date(),
            severity: p.severity,
          }))
        : [
            {
              userId: 'user1',
              type: 'impulse',
              frequency: 8,
              averageAmount: 6500,
              triggers: ['Late night browsing', 'Flash sales', 'Social media ads'],
              detectedAt: new Date(),
              severity: 'high',
            },
            {
              userId: 'user1',
              type: 'fomo',
              frequency: 5,
              averageAmount: 12000,
              triggers: ['Limited time offers', 'New product launches', 'Peer purchases'],
              detectedAt: new Date(),
              severity: 'medium',
            },
            {
              userId: 'user1',
              type: 'panic',
              frequency: 3,
              averageAmount: 25000,
              triggers: ['Market volatility', 'Negative news', 'Portfolio losses'],
              detectedAt: new Date(),
              severity: 'medium',
            },
          ];

      const generatedNudges: Nudge[] = analysis.nudges?.length
        ? analysis.nudges.map((n: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            userId: 'user1',
            type: n.type,
            message: n.message,
            messageHindi: n.messageHindi,
            shown: false,
            dismissed: false,
          }))
        : [
            {
              id: '1',
              userId: 'user1',
              type: 'warning',
              message: 'We noticed you often shop late at night. Consider a 24-hour cooling-off period.',
              messageHindi: 'हमने देखा है कि आप अक्सर रात में खरीदारी करते हैं। 24 घंटे का इंतजार करें।',
              shown: false,
              dismissed: false,
            },
            {
              id: '2',
              userId: 'user1',
              type: 'suggestion',
              message: 'Set a monthly limit for impulse purchases to save an extra ₹20,000/month.',
              messageHindi: 'अनियोजित खरीदारी के लिए मासिक सीमा निर्धारित करें और ₹20,000/माह बचाएं।',
              shown: false,
              dismissed: false,
            },
            {
              id: '3',
              userId: 'user1',
              type: 'encouragement',
              message: 'Great job! Your planned purchases are 60% of total spending.',
              messageHindi: 'बढ़िया! आपकी नियोजित खरीदारी कुल खर्च का 60% है।',
              shown: false,
              dismissed: false,
            },
          ];

      setPatterns(detectedPatterns);
      setNudges(generatedNudges);
      setInsights(
        analysis.insights || [
          'You tend to make impulse purchases during evening hours',
          'FOMO-driven purchases average ₹12,000 per transaction',
          'Panic selling during market dips has cost you potential gains',
          'Weekend spending is 35% higher than weekday spending',
        ]
      );
    } catch (error) {
      console.error('Error loading behavioral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'impulse':
        return <ShoppingCart />;
      case 'fomo':
        return <TrendingUp />;
      case 'panic':
        return <Warning />;
      default:
        return <Psychology />;
    }
  };

  const getNudgeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <Warning />;
      case 'suggestion':
        return <Lightbulb />;
      case 'encouragement':
        return <CheckCircle />;
      default:
        return <Info />;
    }
  };

  const patternData = patterns.map((p) => ({
    name: p.type.toUpperCase(),
    value: p.frequency,
    amount: p.averageAmount,
  }));

  const COLORS = ['#f44336', '#ff9800', '#2196f3', '#4caf50'];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Analyzing your behavioral patterns...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <EmojiEmotions sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Behavioral Insights
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered analysis of your spending patterns and biases
            </Typography>
          </Box>
        </Box>
        <Alert severity="info">
          <strong>Emotion-Aware AI:</strong> We analyze your transactions to detect behavioral
          patterns like impulse buying, FOMO, and panic selling to help you make better decisions.
        </Alert>
      </Box>

      <Grid container spacing={3}>
        {/* Patterns Overview */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Detected Patterns
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={patternData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {patternData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Pattern Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Pattern Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={patternData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="value" fill="#8884d8" name="Frequency" />
                <Bar yAxisId="right" dataKey="amount" fill="#82ca9d" name="Avg Amount (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Behavioral Patterns Cards */}
        {patterns.map((pattern, idx) => (
          <Grid key={idx} size={{ xs: 12, md: 4 }}>
            <Card
              elevation={3}
              sx={{
                border: 2,
                borderColor: `${getSeverityColor(pattern.severity)}.main`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
              onClick={() => setSelectedPattern(pattern)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    {getPatternIcon(pattern.type)}
                    <Typography variant="h6" fontWeight="bold" ml={1}>
                      {pattern.type.toUpperCase()}
                    </Typography>
                  </Box>
                  <Chip
                    label={pattern.severity}
                    color={getSeverityColor(pattern.severity)}
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Frequency (this month)
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {pattern.frequency} times
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Amount
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ₹{pattern.averageAmount.toLocaleString('en-IN')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Common Triggers:
                  </Typography>
                  {pattern.triggers.slice(0, 2).map((trigger, i) => (
                    <Chip key={i} label={trigger} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* AI Nudges */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
              Smart Nudges
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              AI-generated suggestions to improve your financial behavior
            </Typography>
            <Grid container spacing={2}>
              {nudges.map((nudge) => (
                <Grid key={nudge.id} size={{ xs: 12, md: 4 }}>
                  <Alert
                    severity={
                      nudge.type === 'warning'
                        ? 'warning'
                        : nudge.type === 'encouragement'
                        ? 'success'
                        : 'info'
                    }
                    icon={getNudgeIcon(nudge.type)}
                    sx={{ height: '100%' }}
                  >
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      {nudge.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {nudge.messageHindi}
                    </Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Key Insights */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
              Key Insights
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {insights.map((insight, idx) => (
                <Grid key={idx} size={{ xs: 12, md: 6 }}>
                  <Box display="flex" alignItems="start">
                    <TrendingUp color="primary" sx={{ mr: 2, mt: 0.5 }} />
                    <Typography variant="body1">{insight}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Pattern Details Dialog */}
      <Dialog
        open={selectedPattern !== null}
        onClose={() => setSelectedPattern(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedPattern && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                {getPatternIcon(selectedPattern.type)}
                <Typography variant="h6" fontWeight="bold" ml={1}>
                  {selectedPattern.type.toUpperCase()} Pattern Analysis
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box mb={3}>
                <Chip
                  label={`${selectedPattern.severity} severity`}
                  color={getSeverityColor(selectedPattern.severity)}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body1" paragraph>
                  This pattern has been detected <strong>{selectedPattern.frequency} times</strong>{' '}
                  this month, with an average transaction amount of{' '}
                  <strong>₹{selectedPattern.averageAmount.toLocaleString('en-IN')}</strong>.
                </Typography>
              </Box>

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Common Triggers:
              </Typography>
              <Box mb={3}>
                {selectedPattern.triggers.map((trigger, i) => (
                  <Chip key={i} label={trigger} sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>

              <Alert severity="info">
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  How to Overcome This:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Set up spending alerts for this category</li>
                  <li>Implement a 24-hour cooling-off period before purchases</li>
                  <li>Track your emotional state when making purchases</li>
                  <li>Create a budget and stick to it</li>
                </ul>
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPattern(null)}>Close</Button>
              <Button variant="contained" onClick={() => setSelectedPattern(null)}>
                Set Up Alert
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default BehavioralInsights;

import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Alert,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
  Warning,
  CreditCard,
  AccountBalance,
  Timer,
  Assessment,
  Lightbulb,
  EmojiEvents,
} from '@mui/icons-material';
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';

const CreditScoreMonitor: React.FC = () => {
  const { language } = useAppStore();
  const [creditScore] = useState(720);

  const content = {
    en: {
      title: 'Credit Score Monitor',
      subtitle: 'AI-powered credit health tracking & improvement',
      score: 'Your Credit Score',
      factors: 'Score Factors',
      history: 'Score History',
      recommendations: 'AI Recommendations',
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
    },
    hi: {
      title: 'क्रेडिट स्कोर मॉनिटर',
      subtitle: 'AI-संचालित क्रेडिट स्वास्थ्य ट्रैकिंग और सुधार',
      score: 'आपका क्रेडिट स्कोर',
      factors: 'स्कोर कारक',
      history: 'स्कोर इतिहास',
      recommendations: 'AI सिफारिशें',
      excellent: 'उत्कृष्ट',
      good: 'अच्छा',
      fair: 'औसत',
      poor: 'खराब',
    },
  };

  const t = content[language as keyof typeof content] || content.en;

  // Credit score classification
  const getScoreCategory = (score: number) => {
    if (score >= 750) return { label: t.excellent, color: '#10b981' };
    if (score >= 700) return { label: t.good, color: '#3b82f6' };
    if (score >= 650) return { label: t.fair, color: '#f59e0b' };
    return { label: t.poor, color: '#ef4444' };
  };

  const category = getScoreCategory(creditScore);

  // Score factors
  const scoreFactors = [
    {
      name: language === 'en' ? 'Payment History' : 'भुगतान इतिहास',
      weight: 35,
      score: 85,
      status: 'good',
      icon: <Timer />,
    },
    {
      name: language === 'en' ? 'Credit Utilization' : 'क्रेडिट उपयोग',
      weight: 30,
      score: 72,
      status: 'fair',
      icon: <CreditCard />,
    },
    {
      name: language === 'en' ? 'Credit History Length' : 'क्रेडिट इतिहास की लंबाई',
      weight: 15,
      score: 90,
      status: 'good',
      icon: <Assessment />,
    },
    {
      name: language === 'en' ? 'Credit Mix' : 'क्रेडिट मिश्रण',
      weight: 10,
      score: 65,
      status: 'fair',
      icon: <AccountBalance />,
    },
    {
      name: language === 'en' ? 'New Credit' : 'नया क्रेडिट',
      weight: 10,
      score: 80,
      status: 'good',
      icon: <TrendingUp />,
    },
  ];

  // Historical data
  const historyData = [
    { month: 'Jan', score: 680 },
    { month: 'Feb', score: 690 },
    { month: 'Mar', score: 695 },
    { month: 'Apr', score: 700 },
    { month: 'May', score: 710 },
    { month: 'Jun', score: 720 },
  ];

  // Radial chart data
  const radialData = [
    {
      name: creditScore.toString(),
      value: creditScore,
      fill: category.color,
    },
  ];

  // AI Recommendations
  const recommendations = [
    {
      priority: 'high',
      title: language === 'en' ? 'Reduce Credit Utilization to < 30%' : 'क्रेडिट उपयोग को < 30% तक कम करें',
      description: language === 'en'
        ? 'Your current utilization is 45%. Pay down ₹25,000 to reach optimal level.'
        : 'आपका वर्तमान उपयोग 45% है। इष्टतम स्तर तक पहुंचने के लिए ₹25,000 का भुगतान करें।',
      impact: '+15 points',
      icon: <CreditCard />,
    },
    {
      priority: 'high',
      title: language === 'en' ? 'Never Miss Payment Deadlines' : 'भुगतान की समय सीमा कभी न चूकें',
      description: language === 'en'
        ? 'Set up auto-pay for minimum dues. Payment history is 35% of your score.'
        : 'न्यूनतम बकाया के लिए ऑटो-पे सेट करें। भुगतान इतिहास आपके स्कोर का 35% है।',
      impact: '+30 points',
      icon: <Timer />,
    },
    {
      priority: 'medium',
      title: language === 'en' ? 'Diversify Credit Mix' : 'क्रेडिट मिश्रण में विविधता लाएं',
      description: language === 'en'
        ? 'Add a personal loan or EMI to your credit profile for better mix.'
        : 'बेहतर मिश्रण के लिए अपनी क्रेडिट प्रोफ़ाइल में व्यक्तिगत ऋण या EMI जोड़ें।',
      impact: '+10 points',
      icon: <AccountBalance />,
    },
    {
      priority: 'low',
      title: language === 'en' ? 'Avoid New Credit Inquiries' : 'नई क्रेडिट पूछताछ से बचें',
      description: language === 'en'
        ? 'Multiple credit applications in short time hurt your score.'
        : 'कम समय में कई क्रेडिट आवेदन आपके स्कोर को नुकसान पहुंचाते हैं।',
      impact: '+5 points',
      icon: <Warning />,
    },
  ];

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    return 'info';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          <EmojiEvents sx={{ fontSize: 48, verticalAlign: 'middle', mr: 2, color: 'primary.main' }} />
          {t.title}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {t.subtitle}
        </Typography>
      </Box>

      {/* Credit Score Display */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t.score}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <ResponsiveContainer width="100%" height={250}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    barSize={20}
                    data={radialData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                    />
                    <Legend
                      iconSize={0}
                      width={120}
                      height={140}
                      layout="vertical"
                      verticalAlign="middle"
                      content={() => (
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h2" fontWeight="bold" color={category.color}>
                            {creditScore}
                          </Typography>
                          <Chip
                            label={category.label}
                            sx={{ bgcolor: category.color, color: 'white', fontWeight: 'bold' }}
                          />
                        </Box>
                      )}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </Box>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ color: 'success.main', fontSize: 32 }} />
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    +40 {language === 'en' ? 'points' : 'अंक'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {language === 'en' ? 'Last 6 months' : 'पिछले 6 महीने'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {t.history}
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={category.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={category.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[600, 800]} />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={category.color}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Score Factors */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          <Assessment sx={{ verticalAlign: 'middle', mr: 1 }} />
          {t.factors}
        </Typography>
        <Grid container spacing={2}>
          {scoreFactors.map((factor, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor:
                          factor.status === 'good'
                            ? 'success.main'
                            : factor.status === 'fair'
                            ? 'warning.main'
                            : 'error.main',
                      }}
                    >
                      {factor.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {factor.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {factor.weight}% {language === 'en' ? 'of score' : 'स्कोर का'}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      {factor.score}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={factor.score}
                    color={
                      factor.status === 'good' ? 'success' : factor.status === 'fair' ? 'warning' : 'error'
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* AI Recommendations */}
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          <Lightbulb sx={{ verticalAlign: 'middle', mr: 1 }} />
          {t.recommendations}
        </Typography>
        <Grid container spacing={3}>
          {recommendations.map((rec, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      {rec.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Chip
                          label={rec.priority.toUpperCase()}
                          color={getPriorityColor(rec.priority) as any}
                          size="small"
                        />
                        <Chip
                          label={rec.impact}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {rec.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {rec.description}
                      </Typography>
                      <Button variant="outlined" size="small">
                        {language === 'en' ? 'Learn More' : 'और जानें'}
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Credit Report Notice */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body1" fontWeight="bold" gutterBottom>
          {language === 'en' ? '📄 Free Credit Report' : '📄 मुफ्त क्रेडिट रिपोर्ट'}
        </Typography>
        <Typography variant="body2">
          {language === 'en'
            ? 'You are entitled to one free credit report per year from CIBIL, Experian, Equifax, and CRIF High Mark.'
            : 'आप CIBIL, Experian, Equifax और CRIF High Mark से प्रति वर्ष एक मुफ्त क्रेडिट रिपोर्ट के हकदार हैं।'}
        </Typography>
      </Alert>

      {/* Score Improvement Timeline */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            {language === 'en' ? '⏱️ Expected Score Improvement Timeline' : '⏱️ अपेक्षित स्कोर सुधार समयरेखा'}
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary={language === 'en' ? '1 Month' : '1 महीना'}
                secondary={language === 'en' ? 'Reduce credit utilization: +10-15 points' : 'क्रेडिट उपयोग कम करें: +10-15 अंक'}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary={language === 'en' ? '3 Months' : '3 महीने'}
                secondary={language === 'en' ? 'Consistent payments: +20-30 points' : 'लगातार भुगतान: +20-30 अंक'}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary={language === 'en' ? '6 Months' : '6 महीने'}
                secondary={language === 'en' ? 'All recommendations: +40-50 points' : 'सभी सिफारिशें: +40-50 अंक'}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreditScoreMonitor;

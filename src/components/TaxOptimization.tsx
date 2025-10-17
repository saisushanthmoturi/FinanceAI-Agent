import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Avatar,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  Fab,
} from '@mui/material';
import {
  ExpandMore,
  AccountBalance,
  School,
  Home,
  HealthAndSafety,
  Calculate,
  CheckCircle,
  Receipt,
  Savings,
  SmartToy,
  Send,
  Mic,
  MicOff,
  Chat as ChatIcon,
  Close,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { agentService, type TaxAgentRecommendation } from '../services/agentService';

const TaxOptimization: React.FC = () => {
  const { language } = useAppStore();
  const [annualIncome, setAnnualIncome] = useState('1200000');
  const [showCalculation, setShowCalculation] = useState(true);
  const [agentRecommendations, setAgentRecommendations] = useState<TaxAgentRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Chat bot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'bot'; message: string }>>([
    {
      role: 'bot',
      message: language === 'en'
        ? 'Hello! I\'m your AI Tax Advisor. Ask me anything about tax optimization, deductions, or investments.'
        : 'नमस्ते! मैं आपका AI कर सलाहकार हूं। कर अनुकूलन, कटौती, या निवेश के बारे में मुझसे कुछ भी पूछें।',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Load AI recommendations on component mount
  useEffect(() => {
    loadAIRecommendations();
  }, [annualIncome]);

  const loadAIRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const income = parseFloat(annualIncome) || 0;
      const currentInvestments = {
        '80C': 150000,
        '80D': 25000,
        '80CCD1B': 50000,
      };
      const recommendations = await agentService.getTaxRecommendations(income, currentInvestments);
      setAgentRecommendations(recommendations);
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Chat bot functions
  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const userMessage = { role: 'user' as const, message: userInput };
    setChatMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateBotResponse(userInput);
      setChatMessages((prev) => [...prev, { role: 'bot', message: botResponse }]);
    }, 1000);

    setUserInput('');
  };

  const generateBotResponse = (input: string): string => {
    const lower = input.toLowerCase();
    
    if (lower.includes('80c') || lower.includes('elss') || lower.includes('ppf')) {
      return language === 'en'
        ? '💰 Section 80C allows deductions up to ₹1.5L. Best options: ELSS (equity exposure + tax benefit), PPF (safe returns), and NPS. I recommend starting with ELSS for long-term wealth creation.'
        : '💰 धारा 80C ₹1.5L तक कटौती की अनुमति देती है। सर्वोत्तम विकल्प: ELSS (इक्विटी एक्सपोजर + कर लाभ), PPF (सुरक्षित रिटर्न), और NPS। मैं दीर्घकालिक धन सृजन के लिए ELSS से शुरू करने की सलाह देता हूं।';
    }
    
    if (lower.includes('nps') || lower.includes('80ccd')) {
      return language === 'en'
        ? '🏦 NPS under Section 80CCD(1B) gives additional ₹50K deduction over 80C. It\'s great for retirement planning. Tax benefit: Up to ₹15,600 saved (31.2% bracket).'
        : '🏦 धारा 80CCD(1B) के तहत NPS 80C से अधिक ₹50K अतिरिक्त कटौती देता है। यह सेवानिवृत्ति योजना के लिए बढ़िया है। कर लाभ: ₹15,600 तक बचत (31.2% ब्रैकेट)।';
    }
    
    if (lower.includes('health') || lower.includes('80d') || lower.includes('insurance')) {
      return language === 'en'
        ? '🏥 Section 80D: Deduct health insurance premiums up to ₹25K (₹50K for senior citizens). Essential for health coverage + tax benefit. Additional ₹25K for parents above 60.'
        : '🏥 धारा 80D: ₹25K तक स्वास्थ्य बीमा प्रीमियम काटें (वरिष्ठ नागरिकों के लिए ₹50K)। स्वास्थ्य कवरेज + कर लाभ के लिए आवश्यक। 60 से ऊपर के माता-पिता के लिए अतिरिक्त ₹25K।';
    }
    
    if (lower.includes('save') || lower.includes('tax') || lower.includes('how')) {
      return language === 'en'
        ? '💡 Best tax-saving strategy: 1) Max out 80C (₹1.5L) with ELSS+PPF, 2) Invest ₹50K in NPS (80CCD1B), 3) Get health insurance (₹25K under 80D), 4) Claim HRA if renting. Total potential savings: ₹78K+ per year!'
        : '💡 सर्वोत्तम कर-बचत रणनीति: 1) ELSS+PPF के साथ 80C (₹1.5L) को अधिकतम करें, 2) NPS (80CCD1B) में ₹50K निवेश करें, 3) स्वास्थ्य बीमा प्राप्त करें (80D के तहत ₹25K), 4) किराये पर रहने पर HRA का दावा करें। कुल संभावित बचत: ₹78K+ प्रति वर्ष!';
    }
    
    return language === 'en'
      ? '🤖 I can help with tax planning, investment recommendations, and deduction strategies. Try asking about "80C deductions", "NPS benefits", or "how to save tax".'
      : '🤖 मैं कर योजना, निवेश सिफारिशों और कटौती रणनीतियों में मदद कर सकता हूं। "80C कटौती", "NPS लाभ", या "कर कैसे बचाएं" के बारे में पूछने का प्रयास करें।';
  };

  const handleVoiceInput = () => {
    if (!isListening) {
      // Start listening
      setIsListening(true);
      
      // Simulated voice recognition
      setTimeout(() => {
        const mockVoiceInput = language === 'en' 
          ? 'How can I save tax using section 80C?' 
          : '80C का उपयोग करके मैं कर कैसे बचा सकता हूं?';
        setUserInput(mockVoiceInput);
        setIsListening(false);
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  const content = {
    en: {
      title: 'AI Tax Optimization Engine',
      subtitle: 'Maximize savings with smart tax planning',
      calculate: 'Recalculate',
      currentTax: 'Current Tax Liability',
      optimizedTax: 'Optimized Tax',
      savings: 'Potential Savings',
      deductions: 'Available Deductions',
      recommendations: 'AI Recommendations',
    },
    hi: {
      title: 'AI कर अनुकूलन इंजन',
      subtitle: 'स्मार्ट कर योजना के साथ बचत अधिकतम करें',
      calculate: 'पुनर्गणना करें',
      currentTax: 'वर्तमान कर देयता',
      optimizedTax: 'अनुकूलित कर',
      savings: 'संभावित बचत',
      deductions: 'उपलब्ध कटौती',
      recommendations: 'AI सिफारिशें',
    },
  };

  const t = content[language as keyof typeof content] || content.en;

  // Tax calculation logic
  const income = parseFloat(annualIncome) || 0;
  const standardDeduction = 50000;
  const section80C = 150000; // EPF, PPF, ELSS, LIC
  const section80D = 25000; // Health insurance
  const homeLoandInterest = 200000; // Section 24(b)
  const npsContribution = 50000; // Section 80CCD(1B)

  const taxableIncome = Math.max(0, income - standardDeduction);
  const optimizedTaxableIncome = Math.max(0, income - standardDeduction - section80C - section80D - homeLoandInterest - npsContribution);

  const calculateTax = (taxableAmount: number) => {
    if (taxableAmount <= 300000) return 0;
    if (taxableAmount <= 600000) return (taxableAmount - 300000) * 0.05;
    if (taxableAmount <= 900000) return 15000 + (taxableAmount - 600000) * 0.10;
    if (taxableAmount <= 1200000) return 45000 + (taxableAmount - 900000) * 0.15;
    if (taxableAmount <= 1500000) return 90000 + (taxableAmount - 1200000) * 0.20;
    return 150000 + (taxableAmount - 1500000) * 0.30;
  };

  const currentTax = calculateTax(taxableIncome);
  const optimizedTax = calculateTax(optimizedTaxableIncome);
  const taxSavings = currentTax - optimizedTax;
  const savingsPercent = currentTax > 0 ? (taxSavings / currentTax) * 100 : 0;

  // Deduction breakdown
  const deductions = [
    {
      section: '80C',
      name: language === 'en' ? 'EPF, PPF, ELSS, Life Insurance' : 'EPF, PPF, ELSS, जीवन बीमा',
      limit: 150000,
      utilized: 150000,
      icon: <Savings />,
    },
    {
      section: '80D',
      name: language === 'en' ? 'Health Insurance Premium' : 'स्वास्थ्य बीमा प्रीमियम',
      limit: 25000,
      utilized: 25000,
      icon: <HealthAndSafety />,
    },
    {
      section: '24(b)',
      name: language === 'en' ? 'Home Loan Interest' : 'होम लोन ब्याज',
      limit: 200000,
      utilized: 200000,
      icon: <Home />,
    },
    {
      section: '80CCD(1B)',
      name: language === 'en' ? 'NPS Contribution' : 'NPS योगदान',
      limit: 50000,
      utilized: 50000,
      icon: <AccountBalance />,
    },
    {
      section: '80E',
      name: language === 'en' ? 'Education Loan Interest' : 'शिक्षा ऋण ब्याज',
      limit: language === 'en' ? 'No Limit' : 'कोई सीमा नहीं',
      utilized: 0,
      icon: <School />,
    },
  ];

  // Tax breakdown data
  const taxBreakdown = [
    { range: '0-3L', rate: 0, color: '#10b981' },
    { range: '3-6L', rate: 5, color: '#3b82f6' },
    { range: '6-9L', rate: 10, color: '#f59e0b' },
    { range: '9-12L', rate: 15, color: '#ef4444' },
    { range: '12-15L', rate: 20, color: '#8b5cf6' },
    { range: '15L+', rate: 30, color: '#6366f1' },
  ];

  // AI Recommendations
  const recommendations = [
    {
      title: language === 'en' ? 'Maximize 80C Deductions' : '80C कटौती अधिकतम करें',
      description: language === 'en'
        ? 'Invest ₹1.5L in ELSS mutual funds for tax savings + wealth creation'
        : 'कर बचत + संपत्ति निर्माण के लिए ELSS म्यूचुअल फंड में ₹1.5L निवेश करें',
      savings: 46800,
      priority: 'high',
    },
    {
      title: language === 'en' ? 'Additional NPS Contribution' : 'अतिरिक्त NPS योगदान',
      description: language === 'en'
        ? 'Extra ₹50k in NPS under 80CCD(1B) for retirement + tax benefits'
        : 'सेवानिवृत्ति + कर लाभ के लिए 80CCD(1B) के तहत NPS में अतिरिक्त ₹50k',
      savings: 15600,
      priority: 'high',
    },
    {
      title: language === 'en' ? 'Health Insurance for Parents' : 'माता-पिता के लिए स्वास्थ्य बीमा',
      description: language === 'en'
        ? 'Additional ₹50k deduction under 80D for parents above 60'
        : '60 से ऊपर के माता-पिता के लिए 80D के तहत अतिरिक्त ₹50k कटौती',
      savings: 15600,
      priority: 'medium',
    },
    {
      title: language === 'en' ? 'HRA Optimization' : 'HRA अनुकूलन',
      description: language === 'en'
        ? 'Claim HRA exemption if paying rent - can save up to ₹50k/year'
        : 'यदि किराया दे रहे हैं तो HRA छूट का दावा करें - प्रति वर्ष ₹50k तक बचा सकते हैं',
      savings: 15600,
      priority: 'medium',
    },
  ];

  // Chart data
  const chartData = [
    { name: language === 'en' ? 'Current Tax' : 'वर्तमान कर', value: currentTax },
    { name: language === 'en' ? 'Optimized Tax' : 'अनुकूलित कर', value: optimizedTax },
    { name: language === 'en' ? 'Savings' : 'बचत', value: taxSavings },
  ];

  const COLORS = ['#ef4444', '#10b981', '#3b82f6'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          <Calculate sx={{ fontSize: 48, verticalAlign: 'middle', mr: 2, color: 'primary.main' }} />
          {t.title}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {t.subtitle}
        </Typography>
      </Box>

      {/* Income Input */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label={language === 'en' ? 'Annual Gross Income (₹)' : 'वार्षिक सकल आय (₹)'}
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                variant="filled"
                sx={{ bgcolor: 'white', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => setShowCalculation(true)}
                sx={{
                  height: '56px',
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                {t.calculate}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tax Savings Summary */}
      {showCalculation && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    {t.currentTax}
                  </Typography>
                  <Typography variant="h4" color="error" fontWeight="bold">
                    ₹{currentTax.toLocaleString('en-IN')}
                  </Typography>
                  <LinearProgress variant="determinate" value={100} color="error" sx={{ height: 8, borderRadius: 4 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    {t.optimizedTax}
                  </Typography>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    ₹{optimizedTax.toLocaleString('en-IN')}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(optimizedTax / currentTax) * 100}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="white">
                    {t.savings}
                  </Typography>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    ₹{taxSavings.toLocaleString('en-IN')}
                  </Typography>
                  <Chip
                    label={`${savingsPercent.toFixed(1)}% ${language === 'en' ? 'saved' : 'बचाया'}`}
                    sx={{ bgcolor: 'white', color: 'success.main', fontWeight: 'bold' }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Visualization */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {language === 'en' ? '📊 Tax Comparison' : '📊 कर तुलना'}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ₹${(entry.value / 1000).toFixed(0)}k`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {language === 'en' ? '📈 Tax Slab Rates' : '📈 कर स्लैब दरें'}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taxBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" fill="#3b82f6" name={language === 'en' ? 'Tax Rate %' : 'कर दर %'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Available Deductions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          <Receipt sx={{ verticalAlign: 'middle', mr: 1 }} />
          {t.deductions}
        </Typography>
        <Grid container spacing={2}>
          {deductions.map((deduction, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      {deduction.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Chip label={deduction.section} size="small" color="primary" />
                        {deduction.utilized > 0 && (
                          <CheckCircle fontSize="small" color="success" />
                        )}
                      </Stack>
                      <Typography variant="body1" fontWeight="bold">
                        {deduction.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {language === 'en' ? 'Limit' : 'सीमा'}: ₹{typeof deduction.limit === 'number' ? deduction.limit.toLocaleString('en-IN') : deduction.limit}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={typeof deduction.limit === 'number' ? (deduction.utilized / deduction.limit) * 100 : 0}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* AI Recommendations */}
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          <SmartToy sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
          {t.recommendations} {language === 'en' ? '(AI-Powered)' : '(AI-संचालित)'}
        </Typography>
        
        {loadingRecommendations ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* AI Agent Recommendations */}
            {agentRecommendations.length > 0 && (
              <Alert severity="info" icon={<SmartToy />} sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  {language === 'en' ? 'Tax Agentic Bot Recommendations' : 'टैक्स एजेंटिक बॉट की सिफारिशें'}
                </Typography>
                <Typography variant="body2">
                  {language === 'en' 
                    ? 'Our AI agent has analyzed your income and current investments to provide personalized recommendations.' 
                    : 'हमारे AI एजेंट ने आपकी आय और वर्तमान निवेश का विश्लेषण करके व्यक्तिगत सिफारिशें प्रदान की हैं।'}
                </Typography>
              </Alert>
            )}
            
            {agentRecommendations.map((rec, index) => (
              <Accordion key={`agent-${index}`}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <SmartToy />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {rec.instrument} ({rec.section})
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip
                          label={`${language === 'en' ? 'Save' : 'बचाएं'} ₹${rec.taxSaved.toLocaleString('en-IN')}`}
                          color="success"
                          size="small"
                        />
                        <Chip
                          label={rec.priority.toUpperCase()}
                          color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'default'}
                          size="small"
                        />
                        {rec.deadline && (
                          <Chip
                            label={`${language === 'en' ? 'Deadline' : 'अंतिम तिथि'}: ${rec.deadline}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Typography variant="body1">{rec.explanation}</Typography>
                    <Alert severity="success">
                      <Typography variant="body2" fontWeight="bold">
                        {language === 'en' ? 'Recommended Investment' : 'अनुशंसित निवेश'}: ₹{rec.amount.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="body2">
                        {language === 'en' ? 'Tax Saved' : 'कर बचत'}: ₹{rec.taxSaved.toLocaleString('en-IN')}
                      </Typography>
                    </Alert>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        alert(
                          language === 'en'
                            ? `Investment action will be executed by the AI agent. Amount: ₹${rec.amount.toLocaleString('en-IN')}`
                            : `AI एजेंट द्वारा निवेश कार्रवाई की जाएगी। राशि: ₹${rec.amount.toLocaleString('en-IN')}`
                        );
                      }}
                    >
                      {language === 'en' ? 'Execute with AI Agent' : 'AI एजेंट के साथ निष्पादित करें'}
                    </Button>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
            
            {/* General Recommendations */}
            <Typography variant="h5" sx={{ mt: 4, mb: 2 }} fontWeight="bold">
              {language === 'en' ? 'Additional Strategies' : 'अतिरिक्त रणनीतियाँ'}
            </Typography>
        </>
        )}
        
        {recommendations.map((rec, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {rec.title}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip
                      label={`${language === 'en' ? 'Save' : 'बचाएं'} ₹${rec.savings.toLocaleString('en-IN')}`}
                      color="success"
                      size="small"
                    />
                    <Chip
                      label={rec.priority.toUpperCase()}
                      color={rec.priority === 'high' ? 'error' : 'warning'}
                      size="small"
                    />
                  </Stack>
                </Box>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                {rec.description}
              </Typography>
              <Button variant="contained" size="small">
                {language === 'en' ? 'Apply This' : 'यह लागू करें'}
              </Button>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Tax Planning Timeline */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body1" fontWeight="bold" gutterBottom>
          {language === 'en' ? '📅 Tax Planning Calendar' : '📅 कर योजना कैलेंडर'}
        </Typography>
        <Typography variant="body2">
          {language === 'en'
            ? '• Jan-Mar: Last chance to invest for current FY • Apr-Jun: File ITR • Jul-Dec: Start planning for next year'
            : '• जन-मार्च: वर्तमान वित्तीय वर्ष के लिए निवेश का अंतिम मौका • अप्रैल-जून: ITR फ़ाइल करें • जुलाई-दिसंबर: अगले वर्ष के लिए योजना शुरू करें'}
        </Typography>
      </Alert>

      {/* Floating Chat Button */}
      {!chatOpen && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}
          onClick={() => setChatOpen(true)}
        >
          <ChatIcon />
        </Fab>
      )}

      {/* Chat Bot Interface */}
      {chatOpen && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 400,
            maxWidth: 'calc(100vw - 48px)',
            height: 500,
            maxHeight: 'calc(100vh - 100px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <SmartToy />
              <Typography variant="h6" fontWeight="bold">
                {language === 'en' ? 'Tax AI Advisor' : 'कर AI सलाहकार'}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setChatOpen(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Chat Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: 'background.default',
            }}
          >
            {chatMessages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '75%',
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2">{msg.message}</Typography>
                </Paper>
              </Box>
            ))}
          </Box>

          {/* Chat Input */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                size="small"
                placeholder={language === 'en' ? 'Ask about tax savings...' : 'कर बचत के बारे में पूछें...'}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        color={isListening ? 'error' : 'primary'}
                        onClick={handleVoiceInput}
                      >
                        {isListening ? <MicOff /> : <Mic />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton color="primary" onClick={handleSendMessage} disabled={!userInput.trim()}>
                <Send />
              </IconButton>
            </Box>
            {isListening && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  {language === 'en' ? '🎤 Listening... Speak now' : '🎤 सुन रहा हूं... अब बोलें'}
                </Typography>
              </Alert>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {language === 'en'
                ? '💡 Try: "80C deductions", "NPS benefits", "tax saving tips"'
                : '💡 प्रयास करें: "80C कटौती", "NPS लाभ", "कर बचत युक्तियाँ"'}
            </Typography>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default TaxOptimization;

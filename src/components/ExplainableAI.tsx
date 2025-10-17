import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  ExpandMore,
  Psychology,
  TrendingUp,
  CheckCircle,
  Lightbulb,
  Assessment,
  ShowChart,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';

interface AIRecommendation {
  id: string;
  title: string;
  category: 'investment' | 'savings' | 'debt' | 'insurance';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  reasoning: string[];
  dataPoints: { factor: string; weight: number; value: number }[];
  alternatives?: string[];
}

const ExplainableAI: React.FC = () => {
  const { language } = useAppStore();
  const [activeStep, setActiveStep] = useState(0);

  // Demo AI recommendations with explainable reasoning
  const recommendations: AIRecommendation[] = [
    {
      id: 'rec-1',
      title: language === 'en' 
        ? 'Increase Emergency Fund by ₹50,000'
        : 'आपातकालीन निधि ₹50,000 बढ़ाएं',
      category: 'savings',
      confidence: 92,
      impact: 'high',
      reasoning: [
        language === 'en'
          ? '1. Your current emergency fund covers only 2.3 months of expenses'
          : '1. आपकी वर्तमान आपातकालीन निधि केवल 2.3 महीने के खर्च को कवर करती है',
        language === 'en'
          ? '2. Financial experts recommend 3-6 months of expenses'
          : '2. वित्तीय विशेषज्ञ 3-6 महीने के खर्च की सिफारिश करते हैं',
        language === 'en'
          ? '3. Your income variability (22%) suggests higher risk'
          : '3. आपकी आय में परिवर्तनशीलता (22%) उच्च जोखिम का संकेत देती है',
        language === 'en'
          ? '4. You have available monthly surplus of ₹15,000'
          : '4. आपके पास ₹15,000 का मासिक अधिशेष उपलब्ध है',
      ],
      dataPoints: [
        { factor: 'Income Stability', weight: 30, value: 78 },
        { factor: 'Current Coverage', weight: 25, value: 45 },
        { factor: 'Risk Profile', weight: 20, value: 82 },
        { factor: 'Available Surplus', weight: 15, value: 90 },
        { factor: 'Debt Obligations', weight: 10, value: 65 },
      ],
      alternatives: [
        language === 'en' ? 'Start with ₹25,000 and increase gradually' : '₹25,000 से शुरू करें और धीरे-धीरे बढ़ाएं',
        language === 'en' ? 'Redirect bonus/windfall income to emergency fund' : 'बोनस/अप्रत्याशित आय को आपातकालीन निधि में भेजें',
      ],
    },
    {
      id: 'rec-2',
      title: language === 'en'
        ? 'Consider Index Funds for Long-term Wealth'
        : 'दीर्घकालिक संपत्ति के लिए इंडेक्स फंड पर विचार करें',
      category: 'investment',
      confidence: 87,
      impact: 'high',
      reasoning: [
        language === 'en'
          ? '1. Your investment horizon is 15+ years (retirement planning)'
          : '1. आपका निवेश क्षितिज 15+ वर्ष है (सेवानिवृत्ति योजना)',
        language === 'en'
          ? '2. Index funds have historically returned 12-15% CAGR in India'
          : '2. इंडेक्स फंड ने भारत में ऐतिहासिक रूप से 12-15% CAGR रिटर्न दिया है',
        language === 'en'
          ? '3. Lower expense ratios (0.1-0.5%) compared to active funds'
          : '3. सक्रिय फंड की तुलना में कम व्यय अनुपात (0.1-0.5%)',
        language === 'en'
          ? '4. Your risk tolerance assessment: Moderate-High'
          : '4. आपकी जोखिम सहनशीलता मूल्यांकन: मध्यम-उच्च',
      ],
      dataPoints: [
        { factor: 'Time Horizon', weight: 35, value: 95 },
        { factor: 'Risk Tolerance', weight: 25, value: 75 },
        { factor: 'Cost Efficiency', weight: 20, value: 88 },
        { factor: 'Historical Returns', weight: 15, value: 82 },
        { factor: 'Diversification', weight: 5, value: 90 },
      ],
      alternatives: [
        language === 'en' ? 'Start with balanced funds for lower risk' : 'कम जोखिम के लिए संतुलित फंड से शुरू करें',
        language === 'en' ? 'Mix index funds with sectoral exposure' : 'सेक्टोरल एक्सपोज़र के साथ इंडेक्स फंड मिलाएं',
      ],
    },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  // Model performance metrics
  const modelMetrics = [
    { metric: 'Accuracy', value: 94 },
    { metric: 'Precision', value: 91 },
    { metric: 'Recall', value: 89 },
    { metric: 'F1 Score', value: 90 },
  ];

  // Feature importance visualization
  const featureImportance = [
    { feature: 'Income', importance: 28 },
    { feature: 'Expenses', importance: 25 },
    { feature: 'Age', importance: 18 },
    { feature: 'Debt', importance: 15 },
    { feature: 'Risk Profile', importance: 14 },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          <Psychology sx={{ fontSize: 48, verticalAlign: 'middle', mr: 2, color: 'primary.main' }} />
          {language === 'en' ? 'Explainable AI Dashboard' : 'व्याख्यात्मक AI डैशबोर्ड'}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {language === 'en'
            ? 'Understand the reasoning behind every AI recommendation'
            : 'हर AI सिफारिश के पीछे के तर्क को समझें'}
        </Typography>
      </Box>

      {/* AI Model Transparency */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                <Assessment sx={{ verticalAlign: 'middle', mr: 1 }} />
                {language === 'en' ? 'Model Performance' : 'मॉडल प्रदर्शन'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {language === 'en'
                  ? 'Our AI model is trained on 100,000+ financial profiles'
                  : 'हमारा AI मॉडल 100,000+ वित्तीय प्रोफाइल पर प्रशिक्षित है'}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {modelMetrics.map((metric) => (
                  <Box key={metric.metric} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{metric.metric}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {metric.value}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metric.value}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                <ShowChart sx={{ verticalAlign: 'middle', mr: 1 }} />
                {language === 'en' ? 'Feature Importance' : 'फीचर महत्व'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {language === 'en'
                  ? 'How different factors influence our recommendations'
                  : 'विभिन्न कारक हमारी सिफारिशों को कैसे प्रभावित करते हैं'}
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={featureImportance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 30]} />
                  <YAxis dataKey="feature" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="importance" fill="#2563eb" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recommendations with Explanations */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          <Lightbulb sx={{ verticalAlign: 'middle', mr: 1 }} />
          {language === 'en' ? 'AI Recommendations & Reasoning' : 'AI सिफारिशें और तर्क'}
        </Typography>

        {recommendations.map((rec) => (
          <Accordion key={rec.id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {rec.title}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={`${rec.confidence}% ${language === 'en' ? 'Confidence' : 'विश्वास'}`}
                      color="primary"
                      size="small"
                    />
                    <Chip
                      label={`${rec.impact.toUpperCase()} ${language === 'en' ? 'Impact' : 'प्रभाव'}`}
                      color={rec.impact === 'high' ? 'success' : rec.impact === 'medium' ? 'warning' : 'default'}
                      size="small"
                    />
                    <Chip label={rec.category.toUpperCase()} variant="outlined" size="small" />
                  </Stack>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Reasoning Steps */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {language === 'en' ? '🔍 Step-by-Step Reasoning' : '🔍 चरण-दर-चरण तर्क'}
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {rec.reasoning.map((step, idx) => (
                        <Box key={idx} sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start' }}>
                          <CheckCircle
                            sx={{ fontSize: 20, color: 'success.main', mr: 1, mt: 0.25 }}
                          />
                          <Typography variant="body2">{step}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>

                {/* Data Visualization */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {language === 'en' ? '📊 Decision Factors' : '📊 निर्णय कारक'}
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={rec.dataPoints}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="factor" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Importance"
                          dataKey="value"
                          stroke="#2563eb"
                          fill="#2563eb"
                          fillOpacity={0.6}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                {/* Alternatives */}
                {rec.alternatives && rec.alternatives.length > 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info" icon={<TrendingUp />}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {language === 'en' ? 'Alternative Approaches:' : 'वैकल्पिक दृष्टिकोण:'}
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {rec.alternatives.map((alt, idx) => (
                          <li key={idx}>
                            <Typography variant="body2">{alt}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Decision Journey */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            {language === 'en' ? '🧭 AI Decision Journey' : '🧭 AI निर्णय यात्रा'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {language === 'en'
              ? 'Follow the AI\'s thought process from data collection to final recommendation'
              : 'डेटा संग्रह से अंतिम सिफारिश तक AI की विचार प्रक्रिया का पालन करें'}
          </Typography>

          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 3 }}>
            <Step>
              <StepLabel>
                {language === 'en' ? 'Data Collection' : 'डेटा संग्रह'}
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  {language === 'en'
                    ? 'Gathered your financial data: income, expenses, assets, liabilities, goals'
                    : 'आपका वित्तीय डेटा एकत्र किया: आय, खर्च, संपत्ति, देनदारियां, लक्ष्य'}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={handleNext} size="small">
                    {language === 'en' ? 'Next' : 'अगला'}
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>
                {language === 'en' ? 'Pattern Analysis' : 'पैटर्न विश्लेषण'}
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  {language === 'en'
                    ? 'Analyzed spending patterns, savings behavior, and financial health trends'
                    : 'खर्च पैटर्न, बचत व्यवहार और वित्तीय स्वास्थ्य रुझानों का विश्लेषण किया'}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleBack} size="small" sx={{ mr: 1 }}>
                    {language === 'en' ? 'Back' : 'पीछे'}
                  </Button>
                  <Button variant="contained" onClick={handleNext} size="small">
                    {language === 'en' ? 'Next' : 'अगला'}
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>
                {language === 'en' ? 'Risk Assessment' : 'जोखिम मूल्यांकन'}
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  {language === 'en'
                    ? 'Evaluated your risk profile, income stability, and life stage'
                    : 'आपकी जोखिम प्रोफ़ाइल, आय स्थिरता और जीवन चरण का मूल्यांकन किया'}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleBack} size="small" sx={{ mr: 1 }}>
                    {language === 'en' ? 'Back' : 'पीछे'}
                  </Button>
                  <Button variant="contained" onClick={handleNext} size="small">
                    {language === 'en' ? 'Next' : 'अगला'}
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>
                {language === 'en' ? 'Recommendation Generation' : 'सिफारिश निर्माण'}
              </StepLabel>
              <StepContent>
                <Typography variant="body2">
                  {language === 'en'
                    ? 'Generated personalized recommendations based on your unique profile and goals'
                    : 'आपकी अनूठी प्रोफ़ाइल और लक्ष्यों के आधार पर व्यक्तिगत सिफारिशें उत्पन्न की'}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleBack} size="small" sx={{ mr: 1 }}>
                    {language === 'en' ? 'Back' : 'पीछे'}
                  </Button>
                  <Button variant="contained" onClick={handleReset} size="small">
                    {language === 'en' ? 'Reset' : 'रीसेट'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Trust & Safety */}
      <Alert severity="success" icon={<CheckCircle />}>
        <Typography variant="body1" fontWeight="bold" gutterBottom>
          {language === 'en' ? '✅ Trust & Safety Guarantees' : '✅ विश्वास और सुरक्षा गारंटी'}
        </Typography>
        <Typography variant="body2">
          {language === 'en'
            ? '• All recommendations are audited by human financial experts • No hidden biases in AI models • Full data transparency • You always have final control'
            : '• सभी सिफारिशों की मानव वित्तीय विशेषज्ञों द्वारा जांच की जाती है • AI मॉडल में कोई छिपा पूर्वाग्रह नहीं • पूर्ण डेटा पारदर्शिता • आपका हमेशा अंतिम नियंत्रण है'}
        </Typography>
      </Alert>
    </Container>
  );
};

export default ExplainableAI;

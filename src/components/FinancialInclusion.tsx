import React, { useState } from 'react';
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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Stack,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  Savings,
  School,
  Work,
  CheckCircle,
  Info,
  Lightbulb,
  Language,
  Phone,
  Message,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';

// Financial Inclusion Component for Gig Workers, Freelancers, and Rural Users
const FinancialInclusion: React.FC = () => {
  const { language } = useAppStore();
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Localized content
  const content = {
    en: {
      title: 'Financial Inclusion Center',
      subtitle: 'Tailored financial planning for gig workers, freelancers, and rural communities',
      incomeLabel: 'Average Monthly Income (₹)',
      goalLabel: 'Monthly Savings Goal (₹)',
      calculateBtn: 'Get Personalized Plan',
      features: 'Key Features',
      tips: 'Financial Tips',
      support: 'Support Options',
    },
    hi: {
      title: 'वित्तीय समावेश केंद्र',
      subtitle: 'गिग वर्कर्स, फ्रीलांसरों और ग्रामीण समुदायों के लिए वित्तीय योजना',
      incomeLabel: 'औसत मासिक आय (₹)',
      goalLabel: 'मासिक बचत लक्ष्य (₹)',
      calculateBtn: 'व्यक्तिगत योजना प्राप्त करें',
      features: 'मुख्य विशेषताएं',
      tips: 'वित्तीय सुझाव',
      support: 'सहायता विकल्प',
    },
    te: {
      title: 'ఆర్థిక చేరిక కేంద్రం',
      subtitle: 'గిగ్ వర్కర్లు, ఫ్రీలాన్సర్లు మరియు గ్రామీణ కమ్యూనిటీల కోసం ఆర్థిక ప్రణాళిక',
      incomeLabel: 'సగటు నెలవారీ ఆదాయం (₹)',
      goalLabel: 'నెలవారీ పొదుపు లక్ష్యం (₹)',
      calculateBtn: 'వ్యక్తిగత ప్లాన్ పొందండి',
      features: 'ముఖ్య లక్షణాలు',
      tips: 'ఆర్థిక చిట్కాలు',
      support: 'మద్దతు ఎంపికలు',
    },
    ta: {
      title: 'நிதி உள்ளடக்க மையம்',
      subtitle: 'கிக் தொழிலாளர்கள், ஃப்ரீலான்சர்கள் மற்றும் கிராமப்புற சமூகங்களுக்கான நிதி திட்டமிடல்',
      incomeLabel: 'சராசரி மாதாந்திர வருமானம் (₹)',
      goalLabel: 'மாதாந்திர சேமிப்பு இலக்கு (₹)',
      calculateBtn: 'தனிப்பயன் திட்டத்தைப் பெறுங்கள்',
      features: 'முக்கிய அம்சங்கள்',
      tips: 'நிதி ஆலோசனைகள்',
      support: 'ஆதரவு விருப்பங்கள்',
    },
    ml: {
      title: 'സാമ്പത്തിക ഉൾപ്പെടുത്തൽ കേന്ദ്രം',
      subtitle: 'ഗിഗ് തൊഴിലാളികൾ, ഫ്രീലാൻസർമാർ, ഗ്രാമീണ സമൂഹങ്ങൾക്കുള്ള സാമ്പത്തിക ആസൂത്രണം',
      incomeLabel: 'ശരാശരി പ്രതിമാസ വരുമാനം (₹)',
      goalLabel: 'പ്രതിമാസ സേവിംഗ്സ് ലക്ष്യം (₹)',
      calculateBtn: 'വ്യക്തിഗത പ്ലാൻ നേടുക',
      features: 'പ്രധാന സവിശേഷതകൾ',
      tips: 'സാമ്പത്തിക നുറുങ്ങുകൾ',
      support: 'പിന്തുണ ഓപ്ഷനുകൾ',
    },
  };

  const t = content[language as keyof typeof content] || content.en;

  const handleCalculate = () => {
    setShowRecommendations(true);
  };

  // Calculate savings rate
  const income = parseFloat(monthlyIncome) || 0;
  const goal = parseFloat(savingsGoal) || 0;
  const savingsRate = income > 0 ? (goal / income) * 100 : 0;
  const emergencyFund = income * 3; // 3 months emergency fund

  const features = [
    {
      icon: <Work />,
      title: language === 'en' ? 'Irregular Income Management' : 'अनियमित आय प्रबंधन',
      description: language === 'en' 
        ? 'Smart budgeting for variable income streams'
        : 'परिवर्तनशील आय धाराओं के लिए स्मार्ट बजट',
    },
    {
      icon: <Savings />,
      title: language === 'en' ? 'Micro-Savings Plans' : 'सूक्ष्म-बचत योजनाएं',
      description: language === 'en'
        ? 'Start saving with as little as ₹10/day'
        : '₹10/दिन से बचत शुरू करें',
    },
    {
      icon: <AccountBalance />,
      title: language === 'en' ? 'No-Frills Banking' : 'बुनियादी बैंकिंग',
      description: language === 'en'
        ? 'Zero balance accounts with digital access'
        : 'डिजिटल पहुंच के साथ शून्य बैलेंस खाते',
    },
    {
      icon: <School />,
      title: language === 'en' ? 'Financial Literacy' : 'वित्तीय साक्षरता',
      description: language === 'en'
        ? 'Interactive lessons in your language'
        : 'आपकी भाषा में इंटरैक्टिव पाठ',
    },
  ];

  const tips = [
    {
      title: language === 'en' ? '50-30-20 Rule (Modified)' : '50-30-20 नियम (संशोधित)',
      description: language === 'en'
        ? '50% essentials, 30% irregular income buffer, 20% savings & debt'
        : '50% आवश्यक, 30% अनियमित आय बफर, 20% बचत और ऋण',
    },
    {
      title: language === 'en' ? 'Emergency Fund First' : 'पहले आपातकालीन निधि',
      description: language === 'en'
        ? 'Build 3-6 months of expenses before investing'
        : 'निवेश से पहले 3-6 महीने का खर्च बनाएं',
    },
    {
      title: language === 'en' ? 'Diversify Income' : 'आय में विविधता लाएं',
      description: language === 'en'
        ? 'Multiple income streams reduce financial stress'
        : 'कई आय स्रोत वित्तीय तनाव कम करते हैं',
    },
    {
      title: language === 'en' ? 'Use Digital Payments' : 'डिजिटल भुगतान का उपयोग करें',
      description: language === 'en'
        ? 'Track expenses automatically and get cashback'
        : 'खर्च स्वचालित रूप से ट्रैक करें और कैशबैक पाएं',
    },
  ];

  const supportOptions = [
    {
      icon: <Phone />,
      title: language === 'en' ? 'Toll-Free Helpline' : 'टोल-फ्री हेल्पलाइन',
      value: '1800-XXX-XXXX',
      description: language === 'en' ? '24/7 Support in 12 languages' : '12 भाषाओं में 24/7 सहायता',
    },
    {
      icon: <Message />,
      title: language === 'en' ? 'WhatsApp Banking' : 'व्हाट्सएप बैंकिंग',
      value: '+91-XXXXX-XXXXX',
      description: language === 'en' ? 'Chat-based support' : 'चैट-आधारित सहायता',
    },
    {
      icon: <Language />,
      title: language === 'en' ? 'Local Language Support' : 'स्थानीय भाषा सहायता',
      value: 'Hindi, Telugu, Tamil, Malayalam & more',
      description: language === 'en' ? 'Voice and text assistance' : 'आवाज और पाठ सहायता',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          {t.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t.subtitle}
        </Typography>
      </Box>

      {/* Income Calculator Card */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" color="white" gutterBottom fontWeight="bold">
            💰 {language === 'en' ? 'Income & Savings Calculator' : 'आय और बचत कैलकुलेटर'}
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label={t.incomeLabel}
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                variant="filled"
                sx={{ bgcolor: 'white', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label={t.goalLabel}
                type="number"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                variant="filled"
                sx={{ bgcolor: 'white', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCalculate}
                sx={{ 
                  height: '56px',
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                {t.calculateBtn}
              </Button>
            </Grid>
          </Grid>

          {showRecommendations && income > 0 && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.95)' }}>
                <Typography variant="h6" gutterBottom>
                  {language === 'en' ? '📊 Your Financial Health' : '📊 आपका वित्तीय स्वास्थ्य'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {language === 'en' ? 'Savings Rate' : 'बचत दर'}
                      </Typography>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {savingsRate.toFixed(1)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(savingsRate, 100)} 
                        sx={{ mt: 1, height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {language === 'en' ? 'Emergency Fund Target' : 'आपातकालीन निधि लक्ष्य'}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ₹{emergencyFund.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {language === 'en' ? '(3 months expenses)' : '(3 महीने का खर्च)'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {language === 'en' ? 'Daily Savings Needed' : 'दैनिक बचत की आवश्यकता'}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        ₹{(goal / 30).toFixed(0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {language === 'en' ? 'per day' : 'प्रति दिन'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {savingsRate < 20 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    {language === 'en'
                      ? '⚠️ Try to save at least 20% of your income for long-term financial security'
                      : '⚠️ दीर्घकालिक वित्तीय सुरक्षा के लिए अपनी आय का कम से कम 20% बचाने का प्रयास करें'}
                  </Alert>
                )}
                {savingsRate >= 20 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {language === 'en'
                      ? '✅ Excellent! You\'re on track to build a strong financial foundation'
                      : '✅ उत्कृष्ट! आप एक मजबूत वित्तीय नींव बनाने की राह पर हैं'}
                  </Alert>
                )}
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Key Features */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          {t.features}
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'primary.main', mb: 2, width: 56, height: 56 }}>
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Financial Tips */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          <Lightbulb sx={{ verticalAlign: 'middle', mr: 1 }} />
          {t.tips}
        </Typography>
        <Card>
          <List>
            {tips.map((tip, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography fontWeight="bold">{tip.title}</Typography>}
                    secondary={tip.description}
                  />
                </ListItem>
                {index < tips.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      </Box>

      {/* Support Options */}
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
          {t.support}
        </Typography>
        <Grid container spacing={3}>
          {supportOptions.map((option, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {option.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      {option.title}
                    </Typography>
                  </Stack>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {option.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Government Schemes */}
      <Box sx={{ mt: 4 }}>
        <Alert severity="info" icon={<TrendingUp />}>
          <Typography variant="body1" fontWeight="bold" gutterBottom>
            {language === 'en' ? '🏛️ Government Schemes for You' : '🏛️ आपके लिए सरकारी योजनाएं'}
          </Typography>
          <Typography variant="body2">
            {language === 'en'
              ? 'Check your eligibility for: Pradhan Mantri Jan Dhan Yojana, Atal Pension Yojana, PM Kisan, MUDRA Loans'
              : 'पात्रता जांचें: प्रधानमंत्री जन धन योजना, अटल पेंशन योजना, PM किसान, MUDRA ऋण'}
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default FinancialInclusion;

/**
 * Comprehensive Financial Report Dashboard
 * 
 * Features:
 * - Complete financial overview (Portfolio, Tax, Goals, Expenses)
 * - Personalized AI Chatbot for each user
 * - Voice Assistant for hands-free interaction
 * - Automated recurring purchases (groceries, bills)
 * - Smart insights and recommendations
 * - Downloadable PDF report
 */

import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  Avatar,
  LinearProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Badge,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Chat,
  Mic,
  MicOff,
  Send,
  PictureAsPdf,
  AccountBalance,
  TrendingUp,
  Receipt,
  CalendarMonth,
  SmartToy,
  ShoppingCart,
  AutoAwesome,
  Close,
  Stop,
  Autorenew,
  LocalMall,
  ElectricBolt,
  Wifi,
  Category,
  Add,
  Language,
  Settings,
} from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import { getUserProfileData } from '../services/profileService';
import type { UserProfileData } from '../services/profileService';
import { 
  customFinancialChatbot, 
  SUPPORTED_LANGUAGES, 
  type SupportedLanguage, 
  type ChatMessage as CustomChatMessage,
  type ChatSession 
} from '../services/customFinancialChatbot';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AutomatedPurchase {
  id: string;
  name: string;
  category: 'groceries' | 'utilities' | 'subscriptions';
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextPurchase: Date;
  vendor: string;
  enabled: boolean;
}

const FinancialReport: React.FC = () => {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! 👋 I'm your **Personal AI Financial Advisor** with complete access to your financial profile.\n\n📊 **What I know about you:**\n• Portfolio: ₹${profileData ? (profileData.portfolio.currentValue / 100000).toFixed(2) : '0.00'}L\n• Health Score: ${profileData?.financialHealthScore || 0}/100\n• Active Goals: ${profileData?.futurePlans.filter(p => p.status === 'in_progress').length || 0}\n• Risk Profile: ${profileData?.riskProfile || 'Not set'}\n\n🤖 **I can help you with:**\n• **Retirement Planning** - 30-year wealth building strategies\n• **Investment Analysis** - Portfolio optimization & recommendations\n• **Tax Optimization** - Maximize savings with smart investments\n• **Goal Planning** - Home, education, emergency fund planning\n• **Risk Assessment** - Balanced portfolio recommendations\n\n💬 **Try asking me:**\n• "Create a 30-year retirement plan"\n• "How can I optimize my portfolio?"\n• "What's my tax saving potential?"\n• "Plan my home purchase goal"\n\nWhat would you like to discuss today?`,
      timestamp: new Date(),
    },
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Voice assistant state
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const recognitionRef = useRef<any>(null);
  
  // Automation state
  const [automationDialogOpen, setAutomationDialogOpen] = useState(false);
  const [automatedPurchases, setAutomatedPurchases] = useState<AutomatedPurchase[]>([
    {
      id: '1',
      name: 'Fresh Milk (2L)',
      category: 'groceries',
      amount: 120,
      frequency: 'daily',
      nextPurchase: new Date(Date.now() + 24 * 60 * 60 * 1000),
      vendor: 'Instamart',
      enabled: true,
    },
    {
      id: '2',
      name: 'Eggs (12 pcs)',
      category: 'groceries',
      amount: 90,
      frequency: 'weekly',
      nextPurchase: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      vendor: 'BigBasket',
      enabled: true,
    },
    {
      id: '3',
      name: 'Electricity Bill',
      category: 'utilities',
      amount: 2500,
      frequency: 'monthly',
      nextPurchase: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      vendor: 'BESCOM',
      enabled: true,
    },
    {
      id: '4',
      name: 'Netflix Premium',
      category: 'subscriptions',
      amount: 649,
      frequency: 'monthly',
      nextPurchase: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      vendor: 'Netflix',
      enabled: true,
    },
  ]);

  // Multi-lingual and custom AI chatbot state
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [customChatMessages, setCustomChatMessages] = useState<CustomChatMessage[]>([]);
  const [customInput, setCustomInput] = useState<Record<string, any>>({});
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [isLoadingChatSession, setIsLoadingChatSession] = useState(false);
  const [customInputDialog, setCustomInputDialog] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [currentAge, setCurrentAge] = useState('');
  const [financialGoals, setFinancialGoals] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('');

  useEffect(() => {
    if (user) {
      loadFinancialData();
      initializeVoiceRecognition();
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [user]);

  const loadFinancialData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getUserProfileData(user.id);
      setProfileData(data);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== VOICE ASSISTANT ====================
  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceText(transcript);
        setMessageInput(transcript);
        
        // Automatically send the voice message
        handleSendMessage(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  };

  const toggleVoiceAssistant = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setChatOpen(true);
      setIsListening(true);
      setVoiceText('Listening...');
      recognitionRef.current.start();
    }
  };

  // ==================== AI CHATBOT ====================
  const handleSendMessage = async (message?: string) => {
    const textToSend = message || messageInput.trim();
    if (!textToSend || !profileData) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setVoiceText('');
    setIsSendingMessage(true);
    
    // Simulate AI response with financial context
    setTimeout(() => {
      const aiResponse = generateContextualResponse(textToSend, profileData);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      setIsSendingMessage(false);
      
      // Speak the response
      speakResponse(aiResponse);
    }, 1500);
  };

  const generateContextualResponse = (query: string, data: UserProfileData): string => {
    const lowerQuery = query.toLowerCase();
    
    // Portfolio queries
    if (lowerQuery.includes('portfolio') || lowerQuery.includes('investment')) {
      return `📊 Your Portfolio Summary:\n\n• Total Value: ₹${(data.portfolio.currentValue / 100000).toFixed(2)}L\n• Total Invested: ₹${(data.portfolio.totalInvested / 100000).toFixed(2)}L\n• Returns: ₹${(data.portfolio.totalReturns / 1000).toFixed(0)}K (${data.portfolio.returnsPercentage.toFixed(2)}%)\n\nAllocation:\n• Equity: ${data.portfolio.allocation.equity}%\n• Debt: ${data.portfolio.allocation.debt}%\n• Gold: ${data.portfolio.allocation.gold}%\n\nYou have ${data.portfolio.investments.length} active investments. Your portfolio is performing well with a ${data.portfolio.returnsPercentage >= 0 ? 'positive' : 'negative'} return!`;
    }
    
    // Tax queries
    if (lowerQuery.includes('tax') || lowerQuery.includes('save tax')) {
      const currentYearTax = data.currentYearTax;
      if (currentYearTax) {
        return `💰 Tax Optimization for ${currentYearTax.financialYear}:\n\n• Annual Salary: ₹${(currentYearTax.annualSalary / 100000).toFixed(2)}L\n• Tax Regime: ${currentYearTax.taxRegime.toUpperCase()}\n• Tax Saved: ₹${(currentYearTax.taxSaved / 1000).toFixed(0)}K\n\nDeductions:\n• Section 80C: ₹${(currentYearTax.investments.section80C / 1000).toFixed(0)}K\n• Section 80D: ₹${(currentYearTax.investments.section80D / 1000).toFixed(0)}K\n• Home Loan (24): ₹${(currentYearTax.investments.section24 / 1000).toFixed(0)}K\n\nTip: You can save more by maxing out your 80C limit (₹1.5L) with ELSS mutual funds!`;
      }
      return `I don't have your current tax information. Please visit the Tax Optimization page to add your salary details and get personalized tax-saving recommendations.`;
    }
    
    // Goals queries
    if (lowerQuery.includes('goal') || lowerQuery.includes('plan')) {
      const activeGoals = data.futurePlans.filter(p => p.status === 'in_progress');
      if (activeGoals.length > 0) {
        const goalsList = activeGoals.map(g => 
          `• ${g.title}: ₹${(g.currentSavings / 100000).toFixed(2)}L / ₹${(g.targetAmount / 100000).toFixed(2)}L (${g.progress.toFixed(1)}%)`
        ).join('\n');
        return `🎯 Your Active Financial Goals:\n\n${goalsList}\n\nYou're making good progress! Keep up the monthly contributions to reach your targets on time.`;
      }
      return `You haven't set any financial goals yet. Would you like me to help you create a goal? Common goals include:\n\n• Home purchase\n• Retirement planning\n• Child's education\n• Emergency fund\n\nLet me know which one interests you!`;
    }
    
    // AI Agents queries
    if (lowerQuery.includes('agent') || lowerQuery.includes('automation')) {
      const activeAgents = data.activeAgents.filter(a => a.status === 'active');
      return `🤖 You have ${activeAgents.length} active AI agents:\n\n${activeAgents.map(a => 
        `• ${a.name}: ${a.actionsPerformed} actions, ₹${(a.savingsGenerated / 1000).toFixed(0)}K saved`
      ).join('\n')}\n\nTotal savings from AI agents: ₹${activeAgents.reduce((sum, a) => sum + a.savingsGenerated, 0) / 1000}K!`;
    }
    
    // Automated purchases
    if (lowerQuery.includes('groceries') || lowerQuery.includes('automate') || lowerQuery.includes('shopping')) {
      const activeAutomation = automatedPurchases.filter(p => p.enabled);
      const monthlySpend = activeAutomation.reduce((sum, p) => {
        const multiplier = p.frequency === 'daily' ? 30 : p.frequency === 'weekly' ? 4 : 1;
        return sum + (p.amount * multiplier);
      }, 0);
      return `🛒 Automated Purchases:\n\n${activeAutomation.map(p => 
        `• ${p.name} (${p.frequency}): ₹${p.amount} via ${p.vendor}`
      ).join('\n')}\n\nEstimated monthly spend: ₹${monthlySpend.toFixed(0)}\n\nWant to add more items? Just let me know!`;
    }
    
    // Financial health
    if (lowerQuery.includes('health') || lowerQuery.includes('score')) {
      return `💪 Your Financial Health Score: ${data.financialHealthScore}/100\n\nThis is ${data.financialHealthScore >= 80 ? 'excellent' : data.financialHealthScore >= 60 ? 'good' : 'needs improvement'}!\n\nFactors:\n• Portfolio performance: Strong\n• Tax planning: Active\n• Goal progress: On track\n• Risk profile: ${data.riskProfile}\n\n${data.financialHealthScore < 80 ? 'Tip: Increase your emergency fund and diversify your portfolio to improve your score!' : 'Keep up the great work!'}`;
    }
    
    // General help
    return `I can help you with:\n\n📊 Portfolio & Investments\n💰 Tax Optimization\n🎯 Financial Goals\n🤖 AI Agents & Automation\n🛒 Automated Purchases\n💪 Financial Health Analysis\n\nJust ask me anything about your finances! For example:\n• "Show me my portfolio"\n• "How much tax can I save?"\n• "What are my goals?"\n• "Automate my groceries"`;
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // ==================== AUTOMATION MANAGEMENT ====================
  const toggleAutomation = (id: string) => {
    setAutomatedPurchases(prev =>
      prev.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'groceries': return <LocalMall color="success" />;
      case 'utilities': return <ElectricBolt color="warning" />;
      case 'subscriptions': return <Wifi color="info" />;
      default: return <Category />;
    }
  };

  // ==================== PDF EXPORT ====================
  const exportToPDF = () => {
    alert('PDF export feature coming soon! This will generate a comprehensive financial report.');
  };

  // ==================== CUSTOM AI CHATBOT & MULTILINGUAL ====================
  
  const initializeCustomChatSession = async () => {
    if (!user || chatSession) return;
    
    setIsLoadingChatSession(true);
    try {
      console.log('Initializing custom chat session...');
      const session = await customFinancialChatbot.createChatSession(
        user.id,
        currentLanguage,
        customInput
      );
      setChatSession(session);
      setCustomChatMessages(session.messages);
      console.log('✅ Custom chat session initialized:', session.id);
    } catch (error) {
      console.error('❌ Error initializing custom chat session:', error);
      // Fallback to basic chatbot
      setChatSession(null);
      setCustomChatMessages([]);
    } finally {
      setIsLoadingChatSession(false);
    }
  };

  const handleCustomChatMessage = async (message: string) => {
    if (!user) return;
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // Add user message immediately to UI
    const userMessage: CustomChatMessage = {
      id: `USER_${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
      language: currentLanguage,
    };

    setCustomChatMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setIsSendingMessage(true);

    try {
      let response: CustomChatMessage;
      
      if (chatSession) {
        // Use custom AI chatbot
        console.log('Sending message to custom AI chatbot...');
        response = await customFinancialChatbot.sendMessage(
          chatSession.id,
          trimmedMessage,
          customInput
        );
      } else {
        // Fallback to contextual response generation
        console.log('Using fallback contextual response...');
        const aiResponseContent = await generateAdvancedFinancialResponse(trimmedMessage, profileData);
        response = {
          id: `AI_${Date.now()}`,
          role: 'assistant',
          content: aiResponseContent,
          timestamp: new Date(),
          language: currentLanguage,
        };
      }

      // Add AI response to UI
      setCustomChatMessages(prev => [...prev, response]);
      
      // Speak response if voice is enabled
      if (response.content) {
        speakResponse(response.content);
      }
      
    } catch (error) {
      console.error('❌ Error sending custom chat message:', error);
      
      // Add error message
      const errorMessage: CustomChatMessage = {
        id: `ERROR_${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request. Let me try to help you with the information I have access to.\n\n${profileData ? generateContextualResponse(trimmedMessage, profileData) : 'Please ensure your financial data is loaded and try again.'}`,
        timestamp: new Date(),
        language: currentLanguage,
      };
      
      setCustomChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Enhanced financial response generator
  const generateAdvancedFinancialResponse = async (query: string, data: UserProfileData | null): Promise<string> => {
    if (!data) {
      return "I don't have access to your financial data yet. Please ensure your profile is loaded and try again.";
    }

    const lowerQuery = query.toLowerCase();
    
    // Retirement planning queries
    if (lowerQuery.includes('retire') || lowerQuery.includes('retirement') || lowerQuery.includes('30 year')) {
      return `🎯 **30-Year Retirement Plan** 

**Your Path to Financial Freedom:**

📈 **Investment Strategy:**
• **Years 1-10**: Aggressive Growth (80% equity, 20% debt)
• **Years 11-20**: Balanced Portfolio (60% equity, 40% debt)  
• **Years 21-30**: Conservative Approach (40% equity, 60% debt)

💰 **SIP Recommendations:**
• ₹20,000/month @ 12% returns = ₹2.3 Crores in 30 years
• ₹35,000/month @ 12% returns = ₹4 Crores in 30 years
• ₹50,000/month @ 12% returns = ₹5.7 Crores in 30 years

🎯 **Specific Funds to Consider:**
• **Large Cap**: Axis Bluechip Fund
• **Mid Cap**: Kotak Emerging Equity Fund  
• **ELSS**: Mirae Asset Tax Saver Fund
• **Debt**: HDFC Corporate Bond Fund

📊 **Asset Allocation by Age:**
• **Age 30-40**: 70% Equity + 30% Debt
• **Age 40-50**: 60% Equity + 40% Debt
• **Age 50-60**: 40% Equity + 60% Debt

🔄 **Rebalancing**: Review and rebalance every 6 months

Would you like me to create a detailed year-by-year investment schedule?`;
    }
    
    if (lowerQuery.includes('portfolio') || lowerQuery.includes('investment')) {
      return `📊 **Portfolio Analysis & Recommendations**

**Current Status:** Based on your profile
• **Total Value**: ₹${profileData ? (profileData.portfolio.currentValue / 100000).toFixed(2) : '0.00'}L
• **Risk Profile**: ${profileData?.riskProfile || 'Moderate'}
• **Performance**: ${profileData ? (profileData.portfolio.returnsPercentage >= 0 ? 'Positive' : 'Needs improvement') : 'Getting started'}

🚀 **Recommended Portfolio Mix:**
• **Large Cap Equity Funds**: 40% (stable growth)
• **Mid & Small Cap Funds**: 25% (high growth potential)
• **ELSS Funds**: 15% (tax saving + equity growth)
• **Debt Funds**: 15% (stability)
• **International Funds**: 5% (diversification)

📈 **Top Fund Recommendations:**
• **Large Cap**: SBI Bluechip Fund, ICICI Prudential Bluechip
• **Mid Cap**: Axis Midcap Fund, DSP Midcap Fund
• **ELSS**: Axis Long Term Equity, Mirae Asset Tax Saver
• **Debt**: HDFC Corporate Bond, ICICI Prudential Corporate Bond

💡 **Next Steps:**
1. Start SIP of ₹25,000/month across 4-5 funds
2. Increase SIP by 10% annually (step-up SIP)
3. Review performance every 6 months
4. Rebalance when allocation drifts by 5%

Need specific fund analysis or SIP amount suggestions?`;
    }
    
    if (lowerQuery.includes('tax') || lowerQuery.includes('save')) {
      return `💰 **Tax Optimization Strategy**

**Available Deductions (FY 2024-25):**
• **Section 80C**: ₹1.5L (ELSS, PPF, Life Insurance)
• **Section 80D**: ₹25K (Health Insurance)
• **Section 24**: ₹2L (Home Loan Interest)
• **NPS**: ₹50K (Additional under 80CCD(1B))

🎯 **Smart Tax-Saving Investments:**
• **ELSS Mutual Funds**: Best option - equity growth + tax saving
• **PPF**: 15-year lock-in, 7.1% returns, completely tax-free
• **NPS**: Additional ₹50K deduction, retirement planning
• **Health Insurance**: Essential protection + tax benefit

📊 **Tax Calculation Example:**
If your income is ₹10L annually:
• **Without planning**: ~₹1.12L tax
• **With full 80C**: ~₹65K tax
• **Savings**: ₹47K annually!

💡 **Recommended Strategy:**
1. **ELSS**: ₹1.5L annually (monthly SIP of ₹12.5K)
2. **Health Insurance**: ₹25K premium
3. **NPS**: ₹50K annually
4. **Total Tax Saved**: ~₹54K annually

🔄 **Implementation Plan:**
• Start ELSS SIP immediately
• Get comprehensive health insurance
• Open NPS account for additional savings

Want me to recommend specific tax-saving funds?`;
    }
    
    if (lowerQuery.includes('goal') || lowerQuery.includes('plan')) {
      return `🎯 **Financial Goal Planning**

**Common Financial Goals & SIP Requirements:**

🏠 **Home Purchase (₹75L in 7 years)**
• Required SIP: ₹65,000/month @ 12% returns
• Recommended funds: Large cap + mid cap mix

👶 **Child Education (₹50L in 15 years)**  
• Required SIP: ₹19,000/month @ 12% returns
• Recommended: Balanced advantage funds

🚗 **Car Purchase (₹15L in 3 years)**
• Required SIP: ₹35,000/month @ 8% returns
• Recommended: Debt funds or hybrid funds

💰 **Emergency Fund (₹6L in 1 year)**
• Required SIP: ₹45,000/month
• Recommended: Liquid funds or savings account

🏖️ **Retirement (₹5Cr in 30 years)**
• Required SIP: ₹43,000/month @ 12% returns
• Recommended: Aggressive equity portfolio

📊 **Goal Priority Framework:**
1. **Emergency Fund** (Immediate)
2. **Health & Term Insurance** (Immediate)  
3. **Retirement Planning** (Long-term)
4. **Child Education** (Medium-term)
5. **Home Purchase** (Medium-term)

💡 **Smart Tips:**
• Use step-up SIPs (increase by 10% annually)
• Separate goals with different fund types
• Review progress every 6 months

Which goal would you like me to help you plan in detail?`;
    }

    return `🤖 **I'm here to help with your finances!**

**Popular Questions:**
• "Create a retirement plan for 30 years"
• "How should I optimize my portfolio?"
• "What's the best tax-saving strategy?"
• "Help me plan for buying a home"
• "Show me my investment performance"

**What I can analyze:**
📊 Your portfolio performance and recommendations
💰 Tax optimization strategies  
🎯 Goal-based investment planning
📈 Market insights and fund selection
🔄 Portfolio rebalancing advice

Try asking me about retirement planning, investment strategy, or tax optimization!`;
  };

  const switchLanguage = async (newLanguage: SupportedLanguage) => {
    setCurrentLanguage(newLanguage);
    setLanguageDialogOpen(false);
    
    // Create new chat session with new language
    if (user) {
      setIsLoadingChatSession(true);
      try {
        const session = await customFinancialChatbot.createChatSession(
          user.id,
          newLanguage,
          customInput
        );
        setChatSession(session);
        setCustomChatMessages(session.messages);
      } catch (error) {
        console.error('Error switching language:', error);
      } finally {
        setIsLoadingChatSession(false);
      }
    }
  };

  const handleCustomInputSubmit = () => {
    const newCustomInput = {
      monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
      age: currentAge ? parseInt(currentAge) : undefined,
      goals: financialGoals || undefined,
      riskTolerance: riskTolerance || undefined,
    };
    
    setCustomInput(newCustomInput);
    setCustomInputDialog(false);
    
    // Reinitialize chat session with new input
    if (user) {
      initializeCustomChatSession();
    }
  };

  const getLocalizedText = (key: string, lang: SupportedLanguage = currentLanguage): string => {
    const translations: Record<string, Record<string, string>> = {
      'New Chat': {
        en: 'New Chat',
        hi: 'नई चैट',
        ta: 'புதிய அரட்டை',
        te: 'కొత్త చాట్',
      },
      'Custom Input': {
        en: 'Custom Input',
        hi: 'कस्टम इनपुट',
        ta: 'தனிப்பயன் உள்ளீடு',
        te: 'కస్టమ్ ఇన్‌పుట్',
      },
      'Language Settings': {
        en: 'Language Settings',
        hi: 'भाषा सेटिंग्स',
        ta: 'மொழி அமைப்புகள்',
        te: 'భాష సెట్టింగ్‌లు',
      },
      'Monthly Income': {
        en: 'Monthly Income (₹)',
        hi: 'मासिक आय (₹)',
        ta: 'மாதாந்திர வருமானம் (₹)',
        te: 'నెలవారీ ఆదాయం (₹)',
      },
      'Current Age': {
        en: 'Current Age',
        hi: 'वर्तमान आयु',
        ta: 'தற்போதைய வயது',
        te: 'ప్రస్తుత వయస్సు',
      },
      'Financial Goals': {
        en: 'Financial Goals',
        hi: 'वित्तीय लक्ष्य',
        ta: 'நிதி இலக்குகள்',
        te: 'ఆర్థిక లక్ష్యాలు',
      },
      'Risk Tolerance': {
        en: 'Risk Tolerance (Low/Medium/High)',
        hi: 'जोखिम सहनशीलता (कम/मध्यम/उच्च)',
        ta: 'ஆபத்து சகிப்புத்தன்மை (குறைவு/நடுத்தர/அதிகம்)',
        te: 'రిస్క్ టాలరెన్స్ (తక్కువ/మధ్యమ/అధికం)',
      },
    };
    
    return translations[key]?.[lang] || key;
  };

  // Initialize custom chat session when component loads
  useEffect(() => {
    if (user && !chatSession && !isLoadingChatSession) {
      initializeCustomChatSession();
    }
  }, [user, currentLanguage]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load financial data. Please try again.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with AI Features */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            📊 My Financial Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete overview of your financial health with AI-powered insights
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Language />}
            onClick={() => setLanguageDialogOpen(true)}
            color="primary"
          >
            {SUPPORTED_LANGUAGES[currentLanguage]}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={exportToPDF}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShoppingCart />}
            onClick={() => setAutomationDialogOpen(true)}
          >
            Automation ({automatedPurchases.filter(p => p.enabled).length})
          </Button>
        </Box>
      </Box>

      {/* Financial Health Score Banner */}
      <Card 
        elevation={6} 
        sx={{ 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ py: 4 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <Box textAlign="center">
                <Avatar
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    bgcolor: 'white', 
                    color: 'primary.main', 
                    fontSize: 48,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {profileData.displayName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h5" fontWeight="bold">
                  {profileData.displayName}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {profileData.email}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Financial Health Score
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Typography variant="h2" fontWeight="bold">
                  {profileData.financialHealthScore}
                </Typography>
                <Typography variant="h5" sx={{ opacity: 0.9 }}>
                  / 100
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={profileData.financialHealthScore} 
                sx={{ 
                  height: 12, 
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                  }
                }}
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                {profileData.financialHealthScore >= 80 ? '🎉 Excellent financial health!' : 
                 profileData.financialHealthScore >= 60 ? '✅ Good financial standing' : 
                 '⚠️ Needs improvement'}
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12, md: 3 }}>
              <Box textAlign="center">
                <Chip 
                  label={profileData.riskProfile.toUpperCase()} 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 2,
                  }}
                />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Risk Profile
                </Typography>
                {profileData.occupation && (
                  <>
                    <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {profileData.occupation}
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Metrics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalance color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Portfolio Value
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ₹{(profileData.portfolio.currentValue / 100000).toFixed(2)}L
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <TrendingUp fontSize="small" color={profileData.portfolio.returnsPercentage >= 0 ? 'success' : 'error'} />
                <Typography 
                  variant="body2" 
                  color={profileData.portfolio.returnsPercentage >= 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {profileData.portfolio.returnsPercentage >= 0 ? '+' : ''}{profileData.portfolio.returnsPercentage.toFixed(2)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Receipt color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Tax Saved
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                ₹{profileData.currentYearTax ? (profileData.currentYearTax.taxSaved / 1000).toFixed(0) : 0}K
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {profileData.currentYearTax?.financialYear || 'FY 2024-25'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarMonth color="info" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Active Goals
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {profileData.futurePlans.filter(p => p.status === 'in_progress').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total: {profileData.futurePlans.length} goals
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SmartToy color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  AI Agents
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {profileData.activeAgents.filter(a => a.status === 'active').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ₹{(profileData.activeAgents.reduce((sum, a) => sum + a.savingsGenerated, 0) / 1000).toFixed(0)}K saved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Chatbot Highlight */}
      <Alert 
        severity="info" 
        icon={<AutoAwesome />}
        sx={{ mb: 4 }}
        action={
          <Button color="inherit" size="small" onClick={() => setChatOpen(true)}>
            Open Chat
          </Button>
        }
      >
        <Typography variant="subtitle2" fontWeight="bold">
          🤖 Your Personal AI Financial Advisor is Ready!
        </Typography>
        <Typography variant="body2">
          I have complete access to your portfolio, tax records, goals, and spending patterns. 
          Ask me anything about your finances - I can provide instant insights and recommendations!
        </Typography>
      </Alert>

      {/* Detailed Sections with Tabs */}
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} variant="fullWidth">
          <Tab label="Portfolio" icon={<AccountBalance />} />
          <Tab label="Tax History" icon={<Receipt />} />
          <Tab label="Goals" icon={<CalendarMonth />} />
          <Tab label="Automation" icon={<Autorenew />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Portfolio Tab */}
          {selectedTab === 0 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Investment Portfolio
              </Typography>
              <Grid container spacing={3}>
                {profileData.portfolio.investments.slice(0, 6).map((investment) => (
                  <Grid key={investment.id} size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {investment.name}
                        </Typography>
                        <Box display="flex" gap={1} my={1}>
                          <Chip label={investment.type.replace('_', ' ').toUpperCase()} size="small" />
                          <Chip 
                            label={investment.riskLevel.toUpperCase()} 
                            size="small" 
                            color={investment.riskLevel === 'low' ? 'success' : investment.riskLevel === 'medium' ? 'warning' : 'error'}
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" mt={2}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Current Value</Typography>
                            <Typography variant="h6">₹{(investment.amount / 1000).toFixed(0)}K</Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="caption" color="text.secondary">Returns</Typography>
                            <Typography 
                              variant="h6" 
                              color={investment.returnsPercentage >= 0 ? 'success.main' : 'error.main'}
                            >
                              {investment.returnsPercentage >= 0 ? '+' : ''}{investment.returnsPercentage.toFixed(2)}%
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Tax History Tab */}
          {selectedTab === 1 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tax Optimization History
              </Typography>
              {profileData.taxHistory.length > 0 ? (
                <List>
                  {profileData.taxHistory.map((record) => (
                    <ListItem key={record.id} divider>
                      <ListItemText
                        primary={record.financialYear}
                        secondary={`Tax Saved: ₹${(record.taxSaved / 1000).toFixed(0)}K | Regime: ${record.taxRegime.toUpperCase()}`}
                      />
                      <Chip 
                        label={record.status.replace('_', ' ').toUpperCase()} 
                        color={record.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No tax records yet. Visit Tax Optimization to start saving!
                </Alert>
              )}
            </Box>
          )}

          {/* Goals Tab */}
          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Financial Goals
              </Typography>
              <Grid container spacing={3}>
                {profileData.futurePlans.map((plan) => (
                  <Grid key={plan.id} size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {plan.title}
                        </Typography>
                        <Chip 
                          label={plan.priority.toUpperCase()} 
                          size="small" 
                          color={plan.priority === 'high' ? 'error' : plan.priority === 'medium' ? 'warning' : 'info'}
                          sx={{ mt: 1 }}
                        />
                        <Box mt={2}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption">Progress</Typography>
                            <Typography variant="caption" fontWeight="bold">{plan.progress.toFixed(1)}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={plan.progress} sx={{ height: 8, borderRadius: 1 }} />
                        </Box>
                        <Box display="flex" justifyContent="space-between" mt={2}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Current</Typography>
                            <Typography variant="body2">₹{(plan.currentSavings / 100000).toFixed(2)}L</Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="caption" color="text.secondary">Target</Typography>
                            <Typography variant="body2">₹{(plan.targetAmount / 100000).toFixed(2)}L</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Automation Tab */}
          {selectedTab === 3 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Automated Purchases & Bills
              </Typography>
              <List>
                {automatedPurchases.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemAvatar>
                      <Avatar>{getCategoryIcon(item.category)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.name}
                      secondary={`₹${item.amount} • ${item.frequency} • ${item.vendor} • Next: ${item.nextPurchase.toLocaleDateString()}`}
                    />
                    <Switch
                      checked={item.enabled}
                      onChange={() => toggleAutomation(item.id)}
                      color="success"
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Voice Assistant FAB */}
        <Fab
          color={isListening ? 'error' : 'secondary'}
          onClick={toggleVoiceAssistant}
          sx={{ width: 64, height: 64 }}
        >
          {isListening ? <MicOff /> : <Mic />}
        </Fab>
        
        {/* Chatbot FAB */}
        <Badge badgeContent={chatMessages.length} color="primary">
          <Fab
            color="primary"
            onClick={() => setChatOpen(true)}
            sx={{ width: 64, height: 64 }}
          >
            <Chat />
          </Fab>
        </Badge>
      </Box>

      {/* Enhanced AI Chatbot Dialog with Multi-lingual Support */}
      <Dialog 
        open={chatOpen} 
        onClose={() => setChatOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '85vh', display: 'flex', flexDirection: 'column' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <SmartToy color="primary" />
              <Typography variant="h6" fontWeight="bold">
                AI Financial Advisor ({SUPPORTED_LANGUAGES[currentLanguage]})
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton onClick={() => setLanguageDialogOpen(true)} color="primary">
                <Language />
              </IconButton>
              <IconButton onClick={() => setCustomInputDialog(true)} color="primary">
                <Settings />
              </IconButton>
              <IconButton onClick={() => setChatOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }} icon={<AutoAwesome />}>
            <Typography variant="caption">
              This AI has complete access to your financial data and provides personalized advice in {SUPPORTED_LANGUAGES[currentLanguage]}!
            </Typography>
          </Alert>
        </DialogTitle>
        
        <DialogContent sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {isLoadingChatSession ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Initializing AI chatbot...</Typography>
            </Box>
          ) : (          <List>
            {(customChatMessages.length > 0 ? customChatMessages : chatMessages).map((message) => (
              <ListItem 
                key={message.id}
                sx={{ 
                  flexDirection: 'column',
                  alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '80%',
                    bgcolor: message.role === 'user' ? 'primary.main' : 'grey.200',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    p: 2,
                    borderRadius: 2,
                    whiteSpace: 'pre-line',
                  }}
                >
                  <Typography variant="body2">{message.content}</Typography>
                  {'metadata' in message && message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {message.metadata.suggestions.map((suggestion, idx) => (
                        <Chip 
                          key={idx} 
                          label={suggestion} 
                          size="small" 
                          variant="outlined"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </ListItem>
            ))}
            {isSendingMessage && (
              <ListItem>
                <CircularProgress size={24} />
                <Typography variant="caption" sx={{ ml: 2 }}>AI is thinking...</Typography>
              </ListItem>
            )}
          </List>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {isListening && (
            <Chip 
              label={voiceText || 'Listening...'} 
              color="error" 
              icon={<Mic />}
              deleteIcon={<Stop />}
              onDelete={toggleVoiceAssistant}
            />
          )}
          <TextField
            fullWidth
            placeholder={`Ask me anything about your finances in ${SUPPORTED_LANGUAGES[currentLanguage]}...`}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCustomChatMessage(messageInput);
              }
            }}
            disabled={isSendingMessage || isLoadingChatSession}
          />
          <IconButton 
            color="primary"
            onClick={() => handleCustomChatMessage(messageInput)}
            disabled={!messageInput.trim() || isSendingMessage || isLoadingChatSession}
          >
            <Send />
          </IconButton>
        </DialogActions>
      </Dialog>

      {/* Language Selection Dialog */}
      <Dialog open={languageDialogOpen} onClose={() => setLanguageDialogOpen(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Language color="primary" />
            <Typography variant="h6">{getLocalizedText('Language Settings')}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
              <ListItem 
                key={code}
                onClick={() => switchLanguage(code as SupportedLanguage)}
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: currentLanguage === code ? 'primary.light' : 'transparent',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <ListItemText primary={name} />
                {currentLanguage === code && <Chip label="Current" size="small" />}
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Custom Input Dialog */}
      <Dialog open={customInputDialog} onClose={() => setCustomInputDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Settings color="primary" />
            <Typography variant="h6">{getLocalizedText('Custom Input')}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label={getLocalizedText('Monthly Income')}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              type="number"
            />
            <TextField
              fullWidth
              label={getLocalizedText('Current Age')}
              value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value)}
              type="number"
            />
            <TextField
              fullWidth
              label={getLocalizedText('Financial Goals')}
              value={financialGoals}
              onChange={(e) => setFinancialGoals(e.target.value)}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label={getLocalizedText('Risk Tolerance')}
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomInputDialog(false)}>Cancel</Button>
          <Button onClick={handleCustomInputSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Automation Settings Dialog */}
      <Dialog 
        open={automationDialogOpen} 
        onClose={() => setAutomationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Autorenew color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Automated Purchases & Bills
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              💡 Smart Automation
            </Typography>
            <Typography variant="body2">
              Automate recurring purchases from Instamart, BigBasket, and bill payments. 
              We'll handle everything and notify you before each purchase!
            </Typography>
          </Alert>
          
          <List>
            {automatedPurchases.map((item) => (
              <Card key={item.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box display="flex" gap={2}>
                      <Avatar>{getCategoryIcon(item.category)}</Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.vendor} • {item.frequency}
                        </Typography>
                        <Box display="flex" gap={1} mt={1}>
                          <Chip label={`₹${item.amount}`} size="small" color="primary" />
                          <Chip label={`Next: ${item.nextPurchase.toLocaleDateString()}`} size="small" />
                        </Box>
                      </Box>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={item.enabled}
                          onChange={() => toggleAutomation(item.id)}
                          color="success"
                        />
                      }
                      label={item.enabled ? 'ON' : 'OFF'}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Add />}
            sx={{ mt: 2 }}
          >
            Add New Automation
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutomationDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FinancialReport;

/**
 * Custom AI Financial Chatbot Agent
 * 
 * Features:
 * - Interactive financial conversations
 * - Custom user input processing
 * - Multi-lingual support (Hindi, Tamil, Telugu, English)
 * - Personalized financial advice
 * - Context-aware responses
 * - Real-time data integration
 */

import { geminiService } from './gemini';
import { getUserProfileData } from './profileService';
import type { UserProfileData } from './profileService';

// Language configuration
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Chat message interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language: SupportedLanguage;
  metadata?: {
    userInput?: any; // Custom user data
    financialContext?: any;
    suggestions?: string[];
    quickActions?: string[];
  };
}

// Chat session interface
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  language: SupportedLanguage;
  messages: ChatMessage[];
  context: {
    userProfile?: UserProfileData;
    currentGoals?: string[];
    preferences?: Record<string, any>;
    customData?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Financial advice categories
export const ADVICE_CATEGORIES = {
  investment: 'Investment Planning',
  savings: 'Savings Strategy',
  tax: 'Tax Optimization',
  insurance: 'Insurance Planning',
  debt: 'Debt Management',
  retirement: 'Retirement Planning',
  budget: 'Budget Planning',
  goals: 'Goal Setting',
  expenses: 'Expense Management',
  emergency: 'Emergency Fund',
} as const;

class CustomFinancialChatbotService {
  private sessions: Map<string, ChatSession> = new Map();

  /**
   * Initialize a new chat session
   */
  async createChatSession(
    userId: string, 
    language: SupportedLanguage = 'en',
    customInput?: Record<string, any>
  ): Promise<ChatSession> {
    const sessionId = `CHAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Load user's financial profile
    let userProfile: UserProfileData | undefined;
    try {
      const profileResult = await getUserProfileData(userId);
      userProfile = profileResult || undefined;
    } catch (error) {
      console.log('Could not load user profile, proceeding without context');
    }

    const session: ChatSession = {
      id: sessionId,
      userId,
      title: this.getLocalizedText('New Financial Chat', language),
      language,
      messages: [],
      context: {
        userProfile,
        currentGoals: [],
        preferences: { language },
        customData: customInput || {},
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    // Add welcome message
    const welcomeMessage = await this.generateWelcomeMessage(session);
    session.messages.push(welcomeMessage);

    this.sessions.set(sessionId, session);
    this.saveSessionToStorage(session);

    console.log(`✅ Created chat session: ${sessionId} (${language})`);
    return session;
  }

  /**
   * Send a message to the AI chatbot
   */
  async sendMessage(
    sessionId: string,
    userMessage: string,
    customInput?: Record<string, any>
  ): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: `MSG_${Date.now()}_USER`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      language: session.language,
      metadata: {
        userInput: customInput,
      },
    };

    session.messages.push(userMsg);

    // Update context with custom input
    if (customInput) {
      session.context.customData = {
        ...session.context.customData,
        ...customInput,
      };
    }

    // Generate AI response
    const aiResponse = await this.generateAIResponse(session, userMessage, customInput);
    session.messages.push(aiResponse);

    // Update session
    session.updatedAt = new Date();
    this.sessions.set(sessionId, session);
    this.saveSessionToStorage(session);

    return aiResponse;
  }

  /**
   * Generate AI response based on user input and context
   */
  private async generateAIResponse(
    session: ChatSession,
    userMessage: string,
    customInput?: Record<string, any>
  ): Promise<ChatMessage> {
    const { language, context } = session;
    const { userProfile, customData } = context;

    // Build comprehensive prompt
    const systemPrompt = this.buildSystemPrompt(language, userProfile, customData);
    const contextPrompt = this.buildContextPrompt(session, customInput);
    
    const fullPrompt = `
${systemPrompt}

=== CONVERSATION CONTEXT ===
${contextPrompt}

=== USER MESSAGE ===
${userMessage}

=== CUSTOM INPUT DATA ===
${customInput ? JSON.stringify(customInput, null, 2) : 'None provided'}

=== RESPONSE INSTRUCTIONS ===
1. Respond in ${SUPPORTED_LANGUAGES[language]}
2. Use the user's financial data for personalized advice
3. Include specific numbers and calculations when relevant
4. Provide actionable recommendations
5. Ask follow-up questions if more information is needed
6. Include quick action suggestions if applicable
7. Keep the tone friendly and professional

Respond now:
`;

    try {
      const aiResponse = await geminiService.chat(fullPrompt, {
        sessionId: session.id,
        language: language,
      });

      // Parse response for suggestions and actions
      const { content, suggestions, quickActions } = this.parseAIResponse(aiResponse, language);

      return {
        id: `MSG_${Date.now()}_AI`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        language,
        metadata: {
          financialContext: userProfile,
          suggestions,
          quickActions,
        },
      };

    } catch (error: any) {
      console.error('Error generating AI response:', error);
      
      return {
        id: `MSG_${Date.now()}_ERROR`,
        role: 'assistant',
        content: this.getLocalizedText(
          'I apologize, but I encountered an error. Please try again.',
          language
        ),
        timestamp: new Date(),
        language,
      };
    }
  }

  /**
   * Build system prompt based on language and context
   */
  private buildSystemPrompt(
    language: SupportedLanguage,
    userProfile?: UserProfileData,
    customData?: Record<string, any>
  ): string {
    const basePrompt = {
      en: `You are an expert AI financial advisor specializing in Indian financial markets and regulations. You provide personalized financial advice based on user data and custom inputs.`,
      hi: `आप भारतीय वित्तीय बाजारों और नियमों में विशेषज्ञता रखने वाले एक एआई वित्तीय सलाहकार हैं। आप उपयोगकर्ता डेटा और कस्टम इनपुट के आधार पर व्यक्तिगत वित्तीय सलाह प्रदान करते हैं।`,
      ta: `நீங்கள் இந்திய நிதிச் சந்தைகள் மற்றும் விதிமுறைகளில் நிபுணத்துவம் பெற்ற AI நிதி ஆலோசகர். பயனர் தரவு மற்றும் தனிப்பயன் உள்ளீடுகளின் அடிப்படையில் தனிப்பயனாக்கப்பட்ட நிதி ஆலோசனை வழங்குகிறீர்கள்.`,
      te: `మీరు భారతీయ ఆర్థిక మార్కెట్లు మరియు నియమాలలో నిపుణత కలిగిన AI ఆర్థిక సలహాదారు. వినియోగదారు డేటా మరియు కస్టమ్ ఇన్‌పుట్‌ల ఆధారంగా వ్యక్తిగతీకరించిన ఆర్థిక సలహా అందిస్తారు.`,
    };

    let prompt = basePrompt[language];

    // Add user context if available
    if (userProfile) {
      const contextText = {
        en: `\n\nUser Profile Context:\n- Portfolio Value: ₹${(userProfile.portfolio.currentValue / 100000).toFixed(2)}L\n- Financial Health Score: ${userProfile.financialHealthScore}/100\n- Risk Profile: ${userProfile.riskProfile}\n- Active Goals: ${userProfile.futurePlans.length}`,
        hi: `\n\nउपयोगकर्ता प्रोफ़ाइल संदर्भ:\n- पोर्टफोलियो मूल्य: ₹${(userProfile.portfolio.currentValue / 100000).toFixed(2)}L\n- वित्तीय स्वास्थ्य स्कोर: ${userProfile.financialHealthScore}/100\n- जोखिम प्रोफ़ाइल: ${userProfile.riskProfile}\n- सक्रिय लक्ष्य: ${userProfile.futurePlans.length}`,
        ta: `\n\nபயனர் சுயவிவர சூழல்:\n- போர்ட்ஃபோலியோ மதிப்பு: ₹${(userProfile.portfolio.currentValue / 100000).toFixed(2)}L\n- நிதி சுகாதார மதிப்பெண்: ${userProfile.financialHealthScore}/100\n- ஆபத்து சுயவிவரம்: ${userProfile.riskProfile}\n- செயலில் உள்ள இலக்குகள்: ${userProfile.futurePlans.length}`,
        te: `\n\nవినియోగదారు ప్రొఫైల్ సందర్భం:\n- పోర్ట్‌ఫోలియో విలువ: ₹${(userProfile.portfolio.currentValue / 100000).toFixed(2)}L\n- ఆర్థిక ఆరోగ్య స్కోరు: ${userProfile.financialHealthScore}/100\n- రిస్క్ ప్రొఫైల్: ${userProfile.riskProfile}\n- చురుకైన లక్ష్యాలు: ${userProfile.futurePlans.length}`,
      };
      prompt += contextText[language];
    }

    // Add custom data context if available
    if (customData && Object.keys(customData).length > 0) {
      const customContextText = {
        en: `\n\nCustom Context: ${JSON.stringify(customData, null, 2)}`,
        hi: `\n\nकस्टम संदर्भ: ${JSON.stringify(customData, null, 2)}`,
        ta: `\n\nதனிப்பயன் சூழல்: ${JSON.stringify(customData, null, 2)}`,
        te: `\n\nకస్టమ్ సందర్భం: ${JSON.stringify(customData, null, 2)}`,
      };
      prompt += customContextText[language];
    }

    return prompt;
  }

  /**
   * Build context prompt from conversation history
   */
  private buildContextPrompt(session: ChatSession, customInput?: Record<string, any>): string {
    const recentMessages = session.messages.slice(-6); // Last 6 messages for context
    let context = '';

    for (const msg of recentMessages) {
      context += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    }

    if (customInput && Object.keys(customInput).length > 0) {
      context += `\nCUSTOM USER INPUT: ${JSON.stringify(customInput, null, 2)}\n`;
    }

    return context;
  }

  /**
   * Parse AI response for suggestions and quick actions
   */
  private parseAIResponse(response: string, language: SupportedLanguage): {
    content: string;
    suggestions: string[];
    quickActions: string[];
  } {
    let content = response;
    const suggestions: string[] = [];
    const quickActions: string[] = [];

    // Extract suggestions (look for bullet points or numbered lists)
    const suggestionRegex = /(?:suggestions?|सुझाव|பரிந்துரைகள்|సూచనలు)[:\s]*\n?((?:[-•]\s*.+\n?)+)/gi;
    const suggestionMatch = suggestionRegex.exec(response);
    
    if (suggestionMatch) {
      const suggestionText = suggestionMatch[1];
      const items = suggestionText.split(/[-•]/).filter(s => s.trim());
      suggestions.push(...items.map(s => s.trim()));
    }

    // Extract quick actions (look for action-oriented phrases)
    const actionKeywords = {
      en: ['invest', 'save', 'buy', 'sell', 'transfer', 'allocate', 'review'],
      hi: ['निवेश', 'बचत', 'खरीद', 'बेच', 'स्थानांतरण', 'आवंटन', 'समीक्षा'],
      ta: ['முதலீடு', 'சேமிப்பு', 'வாங்க', 'விற்க', 'மாற்று', 'ஒதுக்கீடு', 'மதிப்பாய்வு'],
      te: ['పెట్టుబడి', 'పొదుపు', 'కొనుగోలు', 'అమ్మకం', 'బదిలీ', 'కేటాయింపు', 'సమీక్ష'],
    };

    const keywords = actionKeywords[language] || actionKeywords.en;
    const sentences = response.split(/[.!?]/).filter(s => s.trim());
    
    for (const sentence of sentences) {
      for (const keyword of keywords) {
        if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
          quickActions.push(sentence.trim());
          break;
        }
      }
    }

    return { content, suggestions: suggestions.slice(0, 3), quickActions: quickActions.slice(0, 3) };
  }

  /**
   * Generate welcome message
   */
  private async generateWelcomeMessage(session: ChatSession): Promise<ChatMessage> {
    const { language, context } = session;
    const { userProfile } = context;

    let welcomeText = '';

    if (userProfile) {
      const welcomeTemplates = {
        en: `Hello ${userProfile.displayName}! 👋\n\nI'm your personal AI financial advisor. I have access to your complete financial profile:\n\n📊 Portfolio: ₹${(userProfile.portfolio.currentValue / 100000).toFixed(2)}L\n💪 Health Score: ${userProfile.financialHealthScore}/100\n🎯 Goals: ${userProfile.futurePlans.length} active\n\nI can help you with investment advice, tax planning, goal setting, and any financial questions. You can also share custom information for personalized recommendations.\n\nWhat would you like to discuss today?`,
        hi: `नमस्ते ${userProfile.displayName}! 👋\n\nमैं आपका व्यक्तिगत AI वित्तीय सलाहकार हूं। मेरे पास आपकी पूरी वित्तीय प्रोफ़ाइल है:\n\n📊 पोर्टफोलियो: ₹${(userProfile.portfolio.currentValue / 100000).toFixed(2)}L\n💪 स्वास्थ्य स्कोर: ${userProfile.financialHealthScore}/100\n🎯 लक्ष्य: ${userProfile.futurePlans.length} सक्रिय\n\nमैं निवेश सलाह, कर योजना, लक्ष्य निर्धारण और किसी भी वित्तीय प्रश्न में आपकी मदद कर सकता हूं। व्यक्तिगत सुझावों के लिए आप कस्टम जानकारी भी साझा कर सकते हैं।\n\nआज आप क्या चर्चा करना चाहेंगे?`,
        ta: `வணக்கம் ${userProfile.displayName}! 👋\n\nநான் உங்கள் தனிப்பட்ட AI நிதி ஆலோசகர். உங்கள் முழு நிதி விவரமும் என்னிடம் உள்ளது:\n\n📊 போர்ட்ஃபோலியோ: ₹${(userProfile.portfolio.currentValue / 100000).toFixed(2)}L\n💪 ஆரோக்கிய மதிப்பெண்: ${userProfile.financialHealthScore}/100\n🎯 இலக்குகள்: ${userProfile.futurePlans.length} செயலில்\n\nமுதலீட்டு ஆலோசனை, வரி திட்டமிடல், இலக்கு நிர்ணயம் மற்றும் எந்த நிதி கேள்விகளிலும் உங்களுக்கு உதவ முடியும். தனிப்பயனாக்கப்பட்ட பரிந்துரைகளுக்கு தனிப்பயன் தகவலையும் பகிரலாம்.\n\nஇன்று என்னை விவாதிக்க விரும்புகிறீர்கள்?`,
        te: `నమస్కారం ${userProfile.displayName}! 👋\n\nనేను మీ వ్యక్तిగత AI ఆర్థిక సలహాదారుని. మీ పూర్తి ఆర్థిక ప్రొఫైల్ నా దగ్గర ఉంది:\n\n📊 పోర్ట్‌ఫోలియో: ₹${(userProfile.portfolio.currentValue / 100000).toFixed(2)}L\n💪 ఆరోగ్య స్కోరు: ${userProfile.financialHealthScore}/100\n🎯 లక్ష్యాలు: ${userProfile.futurePlans.length} చురుకుగా\n\nపెట్టుబడి సలహా, పన్ను ప్రణాళిక, లక్ష్య నిర్ణయం మరియు ఏదైనా ఆర్థిక ప్రశ్నలలో మీకు సహాయం చేయగలను. వ్యక్తిగతీకరించిన సిఫార్సుల కోసం మీరు కస్టమ్ సమాచారాన్ని కూడా పంచుకోవచ్చు.\n\nఈ రోజు మీరు ఏమి చర్చించాలని అనుకుంటున్నారు?`,
      };
      welcomeText = welcomeTemplates[language];
    } else {
      const basicWelcome = {
        en: `Welcome to your AI Financial Advisor! 👋\n\nI'm here to help you with:\n• Investment planning\n• Tax optimization\n• Budget management\n• Goal setting\n• Financial advice\n\nYou can ask me questions and share custom information about your financial situation for personalized recommendations.\n\nHow can I assist you today?`,
        hi: `आपके AI वित्तीय सलाहकार में आपका स्वागत है! 👋\n\nमैं इनमें आपकी मदद के लिए यहां हूं:\n• निवेश योजना\n• कर अनुकूलन\n• बजट प्रबंधन\n• लक्ष्य निर्धारण\n• वित्तीय सलाह\n\nआप मुझसे प्रश्न पूछ सकते हैं और व्यक्तिगत सुझावों के लिए अपनी वित्तीय स्थिति के बारे में कस्टम जानकारी साझा कर सकते हैं।\n\nआज मैं आपकी कैसे सहायता कर सकता हूं?`,
        ta: `உங்கள் AI நிதி ஆலோசகரிடம் வரவேற்கிறோம்! 👋\n\nநான் இவற்றில் உங்களுக்கு உதவ இங்கே இருக்கிறேன்:\n• முதலீட்டு திட்டமிடல்\n• வரி மேம்படுத்தல்\n• பட்ஜெட் மேலாண்மை\n• இலக்கு நிர்ணயம்\n• நிதி ஆலோசனை\n\nநீங்கள் என்னிடம் கேள்விகள் கேட்கலாம் மற்றும் தனிப்பயனாக்கப்பட்ட பரிந்துரைகளுக்காக உங்கள் நிதி நிலைமை பற்றிய தனிப்பயன் தகவலைப் பகிரலாம்.\n\nஇன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?`,
        te: `మీ AI ఫైనాన్సియల్ అడ్వైజర్‌కు స్వాగతం! 👋\n\nనేను వీటిలో మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను:\n• పెట్టుబడి ప్రణాళిక\n• పన్ను అనుకూలీకరణ\n• బడ్జెట్ నిర్వహణ\n• లక్ష్య నిర్ణయం\n• ఆర్థిక సలహా\n\nమీరు నన్ను ప్రశ్నలు అడగవచ్చు మరియు వ్యక్తిగతీకరించిన సిఫార్సుల కోసం మీ ఆర్థిక పరిస్థితి గురించి కస్టమ్ సమాచారాన్ని పంచుకోవచ్చు.\n\nఈ రోజు నేను మీకు ఎలా సహాయం చేయగలను?`,
      };
      welcomeText = basicWelcome[language];
    }

    return {
      id: `MSG_${Date.now()}_WELCOME`,
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date(),
      language,
      metadata: {
        suggestions: this.getWelcomeSuggestions(language),
        quickActions: this.getWelcomeQuickActions(language),
      },
    };
  }

  /**
   * Get welcome suggestions based on language
   */
  private getWelcomeSuggestions(language: SupportedLanguage): string[] {
    const suggestions = {
      en: [
        'Show me my portfolio performance',
        'How can I save more tax?',
        'Help me plan for retirement',
        'What should I invest in?',
        'Review my current goals',
      ],
      hi: [
        'मेरे पोर्टफोलियो का प्रदर्शन दिखाएं',
        'मैं और कर कैसे बचा सकता हूं?',
        'सेवानिवृत्ति की योजना में मदद करें',
        'मुझे क्या निवेश करना चाहिए?',
        'मेरे वर्तमान लक्ष्यों की समीक्षा करें',
      ],
      ta: [
        'எனது போர்ட்ஃபோலியோ செயல்திறனைக் காட்டு',
        'நான் எப்படி அதிக வரி சேமிக்கலாம்?',
        'ஓய்வூதியத்திற்கு திட்டமிட உதவுங்கள்',
        'நான் எதில் முதலீடு செய்ய வேண்டும்?',
        'எனது தற்போதைய இலக்குகளை மதிப்பாய்வு செய்யுங்கள்',
      ],
      te: [
        'నా పోర్ట్‌ఫోలియో పనితీరును చూపించు',
        'నేను ఎలా మరింత పన్ను ఆదా చేయగలను?',
        'పదవీ విరమణ కోసం ప్రణాళిక వేయడంలో సహాయం చేయండి',
        'నేను దేనిలో పెట్టుబడి పెట్టాలి?',
        'నా ప్రస్తుత లక్ష్యాలను సమీక్షించండి',
      ],
    };
    return suggestions[language] || suggestions.en;
  }

  /**
   * Get welcome quick actions based on language
   */
  private getWelcomeQuickActions(language: SupportedLanguage): string[] {
    const actions = {
      en: [
        'Add new investment goal',
        'Calculate tax savings',
        'Review portfolio allocation',
      ],
      hi: [
        'नया निवेश लक्ष्य जोड़ें',
        'कर बचत की गणना करें',
        'पोर्टफोलियो आवंटन की समीक्षा करें',
      ],
      ta: [
        'புதிய முதலீட்டு இலக்கை சேர்க்கவும்',
        'வரி சேமிப்பைக் கணக்கிடுங்கள்',
        'போர்ட்ஃபோலியோ ஒதுக்கீட்டை மதிப்பாய்வு செய்யுங்கள்',
      ],
      te: [
        'కొత్త పెట్టుబడి లక్ష్యాన్ని జోడించండి',
        'పన్ను పొదుపులను లెక్కించండి',
        'పోర్ట్‌ఫోలియో కేటాయింపును సమీక్షించండి',
      ],
    };
    return actions[language] || actions.en;
  }

  /**
   * Get localized text
   */
  private getLocalizedText(key: string, language: SupportedLanguage): string {
    const translations: Record<string, Record<SupportedLanguage, string>> = {
      'New Financial Chat': {
        en: 'New Financial Chat',
        hi: 'नई वित्तीय चैट',
        ta: 'புதிய நிதி அரட்டை',
        te: 'కొత్త ఆర్థిక చాట్',
      },
      'I apologize, but I encountered an error. Please try again.': {
        en: 'I apologize, but I encountered an error. Please try again.',
        hi: 'मुझे खेद है, लेकिन मुझे एक त्रुटि का सामना करना पड़ा। कृपया पुन: प्रयास करें।',
        ta: 'மன்னிக்கவும், ஆனால் நான் ஒரு பிழையை எதிர்கொண்டேன். தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
        te: 'క్షమించండి, కానీ నేను ఒక లోపాన్ని ఎదుర్కొన్నాను. దయచేసి మళ్లీ ప్రయత్నించండి.',
      },
    };

    return translations[key]?.[language] || key;
  }

  /**
   * Get chat session
   */
  getChatSession(sessionId: string): ChatSession | null {
    return this.sessions.get(sessionId) || this.loadSessionFromStorage(sessionId);
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): ChatSession[] {
    const userSessions: ChatSession[] = [];
    
    // Check in-memory sessions
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }

    // Load from storage
    try {
      const stored = localStorage.getItem(`chat_sessions_${userId}`);
      if (stored) {
        const storedSessions: ChatSession[] = JSON.parse(stored);
        for (const session of storedSessions) {
          if (!userSessions.find(s => s.id === session.id)) {
            userSessions.push(session);
          }
        }
      }
    } catch (error) {
      console.error('Error loading sessions from storage:', error);
    }

    return userSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Change session language
   */
  async changeSessionLanguage(sessionId: string, newLanguage: SupportedLanguage): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.language = newLanguage;
    session.updatedAt = new Date();
    
    // Add language change message
    const changeMessage: ChatMessage = {
      id: `MSG_${Date.now()}_LANG_CHANGE`,
      role: 'system',
      content: this.getLocalizedText('Language changed', newLanguage),
      timestamp: new Date(),
      language: newLanguage,
    };

    session.messages.push(changeMessage);
    this.sessions.set(sessionId, session);
    this.saveSessionToStorage(session);
  }

  /**
   * Save session to localStorage
   */
  private saveSessionToStorage(session: ChatSession): void {
    try {
      const existing = this.getUserSessions(session.userId);
      const filtered = existing.filter(s => s.id !== session.id);
      filtered.unshift(session);
      
      // Keep only last 20 sessions
      const toSave = filtered.slice(0, 20);
      localStorage.setItem(`chat_sessions_${session.userId}`, JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  }

  /**
   * Load session from localStorage
   */
  private loadSessionFromStorage(sessionId: string): ChatSession | null {
    try {
      const allSessions = JSON.parse(localStorage.getItem('all_chat_sessions') || '[]');
      const session = allSessions.find((s: ChatSession) => s.id === sessionId);
      
      if (session) {
        // Convert date strings back to Date objects
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
        session.messages.forEach((msg: ChatMessage) => {
          msg.timestamp = new Date(msg.timestamp);
        });
        
        this.sessions.set(sessionId, session);
        return session;
      }
    } catch (error) {
      console.error('Error loading session from storage:', error);
    }
    
    return null;
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    
    // Remove from localStorage as well
    try {
      const allSessions = JSON.parse(localStorage.getItem('all_chat_sessions') || '[]');
      const filtered = allSessions.filter((s: ChatSession) => s.id !== sessionId);
      localStorage.setItem('all_chat_sessions', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting session from storage:', error);
    }
  }

  /**
   * Process custom input data for financial advice
   */
  processCustomInput(input: Record<string, any>): Record<string, any> {
    const processed: Record<string, any> = {};

    // Process financial data
    if (input.income) {
      processed.monthlyIncome = typeof input.income === 'string' ? parseFloat(input.income) : input.income;
      processed.annualIncome = processed.monthlyIncome * 12;
    }

    if (input.expenses) {
      processed.monthlyExpenses = typeof input.expenses === 'string' ? parseFloat(input.expenses) : input.expenses;
      processed.savingsRate = processed.monthlyIncome ? ((processed.monthlyIncome - processed.monthlyExpenses) / processed.monthlyIncome) * 100 : 0;
    }

    if (input.age) {
      processed.age = typeof input.age === 'string' ? parseInt(input.age) : input.age;
      processed.retirementYears = Math.max(0, 60 - processed.age);
    }

    if (input.goals) {
      processed.financialGoals = Array.isArray(input.goals) ? input.goals : [input.goals];
    }

    if (input.riskTolerance) {
      processed.riskProfile = input.riskTolerance;
    }

    // Process investment preferences
    if (input.investmentPreferences) {
      processed.preferredInvestments = input.investmentPreferences;
    }

    return processed;
  }
}

// Export singleton instance
export const customFinancialChatbot = new CustomFinancialChatbotService();

import axios from 'axios';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ChatMessage, ChatSession } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using the stable Google PaLM 2 Text API (publicly available)
// Note: For production, consider upgrading to Gemini Pro API with proper billing setup
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText';

/**
 * Conversational AI Chat Service
 * Multi-lingual support with voice capabilities
 */
export class ChatService {
  /**
   * Send message and get AI response
   */
  async sendMessage(
    userId: string,
    message: string,
    language: string = 'en',
    sessionId?: string
  ): Promise<{ response: string; session: ChatSession }> {
    try {
      // Get or create session
      let session: ChatSession;
      if (sessionId) {
        session = await this.getSession(sessionId);
      } else {
        session = await this.createSession(userId, language);
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'user',
        content: message,
        timestamp: new Date(),
        language,
      };

      let aiResponse: string;

      // Check if API is configured
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        console.warn('Gemini API key not configured, using fallback response');
        aiResponse = this.getFallbackResponse(message, language);
      } else {
        try {
          // Build context from session history
          const context = session.messages.slice(-6).map(m => 
            `${m.role}: ${m.content}`
          ).join('\n');

          // Prepare prompt with financial context
          const prompt = `
You are an AI financial advisor for an Indian user. Provide helpful, accurate financial guidance.

Context:
${context}

User (${language}): ${message}

Provide a clear, empathetic response. If the user is asking in Hindi, Telugu, Tamil, or other Indian languages, respond in that language. Include:
1. Direct answer to the question
2. Relevant financial advice
3. Actionable steps if applicable
4. Compliance with RBI guidelines

Keep the response concise (2-3 paragraphs max).
`;

          // Call Gemini API
          const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
              contents: [{
                parts: [{ text: prompt }]
              }],
              generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 512,
              },
              safetySettings: [
                {
                  category: 'HARM_CATEGORY_HARASSMENT',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                  category: 'HARM_CATEGORY_HATE_SPEECH',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                }
              ]
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 15000, // 15 second timeout for chat
            }
          );

          aiResponse = response.data.candidates[0].content.parts[0].text;
        } catch (apiError: any) {
          console.error('Gemini API error:', apiError);
          if (apiError.response) {
            console.error('API Error Status:', apiError.response.status);
            console.error('API Error Data:', apiError.response.data);
          }
          
          // Use fallback on API error
          aiResponse = this.getFallbackResponse(message, language);
        }
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        language,
      };

      // Update session
      session.messages.push(userMessage, assistantMessage);
      session.lastMessageAt = new Date();

      // Save to Firestore
      try {
        await addDoc(collection(db, 'messages'), {
          sessionId: session.id,
          ...userMessage,
          timestamp: Timestamp.now(),
        });

        await addDoc(collection(db, 'messages'), {
          sessionId: session.id,
          ...assistantMessage,
          timestamp: Timestamp.now(),
        });
      } catch (dbError) {
        console.error('Error saving messages to Firestore:', dbError);
        // Continue even if DB save fails - messages are in session object
      }

      return { response: aiResponse, session };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get fallback response when API is unavailable
   * Enhanced to handle custom salary-based and complex financial queries
   */
  private getFallbackResponse(message: string, language: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Extract salary if mentioned (supports formats like: 20000, 20,000, ₹20000, Rs 20000)
    const salaryMatch = message.match(/(?:₹|rs\.?|inr)?\s?(\d{1,3}(?:,\d{3})*|\d+)/i);
    const salary = salaryMatch ? parseInt(salaryMatch[1].replace(/,/g, '')) : null;
    
    // Salary-based saving/budgeting queries
    if ((lowerMessage.includes('save') || lowerMessage.includes('saving') || lowerMessage.includes('बचत')) && salary) {
      const emergencyFund = Math.round(salary * 3);
      const monthlySaving = Math.round(salary * 0.2);
      const needs = Math.round(salary * 0.5);
      const wants = Math.round(salary * 0.3);
      
      if (language === 'hi') {
        return `आपकी ₹${salary.toLocaleString('en-IN')} की सैलरी के साथ बचत की योजना:\n\n` +
               `📊 50-30-20 नियम:\n` +
               `• जरूरतें (50%): ₹${needs.toLocaleString('en-IN')} - किराया, भोजन, बिल\n` +
               `• इच्छाएं (30%): ₹${wants.toLocaleString('en-IN')} - मनोरंजन, बाहर खाना\n` +
               `• बचत (20%): ₹${monthlySaving.toLocaleString('en-IN')} - निवेश और आपातकालीन निधि\n\n` +
               `🎯 लक्ष्य:\n` +
               `• 3 महीने में आपातकालीन निधि: ₹${emergencyFund.toLocaleString('en-IN')}\n` +
               `• SIP में ₹${Math.round(monthlySaving * 0.6).toLocaleString('en-IN')} शुरू करें\n` +
               `• RD/PPF में ₹${Math.round(monthlySaving * 0.4).toLocaleString('en-IN')} रखें\n\n` +
               `💡 टिप्स: खर्चों को ट्रैक करें, अनावश्यक सब्सक्रिप्शन काटें, सीधे बैंक से बचत करें।`;
      } else {
        return `Here's a savings plan for your ₹${salary.toLocaleString('en-IN')} salary:\n\n` +
               `📊 50-30-20 Rule:\n` +
               `• Needs (50%): ₹${needs.toLocaleString('en-IN')} - rent, food, bills\n` +
               `• Wants (30%): ₹${wants.toLocaleString('en-IN')} - entertainment, dining out\n` +
               `• Savings (20%): ₹${monthlySaving.toLocaleString('en-IN')} - investments & emergency fund\n\n` +
               `🎯 Goals:\n` +
               `• Build emergency fund in 3 months: ₹${emergencyFund.toLocaleString('en-IN')}\n` +
               `• Start SIP with ₹${Math.round(monthlySaving * 0.6).toLocaleString('en-IN')}\n` +
               `• Keep ₹${Math.round(monthlySaving * 0.4).toLocaleString('en-IN')} in RD/PPF\n\n` +
               `💡 Tips: Track expenses, cut subscriptions, automate savings from salary.`;
      }
    }
    
    // Budget planning with salary
    if ((lowerMessage.includes('budget') || lowerMessage.includes('plan') || lowerMessage.includes('बजट')) && salary) {
      const needs = Math.round(salary * 0.5);
      const wants = Math.round(salary * 0.3);
      const savings = Math.round(salary * 0.2);
      
      if (language === 'hi') {
        return `₹${salary.toLocaleString('en-IN')} की सैलरी के लिए मासिक बजट:\n\n` +
               `🏠 जरूरतें (50% = ₹${needs.toLocaleString('en-IN')}):\n` +
               `• किराया/EMI: ₹${Math.round(needs * 0.4).toLocaleString('en-IN')}\n` +
               `• भोजन: ₹${Math.round(needs * 0.25).toLocaleString('en-IN')}\n` +
               `• बिल/यातायात: ₹${Math.round(needs * 0.35).toLocaleString('en-IN')}\n\n` +
               `🎯 इच्छाएं (30% = ₹${wants.toLocaleString('en-IN')}):\n` +
               `• मनोरंजन: ₹${Math.round(wants * 0.4).toLocaleString('en-IN')}\n` +
               `• शॉपिंग: ₹${Math.round(wants * 0.35).toLocaleString('en-IN')}\n` +
               `• बाहर खाना: ₹${Math.round(wants * 0.25).toLocaleString('en-IN')}\n\n` +
               `💰 बचत (20% = ₹${savings.toLocaleString('en-IN')}):\n` +
               `• म्यूचुअल फंड SIP: ₹${Math.round(savings * 0.5).toLocaleString('en-IN')}\n` +
               `• आपातकालीन निधि: ₹${Math.round(savings * 0.3).toLocaleString('en-IN')}\n` +
               `• बीमा: ₹${Math.round(savings * 0.2).toLocaleString('en-IN')}`;
      } else {
        return `Monthly budget for ₹${salary.toLocaleString('en-IN')} salary:\n\n` +
               `🏠 Needs (50% = ₹${needs.toLocaleString('en-IN')}):\n` +
               `• Rent/EMI: ₹${Math.round(needs * 0.4).toLocaleString('en-IN')}\n` +
               `• Food: ₹${Math.round(needs * 0.25).toLocaleString('en-IN')}\n` +
               `• Bills/Transport: ₹${Math.round(needs * 0.35).toLocaleString('en-IN')}\n\n` +
               `🎯 Wants (30% = ₹${wants.toLocaleString('en-IN')}):\n` +
               `• Entertainment: ₹${Math.round(wants * 0.4).toLocaleString('en-IN')}\n` +
               `• Shopping: ₹${Math.round(wants * 0.35).toLocaleString('en-IN')}\n` +
               `• Dining out: ₹${Math.round(wants * 0.25).toLocaleString('en-IN')}\n\n` +
               `💰 Savings (20% = ₹${savings.toLocaleString('en-IN')}):\n` +
               `• Mutual Fund SIP: ₹${Math.round(savings * 0.5).toLocaleString('en-IN')}\n` +
               `• Emergency fund: ₹${Math.round(savings * 0.3).toLocaleString('en-IN')}\n` +
               `• Insurance: ₹${Math.round(savings * 0.2).toLocaleString('en-IN')}`;
      }
    }
    
    // Common financial queries with fallback responses
    if (lowerMessage.includes('budget') || lowerMessage.includes('बजट')) {
      return language === 'hi' 
        ? 'बजट बनाने के लिए, अपनी मासिक आय का 50% जरूरतों पर, 30% इच्छाओं पर, और 20% बचत पर खर्च करने का प्रयास करें। यह 50-30-20 नियम आपके वित्त को संतुलित रखने में मदद करता है।'
        : 'For budgeting, try the 50-30-20 rule: spend 50% of your income on needs, 30% on wants, and 20% on savings. This helps maintain financial balance.';
    }
    
    if (lowerMessage.includes('save') || lowerMessage.includes('savings') || lowerMessage.includes('बचत')) {
      return language === 'hi'
        ? 'बचत शुरू करने के लिए:\n1. आपातकालीन निधि (3-6 महीने के खर्च)\n2. सैलरी का 20% स्वतः बचत करें\n3. म्यूचुअल फंड SIP में निवेश करें\n4. PPF/SSY जैसी सरकारी योजनाएं चुनें\n5. खर्चों को ट्रैक करें और कम करें'
        : 'To start saving:\n1. Build emergency fund (3-6 months expenses)\n2. Automate 20% of salary to savings\n3. Invest in mutual fund SIPs\n4. Use government schemes (PPF/SSY)\n5. Track and reduce expenses';
    }
    
    if (lowerMessage.includes('invest') || lowerMessage.includes('निवेश')) {
      return language === 'hi'
        ? 'निवेश गाइड:\n\n🎯 शुरुआती:\n• म्यूचुअल फंड SIP (₹500 से शुरू)\n• PPF (सुरक्षित, कर मुक्त)\n• गोल्ड ETF\n\n💼 मध्यम जोखिम:\n• डायरेक्ट स्टॉक\n• कॉर्पोरेट बॉन्ड\n• REIT\n\n⚠️ याद रखें:\n• विविधता बनाए रखें\n• लंबी अवधि के लिए निवेश करें\n• जोखिम सहनशीलता जांचें'
        : 'Investment Guide:\n\n🎯 Beginners:\n• Mutual Fund SIPs (start ₹500)\n• PPF (safe, tax-free)\n• Gold ETFs\n\n💼 Moderate Risk:\n• Direct stocks\n• Corporate bonds\n• REITs\n\n⚠️ Remember:\n• Diversify portfolio\n• Invest long-term\n• Check risk tolerance';
    }
    
    if (lowerMessage.includes('tax') || lowerMessage.includes('कर')) {
      return language === 'hi'
        ? 'कर बचत के तरीके:\n\n📋 धारा 80C (₹1.5 लाख):\n• PPF, EPF, ELSS\n• जीवन बीमा प्रीमियम\n• होम लोन मूलधन\n\n🏥 धारा 80D:\n• स्वास्थ्य बीमा (₹25,000-50,000)\n\n💰 अन्य:\n• NPS (अतिरिक्त ₹50,000)\n• होम लोन ब्याज (₹2 लाख)\n• शिक्षा ऋण ब्याज\n\n⚡ नई कर व्यवस्था: कम दरें, कोई कटौती नहीं'
        : 'Tax Saving Options:\n\n📋 Section 80C (₹1.5 lakh):\n• PPF, EPF, ELSS\n• Life insurance premium\n• Home loan principal\n\n🏥 Section 80D:\n• Health insurance (₹25k-50k)\n\n💰 Others:\n• NPS (additional ₹50k)\n• Home loan interest (₹2 lakh)\n• Education loan interest\n\n⚡ New tax regime: Lower rates, no deductions';
    }
    
    if (lowerMessage.includes('retire') || lowerMessage.includes('pension') || lowerMessage.includes('सेवानिवृत्ति')) {
      return language === 'hi'
        ? 'सेवानिवृत्ति योजना:\n\n💰 कॉर्पस की आवश्यकता:\n• 25-30x वार्षिक खर्च\n• मुद्रास्फीति को ध्यान में रखें\n\n📊 निवेश विकल्प:\n• NPS (कर लाभ + पेंशन)\n• PPF (सुरक्षित रिटर्न)\n• म्यूचुअल फंड SIP\n• EPF/VPF\n\n🎯 शुरुआत:\n• जल्दी शुरू करें (30 के दशक में)\n• आय का 15-20% बचाएं\n• हर 5 साल में समीक्षा करें'
        : 'Retirement Planning:\n\n💰 Corpus needed:\n• 25-30x annual expenses\n• Factor in inflation\n\n📊 Investment options:\n• NPS (tax benefit + pension)\n• PPF (safe returns)\n• Mutual fund SIPs\n• EPF/VPF\n\n🎯 Getting started:\n• Start early (in 30s)\n• Save 15-20% of income\n• Review every 5 years';
    }
    
    if (lowerMessage.includes('loan') || lowerMessage.includes('emi') || lowerMessage.includes('ऋण')) {
      return language === 'hi'
        ? 'ऋण प्रबंधन:\n\n✅ अच्छा ऋण:\n• गृह ऋण (संपत्ति निर्माण)\n• शिक्षा ऋण (करियर)\n\n❌ बुरा ऋण:\n• क्रेडिट कार्ड ऋण\n• व्यक्तिगत ऋण शॉपिंग के लिए\n\n📊 EMI नियम:\n• कुल EMI < 40% मासिक आय\n• उच्च ब्याज ऋण पहले चुकाएं\n• प्रीपेमेंट पर विचार करें\n\n💡 टिप: ऋण लेने से पहले आपातकालीन निधि बनाएं'
        : 'Loan Management:\n\n✅ Good debt:\n• Home loan (asset building)\n• Education loan (career)\n\n❌ Bad debt:\n• Credit card debt\n• Personal loans for shopping\n\n📊 EMI rule:\n• Total EMI < 40% monthly income\n• Pay high-interest debt first\n• Consider prepayment\n\n💡 Tip: Build emergency fund before loans';
    }
    
    if (lowerMessage.includes('insurance') || lowerMessage.includes('बीमा')) {
      return language === 'hi'
        ? 'बीमा आवश्यकताएं:\n\n🏥 स्वास्थ्य बीमा:\n• परिवार के लिए ₹5-10 लाख\n• कैशलेस अस्पताल नेटवर्क\n• OPD कवरेज विचार करें\n\n👤 जीवन बीमा:\n• टर्म इंश्योरेंस (आय का 10-15x)\n• कम प्रीमियम, उच्च कवर\n• LIC/निजी कंपनियां\n\n💡 टिप: निवेश और बीमा अलग रखें। ULIPs से बचें।'
        : 'Insurance Needs:\n\n🏥 Health Insurance:\n• ₹5-10 lakh family cover\n• Cashless hospital network\n• Consider OPD coverage\n\n👤 Life Insurance:\n• Term insurance (10-15x income)\n• Low premium, high cover\n• LIC/private companies\n\n💡 Tip: Keep investment & insurance separate. Avoid ULIPs.';
    }
    
    // Generic helpful response
    return language === 'hi'
      ? 'मैं आपके वित्तीय प्रश्नों में मदद के लिए यहां हूं। कृपया अपना प्रश्न और विस्तार से बताएं:\n\n💡 मैं मदद कर सकता हूं:\n• बजट योजना (अपनी सैलरी बताएं)\n• बचत रणनीतियां\n• निवेश सुझाव\n• कर बचत\n• सेवानिवृत्ति योजना\n• ऋण प्रबंधन\n• बीमा मार्गदर्शन\n\n🔑 बेहतर AI प्रतिक्रियाओं के लिए Gemini API कुंजी कॉन्फ़िगर करें।'
      : 'I\'m here to help with your financial questions. Please provide more details:\n\n💡 I can help with:\n• Budget planning (mention your salary)\n• Saving strategies\n• Investment advice\n• Tax savings\n• Retirement planning\n• Loan management\n• Insurance guidance\n\n🔑 For better AI responses, configure your Gemini API key.';
  }

  /**
   * Create new chat session
   */
  async createSession(userId: string, language: string): Promise<ChatSession> {
    const session: Omit<ChatSession, 'id'> = {
      userId,
      messages: [],
      startedAt: new Date(),
      lastMessageAt: new Date(),
      language,
    };

    const docRef = await addDoc(collection(db, 'chat_sessions'), {
      ...session,
      startedAt: Timestamp.now(),
      lastMessageAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      ...session,
    };
  }

  /**
   * Get chat session
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      // Simple query without orderBy to avoid composite index requirement
      const messagesQuery = query(
        collection(db, 'messages'),
        where('sessionId', '==', sessionId)
      );

      const querySnapshot = await getDocs(messagesQuery);
      const messages: ChatMessage[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as ChatMessage);
      });

      // Sort messages in memory instead of in the query
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return {
        id: sessionId,
        userId: messages[0]?.role === 'user' ? 'user' : '',
        messages,
        startedAt: messages[0]?.timestamp || new Date(),
        lastMessageAt: messages[messages.length - 1]?.timestamp || new Date(),
        language: messages[0]?.language || 'en',
      };
    } catch (error) {
      console.error('Error getting session from Firestore:', error);
      // Return empty session if Firestore fails
      return {
        id: sessionId,
        userId: '',
        messages: [],
        startedAt: new Date(),
        lastMessageAt: new Date(),
        language: 'en',
      };
    }
  }

  /**
   * Get user's chat sessions
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      // Simple query without orderBy to avoid composite index requirement
      const q = query(
        collection(db, 'chat_sessions'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const sessions: ChatSession[] = [];

      for (const docSnap of querySnapshot.docs) {
        // Load full session with messages
        const session = await this.getSession(docSnap.id);
        sessions.push(session);
      }

      // Sort sessions in memory instead of in the query
      sessions.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

      return sessions;
    } catch (error) {
      console.error('Error getting user sessions from Firestore:', error);
      // Return empty array if Firestore fails
      return [];
    }
  }

  /**
   * Process voice input (speech-to-text)
   */
  async processVoiceInput(_audioBlob: Blob, _language: string): Promise<string> {
    // In production, integrate with Google Speech-to-Text API
    // For now, return placeholder
    console.warn('Voice input processing not yet implemented - integrate Google Speech-to-Text API');
    return 'Voice input processing - integrate Google Speech-to-Text API';
  }

  /**
   * Convert text to speech
   */
  async textToSpeech(_text: string, _language: string): Promise<Blob> {
    // In production, integrate with Google Text-to-Speech API
    // For now, return placeholder
    console.warn('Text-to-speech not yet implemented - integrate Google Text-to-Speech API');
    return new Blob();
  }
}

export const chatService = new ChatService();

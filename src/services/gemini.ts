import axios from 'axios';
import type { FinancialHealthScore, Recommendation } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using the stable Google PaLM 2 Text API (publicly available)
// Note: For production, consider upgrading to Gemini Pro API with proper billing setup
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText';

/**
 * Gemini AI Service for financial insights, scoring, and recommendations
 */
export class GeminiService {
  /**
   * Calculate Financial Health Score using AI
   */
  async calculateFinancialHealthScore(
    income: number,
    expenses: number,
    savings: number,
    investments: number,
    debt: number,
    insurance: number,
    emergencyFund: number
  ): Promise<FinancialHealthScore> {
    try {
      // Validate API key
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        console.warn('Gemini API key not configured, using fallback calculation');
        return this.calculateFallbackScore(income, expenses, savings, debt, emergencyFund);
      }

      const prompt = `
You are a financial advisor AI. Analyze the following financial data and calculate a comprehensive financial health score (0-100):

Monthly Income: ₹${income}
Monthly Expenses: ₹${expenses}
Monthly Savings: ₹${savings}
Total Investments: ₹${investments}
Total Debt: ₹${debt}
Insurance Coverage: ₹${insurance}
Emergency Fund: ₹${emergencyFund}

Provide a JSON response with:
1. overallScore (0-100)
2. components: incomeStability, debtToIncome, savingsRate, investmentDiversity, insuranceAdequacy, emergencyFund (each 0-100)
3. strengths: array of strings
4. weaknesses: array of strings
5. recommendations: array of {title, description, category, priority, potentialImpact, explanation}

Follow RBI guidelines and Indian financial best practices.
`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: {
            text: prompt
          },
          temperature: 0.7,
          maxOutputTokens: 2048,
          topK: 40,
          topP: 0.95,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      // Parse AI response (PaLM 2 format)
      const resultText = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text || '';
      if (!resultText) {
        throw new Error('Empty response from API');
      }
      
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!result) {
        throw new Error('Failed to parse AI response');
      }

      return {
        overallScore: result.overallScore,
        components: result.components,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        recommendations: result.recommendations.map((rec: any) => ({
          ...rec,
          id: Math.random().toString(36).substr(2, 9),
          actionable: true,
        })),
        lastCalculated: new Date(),
      };
    } catch (error: any) {
      console.error('Error calculating financial health score:', error);
      
      // Log specific error details
      if (error.response) {
        console.error('API Error Status:', error.response.status);
        console.error('API Error Data:', error.response.data);
      }
      
      // Always fall back to local calculation
      console.log('Using fallback calculation method');
      return this.calculateFallbackScore(income, expenses, savings, debt, emergencyFund);
    }
  }

  /**
   * Fallback calculation if AI fails
   */
  private calculateFallbackScore(
    income: number,
    expenses: number,
    savings: number,
    debt: number,
    emergencyFund: number
  ): FinancialHealthScore {
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const debtToIncome = income > 0 ? (debt / (income * 12)) * 100 : 0;
    const emergencyMonths = expenses > 0 ? emergencyFund / expenses : 0;

    const components = {
      incomeStability: 75,
      debtToIncome: Math.max(0, 100 - debtToIncome),
      savingsRate: Math.min(100, savingsRate * 5),
      investmentDiversity: 50,
      insuranceAdequacy: 50,
      emergencyFund: Math.min(100, (emergencyMonths / 6) * 100),
    };

    const overallScore = Object.values(components).reduce((a, b) => a + b, 0) / 6;

    return {
      overallScore: Math.round(overallScore),
      components,
      strengths: savingsRate > 20 ? ['Good savings rate'] : [],
      weaknesses: debtToIncome > 40 ? ['High debt to income ratio'] : [],
      recommendations: [],
      lastCalculated: new Date(),
    };
  }

  /**
   * Generate personalized insights
   */
  async generateInsights(
    transactions: any[],
    accounts: any[]
  ): Promise<Recommendation[]> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        console.warn('Gemini API key not configured, returning sample insights');
        return this.getFallbackInsights();
      }

      const prompt = `
Analyze these financial transactions and provide personalized insights:

Recent Transactions: ${JSON.stringify(transactions.slice(0, 10))}
Accounts: ${JSON.stringify(accounts)}

Identify:
1. Spending patterns
2. Saving opportunities
3. Tax optimization possibilities
4. Risk areas
5. Investment suggestions

Return JSON array of insights with: title, description, category, priority, potentialImpact, explanation
`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: {
            text: prompt
          },
          temperature: 0.8,
          maxOutputTokens: 1024,
          topK: 40,
          topP: 0.95,
        },
        {
          timeout: 10000,
        }
      );

      const resultText = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text || '';
      if (!resultText) {
        console.warn('Empty AI response, using fallback');
        return this.getFallbackInsights();
      }
      
      const jsonMatch = resultText.match(/\[[\s\S]*\]/);
      const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      return insights.map((insight: any) => ({
        ...insight,
        id: Math.random().toString(36).substr(2, 9),
        actionable: true,
      }));
    } catch (error: any) {
      console.error('Error generating insights:', error);
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      }
      return this.getFallbackInsights();
    }
  }

  /**
   * Get fallback insights when API is unavailable
   */
  private getFallbackInsights(): Recommendation[] {
    return [
      {
        id: '1',
        title: 'Review Monthly Subscriptions',
        description: 'Analyze recurring payments to identify unused subscriptions',
        category: 'savings',
        priority: 'medium',
        potentialImpact: 1500,
        explanation: 'Many users have forgotten subscriptions that auto-renew. Potential savings: ₹500-2000/month',
        actionable: true,
      },
      {
        id: '2',
        title: 'Build Emergency Fund',
        description: 'Aim for 6 months of expenses in liquid savings',
        category: 'savings',
        priority: 'high',
        potentialImpact: 50000,
        explanation: 'Emergency funds provide a safety net for unexpected expenses and financial security',
        actionable: true,
      },
    ];
  }

  /**
   * Get explanation for a recommendation
   */
  async explainRecommendation(recommendation: Recommendation): Promise<string> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        return recommendation.explanation || 'Enable Gemini API for detailed explanations';
      }

      const prompt = `
Explain this financial recommendation in simple terms that anyone can understand:

Title: ${recommendation.title}
Description: ${recommendation.description}
Category: ${recommendation.category}

Provide a clear, empathetic explanation with:
1. Why this matters
2. How it helps
3. Step-by-step action plan
4. Potential risks/benefits
`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: {
            text: prompt
          },
          temperature: 0.7,
          maxOutputTokens: 512,
          topK: 40,
          topP: 0.95,
        },
        {
          timeout: 8000,
        }
      );

      const resultText = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text || '';
      return resultText || recommendation.explanation;
    } catch (error: any) {
      console.error('Error explaining recommendation:', error);
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      }
      return recommendation.explanation;
    }
  }

  /**
   * Translate text to specified language
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        return text; // Return original text if API not configured
      }

      const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: {
            text: prompt
          },
          temperature: 0.3,
          maxOutputTokens: 256,
          topK: 40,
          topP: 0.95,
        },
        {
          timeout: 8000,
        }
      );

      const resultText = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text || '';
      return resultText || text;
    } catch (error: any) {
      console.error('Error translating text:', error);
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      }
      return text;
    }
  }

  /**
   * Analyze retirement scenario
   */
  async analyzeScenario(scenarioData: any): Promise<any> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        return { 
          riskFactors: ['Configure Gemini API for AI-powered analysis'], 
          recommendations: ['Set up your API key in environment variables'] 
        };
      }

      const prompt = `
Analyze this retirement planning scenario:

Current Situation:
- Age: ${scenarioData.params.currentAge}
- Retirement Age: ${scenarioData.params.retirementAge}
- Current Savings: ₹${scenarioData.params.currentSavings}
- Monthly Income: ₹${scenarioData.params.monthlyIncome}
- Monthly Savings: ₹${scenarioData.params.monthlySavings}

Simulation Results:
- Success Probability: ${scenarioData.successProbability}%
- Median Net Worth: ₹${scenarioData.median}
- Best Case: ₹${scenarioData.bestCase}
- Worst Case: ₹${scenarioData.worstCase}

Provide JSON response with:
1. riskFactors: array of key risks
2. recommendations: array of actionable suggestions
`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: {
            text: prompt
          },
          temperature: 0.7,
          maxOutputTokens: 1024,
          topK: 40,
          topP: 0.95,
        },
        {
          timeout: 10000,
        }
      );

      const resultText = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text || '';
      if (!resultText) {
        return { riskFactors: [], recommendations: [] };
      }
      
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { riskFactors: [], recommendations: [] };
    } catch (error: any) {
      console.error('Error analyzing scenario:', error);
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      }
      return { riskFactors: [], recommendations: [] };
    }
  }

  /**
   * Detect behavioral spending patterns
   */
  async detectBehavioralPatterns(transactions: any[]): Promise<any> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        return { 
          patterns: [], 
          nudges: [{ type: 'info', message: 'Configure Gemini API for behavioral insights', messageHindi: 'व्यवहार अंतर्दृष्टि के लिए Gemini API कॉन्फ़िगर करें' }], 
          insights: [] 
        };
      }

      const prompt = `
Analyze these transactions for behavioral patterns like impulse buying, FOMO, panic selling, etc:

Transactions: ${JSON.stringify(transactions.slice(0, 50))}

Identify:
1. patterns: array of {type, frequency, averageAmount, triggers, severity, description}
2. nudges: array of {type, message, messageHindi}
3. insights: array of key behavioral insights

Return as JSON.
`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: {
            text: prompt
          },
          temperature: 0.8,
          maxOutputTokens: 1024,
          topK: 40,
          topP: 0.95,
        },
        {
          timeout: 10000,
        }
      );

      const resultText = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text || '';
      if (!resultText) {
        return { patterns: [], nudges: [], insights: [] };
      }
      
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { patterns: [], nudges: [], insights: [] };
    } catch (error: any) {
      console.error('Error detecting behavioral patterns:', error);
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      }
      return { patterns: [], nudges: [], insights: [] };
    }
  }

  /**
   * General purpose chat/completion method
   */
  async chat(message: string, context: Record<string, any> = {}): Promise<string> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        return 'Gemini API not configured. Please add your API key to use AI features.';
      }

      const prompt = `${message}\n\nContext: ${JSON.stringify(context)}`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: {
            text: prompt
          },
          temperature: 0.7,
          maxOutputTokens: 1024,
          topK: 40,
          topP: 0.95,
        },
        {
          timeout: 10000,
        }
      );

      const resultText = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text || '';
      return resultText || 'No response from AI';
    } catch (error: any) {
      console.error('Error in chat:', error);
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      }
      return 'Error communicating with AI service';
    }
  }
}

export const geminiService = new GeminiService();

/**
 * AI-Powered Investment Portfolio Service
 * Provides stock recommendations, market analysis, and automated investment execution
 */

import axios from 'axios';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserFinancialProfile } from './userProfileService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText';

// Mock market data - In production, integrate with NSE/BSE API or financial data providers
// const MARKET_DATA_API = 'https://api.example.com/stocks'; // Replace with real API

export interface StockRecommendation {
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  targetPrice: number;
  potentialReturn: number; // Percentage
  riskLevel: 'Low' | 'Medium' | 'High';
  investmentHorizon: '1 Year' | '3 Years' | '5+ Years';
  aiRating: number; // 1-10
  aiAnalysis: string;
  technicalIndicators: {
    rsi: number; // Relative Strength Index
    movingAverage: 'Bullish' | 'Bearish' | 'Neutral';
    volumeTrend: 'Increasing' | 'Decreasing' | 'Stable';
  };
  fundamentals: {
    peRatio: number;
    marketCap: number;
    dividendYield: number;
    profitGrowth: number; // YoY %
  };
  recommendedAllocation: number; // Percentage of portfolio
  minimumInvestment: number;
  expectedReturns: {
    year1: number;
    year3: number;
    year5: number;
  };
  newsHeadlines: string[];
  lastUpdated: Date;
}

export interface MutualFundRecommendation {
  fundName: string;
  fundHouse: string;
  category: 'Equity' | 'Debt' | 'Hybrid' | 'ELSS' | 'Index';
  nav: number; // Net Asset Value
  returns: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
  };
  expenseRatio: number;
  minimumInvestment: number;
  taxBenefit: boolean; // ELSS funds
  riskLevel: 'Low' | 'Medium' | 'High';
  aiRating: number;
  aiAnalysis: string;
  recommendedSIP: number; // Monthly SIP amount
}

export interface PortfolioInvestment {
  id: string;
  userId: string;
  type: 'Stock' | 'Mutual Fund' | 'ETF' | 'Bond';
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  investmentAmount: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  purchaseDate: Date;
  lastUpdated: Date;
  autoTrackingEnabled: boolean;
  alerts: InvestmentAlert[];
  status: 'Active' | 'Sold' | 'Under Review';
}

export interface InvestmentAlert {
  id: string;
  timestamp: Date;
  type: 'Price Alert' | 'Target Reached' | 'Stop Loss' | 'News Alert';
  message: string;
  actionRecommended: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface BankPaymentRequest {
  requestId: string;
  userId: string;
  investmentType: string;
  symbol: string;
  amount: number;
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  paymentGateway: 'UPI' | 'Net Banking' | 'Debit Card';
  status: 'Pending Authorization' | 'Authorized' | 'Processing' | 'Completed' | 'Failed';
  permissionGranted: boolean;
  timestamp: Date;
  notification: {
    title: string;
    message: string;
    requiresAction: boolean;
  };
}

export interface AIInvestmentStrategy {
  strategyName: string;
  totalInvestmentAmount: number;
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  assetAllocation: {
    stocks: number; // Percentage
    mutualFunds: number;
    bonds: number;
    cash: number;
  };
  recommendedStocks: StockRecommendation[];
  recommendedMutualFunds: MutualFundRecommendation[];
  expectedPortfolioReturn: number; // Annual %
  expectedVolatility: number; // Standard deviation
  timeHorizon: string;
  rebalancingFrequency: 'Monthly' | 'Quarterly' | 'Yearly';
  aiInsights: string;
}

export class AIPortfolioService {
  /**
   * Get AI-powered stock recommendations based on user profile and investment amount
   */
  async getStockRecommendations(
    profile: UserFinancialProfile,
    investmentAmount: number,
    riskProfile: 'Conservative' | 'Moderate' | 'Aggressive' = 'Moderate'
  ): Promise<StockRecommendation[]> {
    try {
      // In production, fetch real-time market data from NSE/BSE API
      const marketData = await this.fetchMarketData();
      
      // Filter stocks based on risk profile and investment amount
      const filteredStocks = this.filterStocksByRiskProfile(marketData, riskProfile, investmentAmount);
      
      // Get AI analysis for each stock
      const recommendations: StockRecommendation[] = [];
      
      for (const stock of filteredStocks.slice(0, 10)) { // Top 10 recommendations
        const aiAnalysis = await this.getAIStockAnalysis(stock, profile, investmentAmount);
        recommendations.push({
          ...stock,
          aiAnalysis,
          lastUpdated: new Date(),
        });
      }

      // Sort by AI rating
      return recommendations.sort((a, b) => b.aiRating - a.aiRating);
    } catch (error) {
      console.error('Error getting stock recommendations:', error);
      return this.getFallbackStockRecommendations(investmentAmount, riskProfile);
    }
  }

  /**
   * Fetch real-time market data (mock implementation - integrate with real API)
   */
  private async fetchMarketData(): Promise<Partial<StockRecommendation>[]> {
    // In production, integrate with:
    // - NSE API: https://www.nseindia.com/api
    // - BSE API: https://api.bseindia.com
    // - Yahoo Finance API
    // - Alpha Vantage API
    
    // Mock data for demonstration
    return [
      {
        symbol: 'RELIANCE',
        companyName: 'Reliance Industries Ltd',
        sector: 'Energy & Petrochemicals',
        currentPrice: 2450,
        targetPrice: 2850,
        potentialReturn: 16.3,
        riskLevel: 'Low',
        investmentHorizon: '3 Years',
        aiRating: 9,
        technicalIndicators: {
          rsi: 58,
          movingAverage: 'Bullish',
          volumeTrend: 'Increasing',
        },
        fundamentals: {
          peRatio: 24.5,
          marketCap: 16500000000000, // ₹16.5 trillion
          dividendYield: 0.5,
          profitGrowth: 15.2,
        },
        recommendedAllocation: 20,
        minimumInvestment: 2450,
        expectedReturns: {
          year1: 12,
          year3: 45,
          year5: 85,
        },
        newsHeadlines: [
          'Reliance announces new energy ventures',
          'Strong Q3 results beat estimates',
        ],
      },
      {
        symbol: 'TCS',
        companyName: 'Tata Consultancy Services',
        sector: 'IT Services',
        currentPrice: 3650,
        targetPrice: 4200,
        potentialReturn: 15.1,
        riskLevel: 'Low',
        investmentHorizon: '3 Years',
        aiRating: 8.5,
        technicalIndicators: {
          rsi: 62,
          movingAverage: 'Bullish',
          volumeTrend: 'Stable',
        },
        fundamentals: {
          peRatio: 28.3,
          marketCap: 13400000000000,
          dividendYield: 1.2,
          profitGrowth: 12.8,
        },
        recommendedAllocation: 15,
        minimumInvestment: 3650,
        expectedReturns: {
          year1: 10,
          year3: 40,
          year5: 75,
        },
        newsHeadlines: [
          'TCS wins major contract from US client',
          'Dividend announced for shareholders',
        ],
      },
      {
        symbol: 'INFY',
        companyName: 'Infosys Ltd',
        sector: 'IT Services',
        currentPrice: 1580,
        targetPrice: 1850,
        potentialReturn: 17.1,
        riskLevel: 'Medium',
        investmentHorizon: '3 Years',
        aiRating: 8.2,
        technicalIndicators: {
          rsi: 55,
          movingAverage: 'Bullish',
          volumeTrend: 'Increasing',
        },
        fundamentals: {
          peRatio: 26.7,
          marketCap: 6500000000000,
          dividendYield: 2.1,
          profitGrowth: 14.5,
        },
        recommendedAllocation: 12,
        minimumInvestment: 1580,
        expectedReturns: {
          year1: 14,
          year3: 48,
          year5: 90,
        },
        newsHeadlines: [
          'Infosys focuses on AI and automation',
          'Strong deal pipeline reported',
        ],
      },
      {
        symbol: 'HDFCBANK',
        companyName: 'HDFC Bank Ltd',
        sector: 'Banking',
        currentPrice: 1650,
        targetPrice: 1950,
        potentialReturn: 18.2,
        riskLevel: 'Low',
        investmentHorizon: '5+ Years',
        aiRating: 9.2,
        technicalIndicators: {
          rsi: 60,
          movingAverage: 'Bullish',
          volumeTrend: 'Increasing',
        },
        fundamentals: {
          peRatio: 19.8,
          marketCap: 12200000000000,
          dividendYield: 1.0,
          profitGrowth: 18.3,
        },
        recommendedAllocation: 18,
        minimumInvestment: 1650,
        expectedReturns: {
          year1: 15,
          year3: 52,
          year5: 100,
        },
        newsHeadlines: [
          'HDFC Bank posts record quarterly profit',
          'Digital banking initiatives gaining traction',
        ],
      },
      {
        symbol: 'TATAMOTORS',
        companyName: 'Tata Motors Ltd',
        sector: 'Automobile',
        currentPrice: 750,
        targetPrice: 950,
        potentialReturn: 26.7,
        riskLevel: 'High',
        investmentHorizon: '3 Years',
        aiRating: 7.8,
        technicalIndicators: {
          rsi: 68,
          movingAverage: 'Bullish',
          volumeTrend: 'Increasing',
        },
        fundamentals: {
          peRatio: 15.2,
          marketCap: 2800000000000,
          dividendYield: 0.3,
          profitGrowth: 25.6,
        },
        recommendedAllocation: 10,
        minimumInvestment: 750,
        expectedReturns: {
          year1: 20,
          year3: 70,
          year5: 130,
        },
        newsHeadlines: [
          'Tata Motors EV sales surge',
          'Strong demand for new models',
        ],
      },
      {
        symbol: 'BHARTIARTL',
        companyName: 'Bharti Airtel Ltd',
        sector: 'Telecom',
        currentPrice: 1250,
        targetPrice: 1550,
        potentialReturn: 24.0,
        riskLevel: 'Medium',
        investmentHorizon: '3 Years',
        aiRating: 8.0,
        technicalIndicators: {
          rsi: 64,
          movingAverage: 'Bullish',
          volumeTrend: 'Stable',
        },
        fundamentals: {
          peRatio: 42.5,
          marketCap: 7100000000000,
          dividendYield: 0.6,
          profitGrowth: 22.1,
        },
        recommendedAllocation: 8,
        minimumInvestment: 1250,
        expectedReturns: {
          year1: 18,
          year3: 65,
          year5: 120,
        },
        newsHeadlines: [
          'Airtel 5G rollout accelerates',
          'ARPU growth continues',
        ],
      },
    ];
  }

  /**
   * Filter stocks by risk profile
   */
  private filterStocksByRiskProfile(
    stocks: Partial<StockRecommendation>[],
    riskProfile: string,
    investmentAmount: number
  ): StockRecommendation[] {
    return stocks
      .filter(stock => {
        // Filter by minimum investment
        if (stock.minimumInvestment && stock.minimumInvestment > investmentAmount) {
          return false;
        }

        // Filter by risk level
        if (riskProfile === 'Conservative' && stock.riskLevel === 'High') {
          return false;
        }
        if (riskProfile === 'Aggressive' && stock.riskLevel === 'Low') {
          return false; // Aggressive investors might skip low-risk stocks
        }

        return true;
      })
      .map(stock => stock as StockRecommendation);
  }

  /**
   * Get AI analysis for a specific stock
   */
  private async getAIStockAnalysis(
    stock: StockRecommendation,
    profile: UserFinancialProfile,
    investmentAmount: number
  ): Promise<string> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        return this.getFallbackStockAnalysis(stock, investmentAmount);
      }

      const prompt = `
You are an expert stock market analyst. Analyze this stock for an investor:

Stock: ${stock.companyName} (${stock.symbol})
Sector: ${stock.sector}
Current Price: ₹${stock.currentPrice}
Target Price: ₹${stock.targetPrice}
Potential Return: ${stock.potentialReturn}%

Technical Indicators:
- RSI: ${stock.technicalIndicators.rsi}
- Moving Average: ${stock.technicalIndicators.movingAverage}
- Volume Trend: ${stock.technicalIndicators.volumeTrend}

Fundamentals:
- P/E Ratio: ${stock.fundamentals.peRatio}
- Profit Growth: ${stock.fundamentals.profitGrowth}%
- Dividend Yield: ${stock.fundamentals.dividendYield}%

Investor Profile:
- Investment Amount: ₹${investmentAmount.toLocaleString()}
- Monthly Salary: ₹${profile.income.monthlySalary.toLocaleString()}
- Age: ${profile.personalInfo.age}

Provide a 2-sentence analysis: Why is this stock a good/bad investment for this investor?
`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: { text: prompt },
          temperature: 0.7,
          maxOutputTokens: 150,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      const output = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text;
      return output || this.getFallbackStockAnalysis(stock, investmentAmount);
    } catch (error) {
      console.error('Error getting AI stock analysis:', error);
      return this.getFallbackStockAnalysis(stock, investmentAmount);
    }
  }

  /**
   * Fallback stock analysis
   */
  private getFallbackStockAnalysis(stock: StockRecommendation, investmentAmount: number): string {
    const canAfford = investmentAmount >= stock.minimumInvestment;
    const affordabilityText = canAfford
      ? `You can afford ${Math.floor(investmentAmount / stock.currentPrice)} shares.`
      : `Minimum investment required: ₹${stock.minimumInvestment.toLocaleString()}.`;

    if (stock.aiRating >= 8.5) {
      return `✅ **Highly Recommended**: ${stock.companyName} is a market leader in ${stock.sector} with strong fundamentals (P/E: ${stock.fundamentals.peRatio}, Profit Growth: ${stock.fundamentals.profitGrowth}%). ${affordabilityText} Expected return: ${stock.potentialReturn}% upside to target of ₹${stock.targetPrice}.`;
    } else if (stock.aiRating >= 7.5) {
      return `✅ **Good Investment**: ${stock.companyName} shows solid growth potential with ${stock.potentialReturn}% upside. Technical indicators are ${stock.technicalIndicators.movingAverage.toLowerCase()}. ${affordabilityText} Suitable for ${stock.investmentHorizon} investment horizon.`;
    } else {
      return `⚠️ **Moderate Option**: ${stock.companyName} has potential but carries ${stock.riskLevel} risk. Current RSI of ${stock.technicalIndicators.rsi} suggests it's ${stock.technicalIndicators.rsi > 70 ? 'overbought' : stock.technicalIndicators.rsi < 30 ? 'oversold' : 'in neutral zone'}. ${affordabilityText}`;
    }
  }

  /**
   * Get fallback stock recommendations
   */
  private async getFallbackStockRecommendations(
    investmentAmount: number,
    riskProfile: string
  ): Promise<StockRecommendation[]> {
    try {
      const allStocks = await this.fetchMarketData();
      return this.filterStocksByRiskProfile(allStocks, riskProfile, investmentAmount)
        .map(stock => ({
          ...stock,
          aiAnalysis: this.getFallbackStockAnalysis(stock, investmentAmount),
          lastUpdated: new Date(),
        }));
    } catch (error) {
      console.error('Error getting fallback recommendations:', error);
      return [];
    }
  }

  /**
   * Get mutual fund recommendations
   */
  async getMutualFundRecommendations(
    investmentAmount: number,
    includeELSS: boolean = true
  ): Promise<MutualFundRecommendation[]> {
    // Mock mutual fund data - integrate with MF API in production
    const funds: MutualFundRecommendation[] = [
      {
        fundName: 'Axis Bluechip Fund',
        fundHouse: 'Axis Mutual Fund',
        category: 'Equity',
        nav: 48.50,
        returns: {
          oneYear: 18.5,
          threeYear: 24.2,
          fiveYear: 16.8,
        },
        expenseRatio: 0.54,
        minimumInvestment: 5000,
        taxBenefit: false,
        riskLevel: 'Medium',
        aiRating: 9.0,
        aiAnalysis: 'Consistent performer with strong portfolio management. Ideal for long-term wealth creation.',
        recommendedSIP: 5000,
      },
      {
        fundName: 'Mirae Asset Tax Saver Fund',
        fundHouse: 'Mirae Asset',
        category: 'ELSS',
        nav: 28.30,
        returns: {
          oneYear: 22.1,
          threeYear: 26.5,
          fiveYear: 18.3,
        },
        expenseRatio: 0.62,
        minimumInvestment: 500,
        taxBenefit: true,
        riskLevel: 'Medium',
        aiRating: 9.5,
        aiAnalysis: 'Best ELSS fund with tax savings + excellent returns. Only 3-year lock-in period.',
        recommendedSIP: 3000,
      },
      {
        fundName: 'HDFC Index Fund - Nifty 50',
        fundHouse: 'HDFC Mutual Fund',
        category: 'Index',
        nav: 156.80,
        returns: {
          oneYear: 15.2,
          threeYear: 18.7,
          fiveYear: 14.5,
        },
        expenseRatio: 0.20,
        minimumInvestment: 5000,
        taxBenefit: false,
        riskLevel: 'Medium',
        aiRating: 8.5,
        aiAnalysis: 'Low-cost index fund tracking Nifty 50. Perfect for passive investors seeking market returns.',
        recommendedSIP: 5000,
      },
    ];

    if (!includeELSS) {
      return funds.filter(f => f.category !== 'ELSS');
    }

    return funds.filter(f => f.minimumInvestment <= investmentAmount);
  }

  /**
   * Create a comprehensive AI investment strategy
   */
  async createAIInvestmentStrategy(
    profile: UserFinancialProfile,
    investmentAmount: number,
    riskProfile: 'Conservative' | 'Moderate' | 'Aggressive'
  ): Promise<AIInvestmentStrategy> {
    const stocks = await this.getStockRecommendations(profile, investmentAmount, riskProfile);
    const mutualFunds = await this.getMutualFundRecommendations(investmentAmount, true);

    // Asset allocation based on risk profile
    let assetAllocation: { stocks: number; mutualFunds: number; bonds: number; cash: number };
    if (riskProfile === 'Conservative') {
      assetAllocation = { stocks: 20, mutualFunds: 50, bonds: 20, cash: 10 };
    } else if (riskProfile === 'Moderate') {
      assetAllocation = { stocks: 40, mutualFunds: 40, bonds: 10, cash: 10 };
    } else {
      assetAllocation = { stocks: 60, mutualFunds: 30, bonds: 5, cash: 5 };
    }

    const expectedPortfolioReturn = this.calculateExpectedReturn(stocks, mutualFunds, assetAllocation);

    return {
      strategyName: `${riskProfile} AI Investment Strategy`,
      totalInvestmentAmount: investmentAmount,
      riskProfile,
      assetAllocation,
      recommendedStocks: stocks.slice(0, 5),
      recommendedMutualFunds: mutualFunds,
      expectedPortfolioReturn,
      expectedVolatility: riskProfile === 'Conservative' ? 8 : riskProfile === 'Moderate' ? 15 : 25,
      timeHorizon: riskProfile === 'Conservative' ? '5+ Years' : riskProfile === 'Moderate' ? '3-5 Years' : '1-3 Years',
      rebalancingFrequency: 'Quarterly',
      aiInsights: await this.getStrategyInsights(profile, investmentAmount, riskProfile),
    };
  }

  /**
   * Calculate expected portfolio return
   */
  private calculateExpectedReturn(
    stocks: StockRecommendation[],
    mutualFunds: MutualFundRecommendation[],
    allocation: { stocks: number; mutualFunds: number; bonds: number; cash: number }
  ): number {
    const avgStockReturn = stocks.reduce((sum, s) => sum + s.potentialReturn, 0) / stocks.length;
    const avgMFReturn = mutualFunds.reduce((sum, mf) => sum + mf.returns.threeYear, 0) / mutualFunds.length;

    return (avgStockReturn * allocation.stocks / 100) + (avgMFReturn * allocation.mutualFunds / 100);
  }

  /**
   * Get AI insights for investment strategy
   */
  private async getStrategyInsights(
    profile: UserFinancialProfile,
    investmentAmount: number,
    riskProfile: string
  ): Promise<string> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        return this.getFallbackStrategyInsights(profile, investmentAmount, riskProfile);
      }

      const prompt = `
You are a financial advisor creating an investment strategy.

Client Profile:
- Age: ${profile.personalInfo.age}
- Monthly Income: ₹${profile.income.monthlySalary.toLocaleString()}
- Investment Amount: ₹${investmentAmount.toLocaleString()}
- Risk Profile: ${riskProfile}

Provide a 3-sentence personalized investment strategy summary.
`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: { text: prompt },
          temperature: 0.7,
          maxOutputTokens: 200,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      const output = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text;
      return output || this.getFallbackStrategyInsights(profile, investmentAmount, riskProfile);
    } catch (error) {
      return this.getFallbackStrategyInsights(profile, investmentAmount, riskProfile);
    }
  }

  /**
   * Fallback strategy insights
   */
  private getFallbackStrategyInsights(
    profile: UserFinancialProfile,
    investmentAmount: number,
    riskProfile: string
  ): string {
    const monthsOfInvestment = Math.floor(investmentAmount / profile.income.monthlySalary);
    
    if (riskProfile === 'Conservative') {
      return `At age ${profile.personalInfo.age}, a conservative approach with ${monthsOfInvestment} months' salary (₹${investmentAmount.toLocaleString()}) is wise. Focus on 70% debt instruments (mutual funds, bonds) and 30% blue-chip stocks for stability with modest growth. Expected return: 10-12% annually with low volatility.`;
    } else if (riskProfile === 'Moderate') {
      return `With ₹${investmentAmount.toLocaleString()} to invest, a balanced 50-50 split between equity and debt provides optimal risk-reward. Your age of ${profile.personalInfo.age} allows for moderate risk-taking. Expected return: 14-16% annually with controlled volatility.`;
    } else {
      return `An aggressive strategy with ₹${investmentAmount.toLocaleString()} focuses 70% on high-growth stocks and 30% on equity mutual funds. At age ${profile.personalInfo.age}, you can tolerate short-term volatility for long-term wealth creation. Expected return: 18-22% annually.`;
    }
  }

  /**
   * Request bank payment authorization for investment
   */
  async requestBankPaymentAuthorization(
    userId: string,
    investment: {
      type: string;
      symbol: string;
      name: string;
      amount: number;
      quantity: number;
    },
    bankAccount: {
      accountNumber: string;
      ifscCode: string;
      bankName: string;
    },
    paymentGateway: 'UPI' | 'Net Banking' | 'Debit Card'
  ): Promise<BankPaymentRequest> {
    const paymentRequest: BankPaymentRequest = {
      requestId: `PAY${Date.now()}`,
      userId,
      investmentType: investment.type,
      symbol: investment.symbol,
      amount: investment.amount,
      bankAccount,
      paymentGateway,
      status: 'Pending Authorization',
      permissionGranted: false,
      timestamp: new Date(),
      notification: {
        title: '🔔 Investment Payment Authorization Required',
        message: `AI Agent wants to invest in ${investment.name}!\n\n` +
                 `Investment Details:\n` +
                 `- Type: ${investment.type}\n` +
                 `- Symbol: ${investment.symbol}\n` +
                 `- Quantity: ${investment.quantity}\n` +
                 `- Amount: ₹${investment.amount.toLocaleString()}\n\n` +
                 `Payment Method: ${paymentGateway}\n` +
                 `Bank: ${bankAccount.bankName}\n` +
                 `Account: ***${bankAccount.accountNumber.slice(-4)}\n\n` +
                 `⚠️ Please authorize this payment to proceed.`,
        requiresAction: true,
      },
    };

    // Save to Firestore
    try {
      await addDoc(collection(db, 'payment_requests'), {
        ...paymentRequest,
        timestamp: Timestamp.fromDate(paymentRequest.timestamp),
      });
    } catch (error) {
      console.error('Error saving payment request:', error);
      // Fallback to localStorage
      const requests = JSON.parse(localStorage.getItem('payment_requests') || '[]');
      requests.push(paymentRequest);
      localStorage.setItem('payment_requests', JSON.stringify(requests));
    }

    console.log('💳 Payment authorization request created:', paymentRequest.requestId);
    return paymentRequest;
  }

  /**
   * Authorize bank payment
   */
  async authorizePayment(requestId: string, password: string): Promise<{
    status: 'success' | 'error';
    message: string;
    transactionId?: string;
  }> {
    try {
      // Verify password (in production, use proper authentication)
      if (password.length < 6) {
        return {
          status: 'error',
          message: 'Invalid password',
        };
      }

      // Update payment request status
      const requests = JSON.parse(localStorage.getItem('payment_requests') || '[]');
      const requestIndex = requests.findIndex((r: BankPaymentRequest) => r.requestId === requestId);

      if (requestIndex === -1) {
        return {
          status: 'error',
          message: 'Payment request not found',
        };
      }

      requests[requestIndex].status = 'Authorized';
      requests[requestIndex].permissionGranted = true;
      localStorage.setItem('payment_requests', JSON.stringify(requests));

      const transactionId = `TXN${Date.now()}`;

      console.log('✅ Payment authorized:', requestId);
      console.log('💰 Processing investment...');

      // Simulate payment processing
      setTimeout(() => {
        requests[requestIndex].status = 'Completed';
        localStorage.setItem('payment_requests', JSON.stringify(requests));
        console.log('✅ Investment completed:', transactionId);
      }, 2000);

      return {
        status: 'success',
        message: `Payment authorized successfully!\n\nTransaction ID: ${transactionId}\n\nYour investment is being processed. You'll receive a confirmation shortly.`,
        transactionId,
      };
    } catch (error) {
      console.error('Error authorizing payment:', error);
      return {
        status: 'error',
        message: 'Failed to authorize payment. Please try again.',
      };
    }
  }

  /**
   * Get pending payment requests for user
   */
  async getPendingPaymentRequests(userId: string): Promise<BankPaymentRequest[]> {
    try {
      const q = query(
        collection(db, 'payment_requests'),
        where('userId', '==', userId),
        where('status', '==', 'Pending Authorization')
      );

      const snapshot = await getDocs(q);
      const requests: BankPaymentRequest[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        requests.push({
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as BankPaymentRequest);
      });

      return requests;
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      
      // Fallback to localStorage
      const requests = JSON.parse(localStorage.getItem('payment_requests') || '[]');
      return requests.filter(
        (r: BankPaymentRequest) => r.userId === userId && r.status === 'Pending Authorization'
      );
    }
  }

  /**
   * Add investment to user's portfolio (after payment is authorized)
   */
  async addToPortfolio(
    userId: string,
    investment: {
      type: 'Stock' | 'Mutual Fund' | 'ETF' | 'Bond';
      symbol: string;
      name: string;
      quantity: number;
      purchasePrice: number;
    }
  ): Promise<PortfolioInvestment> {
    const portfolioInvestment: PortfolioInvestment = {
      id: `INV${Date.now()}`,
      userId,
      type: investment.type,
      symbol: investment.symbol,
      name: investment.name,
      quantity: investment.quantity,
      purchasePrice: investment.purchasePrice,
      currentPrice: investment.purchasePrice, // Initially same as purchase price
      investmentAmount: investment.quantity * investment.purchasePrice,
      currentValue: investment.quantity * investment.purchasePrice,
      profitLoss: 0,
      profitLossPercent: 0,
      purchaseDate: new Date(),
      lastUpdated: new Date(),
      autoTrackingEnabled: true,
      alerts: [],
      status: 'Active',
    };

    // Save to Firestore
    try {
      await addDoc(collection(db, 'portfolio_investments'), {
        ...portfolioInvestment,
        purchaseDate: Timestamp.fromDate(portfolioInvestment.purchaseDate),
        lastUpdated: Timestamp.fromDate(portfolioInvestment.lastUpdated),
      });
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      // Fallback to localStorage
      const portfolio = JSON.parse(localStorage.getItem(`portfolio_${userId}`) || '[]');
      portfolio.push(portfolioInvestment);
      localStorage.setItem(`portfolio_${userId}`, JSON.stringify(portfolio));
    }

    console.log('✅ Investment added to portfolio:', portfolioInvestment.id);
    return portfolioInvestment;
  }

  /**
   * Get user's portfolio
   */
  async getPortfolio(userId: string): Promise<PortfolioInvestment[]> {
    try {
      const q = query(
        collection(db, 'portfolio_investments'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const portfolio: PortfolioInvestment[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        portfolio.push({
          id: doc.id,
          ...data,
          purchaseDate: data.purchaseDate?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          alerts: data.alerts?.map((alert: any) => ({
            ...alert,
            timestamp: alert.timestamp?.toDate() || new Date(),
          })) || [],
        } as PortfolioInvestment);
      });

      return portfolio;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      
      // Fallback to localStorage
      const portfolio = JSON.parse(localStorage.getItem(`portfolio_${userId}`) || '[]');
      return portfolio;
    }
  }

  /**
   * Update portfolio prices and track performance
   */
  async updatePortfolioPrices(userId: string): Promise<InvestmentAlert[]> {
    const portfolio = await this.getPortfolio(userId);
    const alerts: InvestmentAlert[] = [];

    for (const investment of portfolio) {
      if (!investment.autoTrackingEnabled) continue;

      // Fetch current price (mock - integrate with real API)
      const currentPrice = await this.fetchCurrentPrice(investment.symbol);
      const currentValue = investment.quantity * currentPrice;
      const profitLoss = currentValue - investment.investmentAmount;
      const profitLossPercent = (profitLoss / investment.investmentAmount) * 100;

      // Check for alerts
      if (profitLossPercent < -5) {
        const alert: InvestmentAlert = {
          id: `ALERT${Date.now()}`,
          timestamp: new Date(),
          type: 'Stop Loss',
          message: `⚠️ ${investment.name} is down ${Math.abs(profitLossPercent).toFixed(2)}%`,
          actionRecommended: `Consider exiting to limit losses. Current loss: ₹${Math.abs(profitLoss).toLocaleString()}`,
          priority: 'High',
        };
        alerts.push(alert);
        investment.alerts.push(alert);
      } else if (profitLossPercent > 20) {
        const alert: InvestmentAlert = {
          id: `ALERT${Date.now()}`,
          timestamp: new Date(),
          type: 'Target Reached',
          message: `🎉 ${investment.name} is up ${profitLossPercent.toFixed(2)}%!`,
          actionRecommended: `Consider booking partial profits. Current gain: ₹${profitLoss.toLocaleString()}`,
          priority: 'Medium',
        };
        alerts.push(alert);
        investment.alerts.push(alert);
      }

      // Update investment
      investment.currentPrice = currentPrice;
      investment.currentValue = currentValue;
      investment.profitLoss = profitLoss;
      investment.profitLossPercent = profitLossPercent;
      investment.lastUpdated = new Date();

      // Save to Firestore
      try {
        await updateDoc(doc(db, 'portfolio_investments', investment.id), {
          currentPrice,
          currentValue,
          profitLoss,
          profitLossPercent,
          lastUpdated: Timestamp.fromDate(new Date()),
          alerts: investment.alerts.map(a => ({
            ...a,
            timestamp: Timestamp.fromDate(a.timestamp),
          })),
        });
      } catch (error) {
        console.error('Error updating investment:', error);
      }
    }

    return alerts;
  }

  /**
   * Fetch current price (mock - integrate with real API)
   */
  private async fetchCurrentPrice(symbol: string): Promise<number> {
    // In production, integrate with NSE/BSE real-time API
    // For now, simulate price change
    const priceChanges: Record<string, number> = {
      'RELIANCE': 2450 + (Math.random() * 100 - 50),
      'TCS': 3650 + (Math.random() * 100 - 50),
      'INFY': 1580 + (Math.random() * 50 - 25),
      'HDFCBANK': 1650 + (Math.random() * 50 - 25),
      'TATAMOTORS': 750 + (Math.random() * 50 - 25),
      'BHARTIARTL': 1250 + (Math.random() * 50 - 25),
    };

    return priceChanges[symbol] || 1000;
  }
}

export const aiPortfolioService = new AIPortfolioService();

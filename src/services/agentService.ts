// AI Agents Service - Centralized agent logic and coordination

import type { FinancialAgent, AgentAction } from '../types';

export interface AgentRecommendation {
  agentId: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  estimatedSavings: number;
  requiresConsent: boolean;
}

export interface TaxAgentRecommendation {
  section: string;
  instrument: string;
  amount: number;
  taxSaved: number;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  explanation: string;
}

class AgentService {
  /**
   * Get all available financial agents
   */
  async getAllAgents(_userId: string): Promise<FinancialAgent[]> {
    // In production, fetch from Firestore based on userId
    // For demo, return mock data with all specialized agents
    return [
      // 1. Financial Health Analyzer Agent
      {
        id: 'agent-health',
        name: 'Financial Health Analyzer',
        type: 'savings',
        status: 'active',
        description: 'Continuously monitors and analyzes your financial health score, providing real-time insights and recommendations.',
        totalActionsTaken: 24,
        totalSavings: 0,
      },
      // 2. Auto-Savings Optimizer
      {
        id: 'agent-savings',
        name: 'Auto-Savings Optimizer',
        type: 'savings',
        status: 'active',
        description: 'Automatically transfers surplus funds to high-yield savings accounts at month-end.',
        lastAction: {
          id: 'action-savings-1',
          agentId: 'agent-savings',
          actionType: 'transfer',
          description: 'Transferred ₹12,500 to liquid fund',
          amount: 12500,
          status: 'completed',
          timestamp: new Date('2025-01-10'),
          explanation: 'Based on spending pattern analysis, ₹12,500 was surplus. Moved to liquid fund earning 7% p.a. for better returns than savings account.',
          consentGiven: true,
          result: 'Successfully transferred. Expected annual return: ₹875',
        },
        totalActionsTaken: 8,
        totalSavings: 98000,
      },
      // 3. Smart Investment Rebalancer
      {
        id: 'agent-rebalance',
        name: 'Smart Investment Rebalancer',
        type: 'rebalancing',
        status: 'active',
        description: 'Monitors portfolio allocations and automatically rebalances when drift exceeds 5%.',
        lastAction: {
          id: 'action-rebalance-1',
          agentId: 'agent-rebalance',
          actionType: 'rebalance',
          description: 'Rebalanced portfolio: Equity 60% → 65%, Debt 40% → 35%',
          status: 'completed',
          timestamp: new Date('2025-01-08'),
          explanation: 'Equity allocation was 70%, exceeding target of 65%. Sold ₹50,000 equity, bought debt to restore target allocation and reduce risk.',
          consentGiven: true,
          result: 'Portfolio back to target allocation. Risk profile normalized.',
        },
        totalActionsTaken: 5,
        totalSavings: 0,
      },
      // 4. Tax Agentic Bot
      {
        id: 'agent-tax',
        name: 'Tax Optimization Agent',
        type: 'investment',
        status: 'active',
        description: 'Analyzes your income and suggests/executes tax-saving investments to maximize deductions under Section 80C, 80D, 80CCD(1B), etc.',
        lastAction: {
          id: 'action-tax-1',
          agentId: 'agent-tax',
          actionType: 'invest',
          description: 'Invested ₹50,000 in ELSS mutual fund (80C)',
          amount: 50000,
          status: 'completed',
          timestamp: new Date('2025-01-05'),
          explanation: 'Utilized remaining 80C limit before FY end. Tax saved: ₹15,600 (31.2% tax bracket). ELSS provides equity exposure with 3-year lock-in.',
          consentGiven: true,
          result: 'Tax saved: ₹15,600. Total 80C utilization: ₹1,50,000',
        },
        totalActionsTaken: 6,
        totalSavings: 78000,
      },
      // 5. Bill Negotiation Bot
      {
        id: 'agent-bills',
        name: 'Bill Negotiation Bot',
        type: 'bill_negotiation',
        status: 'awaiting_consent',
        description: 'Negotiates with service providers to reduce recurring bills (internet, mobile, subscriptions).',
        lastAction: {
          id: 'action-bills-1',
          agentId: 'agent-bills',
          actionType: 'negotiate',
          description: 'Found better mobile plan: ₹599/month vs current ₹799/month',
          amount: 200,
          status: 'requires_consent',
          timestamp: new Date(),
          explanation: 'Airtel has a new plan with same benefits (unlimited calls, 2GB/day data) for ₹599. Annual savings: ₹2,400.',
          consentGiven: false,
        },
        totalActionsTaken: 3,
        totalSavings: 8400,
      },
      // 6. Subscription Auditor
      {
        id: 'agent-subscription',
        name: 'Subscription Auditor',
        type: 'subscription',
        status: 'active',
        description: 'Identifies unused subscriptions and auto-cancels with your consent.',
        lastAction: {
          id: 'action-subscription-1',
          agentId: 'agent-subscription',
          actionType: 'cancel',
          description: 'Cancelled unused OTT subscription: Netflix Premium',
          amount: 649,
          status: 'completed',
          timestamp: new Date('2025-01-12'),
          explanation: 'Not used in last 3 months. Switched to Mobile plan (₹199/month) saving ₹450/month.',
          consentGiven: true,
          result: 'Cancelled Premium (₹649). Activated Mobile (₹199). Monthly savings: ₹450',
        },
        totalActionsTaken: 12,
        totalSavings: 18900,
      },
      // 7. Behavioral Bias Detector
      {
        id: 'agent-bias',
        name: 'Behavioral Bias Detector',
        type: 'savings',
        status: 'active',
        description: 'Detects emotional spending patterns (FOMO, impulse, panic) and sends real-time nudges.',
        lastAction: {
          id: 'action-bias-1',
          agentId: 'agent-bias',
          actionType: 'nudge',
          description: 'Prevented impulse purchase: ₹8,500 online shopping',
          amount: 8500,
          status: 'completed',
          timestamp: new Date('2025-01-11'),
          explanation: 'Detected impulse spending pattern (late night, similar to past regretted purchases). Sent cooling-off nudge with 24-hour delay suggestion.',
          consentGiven: true,
          result: 'User postponed purchase. Item no longer in wishlist after 24 hours.',
        },
        totalActionsTaken: 18,
        totalSavings: 45000,
      },
      // 8. Scenario Simulation Agent
      {
        id: 'agent-scenario',
        name: 'Scenario Simulation Engine',
        type: 'investment',
        status: 'active',
        description: 'Runs Monte Carlo simulations for retirement, job loss, and major expense scenarios.',
        totalActionsTaken: 32,
        totalSavings: 0,
      },
      // 9. Conversational AI Agent
      {
        id: 'agent-chat',
        name: 'Multi-Lingual Chat Agent',
        type: 'savings',
        status: 'active',
        description: 'Voice-first conversational AI supporting Hindi, Telugu, Tamil, Malayalam with intent recognition.',
        totalActionsTaken: 156,
        totalSavings: 0,
      },
      // 10. Explainability Agent
      {
        id: 'agent-explainability',
        name: 'Explainability Agent',
        type: 'savings',
        status: 'active',
        description: 'Provides detailed explanations for all AI recommendations and actions using chain-of-thought reasoning.',
        totalActionsTaken: 89,
        totalSavings: 0,
      },
      // 11. Action Execution Agent
      {
        id: 'agent-execution',
        name: 'Action Execution Agent',
        type: 'investment',
        status: 'active',
        description: 'Executes approved financial actions via APIs (transfers, investments, bill payments) with audit trail.',
        lastAction: {
          id: 'action-execution-1',
          agentId: 'agent-execution',
          actionType: 'execute',
          description: 'Executed SIP investment: ₹10,000 in balanced fund',
          amount: 10000,
          status: 'completed',
          timestamp: new Date('2025-01-01'),
          explanation: 'Monthly SIP on 1st of month as per user preference. Balanced fund (60% equity, 40% debt) for moderate risk.',
          consentGiven: true,
          result: 'SIP executed successfully. NAV: ₹45.23. Units allotted: 221.04',
        },
        totalActionsTaken: 48,
        totalSavings: 0,
      },
      // 12. Gamification Agent
      {
        id: 'agent-gamification',
        name: 'Gamification & Rewards Agent',
        type: 'savings',
        status: 'active',
        description: 'Tracks financial goals, awards badges, and provides incentives for good financial behavior.',
        lastAction: {
          id: 'action-gamification-1',
          agentId: 'agent-gamification',
          actionType: 'reward',
          description: 'Earned badge: "Savings Superstar" for 6-month streak',
          status: 'completed',
          timestamp: new Date('2025-01-01'),
          explanation: 'Maintained 35%+ savings rate for 6 consecutive months. Unlocked premium insights and priority support.',
          consentGiven: true,
          result: 'Badge awarded. Premium features unlocked for 3 months.',
        },
        totalActionsTaken: 24,
        totalSavings: 0,
      },
      // 13. Credit Score Monitor Agent
      {
        id: 'agent-credit',
        name: 'Credit Score Monitor',
        type: 'savings',
        status: 'active',
        description: 'Monitors credit score, detects anomalies, and suggests actions to improve score.',
        totalActionsTaken: 12,
        totalSavings: 0,
      },
      // 14. Financial Inclusion Agent
      {
        id: 'agent-inclusion',
        name: 'Financial Inclusion Agent',
        type: 'savings',
        status: 'active',
        description: 'Provides features for gig workers, freelancers, and rural users (irregular income tracking, micro-savings, vernacular support).',
        totalActionsTaken: 42,
        totalSavings: 0,
      },
    ];
  }

  /**
   * Tax Agent - Get personalized tax-saving recommendations
   */
  async getTaxRecommendations(
    annualIncome: number,
    currentInvestments: Record<string, number>
  ): Promise<TaxAgentRecommendation[]> {
    const recommendations: TaxAgentRecommendation[] = [];

    // Calculate tax bracket
    const taxBracket = this.calculateTaxBracket(annualIncome);

    // 80C recommendations (₹1.5L limit)
    const current80C = currentInvestments['80C'] || 0;
    const remaining80C = 150000 - current80C;
    if (remaining80C > 0) {
      recommendations.push({
        section: '80C',
        instrument: 'ELSS Mutual Fund',
        amount: Math.min(remaining80C, 50000),
        taxSaved: Math.min(remaining80C, 50000) * taxBracket,
        deadline: '31st March 2025',
        priority: 'high',
        explanation: `Invest in ELSS for equity exposure with tax benefits. 3-year lock-in. Tax saved: ${(Math.min(remaining80C, 50000) * taxBracket * 100 / Math.min(remaining80C, 50000)).toFixed(1)}%`,
      });

      if (remaining80C > 50000) {
        recommendations.push({
          section: '80C',
          instrument: 'PPF',
          amount: Math.min(remaining80C - 50000, 100000),
          taxSaved: Math.min(remaining80C - 50000, 100000) * taxBracket,
          deadline: '31st March 2025',
          priority: 'medium',
          explanation: 'Safe debt instrument with tax-free returns (7.1% p.a.). 15-year lock-in.',
        });
      }
    }

    // 80D recommendations (Health insurance)
    const current80D = currentInvestments['80D'] || 0;
    const remaining80D = 25000 - current80D;
    if (remaining80D > 0) {
      recommendations.push({
        section: '80D',
        instrument: 'Health Insurance Premium',
        amount: remaining80D,
        taxSaved: remaining80D * taxBracket,
        deadline: '31st March 2025',
        priority: 'high',
        explanation: 'Essential health coverage + tax benefit. Additional ₹25K for parents above 60.',
      });
    }

    // 80CCD(1B) - NPS (additional ₹50K)
    const currentNPS = currentInvestments['80CCD1B'] || 0;
    const remainingNPS = 50000 - currentNPS;
    if (remainingNPS > 0) {
      recommendations.push({
        section: '80CCD(1B)',
        instrument: 'NPS (National Pension System)',
        amount: remainingNPS,
        taxSaved: remainingNPS * taxBracket,
        deadline: '31st March 2025',
        priority: 'medium',
        explanation: 'Additional ₹50K deduction beyond 80C. Good for retirement planning. Lock-in till 60.',
      });
    }

    // 80E - Education loan interest
    recommendations.push({
      section: '80E',
      instrument: 'Education Loan Interest',
      amount: 0,
      taxSaved: 0,
      priority: 'low',
      explanation: 'If you have an education loan, entire interest is deductible. No upper limit.',
    });

    // Sort by priority and tax saved
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.taxSaved - a.taxSaved;
    });
  }

  /**
   * Calculate tax bracket based on income
   */
  private calculateTaxBracket(annualIncome: number): number {
    if (annualIncome <= 300000) return 0;
    if (annualIncome <= 600000) return 0.05;
    if (annualIncome <= 900000) return 0.10;
    if (annualIncome <= 1200000) return 0.15;
    if (annualIncome <= 1500000) return 0.20;
    return 0.30;
  }

  /**
   * Execute agent action
   */
  async executeAction(action: AgentAction): Promise<{ success: boolean; message: string }> {
    // In production, this would call actual APIs
    // For demo, simulate execution
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: `Action executed successfully: ${action.description}`,
    };
  }

  /**
   * Get agent performance summary
   */
  async getAgentPerformance(userId: string): Promise<{
    totalActions: number;
    totalSavings: number;
    activeAgents: number;
    avgResponseTime: number;
  }> {
    const agents = await this.getAllAgents(userId);

    return {
      totalActions: agents.reduce((sum, a) => sum + a.totalActionsTaken, 0),
      totalSavings: agents.reduce((sum, a) => sum + a.totalSavings, 0),
      activeAgents: agents.filter((a) => a.status === 'active').length,
      avgResponseTime: 2.3, // seconds
    };
  }
}

export const agentService = new AgentService();

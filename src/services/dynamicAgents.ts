/**
 * Dynamic Custom AI Agents
 * 
 * Pre-configured agent templates that can be created and customized by users
 * All agents are built on the Custom Agent Builder framework
 */

import { customAgentBuilder } from './customAgentBuilder';
import type { CustomAgent, AgentTemplate } from './customAgentBuilder';

// ==================== AGENT FACTORY ====================

export class DynamicAgentFactory {
  
  /**
   * Create Risk & Auto-Sell Agent
   * Monitors holdings and auto-sells when price hits stop-loss
   */
  async createRiskAutoSellAgent(
    userId: string,
    config: {
      holdings: Array<{
        symbol: string;
        quantity: number;
        purchasePrice: number;
        stopLossPercentage: number; // e.g., 5 for 5% loss
        stopLossPrice?: number; // absolute price
      }>;
      notificationChannels: ('email' | 'push' | 'sms' | 'in_app')[];
      requireConfirmation: boolean;
      confirmationTimeoutMinutes: number;
    }
  ): Promise<CustomAgent> {
    
    const agent = await customAgentBuilder.createAgent(userId, {
      name: 'Risk & Auto-Sell Agent',
      description: 'Monitors your holdings and automatically sells when stop-loss is triggered. Protects your investments from excessive losses.',
      icon: '🛡️',
      category: 'investment',
      
      config: {
        aiModel: 'gemini',
        temperature: 0.3, // Low temperature for conservative decision-making
        maxTokens: 512,
        persona: 'Risk-averse Investment Protector',
        systemPrompt: `You are a Risk & Auto-Sell Agent. Your primary goal is to protect the user's investments by monitoring holdings and executing stop-loss orders.

Rules:
1. Monitor stock prices in real-time
2. When a holding price drops below stop-loss threshold, trigger sell action
3. Send immediate notification before executing
4. Wait for user confirmation if required
5. Execute sell order and log all details
6. Never sell above stop-loss (that would be a gain!)
7. Be transparent about all actions

Always provide clear reasoning for every decision.`,
      },
      
      triggers: [
        {
          id: 'price_check_trigger',
          type: 'time',
          schedule: {
            type: 'cron',
            value: '*/5 * * * *', // Every 5 minutes during market hours
          },
          enabled: true,
        },
        {
          id: 'market_change_trigger',
          type: 'event',
          event: {
            type: 'market_change',
            filters: {
              symbols: config.holdings.map(h => h.symbol),
            },
          },
          enabled: true,
        },
      ],
      
      conditions: config.holdings.map((holding, index) => ({
        id: `stop_loss_${holding.symbol}_${index}`,
        type: 'ai_evaluated',
        aiEvaluation: {
          prompt: `Check if ${holding.symbol} has hit stop-loss:
- Purchase Price: ₹${holding.purchasePrice}
- Stop-loss Percentage: ${holding.stopLossPercentage}%
- Stop-loss Price: ₹${holding.stopLossPrice || (holding.purchasePrice * (1 - holding.stopLossPercentage / 100)).toFixed(2)}
- Current Price: {currentPrice}

Should we trigger stop-loss sell? Consider:
1. Has price dropped below stop-loss threshold?
2. Is this a temporary dip or sustained downtrend?
3. Any breaking news affecting the stock?

Return "true" only if stop-loss should trigger.`,
          expectedOutput: 'true',
        },
      })),
      
      actions: [
        {
          id: 'notify_stop_loss',
          type: 'notify',
          priority: 1,
          notify: {
            channels: config.notificationChannels,
            title: '🚨 Stop-Loss Triggered',
            message: 'One or more holdings have hit stop-loss thresholds. Review pending orders.',
            priority: 'urgent',
          },
          enabled: true,
        },
        {
          id: 'ai_decision_sell',
          type: 'ai_decision',
          priority: 2,
          aiDecision: {
            context: `User holdings with stop-loss triggered. Current market data: {marketData}`,
            allowedActions: ['sell_market_order', 'sell_limit_order', 'wait_and_monitor', 'notify_user'],
            safetyConstraints: [
              'Never sell more than user owns',
              'Never execute without audit trail',
              'Always notify user before selling',
              'Respect user confirmation settings',
              'Log all decisions with timestamps',
            ],
          },
          retry: {
            enabled: true,
            maxAttempts: 3,
            backoffSeconds: 60,
          },
          enabled: true,
        },
        {
          id: 'execute_sell',
          type: 'execute',
          priority: 3,
          enabled: true,
        },
        {
          id: 'audit_log',
          type: 'notify',
          priority: 4,
          notify: {
            channels: ['in_app'],
            title: 'Audit Log: Stop-Loss Execution',
            message: 'Stop-loss order executed. Check audit trail for details.',
            priority: 'high',
          },
          enabled: true,
        },
      ],
      
      permissions: {
        canTransferMoney: true,
        maxTransactionAmount: 1000000, // ₹10L max per transaction
        requiresConfirmation: config.requireConfirmation,
        confirmationThreshold: 0, // Always confirm for sells
        allowedAccounts: ['investment', 'trading'],
      },
      
      memory: {
        enabled: true,
        contextWindow: 50, // Remember last 50 price checks
        learningRate: 0.05, // Learn from market patterns
      },
    });

    console.log('✅ Created Risk & Auto-Sell Agent:', agent.id);
    return agent;
  }

  /**
   * Create Auto-Savings Agent
   * Transfers configurable amount from checking → savings on schedule or rules
   */
  async createAutoSavingsAgent(
    userId: string,
    config: {
      fromAccount: string;
      toAccount: string;
      savingsRule: 'fixed' | 'percentage' | 'smart' | 'round_up';
      fixedAmount?: number;
      percentage?: number;
      schedule?: {
        type: 'daily' | 'weekly' | 'monthly';
        value: string; // e.g., "1" for 1st of month
      };
      balanceThreshold?: number; // Only save if balance > threshold
      minBalance?: number; // Keep at least this much in checking
      notificationChannels: ('email' | 'push' | 'sms' | 'in_app')[];
    }
  ): Promise<CustomAgent> {
    
    const agent = await customAgentBuilder.createAgent(userId, {
      name: 'Auto-Savings Agent',
      description: 'Automatically transfers money to your savings account based on smart rules and schedules. Build wealth effortlessly!',
      icon: '🐷',
      category: 'savings',
      
      config: {
        aiModel: 'gemini',
        temperature: 0.5,
        maxTokens: 512,
        persona: 'Encouraging Savings Coach',
        systemPrompt: `You are an Auto-Savings Agent. Your mission is to help users build savings automatically without them feeling the pinch.

Rules:
1. Transfer money from checking to savings based on configured rules
2. Never leave checking account below minimum balance
3. Be smart about timing (avoid transfers right before bills)
4. Celebrate milestones and encourage savings habits
5. Adapt transfer amounts based on spending patterns
6. Always maintain audit trail

Be friendly, encouraging, and transparent.`,
      },
      
      triggers: [
        // Time-based trigger
        ...(config.schedule ? [{
          id: 'scheduled_savings',
          type: 'time' as const,
          schedule: {
            type: config.schedule.type,
            value: config.schedule.value,
          },
          enabled: true,
        }] : []),
        
        // Balance threshold trigger
        ...(config.balanceThreshold ? [{
          id: 'balance_threshold',
          type: 'threshold' as const,
          threshold: {
            metric: 'balance' as const,
            operator: '>' as const,
            value: config.balanceThreshold,
          },
          enabled: true,
        }] : []),
        
        // Income deposit trigger (smart savings)
        {
          id: 'income_deposit',
          type: 'event' as const,
          event: {
            type: 'transaction',
            filters: {
              category: 'income',
              account: config.fromAccount,
            },
          },
          enabled: config.savingsRule === 'smart',
        },
      ],
      
      conditions: [
        {
          id: 'min_balance_check',
          type: 'simple',
          simple: {
            field: 'account.balance',
            operator: '>',
            value: config.minBalance || 5000,
          },
        },
        {
          id: 'ai_timing_check',
          type: 'ai_evaluated',
          aiEvaluation: {
            prompt: `Is this a good time to save?

Account Balance: {accountBalance}
Upcoming Bills: {upcomingBills}
Recent Spending: {recentSpending}
Days until next income: {daysUntilIncome}

Should we transfer to savings now? Consider:
1. Are there upcoming bills in next 5 days?
2. Is balance sufficient after transfer?
3. Any irregular spending patterns?

Return "true" only if it's safe to save now.`,
            expectedOutput: 'true',
          },
        },
      ],
      
      actions: [
        {
          id: 'calculate_savings_amount',
          type: 'ai_decision',
          priority: 1,
          aiDecision: {
            context: `Calculate optimal savings amount:
- Rule: ${config.savingsRule}
- Fixed Amount: ${config.fixedAmount || 'N/A'}
- Percentage: ${config.percentage || 'N/A'}%
- Current Balance: {currentBalance}
- Minimum Balance: ${config.minBalance || 5000}
- Recent Income: {recentIncome}
- Recent Expenses: {recentExpenses}`,
            allowedActions: ['transfer_fixed', 'transfer_percentage', 'transfer_smart', 'skip_this_time'],
            safetyConstraints: [
              'Never transfer more than available balance',
              'Always maintain minimum balance in checking',
              'Consider upcoming bills and expenses',
              'Maximum transfer: ₹50,000 per transaction',
            ],
          },
          enabled: true,
        },
        {
          id: 'execute_transfer',
          type: 'transfer',
          priority: 2,
          transfer: {
            fromAccount: config.fromAccount,
            toAccount: config.toAccount,
            amountType: config.savingsRule === 'fixed' ? 'fixed' : 
                       config.savingsRule === 'percentage' ? 'percentage' : 
                       'ai_determined',
            amount: config.fixedAmount,
            percentage: config.percentage,
            memo: 'Automatic savings transfer',
          },
          retry: {
            enabled: true,
            maxAttempts: 2,
            backoffSeconds: 300,
          },
          enabled: true,
        },
        {
          id: 'notify_savings',
          type: 'notify',
          priority: 3,
          notify: {
            channels: config.notificationChannels,
            title: '🎉 Money Saved!',
            message: 'Successfully transferred to your savings account. Keep it up!',
            priority: 'medium',
          },
          enabled: true,
        },
        {
          id: 'audit_savings',
          type: 'notify',
          priority: 4,
          notify: {
            channels: ['in_app'],
            title: 'Audit: Savings Transfer',
            message: 'Auto-savings transfer completed. View details in audit trail.',
            priority: 'low',
          },
          enabled: true,
        },
      ],
      
      permissions: {
        canTransferMoney: true,
        maxTransactionAmount: 50000, // ₹50K max per transfer
        requiresConfirmation: false, // Auto-save without confirmation
        confirmationThreshold: 10000, // Confirm if > ₹10K
        allowedAccounts: [config.fromAccount, config.toAccount],
      },
      
      memory: {
        enabled: true,
        contextWindow: 30,
        learningRate: 0.1, // Learn optimal savings amounts
      },
    });

    console.log('✅ Created Auto-Savings Agent:', agent.id);
    return agent;
  }

  /**
   * Create Expense Classification Agent
   * Auto-classifies transactions using AI + historical patterns
   */
  async createExpenseClassificationAgent(
    userId: string,
    config: {
      categories: string[]; // e.g., ['personal', 'family', 'rent', 'utilities', 'entertainment', 'other']
      autoApply: boolean; // Automatically apply classifications
      confidenceThreshold: number; // Minimum confidence to auto-apply (0-1)
      notificationChannels: ('email' | 'push' | 'sms' | 'in_app')[];
    }
  ): Promise<CustomAgent> {
    
    const agent = await customAgentBuilder.createAgent(userId, {
      name: 'Expense Classification Agent',
      description: 'Automatically categorizes your transactions using AI and learns from your patterns. Makes expense tracking effortless!',
      icon: '🏷️',
      category: 'spending',
      
      config: {
        aiModel: 'gemini',
        temperature: 0.4,
        maxTokens: 256,
        persona: 'Meticulous Expense Organizer',
        systemPrompt: `You are an Expense Classification Agent. Your job is to accurately categorize transactions based on merchant, amount, time, and historical patterns.

Available Categories: ${config.categories.join(', ')}

Classification Rules:
1. Analyze merchant name, transaction amount, date/time
2. Look for patterns in historical transactions
3. Consider context (e.g., grocery stores = family, restaurants = personal/entertainment)
4. Apply learned rules from user corrections
5. Return category with confidence score (0-1)
6. If uncertain, suggest multiple categories for user choice

Be accurate, learn from feedback, and explain your reasoning.`,
      },
      
      triggers: [
        {
          id: 'new_transaction',
          type: 'event',
          event: {
            type: 'transaction',
            filters: {
              status: 'pending_classification',
            },
          },
          enabled: true,
        },
      ],
      
      conditions: [
        {
          id: 'needs_classification',
          type: 'simple',
          simple: {
            field: 'transaction.category',
            operator: '==',
            value: null,
          },
        },
      ],
      
      actions: [
        {
          id: 'classify_transaction',
          type: 'ai_decision',
          priority: 1,
          aiDecision: {
            context: `Classify this transaction:
- Merchant: {merchant}
- Amount: ₹{amount}
- Date: {date}
- Time: {time}
- Description: {description}
- Historical patterns: {historicalPatterns}

Available categories: ${config.categories.join(', ')}

Return JSON:
{
  "category": "chosen_category",
  "confidence": 0.0-1.0,
  "reasoning": "why this category",
  "alternativeCategories": ["category2", "category3"]
}`,
            allowedActions: ['classify', 'request_user_input'],
            safetyConstraints: [
              'Only use predefined categories',
              'Always include confidence score',
              'Provide reasoning',
              'Learn from user corrections',
            ],
          },
          enabled: true,
        },
        {
          id: 'apply_classification',
          type: 'execute',
          priority: 2,
          enabled: config.autoApply,
        },
        {
          id: 'notify_classification',
          type: 'notify',
          priority: 3,
          notify: {
            channels: config.notificationChannels,
            title: 'Transaction Categorized',
            message: 'New transactions have been automatically categorized. Review if needed.',
            priority: 'low',
          },
          enabled: true,
        },
        {
          id: 'request_feedback',
          type: 'recommend',
          priority: 4,
          recommend: {
            category: 'classification_feedback',
            generateUsing: 'ai',
            presentTo: 'user',
          },
          enabled: true,
        },
      ],
      
      permissions: {
        canTransferMoney: false,
        maxTransactionAmount: 0,
        requiresConfirmation: !config.autoApply,
        confirmationThreshold: 0,
        allowedAccounts: [],
      },
      
      memory: {
        enabled: true,
        contextWindow: 100, // Remember last 100 transactions
        learningRate: 0.15, // Learn quickly from corrections
      },
    });

    console.log('✅ Created Expense Classification Agent:', agent.id);
    return agent;
  }

  /**
   * Create Opportunity Recommendation Agent
   * Suggests investments based on salary + expense profile
   */
  async createOpportunityRecommendationAgent(
    userId: string,
    config: {
      riskProfile: 'conservative' | 'moderate' | 'aggressive';
      investmentHorizon: 'short' | 'medium' | 'long'; // < 1yr, 1-5yr, > 5yr
      monthlyInvestmentBudget?: number;
      preferences: {
        equity: boolean;
        debt: boolean;
        mutualFunds: boolean;
        gold: boolean;
        realEstate: boolean;
        crypto: boolean;
      };
      notificationChannels: ('email' | 'push' | 'sms' | 'in_app')[];
      recommendationFrequency: 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<CustomAgent> {
    
    const agent = await customAgentBuilder.createAgent(userId, {
      name: 'Opportunity Recommendation Agent',
      description: 'Analyzes your income and spending to suggest personalized investment opportunities. Grow your wealth intelligently!',
      icon: '💡',
      category: 'investment',
      
      config: {
        aiModel: 'gemini',
        temperature: 0.6,
        maxTokens: 1024,
        persona: 'Wise Investment Advisor',
        systemPrompt: `You are an Opportunity Recommendation Agent. Your role is to analyze user's financial profile and recommend suitable investment opportunities.

User Profile:
- Risk Profile: ${config.riskProfile}
- Investment Horizon: ${config.investmentHorizon}
- Monthly Budget: ₹${config.monthlyInvestmentBudget || 'Not set'}
- Preferences: ${Object.entries(config.preferences).filter(([_, v]) => v).map(([k]) => k).join(', ')}

Recommendation Guidelines:
1. Analyze monthly income and expenses to determine surplus
2. Suggest investments matching risk profile and horizon
3. Diversify across asset classes
4. Consider Indian market conditions and regulations
5. Provide clear rationale for each recommendation
6. Include expected returns, risks, and investment steps
7. Always follow RBI and SEBI guidelines

Be informative, unbiased, and focused on long-term wealth creation.`,
      },
      
      triggers: [
        {
          id: 'scheduled_analysis',
          type: 'time',
          schedule: {
            type: config.recommendationFrequency === 'daily' ? 'daily' :
                  config.recommendationFrequency === 'weekly' ? 'weekly' : 'monthly',
            value: config.recommendationFrequency === 'daily' ? '10:00' :
                   config.recommendationFrequency === 'weekly' ? '1' : '1',
          },
          enabled: true,
        },
        {
          id: 'surplus_detected',
          type: 'threshold',
          threshold: {
            metric: 'savings_rate',
            operator: '>',
            value: 20, // If saving > 20% of income
          },
          enabled: true,
        },
        {
          id: 'market_opportunity',
          type: 'ai_detected',
          aiPattern: {
            description: 'Market correction or attractive valuation detected in user-preferred sectors',
            confidence: 0.7,
          },
          enabled: true,
        },
      ],
      
      conditions: [
        {
          id: 'has_surplus',
          type: 'simple',
          simple: {
            field: 'monthlyIncome',
            operator: '>',
            value: 'monthlyExpenses',
          },
        },
        {
          id: 'not_recently_recommended',
          type: 'ai_evaluated',
          aiEvaluation: {
            prompt: `Check if we should send recommendations now:
- Last recommendation: {lastRecommendationDate}
- User engagement: {engagementScore}
- Market volatility: {marketVolatility}

Should we send recommendations? Avoid spam, only send when valuable.

Return "true" if it's a good time to recommend.`,
            expectedOutput: 'true',
          },
        },
      ],
      
      actions: [
        {
          id: 'analyze_financial_profile',
          type: 'analyze',
          priority: 1,
          analyze: {
            dataSource: 'user_transactions_and_profile',
            analysisType: 'pattern',
            outputDestination: 'agent_context',
          },
          enabled: true,
        },
        {
          id: 'generate_recommendations',
          type: 'ai_decision',
          priority: 2,
          aiDecision: {
            context: `Generate investment recommendations:

Financial Profile:
- Monthly Income: ₹{monthlyIncome}
- Monthly Expenses: ₹{monthlyExpenses}
- Monthly Surplus: ₹{monthlySurplus}
- Existing Investments: {existingInvestments}
- Emergency Fund: ₹{emergencyFund}
- Debt: ₹{totalDebt}

Market Context:
- Current market: {marketCondition}
- Interest rates: {interestRates}
- Inflation: {inflation}

Generate 3-5 personalized investment recommendations following user preferences and risk profile.`,
            allowedActions: ['recommend_equity', 'recommend_debt', 'recommend_mutual_fund', 'recommend_gold', 'recommend_fd', 'no_recommendation'],
            safetyConstraints: [
              'Only recommend SEBI-registered products',
              'Clearly state risks',
              'No guaranteed returns claims',
              'Diversification is key',
              'Emergency fund first, then invest',
              'Consider tax implications',
            ],
          },
          enabled: true,
        },
        {
          id: 'present_recommendations',
          type: 'recommend',
          priority: 3,
          recommend: {
            category: 'investment_opportunities',
            generateUsing: 'ai',
            presentTo: 'user',
          },
          enabled: true,
        },
        {
          id: 'notify_opportunities',
          type: 'notify',
          priority: 4,
          notify: {
            channels: config.notificationChannels,
            title: '💡 New Investment Opportunities',
            message: 'We found some investment opportunities tailored for you. Check them out!',
            priority: 'medium',
          },
          enabled: true,
        },
        {
          id: 'audit_recommendations',
          type: 'notify',
          priority: 5,
          notify: {
            channels: ['in_app'],
            title: 'Audit: Recommendations Generated',
            message: 'Investment recommendations generated and logged.',
            priority: 'low',
          },
          enabled: true,
        },
      ],
      
      permissions: {
        canTransferMoney: false,
        maxTransactionAmount: 0,
        requiresConfirmation: false,
        confirmationThreshold: 0,
        allowedAccounts: [],
      },
      
      memory: {
        enabled: true,
        contextWindow: 60, // Remember 2 months of data
        learningRate: 0.08, // Learn from user's investment choices
      },
    });

    console.log('✅ Created Opportunity Recommendation Agent:', agent.id);
    return agent;
  }
}

// Export singleton
export const dynamicAgentFactory = new DynamicAgentFactory();

// ==================== AGENT TEMPLATES FOR MARKETPLACE ====================

export const DYNAMIC_AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'template_risk_auto_sell',
    name: 'Risk & Auto-Sell Agent',
    description: 'Monitors your holdings and automatically sells when stop-loss is triggered. Protects investments from excessive losses.',
    category: 'investment',
    difficulty: 'intermediate',
    estimatedImpact: 'Prevent 5-10% losses',
    usageCount: 567,
    rating: 4.7,
    author: 'FinanceAI Team',
    template: {
      name: 'Risk & Auto-Sell Agent',
      icon: '🛡️',
      category: 'investment',
    },
    examples: [
      'Set 5% stop-loss on all equity holdings',
      'Auto-sell if Infosys drops below ₹1,400',
      'Risk protection for volatile stocks',
    ],
    tags: ['risk-management', 'stop-loss', 'auto-sell', 'investment-protection'],
  },
  {
    id: 'template_auto_savings',
    name: 'Auto-Savings Agent',
    description: 'Automatically transfers money to savings based on smart rules. Build wealth effortlessly!',
    category: 'savings',
    difficulty: 'beginner',
    estimatedImpact: '₹10,000-30,000/month',
    usageCount: 1893,
    rating: 4.9,
    author: 'FinanceAI Team',
    template: {
      name: 'Auto-Savings Agent',
      icon: '🐷',
      category: 'savings',
    },
    examples: [
      'Save 20% of every salary credit',
      'Transfer ₹5,000 to savings on 1st of month',
      'Round up transactions and save the change',
      'Smart savings based on spending patterns',
    ],
    tags: ['savings', 'automation', 'wealth-building', 'beginner-friendly'],
  },
  {
    id: 'template_expense_classification',
    name: 'Expense Classification Agent',
    description: 'Auto-categorizes transactions using AI. Makes expense tracking effortless!',
    category: 'spending',
    difficulty: 'beginner',
    estimatedImpact: 'Save 5+ hours/month',
    usageCount: 2341,
    rating: 4.8,
    author: 'FinanceAI Team',
    template: {
      name: 'Expense Classification Agent',
      icon: '🏷️',
      category: 'spending',
    },
    examples: [
      'Auto-tag groceries as "family"',
      'Classify rent payments automatically',
      'Separate personal vs business expenses',
      'Learn from your correction patterns',
    ],
    tags: ['expense-tracking', 'automation', 'ai-classification', 'time-saver'],
  },
  {
    id: 'template_opportunity_recommendation',
    name: 'Opportunity Recommendation Agent',
    description: 'Analyzes your finances and suggests personalized investments. Grow wealth intelligently!',
    category: 'investment',
    difficulty: 'intermediate',
    estimatedImpact: '8-12% annual returns',
    usageCount: 1124,
    rating: 4.6,
    author: 'FinanceAI Team',
    template: {
      name: 'Opportunity Recommendation Agent',
      icon: '💡',
      category: 'investment',
    },
    examples: [
      'Get weekly investment opportunities',
      'Personalized mutual fund suggestions',
      'Market timing recommendations',
      'Diversification advice based on your portfolio',
    ],
    tags: ['investment', 'recommendations', 'ai-advisor', 'wealth-growth'],
  },
];

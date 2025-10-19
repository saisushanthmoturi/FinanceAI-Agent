/**
 * AI Financial Advisor Service
 * 
 * Intelligent financial planning system that helps users:
 * - Set and achieve financial goals
 * - Get personalized investment recommendations
 * - Simulate savings vs investment scenarios
 * - Receive actionable monthly plans
 */

import { getUserProfile } from './authService';


export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentSavings: number;
  timelineMonths: number;
  priority: 'high' | 'medium' | 'low';
  category: 'home' | 'vehicle' | 'travel' | 'education' | 'emergency' | 'retirement' | 'other';
  createdAt: Date;
}

export interface UserFinancialInput {
  monthlySalary: number;
  monthlyExpenses: number;
  currentSavings: number;
  savingsPercentage: number; // % of salary saved monthly
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  goals: FinancialGoal[];
}

export interface InvestmentOption {
  name: string;
  type: 'savings_account' | 'fixed_deposit' | 'mutual_fund' | 'stocks' | 'gold' | 'real_estate' | 'ppf' | 'nps';
  expectedReturn: number; // Annual % return
  risk: 'low' | 'medium' | 'high';
  liquidity: 'high' | 'medium' | 'low';
  minInvestment: number;
  lockInPeriod?: string;
  taxBenefits: boolean;
  description: string;
  suitableFor: string[];
}

export interface GoalPlan {
  goal: FinancialGoal;
  monthlyRequiredSavings: number;
  monthlyRequiredInvestment: number;
  savingsTimeline: number; // months
  investmentTimeline: number; // months
  recommendedInvestments: InvestmentOption[];
  achievable: boolean;
  suggestions: string[];
  riskAnalysis: {
    level: 'low' | 'medium' | 'high';
    explanation: string;
    mitigation: string[];
  };
}

export interface FinancialAdvisorReport {
  userId: string;
  userName: string;
  monthlySavingsCapacity: number;
  financialHealthScore: number; // 0-100
  goalPlans: GoalPlan[];
  overallStrategy: {
    totalMonthlyInvestment: number;
    portfolioAllocation: {
      lowRisk: number;
      mediumRisk: number;
      highRisk: number;
    };
    expectedReturns: number; // Annual %
    timeline: string;
  };
  actionPlan: {
    immediate: string[];
    monthly: string[];
    quarterly: string[];
  };
  insights: string[];
  warnings: string[];
}

// Investment Options Database
const INVESTMENT_OPTIONS: InvestmentOption[] = [
  {
    name: 'High-Yield Savings Account',
    type: 'savings_account',
    expectedReturn: 4,
    risk: 'low',
    liquidity: 'high',
    minInvestment: 0,
    taxBenefits: false,
    description: 'Bank savings account with interest',
    suitableFor: ['emergency_fund', 'short_term_goals'],
  },
  {
    name: 'Fixed Deposit (FD)',
    type: 'fixed_deposit',
    expectedReturn: 6.5,
    risk: 'low',
    liquidity: 'medium',
    minInvestment: 1000,
    lockInPeriod: '1-5 years',
    taxBenefits: false,
    description: 'Guaranteed returns with bank deposits',
    suitableFor: ['conservative', 'short_to_medium_term'],
  },
  {
    name: 'Public Provident Fund (PPF)',
    type: 'ppf',
    expectedReturn: 7.1,
    risk: 'low',
    liquidity: 'low',
    minInvestment: 500,
    lockInPeriod: '15 years',
    taxBenefits: true,
    description: 'Government-backed long-term savings with tax benefits',
    suitableFor: ['conservative', 'long_term', 'retirement'],
  },
  {
    name: 'Equity Mutual Funds (Large Cap)',
    type: 'mutual_fund',
    expectedReturn: 12,
    risk: 'medium',
    liquidity: 'high',
    minInvestment: 500,
    taxBenefits: false,
    description: 'Diversified equity investments in large companies',
    suitableFor: ['moderate', 'medium_to_long_term'],
  },
  {
    name: 'Balanced/Hybrid Mutual Funds',
    type: 'mutual_fund',
    expectedReturn: 10,
    risk: 'medium',
    liquidity: 'high',
    minInvestment: 500,
    taxBenefits: false,
    description: 'Mix of equity and debt for balanced growth',
    suitableFor: ['moderate', 'all_goals'],
  },
  {
    name: 'Equity Mutual Funds (Mid & Small Cap)',
    type: 'mutual_fund',
    expectedReturn: 15,
    risk: 'high',
    liquidity: 'high',
    minInvestment: 500,
    taxBenefits: false,
    description: 'High-growth potential in smaller companies',
    suitableFor: ['aggressive', 'long_term'],
  },
  {
    name: 'Index Funds (Nifty 50/Sensex)',
    type: 'mutual_fund',
    expectedReturn: 11,
    risk: 'medium',
    liquidity: 'high',
    minInvestment: 500,
    taxBenefits: false,
    description: 'Low-cost tracking of market indices',
    suitableFor: ['moderate', 'long_term', 'passive_investing'],
  },
  {
    name: 'National Pension System (NPS)',
    type: 'nps',
    expectedReturn: 10,
    risk: 'medium',
    liquidity: 'low',
    minInvestment: 500,
    lockInPeriod: 'Till retirement',
    taxBenefits: true,
    description: 'Retirement-focused investment with tax benefits',
    suitableFor: ['moderate', 'retirement', 'long_term'],
  },
  {
    name: 'Direct Equity (Stocks)',
    type: 'stocks',
    expectedReturn: 18,
    risk: 'high',
    liquidity: 'high',
    minInvestment: 500,
    taxBenefits: false,
    description: 'Direct stock market investments',
    suitableFor: ['aggressive', 'experienced_investors'],
  },
  {
    name: 'Gold (Digital/ETF)',
    type: 'gold',
    expectedReturn: 8,
    risk: 'medium',
    liquidity: 'high',
    minInvestment: 100,
    taxBenefits: false,
    description: 'Hedge against inflation and currency risk',
    suitableFor: ['diversification', 'inflation_hedge'],
  },
];

/**
 * Calculate monthly savings capacity
 */
function calculateSavingsCapacity(input: UserFinancialInput): number {
  const monthlySurplus = input.monthlySalary - input.monthlyExpenses;
  return Math.max(0, monthlySurplus);
}

/**
 * Calculate financial health score (0-100)
 */
function calculateFinancialHealthScore(input: UserFinancialInput): number {
  let score = 0;

  // Savings rate (30 points)
  const savingsRate = (input.savingsPercentage / 30) * 30; // 30% savings = max points
  score += Math.min(30, savingsRate);

  // Emergency fund (20 points)
  const monthlyExpenses = input.monthlyExpenses;
  const emergencyFundMonths = input.currentSavings / monthlyExpenses;
  const emergencyScore = Math.min(20, (emergencyFundMonths / 6) * 20); // 6 months = max
  score += emergencyScore;

  // Debt-to-income ratio (20 points) - assuming no debt for now
  score += 20;

  // Goal planning (15 points)
  const hasGoals = input.goals.length > 0;
  score += hasGoals ? 15 : 5;

  // Risk awareness (15 points)
  score += input.riskProfile === 'moderate' ? 15 : 10;

  return Math.round(Math.min(100, score));
}

/**
 * Get recommended investments based on risk profile and timeline
 */
function getRecommendedInvestments(
  riskProfile: UserFinancialInput['riskProfile'],
  timelineMonths: number
): InvestmentOption[] {
  const timelineYears = timelineMonths / 12;
  const recommendations: InvestmentOption[] = [];

  if (timelineYears < 1) {
    // Short term: Low risk only
    recommendations.push(
      INVESTMENT_OPTIONS.find((o) => o.type === 'savings_account')!,
      INVESTMENT_OPTIONS.find((o) => o.type === 'fixed_deposit')!
    );
  } else if (timelineYears < 3) {
    // Medium term: Low to medium risk
    if (riskProfile === 'conservative') {
      recommendations.push(
        INVESTMENT_OPTIONS.find((o) => o.type === 'fixed_deposit')!,
        INVESTMENT_OPTIONS.find((o) => o.name === 'Balanced/Hybrid Mutual Funds')!
      );
    } else {
      recommendations.push(
        INVESTMENT_OPTIONS.find((o) => o.name === 'Balanced/Hybrid Mutual Funds')!,
        INVESTMENT_OPTIONS.find((o) => o.name === 'Equity Mutual Funds (Large Cap)')!
      );
    }
  } else {
    // Long term: Based on risk profile
    if (riskProfile === 'conservative') {
      recommendations.push(
        INVESTMENT_OPTIONS.find((o) => o.type === 'ppf')!,
        INVESTMENT_OPTIONS.find((o) => o.type === 'fixed_deposit')!,
        INVESTMENT_OPTIONS.find((o) => o.name === 'Balanced/Hybrid Mutual Funds')!
      );
    } else if (riskProfile === 'moderate') {
      recommendations.push(
        INVESTMENT_OPTIONS.find((o) => o.name === 'Index Funds (Nifty 50/Sensex)')!,
        INVESTMENT_OPTIONS.find((o) => o.name === 'Balanced/Hybrid Mutual Funds')!,
        INVESTMENT_OPTIONS.find((o) => o.name === 'Equity Mutual Funds (Large Cap)')!
      );
    } else {
      recommendations.push(
        INVESTMENT_OPTIONS.find((o) => o.name === 'Equity Mutual Funds (Mid & Small Cap)')!,
        INVESTMENT_OPTIONS.find((o) => o.name === 'Index Funds (Nifty 50/Sensex)')!,
        INVESTMENT_OPTIONS.find((o) => o.type === 'stocks')!
      );
    }
  }

  return recommendations.filter(Boolean);
}

/**
 * Calculate required monthly amount to reach goal
 */
function calculateMonthlyAmount(
  targetAmount: number,
  currentSavings: number,
  months: number,
  annualReturn: number
): number {
  const remainingAmount = targetAmount - currentSavings;
  
  if (annualReturn === 0) {
    // Simple savings
    return remainingAmount / months;
  }

  // Future value of annuity formula
  const monthlyReturn = annualReturn / 12 / 100;
  const denominator = ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
  
  return remainingAmount / denominator;
}

/**
 * Generate financial plan for a single goal
 */
function generateGoalPlan(
  goal: FinancialGoal,
  userInput: UserFinancialInput
): GoalPlan {
  const recommendedInvestments = getRecommendedInvestments(
    userInput.riskProfile,
    goal.timelineMonths
  );

  // Calculate with just savings (4% return)
  const monthlySavingsRequired = calculateMonthlyAmount(
    goal.targetAmount,
    goal.currentSavings,
    goal.timelineMonths,
    4
  );

  // Calculate with investment (average return of recommended options)
  const avgReturn =
    recommendedInvestments.reduce((sum, inv) => sum + inv.expectedReturn, 0) /
    recommendedInvestments.length;
  const monthlyInvestmentRequired = calculateMonthlyAmount(
    goal.targetAmount,
    goal.currentSavings,
    goal.timelineMonths,
    avgReturn
  );

  // Calculate how many months earlier investment achieves goal
  const investmentTimeline = goal.timelineMonths;
  const savingsTimeline = Math.ceil(
    (goal.targetAmount - goal.currentSavings) / monthlyInvestmentRequired
  );

  const savingsCapacity = calculateSavingsCapacity(userInput);
  const achievable = monthlyInvestmentRequired <= savingsCapacity;

  const suggestions: string[] = [];
  if (!achievable) {
    suggestions.push(
      `⚠️ Current savings capacity (₹${savingsCapacity.toLocaleString()}) is insufficient. Consider increasing income or reducing expenses.`
    );
    suggestions.push(
      `💡 Extend timeline to ${Math.ceil(
        (goal.targetAmount - goal.currentSavings) / savingsCapacity
      )} months to make it achievable.`
    );
  } else {
    const monthsSaved = savingsTimeline - investmentTimeline;
    if (monthsSaved > 0) {
      suggestions.push(
        `🚀 By investing instead of saving, you can reach your goal ${monthsSaved} months earlier!`
      );
    }
    suggestions.push(
      `✅ Set up automatic monthly SIP of ₹${Math.ceil(monthlyInvestmentRequired).toLocaleString()} for consistent progress.`
    );
  }

  // Risk analysis
  const riskLevel: 'low' | 'medium' | 'high' =
    goal.timelineMonths < 12
      ? 'low'
      : goal.timelineMonths < 36
      ? 'medium'
      : userInput.riskProfile === 'conservative'
      ? 'low'
      : userInput.riskProfile === 'moderate'
      ? 'medium'
      : 'high';

  const riskAnalysis = {
    level: riskLevel,
    explanation:
      riskLevel === 'low'
        ? 'Conservative approach with guaranteed returns. Lower growth but safe.'
        : riskLevel === 'medium'
        ? 'Balanced approach with moderate risk and good growth potential.'
        : 'Aggressive approach with higher risk but maximum growth potential.',
    mitigation: [
      'Diversify across multiple investment types',
      'Review portfolio every 6 months',
      riskLevel === 'high' ? 'Keep 20% in low-risk options as safety net' : 'Stay invested for full timeline',
      'Increase SIP amount if possible to reach goal faster',
    ],
  };

  return {
    goal,
    monthlyRequiredSavings: Math.ceil(monthlySavingsRequired),
    monthlyRequiredInvestment: Math.ceil(monthlyInvestmentRequired),
    savingsTimeline,
    investmentTimeline,
    recommendedInvestments,
    achievable,
    suggestions,
    riskAnalysis,
  };
}

/**
 * Generate comprehensive financial advisor report
 */
export async function generateFinancialAdvisorReport(
  userId: string,
  financialInput: UserFinancialInput
): Promise<FinancialAdvisorReport> {
  console.log('Service: Generating financial advisor report...');
  console.log('User ID:', userId);
  console.log('Financial Input:', financialInput);

  // Validate inputs
  if (!financialInput.monthlySalary || financialInput.monthlySalary <= 0) {
    throw new Error('Monthly salary is required and must be greater than 0');
  }

  if (!financialInput.goals || financialInput.goals.length === 0) {
    throw new Error('At least one financial goal is required');
  }

  const userProfile = await getUserProfile(userId);
  console.log('User profile loaded:', userProfile.displayName);

  const monthlySavingsCapacity = calculateSavingsCapacity(financialInput);
  console.log('Monthly savings capacity:', monthlySavingsCapacity);

  const financialHealthScore = calculateFinancialHealthScore(financialInput);
  console.log('Financial health score:', financialHealthScore);

  // Generate plan for each goal
  const goalPlans = financialInput.goals.map((goal) =>
    generateGoalPlan(goal, financialInput)
  );

  // Calculate overall strategy
  const totalMonthlyInvestment = goalPlans.reduce(
    (sum, plan) => sum + (plan.achievable ? plan.monthlyRequiredInvestment : 0),
    0
  );

  // Portfolio allocation based on risk profile
  const portfolioAllocation =
    financialInput.riskProfile === 'conservative'
      ? { lowRisk: 70, mediumRisk: 25, highRisk: 5 }
      : financialInput.riskProfile === 'moderate'
      ? { lowRisk: 30, mediumRisk: 50, highRisk: 20 }
      : { lowRisk: 10, mediumRisk: 40, highRisk: 50 };

  const expectedReturns =
    financialInput.riskProfile === 'conservative'
      ? 7
      : financialInput.riskProfile === 'moderate'
      ? 10
      : 14;

  // Action plan
  const actionPlan = {
    immediate: [
      `Link bank account for automatic investments`,
      `Set up ${goalPlans.length} SIP(s) for your financial goals`,
      financialHealthScore < 60 ? `Build emergency fund of ₹${(financialInput.monthlyExpenses * 6).toLocaleString()}` : '',
      `Complete KYC for mutual fund investments`,
    ].filter(Boolean),
    monthly: [
      `Invest ₹${totalMonthlyInvestment.toLocaleString()} across recommended funds`,
      `Track expenses and maintain ${financialInput.savingsPercentage}% savings rate`,
      `Review goal progress and adjust if needed`,
    ],
    quarterly: [
      `Rebalance portfolio to maintain target allocation`,
      `Review and adjust SIP amounts based on salary changes`,
      `Evaluate new investment opportunities`,
    ],
  };

  // Generate insights
  const insights: string[] = [];
  if (financialHealthScore >= 80) {
    insights.push(`🌟 Excellent! Your financial health score is ${financialHealthScore}/100. You're on the right track.`);
  } else if (financialHealthScore >= 60) {
    insights.push(`👍 Good progress! Your financial health score is ${financialHealthScore}/100. Some improvements needed.`);
  } else {
    insights.push(`⚠️ Your financial health score is ${financialHealthScore}/100. Focus on building emergency fund and reducing expenses.`);
  }

  const achievableGoals = goalPlans.filter((p) => p.achievable).length;
  insights.push(
    `${achievableGoals} out of ${goalPlans.length} goals are achievable with your current savings capacity.`
  );

  if (totalMonthlyInvestment <= monthlySavingsCapacity * 0.7) {
    insights.push(
      `💰 You have extra capacity! Consider investing additional ₹${Math.ceil(monthlySavingsCapacity - totalMonthlyInvestment).toLocaleString()} for wealth creation.`
    );
  }

  // Warnings
  const warnings: string[] = [];
  if (monthlySavingsCapacity < totalMonthlyInvestment) {
    warnings.push(
      `⚠️ Your goals require ₹${totalMonthlyInvestment.toLocaleString()}/month but you can only save ₹${monthlySavingsCapacity.toLocaleString()}/month.`
    );
  }

  if (financialInput.currentSavings < financialInput.monthlyExpenses * 3) {
    warnings.push(
      `⚠️ Build an emergency fund of at least 6 months expenses (₹${(financialInput.monthlyExpenses * 6).toLocaleString()}) before aggressive investing.`
    );
  }

  const maxTimeline = Math.max(...goalPlans.map((p) => p.investmentTimeline));

  const report: FinancialAdvisorReport = {
    userId,
    userName: userProfile.displayName || 'User',
    monthlySavingsCapacity,
    financialHealthScore,
    goalPlans,
    overallStrategy: {
      totalMonthlyInvestment,
      portfolioAllocation,
      expectedReturns,
      timeline: `${Math.ceil(maxTimeline / 12)} years`,
    },
    actionPlan,
    insights,
    warnings,
  };

  console.log('Service: Report generated successfully');
  console.log('Financial Health Score:', report.financialHealthScore);
  console.log('Goals analyzed:', report.goalPlans.length);
  console.log('Monthly investment required:', report.overallStrategy.totalMonthlyInvestment);

  return report;
}

/**
 * Compare savings vs investment for a specific goal
 */
export function compareSavingsVsInvestment(goal: FinancialGoal, riskProfile: UserFinancialInput['riskProfile']): {
  savings: {
    monthlyAmount: number;
    totalPaid: number;
    timeline: number;
    finalAmount: number;
  };
  investment: {
    monthlyAmount: number;
    totalPaid: number;
    timeline: number;
    finalAmount: number;
    returns: number;
  };
  advantage: string;
} {
  const savingsReturn = 4; // Savings account
  const investmentReturn = riskProfile === 'conservative' ? 8 : riskProfile === 'moderate' ? 12 : 15;

  const savingsMonthly = calculateMonthlyAmount(goal.targetAmount, goal.currentSavings, goal.timelineMonths, savingsReturn);
  const investmentMonthly = calculateMonthlyAmount(goal.targetAmount, goal.currentSavings, goal.timelineMonths, investmentReturn);

  const savingsTotalPaid = savingsMonthly * goal.timelineMonths;
  const investmentTotalPaid = investmentMonthly * goal.timelineMonths;

  const advantage = investmentMonthly < savingsMonthly
    ? `Save ₹${Math.ceil(savingsMonthly - investmentMonthly).toLocaleString()}/month by investing!`
    : `Investing requires similar monthly commitment but grows your wealth faster.`;

  return {
    savings: {
      monthlyAmount: Math.ceil(savingsMonthly),
      totalPaid: Math.ceil(savingsTotalPaid),
      timeline: goal.timelineMonths,
      finalAmount: goal.targetAmount,
    },
    investment: {
      monthlyAmount: Math.ceil(investmentMonthly),
      totalPaid: Math.ceil(investmentTotalPaid),
      timeline: goal.timelineMonths,
      finalAmount: goal.targetAmount,
      returns: Math.ceil(goal.targetAmount - investmentTotalPaid - goal.currentSavings),
    },
    advantage,
  };
}

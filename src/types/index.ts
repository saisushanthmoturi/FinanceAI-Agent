// User and Account Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  preferredLanguage: 'en' | 'hi' | 'te' | 'ta' | 'ml';
  createdAt: Date;
  lastLoginAt: Date;
  consentGiven: string[];
}

export interface FinancialAccount {
  id: string;
  userId: string;
  accountType: 'bank' | 'mutual_fund' | 'epf' | 'insurance' | 'stocks' | 'crypto' | 'real_estate';
  institutionName: string;
  accountNumber: string;
  balance: number;
  currency: string;
  lastSynced: Date;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: Date;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  description: string;
  merchant?: string;
  emotionTag?: 'impulse' | 'panic' | 'fomo' | 'planned' | 'necessary';
}

// Financial Health Types
export interface FinancialHealthScore {
  overallScore: number; // 0-100
  components: {
    incomeStability: number;
    debtToIncome: number;
    savingsRate: number;
    investmentDiversity: number;
    insuranceAdequacy: number;
    emergencyFund: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  lastCalculated: Date;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'savings' | 'investment' | 'debt' | 'insurance' | 'tax' | 'spending';
  priority: 'high' | 'medium' | 'low';
  potentialImpact: number;
  explanation: string;
  actionable: boolean;
  estimatedTimeToComplete?: string;
}

// Scenario Simulation Types
export interface SimulationScenario {
  id: string;
  userId: string;
  name: string;
  type: 'retirement' | 'job_loss' | 'investment' | 'expense' | 'income_change' | 'custom';
  parameters: Record<string, any>;
  results: SimulationResult;
  createdAt: Date;
}

export interface SimulationResult {
  successProbability: number;
  projectedNetWorth: number[];
  monthlyBreakdown: MonthlyProjection[];
  bestCaseScenario: number;
  worstCaseScenario: number;
  medianScenario: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface MonthlyProjection {
  month: number;
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  netWorth: number;
}

// Behavioral Analysis Types
export interface BehaviorPattern {
  userId: string;
  type: 'impulse' | 'fomo' | 'panic' | 'loss_aversion' | 'confirmation_bias';
  frequency: number;
  averageAmount: number;
  triggers: string[];
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high';
}

export interface Nudge {
  id: string;
  userId: string;
  type: 'warning' | 'suggestion' | 'encouragement' | 'cooling_off';
  message: string;
  messageHindi?: string;
  relatedBehavior?: BehaviorPattern;
  shown: boolean;
  shownAt?: Date;
  dismissed: boolean;
}

// Autonomous Agent Types
export interface FinancialAgent {
  id: string;
  name: string;
  type: 'savings' | 'investment' | 'bill_negotiation' | 'subscription' | 'rebalancing';
  status: 'active' | 'paused' | 'awaiting_consent';
  description: string;
  lastAction?: AgentAction;
  totalActionsTaken: number;
  totalSavings: number;
}

export interface AgentAction {
  id: string;
  agentId: string;
  actionType: string;
  description: string;
  amount?: number;
  status: 'pending' | 'completed' | 'failed' | 'requires_consent';
  timestamp: Date;
  explanation: string;
  consentGiven: boolean;
  result?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language: string;
  metadata?: {
    intent?: string;
    entities?: Record<string, any>;
    confidence?: number;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  startedAt: Date;
  lastMessageAt: Date;
  language: string;
}

// Dashboard Types
export interface DashboardData {
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  accounts: FinancialAccount[];
  recentTransactions: Transaction[];
  healthScore: FinancialHealthScore;
}

// Consent Management
export interface ConsentRequest {
  id: string;
  userId: string;
  purpose: string;
  dataTypes: string[];
  duration: string;
  status: 'pending' | 'granted' | 'denied' | 'revoked';
  requestedAt: Date;
  respondedAt?: Date;
}

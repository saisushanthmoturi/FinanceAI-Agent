/**
 * Profile Service
 * 
 * Handles comprehensive user profile data:
 * - Portfolio & investments
 * - Tax optimization history
 * - Future financial plans
 * - Active AI agents
 * - Personal information
 */

import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';

// ==================== INTERFACES ====================

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: 'mutual_fund' | 'stock' | 'fd' | 'ppf' | 'nps' | 'gold' | 'real_estate' | 'other';
  category: 'equity' | 'debt' | 'hybrid' | 'gold' | 'real_estate';
  amount: number; // Current value
  investedAmount: number; // Original investment
  returns: number; // Profit/Loss
  returnsPercentage: number;
  sipAmount?: number; // Monthly SIP if applicable
  startDate: Date;
  maturityDate?: Date;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'matured' | 'closed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  userId: string;
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  returnsPercentage: number;
  allocation: {
    equity: number;
    debt: number;
    gold: number;
    realEstate: number;
    others: number;
  };
  investments: Investment[];
  lastUpdated: Date;
}

export interface TaxOptimizationHistory {
  id: string;
  userId: string;
  financialYear: string;
  annualSalary: number;
  taxRegime: 'old' | 'new';
  totalTaxPaid: number;
  totalDeductions: number;
  taxSaved: number;
  investments: {
    section80C: number;
    section80D: number;
    section24: number;
    nps: number;
    others: number;
  };
  status: 'in_progress' | 'filed' | 'completed';
  filingDate?: Date;
  createdAt: Date;
}

export interface FuturePlan {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentSavings: number;
  monthlyContribution: number;
  targetDate: Date;
  category: 'home' | 'vehicle' | 'education' | 'retirement' | 'travel' | 'business' | 'emergency' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'planning' | 'in_progress' | 'achieved' | 'paused';
  progress: number; // Percentage
  recommendedInvestments: string[];
  milestones: {
    date: Date;
    amount: number;
    achieved: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveAgent {
  id: string;
  userId: string;
  agentType: 'tax_optimizer' | 'investment_advisor' | 'risk_monitor' | 'goal_planner' | 'expense_tracker';
  name: string;
  description: string;
  status: 'active' | 'paused' | 'stopped';
  lastAction: string;
  lastActionDate: Date;
  actionsPerformed: number;
  savingsGenerated: number;
  insights: string[];
  config: {
    autoExecute: boolean;
    notificationLevel: 'all' | 'important' | 'critical';
    frequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileData {
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  occupation?: string;
  annualIncome?: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  
  // Portfolio
  portfolio: Portfolio;
  
  // Tax
  taxHistory: TaxOptimizationHistory[];
  currentYearTax?: TaxOptimizationHistory;
  
  // Future Plans
  futurePlans: FuturePlan[];
  
  // AI Agents
  activeAgents: ActiveAgent[];
  
  // Financial Health
  financialHealthScore: number;
  creditScore?: number;
  
  // Preferences
  preferences: {
    currency: string;
    language: string;
    notifications: boolean;
    dataSharing: boolean;
  };
  
  lastUpdated: Date;
}

// ==================== FIRESTORE HELPERS ====================

const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

// ==================== PORTFOLIO FUNCTIONS ====================

export async function getPortfolio(userId: string): Promise<Portfolio | null> {
  try {
    console.log('Fetching portfolio for user:', userId);
    
    const portfolioRef = doc(db, 'portfolios', userId);
    const portfolioSnap = await getDoc(portfolioRef);
    
    if (!portfolioSnap.exists()) {
      console.log('No portfolio found, returning null');
      return null;
    }
    
    const data = portfolioSnap.data() as any;

    // Normalize investments array
    const investments: Investment[] = (data.investments || []).map((inv: any): Investment => ({
      id: inv.id || '',
      userId: inv.userId || userId,
      name: inv.name,
      type: inv.type,
      category: inv.category,
      amount: Number(inv.amount || 0),
      investedAmount: Number(inv.investedAmount || 0),
      returns: Number(inv.returns || (Number(inv.amount || 0) - Number(inv.investedAmount || 0))),
      returnsPercentage: Number(inv.returnsPercentage ?? ((Number(inv.investedAmount || 0) > 0)
        ? ((Number(inv.amount || 0) - Number(inv.investedAmount || 0)) / Number(inv.investedAmount || 0)) * 100
        : 0)),
      sipAmount: inv.sipAmount,
      startDate: convertTimestamp(inv.startDate || new Date()),
      maturityDate: inv.maturityDate ? convertTimestamp(inv.maturityDate) : undefined,
      riskLevel: inv.riskLevel || 'medium',
      status: inv.status || 'active',
      notes: inv.notes,
      createdAt: convertTimestamp(inv.createdAt || new Date()),
      updatedAt: convertTimestamp(inv.updatedAt || new Date()),
    }));

    // Compute derived totals from investments if existing totals are missing/zero
    const sumInvested = investments.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0);
    const sumCurrent = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const sumReturns = sumCurrent - sumInvested;

    const hasValidTotals = typeof data.totalInvested === 'number' && typeof data.currentValue === 'number';
    const totalsLookZero = (Number(data.totalInvested || 0) === 0 && Number(data.currentValue || 0) === 0)
      || (Number(data.totalReturns || 0) === 0 && Math.abs(sumReturns) > 0);

    // Use derived totals when source has zeros/missing but we can compute from investments
    const totalInvested = (!hasValidTotals || totalsLookZero) && sumInvested > 0 ? sumInvested : Number(data.totalInvested || 0);
    const currentValue = (!hasValidTotals || totalsLookZero) && sumCurrent > 0 ? sumCurrent : Number(data.currentValue || 0);
    const totalReturns = (!hasValidTotals || totalsLookZero) ? (currentValue - totalInvested) : Number(data.totalReturns || (Number(data.currentValue || 0) - Number(data.totalInvested || 0)));
    const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : Number(data.returnsPercentage || 0);

    // Compute allocation if missing/invalid
    let allocation = data.allocation as Portfolio['allocation'] | undefined;
    if (!allocation || Object.values(allocation).every(v => Number(v) === 0)) {
      const totalsByCat: Record<string, number> = {};
      investments.forEach((inv) => {
        totalsByCat[inv.category] = (totalsByCat[inv.category] || 0) + inv.amount;
      });
      const baseTotal = currentValue > 0 ? currentValue : sumCurrent;
      allocation = {
        equity: baseTotal ? ((totalsByCat['equity'] || 0) / baseTotal) * 100 : 0,
        debt: baseTotal ? ((totalsByCat['debt'] || 0) / baseTotal) * 100 : 0,
        gold: baseTotal ? ((totalsByCat['gold'] || 0) / baseTotal) * 100 : 0,
        realEstate: baseTotal ? ((totalsByCat['real_estate'] || 0) / baseTotal) * 100 : 0,
        others: 0,
      };
      // Compute others as remaining to 100
      const sumAlloc = allocation.equity + allocation.debt + allocation.gold + allocation.realEstate;
      allocation.others = Math.max(0, 100 - sumAlloc);
    }

    return {
      userId: data.userId || userId,
      totalInvested,
      currentValue,
      totalReturns,
      returnsPercentage,
      allocation,
      investments,
      lastUpdated: convertTimestamp(data.lastUpdated || new Date()),
    };
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    throw error;
  }
}

export async function updatePortfolio(userId: string, portfolio: Partial<Portfolio>): Promise<void> {
  try {
    console.log('Updating portfolio for user:', userId);
    
    const portfolioRef = doc(db, 'portfolios', userId);
    await setDoc(portfolioRef, {
      ...portfolio,
      userId,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
    
    console.log('Portfolio updated successfully');
  } catch (error) {
    console.error('Error updating portfolio:', error);
    throw error;
  }
}

export async function addInvestment(userId: string, investment: Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    console.log('Adding investment for user:', userId);
    
    const investmentData = {
      ...investment,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const investmentsRef = collection(db, 'investments');
    const docRef = await addDoc(investmentsRef, investmentData);
    
    // Update portfolio totals
    await recalculatePortfolio(userId);
    
    console.log('Investment added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
}

export async function getInvestments(userId: string): Promise<Investment[]> {
  try {
    console.log('Fetching investments for user:', userId);
    
    const investmentsRef = collection(db, 'investments');
    const q = query(
      investmentsRef,
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const investments: Investment[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      investments.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        type: data.type,
        category: data.category,
        amount: data.amount,
        investedAmount: data.investedAmount,
        returns: data.returns,
        returnsPercentage: data.returnsPercentage,
        sipAmount: data.sipAmount,
        startDate: convertTimestamp(data.startDate),
        maturityDate: data.maturityDate ? convertTimestamp(data.maturityDate) : undefined,
        riskLevel: data.riskLevel,
        status: data.status,
        notes: data.notes,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    
    console.log(`Found ${investments.length} investments`);
    return investments;
  } catch (error) {
    console.error('Error fetching investments:', error);
    return [];
  }
}

async function recalculatePortfolio(userId: string): Promise<void> {
  const investments = await getInvestments(userId);
  
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const currentValue = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReturns = currentValue - totalInvested;
  const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
  
  // Calculate allocation
  const allocation = {
    equity: 0,
    debt: 0,
    gold: 0,
    realEstate: 0,
    others: 0,
  };
  
  investments.forEach((inv) => {
    const category = inv.category === 'real_estate' ? 'realEstate' : inv.category;
    if (allocation[category as keyof typeof allocation] !== undefined) {
      allocation[category as keyof typeof allocation] += inv.amount;
    } else {
      allocation.others += inv.amount;
    }
  });
  
  // Convert to percentages
  if (currentValue > 0) {
    Object.keys(allocation).forEach((key) => {
      allocation[key as keyof typeof allocation] = (allocation[key as keyof typeof allocation] / currentValue) * 100;
    });
  }
  
  await updatePortfolio(userId, {
    totalInvested,
    currentValue,
    totalReturns,
    returnsPercentage,
    allocation,
  });
}

// ==================== TAX HISTORY FUNCTIONS ====================

export async function getTaxHistory(userId: string): Promise<TaxOptimizationHistory[]> {
  try {
    console.log('Fetching tax history for user:', userId);
    
    const taxRef = collection(db, 'taxHistory');
    const q = query(
      taxRef,
      where('userId', '==', userId),
      orderBy('financialYear', 'desc'),
      limit(5)
    );
    
    const snapshot = await getDocs(q);
    const history: TaxOptimizationHistory[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        userId: data.userId,
        financialYear: data.financialYear,
        annualSalary: data.annualSalary,
        taxRegime: data.taxRegime,
        totalTaxPaid: data.totalTaxPaid,
        totalDeductions: data.totalDeductions,
        taxSaved: data.taxSaved,
        investments: data.investments || {},
        status: data.status,
        filingDate: data.filingDate ? convertTimestamp(data.filingDate) : undefined,
        createdAt: convertTimestamp(data.createdAt),
      });
    });
    
    console.log(`Found ${history.length} tax records`);
    return history;
  } catch (error) {
    console.error('Error fetching tax history:', error);
    return [];
  }
}

export async function saveTaxRecord(userId: string, taxData: Omit<TaxOptimizationHistory, 'id' | 'userId' | 'createdAt'>): Promise<string> {
  try {
    console.log('Saving tax record for user:', userId);
    
    const taxRef = collection(db, 'taxHistory');
    const docRef = await addDoc(taxRef, {
      ...taxData,
      userId,
      createdAt: serverTimestamp(),
    });
    
    console.log('Tax record saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving tax record:', error);
    throw error;
  }
}

// ==================== FUTURE PLANS FUNCTIONS ====================

export async function getFuturePlans(userId: string): Promise<FuturePlan[]> {
  try {
    console.log('Fetching future plans for user:', userId);
    
    const plansRef = collection(db, 'futurePlans');
    const q = query(
      plansRef,
      where('userId', '==', userId),
      orderBy('priority', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const plans: FuturePlan[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      plans.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        targetAmount: data.targetAmount,
        currentSavings: data.currentSavings,
        monthlyContribution: data.monthlyContribution,
        targetDate: convertTimestamp(data.targetDate),
        category: data.category,
        priority: data.priority,
        status: data.status,
        progress: data.progress || 0,
        recommendedInvestments: data.recommendedInvestments || [],
        milestones: data.milestones || [],
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    
    console.log(`Found ${plans.length} future plans`);
    return plans;
  } catch (error) {
    console.error('Error fetching future plans:', error);
    return [];
  }
}

export async function addFuturePlan(userId: string, plan: Omit<FuturePlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    console.log('Adding future plan for user:', userId);
    
    const planData = {
      ...plan,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const plansRef = collection(db, 'futurePlans');
    const docRef = await addDoc(plansRef, planData);
    
    console.log('Future plan added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding future plan:', error);
    throw error;
  }
}

export async function updateFuturePlan(planId: string, updates: Partial<FuturePlan>): Promise<void> {
  try {
    console.log('Updating future plan:', planId);
    
    const planRef = doc(db, 'futurePlans', planId);
    await updateDoc(planRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    console.log('Future plan updated successfully');
  } catch (error) {
    console.error('Error updating future plan:', error);
    throw error;
  }
}

// ==================== ACTIVE AGENTS FUNCTIONS ====================

export async function getActiveAgents(userId: string): Promise<ActiveAgent[]> {
  try {
    console.log('Fetching active agents for user:', userId);
    
    const agentsRef = collection(db, 'activeAgents');
    const q = query(
      agentsRef,
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const agents: ActiveAgent[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      agents.push({
        id: doc.id,
        userId: data.userId,
        agentType: data.agentType,
        name: data.name,
        description: data.description,
        status: data.status,
        lastAction: data.lastAction,
        lastActionDate: convertTimestamp(data.lastActionDate),
        actionsPerformed: data.actionsPerformed || 0,
        savingsGenerated: data.savingsGenerated || 0,
        insights: data.insights || [],
        config: data.config || {
          autoExecute: false,
          notificationLevel: 'important',
          frequency: 'daily',
        },
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    
    console.log(`Found ${agents.length} active agents`);
    return agents;
  } catch (error) {
    console.error('Error fetching active agents:', error);
    return [];
  }
}

export async function addAgent(userId: string, agent: Omit<ActiveAgent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    console.log('Adding agent for user:', userId);
    
    const agentData = {
      ...agent,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const agentsRef = collection(db, 'activeAgents');
    const docRef = await addDoc(agentsRef, agentData);
    
    console.log('Agent added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding agent:', error);
    throw error;
  }
}

export async function updateAgent(agentId: string, updates: Partial<ActiveAgent>): Promise<void> {
  try {
    console.log('Updating agent:', agentId);
    
    const agentRef = doc(db, 'activeAgents', agentId);
    await updateDoc(agentRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    console.log('Agent updated successfully');
  } catch (error) {
    console.error('Error updating agent:', error);
    throw error;
  }
}

// ==================== COMPLETE PROFILE FUNCTIONS ====================

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
  try {
    console.log('Fetching complete profile data for user:', userId);

    const [
      userDoc,
      portfolio,
      taxHistory,
      futurePlans,
      activeAgents,
    ] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getPortfolio(userId),
      getTaxHistory(userId),
      getFuturePlans(userId),
      getActiveAgents(userId),
    ]);

    if (!userDoc.exists()) {
      console.log('User document not found');
      return null;
    }

    const userData = userDoc.data();

    const profileData: UserProfileData = {
      userId,
      displayName: userData.displayName || '',
      email: userData.email || '',
      phone: userData.phone,
      dateOfBirth: userData.dateOfBirth ? convertTimestamp(userData.dateOfBirth) : undefined,
      occupation: userData.occupation,
      annualIncome: userData.financialInfo?.annualSalary,
      riskProfile: userData.riskProfile || 'moderate',

      portfolio: portfolio || {
        userId,
        totalInvested: 1200000,
        currentValue: 1500000,
        totalReturns: 300000,
        returnsPercentage: 25,
        allocation: { equity: 65, debt: 20, gold: 10, realEstate: 3, others: 2 },
        investments: [],
        lastUpdated: new Date(),
      },

      taxHistory,
      currentYearTax: taxHistory[0],

      futurePlans,
      activeAgents,

      financialHealthScore: userData.financialHealthScore || 76,
      creditScore: userData.creditScore,

      preferences: userData.preferences || {
        currency: 'INR',
        language: 'en',
        notifications: true,
        dataSharing: false,
      },

      lastUpdated: new Date(),
    };

    return profileData;
  } catch (error) {
    console.error('Error fetching complete profile data:', error);
    throw error;
  }
}

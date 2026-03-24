import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import type { UserProfileData } from './profileService';

/**
 * Seed Data Service
 * Populates Firestore with realistic sample data for demo/testing purposes
 */
export class SeedDataService {
  /**
   * Seed all financial data for a user
   */
  async seedAllData(userId: string, displayName: string, email: string) {
    console.log(`🚀 Seeding data for user: ${userId}`);
    
    try {
      // 1. Create User Document
      await this.seedUser(userId, displayName, email);
      
      // 2. Create Portfolio
      await this.seedPortfolio(userId);
      
      // 3. Create Investments
      await this.seedInvestments(userId);
      
      // 4. Create Tax History
      await this.seedTaxHistory(userId);
      
      // 5. Create Future Plans (Goals)
      await this.seedFuturePlans(userId);
      
      // 6. Create Active Agents
      await this.seedActiveAgents(userId);
      
      // 7. Create Bank Accounts & Transactions
      await this.seedBankData(userId);

      // 8. Create User Profile (for manual entry service)
      await this.seedUserFinancialProfile(userId, displayName);
      
      console.log('✅ All data seeded successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error seeding data:', error);
      throw error;
    }
  }

  private async seedUser(userId: string, displayName: string, email: string) {
    await setDoc(doc(db, 'users', userId), {
      uid: userId,
      displayName,
      email,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      financialHealthScore: 82,
      riskProfile: 'aggressive',
      preferences: {
        currency: 'INR',
        language: 'en',
        notifications: true,
        dataSharing: true,
      }
    }, { merge: true });
  }

  private async seedPortfolio(userId: string) {
    await setDoc(doc(db, 'portfolios', userId), {
      userId,
      totalInvested: 2500000,
      currentValue: 3250000,
      totalReturns: 750000,
      returnsPercentage: 30,
      allocation: {
        equity: 60,
        debt: 25,
        gold: 10,
        realEstate: 5,
        others: 0
      },
      lastUpdated: serverTimestamp()
    }, { merge: true });
  }

  private async seedInvestments(userId: string) {
    const investments = [
      {
        name: 'HDFC Top 100 Fund',
        type: 'mutual_fund',
        category: 'equity',
        amount: 500000,
        investedAmount: 350000,
        riskLevel: 'high',
        status: 'active',
        startDate: Timestamp.fromDate(new Date('2022-01-15')),
      },
      {
        name: 'SBI Bluechip Fund',
        type: 'mutual_fund',
        category: 'equity',
        amount: 450000,
        investedAmount: 320000,
        riskLevel: 'high',
        status: 'active',
        startDate: Timestamp.fromDate(new Date('2022-03-10')),
      },
      {
        name: 'ICICI Prudential Liquid Fund',
        type: 'mutual_fund',
        category: 'debt',
        amount: 800000,
        investedAmount: 750000,
        riskLevel: 'low',
        status: 'active',
        startDate: Timestamp.fromDate(new Date('2023-01-01')),
      },
      {
        name: 'Reliance Industries Stock',
        type: 'stock',
        category: 'equity',
        amount: 250000,
        investedAmount: 180000,
        riskLevel: 'high',
        status: 'active',
        startDate: Timestamp.fromDate(new Date('2021-11-20')),
      },
      {
        name: 'Gold BeES',
        type: 'gold',
        category: 'gold',
        amount: 300000,
        investedAmount: 220000,
        riskLevel: 'medium',
        status: 'active',
        startDate: Timestamp.fromDate(new Date('2022-06-05')),
      }
    ];

    for (const inv of investments) {
      await addDoc(collection(db, 'investments'), {
        ...inv,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  private async seedTaxHistory(userId: string) {
    const taxRecords = [
      {
        financialYear: '2023-24',
        annualSalary: 1800000,
        taxRegime: 'old',
        totalTaxPaid: 215000,
        totalDeductions: 350000,
        taxSaved: 78000,
        investments: {
          section80C: 150000,
          section80D: 25000,
          section24: 150000,
          nps: 25000,
          others: 0
        },
        status: 'filed',
        createdAt: serverTimestamp()
      },
      {
        financialYear: '2024-25',
        annualSalary: 2100000,
        taxRegime: 'old',
        totalTaxPaid: 45000, // Monthly TDS
        totalDeductions: 280000,
        taxSaved: 42000,
        investments: {
          section80C: 120000,
          section80D: 20000,
          section24: 120000,
          nps: 20000,
          others: 0
        },
        status: 'in_progress',
        createdAt: serverTimestamp()
      }
    ];

    for (const record of taxRecords) {
      await addDoc(collection(db, 'taxHistory'), {
        ...record,
        userId,
      });
    }
  }

  private async seedFuturePlans(userId: string) {
    const plans = [
      {
        title: 'Dream Home',
        description: '3BHK apartment in Bangalore South',
        targetAmount: 15000000,
        currentSavings: 3500000,
        monthlyContribution: 75000,
        targetDate: Timestamp.fromDate(new Date('2030-12-31')),
        category: 'home',
        priority: 'high',
        status: 'in_progress',
        progress: 23,
      },
      {
        title: 'European Vacation',
        description: '15-day trip covering Switzerland and France',
        targetAmount: 800000,
        currentSavings: 450000,
        monthlyContribution: 25000,
        targetDate: Timestamp.fromDate(new Date('2025-06-15')),
        category: 'travel',
        priority: 'medium',
        status: 'in_progress',
        progress: 56,
      },
      {
        title: 'Early Retirement',
        description: 'Financial independence at age 50',
        targetAmount: 50000000,
        currentSavings: 2500000,
        monthlyContribution: 100000,
        targetDate: Timestamp.fromDate(new Date('2045-01-01')),
        category: 'retirement',
        priority: 'high',
        status: 'in_progress',
        progress: 5,
      }
    ];

    for (const plan of plans) {
      await addDoc(collection(db, 'futurePlans'), {
        ...plan,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  private async seedActiveAgents(userId: string) {
    const agents = [
      {
        agentType: 'tax_optimizer',
        name: 'Tax Optimizer Pro',
        description: 'Maximizes your tax savings autonomously',
        status: 'active',
        lastAction: 'Calculated potential savings for FY 24-25',
        lastActionDate: serverTimestamp(),
        actionsPerformed: 12,
        savingsGenerated: 45000,
        insights: ['Increase VPF contribution by 5% to save more tax'],
      },
      {
        agentType: 'investment_advisor',
        name: 'AI Wealth Manager',
        description: 'Smart portfolio management and rebalancing',
        status: 'active',
        lastAction: 'Rebalanced equity portfolio',
        lastActionDate: serverTimestamp(),
        actionsPerformed: 8,
        savingsGenerated: 120000,
        insights: ['Portfolio currently tilted towards Large Cap', 'Consider adding international exposure'],
      }
    ];

    for (const agent of agents) {
      await addDoc(collection(db, 'activeAgents'), {
        ...agent,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  private async seedBankData(userId: string) {
    const accounts = [
      {
        institutionName: 'HDFC Bank',
        accountType: 'savings',
        accountNumber: 'XXXX9876',
        balance: 450000,
        currency: 'INR',
        isActive: true,
      },
      {
        institutionName: 'ICICI Bank',
        accountType: 'credit_card',
        accountNumber: 'XXXX5432',
        balance: -25000,
        currency: 'INR',
        isActive: true,
      }
    ];

    for (const acc of accounts) {
      const docRef = await addDoc(collection(db, 'accounts'), {
        ...acc,
        userId,
        lastSynced: serverTimestamp(),
      });

      // Seed transactions for each account
      await this.seedTransactions(docRef.id);
    }
  }

  private async seedTransactions(accountId: string) {
    const transactions = [
      {
        description: 'Amazon.in Purchase',
        amount: 2500,
        type: 'expense',
        category: 'Shopping',
        date: Timestamp.fromDate(new Date()),
      },
      {
        description: 'Salary Credit',
        amount: 150000,
        type: 'income',
        category: 'Salary',
        date: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
      },
      {
        description: 'Zomato Order',
        amount: 850,
        type: 'expense',
        category: 'Food',
        date: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
      },
      {
        description: 'Airtel Bill Payment',
        amount: 1200,
        type: 'expense',
        category: 'Utilities',
        date: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      }
    ];

    for (const txn of transactions) {
      await addDoc(collection(db, 'transactions'), {
        ...txn,
        accountId,
      });
    }
  }

  private async seedUserFinancialProfile(userId: string, displayName: string) {
    await setDoc(doc(db, 'user_profiles', userId), {
      userId,
      personalInfo: {
        name: displayName,
        age: 30,
        occupation: 'Software Engineer',
      },
      income: {
        monthlySalary: 150000,
        annualSalary: 1800000,
        otherIncome: 5000,
        rentalIncome: 0,
        businessIncome: 0,
        lastUpdated: serverTimestamp(),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      bankAccounts: [
        {
          bankName: 'HDFC Bank',
          id: 'bank-1',
          balance: 450000,
          type: 'Savings',
          lastSync: new Date().toISOString()
        }
      ],
      transactions: []
    }, { merge: true });
  }
}

export const seedDataService = new SeedDataService();

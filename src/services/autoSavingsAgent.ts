/**
 * Auto-Savings Agent Service
 * 
 * Features:
 * - Automatic surplus detection and transfer
 * - Rule-based savings (percentage of income, fixed amount)
 * - Round-up transactions (spare change savings)
 * - Goal-based savings with progress tracking
 * - Income-based dynamic savings (gig worker friendly)
 * - Smart analysis using spending patterns
 * - Automated transfers with user consent
 * - Comprehensive audit trail
 */

// Firebase imports (for future integration)
// import { collection, addDoc, query, where, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
// import { db } from '../config/firebase';

// ==================== TYPES ====================

export interface SavingsRule {
  id: string;
  userId: string;
  name: string;
  type: 'percentage_income' | 'fixed_amount' | 'round_up' | 'surplus_detection' | 'goal_based';
  enabled: boolean;
  priority: number; // Higher priority rules execute first
  createdAt: Date;
  updatedAt: Date;
  
  // Percentage-based config
  percentageOfIncome?: number; // e.g., 10% of salary
  
  // Fixed amount config
  fixedAmount?: number; // e.g., ₹5,000 per month
  frequency?: 'daily' | 'weekly' | 'monthly'; // How often to save
  
  // Round-up config
  roundUpMultiple?: number; // e.g., 10 (round to nearest ₹10)
  roundUpCap?: number; // Max round-up per transaction (e.g., ₹50)
  
  // Surplus detection config
  surplusThreshold?: number; // Min balance to keep (e.g., ₹10,000)
  surplusPercentage?: number; // % of surplus to save (e.g., 50%)
  
  // Goal-based config
  goalId?: string; // Reference to SavingsGoal
  targetAmount?: number;
  targetDate?: Date;
  
  // Destination account
  destinationAccount: {
    type: 'savings' | 'investment' | 'goal';
    accountId: string;
    accountName: string;
  };
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: 'emergency_fund' | 'vacation' | 'home' | 'education' | 'retirement' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  milestones: {
    percentage: number;
    reached: boolean;
    reachedAt?: Date;
  }[];
}

export interface SavingsTransaction {
  id: string;
  userId: string;
  ruleId: string;
  ruleName: string;
  ruleType: SavingsRule['type'];
  amount: number;
  sourceAccount: {
    id: string;
    name: string;
    balance: number;
  };
  destinationAccount: {
    id: string;
    name: string;
    balance: number;
  };
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  executedAt?: Date;
  scheduledFor: Date;
  createdAt: Date;
  reason: string; // Why this savings was triggered
  goalId?: string;
  metadata: {
    originalTransaction?: any; // For round-ups
    surplusDetected?: number; // For surplus detection
    incomeAmount?: number; // For percentage-based
  };
}

export interface SavingsProfile {
  userId: string;
  autoSavingsEnabled: boolean;
  monthlyIncomeEstimate: number; // Estimated monthly income
  essentialExpenses: number; // Rent, utilities, groceries, etc.
  minBufferBalance: number; // Minimum balance to maintain in checking
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  
  // Preferences
  allowNegativeBalance: boolean; // Can savings cause overdraft?
  requireConfirmation: boolean; // Require user approval for transfers?
  confirmationThreshold: number; // Amount requiring confirmation (e.g., ₹5,000)
  
  // Scheduling
  preferredTransferDay: number; // Day of month (1-31)
  preferredTransferTime: string; // Time of day (HH:MM)
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
}

export interface SavingsAnalytics {
  userId: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  totalSaved: number;
  savingsRate: number; // % of income saved
  byRule: {
    ruleId: string;
    ruleName: string;
    amount: number;
    count: number;
  }[];
  byGoal: {
    goalId: string;
    goalName: string;
    amount: number;
    progress: number;
  }[];
  projectedSavings: number; // Based on current rate
  comparisonToPrevious: number; // % change from previous period
}

// ==================== SERVICE CLASS ====================

export class AutoSavingsAgentService {
  private monitoringInterval: number | null = null;
  private readonly CHECK_INTERVAL_MS = 3600000; // Check every hour

  /**
   * Start automatic savings monitoring
   */
  async startMonitoring(userId: string): Promise<void> {
    console.log(`💰 Starting auto-savings monitoring for user: ${userId}`);

    // Stop existing monitoring if any
    this.stopMonitoring();

    // Start monitoring interval
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.executeScheduledSavings(userId);
      } catch (error) {
        console.error('Error in auto-savings monitoring:', error);
      }
    }, this.CHECK_INTERVAL_MS);

    // Run immediate check
    await this.executeScheduledSavings(userId);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Auto-savings monitoring stopped');
    }
  }

  /**
   * Execute all scheduled savings for user
   */
  private async executeScheduledSavings(userId: string): Promise<void> {
    try {
      const profile = await this.getSavingsProfile(userId);

      if (!profile.autoSavingsEnabled) {
        console.log('⏸️ Auto-savings disabled for user:', userId);
        return;
      }

      const rules = await this.getActiveRules(userId);
      console.log(`📊 Checking ${rules.length} active savings rules...`);

      // Sort by priority
      const sortedRules = rules.sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        await this.evaluateAndExecuteRule(userId, rule, profile);
      }

      // Check for surplus and create ad-hoc savings
      await this.detectAndSaveSurplus(userId, profile);

    } catch (error) {
      console.error('Error executing scheduled savings:', error);
    }
  }

  /**
   * Evaluate a rule and execute if conditions are met
   */
  private async evaluateAndExecuteRule(
    userId: string,
    rule: SavingsRule,
    profile: SavingsProfile
  ): Promise<void> {
    try {
      let shouldExecute = false;
      let amount = 0;
      let reason = '';

      const now = new Date();

      switch (rule.type) {
        case 'percentage_income':
          // Check if it's payday (monthly on preferred day)
          if (now.getDate() === profile.preferredTransferDay) {
            amount = (profile.monthlyIncomeEstimate * (rule.percentageOfIncome || 10)) / 100;
            reason = `${rule.percentageOfIncome}% of monthly income (₹${profile.monthlyIncomeEstimate.toLocaleString()})`;
            shouldExecute = true;
          }
          break;

        case 'fixed_amount':
          // Check frequency
          const lastTransaction = await this.getLastTransactionForRule(rule.id);
          const daysSinceLastSave = lastTransaction 
            ? Math.floor((now.getTime() - lastTransaction.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          const frequencyDays = {
            daily: 1,
            weekly: 7,
            monthly: 30,
          };

          if (daysSinceLastSave >= frequencyDays[rule.frequency || 'monthly']) {
            amount = rule.fixedAmount || 0;
            reason = `Fixed ${rule.frequency} savings of ₹${amount.toLocaleString()}`;
            shouldExecute = true;
          }
          break;

        case 'goal_based':
          // Check if goal is active and not yet reached
          if (rule.goalId) {
            const goal = await this.getSavingsGoal(rule.goalId);
            if (goal && goal.status === 'active' && goal.currentAmount < goal.targetAmount) {
              // Calculate how much to save based on time remaining
              const daysRemaining = Math.floor((goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const remainingAmount = goal.targetAmount - goal.currentAmount;
              
              if (daysRemaining > 0) {
                // Monthly contribution needed
                const monthsRemaining = daysRemaining / 30;
                amount = Math.ceil(remainingAmount / monthsRemaining);
                reason = `Goal-based savings for "${goal.name}" (${daysRemaining} days remaining)`;
                shouldExecute = now.getDate() === profile.preferredTransferDay;
              }
            }
          }
          break;

        case 'surplus_detection':
          // Handled separately in detectAndSaveSurplus
          break;

        case 'round_up':
          // Handled on transaction events
          break;
      }

      if (shouldExecute && amount > 0) {
        await this.createSavingsTransaction(userId, rule, amount, reason, profile);
      }

    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
    }
  }

  /**
   * Detect surplus cash and create savings opportunity
   */
  private async detectAndSaveSurplus(userId: string, profile: SavingsProfile): Promise<void> {
    try {
      // Get user's checking account balance
      const accounts = JSON.parse(localStorage.getItem(`accounts_${userId}`) || '[]');
      const checkingAccount = accounts.find((a: any) => a.type === 'checking');

      if (!checkingAccount) return;

      const currentBalance = checkingAccount.balance;
      const minRequired = profile.minBufferBalance + profile.essentialExpenses;
      const surplus = currentBalance - minRequired;

      console.log(`💵 Surplus detection: Balance=${currentBalance}, Required=${minRequired}, Surplus=${surplus}`);

      if (surplus > 1000) { // Min ₹1,000 surplus to save
        // Find surplus detection rule
        const rules = await this.getActiveRules(userId);
        const surplusRule = rules.find(r => r.type === 'surplus_detection');

        if (surplusRule) {
          const amountToSave = Math.floor(surplus * (surplusRule.surplusPercentage || 50) / 100);
          const reason = `Surplus detected: ₹${surplus.toLocaleString()} above minimum (saving ${surplusRule.surplusPercentage}%)`;

          await this.createSavingsTransaction(userId, surplusRule, amountToSave, reason, profile);
        }
      }

    } catch (error) {
      console.error('Error detecting surplus:', error);
    }
  }

  /**
   * Create a savings transaction
   */
  private async createSavingsTransaction(
    userId: string,
    rule: SavingsRule,
    amount: number,
    reason: string,
    profile: SavingsProfile
  ): Promise<void> {
    try {
      // Get source account (checking)
      const accounts = JSON.parse(localStorage.getItem(`accounts_${userId}`) || '[]');
      const sourceAccount = accounts.find((a: any) => a.type === 'checking');

      if (!sourceAccount) {
        console.error('No checking account found for user');
        return;
      }

      // Check if balance is sufficient
      if (sourceAccount.balance < amount) {
        console.log(`⚠️ Insufficient balance for savings: Need ₹${amount}, Have ₹${sourceAccount.balance}`);
        return;
      }

      // Check if it would cause negative balance
      if (!profile.allowNegativeBalance && sourceAccount.balance - amount < 0) {
        console.log('⚠️ Savings would cause negative balance. Skipping.');
        return;
      }

      // Get destination account
      const destinationAccount = accounts.find((a: any) => a.id === rule.destinationAccount.accountId);

      if (!destinationAccount) {
        console.error('Destination account not found');
        return;
      }

      // Create transaction
      const transaction: SavingsTransaction = {
        id: `SAV${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.type,
        amount,
        sourceAccount: {
          id: sourceAccount.id,
          name: sourceAccount.name,
          balance: sourceAccount.balance,
        },
        destinationAccount: {
          id: destinationAccount.id,
          name: destinationAccount.name,
          balance: destinationAccount.balance,
        },
        status: profile.requireConfirmation && amount >= profile.confirmationThreshold ? 'pending' : 'completed',
        scheduledFor: new Date(),
        createdAt: new Date(),
        reason,
        goalId: rule.goalId,
        metadata: {},
      };

      // If auto-execute (no confirmation needed)
      if (transaction.status === 'completed') {
        await this.executeTransfer(transaction, userId);
        transaction.executedAt = new Date();
      }

      // Save transaction
      await this.saveSavingsTransaction(transaction);

      // Send notification
      if (transaction.status === 'pending') {
        await this.sendPendingTransactionNotification(userId, transaction);
      } else {
        await this.sendCompletedTransactionNotification(userId, transaction);
      }

      console.log(`✅ Savings transaction created: ${transaction.id} - ₹${amount}`);

    } catch (error) {
      console.error('Error creating savings transaction:', error);
    }
  }

  /**
   * Execute the actual transfer between accounts
   */
  private async executeTransfer(transaction: SavingsTransaction, userId: string): Promise<void> {
    try {
      // Update account balances
      const accounts = JSON.parse(localStorage.getItem(`accounts_${userId}`) || '[]');
      
      const sourceIdx = accounts.findIndex((a: any) => a.id === transaction.sourceAccount.id);
      const destIdx = accounts.findIndex((a: any) => a.id === transaction.destinationAccount.id);

      if (sourceIdx >= 0) {
        accounts[sourceIdx].balance -= transaction.amount;
      }

      if (destIdx >= 0) {
        accounts[destIdx].balance += transaction.amount;
      }

      localStorage.setItem(`accounts_${userId}`, JSON.stringify(accounts));

      // Update goal progress if applicable
      if (transaction.goalId) {
        await this.updateGoalProgress(transaction.goalId, transaction.amount);
      }

      console.log(`💸 Transfer executed: ₹${transaction.amount} from ${transaction.sourceAccount.name} to ${transaction.destinationAccount.name}`);

    } catch (error) {
      console.error('Error executing transfer:', error);
      throw error;
    }
  }

  /**
   * Update savings goal progress
   */
  private async updateGoalProgress(goalId: string, amount: number): Promise<void> {
    try {
      const goalsData = JSON.parse(localStorage.getItem('savings_goals') || '[]');
      const goalIdx = goalsData.findIndex((g: SavingsGoal) => g.id === goalId);

      if (goalIdx >= 0) {
        goalsData[goalIdx].currentAmount += amount;
        goalsData[goalIdx].updatedAt = new Date();

        // Check milestones
        const progress = (goalsData[goalIdx].currentAmount / goalsData[goalIdx].targetAmount) * 100;
        goalsData[goalIdx].milestones.forEach((milestone: any) => {
          if (!milestone.reached && progress >= milestone.percentage) {
            milestone.reached = true;
            milestone.reachedAt = new Date();
          }
        });

        // Check if goal is completed
        if (goalsData[goalIdx].currentAmount >= goalsData[goalIdx].targetAmount) {
          goalsData[goalIdx].status = 'completed';
        }

        localStorage.setItem('savings_goals', JSON.stringify(goalsData));
      }

    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  }

  /**
   * Process round-up for a transaction
   */
  async processRoundUp(userId: string, transactionAmount: number): Promise<void> {
    try {
      const rules = await this.getActiveRules(userId);
      const roundUpRule = rules.find(r => r.type === 'round_up' && r.enabled);

      if (!roundUpRule) return;

      const multiple = roundUpRule.roundUpMultiple || 10;
      const roundedUp = Math.ceil(transactionAmount / multiple) * multiple;
      const roundUpAmount = roundedUp - transactionAmount;

      // Cap the round-up
      const cappedAmount = Math.min(roundUpAmount, roundUpRule.roundUpCap || 50);

      if (cappedAmount > 0) {
        const profile = await this.getSavingsProfile(userId);
        const reason = `Round-up from transaction of ₹${transactionAmount.toFixed(2)} (rounded to ₹${roundedUp})`;

        await this.createSavingsTransaction(userId, roundUpRule, cappedAmount, reason, profile);
      }

    } catch (error) {
      console.error('Error processing round-up:', error);
    }
  }

  /**
   * Confirm pending transaction
   */
  async confirmTransaction(transactionId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const transactions = JSON.parse(localStorage.getItem('savings_transactions') || '[]');
      const txIdx = transactions.findIndex((t: SavingsTransaction) => t.id === transactionId);

      if (txIdx < 0) {
        return { success: false, message: 'Transaction not found' };
      }

      const transaction = transactions[txIdx];

      if (transaction.status !== 'pending') {
        return { success: false, message: 'Transaction is not pending' };
      }

      // Execute transfer
      await this.executeTransfer(transaction, userId);

      // Update status
      transactions[txIdx].status = 'completed';
      transactions[txIdx].executedAt = new Date();

      localStorage.setItem('savings_transactions', JSON.stringify(transactions));

      await this.sendCompletedTransactionNotification(userId, transactions[txIdx]);

      return { success: true, message: 'Savings transaction confirmed and executed' };

    } catch (error: any) {
      console.error('Error confirming transaction:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Cancel pending transaction
   */
  async cancelTransaction(transactionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const transactions = JSON.parse(localStorage.getItem('savings_transactions') || '[]');
      const txIdx = transactions.findIndex((t: SavingsTransaction) => t.id === transactionId);

      if (txIdx < 0) {
        return { success: false, message: 'Transaction not found' };
      }

      if (transactions[txIdx].status !== 'pending') {
        return { success: false, message: 'Transaction is not pending' };
      }

      transactions[txIdx].status = 'cancelled';
      localStorage.setItem('savings_transactions', JSON.stringify(transactions));

      return { success: true, message: 'Savings transaction cancelled' };

    } catch (error: any) {
      console.error('Error cancelling transaction:', error);
      return { success: false, message: error.message };
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get user's savings profile
   */
  async getSavingsProfile(userId: string): Promise<SavingsProfile> {
    const stored = localStorage.getItem(`savings_profile_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }

    // Return default profile
    const defaultProfile: SavingsProfile = {
      userId,
      autoSavingsEnabled: false,
      monthlyIncomeEstimate: 50000,
      essentialExpenses: 30000,
      minBufferBalance: 5000,
      aggressiveness: 'moderate',
      allowNegativeBalance: false,
      requireConfirmation: true,
      confirmationThreshold: 5000,
      preferredTransferDay: 1,
      preferredTransferTime: '09:00',
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
    };

    localStorage.setItem(`savings_profile_${userId}`, JSON.stringify(defaultProfile));
    return defaultProfile;
  }

  /**
   * Update savings profile
   */
  async updateSavingsProfile(userId: string, updates: Partial<SavingsProfile>): Promise<{ success: boolean; message: string }> {
    try {
      const existing = await this.getSavingsProfile(userId);
      const updated = { ...existing, ...updates };

      localStorage.setItem(`savings_profile_${userId}`, JSON.stringify(updated));

      return { success: true, message: 'Savings profile updated successfully' };
    } catch (error: any) {
      console.error('Error updating savings profile:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get active savings rules
   */
  async getActiveRules(userId: string): Promise<SavingsRule[]> {
    try {
      const rules = JSON.parse(localStorage.getItem(`savings_rules_${userId}`) || '[]');
      return rules.filter((r: SavingsRule) => r.enabled);
    } catch (error) {
      console.error('Error fetching active rules:', error);
      return [];
    }
  }

  /**
   * Get all savings rules
   */
  async getAllRules(userId: string): Promise<SavingsRule[]> {
    try {
      return JSON.parse(localStorage.getItem(`savings_rules_${userId}`) || '[]');
    } catch (error) {
      console.error('Error fetching rules:', error);
      return [];
    }
  }

  /**
   * Create savings rule
   */
  async createRule(userId: string, rule: Omit<SavingsRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string; ruleId?: string }> {
    try {
      const newRule: SavingsRule = {
        ...rule,
        id: `RULE${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const rules = await this.getAllRules(userId);
      rules.push(newRule);

      localStorage.setItem(`savings_rules_${userId}`, JSON.stringify(rules));

      return { success: true, message: 'Savings rule created successfully', ruleId: newRule.id };
    } catch (error: any) {
      console.error('Error creating rule:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update savings rule
   */
  async updateRule(ruleId: string, userId: string, updates: Partial<SavingsRule>): Promise<{ success: boolean; message: string }> {
    try {
      const rules = await this.getAllRules(userId);
      const ruleIdx = rules.findIndex(r => r.id === ruleId);

      if (ruleIdx < 0) {
        return { success: false, message: 'Rule not found' };
      }

      rules[ruleIdx] = {
        ...rules[ruleIdx],
        ...updates,
        updatedAt: new Date(),
      };

      localStorage.setItem(`savings_rules_${userId}`, JSON.stringify(rules));

      return { success: true, message: 'Savings rule updated successfully' };
    } catch (error: any) {
      console.error('Error updating rule:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete savings rule
   */
  async deleteRule(ruleId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const rules = await this.getAllRules(userId);
      const filtered = rules.filter(r => r.id !== ruleId);

      localStorage.setItem(`savings_rules_${userId}`, JSON.stringify(filtered));

      return { success: true, message: 'Savings rule deleted successfully' };
    } catch (error: any) {
      console.error('Error deleting rule:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get savings goal
   */
  async getSavingsGoal(goalId: string): Promise<SavingsGoal | null> {
    try {
      const goals = JSON.parse(localStorage.getItem('savings_goals') || '[]');
      return goals.find((g: SavingsGoal) => g.id === goalId) || null;
    } catch (error) {
      console.error('Error fetching goal:', error);
      return null;
    }
  }

  /**
   * Get all savings goals for user
   */
  async getAllGoals(userId: string): Promise<SavingsGoal[]> {
    try {
      const goals = JSON.parse(localStorage.getItem('savings_goals') || '[]');
      return goals.filter((g: SavingsGoal) => g.userId === userId);
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  }

  /**
   * Create savings goal
   */
  async createGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'milestones'>): Promise<{ success: boolean; message: string; goalId?: string }> {
    try {
      const newGoal: SavingsGoal = {
        ...goal,
        id: `GOAL${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        currentAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        milestones: [
          { percentage: 25, reached: false },
          { percentage: 50, reached: false },
          { percentage: 75, reached: false },
          { percentage: 100, reached: false },
        ],
      };

      const goals = JSON.parse(localStorage.getItem('savings_goals') || '[]');
      goals.push(newGoal);

      localStorage.setItem('savings_goals', JSON.stringify(goals));

      return { success: true, message: 'Savings goal created successfully', goalId: newGoal.id };
    } catch (error: any) {
      console.error('Error creating goal:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get last transaction for a rule
   */
  private async getLastTransactionForRule(ruleId: string): Promise<SavingsTransaction | null> {
    try {
      const transactions = JSON.parse(localStorage.getItem('savings_transactions') || '[]');
      const ruleTransactions = transactions.filter((t: SavingsTransaction) => t.ruleId === ruleId);
      
      if (ruleTransactions.length === 0) return null;

      // Sort by createdAt descending
      ruleTransactions.sort((a: SavingsTransaction, b: SavingsTransaction) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return ruleTransactions[0];
    } catch (error) {
      console.error('Error fetching last transaction:', error);
      return null;
    }
  }

  /**
   * Get pending transactions
   */
  async getPendingTransactions(userId: string): Promise<SavingsTransaction[]> {
    try {
      const transactions = JSON.parse(localStorage.getItem('savings_transactions') || '[]');
      return transactions.filter((t: SavingsTransaction) => t.userId === userId && t.status === 'pending');
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      return [];
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<SavingsTransaction[]> {
    try {
      const transactions = JSON.parse(localStorage.getItem('savings_transactions') || '[]');
      const userTransactions = transactions.filter((t: SavingsTransaction) => t.userId === userId);
      
      // Sort by createdAt descending
      userTransactions.sort((a: SavingsTransaction, b: SavingsTransaction) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return userTransactions.slice(0, limit);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Save savings transaction
   */
  private async saveSavingsTransaction(transaction: SavingsTransaction): Promise<void> {
    try {
      const transactions = JSON.parse(localStorage.getItem('savings_transactions') || '[]');
      transactions.push(transaction);
      localStorage.setItem('savings_transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  }

  /**
   * Send pending transaction notification
   */
  private async sendPendingTransactionNotification(_userId: string, transaction: SavingsTransaction): Promise<void> {
    // TODO: Implement email/push notifications
    console.log(`🔔 Pending savings notification: ${transaction.id} - ₹${transaction.amount}`);
  }

  /**
   * Send completed transaction notification
   */
  private async sendCompletedTransactionNotification(_userId: string, transaction: SavingsTransaction): Promise<void> {
    // TODO: Implement email/push notifications
    console.log(`✅ Savings completed notification: ${transaction.id} - ₹${transaction.amount}`);
  }

  /**
   * Get savings analytics
   */
  async getAnalytics(userId: string, period: SavingsAnalytics['period'] = 'month'): Promise<SavingsAnalytics> {
    try {
      const transactions = await this.getTransactionHistory(userId, 1000);
      const goals = await this.getAllGoals(userId);

      // Filter by period
      const now = new Date();
      const periodStart = new Date(now);
      
      switch (period) {
        case 'week':
          periodStart.setDate(now.getDate() - 7);
          break;
        case 'month':
          periodStart.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          periodStart.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          periodStart.setFullYear(now.getFullYear() - 1);
          break;
      }

      const periodTransactions = transactions.filter(
        t => t.status === 'completed' && new Date(t.createdAt) >= periodStart
      );

      const totalSaved = periodTransactions.reduce((sum, t) => sum + t.amount, 0);

      // Group by rule
      const byRule: any[] = [];
      const ruleMap = new Map<string, { amount: number; count: number; name: string }>();
      
      periodTransactions.forEach(t => {
        const existing = ruleMap.get(t.ruleId) || { amount: 0, count: 0, name: t.ruleName };
        existing.amount += t.amount;
        existing.count++;
        ruleMap.set(t.ruleId, existing);
      });

      ruleMap.forEach((data, ruleId) => {
        byRule.push({
          ruleId,
          ruleName: data.name,
          amount: data.amount,
          count: data.count,
        });
      });

      // Group by goal
      const byGoal: any[] = goals.map(g => ({
        goalId: g.id,
        goalName: g.name,
        amount: g.currentAmount,
        progress: (g.currentAmount / g.targetAmount) * 100,
      }));

      const profile = await this.getSavingsProfile(userId);
      const savingsRate = profile.monthlyIncomeEstimate > 0 
        ? (totalSaved / profile.monthlyIncomeEstimate) * 100 
        : 0;

      return {
        userId,
        period,
        totalSaved,
        savingsRate,
        byRule,
        byGoal,
        projectedSavings: totalSaved * (period === 'year' ? 1 : period === 'month' ? 12 : 52),
        comparisonToPrevious: 0, // TODO: Calculate
      };

    } catch (error) {
      console.error('Error calculating analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const autoSavingsAgent = new AutoSavingsAgentService();

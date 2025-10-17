import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FinancialAgent, AgentAction, Transaction } from '../types';

/**
 * Autonomous Financial Agent Service
 * Executes financial actions with user consent
 */
export class AutonomousAgentService {
  /**
   * Initialize default agents for a user
   */
  async initializeAgents(userId: string): Promise<FinancialAgent[]> {
    const defaultAgents: Omit<FinancialAgent, 'id'>[] = [
      {
        name: 'Smart Savings Agent',
        type: 'savings',
        status: 'awaiting_consent',
        description: 'Automatically transfers surplus funds to savings account at month-end',
        totalActionsTaken: 0,
        totalSavings: 0,
      },
      {
        name: 'Subscription Manager',
        type: 'subscription',
        status: 'awaiting_consent',
        description: 'Identifies and cancels unused subscriptions',
        totalActionsTaken: 0,
        totalSavings: 0,
      },
      {
        name: 'Bill Negotiator',
        type: 'bill_negotiation',
        status: 'awaiting_consent',
        description: 'Negotiates better rates on recurring bills (internet, phone, insurance)',
        totalActionsTaken: 0,
        totalSavings: 0,
      },
      {
        name: 'Portfolio Rebalancer',
        type: 'rebalancing',
        status: 'awaiting_consent',
        description: 'Automatically rebalances investment portfolio quarterly',
        totalActionsTaken: 0,
        totalSavings: 0,
      },
      {
        name: 'Tax Optimizer',
        type: 'investment',
        status: 'awaiting_consent',
        description: 'Suggests tax-saving investments before deadline',
        totalActionsTaken: 0,
        totalSavings: 0,
      },
    ];

    const agents: FinancialAgent[] = [];

    for (const agentData of defaultAgents) {
      const docRef = await addDoc(collection(db, 'agents'), {
        userId,
        ...agentData,
      });

      agents.push({
        id: docRef.id,
        ...agentData,
      });
    }

    return agents;
  }

  /**
   * Smart Savings Agent - Auto-transfer surplus
   */
  async executeSavingsTransfer(
    userId: string,
    accountId: string,
    income: number,
    expenses: number,
    targetSavingsRate: number = 0.20
  ): Promise<AgentAction> {
    const surplus = income - expenses;
    const targetSavings = income * targetSavingsRate;
    const transferAmount = Math.min(surplus, targetSavings);

    const action: Omit<AgentAction, 'id'> = {
      agentId: 'savings',
      actionType: 'auto_transfer',
      description: `Auto-transfer ₹${transferAmount.toLocaleString('en-IN')} to savings account`,
      amount: transferAmount,
      status: 'requires_consent',
      timestamp: new Date(),
      explanation: `Based on your income of ₹${income.toLocaleString('en-IN')} and expenses of ₹${expenses.toLocaleString('en-IN')}, you have a surplus of ₹${surplus.toLocaleString('en-IN')}. Transferring ₹${transferAmount.toLocaleString('en-IN')} helps you maintain a ${targetSavingsRate * 100}% savings rate.`,
      consentGiven: false,
    };

    const docRef = await addDoc(collection(db, 'agent_actions'), {
      userId,
      ...action,
      timestamp: Timestamp.now(),
    });

    return {
      id: docRef.id,
      ...action,
    };
  }

  /**
   * Subscription Manager - Detect unused subscriptions
   */
  async detectUnusedSubscriptions(
    userId: string,
    transactions: Transaction[]
  ): Promise<AgentAction[]> {
    // Find recurring transactions
    const subscriptionPatterns = new Map<string, Transaction[]>();

    transactions.forEach(txn => {
      if (txn.type === 'debit' && txn.merchant) {
        const key = `${txn.merchant}-${txn.amount}`;
        if (!subscriptionPatterns.has(key)) {
          subscriptionPatterns.set(key, []);
        }
        subscriptionPatterns.get(key)!.push(txn);
      }
    });

    const actions: AgentAction[] = [];

    // Identify subscriptions (3+ similar transactions)
    for (const [key, txns] of subscriptionPatterns.entries()) {
      if (txns.length >= 3) {
        const [merchant] = key.split('-');
        const monthlyAmount = txns[0].amount;
        const annualSavings = monthlyAmount * 12;

        const action: Omit<AgentAction, 'id'> = {
          agentId: 'subscription',
          actionType: 'cancel_subscription',
          description: `Cancel unused subscription: ${merchant}`,
          amount: annualSavings,
          status: 'requires_consent',
          timestamp: new Date(),
          explanation: `We detected a recurring payment of ₹${monthlyAmount} to ${merchant}. If you're not using this service, canceling it could save you ₹${annualSavings.toLocaleString('en-IN')} annually.`,
          consentGiven: false,
        };

        const docRef = await addDoc(collection(db, 'agent_actions'), {
          userId,
          ...action,
          timestamp: Timestamp.now(),
        });

        actions.push({
          id: docRef.id,
          ...action,
        });
      }
    }

    return actions;
  }

  /**
   * Bill Negotiator - Suggest better rates
   */
  async suggestBillNegotiation(
    userId: string,
    billType: string,
    currentAmount: number,
    potentialSavings: number
  ): Promise<AgentAction> {
    const action: Omit<AgentAction, 'id'> = {
      agentId: 'bill_negotiation',
      actionType: 'negotiate_bill',
      description: `Negotiate ${billType} bill`,
      amount: potentialSavings,
      status: 'requires_consent',
      timestamp: new Date(),
      explanation: `Your current ${billType} bill is ₹${currentAmount.toLocaleString('en-IN')}/month. Based on market rates, we estimate you could save up to ₹${potentialSavings.toLocaleString('en-IN')}/month by switching providers or negotiating. Shall I help you with this?`,
      consentGiven: false,
    };

    const docRef = await addDoc(collection(db, 'agent_actions'), {
      userId,
      ...action,
      timestamp: Timestamp.now(),
    });

    return {
      id: docRef.id,
      ...action,
    };
  }

  /**
   * Portfolio Rebalancer - Suggest rebalancing
   */
  async suggestRebalancing(
    userId: string,
    currentAllocation: Record<string, number>,
    targetAllocation: Record<string, number>
  ): Promise<AgentAction> {
    const changes = Object.keys(targetAllocation).map(asset => {
      const current = currentAllocation[asset] || 0;
      const target = targetAllocation[asset];
      const diff = target - current;
      return { asset, diff };
    }).filter(c => Math.abs(c.diff) > 5); // Only if difference > 5%

    const action: Omit<AgentAction, 'id'> = {
      agentId: 'rebalancing',
      actionType: 'rebalance_portfolio',
      description: 'Rebalance investment portfolio',
      status: 'requires_consent',
      timestamp: new Date(),
      explanation: `Your portfolio has drifted from the target allocation. Suggested changes:\n${changes.map(c => `${c.asset}: ${c.diff > 0 ? '+' : ''}${c.diff.toFixed(1)}%`).join('\n')}\n\nRebalancing helps maintain your risk profile and optimize returns.`,
      consentGiven: false,
    };

    const docRef = await addDoc(collection(db, 'agent_actions'), {
      userId,
      ...action,
      timestamp: Timestamp.now(),
    });

    return {
      id: docRef.id,
      ...action,
    };
  }

  /**
   * Grant consent to an action
   */
  async grantConsent(actionId: string): Promise<void> {
    const actionRef = doc(db, 'agent_actions', actionId);
    await updateDoc(actionRef, {
      consentGiven: true,
      status: 'pending',
    });

    // Here you would integrate with actual banking/investment APIs
    // For now, we'll mark as completed
    setTimeout(async () => {
      await updateDoc(actionRef, {
        status: 'completed',
        result: 'Action completed successfully',
      });
    }, 2000);
  }

  /**
   * Deny consent to an action
   */
  async denyConsent(actionId: string): Promise<void> {
    const actionRef = doc(db, 'agent_actions', actionId);
    await updateDoc(actionRef, {
      consentGiven: false,
      status: 'failed',
      result: 'User denied consent',
    });
  }

  /**
   * Get pending actions for user
   */
  async getPendingActions(userId: string): Promise<AgentAction[]> {
    const q = query(
      collection(db, 'agent_actions'),
      where('userId', '==', userId),
      where('status', '==', 'requires_consent')
    );

    const querySnapshot = await getDocs(q);
    const actions: AgentAction[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      actions.push({
        id: docSnap.id,
        ...data,
        timestamp: data.timestamp.toDate(),
      } as AgentAction);
    });

    return actions;
  }

  /**
   * Get user's agents
   */
  async getUserAgents(userId: string): Promise<FinancialAgent[]> {
    const q = query(
      collection(db, 'agents'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const agents: FinancialAgent[] = [];

    querySnapshot.forEach((docSnap) => {
      agents.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as FinancialAgent);
    });

    return agents;
  }

  /**
   * Toggle agent status
   */
  async toggleAgentStatus(agentId: string, status: 'active' | 'paused'): Promise<void> {
    const agentRef = doc(db, 'agents', agentId);
    await updateDoc(agentRef, { status });
  }
}

export const autonomousAgentService = new AutonomousAgentService();

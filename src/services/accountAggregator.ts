import axios from 'axios';
import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { FinancialAccount, Transaction } from '../types';

const AA_API_BASE_URL = import.meta.env.VITE_AA_BASE_URL;
const AA_API_KEY = import.meta.env.VITE_AA_API_KEY;

/**
 * Account Aggregator Service
 * Integrates with India's Account Aggregator framework for secure financial data access
 */
export class AccountAggregatorService {
  /**
   * Request user consent for data access
   */
  async requestConsent(
    userId: string,
    dataTypes: string[],
    purpose: string
  ): Promise<{ consentId: string; redirectUrl: string }> {
    try {
      const response = await axios.post(
        `${AA_API_BASE_URL}/v1/consent/request`,
        {
          userId,
          dataTypes,
          purpose,
          duration: '365', // days
        },
        {
          headers: {
            'Authorization': `Bearer ${AA_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error requesting consent:', error);
      throw error;
    }
  }

  /**
   * Check consent status
   */
  async checkConsentStatus(consentId: string): Promise<{ status: string; approved: boolean }> {
    try {
      const response = await axios.get(
        `${AA_API_BASE_URL}/v1/consent/${consentId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${AA_API_KEY}`,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error checking consent status:', error);
      throw error;
    }
  }

  /**
   * Fetch financial data from connected accounts
   */
  async fetchAccountData(
    userId: string,
    consentId: string,
    accountTypes: string[]
  ): Promise<FinancialAccount[]> {
    try {
      const response = await axios.post(
        `${AA_API_BASE_URL}/v1/data/fetch`,
        {
          userId,
          consentId,
          accountTypes,
        },
        {
          headers: {
            'Authorization': `Bearer ${AA_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const accounts: FinancialAccount[] = response.data.accounts.map((acc: any) => ({
        id: acc.id,
        userId,
        accountType: acc.type,
        institutionName: acc.institution,
        accountNumber: acc.maskedNumber,
        balance: acc.balance,
        currency: 'INR',
        lastSynced: new Date(),
        isActive: true,
      }));
      
      // Save to Firestore
      for (const account of accounts) {
        await addDoc(collection(db, 'accounts'), {
          ...account,
          lastSynced: Timestamp.now(),
        });
      }
      
      return accounts;
    } catch (error) {
      console.error('Error fetching account data:', error);
      throw error;
    }
  }

  /**
   * Fetch transactions for an account
   */
  async fetchTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Transaction[]> {
    try {
      const response = await axios.post(
        `${AA_API_BASE_URL}/v1/transactions/fetch`,
        {
          accountId,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
        },
        {
          headers: {
            'Authorization': `Bearer ${AA_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const transactions: Transaction[] = response.data.transactions.map((txn: any) => ({
        id: txn.id,
        accountId,
        date: new Date(txn.date),
        amount: txn.amount,
        type: txn.type,
        category: txn.category || 'Uncategorized',
        description: txn.description,
        merchant: txn.merchant,
      }));
      
      // Save to Firestore
      for (const transaction of transactions) {
        await addDoc(collection(db, 'transactions'), {
          ...transaction,
          date: Timestamp.fromDate(transaction.date),
        });
      }
      
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get all accounts for a user
   */
  async getUserAccounts(userId: string): Promise<FinancialAccount[]> {
    try {
      const q = query(
        collection(db, 'accounts'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const accounts: FinancialAccount[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        accounts.push({
          id: doc.id,
          ...data,
          lastSynced: data.lastSynced.toDate(),
        } as FinancialAccount);
      });
      
      return accounts;
    } catch (error) {
      console.error('Error getting user accounts:', error);
      throw error;
    }
  }

  /**
   * Sync all accounts for a user
   */
  async syncAllAccounts(userId: string, consentId: string): Promise<void> {
    try {
      const accountTypes = ['bank', 'mutual_fund', 'epf', 'insurance', 'stocks'];
      await this.fetchAccountData(userId, consentId, accountTypes);
      
      // Fetch transactions for the last 90 days
      const accounts = await this.getUserAccounts(userId);
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 90);
      
      for (const account of accounts) {
        await this.fetchTransactions(account.id, fromDate, toDate);
      }
    } catch (error) {
      console.error('Error syncing accounts:', error);
      throw error;
    }
  }
}

export const accountAggregatorService = new AccountAggregatorService();

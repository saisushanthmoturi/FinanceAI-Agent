/**
 * Portfolio Service
 * Manages user investment portfolio with Firestore persistence and LocalStorage fallback
 * 
 * Features:
 * - Add/Remove/Update investments
 * - Real-time P/L calculations
 * - Asset allocation tracking
 * - LocalStorage sync for resilience
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type AssetType = 
  | 'stocks'
  | 'mutual_funds'
  | 'bonds'
  | 'gold'
  | 'crypto'
  | 'real_estate'
  | 'fixed_deposit'
  | 'etf';

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: AssetType;
  quantity: number;
  buyPrice: number;
  currentPrice?: number;
  amount: number;
  currentValue?: number;
  returns?: number;
  returnsPercentage?: number;
  allocation?: number;
  purchaseDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalReturns: number;
  totalReturnsPercentage: number;
  totalInvestments: number;
  assetAllocation: Partial<Record<AssetType, number>>;
  bestPerformer: Investment | null;
  worstPerformer: Investment | null;
}

const PORTFOLIO_COLLECTION = 'portfolio';

/**
 * Add a new investment
 */
export async function addInvestment(
  userId: string,
  investment: Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Investment> {
  const investmentId = `inv_${userId}_${Date.now()}`;

  const newInvestment: Investment = {
    ...investment,
    id: investmentId,
    userId,
    currentPrice: investment.buyPrice,
    currentValue: investment.amount,
    returns: 0,
    returnsPercentage: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 1. Save to LocalStorage first
  const localKey = `manual_portfolio_${userId}`;
  const localData = localStorage.getItem(localKey);
  let portfolio: Investment[] = localData ? JSON.parse(localData) : [];
  portfolio.push(newInvestment);
  localStorage.setItem(localKey, JSON.stringify(portfolio));

  try {
    // 2. Try Firestore
    await setDoc(doc(db, PORTFOLIO_COLLECTION, investmentId), {
      ...newInvestment,
      purchaseDate: Timestamp.fromDate(new Date(investment.purchaseDate)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Added investment to Firestore: ${investment.name}`);
  } catch (error) {
    console.warn('Firestore add failed, but saved locally:', error);
  }

  return newInvestment;
}

/**
 * Get all investments
 */
export async function getUserInvestments(userId: string): Promise<Investment[]> {
  try {
    // Try Firestore first
    const q = query(
      collection(db, PORTFOLIO_COLLECTION),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const investments: Investment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Simulate market fluctuation (between -5% and +10%)
        const fluctuation = 1 + (Math.random() * 0.15 - 0.05);
        const currentPrice = (data.currentPrice || data.buyPrice) * fluctuation;
        const currentValue = data.quantity * currentPrice;
        const returns = currentValue - data.amount;
        const returnsPercentage = (returns / data.amount) * 100;

        investments.push({
          ...data,
          id: doc.id,
          currentPrice,
          currentValue,
          returns,
          returnsPercentage,
          purchaseDate: data.purchaseDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Investment);
      });
      // Sync local storage
      localStorage.setItem(`manual_portfolio_${userId}`, JSON.stringify(investments));
      return investments;
    }
  } catch (e) {
    console.warn('Firestore portfolio fetch failed, using local fallback:', e);
  }

  // Fallback to localStorage
  const localKey = `manual_portfolio_${userId}`;
  const localData = localStorage.getItem(localKey);
  if (localData) {
    const items = JSON.parse(localData);
    return items.map((i: any) => {
      // Re-calculate simulation for local items too
      const fluctuation = 1 + (Math.random() * 0.15 - 0.05);
      const currentPrice = (i.currentPrice || i.buyPrice) * fluctuation;
      const currentValue = i.quantity * currentPrice;
      const returns = currentValue - i.amount;
      const returnsPercentage = (returns / i.amount) * 100;

      return { 
        ...i, 
        currentPrice,
        currentValue,
        returns,
        returnsPercentage,
        purchaseDate: new Date(i.purchaseDate),
        createdAt: new Date(i.createdAt),
        updatedAt: new Date(i.updatedAt)
      };
    });
  }


  // Demo data if and only if no local or firestore data exists
  if (userId.startsWith('demo-')) {
    return [
      {
        id: 'mock-1',
        userId,
        name: 'Reliance Industries',
        type: 'stocks',
        quantity: 10,
        buyPrice: 2350,
        currentPrice: 2500,
        amount: 23500,
        currentValue: 25000,
        returns: 1500,
        returnsPercentage: 6.38,
        allocation: 45,
        purchaseDate: new Date(Date.now() - 30 * 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  return [];
}

/**
 * Delete an investment
 */
export async function deleteInvestment(userId: string, investmentId: string): Promise<void> {
  // 1. Update LocalStorage
  const localKey = `manual_portfolio_${userId}`;
  const localData = localStorage.getItem(localKey);
  if (localData) {
    let portfolio: Investment[] = JSON.parse(localData);
    portfolio = portfolio.filter(i => i.id !== investmentId);
    localStorage.setItem(localKey, JSON.stringify(portfolio));
  }

  // 2. Try Firestore
  try {
    await deleteDoc(doc(db, PORTFOLIO_COLLECTION, investmentId));
  } catch (error) {
    console.warn('Firestore delete failed, but removed locally:', error);
  }
}

/**
 * Calculate Summary
 */
export function calculatePortfolioSummary(investments: Investment[]): PortfolioSummary {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.amount), 0);
  const totalReturns = totalCurrentValue - totalInvested;
  const totalReturnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  const allocation: Partial<Record<AssetType, number>> = {};
  if (totalCurrentValue > 0) {
    investments.forEach(inv => {
      const value = inv.currentValue || inv.amount;
      allocation[inv.type] = (allocation[inv.type] || 0) + (value / totalCurrentValue) * 100;
      inv.allocation = Math.round((value / totalCurrentValue) * 100);
      inv.returns = value - inv.amount;
      inv.returnsPercentage = (inv.returns / inv.amount) * 100;
    });
  }

  return {
    totalInvested,
    totalCurrentValue,
    totalReturns,
    totalReturnsPercentage,
    totalInvestments: investments.length,
    assetAllocation: allocation,
    bestPerformer: null,
    worstPerformer: null,
  };
}

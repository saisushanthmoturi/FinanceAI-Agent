/**
 * Portfolio Service
 * Manages user investment portfolio with Firestore persistence
 * 
 * Features:
 * - Add/Remove/Update investments
 * - Real-time P/L calculations
 * - Asset allocation tracking
 * - Performance history
 * - Integration with Profile page
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
import { logActivity, ActivityType } from './activityLogger';

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
  name: string; // Stock symbol or fund name
  type: AssetType;
  quantity: number; // Number of units/shares
  buyPrice: number; // Price per unit when bought
  currentPrice?: number; // Current market price
  amount: number; // Total invested (quantity * buyPrice)
  currentValue?: number; // Current total value (quantity * currentPrice)
  returns?: number; // Profit/Loss in currency
  returnsPercentage?: number; // Profit/Loss in percentage
  allocation?: number; // Percentage of total portfolio
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
  assetAllocation: Record<AssetType, number>; // Type -> Percentage
  bestPerformer: Investment | null;
  worstPerformer: Investment | null;
}

const PORTFOLIO_COLLECTION = 'portfolio';

/**
 * Add a new investment to portfolio
 */
export async function addInvestment(
  userId: string,
  investment: Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Investment> {
  try {
    const investmentId = `inv_${userId}_${Date.now()}`;

    const newInvestment: Investment = {
      ...investment,
      id: investmentId,
      userId,
      currentPrice: investment.buyPrice, // Initially same as buy price
      currentValue: investment.amount, // Initially same as invested
      returns: 0,
      returnsPercentage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, PORTFOLIO_COLLECTION, investmentId), {
      ...newInvestment,
      purchaseDate: Timestamp.fromDate(new Date(investment.purchaseDate)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.PORTFOLIO_UPDATED,
      description: `Added investment: ${investment.name}`,
      metadata: {
        investmentId,
        type: investment.type,
        amount: investment.amount,
      },
    });

    console.log(`✅ Added investment: ${investment.name} - $${investment.amount}`);
    return newInvestment;
  } catch (error) {
    console.error('Error adding investment:', error);
    throw new Error('Failed to add investment');
  }
}

/**
 * Get all investments for a user
 */
export async function getUserInvestments(userId: string): Promise<Investment[]> {
  try {
    const q = query(
      collection(db, PORTFOLIO_COLLECTION),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    
    const investments: Investment[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        userId: data.userId,
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        buyPrice: data.buyPrice,
        currentPrice: data.currentPrice,
        amount: data.amount,
        currentValue: data.currentValue,
        returns: data.returns,
        returnsPercentage: data.returnsPercentage,
        allocation: data.allocation,
        purchaseDate: data.purchaseDate?.toDate() || new Date(),
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    console.log(`✅ Loaded ${investments.length} investments for user ${userId}`);
    return investments;
  } catch (error) {
    console.error('Error getting investments:', error);
    throw new Error('Failed to load investments');
  }
}

/**
 * Update investment (e.g., current price, notes)
 */
export async function updateInvestment(
  userId: string,
  investmentId: string,
  updates: Partial<Omit<Investment, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  try {
    const investmentRef = doc(db, PORTFOLIO_COLLECTION, investmentId);
    const investmentDoc = await getDoc(investmentRef);

    if (!investmentDoc.exists()) {
      throw new Error('Investment not found');
    }

    const investment = investmentDoc.data();
    if (investment.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Recalculate values if price updated
    let updateData: any = { ...updates, updatedAt: serverTimestamp() };

    if (updates.currentPrice !== undefined) {
      const quantity = investment.quantity;
      const buyPrice = investment.buyPrice;
      const currentValue = quantity * updates.currentPrice;
      const amount = quantity * buyPrice;
      const returns = currentValue - amount;
      const returnsPercentage = (returns / amount) * 100;

      updateData = {
        ...updateData,
        currentValue,
        returns,
        returnsPercentage,
      };
    }

    await updateDoc(investmentRef, updateData);

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.PORTFOLIO_UPDATED,
      description: `Updated investment: ${investment.name}`,
      metadata: {
        investmentId,
        updates: Object.keys(updates),
      },
    });

    console.log(`✅ Updated investment: ${investmentId}`);
  } catch (error) {
    console.error('Error updating investment:', error);
    throw new Error('Failed to update investment');
  }
}

/**
 * Delete an investment
 */
export async function deleteInvestment(
  userId: string,
  investmentId: string
): Promise<void> {
  try {
    const investmentRef = doc(db, PORTFOLIO_COLLECTION, investmentId);
    const investmentDoc = await getDoc(investmentRef);

    if (!investmentDoc.exists()) {
      throw new Error('Investment not found');
    }

    const investment = investmentDoc.data();
    if (investment.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await deleteDoc(investmentRef);

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.PORTFOLIO_UPDATED,
      description: `Removed investment: ${investment.name}`,
      metadata: {
        investmentId,
        type: investment.type,
      },
    });

    console.log(`✅ Deleted investment: ${investmentId}`);
  } catch (error) {
    console.error('Error deleting investment:', error);
    throw new Error('Failed to delete investment');
  }
}

/**
 * Calculate portfolio summary
 */
export function calculatePortfolioSummary(investments: Investment[]): PortfolioSummary {
  if (investments.length === 0) {
    return {
      totalInvested: 0,
      totalCurrentValue: 0,
      totalReturns: 0,
      totalReturnsPercentage: 0,
      totalInvestments: 0,
      assetAllocation: {} as Record<AssetType, number>,
      bestPerformer: null,
      worstPerformer: null,
    };
  }

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.amount), 0);
  const totalReturns = totalCurrentValue - totalInvested;
  const totalReturnsPercentage = (totalReturns / totalInvested) * 100;

  // Calculate asset allocation
  const assetAllocation: Record<string, number> = {};
  investments.forEach(inv => {
    const value = inv.currentValue || inv.amount;
    const percentage = (value / totalCurrentValue) * 100;
    assetAllocation[inv.type] = (assetAllocation[inv.type] || 0) + percentage;
  });

  // Find best and worst performers
  const sorted = [...investments].sort((a, b) => 
    (b.returnsPercentage || 0) - (a.returnsPercentage || 0)
  );

  return {
    totalInvested,
    totalCurrentValue,
    totalReturns,
    totalReturnsPercentage,
    totalInvestments: investments.length,
    assetAllocation: assetAllocation as Record<AssetType, number>,
    bestPerformer: sorted[0] || null,
    worstPerformer: sorted[sorted.length - 1] || null,
  };
}

/**
 * Update current prices for all investments (for real-time tracking)
 * This would typically call a market data API
 */
export async function refreshPrices(userId: string): Promise<void> {
  try {
    const investments = await getUserInvestments(userId);

    // In production, fetch real prices from market API
    // For now, simulate small price changes
    const updates = investments.map(async (inv) => {
      // Simulate ±2% price change
      const priceChange = (Math.random() - 0.5) * 0.04;
      const newPrice = inv.buyPrice * (1 + priceChange);

      return updateInvestment(userId, inv.id, {
        currentPrice: newPrice,
      });
    });

    await Promise.all(updates);
    console.log(`✅ Refreshed prices for ${investments.length} investments`);
  } catch (error) {
    console.error('Error refreshing prices:', error);
    throw new Error('Failed to refresh prices');
  }
}

/**
 * Get portfolio performance history
 * This would typically aggregate historical data
 */
export interface PortfolioPerformance {
  date: Date;
  value: number;
  invested: number;
  returns: number;
}

export async function getPortfolioPerformance(
  _userId: string,
  days: number = 30
): Promise<PortfolioPerformance[]> {
  // In production, this would query historical data
  // For now, generate mock data
  const performance: PortfolioPerformance[] = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    performance.push({
      date,
      value: 100000 + (days - i) * 1000 + Math.random() * 5000,
      invested: 100000,
      returns: (days - i) * 1000 + Math.random() * 5000,
    });
  }

  return performance;
}

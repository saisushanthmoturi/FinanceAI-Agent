/**
 * Watchlist Service - Persistent Firestore Storage
 * 
 * Features:
 * - Store watchlist items per user in Firestore
 * - Store portfolio positions per user
 * - Real-time sync with Firestore
 * - Activity logging for all watchlist changes
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logActivity, ActivityType } from './activityLogger';
import type { WatchlistItem, PortfolioPosition, AssetType } from './stockMonitoringAgent';

// Firestore collection paths
const WATCHLIST_COLLECTION = 'watchlists';
const PORTFOLIO_COLLECTION = 'portfolios';

// Firestore document types
interface WatchlistDoc {
  symbol: string;
  assetType: AssetType;
  threshold: number;
  lastPrice: number | null;
  currentPrice: number | null;
  addedAt: Timestamp;
  userId: string;
}

interface PortfolioDoc {
  symbol: string;
  assetType: AssetType;
  quantity: number;
  boughtPrice: number;
  boughtAt: Timestamp;
  currentPrice: number | null;
  currentValue: number | null;
  profitLoss: number | null;
  profitLossPercent: number | null;
  invested: number;
  riskLevel: string;
  riskScore: number;
  userId: string;
}

/**
 * Add item to user's watchlist in Firestore
 */
export async function addWatchlistItem(
  userId: string,
  item: WatchlistItem
): Promise<void> {
  try {
    const docRef = doc(db, WATCHLIST_COLLECTION, item.id);
    
    const watchlistDoc: WatchlistDoc = {
      symbol: item.symbol,
      assetType: item.assetType,
      threshold: item.threshold,
      lastPrice: item.lastPrice,
      currentPrice: item.currentPrice,
      addedAt: Timestamp.fromDate(item.addedAt),
      userId,
    };

    await setDoc(docRef, watchlistDoc);

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.STOCK_ADDED,
      description: `Added ${item.assetType} ${item.symbol} to watchlist (threshold: ${item.threshold}%)`,
      severity: 'low',
      metadata: {
        symbol: item.symbol,
        assetType: item.assetType,
        threshold: item.threshold,
      },
    });

    console.log(`✅ Added ${item.symbol} to Firestore watchlist`);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw new Error('Failed to add item to watchlist');
  }
}

/**
 * Remove item from user's watchlist in Firestore
 */
export async function removeWatchlistItem(
  userId: string,
  itemId: string
): Promise<void> {
  try {
    // Get item details for logging before deleting
    const docRef = doc(db, WATCHLIST_COLLECTION, itemId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Watchlist item not found');
    }

    const data = docSnap.data() as WatchlistDoc;
    
    // Delete from Firestore
    await deleteDoc(docRef);

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.STOCK_REMOVED,
      description: `Removed ${data.assetType} ${data.symbol} from watchlist`,
      severity: 'low',
      metadata: {
        symbol: data.symbol,
        assetType: data.assetType,
      },
    });

    console.log(`🗑️ Removed ${data.symbol} from Firestore watchlist`);
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw new Error('Failed to remove item from watchlist');
  }
}

/**
 * Get all watchlist items for a user
 */
export async function getWatchlistItems(userId: string): Promise<WatchlistItem[]> {
  try {
    const q = query(
      collection(db, WATCHLIST_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const items: WatchlistItem[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as WatchlistDoc;
      items.push({
        id: doc.id,
        symbol: data.symbol,
        assetType: data.assetType,
        threshold: data.threshold,
        lastPrice: data.lastPrice,
        currentPrice: data.currentPrice,
        addedAt: data.addedAt.toDate(),
        userId: data.userId,
      });
    });

    console.log(`📋 Loaded ${items.length} watchlist items for user ${userId}`);
    return items;
  } catch (error) {
    console.error('Error loading watchlist:', error);
    return [];
  }
}

/**
 * Update watchlist item prices
 */
export async function updateWatchlistPrices(
  itemId: string,
  lastPrice: number | null,
  currentPrice: number | null
): Promise<void> {
  try {
    const docRef = doc(db, WATCHLIST_COLLECTION, itemId);
    await updateDoc(docRef, {
      lastPrice,
      currentPrice,
    });
  } catch (error) {
    console.error('Error updating watchlist prices:', error);
  }
}

/**
 * Add portfolio position to Firestore
 */
export async function addPortfolioPosition(
  userId: string,
  position: PortfolioPosition
): Promise<void> {
  try {
    const docRef = doc(db, PORTFOLIO_COLLECTION, position.id);
    
    const portfolioDoc: PortfolioDoc = {
      symbol: position.symbol,
      assetType: position.assetType,
      quantity: position.quantity,
      boughtPrice: position.boughtPrice,
      boughtAt: Timestamp.fromDate(position.boughtAt),
      currentPrice: position.currentPrice,
      currentValue: position.currentValue,
      profitLoss: position.profitLoss,
      profitLossPercent: position.profitLossPercent,
      invested: position.invested,
      riskLevel: position.riskLevel,
      riskScore: position.riskScore,
      userId,
    };

    await setDoc(docRef, portfolioDoc);

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.PORTFOLIO_UPDATED,
      description: `Added ${position.quantity} ${position.symbol} to portfolio @ $${position.boughtPrice}`,
      severity: 'low',
      metadata: {
        symbol: position.symbol,
        quantity: position.quantity,
        boughtPrice: position.boughtPrice,
        invested: position.invested,
      },
    });

    console.log(`💼 Added ${position.symbol} to Firestore portfolio`);
  } catch (error) {
    console.error('Error adding to portfolio:', error);
    throw new Error('Failed to add position to portfolio');
  }
}

/**
 * Get all portfolio positions for a user
 */
export async function getPortfolioPositions(userId: string): Promise<PortfolioPosition[]> {
  try {
    const q = query(
      collection(db, PORTFOLIO_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const positions: PortfolioPosition[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as PortfolioDoc;
      positions.push({
        id: doc.id,
        symbol: data.symbol,
        assetType: data.assetType,
        quantity: data.quantity,
        boughtPrice: data.boughtPrice,
        boughtAt: data.boughtAt.toDate(),
        currentPrice: data.currentPrice,
        currentValue: data.currentValue,
        profitLoss: data.profitLoss,
        profitLossPercent: data.profitLossPercent,
        invested: data.invested,
        riskLevel: data.riskLevel as any,
        riskScore: data.riskScore,
        userId: data.userId,
      });
    });

    console.log(`💼 Loaded ${positions.length} portfolio positions for user ${userId}`);
    return positions;
  } catch (error) {
    console.error('Error loading portfolio:', error);
    return [];
  }
}

/**
 * Update portfolio position prices and metrics
 */
export async function updatePortfolioPosition(
  positionId: string,
  currentPrice: number,
  currentValue: number,
  profitLoss: number,
  profitLossPercent: number,
  riskLevel: string,
  riskScore: number
): Promise<void> {
  try {
    const docRef = doc(db, PORTFOLIO_COLLECTION, positionId);
    await updateDoc(docRef, {
      currentPrice,
      currentValue,
      profitLoss,
      profitLossPercent,
      riskLevel,
      riskScore,
    });
  } catch (error) {
    console.error('Error updating portfolio position:', error);
  }
}

/**
 * Remove portfolio position
 */
export async function removePortfolioPosition(
  userId: string,
  positionId: string
): Promise<void> {
  try {
    // Get position details for logging before deleting
    const docRef = doc(db, PORTFOLIO_COLLECTION, positionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Portfolio position not found');
    }

    const data = docSnap.data() as PortfolioDoc;
    
    // Delete from Firestore
    await deleteDoc(docRef);

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.PORTFOLIO_UPDATED,
      description: `Removed ${data.quantity} ${data.symbol} from portfolio`,
      severity: 'low',
      metadata: {
        symbol: data.symbol,
        quantity: data.quantity,
      },
    });

    console.log(`🗑️ Removed ${data.symbol} from Firestore portfolio`);
  } catch (error) {
    console.error('Error removing from portfolio:', error);
    throw new Error('Failed to remove position from portfolio');
  }
}

/**
 * Check if symbol exists in watchlist
 */
export async function isSymbolInWatchlist(
  userId: string,
  symbol: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db, WATCHLIST_COLLECTION),
      where('userId', '==', userId),
      where('symbol', '==', symbol.toUpperCase())
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
}

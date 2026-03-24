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
  // 1. Update localStorage first (immediate feedback)
  const localKey = `watchlist_${userId}`;
  const localData = localStorage.getItem(localKey);
  let watchlist: WatchlistItem[] = localData ? JSON.parse(localData) : [];
  
  // Update or add
  const index = watchlist.findIndex(i => i.id === item.id || i.symbol === item.symbol);
  if (index >= 0) {
    watchlist[index] = item;
  } else {
    watchlist.push(item);
  }
  localStorage.setItem(localKey, JSON.stringify(watchlist));

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
    console.log(`✅ Added ${item.symbol} to Firestore watchlist`);
  } catch (error) {
    console.warn('Firestore add failed, but saved locally:', error);
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
    // Try Firestore first
    const q = query(
      collection(db, WATCHLIST_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
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
      // Sync local storage
      localStorage.setItem(`watchlist_${userId}`, JSON.stringify(items));
      return items;
    }
  } catch (e) {
    console.warn('Firestore watchlist fetch failed, using local fallback:', e);
  }

  // Fallback to localStorage
  const localKey = `watchlist_${userId}`;
  const localData = localStorage.getItem(localKey);
  if (localData) {
    const items = JSON.parse(localData);
    return items.map((i: any) => ({ ...i, addedAt: new Date(i.addedAt) }));
  }

  // Final fallback: Mock data for empty state
  return [
    {
      id: 'watch-1',
      symbol: 'INFY',
      assetType: 'stock',
      threshold: 5,
      lastPrice: 1550,
      currentPrice: 1620,
      addedAt: new Date(),
      userId,
    }
  ];
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
  // 1. Update localStorage first
  const localKey = `portfolio_positions_${userId}`;
  const localData = localStorage.getItem(localKey);
  let positions: PortfolioPosition[] = localData ? JSON.parse(localData) : [];
  
  const index = positions.findIndex(p => p.id === position.id || p.symbol === position.symbol);
  if (index >= 0) {
    positions[index] = position;
  } else {
    positions.push(position);
  }
  localStorage.setItem(localKey, JSON.stringify(positions));

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
    console.log(`💼 Added ${position.symbol} to Firestore portfolio`);
  } catch (error) {
    console.warn('Firestore portfolio add failed, but saved locally:', error);
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
    if (!querySnapshot.empty) {
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
      // Sync local storage
      localStorage.setItem(`portfolio_positions_${userId}`, JSON.stringify(positions));
      return positions;
    }
  } catch (e) {
    console.warn('Firestore portfolio fetch failed, using local fallback:', e);
  }

  // Fallback to localStorage
  const localKey = `portfolio_positions_${userId}`;
  const localData = localStorage.getItem(localKey);
  if (localData) {
    const items = JSON.parse(localData);
    return items.map((i: any) => ({ ...i, boughtAt: new Date(i.boughtAt) }));
  }

  return [];
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

/**
 * Real-Time Stock Monitoring Agent - Backend Service
 * 
 * Features:
 * - Add stocks to watchlist with price change thresholds
 * - Poll stock prices from Finnhub API
 * - Detect price changes and trigger alerts
 * - WebSocket/Socket.IO for real-time notifications
 * - Persistent storage with Firestore
 */

import axios from 'axios';
import {
  addWatchlistItem,
  removeWatchlistItem,
  getWatchlistItems,
  updateWatchlistPrices,
  addPortfolioPosition,
  getPortfolioPositions,
  updatePortfolioPosition,
  isSymbolInWatchlist,
} from './watchlistService';

// Types
export type AssetType = 'stock' | 'crypto';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PortfolioPosition {
  id: string;
  symbol: string;
  assetType: AssetType;
  quantity: number; // Number of shares/coins owned
  boughtPrice: number; // Average buy price
  boughtAt: Date; // Purchase date
  currentPrice: number | null; // Live price
  currentValue: number | null; // quantity * currentPrice
  profitLoss: number | null; // currentValue - invested
  profitLossPercent: number | null; // (profitLoss / invested) * 100
  invested: number; // quantity * boughtPrice
  riskLevel: RiskLevel; // AI-calculated risk
  riskScore: number; // 0-100 (higher = more risky)
  userId: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  assetType: AssetType; // 'stock' or 'crypto'
  threshold: number; // Percentage change to trigger alert (e.g., 5 for 5%)
  lastPrice: number | null;
  currentPrice: number | null;
  addedAt: Date;
  userId: string;
  // Portfolio data (optional - if user owns this asset)
  portfolio?: PortfolioPosition;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  timestamp: Date;
  direction: 'up' | 'down';
}

export interface RiskAlert {
  id: string;
  symbol: string;
  assetType: AssetType;
  riskLevel: RiskLevel;
  riskScore: number;
  currentPrice: number;
  boughtPrice: number;
  profitLoss: number;
  profitLossPercent: number;
  reason: string; // AI explanation
  recommendation: string; // AI suggested action
  timestamp: Date;
  severity: 'warning' | 'danger' | 'critical';
}

// In-memory cache for monitoring (reloaded periodically from Firestore)
const watchlistCache: Map<string, WatchlistItem[]> = new Map();
const portfolioCache: Map<string, PortfolioPosition[]> = new Map();
const priceCache: Map<string, number> = new Map();
const historicalData: Map<string, { price: number; timestamp: Date }[]> = new Map();
const activeUserIds: Set<string> = new Set(); // Track users with active monitoring

// Finnhub API configuration
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'demo';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const POLL_INTERVAL = 10000; // 10 seconds

// Alert listeners (for frontend connection)
type AlertCallback = (alert: PriceAlert) => void;
type RiskAlertCallback = (alert: RiskAlert) => void;
const alertListeners: Map<string, AlertCallback[]> = new Map();
const riskAlertListeners: Map<string, RiskAlertCallback[]> = new Map();

// ==================== WATCHLIST MANAGEMENT ====================

export class StockMonitoringAgent {
  private pollingInterval: number | null = null;
  private isRunning = false;

  /**
   * Add stock or crypto to watchlist with optional portfolio tracking
   */
  async addToWatchlist(
    userId: string,
    symbol: string,
    threshold: number,
    assetType?: AssetType, // Auto-detect if not provided
    portfolioData?: { quantity: number; boughtPrice: number } // Optional: track investment
  ): Promise<WatchlistItem> {
    // Auto-detect asset type if not provided
    const detectedType = assetType || this.detectAssetType(symbol);
    
    // Validate symbol by fetching current price
    const currentPrice = await this.fetchPrice(symbol, detectedType);
    
    if (!currentPrice) {
      throw new Error(`Invalid ${detectedType} symbol: ${symbol}`);
    }

    // Check if already exists in Firestore
    const exists = await isSymbolInWatchlist(userId, symbol.toUpperCase());
    if (exists) {
      throw new Error(`${symbol} is already in your watchlist`);
    }

    const item: WatchlistItem = {
      id: `${userId}_${symbol}_${Date.now()}`,
      symbol: symbol.toUpperCase(),
      assetType: detectedType,
      threshold,
      lastPrice: currentPrice,
      currentPrice,
      addedAt: new Date(),
      userId,
    };

    // Add to Firestore
    await addWatchlistItem(userId, item);

    // Add portfolio position if provided
    if (portfolioData) {
      const portfolio = this.createPortfolioPosition(
        userId,
        symbol.toUpperCase(),
        detectedType,
        portfolioData.quantity,
        portfolioData.boughtPrice,
        currentPrice
      );
      item.portfolio = portfolio;
      
      // Store in Firestore
      await addPortfolioPosition(userId, portfolio);
    }

    console.log(`✅ Added ${symbol} to watchlist for user ${userId} (threshold: ${threshold}%)`);
    if (portfolioData) {
      console.log(`💼 Portfolio: ${portfolioData.quantity} @ $${portfolioData.boughtPrice}`);
    }

    // Start monitoring if not already running
    if (!this.isRunning) {
      this.startMonitoring();
    }

    return item;
  }

  /**
   * Create portfolio position
   */
  private createPortfolioPosition(
    userId: string,
    symbol: string,
    assetType: AssetType,
    quantity: number,
    boughtPrice: number,
    currentPrice: number
  ): PortfolioPosition {
    const invested = quantity * boughtPrice;
    const currentValue = quantity * currentPrice;
    const profitLoss = currentValue - invested;
    const profitLossPercent = (profitLoss / invested) * 100;
    
    // Calculate risk score
    const { riskLevel, riskScore } = this.calculateRisk(profitLossPercent, assetType);

    return {
      id: `portfolio_${userId}_${symbol}_${Date.now()}`,
      symbol,
      assetType,
      quantity,
      boughtPrice,
      boughtAt: new Date(),
      currentPrice,
      currentValue,
      profitLoss,
      profitLossPercent,
      invested,
      riskLevel,
      riskScore,
      userId,
    };
  }

  /**
   * Calculate risk level based on loss percentage and asset type
   */
  private calculateRisk(profitLossPercent: number, assetType: AssetType): { riskLevel: RiskLevel; riskScore: number } {
    const absLoss = Math.abs(Math.min(0, profitLossPercent));
    
    // Risk thresholds differ for stocks vs crypto
    const thresholds = assetType === 'crypto' 
      ? { low: 10, medium: 20, high: 35, critical: 50 }
      : { low: 5, medium: 10, high: 20, critical: 30 };
    
    let riskLevel: RiskLevel;
    let riskScore: number;
    
    if (absLoss < thresholds.low) {
      riskLevel = 'low';
      riskScore = (absLoss / thresholds.low) * 25;
    } else if (absLoss < thresholds.medium) {
      riskLevel = 'medium';
      riskScore = 25 + ((absLoss - thresholds.low) / (thresholds.medium - thresholds.low)) * 25;
    } else if (absLoss < thresholds.high) {
      riskLevel = 'high';
      riskScore = 50 + ((absLoss - thresholds.medium) / (thresholds.high - thresholds.medium)) * 25;
    } else {
      riskLevel = 'critical';
      riskScore = 75 + Math.min(((absLoss - thresholds.high) / (thresholds.critical - thresholds.high)) * 25, 25);
    }
    
    return { riskLevel, riskScore: Math.min(riskScore, 100) };
  }

  /**
   * Remove stock from watchlist
   */
  async removeFromWatchlist(userId: string, itemId: string): Promise<boolean> {
    try {
      await removeWatchlistItem(userId, itemId);
      console.log(`🗑️ Removed item ${itemId} from watchlist`);
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
  }

  /**
   * Get user's watchlist
   */
  async getWatchlist(userId: string): Promise<WatchlistItem[]> {
    return await getWatchlistItems(userId);
  }

  /**
   * Get all watchlists (admin/monitoring)
   * Note: This now loads from Firestore for each user
   */
  getAllWatchlists(): Map<string, WatchlistItem[]> {
    // For backward compatibility, return empty map
    // Individual user watchlists should be loaded via getWatchlist(userId)
    console.warn('getAllWatchlists is deprecated. Use getWatchlist(userId) instead.');
    return new Map();
  }

  /**
   * Subscribe to price alerts for a user
   */
  subscribeToAlerts(userId: string, callback: AlertCallback): () => void {
    const listeners = alertListeners.get(userId) || [];
    listeners.push(callback);
    alertListeners.set(userId, listeners);

    console.log(`📡 User ${userId} subscribed to alerts`);

    // Return unsubscribe function
    return () => {
      const listeners = alertListeners.get(userId) || [];
      const filtered = listeners.filter(cb => cb !== callback);
      alertListeners.set(userId, filtered);
      console.log(`📴 User ${userId} unsubscribed from alerts`);
    };
  }

  /**
   * Get user's portfolio
   */
  async getPortfolio(userId: string): Promise<PortfolioPosition[]> {
    return await getPortfolioPositions(userId);
  }

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(userId: string): Promise<{
    totalInvested: number;
    totalCurrentValue: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    positions: number;
    highRiskCount: number;
  }> {
    const userPortfolio = await getPortfolioPositions(userId);
    
    const totalInvested = userPortfolio.reduce((sum, p) => sum + p.invested, 0);
    const totalCurrentValue = userPortfolio.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
    const highRiskCount = userPortfolio.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPercent,
      positions: userPortfolio.length,
      highRiskCount,
    };
  }

  /**
   * Subscribe to risk alerts for a user
   */
  subscribeToRiskAlerts(userId: string, callback: RiskAlertCallback): () => void {
    const listeners = riskAlertListeners.get(userId) || [];
    listeners.push(callback);
    riskAlertListeners.set(userId, listeners);

    console.log(`🚨 User ${userId} subscribed to risk alerts`);

    // Return unsubscribe function
    return () => {
      const listeners = riskAlertListeners.get(userId) || [];
      const filtered = listeners.filter(cb => cb !== callback);
      riskAlertListeners.set(userId, filtered);
      console.log(`📴 User ${userId} unsubscribed from risk alerts`);
    };
  }

  /**
   * Register a user for monitoring (loads their watchlist into cache)
   */
  async registerUserForMonitoring(userId: string): Promise<void> {
    activeUserIds.add(userId);
    await this.reloadUserData(userId);
    
    // Start monitoring if not already running
    if (!this.isRunning) {
      this.startMonitoring();
    }
  }

  /**
   * Reload user data from Firestore into cache
   */
  private async reloadUserData(userId: string): Promise<void> {
    const watchlist = await getWatchlistItems(userId);
    const portfolio = await getPortfolioPositions(userId);
    
    watchlistCache.set(userId, watchlist);
    portfolioCache.set(userId, portfolio);
  }

  /**
   * Reload all user data from Firestore
   */
  private async reloadAllUserData(): Promise<void> {
    const promises = Array.from(activeUserIds).map(userId => this.reloadUserData(userId));
    await Promise.all(promises);
  }

  // ==================== PRICE MONITORING ====================

  /**
   * Start monitoring stock prices
   */
  startMonitoring(): void {
    if (this.isRunning) {
      console.log('⚠️ Monitoring already running');
      return;
    }

    console.log('🚀 Starting stock price monitoring...');
    this.isRunning = true;

    // Initial check
    this.checkAllPrices();

    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.checkAllPrices();
    }, POLL_INTERVAL);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Stock price monitoring stopped');
  }

  /**
   * Check prices for all watched assets (stocks & crypto)
   */
  private async checkAllPrices(): Promise<void> {
    // Reload data from Firestore
    await this.reloadAllUserData();
    
    const allWatchlists = Array.from(watchlistCache.values()).flat();
    
    if (allWatchlists.length === 0) {
      console.log('📊 No assets in watchlist, skipping check');
      return;
    }

    // Get unique symbol-type pairs
    const uniqueAssets = Array.from(
      new Map(allWatchlists.map(w => [`${w.symbol}_${w.assetType}`, w])).values()
    );
    
    console.log(`📈 Checking prices for ${uniqueAssets.length} assets (stocks & crypto)...`);

    // Fetch prices in parallel
    const pricePromises = uniqueAssets.map(item => 
      this.fetchPrice(item.symbol, item.assetType)
    );
    const prices = await Promise.all(pricePromises);

    // Update prices and check for alerts
    uniqueAssets.forEach((item, index) => {
      const newPrice = prices[index];
      if (newPrice) {
        this.updatePriceAndCheckAlerts(item.symbol, newPrice);
      }
    });
  }

  /**
   * Update price and check if alert should be triggered
   * Also update portfolio positions and check for risk alerts
   */
  private updatePriceAndCheckAlerts(symbol: string, newPrice: number): void {
    // Store historical data
    const history = historicalData.get(symbol) || [];
    history.push({ price: newPrice, timestamp: new Date() });
    // Keep last 100 data points
    if (history.length > 100) history.shift();
    historicalData.set(symbol, history);

    // Update all watchlist items for this symbol
    watchlistCache.forEach((userWatchlist, userId) => {
      userWatchlist.forEach(item => {
        if (item.symbol === symbol) {
          const oldPrice = item.currentPrice || item.lastPrice;
          
          item.currentPrice = newPrice;

          // Calculate change percentage
          if (oldPrice && oldPrice !== newPrice) {
            const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
            const absChange = Math.abs(changePercent);

            // Check if threshold exceeded
            if (absChange >= item.threshold) {
              const alert: PriceAlert = {
                id: `${Date.now()}_${symbol}`,
                symbol,
                oldPrice,
                newPrice,
                changePercent,
                timestamp: new Date(),
                direction: changePercent > 0 ? 'up' : 'down',
              };

              console.log(`🚨 ALERT: ${symbol} changed ${changePercent.toFixed(2)}% (${oldPrice} → ${newPrice})`);

              // Emit alert to user
              this.emitAlert(userId, alert);

              // Update last price in Firestore to avoid duplicate alerts
              item.lastPrice = newPrice;
              updateWatchlistPrices(item.id, newPrice, newPrice).catch(err => 
                console.error('Error updating watchlist prices:', err)
              );
            }
          }

          // Update portfolio if exists
          if (item.portfolio) {
            this.updatePortfolioPositionData(userId, item.portfolio, newPrice);
          }
        }
      });
    });

    // Update all portfolio positions for this symbol
    portfolioCache.forEach((userPortfolio, userId) => {
      userPortfolio.forEach(position => {
        if (position.symbol === symbol) {
          this.updatePortfolioPositionData(userId, position, newPrice);
        }
      });
    });

    // Update price cache
    priceCache.set(symbol, newPrice);
  }

  /**
   * Update portfolio position with new price and check for risk alerts
   */
  private async updatePortfolioPositionData(userId: string, position: PortfolioPosition, newPrice: number): Promise<void> {
    const oldRiskLevel = position.riskLevel;
    
    // Update position
    position.currentPrice = newPrice;
    position.currentValue = position.quantity * newPrice;
    position.profitLoss = position.currentValue - position.invested;
    position.profitLossPercent = (position.profitLoss / position.invested) * 100;
    
    // Recalculate risk
    const { riskLevel, riskScore } = this.calculateRisk(position.profitLossPercent, position.assetType);
    position.riskLevel = riskLevel;
    position.riskScore = riskScore;

    // Update position in Firestore
    await updatePortfolioPosition(
      position.id,
      newPrice,
      position.currentValue,
      position.profitLoss,
      position.profitLossPercent,
      riskLevel,
      riskScore
    ).catch(err => console.error('Error updating portfolio position:', err));

    // Check if risk level increased to high or critical
    const shouldAlert = (riskLevel === 'high' || riskLevel === 'critical') && 
                       (oldRiskLevel !== riskLevel || Math.abs(position.profitLossPercent) > 15);

    if (shouldAlert) {
      // Generate AI recommendation
      const { reason, recommendation } = await this.generateAIRecommendation(position);

      const riskAlert: RiskAlert = {
        id: `risk_${Date.now()}_${position.symbol}`,
        symbol: position.symbol,
        assetType: position.assetType,
        riskLevel,
        riskScore,
        currentPrice: newPrice,
        boughtPrice: position.boughtPrice,
        profitLoss: position.profitLoss,
        profitLossPercent: position.profitLossPercent,
        reason,
        recommendation,
        timestamp: new Date(),
        severity: riskLevel === 'critical' ? 'critical' : riskLevel === 'high' ? 'danger' : 'warning',
      };

      console.log(`🚨 RISK ALERT: ${position.symbol} is at ${riskLevel} risk (${position.profitLossPercent.toFixed(2)}%)`);
      console.log(`💡 Recommendation: ${recommendation}`);

      this.emitRiskAlert(userId, riskAlert);
    }
  }

  /**
   * Generate AI-powered recommendation using Gemini
   */
  private async generateAIRecommendation(position: PortfolioPosition): Promise<{ reason: string; recommendation: string }> {
    try {
      if (!GEMINI_API_KEY) {
        return this.getFallbackRecommendation(position);
      }

      const prompt = `You are a financial advisor AI. Analyze this investment position and provide advice:

Asset: ${position.symbol} (${position.assetType})
Bought at: $${position.boughtPrice.toFixed(2)}
Current price: $${position.currentPrice?.toFixed(2)}
Quantity: ${position.quantity}
Total invested: $${position.invested.toFixed(2)}
Current value: $${position.currentValue?.toFixed(2)}
Profit/Loss: $${position.profitLoss?.toFixed(2)} (${position.profitLossPercent?.toFixed(2)}%)
Risk Level: ${position.riskLevel}
Risk Score: ${position.riskScore}/100

Provide a JSON response with:
1. "reason": A brief explanation of why this position is at risk (2-3 sentences)
2. "recommendation": A specific action recommendation (Hold/Sell Partial/Sell All/Buy More) with reasoning (2-3 sentences)

Keep it concise and actionable.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        { timeout: 10000 }
      );

      const text = response.data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reason: parsed.reason || 'Position experiencing significant loss',
          recommendation: parsed.recommendation || 'Consider reviewing your position'
        };
      }

      // Fallback if JSON parsing fails
      return {
        reason: 'Position experiencing significant loss',
        recommendation: text.substring(0, 200) || 'Consider reviewing your position and market conditions'
      };

    } catch (error) {
      console.error('AI recommendation failed:', error);
      return this.getFallbackRecommendation(position);
    }
  }

  /**
   * Fallback recommendation without AI
   */
  private getFallbackRecommendation(position: PortfolioPosition): { reason: string; recommendation: string } {
    const lossPercent = Math.abs(position.profitLossPercent || 0);
    
    let reason: string;
    let recommendation: string;

    if (position.riskLevel === 'critical') {
      reason = `${position.symbol} has dropped ${lossPercent.toFixed(1)}% from your buy price, entering critical loss territory. This significant decline may indicate fundamental issues or market-wide volatility.`;
      recommendation = `URGENT: Consider selling to prevent further losses. If you believe in long-term recovery, consider setting a stop-loss at -${Math.min(lossPercent + 5, 60)}% to limit downside risk.`;
    } else if (position.riskLevel === 'high') {
      reason = `${position.symbol} is down ${lossPercent.toFixed(1)}% from your purchase price. This level of loss warrants careful attention and potential action.`;
      recommendation = `Consider selling 25-50% of your position to reduce exposure. Monitor closely for trend reversal signals. Set alerts for further 5% drops.`;
    } else if (position.riskLevel === 'medium') {
      reason = `${position.symbol} is showing moderate volatility with ${lossPercent.toFixed(1)}% loss. This is within normal market fluctuation range.`;
      recommendation = `HOLD: Monitor the position but no immediate action needed. Consider averaging down if fundamentals remain strong.`;
    } else {
      reason = `${position.symbol} is performing within acceptable parameters.`;
      recommendation = `HOLD: Continue monitoring. Position is healthy.`;
    }

    return { reason, recommendation };
  }

  /**
   * Emit risk alert to user's listeners
   */
  private emitRiskAlert(userId: string, alert: RiskAlert): void {
    const listeners = riskAlertListeners.get(userId) || [];
    
    if (listeners.length === 0) {
      console.log(`⚠️ No risk alert listeners for user ${userId}`);
      return;
    }

    console.log(`🚨 Emitting risk alert to ${listeners.length} listener(s) for user ${userId}`);
    
    listeners.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error emitting risk alert:', error);
      }
    });
  }

  /**
   * Emit alert to user's listeners
   */
  private emitAlert(userId: string, alert: PriceAlert): void {
    const listeners = alertListeners.get(userId) || [];
    
    if (listeners.length === 0) {
      console.log(`⚠️ No listeners for user ${userId}, alert not delivered`);
      return;
    }

    console.log(`📢 Emitting alert to ${listeners.length} listener(s) for user ${userId}`);
    
    listeners.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error emitting alert:', error);
      }
    });
  }

  /**
   * Detect asset type based on symbol pattern
   */
  private detectAssetType(symbol: string): AssetType {
    const upperSymbol = symbol.toUpperCase();
    
    // Crypto symbols typically end with USDT, USD, BTC, ETH, etc.
    // or are known crypto pairs
    const cryptoPatterns = [
      /USDT$/,  // Tether pairs (BTCUSDT, ETHUSDT)
      /USDC$/,  // USDC pairs
      /BUSD$/,  // BUSD pairs
      /BTC$/,   // Bitcoin pairs
      /ETH$/,   // Ethereum pairs
    ];
    
    const isCrypto = cryptoPatterns.some(pattern => pattern.test(upperSymbol)) ||
                     ['BTC', 'ETH', 'BITCOIN', 'ETHEREUM', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE', 'DOT', 'MATIC', 'LTC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'XLM', 'ALGO', 'VET', 'ICP'].includes(upperSymbol);
    
    return isCrypto ? 'crypto' : 'stock';
  }

  /**
   * Fetch price for stock or crypto
   */
  private async fetchPrice(symbol: string, assetType: AssetType): Promise<number | null> {
    if (assetType === 'crypto') {
      return this.fetchCryptoPrice(symbol);
    } else {
      return this.fetchStockPrice(symbol);
    }
  }

  /**
   * Fetch stock price from Finnhub API
   */
  private async fetchStockPrice(symbol: string): Promise<number | null> {
    try {
      const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
        params: {
          symbol: symbol.toUpperCase(),
          token: FINNHUB_API_KEY,
        },
        timeout: 5000,
      });

      const data = response.data;
      
      // Finnhub returns { c: currentPrice, h: high, l: low, o: open, pc: previousClose, t: timestamp }
      if (data.c && data.c > 0) {
        return data.c;
      }

      console.warn(`⚠️ Invalid price data for ${symbol}:`, data);
      return null;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Error fetching price for ${symbol}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Fetch crypto price from Finnhub Crypto API
   * Endpoint: /crypto/candle or /forex/candle
   * For simplicity, we'll use Binance API as fallback (free and reliable)
   */
  private async fetchCryptoPrice(symbol: string): Promise<number | null> {
    try {
      // Try Finnhub crypto endpoint first
      // Format: BINANCE:BTCUSDT
      const finnhubSymbol = `BINANCE:${symbol.toUpperCase()}`;
      
      const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
        params: {
          symbol: finnhubSymbol,
          token: FINNHUB_API_KEY,
        },
        timeout: 5000,
      });

      const data = response.data;
      
      if (data.c && data.c > 0) {
        return data.c;
      }

      console.warn(`⚠️ Finnhub crypto API returned invalid data, trying Binance API...`);
      
      // Fallback to Binance public API (no auth required)
      return this.fetchCryptoPriceFromBinance(symbol);

    } catch (error) {
      console.warn(`⚠️ Finnhub crypto API failed, trying Binance API...`);
      return this.fetchCryptoPriceFromBinance(symbol);
    }
  }

  /**
   * Fetch crypto price from Binance public API (fallback)
   */
  private async fetchCryptoPriceFromBinance(symbol: string): Promise<number | null> {
    try {
      // Binance API expects format like BTCUSDT
      const binanceSymbol = symbol.toUpperCase();
      
      const response = await axios.get(`https://api.binance.com/api/v3/ticker/price`, {
        params: {
          symbol: binanceSymbol,
        },
        timeout: 5000,
      });

      const data = response.data;
      
      // Binance returns { symbol: "BTCUSDT", price: "50000.00" }
      if (data.price && parseFloat(data.price) > 0) {
        return parseFloat(data.price);
      }

      console.warn(`⚠️ Invalid crypto price data for ${symbol}:`, data);
      return null;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Error fetching crypto price for ${symbol}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    isRunning: boolean;
    totalWatched: number;
    totalUsers: number;
    symbols: string[];
  } {
    const allWatchlists = Array.from(watchlistCache.values()).flat();
    const symbols = [...new Set(allWatchlists.map(w => w.symbol))];

    return {
      isRunning: this.isRunning,
      totalWatched: allWatchlists.length,
      totalUsers: watchlistCache.size,
      symbols,
    };
  }
}

// Export singleton instance
export const stockMonitoringAgent = new StockMonitoringAgent();

// Auto-start monitoring
if (typeof window !== 'undefined') {
  // Client-side: start monitoring on load
  stockMonitoringAgent.startMonitoring();
}

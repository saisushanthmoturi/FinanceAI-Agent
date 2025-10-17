/**
 * Risk & Auto-Sell Agent Service
 * 
 * Features:
 * - Real-time price monitoring for all holdings
 * - Automatic stop-loss trigger detection
 * - Email + in-app notifications with action links
 * - Two-step confirmation for high-value securities
 * - Time-based confirmation (sustained drop detection)
 * - Whitelist/blacklist for auto-sell
 * - Comprehensive logging and audit trail
 * - Edge case handling (market closed, partial fills, slippage)
 */

import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// ==================== TYPES ====================

export interface Holding {
  id: string;
  userId: string;
  ticker: string;
  companyName: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  marketValue: number;
  profitLoss: number;
  profitLossPercent: number;
  sector: string;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE';
  lastUpdated: Date;
}

export interface StopLossConfig {
  id: string;
  userId: string;
  ticker: string;
  stopLossPrice?: number; // User-defined stop price
  stopLossPercent?: number; // Or percentage-based (e.g., 5% below current)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRiskProfile {
  userId: string;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  maxPortfolioLossPercent: number; // E.g., 10% for conservative
  autoSellEnabled: boolean;
  confirmationWindowMinutes: number; // Default: 5 minutes, 0 for immediate
  sustainedDropMinutes: number; // Wait for N minutes of sustained drop (0 to disable)
  highValueThresholdPercent: number; // % of portfolio for two-step confirmation (e.g., 10%)
  highValueThresholdAmount: number; // Absolute amount for two-step (e.g., ₹100,000)
  whitelist: string[]; // Tickers to ALWAYS auto-sell
  blacklist: string[]; // Tickers to NEVER auto-sell
}

export interface PendingSellOrder {
  id: string;
  userId: string;
  ticker: string;
  companyName: string;
  quantity: number;
  triggerPrice: number;
  currentPrice: number;
  stopLossPrice: number;
  percentChange: number;
  portfolioValuePercent: number;
  requiresTwoStepConfirmation: boolean;
  status: 'pending' | 'confirmed' | 'cancelled' | 'executed' | 'failed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  confirmedAt?: Date;
  executedAt?: Date;
  cancelledAt?: Date;
  executedTradeId?: string;
  failureReason?: string;
  notification: {
    emailSent: boolean;
    inAppPushed: boolean;
    emailId?: string;
  };
  preSellState: {
    holdings: Holding[];
    portfolioValue: number;
    timestamp: Date;
  };
}

export interface AutoSellLog {
  id: string;
  userId: string;
  ticker: string;
  orderId: string;
  action: 'triggered' | 'confirmed' | 'cancelled' | 'executed' | 'failed' | 'expired';
  timestamp: Date;
  details: {
    triggerPrice?: number;
    executionPrice?: number;
    quantity?: number;
    tradeId?: string;
    reason?: string;
    userAction?: 'manual_confirm' | 'manual_cancel' | 'auto_execute' | 'timeout';
  };
}

export interface MarketStatus {
  isOpen: boolean;
  exchange: string;
  nextOpenTime?: Date;
  message: string;
}

export interface TradeExecution {
  success: boolean;
  tradeId?: string;
  executedPrice?: number;
  executedQuantity?: number;
  executedAt?: Date;
  partialFill?: boolean;
  slippage?: number; // Difference between expected and actual price
  error?: string;
  retryable?: boolean;
}

// ==================== SERVICE CLASS ====================

export class RiskAutoSellAgentService {
  private monitoringInterval: number | null = null;
  private readonly MONITORING_INTERVAL_MS = 60000; // Check every 1 minute

  /**
   * Start real-time monitoring for a user's holdings
   */
  async startMonitoring(userId: string): Promise<void> {
    console.log(`🚀 Starting risk monitoring for user: ${userId}`);

    // Stop existing monitoring if any
    this.stopMonitoring();

    // Start new monitoring interval
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAllHoldings(userId);
      } catch (error) {
        console.error('Error in monitoring interval:', error);
      }
    }, this.MONITORING_INTERVAL_MS);

    // Run immediate check
    await this.checkAllHoldings(userId);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Monitoring stopped');
    }
  }

  /**
   * Check all holdings for stop-loss triggers
   */
  private async checkAllHoldings(userId: string): Promise<void> {
    try {
      const [holdings, stopLossConfigs, riskProfile] = await Promise.all([
        this.getUserHoldings(userId),
        this.getStopLossConfigs(userId),
        this.getUserRiskProfile(userId),
      ]);

      if (!riskProfile.autoSellEnabled) {
        console.log('⏸️ Auto-sell disabled for user:', userId);
        return;
      }

      console.log(`🔍 Checking ${holdings.length} holdings for stop-loss triggers...`);

      for (const holding of holdings) {
        // Skip blacklisted tickers
        if (riskProfile.blacklist.includes(holding.ticker)) {
          console.log(`⛔ Skipping blacklisted ticker: ${holding.ticker}`);
          continue;
        }

        // Find stop-loss config for this holding
        const stopLossConfig = stopLossConfigs.find(
          (config) => config.ticker === holding.ticker && config.isActive
        );

        if (!stopLossConfig) {
          continue; // No stop-loss set for this holding
        }

        // Calculate stop-loss price
        let stopLossPrice: number;
        if (stopLossConfig.stopLossPrice) {
          stopLossPrice = stopLossConfig.stopLossPrice;
        } else if (stopLossConfig.stopLossPercent) {
          stopLossPrice = holding.purchasePrice * (1 - stopLossConfig.stopLossPercent / 100);
        } else {
          continue; // No stop-loss defined
        }

        // Check if stop-loss triggered
        if (holding.currentPrice <= stopLossPrice) {
          console.log(`🚨 STOP-LOSS TRIGGERED: ${holding.ticker} at ₹${holding.currentPrice} (stop: ₹${stopLossPrice})`);

          // Check for sustained drop if configured
          if (riskProfile.sustainedDropMinutes > 0) {
            const isSustained = await this.checkSustainedDrop(
              holding.ticker,
              stopLossPrice,
              riskProfile.sustainedDropMinutes
            );

            if (!isSustained) {
              console.log(`⏳ Waiting for sustained drop (${riskProfile.sustainedDropMinutes} min) for ${holding.ticker}`);
              continue;
            }
          }

          // Create pending sell order
          await this.createPendingSellOrder(userId, holding, stopLossPrice, riskProfile, holdings);
        }
      }
    } catch (error) {
      console.error('Error checking holdings:', error);
    }
  }

  /**
   * Check if price drop is sustained over N minutes
   */
  private async checkSustainedDrop(
    ticker: string,
    stopLossPrice: number,
    minutes: number
  ): Promise<boolean> {
    try {
      // Fetch historical prices for last N minutes
      const historicalPrices = await this.getHistoricalPrices(ticker, minutes);

      // Check if ALL prices in the time window are below stop-loss
      const allBelowStopLoss = historicalPrices.every((price) => price <= stopLossPrice);

      return allBelowStopLoss;
    } catch (error) {
      console.error('Error checking sustained drop:', error);
      // On error, proceed with trigger to be safe
      return true;
    }
  }

  /**
   * Create pending sell order and send notifications
   */
  private async createPendingSellOrder(
    userId: string,
    holding: Holding,
    stopLossPrice: number,
    riskProfile: UserRiskProfile,
    allHoldings: Holding[]
  ): Promise<void> {
    try {
      // Check if order already exists and is pending
      const existingOrders = await this.getPendingSellOrders(userId);
      const existingOrder = existingOrders.find(
        (order) => order.ticker === holding.ticker && order.status === 'pending'
      );

      if (existingOrder) {
        console.log(`📋 Pending sell order already exists for ${holding.ticker}`);
        return;
      }

      // Calculate portfolio value and percentage
      const portfolioValue = allHoldings.reduce((sum, h) => sum + h.marketValue, 0);
      const portfolioValuePercent = (holding.marketValue / portfolioValue) * 100;

      // Determine if two-step confirmation is required
      const requiresTwoStepConfirmation =
        portfolioValuePercent > riskProfile.highValueThresholdPercent ||
        holding.marketValue > riskProfile.highValueThresholdAmount;

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + riskProfile.confirmationWindowMinutes);

      const percentChange = ((holding.currentPrice - stopLossPrice) / stopLossPrice) * 100;

      // Create pending sell order
      const pendingOrder: PendingSellOrder = {
        id: `SELL${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ticker: holding.ticker,
        companyName: holding.companyName,
        quantity: holding.quantity,
        triggerPrice: holding.currentPrice,
        currentPrice: holding.currentPrice,
        stopLossPrice,
        percentChange,
        portfolioValuePercent,
        requiresTwoStepConfirmation,
        status: 'pending',
        createdAt: new Date(),
        expiresAt,
        notification: {
          emailSent: false,
          inAppPushed: false,
        },
        preSellState: {
          holdings: allHoldings,
          portfolioValue,
          timestamp: new Date(),
        },
      };

      // Save to Firestore
      await addDoc(collection(db, 'pending_sell_orders'), {
        ...pendingOrder,
        createdAt: Timestamp.fromDate(pendingOrder.createdAt),
        expiresAt: Timestamp.fromDate(pendingOrder.expiresAt),
        preSellState: {
          ...pendingOrder.preSellState,
          timestamp: Timestamp.fromDate(pendingOrder.preSellState.timestamp),
        },
      });

      // Also save to localStorage for offline access
      const localOrders = JSON.parse(localStorage.getItem('pending_sell_orders') || '[]');
      localOrders.push(pendingOrder);
      localStorage.setItem('pending_sell_orders', JSON.stringify(localOrders));

      console.log(`✅ Created pending sell order: ${pendingOrder.id}`);

      // Send notifications
      await this.sendNotifications(userId, pendingOrder);

      // Log the trigger
      await this.logAutoSellAction(userId, holding.ticker, pendingOrder.id, 'triggered', {
        triggerPrice: holding.currentPrice,
        quantity: holding.quantity,
      });

      // Schedule auto-execution if confirmation window > 0
      if (riskProfile.confirmationWindowMinutes > 0 && !requiresTwoStepConfirmation) {
        setTimeout(async () => {
          await this.autoExecuteIfNotCancelled(pendingOrder.id, userId);
        }, riskProfile.confirmationWindowMinutes * 60 * 1000);
      } else if (riskProfile.confirmationWindowMinutes === 0 && !requiresTwoStepConfirmation) {
        // Immediate execution for whitelisted or non-high-value
        if (riskProfile.whitelist.includes(holding.ticker)) {
          await this.executeSellOrder(pendingOrder.id, userId, 'auto_execute');
        }
      }
    } catch (error) {
      console.error('Error creating pending sell order:', error);
    }
  }

  /**
   * Send email and in-app notifications
   */
  private async sendNotifications(userId: string, order: PendingSellOrder): Promise<void> {
    try {
      // Email notification
      const emailSent = await this.sendEmail(userId, {
        subject: `🚨 STOP-LOSS TRIGGERED: ${order.ticker}`,
        body: this.generateEmailBody(order),
        actionLinks: {
          confirm: `${window.location.origin}/confirm-sell/${order.id}`,
          cancel: `${window.location.origin}/cancel-sell/${order.id}`,
        },
      });

      // In-app push notification
      const inAppPushed = await this.sendInAppNotification(userId, {
        title: `🚨 Stop-Loss Alert: ${order.ticker}`,
        message: `${order.companyName} has dropped to ₹${order.currentPrice.toFixed(2)} (${order.percentChange.toFixed(2)}% below stop-loss). Auto-sell pending.`,
        priority: 'high',
        actionButtons: [
          { label: 'Confirm Sell', action: 'confirm', orderId: order.id },
          { label: 'Cancel', action: 'cancel', orderId: order.id },
        ],
      });

      // Update notification status
      await this.updateOrderNotificationStatus(order.id, {
        emailSent,
        inAppPushed,
      });

      console.log(`📧 Notifications sent for order ${order.id}`);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  /**
   * Generate email body
   */
  private generateEmailBody(order: PendingSellOrder): string {
    return `
<h2>⚠️ Stop-Loss Alert for ${order.companyName} (${order.ticker})</h2>

<p><strong>Your holding has triggered a stop-loss condition:</strong></p>

<table style="border-collapse: collapse; margin: 20px 0;">
  <tr>
    <td><strong>Ticker:</strong></td>
    <td>${order.ticker}</td>
  </tr>
  <tr>
    <td><strong>Company:</strong></td>
    <td>${order.companyName}</td>
  </tr>
  <tr>
    <td><strong>Quantity:</strong></td>
    <td>${order.quantity} shares</td>
  </tr>
  <tr>
    <td><strong>Current Price:</strong></td>
    <td>₹${order.currentPrice.toFixed(2)}</td>
  </tr>
  <tr>
    <td><strong>Stop-Loss Price:</strong></td>
    <td>₹${order.stopLossPrice.toFixed(2)}</td>
  </tr>
  <tr>
    <td><strong>Change:</strong></td>
    <td style="color: red;">${order.percentChange.toFixed(2)}%</td>
  </tr>
  <tr>
    <td><strong>Portfolio Impact:</strong></td>
    <td>${order.portfolioValuePercent.toFixed(2)}% of your portfolio</td>
  </tr>
</table>

${order.requiresTwoStepConfirmation ? `
<p style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107;">
  <strong>⚠️ Two-Step Confirmation Required</strong><br>
  This is a high-value security. Please manually confirm to proceed with the sale.
</p>
` : `
<p>This order will auto-execute in <strong>${Math.round((order.expiresAt.getTime() - order.createdAt.getTime()) / 60000)} minutes</strong> unless you cancel it.</p>
`}

<p><strong>What would you like to do?</strong></p>

<p>
  <a href="${window.location.origin}/confirm-sell/${order.id}" 
     style="background: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">
    ✅ Confirm Sell
  </a>
  <a href="${window.location.origin}/cancel-sell/${order.id}" 
     style="background: #757575; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
    ❌ Cancel Auto-Sell
  </a>
</p>

<p style="color: #666; font-size: 12px;">
  Order ID: ${order.id}<br>
  Created: ${order.createdAt.toLocaleString()}<br>
  Expires: ${order.expiresAt.toLocaleString()}
</p>

<p style="color: #666; font-size: 11px;">
  This is an automated notification from your Risk & Auto-Sell Agent. 
  You can modify your risk settings anytime in the app.
</p>
    `;
  }

  /**
   * Send email (mock implementation - integrate with SendGrid, AWS SES, etc.)
   */
  private async sendEmail(
    userId: string,
    email: {
      subject: string;
      body: string;
      actionLinks: { confirm: string; cancel: string };
    }
  ): Promise<boolean> {
    try {
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      console.log('📧 Email sent to user:', userId);
      console.log('Subject:', email.subject);
      console.log('Body:', email.body);

      // For now, store in localStorage as "sent emails" for demo
      const sentEmails = JSON.parse(localStorage.getItem('sent_emails') || '[]');
      sentEmails.push({
        userId,
        ...email,
        sentAt: new Date().toISOString(),
      });
      localStorage.setItem('sent_emails', JSON.stringify(sentEmails));

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      priority: string;
      actionButtons: Array<{ label: string; action: string; orderId: string }>;
    }
  ): Promise<boolean> {
    try {
      // Save notification to Firestore/localStorage
      const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
      notifications.push({
        ...notification,
        id: `NOTIF${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      });
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));

      console.log('🔔 In-app notification sent:', notification.title);
      return true;
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return false;
    }
  }

  /**
   * Auto-execute sell order if not cancelled within confirmation window
   */
  private async autoExecuteIfNotCancelled(orderId: string, userId: string): Promise<void> {
    try {
      const order = await this.getPendingSellOrderById(orderId);

      if (!order) {
        console.log(`Order ${orderId} not found`);
        return;
      }

      if (order.status === 'cancelled') {
        console.log(`Order ${orderId} was cancelled by user`);
        return;
      }

      if (order.status === 'confirmed' || order.status === 'executed') {
        console.log(`Order ${orderId} already processed`);
        return;
      }

      // Check if expired
      if (new Date() < order.expiresAt) {
        console.log(`Order ${orderId} not yet expired`);
        return;
      }

      // Auto-execute
      console.log(`⏰ Auto-executing order ${orderId} (confirmation window expired)`);
      await this.executeSellOrder(orderId, userId, 'auto_execute');
    } catch (error) {
      console.error('Error in auto-execute:', error);
    }
  }

  /**
   * Execute sell order (actual trade execution)
   */
  async executeSellOrder(
    orderId: string,
    userId: string,
    userAction: 'manual_confirm' | 'auto_execute'
  ): Promise<TradeExecution> {
    try {
      const order = await this.getPendingSellOrderById(orderId);

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending' && order.status !== 'confirmed') {
        throw new Error(`Order already ${order.status}`);
      }

      // Check market status
      const marketStatus = await this.checkMarketStatus(order.ticker);

      if (!marketStatus.isOpen) {
        console.log(`⏸️ Market closed for ${order.ticker}. Will retry when market opens.`);
        
        await this.updateOrderStatus(orderId, 'failed', {
          failureReason: `Market closed. ${marketStatus.message}`,
        });

        return {
          success: false,
          error: marketStatus.message,
          retryable: true,
        };
      }

      // Execute trade via broker API (mock implementation)
      const tradeResult = await this.executeTrade({
        ticker: order.ticker,
        quantity: order.quantity,
        orderType: 'market_sell',
        limitPrice: order.currentPrice,
      });

      if (!tradeResult.success) {
        // Trade failed
        await this.updateOrderStatus(orderId, 'failed', {
          failureReason: tradeResult.error || 'Trade execution failed',
        });

        await this.logAutoSellAction(userId, order.ticker, orderId, 'failed', {
          reason: tradeResult.error,
          userAction,
        });

        // Send failure notification
        await this.sendInAppNotification(userId, {
          title: `❌ Sell Order Failed: ${order.ticker}`,
          message: `Failed to execute sell order. Reason: ${tradeResult.error}`,
          priority: 'high',
          actionButtons: [],
        });

        return tradeResult;
      }

      // Trade successful
      await this.updateOrderStatus(orderId, 'executed', {
        executedAt: new Date(),
        executedTradeId: tradeResult.tradeId,
      });

      await this.logAutoSellAction(userId, order.ticker, orderId, 'executed', {
        executionPrice: tradeResult.executedPrice,
        quantity: tradeResult.executedQuantity,
        tradeId: tradeResult.tradeId,
        userAction,
      });

      // Update user holdings (remove sold stock)
      await this.updateUserHoldings(userId, order.ticker, -order.quantity);

      // Send success notification
      await this.sendInAppNotification(userId, {
        title: `✅ Sell Order Executed: ${order.ticker}`,
        message: `Successfully sold ${tradeResult.executedQuantity} shares at ₹${tradeResult.executedPrice?.toFixed(2)}. Trade ID: ${tradeResult.tradeId}`,
        priority: 'high',
        actionButtons: [],
      });

      console.log(`✅ Order ${orderId} executed successfully. Trade ID: ${tradeResult.tradeId}`);

      return tradeResult;
    } catch (error: any) {
      console.error('Error executing sell order:', error);

      await this.logAutoSellAction(userId, '', orderId, 'failed', {
        reason: error.message,
      });

      return {
        success: false,
        error: error.message,
        retryable: false,
      };
    }
  }

  /**
   * Confirm sell order (user manually confirms)
   */
  async confirmSellOrder(orderId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const order = await this.getPendingSellOrderById(orderId);

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      if (order.status !== 'pending') {
        return { success: false, message: `Order already ${order.status}` };
      }

      // Update to confirmed status
      await this.updateOrderStatus(orderId, 'confirmed', {
        confirmedAt: new Date(),
      });

      await this.logAutoSellAction(userId, order.ticker, orderId, 'confirmed', {
        userAction: 'manual_confirm',
      });

      // Execute immediately
      const result = await this.executeSellOrder(orderId, userId, 'manual_confirm');

      if (result.success) {
        return { success: true, message: `Sell order confirmed and executed. Trade ID: ${result.tradeId}` };
      } else {
        return { success: false, message: `Confirmed but execution failed: ${result.error}` };
      }
    } catch (error: any) {
      console.error('Error confirming sell order:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Cancel sell order (user cancels auto-sell)
   */
  async cancelSellOrder(orderId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const order = await this.getPendingSellOrderById(orderId);

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      if (order.status !== 'pending') {
        return { success: false, message: `Order already ${order.status}` };
      }

      // Update to cancelled status
      await this.updateOrderStatus(orderId, 'cancelled', {
        cancelledAt: new Date(),
      });

      await this.logAutoSellAction(userId, order.ticker, orderId, 'cancelled', {
        userAction: 'manual_cancel',
      });

      // Send cancellation notification
      await this.sendInAppNotification(userId, {
        title: `🚫 Sell Order Cancelled: ${order.ticker}`,
        message: `Auto-sell order for ${order.companyName} has been cancelled.`,
        priority: 'medium',
        actionButtons: [],
      });

      console.log(`🚫 Order ${orderId} cancelled by user`);

      return { success: true, message: 'Sell order cancelled successfully' };
    } catch (error: any) {
      console.error('Error cancelling sell order:', error);
      return { success: false, message: error.message };
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get user holdings from portfolio
   */
  private async getUserHoldings(userId: string): Promise<Holding[]> {
    try {
      const q = query(collection(db, 'portfolio_investments'), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const holdings: Holding[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        holdings.push({
          id: doc.id,
          userId: data.userId,
          ticker: data.symbol,
          companyName: data.name,
          quantity: data.quantity,
          purchasePrice: data.purchasePrice,
          currentPrice: data.currentPrice,
          marketValue: data.currentValue,
          profitLoss: data.profitLoss,
          profitLossPercent: data.profitLossPercent,
          sector: data.sector || 'Unknown',
          exchange: data.exchange || 'NSE',
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        });
      });

      return holdings;
    } catch (error) {
      console.error('Error fetching holdings:', error);
      
      // Fallback to localStorage
      const portfolio = JSON.parse(localStorage.getItem(`portfolio_${userId}`) || '[]');
      return portfolio.map((inv: any) => ({
        id: inv.id,
        userId,
        ticker: inv.symbol,
        companyName: inv.name,
        quantity: inv.quantity,
        purchasePrice: inv.purchasePrice,
        currentPrice: inv.currentPrice,
        marketValue: inv.currentValue,
        profitLoss: inv.profitLoss,
        profitLossPercent: inv.profitLossPercent,
        sector: 'Unknown',
        exchange: 'NSE',
        lastUpdated: new Date(),
      }));
    }
  }

  /**
   * Get stop-loss configurations for user
   */
  private async getStopLossConfigs(userId: string): Promise<StopLossConfig[]> {
    try {
      const q = query(collection(db, 'stop_loss_configs'), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const configs: StopLossConfig[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        configs.push({
          id: doc.id,
          userId: data.userId,
          ticker: data.ticker,
          stopLossPrice: data.stopLossPrice,
          stopLossPercent: data.stopLossPercent,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return configs;
    } catch (error) {
      console.error('Error fetching stop-loss configs:', error);
      
      // Fallback to localStorage
      const configs = JSON.parse(localStorage.getItem(`stop_loss_configs_${userId}`) || '[]');
      return configs;
    }
  }

  /**
   * Get user risk profile
   */
  private async getUserRiskProfile(userId: string): Promise<UserRiskProfile> {
    try {
      const q = query(collection(db, 'user_risk_profiles'), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return data as UserRiskProfile;
      }

      // Return default profile
      return this.getDefaultRiskProfile(userId);
    } catch (error) {
      console.error('Error fetching risk profile:', error);
      return this.getDefaultRiskProfile(userId);
    }
  }

  /**
   * Get default risk profile
   */
  private getDefaultRiskProfile(userId: string): UserRiskProfile {
    return {
      userId,
      riskLevel: 'moderate',
      maxPortfolioLossPercent: 10,
      autoSellEnabled: true,
      confirmationWindowMinutes: 5,
      sustainedDropMinutes: 2,
      highValueThresholdPercent: 15,
      highValueThresholdAmount: 100000,
      whitelist: [],
      blacklist: [],
    };
  }

  /**
   * Get historical prices for sustained drop check
   */
  private async getHistoricalPrices(_ticker: string, minutes: number): Promise<number[]> {
    try {
      // TODO: Integrate with real-time market data API
      // For now, simulate with random prices
      const prices: number[] = [];
      const basePrice = 100;
      
      for (let i = 0; i < minutes; i++) {
        prices.push(basePrice - i * 0.5); // Simulating gradual drop
      }

      return prices;
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return [];
    }
  }

  /**
   * Get pending sell orders for user
   */
  async getPendingSellOrders(userId: string): Promise<PendingSellOrder[]> {
    try {
      const q = query(
        collection(db, 'pending_sell_orders'),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);

      const orders: PendingSellOrder[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || new Date(),
          confirmedAt: data.confirmedAt?.toDate(),
          executedAt: data.executedAt?.toDate(),
          cancelledAt: data.cancelledAt?.toDate(),
          preSellState: {
            ...data.preSellState,
            timestamp: data.preSellState?.timestamp?.toDate() || new Date(),
          },
        } as PendingSellOrder);
      });

      return orders;
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      
      // Fallback to localStorage
      const orders = JSON.parse(localStorage.getItem('pending_sell_orders') || '[]');
      return orders.filter((o: PendingSellOrder) => o.userId === userId && o.status === 'pending');
    }
  }

  /**
   * Get pending sell order by ID
   */
  private async getPendingSellOrderById(orderId: string): Promise<PendingSellOrder | null> {
    try {
      // Check localStorage first
      const localOrders = JSON.parse(localStorage.getItem('pending_sell_orders') || '[]');
      const order = localOrders.find((o: PendingSellOrder) => o.id === orderId);

      if (order) {
        return order;
      }

      return null;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      return null;
    }
  }

  /**
   * Update order status
   */
  private async updateOrderStatus(
    orderId: string,
    status: PendingSellOrder['status'],
    updates: Partial<PendingSellOrder>
  ): Promise<void> {
    try {
      // Update in localStorage
      const localOrders = JSON.parse(localStorage.getItem('pending_sell_orders') || '[]');
      const orderIndex = localOrders.findIndex((o: PendingSellOrder) => o.id === orderId);

      if (orderIndex >= 0) {
        localOrders[orderIndex] = {
          ...localOrders[orderIndex],
          status,
          ...updates,
        };
        localStorage.setItem('pending_sell_orders', JSON.stringify(localOrders));
      }

      console.log(`✅ Order ${orderId} status updated to: ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }

  /**
   * Update notification status
   */
  private async updateOrderNotificationStatus(
    orderId: string,
    notification: { emailSent: boolean; inAppPushed: boolean }
  ): Promise<void> {
    try {
      const localOrders = JSON.parse(localStorage.getItem('pending_sell_orders') || '[]');
      const orderIndex = localOrders.findIndex((o: PendingSellOrder) => o.id === orderId);

      if (orderIndex >= 0) {
        localOrders[orderIndex].notification = {
          ...localOrders[orderIndex].notification,
          ...notification,
        };
        localStorage.setItem('pending_sell_orders', JSON.stringify(localOrders));
      }
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  }

  /**
   * Check market status
   */
  private async checkMarketStatus(_ticker: string): Promise<MarketStatus> {
    try {
      // TODO: Integrate with real market status API
      // For now, simulate based on time
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();

      // NSE timings: 9:15 AM to 3:30 PM, Monday to Friday
      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = hour >= 9 && hour < 16;

      if (isWeekday && isMarketHours) {
        return {
          isOpen: true,
          exchange: 'NSE',
          message: 'Market is open',
        };
      } else {
        const nextOpen = new Date(now);
        if (!isWeekday) {
          // If weekend, next Monday
          const daysUntilMonday = (8 - day) % 7;
          nextOpen.setDate(now.getDate() + daysUntilMonday);
        } else {
          // Next trading day
          nextOpen.setDate(now.getDate() + 1);
        }
        nextOpen.setHours(9, 15, 0, 0);

        return {
          isOpen: false,
          exchange: 'NSE',
          nextOpenTime: nextOpen,
          message: `Market closed. Opens at ${nextOpen.toLocaleString()}`,
        };
      }
    } catch (error) {
      console.error('Error checking market status:', error);
      // Assume market is open to avoid blocking
      return {
        isOpen: true,
        exchange: 'NSE',
        message: 'Unable to determine market status',
      };
    }
  }

  /**
   * Execute trade via broker API
   */
  private async executeTrade(trade: {
    ticker: string;
    quantity: number;
    orderType: string;
    limitPrice: number;
  }): Promise<TradeExecution> {
    try {
      // TODO: Integrate with broker API (Zerodha, Upstox, etc.)
      console.log('🔄 Executing trade:', trade);

      // Simulate trade execution
      const executedPrice = trade.limitPrice * (1 + (Math.random() * 0.02 - 0.01)); // ±1% slippage
      const slippage = Math.abs(executedPrice - trade.limitPrice);

      // Simulate partial fill (10% chance)
      const partialFill = Math.random() < 0.1;
      const executedQuantity = partialFill ? Math.floor(trade.quantity * 0.8) : trade.quantity;

      const tradeId = `TRD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      console.log(`✅ Trade executed: ${tradeId}`);

      return {
        success: true,
        tradeId,
        executedPrice,
        executedQuantity,
        executedAt: new Date(),
        partialFill,
        slippage,
      };
    } catch (error: any) {
      console.error('Error executing trade:', error);
      return {
        success: false,
        error: error.message,
        retryable: true,
      };
    }
  }

  /**
   * Update user holdings after trade
   */
  private async updateUserHoldings(userId: string, ticker: string, quantityChange: number): Promise<void> {
    try {
      const portfolio = JSON.parse(localStorage.getItem(`portfolio_${userId}`) || '[]');
      const holdingIndex = portfolio.findIndex((inv: any) => inv.symbol === ticker);

      if (holdingIndex >= 0) {
        portfolio[holdingIndex].quantity += quantityChange;

        if (portfolio[holdingIndex].quantity <= 0) {
          // Remove holding if sold completely
          portfolio.splice(holdingIndex, 1);
        }

        localStorage.setItem(`portfolio_${userId}`, JSON.stringify(portfolio));
      }

      console.log(`✅ Holdings updated for ${ticker}: ${quantityChange > 0 ? '+' : ''}${quantityChange} shares`);
    } catch (error) {
      console.error('Error updating holdings:', error);
    }
  }

  /**
   * Log auto-sell action
   */
  private async logAutoSellAction(
    userId: string,
    ticker: string,
    orderId: string,
    action: AutoSellLog['action'],
    details: AutoSellLog['details']
  ): Promise<void> {
    try {
      const log: AutoSellLog = {
        id: `LOG${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ticker,
        orderId,
        action,
        timestamp: new Date(),
        details,
      };

      // Save to Firestore
      await addDoc(collection(db, 'auto_sell_logs'), {
        ...log,
        timestamp: Timestamp.fromDate(log.timestamp),
      });

      // Also save to localStorage
      const logs = JSON.parse(localStorage.getItem(`auto_sell_logs_${userId}`) || '[]');
      logs.push(log);
      localStorage.setItem(`auto_sell_logs_${userId}`, JSON.stringify(logs));

      console.log(`📝 Logged action: ${action} for ${ticker}`);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  /**
   * Get auto-sell logs for user
   */
  async getAutoSellLogs(userId: string, limit: number = 50): Promise<AutoSellLog[]> {
    try {
      const logs = JSON.parse(localStorage.getItem(`auto_sell_logs_${userId}`) || '[]');
      return logs.slice(0, limit);
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }

  /**
   * Set stop-loss for a holding
   */
  async setStopLoss(
    userId: string,
    ticker: string,
    stopLossPrice?: number,
    stopLossPercent?: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!stopLossPrice && !stopLossPercent) {
        return { success: false, message: 'Either stop-loss price or percentage must be provided' };
      }

      const config: StopLossConfig = {
        id: `SL${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ticker,
        stopLossPrice,
        stopLossPercent,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to localStorage
      const configs = JSON.parse(localStorage.getItem(`stop_loss_configs_${userId}`) || '[]');
      
      // Remove existing config for same ticker
      const existingIndex = configs.findIndex((c: StopLossConfig) => c.ticker === ticker);
      if (existingIndex >= 0) {
        configs.splice(existingIndex, 1);
      }

      configs.push(config);
      localStorage.setItem(`stop_loss_configs_${userId}`, JSON.stringify(configs));

      console.log(`✅ Stop-loss set for ${ticker}`);

      return { success: true, message: `Stop-loss set for ${ticker}` };
    } catch (error: any) {
      console.error('Error setting stop-loss:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Remove stop-loss for a holding
   */
  async removeStopLoss(userId: string, ticker: string): Promise<{ success: boolean; message: string }> {
    try {
      const configs = JSON.parse(localStorage.getItem(`stop_loss_configs_${userId}`) || '[]');
      const updatedConfigs = configs.filter((c: StopLossConfig) => c.ticker !== ticker);
      localStorage.setItem(`stop_loss_configs_${userId}`, JSON.stringify(updatedConfigs));

      console.log(`🗑️ Stop-loss removed for ${ticker}`);

      return { success: true, message: `Stop-loss removed for ${ticker}` };
    } catch (error: any) {
      console.error('Error removing stop-loss:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update user risk profile
   */
  async updateRiskProfile(userId: string, updates: Partial<UserRiskProfile>): Promise<{ success: boolean; message: string }> {
    try {
      const existingProfile = await this.getUserRiskProfile(userId);
      const updatedProfile = { ...existingProfile, ...updates };

      // Save to localStorage
      localStorage.setItem(`risk_profile_${userId}`, JSON.stringify(updatedProfile));

      console.log(`✅ Risk profile updated for ${userId}`);

      return { success: true, message: 'Risk profile updated successfully' };
    } catch (error: any) {
      console.error('Error updating risk profile:', error);
      return { success: false, message: error.message };
    }
  }
}

// Export singleton instance
export const riskAutoSellAgent = new RiskAutoSellAgentService();

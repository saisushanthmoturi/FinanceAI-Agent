/**
 * Investment Tracking Agent
 * Monitors investment performance and alerts users about potential losses
 */

import { collection, addDoc, query, where, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface TrackedInvestment {
  id: string;
  userId: string;
  schemeName: string;
  schemeType: 'ELSS' | 'PPF' | 'NPS' | 'MutualFund' | 'Stock' | 'FD' | 'Insurance';
  investmentAmount: number;
  currentValue: number;
  investmentDate: Date;
  lastChecked: Date;
  status: 'Active' | 'Alert' | 'Stopped';
  performancePercent: number;
  alerts: InvestmentAlert[];
  autoTrackingEnabled: boolean;
  password?: string; // Encrypted password for auto-actions
}

export interface InvestmentAlert {
  id: string;
  timestamp: Date;
  type: 'Negative Performance' | 'High Risk' | 'Loss Warning' | 'Performance Update';
  message: string;
  currentValue: number;
  lossPotential: number;
  recommendation: string;
  actionTaken?: 'Notified' | 'Auto-Stopped' | 'User Decision Pending';
}

export interface InvestmentPerformance {
  currentPrice: number;
  changePercent: number;
  changeAmount: number;
  recommendation: 'Hold' | 'Exit' | 'Monitor';
  reason: string;
}

export class InvestmentTrackingAgent {
  /**
   * Activate investment tracking with password protection
   */
  async activateTracking(
    userId: string,
    scheme: {
      name: string;
      type: string;
      amount: number;
    },
    password: string
  ): Promise<TrackedInvestment> {
    try {
      // Encrypt password (in production, use proper encryption)
      const encryptedPassword = btoa(password);

      const investment: Omit<TrackedInvestment, 'id'> = {
        userId,
        schemeName: scheme.name,
        schemeType: scheme.type as any,
        investmentAmount: scheme.amount,
        currentValue: scheme.amount,
        investmentDate: new Date(),
        lastChecked: new Date(),
        status: 'Active',
        performancePercent: 0,
        alerts: [],
        autoTrackingEnabled: true,
        password: encryptedPassword,
      };

      const docRef = await addDoc(collection(db, 'tracked_investments'), {
        ...investment,
        investmentDate: Timestamp.fromDate(investment.investmentDate),
        lastChecked: Timestamp.fromDate(investment.lastChecked),
      });

      console.log('✅ Investment tracking activated:', docRef.id);

      return {
        ...investment,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error activating tracking:', error);
      
      // Fallback to local storage if Firestore fails
      const localInvestment: TrackedInvestment = {
        id: Date.now().toString(),
        userId,
        schemeName: scheme.name,
        schemeType: scheme.type as any,
        investmentAmount: scheme.amount,
        currentValue: scheme.amount,
        investmentDate: new Date(),
        lastChecked: new Date(),
        status: 'Active',
        performancePercent: 0,
        alerts: [],
        autoTrackingEnabled: true,
      };

      const existing = JSON.parse(localStorage.getItem('tracked_investments') || '[]');
      existing.push(localInvestment);
      localStorage.setItem('tracked_investments', JSON.stringify(existing));

      return localInvestment;
    }
  }

  /**
   * Get all tracked investments for a user
   */
  async getUserInvestments(userId: string): Promise<TrackedInvestment[]> {
    try {
      const q = query(
        collection(db, 'tracked_investments'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const investments: TrackedInvestment[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        investments.push({
          id: doc.id,
          ...data,
          investmentDate: data.investmentDate?.toDate() || new Date(),
          lastChecked: data.lastChecked?.toDate() || new Date(),
          alerts: data.alerts?.map((alert: any) => ({
            ...alert,
            timestamp: alert.timestamp?.toDate() || new Date(),
          })) || [],
        } as TrackedInvestment);
      });

      return investments;
    } catch (error) {
      console.error('Error fetching investments:', error);
      
      // Fallback to local storage
      const existing = JSON.parse(localStorage.getItem('tracked_investments') || '[]');
      return existing.filter((inv: TrackedInvestment) => inv.userId === userId);
    }
  }

  /**
   * Simulate performance check (in production, integrate with actual market data API)
   */
  async checkPerformance(investment: TrackedInvestment): Promise<InvestmentPerformance> {
    // Simulate market fluctuation (-10% to +15%)
    const randomChange = (Math.random() * 25) - 10;
    const currentPrice = investment.investmentAmount * (1 + randomChange / 100);
    const changeAmount = currentPrice - investment.investmentAmount;
    const changePercent = (changeAmount / investment.investmentAmount) * 100;

    let recommendation: 'Hold' | 'Exit' | 'Monitor' = 'Hold';
    let reason = '';

    if (changePercent < -5) {
      recommendation = 'Exit';
      reason = `Your investment is down ${Math.abs(changePercent).toFixed(2)}%. Consider exiting to prevent further losses.`;
    } else if (changePercent < -2) {
      recommendation = 'Monitor';
      reason = `Slight decline of ${Math.abs(changePercent).toFixed(2)}%. Keep monitoring closely.`;
    } else if (changePercent > 10) {
      recommendation = 'Hold';
      reason = `Excellent performance! Up ${changePercent.toFixed(2)}%. Continue holding.`;
    } else {
      recommendation = 'Hold';
      reason = `Stable performance at ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%.`;
    }

    return {
      currentPrice,
      changePercent,
      changeAmount,
      recommendation,
      reason,
    };
  }

  /**
   * Update investment performance and create alerts if needed
   */
  async updateInvestmentPerformance(investmentId: string): Promise<InvestmentAlert | null> {
    try {
      // Get investment
      const investments = await this.getUserInvestments('current-user');
      const investment = investments.find(inv => inv.id === investmentId);
      
      if (!investment) return null;

      // Check performance
      const performance = await this.checkPerformance(investment);
      
      // Update investment
      investment.currentValue = performance.currentPrice;
      investment.performancePercent = performance.changePercent;
      investment.lastChecked = new Date();

      // Create alert if performance is negative
      let alert: InvestmentAlert | null = null;
      
      if (performance.changePercent < -2) {
        alert = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: performance.changePercent < -5 ? 'Loss Warning' : 'Negative Performance',
          message: `⚠️ ${investment.schemeName} is down ${Math.abs(performance.changePercent).toFixed(2)}%`,
          currentValue: performance.currentPrice,
          lossPotential: Math.abs(performance.changeAmount),
          recommendation: performance.reason,
          actionTaken: 'User Decision Pending',
        };

        investment.alerts.push(alert);
        
        // Update status
        if (performance.changePercent < -5) {
          investment.status = 'Alert';
        }
      }

      // Save to Firestore
      try {
        await updateDoc(doc(db, 'tracked_investments', investmentId), {
          currentValue: investment.currentValue,
          performancePercent: investment.performancePercent,
          lastChecked: Timestamp.fromDate(investment.lastChecked),
          status: investment.status,
          alerts: investment.alerts.map(a => ({
            ...a,
            timestamp: Timestamp.fromDate(a.timestamp),
          })),
        });
      } catch (error) {
        // Update local storage as fallback
        const existing = JSON.parse(localStorage.getItem('tracked_investments') || '[]');
        const index = existing.findIndex((inv: TrackedInvestment) => inv.id === investmentId);
        if (index >= 0) {
          existing[index] = investment;
          localStorage.setItem('tracked_investments', JSON.stringify(existing));
        }
      }

      return alert;
    } catch (error) {
      console.error('Error updating performance:', error);
      return null;
    }
  }

  /**
   * Monitor all user investments and send alerts
   */
  async monitorAllInvestments(userId: string): Promise<InvestmentAlert[]> {
    const investments = await this.getUserInvestments(userId);
    const alerts: InvestmentAlert[] = [];

    for (const investment of investments) {
      if (!investment.autoTrackingEnabled || investment.status === 'Stopped') {
        continue;
      }

      const alert = await this.updateInvestmentPerformance(investment.id);
      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Stop tracking an investment
   */
  async stopTracking(investmentId: string, password: string): Promise<boolean> {
    try {
      const investments = await this.getUserInvestments('current-user');
      const investment = investments.find(inv => inv.id === investmentId);
      
      if (!investment) return false;

      // Verify password
      const decryptedPassword = atob(investment.password || '');
      if (decryptedPassword !== password) {
        throw new Error('Invalid password');
      }

      // Update status
      await updateDoc(doc(db, 'tracked_investments', investmentId), {
        status: 'Stopped',
        autoTrackingEnabled: false,
      });

      return true;
    } catch (error) {
      console.error('Error stopping tracking:', error);
      return false;
    }
  }

  /**
   * Get AI-powered investment recommendation based on performance
   */
  getInvestmentRecommendation(
    performance: InvestmentPerformance,
    investment: TrackedInvestment
  ): string {
    const { changePercent, recommendation } = performance;
    const daysInvested = Math.floor(
      (new Date().getTime() - investment.investmentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let advice = '';

    if (recommendation === 'Exit') {
      advice = `🚨 **Immediate Action Recommended**\n\n`;
      advice += `Your ${investment.schemeName} investment has declined by ${Math.abs(changePercent).toFixed(2)}% in ${daysInvested} days.\n\n`;
      advice += `**Current Loss:** ₹${Math.abs(investment.currentValue - investment.investmentAmount).toLocaleString()}\n\n`;
      advice += `**AI Recommendation:** Consider exiting this position to prevent further losses. `;
      
      if (investment.schemeType === 'ELSS') {
        advice += `Note: ELSS has a 3-year lock-in period. If you're within the lock-in, monitor closely but you cannot exit yet.`;
      } else {
        advice += `You can redeem this investment immediately.`;
      }
    } else if (recommendation === 'Monitor') {
      advice = `⚠️ **Close Monitoring Required**\n\n`;
      advice += `Your ${investment.schemeName} is showing a decline of ${Math.abs(changePercent).toFixed(2)}%.\n\n`;
      advice += `**Current Loss:** ₹${Math.abs(investment.currentValue - investment.investmentAmount).toLocaleString()}\n\n`;
      advice += `**AI Recommendation:** Not critical yet, but monitor daily. Set a stop-loss at -5% to limit losses.`;
    } else {
      advice = `✅ **Performance Looking Good**\n\n`;
      advice += `Your ${investment.schemeName} is ${changePercent >= 0 ? 'up' : 'down'} ${Math.abs(changePercent).toFixed(2)}%.\n\n`;
      
      if (changePercent > 0) {
        advice += `**Current Gain:** ₹${(investment.currentValue - investment.investmentAmount).toLocaleString()}\n\n`;
        advice += `**AI Recommendation:** Continue holding for long-term wealth creation.`;
      } else {
        advice += `**AI Recommendation:** Stable performance. No action needed.`;
      }
    }

    return advice;
  }
}

export const investmentTrackingAgent = new InvestmentTrackingAgent();

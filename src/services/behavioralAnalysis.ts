import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Transaction, BehaviorPattern, Nudge } from '../types';
import { geminiService } from './gemini';

/**
 * Behavioral Analysis Service
 * Detects emotional spending patterns and behavioral biases
 */
export class BehavioralAnalysisService {
  /**
   * Analyze transactions for behavioral patterns
   */
  async analyzeTransactions(
    userId: string,
    transactions: Transaction[]
  ): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];

    // Detect impulse spending
    const impulsePattern = this.detectImpulsive(transactions);
    if (impulsePattern) {
      patterns.push({ ...impulsePattern, userId });
    }

    // Detect FOMO (Fear of Missing Out)
    const fomoPattern = this.detectFOMO(transactions);
    if (fomoPattern) {
      patterns.push({ ...fomoPattern, userId });
    }

    // Detect panic spending/selling
    const panicPattern = this.detectPanic(transactions);
    if (panicPattern) {
      patterns.push({ ...panicPattern, userId });
    }

    // Store patterns in Firestore
    for (const pattern of patterns) {
      await addDoc(collection(db, 'behavior_patterns'), {
        ...pattern,
        detectedAt: Timestamp.now(),
      });
    }

    return patterns;
  }

  /**
   * Detect impulsive spending patterns
   */
  private detectImpulsive(transactions: Transaction[]): BehaviorPattern | null {
    // Look for high-value transactions made late at night or on weekends
    const impulseTransactions = transactions.filter(t => {
      const hour = t.date.getHours();
      const day = t.date.getDay();
      return (
        t.type === 'debit' &&
        t.amount > 5000 &&
        ((hour >= 22 || hour <= 5) || (day === 0 || day === 6)) &&
        !t.category.toLowerCase().includes('essential')
      );
    });

    if (impulseTransactions.length >= 3) {
      return {
        userId: '',
        type: 'impulse',
        frequency: impulseTransactions.length,
        averageAmount: impulseTransactions.reduce((sum, t) => sum + t.amount, 0) / impulseTransactions.length,
        triggers: ['Late night', 'Weekend', 'High-value non-essential'],
        detectedAt: new Date(),
        severity: impulseTransactions.length > 5 ? 'high' : 'medium',
      };
    }

    return null;
  }

  /**
   * Detect FOMO patterns (following trends, peer pressure)
   */
  private detectFOMO(transactions: Transaction[]): BehaviorPattern | null {
    // Look for multiple similar purchases in short time (e.g., crypto, stocks during hype)
    const trendingCategories = ['crypto', 'stocks', 'investment', 'luxury'];
    const fomoTransactions = transactions.filter(t => {
      return trendingCategories.some(cat => 
        t.category.toLowerCase().includes(cat) || 
        t.description.toLowerCase().includes(cat)
      );
    });

    // Check if multiple purchases within a week
    const weeklyGroups = new Map<string, Transaction[]>();
    fomoTransactions.forEach(t => {
      const weekKey = `${t.date.getFullYear()}-${Math.floor(t.date.getMonth() / 7)}`;
      if (!weeklyGroups.has(weekKey)) {
        weeklyGroups.set(weekKey, []);
      }
      weeklyGroups.get(weekKey)!.push(t);
    });

    const fomoWeeks = Array.from(weeklyGroups.values()).filter(group => group.length >= 3);

    if (fomoWeeks.length > 0) {
      return {
        userId: '',
        type: 'fomo',
        frequency: fomoWeeks.length,
        averageAmount: fomoTransactions.reduce((sum, t) => sum + t.amount, 0) / fomoTransactions.length,
        triggers: ['Market hype', 'Peer influence', 'Trending investments'],
        detectedAt: new Date(),
        severity: fomoWeeks.length > 2 ? 'high' : 'medium',
      };
    }

    return null;
  }

  /**
   * Detect panic behavior (stress-induced decisions)
   */
  private detectPanic(transactions: Transaction[]): BehaviorPattern | null {
    // Look for sudden large withdrawals or liquidations
    const panicTransactions = transactions.filter(t => {
      return t.amount > 50000 && t.type === 'debit' &&
        (t.description.toLowerCase().includes('withdraw') ||
         t.description.toLowerCase().includes('sell') ||
         t.description.toLowerCase().includes('liquidate'));
    });

    if (panicTransactions.length >= 2) {
      return {
        userId: '',
        type: 'panic',
        frequency: panicTransactions.length,
        averageAmount: panicTransactions.reduce((sum, t) => sum + t.amount, 0) / panicTransactions.length,
        triggers: ['Market downturn', 'Financial stress', 'Emotional decision'],
        detectedAt: new Date(),
        severity: panicTransactions.length > 3 ? 'high' : 'medium',
      };
    }

    return null;
  }

  /**
   * Generate proactive nudges based on patterns
   */
  async generateNudges(
    userId: string,
    patterns: BehaviorPattern[],
    currentTransaction?: Transaction
  ): Promise<Nudge[]> {
    const nudges: Nudge[] = [];

    for (const pattern of patterns) {
      let nudge: Nudge | null = null;

      switch (pattern.type) {
        case 'impulse':
          nudge = await this.createImpulseNudge(userId, pattern);
          break;
        case 'fomo':
          nudge = await this.createFOMONudge(userId, pattern);
          break;
        case 'panic':
          nudge = await this.createPanicNudge(userId, pattern);
          break;
      }

      if (nudge) {
        nudges.push(nudge);
        
        // Save to Firestore
        await addDoc(collection(db, 'nudges'), {
          ...nudge,
          shownAt: null,
          dismissed: false,
        });
      }
    }

    // Check for cooling-off period nudge
    if (currentTransaction && currentTransaction.amount > 10000) {
      const coolingOffNudge = await this.createCoolingOffNudge(userId, currentTransaction);
      nudges.push(coolingOffNudge);
    }

    return nudges;
  }

  /**
   * Create impulse spending nudge
   */
  private async createImpulseNudge(userId: string, pattern: BehaviorPattern): Promise<Nudge> {
    const message = `We noticed you tend to make high-value purchases late at night or on weekends. Consider waiting 24 hours before making purchases over ₹5,000 to ensure they align with your goals.`;
    
    const messageHindi = await geminiService.translate(message, 'Hindi');

    return {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      type: 'suggestion',
      message,
      messageHindi,
      relatedBehavior: pattern,
      shown: false,
      dismissed: false,
    };
  }

  /**
   * Create FOMO nudge
   */
  private async createFOMONudge(userId: string, pattern: BehaviorPattern): Promise<Nudge> {
    const message = `It looks like you've been making several trending investments recently. Remember: Don't invest based on hype. Research thoroughly and invest based on your long-term goals.`;
    
    const messageHindi = await geminiService.translate(message, 'Hindi');

    return {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      type: 'warning',
      message,
      messageHindi,
      relatedBehavior: pattern,
      shown: false,
      dismissed: false,
    };
  }

  /**
   * Create panic nudge
   */
  private async createPanicNudge(userId: string, pattern: BehaviorPattern): Promise<Nudge> {
    const message = `We detected sudden large withdrawals. Market downturns are temporary. Panic selling often leads to losses. Consider speaking with a financial advisor before making major decisions.`;
    
    const messageHindi = await geminiService.translate(message, 'Hindi');

    return {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      type: 'warning',
      message,
      messageHindi,
      relatedBehavior: pattern,
      shown: false,
      dismissed: false,
    };
  }

  /**
   * Create cooling-off period nudge
   */
  private async createCoolingOffNudge(userId: string, transaction: Transaction): Promise<Nudge> {
    const message = `Large purchase detected: ₹${transaction.amount.toLocaleString('en-IN')}. Take a moment to think: Is this essential? Does it align with your financial goals? You have 24 hours to cancel if needed.`;
    
    const messageHindi = await geminiService.translate(message, 'Hindi');

    return {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      type: 'cooling_off',
      message,
      messageHindi,
      shown: false,
      dismissed: false,
    };
  }

  /**
   * Get user's behavior patterns
   */
  async getUserPatterns(userId: string): Promise<BehaviorPattern[]> {
    const q = query(
      collection(db, 'behavior_patterns'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const patterns: BehaviorPattern[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      patterns.push({
        ...data,
        detectedAt: data.detectedAt.toDate(),
      } as BehaviorPattern);
    });

    return patterns;
  }
}

export const behavioralAnalysisService = new BehavioralAnalysisService();

/**
 * Activity Logger Service
 * Logs user activities and system events to Firebase Firestore
 * Provides audit trail for security and compliance
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const ActivityType = {
  // Authentication activities
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTERED: 'USER_REGISTERED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  
  // Profile activities
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PROFILE_VIEWED: 'PROFILE_VIEWED',
  
  // Financial activities
  ACCOUNT_LINKED: 'ACCOUNT_LINKED',
  ACCOUNT_UNLINKED: 'ACCOUNT_UNLINKED',
  TRANSACTION_VIEWED: 'TRANSACTION_VIEWED',
  PORTFOLIO_VIEWED: 'PORTFOLIO_VIEWED',
  PORTFOLIO_UPDATED: 'PORTFOLIO_UPDATED',
  
  // Stock monitoring activities
  STOCK_ADDED: 'STOCK_ADDED',
  STOCK_REMOVED: 'STOCK_REMOVED',
  RISK_ALERT_TRIGGERED: 'RISK_ALERT_TRIGGERED',
  RISK_ALERT_ACKNOWLEDGED: 'RISK_ALERT_ACKNOWLEDGED',
  AUTO_SELL_EXECUTED: 'AUTO_SELL_EXECUTED',
  
  // AI and automation activities
  AI_RECOMMENDATION_RECEIVED: 'AI_RECOMMENDATION_RECEIVED',
  AI_RECOMMENDATION_ACCEPTED: 'AI_RECOMMENDATION_ACCEPTED',
  AI_RECOMMENDATION_REJECTED: 'AI_RECOMMENDATION_REJECTED',
  AGENT_CREATED: 'AGENT_CREATED',
  AGENT_EXECUTED: 'AGENT_EXECUTED',
  AGENT_DISABLED: 'AGENT_DISABLED',
  TAX_OPTIMIZATION_GENERATED: 'TAX_OPTIMIZATION_GENERATED',
  
  // Security activities
  SUSPICIOUS_ACTIVITY_DETECTED: 'SUSPICIOUS_ACTIVITY_DETECTED',
  SECURITY_ALERT: 'SECURITY_ALERT',
  TWO_FACTOR_ENABLED: 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED: 'TWO_FACTOR_DISABLED',
  
  // Data access activities
  DATA_EXPORTED: 'DATA_EXPORTED',
  DATA_IMPORTED: 'DATA_IMPORTED',
  SENSITIVE_DATA_ACCESSED: 'SENSITIVE_DATA_ACCESSED',
  
  // Settings activities
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  NOTIFICATION_PREFERENCE_CHANGED: 'NOTIFICATION_PREFERENCE_CHANGED',
  
  // Error and system events
  ERROR_OCCURRED: 'ERROR_OCCURRED',
  SYSTEM_EVENT: 'SYSTEM_EVENT',
} as const;

export type ActivityType = typeof ActivityType[keyof typeof ActivityType];

export interface ActivityLog {
  id?: string;
  userId: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log a user activity
 */
export const logActivity = async (activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const activityData = {
      ...activity,
      timestamp: serverTimestamp(),
      ipAddress: activity.ipAddress || await getClientIP(),
      userAgent: activity.userAgent || navigator.userAgent,
      severity: activity.severity || getSeverityForActivityType(activity.type),
    };

    await addDoc(collection(db, 'activityLogs'), activityData);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('📝 Activity logged:', activity.type, activity.description);
    }
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to prevent breaking the main flow
  }
};

/**
 * Get user activity history
 */
export const getUserActivityHistory = async (
  userId: string,
  limitCount: number = 50
): Promise<ActivityLog[]> => {
  try {
    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const activities: ActivityLog[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        description: data.description,
        timestamp: data.timestamp?.toDate() || new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
        severity: data.severity,
      });
    });

    return activities;
  } catch (error) {
    console.error('Failed to get activity history:', error);
    throw new Error('Failed to retrieve activity history');
  }
};

/**
 * Get activities by type
 */
export const getActivitiesByType = async (
  userId: string,
  activityType: ActivityType,
  limitCount: number = 20
): Promise<ActivityLog[]> => {
  try {
    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      where('type', '==', activityType),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const activities: ActivityLog[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        description: data.description,
        timestamp: data.timestamp?.toDate() || new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
        severity: data.severity,
      });
    });

    return activities;
  } catch (error) {
    console.error('Failed to get activities by type:', error);
    throw new Error('Failed to retrieve activities');
  }
};

/**
 * Get critical security activities
 */
export const getSecurityActivities = async (
  userId: string,
  limitCount: number = 50
): Promise<ActivityLog[]> => {
  try {
    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      where('severity', 'in', ['high', 'critical']),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const activities: ActivityLog[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        description: data.description,
        timestamp: data.timestamp?.toDate() || new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
        severity: data.severity,
      });
    });

    return activities;
  } catch (error) {
    console.error('Failed to get security activities:', error);
    throw new Error('Failed to retrieve security activities');
  }
};

/**
 * Determine severity level based on activity type
 */
const getSeverityForActivityType = (type: ActivityType): 'low' | 'medium' | 'high' | 'critical' => {
  const criticalActivities: ActivityType[] = [
    ActivityType.SUSPICIOUS_ACTIVITY_DETECTED,
    ActivityType.SECURITY_ALERT,
    ActivityType.AUTO_SELL_EXECUTED,
  ];

  const highActivities: ActivityType[] = [
    ActivityType.PASSWORD_CHANGED,
    ActivityType.ACCOUNT_LINKED,
    ActivityType.ACCOUNT_UNLINKED,
    ActivityType.TWO_FACTOR_ENABLED,
    ActivityType.TWO_FACTOR_DISABLED,
    ActivityType.DATA_EXPORTED,
    ActivityType.SENSITIVE_DATA_ACCESSED,
  ];

  const mediumActivities: ActivityType[] = [
    ActivityType.USER_LOGIN,
    ActivityType.USER_LOGOUT,
    ActivityType.PROFILE_UPDATED,
    ActivityType.RISK_ALERT_TRIGGERED,
    ActivityType.AGENT_EXECUTED,
  ];

  if (criticalActivities.includes(type)) return 'critical';
  if (highActivities.includes(type)) return 'high';
  if (mediumActivities.includes(type)) return 'medium';
  return 'low';
};

/**
 * Get client IP address (best effort)
 * In production, this should be handled by backend
 */
const getClientIP = async (): Promise<string> => {
  try {
    // This is a simple implementation
    // In production, use a proper IP detection service or get from backend
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Log error with context
 */
export const logError = async (
  userId: string,
  error: Error,
  context?: Record<string, any>
): Promise<void> => {
  await logActivity({
    userId,
    type: ActivityType.ERROR_OCCURRED,
    description: error.message,
    metadata: {
      errorName: error.name,
      errorStack: error.stack,
      ...context,
    },
    severity: 'high',
  });
};

/**
 * Log security alert
 */
export const logSecurityAlert = async (
  userId: string,
  alertType: string,
  details: Record<string, any>
): Promise<void> => {
  await logActivity({
    userId,
    type: ActivityType.SECURITY_ALERT,
    description: `Security alert: ${alertType}`,
    metadata: details,
    severity: 'critical',
  });
};

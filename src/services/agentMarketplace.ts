/**
 * AI Agent Marketplace Service
 * 
 * Features:
 * - Create and manage autonomous financial agents
 * - Risk & Sell Agent - Auto-sell at high risk
 * - Smart Rebalancing Agent - Rebalance portfolio
 * - Tax Loss Harvesting Agent - Optimize taxes
 * - Dividend Reinvestment Agent - Auto-reinvest dividends
 * - Agent execution engine with user consent
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logActivity, ActivityType } from './activityLogger';
import { sendEmail } from './emailService';

export type AgentType = 
  | 'risk_and_sell'
  | 'smart_rebalancing'
  | 'tax_loss_harvesting'
  | 'dividend_reinvestment'
  | 'stop_loss'
  | 'take_profit';

export type AgentStatus = 'active' | 'inactive' | 'paused' | 'error';
export type ExecutionMode = 'auto' | 'notify' | 'ask_permission';

export interface AgentConfig {
  // Risk & Sell Agent
  riskThreshold?: number; // Trigger at this risk score (0-100)
  maxLossPercent?: number; // Auto-sell if loss exceeds this %
  emailBeforeSell?: boolean; // Email user before selling
  waitTimeMinutes?: number; // Wait time before auto-sell
  
  // Smart Rebalancing Agent
  targetAllocation?: Record<string, number>; // Symbol -> target %
  rebalanceThreshold?: number; // Rebalance if drift > %
  
  // Tax Loss Harvesting Agent
  minLossForHarvest?: number; // Min loss % to harvest
  reinvestInSimilar?: boolean; // Reinvest in similar asset
  
  // Stop Loss / Take Profit
  stopLossPercent?: number;
  takeProfitPercent?: number;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  executionMode: ExecutionMode;
  config: AgentConfig;
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
  successCount: number;
  errorCount: number;
  totalSaved?: number; // Money saved/earned by agent
}

export interface AgentExecution {
  id: string;
  agentId: string;
  userId: string;
  agentType: AgentType;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  action: string; // What the agent did
  details: string; // Detailed explanation
  recommendation: string; // AI recommendation
  requiresApproval: boolean;
  approvedAt?: Date;
  executedAt?: Date;
  result?: any;
  error?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

const AGENTS_COLLECTION = 'agents';
const EXECUTIONS_COLLECTION = 'agent_executions';

/**
 * Create a new agent
 */
export async function createAgent(
  userId: string,
  type: AgentType,
  name: string,
  config: AgentConfig,
  executionMode: ExecutionMode = 'notify'
): Promise<Agent> {
  try {
    const agentId = `agent_${userId}_${type}_${Date.now()}`;
    
    const agent: Agent = {
      id: agentId,
      userId,
      name,
      type,
      description: getAgentDescription(type),
      status: 'inactive',
      executionMode,
      config,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      successCount: 0,
      errorCount: 0,
      totalSaved: 0,
    };

    await setDoc(doc(db, AGENTS_COLLECTION, agentId), {
      ...agent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.AGENT_CREATED,
      description: `Created ${name} agent`,
      metadata: {
        agentId,
        agentType: type,
        executionMode,
      },
    });

    console.log(`✅ Created agent: ${name}`);
    return agent;
  } catch (error) {
    console.error('Error creating agent:', error);
    throw new Error('Failed to create agent');
  }
}

/**
 * Activate an agent
 */
export async function activateAgent(userId: string, agentId: string): Promise<void> {
  try {
    const agentRef = doc(db, AGENTS_COLLECTION, agentId);
    const agentDoc = await getDoc(agentRef);

    if (!agentDoc.exists()) {
      throw new Error('Agent not found');
    }

    const agent = agentDoc.data() as Agent;

    if (agent.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await updateDoc(agentRef, {
      status: 'active',
      updatedAt: serverTimestamp(),
    });

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.AGENT_EXECUTED,
      description: `Activated ${agent.name} agent`,
      metadata: {
        agentId,
        agentType: agent.type,
      },
    });

    // Send confirmation email
    await sendEmail(
      userId,
      'Agent Activated',
      `Your ${agent.name} agent has been activated and is now monitoring your portfolio.`,
      `<h2>Agent Activated</h2><p>Your <strong>${agent.name}</strong> agent is now active.</p>`
    );

    console.log(`✅ Activated agent: ${agent.name}`);
  } catch (error) {
    console.error('Error activating agent:', error);
    throw new Error('Failed to activate agent');
  }
}

/**
 * Deactivate an agent
 */
export async function deactivateAgent(userId: string, agentId: string): Promise<void> {
  try {
    const agentRef = doc(db, AGENTS_COLLECTION, agentId);
    const agentDoc = await getDoc(agentRef);

    if (!agentDoc.exists()) {
      throw new Error('Agent not found');
    }

    const agent = agentDoc.data() as Agent;

    if (agent.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await updateDoc(agentRef, {
      status: 'inactive',
      updatedAt: serverTimestamp(),
    });

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.AGENT_DISABLED,
      description: `Deactivated ${agent.name} agent`,
      metadata: {
        agentId,
        agentType: agent.type,
      },
    });

    console.log(`⏸️ Deactivated agent: ${agent.name}`);
  } catch (error) {
    console.error('Error deactivating agent:', error);
    throw new Error('Failed to deactivate agent');
  }
}

/**
 * Get all agents for a user
 */
export async function getUserAgents(userId: string): Promise<Agent[]> {
  try {
    const q = query(
      collection(db, AGENTS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const agents: Agent[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      agents.push({
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastExecutedAt: data.lastExecutedAt?.toDate(),
      } as Agent);
    });

    return agents;
  } catch (error) {
    console.error('Error getting user agents:', error);
    return [];
  }
}

/**
 * Get agent by ID
 */
export async function getAgent(agentId: string): Promise<Agent | null> {
  try {
    const agentDoc = await getDoc(doc(db, AGENTS_COLLECTION, agentId));

    if (!agentDoc.exists()) {
      return null;
    }

    const data = agentDoc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastExecutedAt: data.lastExecutedAt?.toDate(),
    } as Agent;
  } catch (error) {
    console.error('Error getting agent:', error);
    return null;
  }
}

/**
 * Delete an agent
 */
export async function deleteAgent(userId: string, agentId: string): Promise<void> {
  try {
    const agentRef = doc(db, AGENTS_COLLECTION, agentId);
    const agentDoc = await getDoc(agentRef);

    if (!agentDoc.exists()) {
      throw new Error('Agent not found');
    }

    const agent = agentDoc.data() as Agent;

    if (agent.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await deleteDoc(agentRef);

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.AGENT_DISABLED,
      description: `Deleted ${agent.name} agent`,
      metadata: {
        agentId,
        agentType: agent.type,
      },
    });

    console.log(`🗑️ Deleted agent: ${agent.name}`);
  } catch (error) {
    console.error('Error deleting agent:', error);
    throw new Error('Failed to delete agent');
  }
}

/**
 * Create an agent execution record
 */
export async function createAgentExecution(
  agentId: string,
  userId: string,
  agentType: AgentType,
  action: string,
  details: string,
  recommendation: string,
  requiresApproval: boolean,
  metadata: Record<string, any> = {}
): Promise<AgentExecution> {
  try {
    const executionId = `exec_${agentId}_${Date.now()}`;

    const execution: AgentExecution = {
      id: executionId,
      agentId,
      userId,
      agentType,
      status: requiresApproval ? 'pending' : 'executing',
      action,
      details,
      recommendation,
      requiresApproval,
      metadata,
      createdAt: new Date(),
    };

    await setDoc(doc(db, EXECUTIONS_COLLECTION, executionId), {
      ...execution,
      createdAt: serverTimestamp(),
    });

    console.log(`📋 Created agent execution: ${action}`);
    return execution;
  } catch (error) {
    console.error('Error creating agent execution:', error);
    throw new Error('Failed to create agent execution');
  }
}

/**
 * Get pending executions for a user
 */
export async function getPendingExecutions(userId: string): Promise<AgentExecution[]> {
  try {
    const q = query(
      collection(db, EXECUTIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    const executions: AgentExecution[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      executions.push({
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        approvedAt: data.approvedAt?.toDate(),
        executedAt: data.executedAt?.toDate(),
      } as AgentExecution);
    });

    return executions;
  } catch (error) {
    console.error('Error getting pending executions:', error);
    return [];
  }
}

/**
 * Approve an agent execution
 */
export async function approveExecution(userId: string, executionId: string): Promise<void> {
  try {
    const execRef = doc(db, EXECUTIONS_COLLECTION, executionId);
    const execDoc = await getDoc(execRef);

    if (!execDoc.exists()) {
      throw new Error('Execution not found');
    }

    const execution = execDoc.data() as AgentExecution;

    if (execution.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await updateDoc(execRef, {
      status: 'executing',
      approvedAt: serverTimestamp(),
    });

    console.log(`✅ Approved execution: ${execution.action}`);
  } catch (error) {
    console.error('Error approving execution:', error);
    throw new Error('Failed to approve execution');
  }
}

/**
 * Cancel an agent execution
 */
export async function cancelExecution(userId: string, executionId: string): Promise<void> {
  try {
    const execRef = doc(db, EXECUTIONS_COLLECTION, executionId);
    const execDoc = await getDoc(execRef);

    if (!execDoc.exists()) {
      throw new Error('Execution not found');
    }

    const execution = execDoc.data() as AgentExecution;

    if (execution.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await updateDoc(execRef, {
      status: 'cancelled',
    });

    console.log(`❌ Cancelled execution: ${execution.action}`);
  } catch (error) {
    console.error('Error cancelling execution:', error);
    throw new Error('Failed to cancel execution');
  }
}

/**
 * Get agent description based on type
 */
function getAgentDescription(type: AgentType): string {
  const descriptions: Record<AgentType, string> = {
    risk_and_sell: 'Automatically monitors portfolio risk and sells positions at high risk to prevent losses. Sends email notifications before auto-selling.',
    smart_rebalancing: 'Maintains target portfolio allocation by automatically rebalancing when drift exceeds threshold.',
    tax_loss_harvesting: 'Identifies and harvests tax losses to offset gains while maintaining portfolio exposure.',
    dividend_reinvestment: 'Automatically reinvests dividends to compound returns over time.',
    stop_loss: 'Sets stop-loss orders to limit downside risk on individual positions.',
    take_profit: 'Automatically takes profits when positions reach target gains.',
  };

  return descriptions[type] || 'Custom financial agent';
}

/**
 * Get available agent templates
 */
export function getAgentTemplates(): Array<{
  type: AgentType;
  name: string;
  description: string;
  icon: string;
  defaultConfig: AgentConfig;
}> {
  return [
    {
      type: 'risk_and_sell',
      name: 'Risk & Sell Agent',
      description: 'Auto-sell positions at high risk with email notifications',
      icon: '🚨',
      defaultConfig: {
        riskThreshold: 75,
        maxLossPercent: 20,
        emailBeforeSell: true,
        waitTimeMinutes: 30,
      },
    },
    {
      type: 'smart_rebalancing',
      name: 'Smart Rebalancing',
      description: 'Maintain optimal portfolio allocation automatically',
      icon: '⚖️',
      defaultConfig: {
        targetAllocation: {},
        rebalanceThreshold: 5,
      },
    },
    {
      type: 'tax_loss_harvesting',
      name: 'Tax Loss Harvesting',
      description: 'Optimize taxes by harvesting losses strategically',
      icon: '💰',
      defaultConfig: {
        minLossForHarvest: 3,
        reinvestInSimilar: true,
      },
    },
    {
      type: 'dividend_reinvestment',
      name: 'Dividend Reinvestment',
      description: 'Auto-reinvest dividends for compound growth',
      icon: '📈',
      defaultConfig: {},
    },
    {
      type: 'stop_loss',
      name: 'Stop Loss Agent',
      description: 'Limit downside with automatic stop-loss orders',
      icon: '🛑',
      defaultConfig: {
        stopLossPercent: 10,
      },
    },
    {
      type: 'take_profit',
      name: 'Take Profit Agent',
      description: 'Lock in gains automatically at target levels',
      icon: '🎯',
      defaultConfig: {
        takeProfitPercent: 25,
      },
    },
  ];
}

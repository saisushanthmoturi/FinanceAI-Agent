/**
 * Risk & Sell Agent Executor
 * 
 * Monitors portfolio for high-risk positions and automatically sells them
 * with user consent based on agent configuration
 */

import { getPortfolioPositions, updatePortfolioPosition } from './watchlistService';
import { getUserAgents, createAgentExecution, getAgent } from './agentMarketplace';
import { sendRiskAlertEmail, sendAutoSellEmail, sendAgentApprovalEmail } from './emailService';
import { logActivity, ActivityType } from './activityLogger';
import type { PortfolioPosition } from './stockMonitoringAgent';
import type { Agent, AgentExecution } from './agentMarketplace';

/**
 * Execute Risk & Sell Agent logic
 * Checks portfolio for high-risk positions and takes action based on agent config
 */
export async function executeRiskAndSellAgent(userId: string, agent: Agent): Promise<void> {
  try {
    console.log(`🤖 Executing Risk & Sell Agent for user ${userId}`);

    // Get user's portfolio
    const portfolio = await getPortfolioPositions(userId);

    if (portfolio.length === 0) {
      console.log('No portfolio positions to monitor');
      return;
    }

    // Get agent config
    const config = agent.config;
    const riskThreshold = config.riskThreshold || 75;
    const maxLossPercent = config.maxLossPercent || 20;
    const emailBeforeSell = config.emailBeforeSell !== false;
    const waitTimeMinutes = config.waitTimeMinutes || 30;

    // Find high-risk positions
    const highRiskPositions = portfolio.filter(
      (pos) => pos.riskScore >= riskThreshold || Math.abs(pos.profitLossPercent || 0) >= maxLossPercent
    );

    if (highRiskPositions.length === 0) {
      console.log('No high-risk positions found');
      return;
    }

    console.log(`Found ${highRiskPositions.length} high-risk positions`);

    // Process each high-risk position
    for (const position of highRiskPositions) {
      await processHighRiskPosition(userId, agent, position, {
        riskThreshold,
        maxLossPercent,
        emailBeforeSell,
        waitTimeMinutes,
      });
    }
  } catch (error) {
    console.error('Error executing Risk & Sell Agent:', error);
  }
}

/**
 * Process a single high-risk position
 */
async function processHighRiskPosition(
  userId: string,
  agent: Agent,
  position: PortfolioPosition,
  config: {
    riskThreshold: number;
    maxLossPercent: number;
    emailBeforeSell: boolean;
    waitTimeMinutes: number;
  }
): Promise<void> {
  const { symbol, riskLevel, riskScore, profitLossPercent, currentPrice, quantity, profitLoss } = position;

  console.log(`Processing high-risk position: ${symbol} (Risk: ${riskLevel}, Score: ${riskScore})`);

  // Generate AI recommendation
  const recommendation = generateSellRecommendation(position);

  // Determine action based on execution mode
  if (agent.executionMode === 'notify') {
    // Just send email notification
    await sendRiskAlertEmail(
      userId,
      symbol,
      riskLevel,
      profitLossPercent || 0,
      recommendation
    );

    await logActivity({
      userId,
      type: ActivityType.RISK_ALERT_TRIGGERED,
      description: `Risk alert sent for ${symbol} at ${riskLevel} risk`,
      severity: riskLevel === 'critical' ? 'critical' : 'high',
      metadata: {
        symbol,
        riskLevel,
        riskScore,
        profitLossPercent,
        agentId: agent.id,
      },
    });
  } else if (agent.executionMode === 'ask_permission') {
    // Create execution record requiring approval
    const action = `Sell ${quantity} shares of ${symbol} at $${currentPrice?.toFixed(2)}`;
    const details = `${symbol} is at ${riskLevel} risk (score: ${riskScore}/100) with a loss of ${profitLossPercent?.toFixed(2)}%. Agent recommends selling to prevent further losses.`;

    const execution = await createAgentExecution(
      agent.id,
      userId,
      'risk_and_sell',
      action,
      details,
      recommendation,
      true,
      {
        symbol,
        quantity,
        currentPrice,
        riskLevel,
        riskScore,
        profitLossPercent,
      }
    );

    // Send approval email
    await sendAgentApprovalEmail(
      userId,
      agent.name,
      action,
      details,
      recommendation,
      `${window.location.origin}/agents/approvals` // Link to approval page
    );

    await logActivity({
      userId,
      type: ActivityType.RISK_ALERT_TRIGGERED,
      description: `Approval requested for selling ${symbol}`,
      severity: 'high',
      metadata: {
        symbol,
        executionId: execution.id,
        agentId: agent.id,
      },
    });
  } else if (agent.executionMode === 'auto') {
    // Auto-sell with email notification
    if (config.emailBeforeSell) {
      // Send warning email first
      await sendRiskAlertEmail(
        userId,
        symbol,
        riskLevel,
        profitLossPercent || 0,
        `URGENT: ${symbol} will be automatically sold in ${config.waitTimeMinutes} minutes unless you cancel.`
      );

      await logActivity({
        userId,
        type: ActivityType.RISK_ALERT_TRIGGERED,
        description: `Auto-sell warning sent for ${symbol} (${config.waitTimeMinutes} min wait)`,
        severity: 'critical',
        metadata: {
          symbol,
          waitTimeMinutes: config.waitTimeMinutes,
          agentId: agent.id,
        },
      });

      // Wait for specified time (in production, use a scheduled job)
      // For now, we'll create a pending execution that can be processed later
      await createAgentExecution(
        agent.id,
        userId,
        'risk_and_sell',
        `Auto-sell ${quantity} shares of ${symbol}`,
        `Scheduled auto-sell after ${config.waitTimeMinutes} minute warning period`,
        recommendation,
        false,
        {
          symbol,
          quantity,
          currentPrice,
          scheduledFor: new Date(Date.now() + config.waitTimeMinutes * 60 * 1000),
          riskLevel,
          riskScore,
        }
      );
    } else {
      // Immediate auto-sell
      await executeAutoSell(userId, agent, position, recommendation);
    }
  }
}

/**
 * Execute auto-sell of a position
 */
async function executeAutoSell(
  userId: string,
  agent: Agent,
  position: PortfolioPosition,
  recommendation: string
): Promise<void> {
  const { symbol, quantity, currentPrice, profitLoss, riskLevel, riskScore } = position;

  console.log(`🚨 AUTO-SELLING: ${quantity} shares of ${symbol} at $${currentPrice}`);

  // In a real system, this would interface with a brokerage API
  // For now, we'll simulate the sell and update records

  const sellPrice = currentPrice || 0;
  const reason = `Position at ${riskLevel} risk (score: ${riskScore}/100). Auto-sold to prevent further losses.`;

  // Send confirmation email
  await sendAutoSellEmail(
    userId,
    symbol,
    quantity,
    sellPrice,
    profitLoss || 0,
    reason
  );

  // Log the auto-sell
  await logActivity({
    userId,
    type: ActivityType.AUTO_SELL_EXECUTED,
    description: `Auto-sold ${quantity} shares of ${symbol} at $${sellPrice.toFixed(2)}`,
    severity: 'high',
    metadata: {
      symbol,
      quantity,
      sellPrice,
      loss: profitLoss,
      riskLevel,
      riskScore,
      agentId: agent.id,
      reason,
    },
  });

  // Create execution record
  await createAgentExecution(
    agent.id,
    userId,
    'risk_and_sell',
    `Auto-sold ${quantity} shares of ${symbol}`,
    `Sold at $${sellPrice.toFixed(2)} due to high risk`,
    recommendation,
    false,
    {
      symbol,
      quantity,
      sellPrice,
      loss: profitLoss,
      executedAt: new Date(),
      success: true,
    }
  );

  console.log(`✅ Auto-sell completed for ${symbol}`);

  // Note: In production, you would:
  // 1. Call brokerage API to execute the sell order
  // 2. Update portfolio position status to 'sold'
  // 3. Remove from active portfolio
  // 4. Add to transaction history
}

/**
 * Generate sell recommendation based on position
 */
function generateSellRecommendation(position: PortfolioPosition): string {
  const { symbol, riskLevel, profitLossPercent, assetType } = position;
  const loss = Math.abs(profitLossPercent || 0);

  if (riskLevel === 'critical' && loss > 25) {
    return `IMMEDIATE ACTION REQUIRED: ${symbol} has lost ${loss.toFixed(1)}% and is at critical risk. Recommend selling immediately to prevent catastrophic losses. Consider reinvesting in more stable ${assetType}s or diversifying.`;
  } else if (riskLevel === 'critical') {
    return `URGENT: ${symbol} is at critical risk. Recommend selling to protect capital. Loss may accelerate if market conditions worsen. Consider more conservative investments.`;
  } else if (riskLevel === 'high' && loss > 15) {
    return `HIGH PRIORITY: ${symbol} has significant losses (${loss.toFixed(1)}%). Recommend selling to limit further downside. Monitor market conditions closely before reinvesting.`;
  } else if (riskLevel === 'high') {
    return `${symbol} is at elevated risk. Consider selling to lock in remaining capital. Watch for any signs of market recovery before reinvesting in similar assets.`;
  } else {
    return `${symbol} shows concerning risk patterns. Monitor closely and consider reducing position size. Set stricter stop-loss limits for remaining holdings.`;
  }
}

/**
 * Check all active Risk & Sell agents for a user
 */
export async function checkAllRiskAndSellAgents(): Promise<void> {
  try {
    console.log('🔍 Checking all active Risk & Sell agents...');

    // In production, this would query all users with active Risk & Sell agents
    // For now, we'll need to track active users separately

    // This function should be called periodically (e.g., every 5-10 minutes)
    // by a background job or cloud function

    console.log('✅ Risk & Sell agent check completed');
  } catch (error) {
    console.error('Error checking Risk & Sell agents:', error);
  }
}

/**
 * Portfolio Risk Monitor Service
 * 
 * Automatically monitors investment portfolio for risky positions
 * and sends email notifications to users
 * 
 * Features:
 * - Real-time risk assessment
 * - Automatic email alerts
 * - Risk score calculation
 * - Loss detection
 * - Integration with Risk & Sell Agent
 */

import { getUserInvestments, type Investment } from './portfolioService';
import { sendRiskAlertEmail } from './emailService';
import { logActivity, ActivityType } from './activityLogger';
import { getUserAgents } from './agentMarketplace';

export interface RiskAssessment {
  investmentId: string;
  investmentName: string;
  type: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  currentLoss: number; // Negative number if loss
  lossPercentage: number;
  reasons: string[];
  recommendation: string;
  shouldAlert: boolean;
}

/**
 * Calculate risk score for an investment (0-100)
 */
function calculateRiskScore(investment: Investment): number {
  let riskScore = 0;

  // Base risk by asset type
  const assetTypeRisk: Record<string, number> = {
    stocks: 60,
    crypto: 80,
    mutual_funds: 40,
    bonds: 20,
    gold: 30,
    real_estate: 35,
    fixed_deposit: 10,
    etf: 45,
  };

  riskScore += assetTypeRisk[investment.type] || 50;

  // Add risk based on loss percentage
  const lossPercent = investment.returnsPercentage || 0;
  if (lossPercent < -20) {
    riskScore += 30;
  } else if (lossPercent < -10) {
    riskScore += 20;
  } else if (lossPercent < -5) {
    riskScore += 10;
  }

  // Reduce risk if profitable
  if (lossPercent > 10) {
    riskScore -= 10;
  }

  // Cap at 100
  return Math.min(100, Math.max(0, riskScore));
}

/**
 * Determine risk level from score
 */
function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Assess risk for a single investment
 */
export function assessInvestmentRisk(investment: Investment): RiskAssessment {
  const riskScore = calculateRiskScore(investment);
  const riskLevel = getRiskLevel(riskScore);
  const lossPercentage = investment.returnsPercentage || 0;
  const currentLoss = investment.returns || 0;

  const reasons: string[] = [];
  let recommendation = '';

  // Analyze reasons for risk
  if (lossPercentage < -20) {
    reasons.push(`Heavy loss of ${lossPercentage.toFixed(1)}%`);
    recommendation = '🚨 CRITICAL: Consider selling immediately to prevent further losses';
  } else if (lossPercentage < -10) {
    reasons.push(`Significant loss of ${lossPercentage.toFixed(1)}%`);
    recommendation = '⚠️ HIGH RISK: Consider selling or setting a stop-loss';
  } else if (lossPercentage < -5) {
    reasons.push(`Moderate loss of ${lossPercentage.toFixed(1)}%`);
    recommendation = '⚡ Monitor closely and consider exit strategy';
  }

  // Asset type specific risks
  if (investment.type === 'crypto') {
    reasons.push('High volatility cryptocurrency asset');
    if (!recommendation) {
      recommendation = '📊 Volatile asset - Consider diversification';
    }
  } else if (investment.type === 'stocks' && lossPercentage < 0) {
    reasons.push('Stock showing downward trend');
  }

  // Duration-based risk
  const daysSincePurchase = Math.floor(
    (Date.now() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSincePurchase > 365 && lossPercentage < 0) {
    reasons.push(`Underperforming for ${Math.floor(daysSincePurchase / 365)} year(s)`);
  }

  // Should alert?
  const shouldAlert = 
    riskLevel === 'critical' || 
    (riskLevel === 'high' && lossPercentage < -10) ||
    lossPercentage < -15;

  if (!recommendation) {
    if (riskLevel === 'low') {
      recommendation = '✅ Low risk - Continue monitoring';
    } else {
      recommendation = '👀 Monitor this investment regularly';
    }
  }

  return {
    investmentId: investment.id,
    investmentName: investment.name,
    type: investment.type,
    riskScore,
    riskLevel,
    currentLoss,
    lossPercentage,
    reasons: reasons.length > 0 ? reasons : ['Normal market fluctuations'],
    recommendation,
    shouldAlert,
  };
}

/**
 * Monitor all investments for a user and send alerts if needed
 */
export async function monitorUserPortfolioRisk(userId: string): Promise<RiskAssessment[]> {
  try {
    console.log(`🔍 Monitoring portfolio risk for user ${userId}`);

    // Get user's investments
    const investments = await getUserInvestments(userId);

    if (investments.length === 0) {
      console.log('No investments to monitor');
      return [];
    }

    // Assess risk for each investment
    const assessments = investments.map(inv => assessInvestmentRisk(inv));

    // Filter high-risk investments that need alerts
    const alertableRisks = assessments.filter(a => a.shouldAlert);

    console.log(`Found ${alertableRisks.length} high-risk investments out of ${investments.length}`);

    // Send email alerts for risky investments
    for (const risk of alertableRisks) {
      // Create detailed recommendation with reasons
      const detailedRecommendation = `
${risk.recommendation}

Reasons:
${risk.reasons.map(r => `• ${r}`).join('\n')}

Risk Score: ${risk.riskScore}/100
Current Loss: ₹${Math.abs(risk.currentLoss).toFixed(2)}
`.trim();

      await sendRiskAlertEmail(
        userId,
        risk.investmentName,
        risk.riskLevel,
        risk.lossPercentage,
        detailedRecommendation
      );

      // Log activity
      await logActivity({
        userId,
        type: ActivityType.RISK_ALERT_TRIGGERED,
        description: `Risk alert sent for ${risk.investmentName} (${risk.riskLevel.toUpperCase()} risk, ${risk.lossPercentage.toFixed(1)}% loss)`,
        severity: risk.riskLevel === 'critical' ? 'critical' : 'high',
        metadata: {
          investmentId: risk.investmentId,
          investmentName: risk.investmentName,
          riskScore: risk.riskScore,
          riskLevel: risk.riskLevel,
          lossPercentage: risk.lossPercentage,
          currentLoss: risk.currentLoss,
        },
      });

      console.log(`✉️ Risk alert email sent for ${risk.investmentName}`);
    }

    return assessments;
  } catch (error) {
    console.error('Error monitoring portfolio risk:', error);
    throw error;
  }
}

/**
 * Check if Risk & Sell Agent is active and execute monitoring
 */
export async function checkAndExecuteRiskAgent(userId: string): Promise<void> {
  try {
    // Get user's active agents
    const agents = await getUserAgents(userId);
    const riskAgent = agents.find(
      agent => agent.type === 'risk_and_sell' && agent.status === 'active'
    );

    if (!riskAgent) {
      console.log('No active Risk & Sell Agent found');
      return;
    }

    console.log(`🤖 Risk & Sell Agent is active - monitoring portfolio`);

    // Monitor portfolio and send alerts
    const assessments = await monitorUserPortfolioRisk(userId);

    // Log agent execution
    await logActivity({
      userId,
      type: ActivityType.AGENT_EXECUTED,
      description: `Risk & Sell Agent monitored ${assessments.length} investments`,
      metadata: {
        agentId: riskAgent.id,
        agentName: riskAgent.name,
        totalInvestments: assessments.length,
        highRiskCount: assessments.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length,
      },
    });
  } catch (error) {
    console.error('Error executing risk agent:', error);
  }
}

/**
 * Generate a detailed risk report for user's portfolio
 */
export async function generatePortfolioRiskReport(userId: string): Promise<{
  totalInvestments: number;
  riskDistribution: Record<string, number>;
  highRiskInvestments: RiskAssessment[];
  averageRiskScore: number;
  totalLoss: number;
  recommendations: string[];
}> {
  const investments = await getUserInvestments(userId);
  const assessments = investments.map(inv => assessInvestmentRisk(inv));

  const riskDistribution = {
    low: assessments.filter(a => a.riskLevel === 'low').length,
    medium: assessments.filter(a => a.riskLevel === 'medium').length,
    high: assessments.filter(a => a.riskLevel === 'high').length,
    critical: assessments.filter(a => a.riskLevel === 'critical').length,
  };

  const highRiskInvestments = assessments.filter(
    a => a.riskLevel === 'high' || a.riskLevel === 'critical'
  );

  const averageRiskScore =
    assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length || 0;

  const totalLoss = assessments
    .filter(a => a.currentLoss < 0)
    .reduce((sum, a) => sum + a.currentLoss, 0);

  const recommendations: string[] = [];
  if (highRiskInvestments.length > 0) {
    recommendations.push(`${highRiskInvestments.length} high-risk investments need attention`);
  }
  if (totalLoss < -10000) {
    recommendations.push('Consider rebalancing portfolio to minimize losses');
  }
  if (riskDistribution.critical > 0) {
    recommendations.push('URGENT: Review critical risk investments immediately');
  }

  return {
    totalInvestments: investments.length,
    riskDistribution,
    highRiskInvestments,
    averageRiskScore,
    totalLoss,
    recommendations,
  };
}

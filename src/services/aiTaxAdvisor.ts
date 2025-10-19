/**
 * AI Tax Advisor Service
 * 
 * Provides intelligent, personalized tax-saving recommendations using AI
 * based on user's salary, expenses, and financial situation
 */

import { getUserProfile } from './authService';
import { generateTaxOptimizationReport } from './taxOptimizationService';
import { getUserInvestments } from './portfolioService';
import { logActivity, ActivityType } from './activityLogger';

export interface AITaxRecommendation {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  potentialSaving: number;
  description: string;
  actionSteps: string[];
  deadline?: string;
  relatedSchemes: string[];
  reasoning: string;
  impact: 'immediate' | 'short-term' | 'long-term';
}

export interface TaxAdvisorReport {
  userId: string;
  generatedAt: Date;
  currentTaxLiability: number;
  potentialSavings: number;
  recommendations: AITaxRecommendation[];
  urgentActions: string[];
  longTermStrategy: string[];
  financialHealthScore: number;
}

/**
 * Generate AI-powered tax recommendations
 */
export async function generateAITaxRecommendations(userId: string): Promise<TaxAdvisorReport> {
  try {
    console.log(`🤖 Generating AI Tax Recommendations for user ${userId}`);

    // Get user profile and tax report
    const userProfile = await getUserProfile(userId);
    const taxReport = await generateTaxOptimizationReport(userId);
    const investments = await getUserInvestments(userId);

    if (!userProfile.financialInfo?.annualSalary) {
      throw new Error('User salary information not available');
    }

    const salary = userProfile.financialInfo.annualSalary;
    const age = userProfile.financialInfo.age || 30;
    const hasHomeLoan = userProfile.financialInfo.hasHomeLoan || false;
    const employmentType = userProfile.financialInfo.employmentType || 'salaried';
    const regime = userProfile.financialInfo.taxRegime || 'new';

    const recommendations: AITaxRecommendation[] = [];

    // Calculate current investment in 80C instruments
    const current80CInvestment = investments
      .filter(inv => ['mutual_funds', 'fixed_deposit'].includes(inv.type))
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Recommendation 1: Maximize 80C if not at limit
    if (current80CInvestment < 150000 && salary >= 500000) {
      const remaining80C = 150000 - current80CInvestment;
      recommendations.push({
        id: 'max_80c',
        title: 'Maximize Section 80C Deductions',
        priority: 'high',
        potentialSaving: remaining80C * 0.30, // Assuming 30% tax bracket
        description: `You can still invest ₹${remaining80C.toLocaleString('en-IN')} under Section 80C to maximize tax savings`,
        actionSteps: [
          `Invest remaining ₹${remaining80C.toLocaleString('en-IN')} before March 31`,
          'Consider ELSS mutual funds for 3-year lock-in with high returns',
          'PPF for long-term, safe returns with 15-year lock-in',
          'Tax-saving FDs if you prefer low-risk options',
        ],
        deadline: 'March 31, 2025',
        relatedSchemes: ['80C ELSS', '80C PPF', '80C Tax-saving FD'],
        reasoning: `With ₹${remaining80C.toLocaleString('en-IN')} uninvested, you're potentially losing ₹${(remaining80C * 0.30).toLocaleString('en-IN')} in tax savings. Acting now can reduce your tax burden significantly.`,
        impact: 'immediate',
      });
    }

    // Recommendation 2: NPS for additional 50K deduction
    if (salary >= 800000 && age < 55) {
      const npsDeduction = 50000;
      recommendations.push({
        id: 'nps_80ccd1b',
        title: 'Invest in NPS for Extra ₹50,000 Deduction',
        priority: 'high',
        potentialSaving: npsDeduction * 0.30,
        description: 'Get an additional ₹50,000 tax deduction over and above Section 80C limit',
        actionSteps: [
          'Open NPS Tier-1 account online (takes 10 minutes)',
          `Invest ₹${npsDeduction.toLocaleString('en-IN')} before year-end`,
          'Choose investment mix: 75% equity for higher returns (if under 40)',
          'Set up auto-debit for regular contributions',
        ],
        deadline: 'March 31, 2025',
        relatedSchemes: ['80CCD(1B) NPS'],
        reasoning: `At your income level, NPS provides the best tax-to-return ratio with an additional ₹15,000 tax saving. The retirement corpus will grow tax-efficiently.`,
        impact: 'long-term',
      });
    }

    // Recommendation 3: Health Insurance
    const healthInsuranceLimit = age >= 60 ? 50000 : 25000;
    if (!userProfile.financialInfo.hasHealthInsurance && salary >= 400000) {
      recommendations.push({
        id: 'health_insurance_80d',
        title: 'Buy Health Insurance for 80D Benefits',
        priority: 'high',
        potentialSaving: healthInsuranceLimit * 0.30,
        description: `Get tax deduction up to ₹${healthInsuranceLimit.toLocaleString('en-IN')} plus medical coverage`,
        actionSteps: [
          `Buy family floater health insurance (₹5-10 lakh coverage)`,
          'Compare policies on insurance aggregator websites',
          'Ensure cashless hospitalization network is good',
          'Keep premium receipts for tax filing',
        ],
        deadline: 'As soon as possible',
        relatedSchemes: ['80D Health Insurance'],
        reasoning: `Health insurance is a win-win: you get ₹${(healthInsuranceLimit * 0.30).toLocaleString('en-IN')} tax savings PLUS financial protection against medical emergencies. This is a critical gap in your financial planning.`,
        impact: 'immediate',
      });
    }

    // Recommendation 4: Home Loan Tax Benefits
    if (!hasHomeLoan && salary >= 800000 && age < 45) {
      recommendations.push({
        id: 'home_loan_benefits',
        title: 'Consider Home Loan for Tax Benefits',
        priority: 'medium',
        potentialSaving: (200000 + 150000) * 0.30, // Interest + Principal
        description: 'Home loan provides dual tax benefits under Section 24(b) and 80C',
        actionSteps: [
          'If planning to buy property, consider home loan benefits',
          '₹2 lakh deduction on interest (Section 24b)',
          '₹1.5 lakh on principal (Section 80C)',
          'Stamp duty and registration also eligible under 80C',
        ],
        deadline: 'Long-term planning',
        relatedSchemes: ['24(b) Home Loan Interest', '80C Home Loan Principal'],
        reasoning: `At your income and age, a home loan can provide up to ₹1,05,000 in annual tax savings while building an appreciating asset. This is particularly beneficial if you're paying rent.`,
        impact: 'long-term',
      });
    }

    // Recommendation 5: HRA Optimization (for salaried)
    if (employmentType === 'salaried' && salary >= 600000) {
      const hraExemption = salary * 0.40; // Estimated 40% of basic as HRA
      recommendations.push({
        id: 'hra_optimization',
        title: 'Optimize House Rent Allowance (HRA)',
        priority: 'high',
        potentialSaving: hraExemption * 0.30,
        description: 'Maximize HRA exemption by proper rent arrangement',
        actionSteps: [
          'Ensure rent receipts are maintained monthly',
          'Get rental agreement notarized',
          'Provide landlord PAN if annual rent > ₹1 lakh',
          'Submit HRA declaration to employer',
        ],
        deadline: 'Before January for TDS adjustment',
        relatedSchemes: ['Section 10(13A) HRA'],
        reasoning: `Many salaried employees miss out on HRA benefits worth ₹${(hraExemption * 0.30 / 1000).toFixed(0)}K+ annually. Proper documentation can significantly reduce your tax liability.`,
        impact: 'immediate',
      });
    }

    // Recommendation 6: Regime Optimization
    if (regime === 'new' && taxReport.totalSavings > 50000) {
      recommendations.push({
        id: 'switch_to_old_regime',
        title: 'Consider Switching to Old Tax Regime',
        priority: 'high',
        potentialSaving: taxReport.totalSavings,
        description: 'Old regime might save you more tax given your deductions',
        actionSteps: [
          `Potential additional saving: ₹${taxReport.totalSavings.toLocaleString('en-IN')}`,
          'Evaluate if you can invest in 80C instruments',
          'Inform employer before tax filing',
          'Can switch regime yearly',
        ],
        deadline: 'Before filing ITR',
        relatedSchemes: ['Old Tax Regime'],
        reasoning: `Based on your financial profile, the old regime with deductions can save ₹${taxReport.totalSavings.toLocaleString('en-IN')} more than the new regime. You should strongly consider switching.`,
        impact: 'immediate',
      });
    }

    // Recommendation 7: Tax-loss Harvesting
    const losingInvestments = investments.filter(inv => (inv.returns || 0) < 0);
    if (losingInvestments.length > 0 && salary >= 1000000) {
      const totalLoss = losingInvestments.reduce((sum, inv) => sum + Math.abs(inv.returns || 0), 0);
      recommendations.push({
        id: 'tax_loss_harvesting',
        title: 'Harvest Tax Losses from Investments',
        priority: 'medium',
        potentialSaving: totalLoss * 0.30,
        description: 'Offset capital gains by booking losses strategically',
        actionSteps: [
          `You have ₹${totalLoss.toLocaleString('en-IN')} in unrealized losses`,
          'Book losses before March 31 to offset gains',
          'Can carry forward losses for 8 years',
          'Rebuy fundamentally strong stocks after booking loss',
        ],
        deadline: 'March 31, 2025',
        relatedSchemes: ['Capital Gains Tax Optimization'],
        reasoning: `Strategic loss booking can save taxes on your capital gains. With ₹${totalLoss.toLocaleString('en-IN')} in losses, this is a smart tax strategy.`,
        impact: 'short-term',
      });
    }

    // Recommendation 8: Parent's Health Insurance
    if (age < 50 && salary >= 1000000) {
      recommendations.push({
        id: 'parent_health_insurance',
        title: 'Cover Parents Under Health Insurance',
        priority: 'medium',
        potentialSaving: 50000 * 0.30,
        description: 'Get additional ₹50,000 deduction for parents\' health insurance',
        actionSteps: [
          'Buy health insurance for parents (senior citizen plans)',
          'Additional ₹50,000 deduction under Section 80D',
          'Provides financial security to parents',
          'Tax-efficient way to support family',
        ],
        deadline: 'Financial year-end',
        relatedSchemes: ['80D Health Insurance (Parents)'],
        reasoning: `This is a dual benefit: financial protection for parents + ₹15,000 tax savings. It's a socially responsible investment with tax benefits.`,
        impact: 'immediate',
      });
    }

    // Recommendation 9: LTA (Leave Travel Allowance)
    if (employmentType === 'salaried' && salary >= 500000) {
      recommendations.push({
        id: 'lta_utilization',
        title: 'Utilize Leave Travel Allowance (LTA)',
        priority: 'low',
        potentialSaving: 30000 * 0.30,
        description: 'Claim tax exemption on domestic travel',
        actionSteps: [
          'Plan domestic travel with family',
          'Keep travel tickets and boarding passes',
          'Claimable twice in 4-year block',
          'Submit to employer for exemption',
        ],
        deadline: 'Current block ends: Dec 2025',
        relatedSchemes: ['Section 10(5) LTA'],
        reasoning: `LTA is an often-ignored benefit that can save ₹9,000+ in taxes while enabling family travel. Plan a domestic trip before the block expires.`,
        impact: 'short-term',
      });
    }

    // Recommendation 10: Donations (for high earners)
    if (salary >= 1500000) {
      recommendations.push({
        id: 'charitable_donations',
        title: 'Tax-efficient Charitable Giving',
        priority: 'low',
        potentialSaving: 50000 * 0.50, // 50% or 100% deduction
        description: 'Support causes you care about while saving taxes',
        actionSteps: [
          'Donate to PM Relief Fund (100% deduction)',
          'Or donate to approved NGOs (50% deduction)',
          'Get 80G certificate from organization',
          'Keep donation receipts for ITR filing',
        ],
        deadline: 'Before March 31',
        relatedSchemes: ['80G Donations'],
        reasoning: `At your income level, strategic charitable giving combines social impact with tax optimization. A ₹50,000 donation can save ₹25,000 in taxes.`,
        impact: 'immediate',
      });
    }

    // Sort by priority and potential saving
    recommendations.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      if (a.priority !== b.priority) {
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
      return b.potentialSaving - a.potentialSaving;
    });

    // Generate urgent actions
    const urgentActions: string[] = [];
    const financialYearEnd = new Date('2025-03-31');
    const daysRemaining = Math.ceil((financialYearEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 60) {
      urgentActions.push(`⏰ Only ${daysRemaining} days left for FY 2024-25 tax planning!`);
    }
    
    if (current80CInvestment < 150000) {
      urgentActions.push(`💰 Invest ₹${(150000 - current80CInvestment).toLocaleString('en-IN')} in 80C before March 31`);
    }
    
    if (!userProfile.financialInfo.hasHealthInsurance) {
      urgentActions.push('🏥 Buy health insurance immediately for 80D benefits + coverage');
    }

    // Long-term strategy
    const longTermStrategy: string[] = [
      '📊 Review and rebalance portfolio quarterly',
      '💼 Maximize employer\'s EPF/NPS contributions',
      '🏠 Plan for home purchase to leverage tax benefits',
      '📈 Diversify into tax-efficient instruments (ELSS, NPS)',
      '🎓 If applicable, utilize education loan interest deduction',
      '👨‍👩‍👧 Plan insurance for entire family under 80D',
      '🌟 Build emergency fund (6 months expenses) separate from investments',
    ];

    // Calculate financial health score (0-100)
    let financialHealthScore = 50; // Base score

    // Positive factors
    if (current80CInvestment >= 100000) financialHealthScore += 10;
    if (userProfile.financialInfo.hasHealthInsurance) financialHealthScore += 10;
    if (hasHomeLoan) financialHealthScore += 5;
    if (investments.length >= 5) financialHealthScore += 10;
    if (taxReport.savingsPercentage > 20) financialHealthScore += 15;

    // Negative factors
    if (current80CInvestment < 50000) financialHealthScore -= 10;
    if (!userProfile.financialInfo.hasHealthInsurance) financialHealthScore -= 15;
    if (losingInvestments.length > investments.length / 2) financialHealthScore -= 10;

    financialHealthScore = Math.max(0, Math.min(100, financialHealthScore));

    // Log activity
    await logActivity({
      userId,
      type: ActivityType.TAX_OPTIMIZATION_GENERATED,
      description: `AI Tax Advisor generated ${recommendations.length} recommendations with potential savings of ₹${recommendations.reduce((sum, r) => sum + r.potentialSaving, 0).toLocaleString('en-IN')}`,
      metadata: {
        recommendationCount: recommendations.length,
        potentialTotalSavings: recommendations.reduce((sum, r) => sum + r.potentialSaving, 0),
        financialHealthScore,
        currentTaxLiability: taxReport.currentTax.totalTaxLiability,
      },
    });

    console.log(`✅ Generated ${recommendations.length} AI tax recommendations`);

    return {
      userId,
      generatedAt: new Date(),
      currentTaxLiability: taxReport.currentTax.totalTaxLiability,
      potentialSavings: recommendations.reduce((sum, r) => sum + r.potentialSaving, 0),
      recommendations,
      urgentActions,
      longTermStrategy,
      financialHealthScore,
    };
  } catch (error) {
    console.error('Error generating AI tax recommendations:', error);
    throw error;
  }
}

/**
 * Save tax advisor report to Firestore
 */
export async function saveTaxAdvisorReport(report: TaxAdvisorReport): Promise<void> {
  try {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../config/firebase');

    const reportId = `tax_report_${report.userId}_${Date.now()}`;
    const reportRef = doc(db, 'taxReports', reportId);

    await setDoc(reportRef, {
      ...report,
      generatedAt: serverTimestamp(),
      id: reportId,
    });

    console.log(`✅ Tax advisor report saved: ${reportId}`);
  } catch (error) {
    console.error('Error saving tax report:', error);
    throw error;
  }
}

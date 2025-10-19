/**
 * AI Financial Advisor Test & Debug Script
 * Use this to test the complete flow
 */

import {
  generateFinancialAdvisorReport,
  compareSavingsVsInvestment,
  type UserFinancialInput,
  type FinancialGoal,
} from '../services/aiFinancialAdvisor';

/**
 * Test complete AI Financial Advisor flow
 */
export async function testAIFinancialAdvisor(userId: string) {
  console.log('=== AI Financial Advisor Test ===\n');

  // Test data
  const testInput: UserFinancialInput = {
    monthlySalary: 80000,
    monthlyExpenses: 40000,
    currentSavings: 300000,
    savingsPercentage: 25,
    riskProfile: 'moderate',
    goals: [
      {
        id: '1',
        title: 'Buy a car',
        targetAmount: 800000,
        currentSavings: 100000,
        timelineMonths: 36,
        priority: 'high',
        category: 'vehicle',
        createdAt: new Date(),
      },
      {
        id: '2',
        title: 'Foreign vacation',
        targetAmount: 200000,
        currentSavings: 50000,
        timelineMonths: 12,
        priority: 'medium',
        category: 'travel',
        createdAt: new Date(),
      },
    ],
  };

  console.log('Test Input:', testInput);
  console.log('\n--- Generating Report ---\n');

  try {
    const report = await generateFinancialAdvisorReport(userId, testInput);

    console.log('✅ Report Generated Successfully!\n');
    console.log('=== Results ===');
    console.log(`User: ${report.userName}`);
    console.log(`Financial Health Score: ${report.financialHealthScore}/100`);
    console.log(`Monthly Savings Capacity: ₹${report.monthlySavingsCapacity.toLocaleString()}`);
    console.log(
      `Monthly Investment Required: ₹${report.overallStrategy.totalMonthlyInvestment.toLocaleString()}`
    );
    console.log(`Expected Returns: ${report.overallStrategy.expectedReturns}% per year`);
    console.log(`Timeline: ${report.overallStrategy.timeline}\n`);

    console.log('=== Goal Plans ===');
    report.goalPlans.forEach((plan, index) => {
      console.log(`\n${index + 1}. ${plan.goal.title}`);
      console.log(`   Target: ₹${plan.goal.targetAmount.toLocaleString()}`);
      console.log(
        `   Monthly Investment: ₹${plan.monthlyRequiredInvestment.toLocaleString()}`
      );
      console.log(
        `   Monthly Savings (no investment): ₹${plan.monthlyRequiredSavings.toLocaleString()}`
      );
      console.log(`   Achievable: ${plan.achievable ? '✅ Yes' : '❌ No'}`);
      console.log(`   Risk Level: ${plan.riskAnalysis.level}`);
      console.log(`   Recommendations: ${plan.recommendedInvestments.length} options`);
    });

    console.log('\n=== Portfolio Allocation ===');
    console.log(`Low Risk: ${report.overallStrategy.portfolioAllocation.lowRisk}%`);
    console.log(`Medium Risk: ${report.overallStrategy.portfolioAllocation.mediumRisk}%`);
    console.log(`High Risk: ${report.overallStrategy.portfolioAllocation.highRisk}%`);

    console.log('\n=== Insights ===');
    report.insights.forEach((insight) => console.log(`• ${insight}`));

    if (report.warnings.length > 0) {
      console.log('\n=== Warnings ===');
      report.warnings.forEach((warning) => console.log(`⚠️  ${warning}`));
    }

    console.log('\n=== Action Plan ===');
    console.log('Immediate:');
    report.actionPlan.immediate.forEach((action) => console.log(`  • ${action}`));
    console.log('Monthly:');
    report.actionPlan.monthly.forEach((action) => console.log(`  • ${action}`));

    return report;
  } catch (error) {
    console.error('❌ Test Failed!');
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Test savings vs investment comparison
 */
export function testComparison() {
  console.log('\n=== Testing Savings vs Investment Comparison ===\n');

  const testGoal: FinancialGoal = {
    id: 'test',
    title: 'Buy a car',
    targetAmount: 800000,
    currentSavings: 100000,
    timelineMonths: 36,
    priority: 'high',
    category: 'vehicle',
    createdAt: new Date(),
  };

  const comparison = compareSavingsVsInvestment(testGoal, 'moderate');

  console.log('Goal:', testGoal.title);
  console.log(`Target: ₹${testGoal.targetAmount.toLocaleString()}`);
  console.log(`Timeline: ${testGoal.timelineMonths} months\n`);

  console.log('Just Savings:');
  console.log(`  Monthly: ₹${comparison.savings.monthlyAmount.toLocaleString()}`);
  console.log(`  Total Paid: ₹${comparison.savings.totalPaid.toLocaleString()}`);
  console.log(`  Timeline: ${comparison.savings.timeline} months\n`);

  console.log('With Investment:');
  console.log(`  Monthly: ₹${comparison.investment.monthlyAmount.toLocaleString()}`);
  console.log(`  Total Paid: ₹${comparison.investment.totalPaid.toLocaleString()}`);
  console.log(`  Returns Earned: ₹${comparison.investment.returns.toLocaleString()}`);
  console.log(`  Timeline: ${comparison.investment.timeline} months\n`);

  console.log(`💡 ${comparison.advantage}`);

  return comparison;
}

/**
 * Quick validation test
 */
export function validateInputs(input: UserFinancialInput): string[] {
  const errors: string[] = [];

  if (!input.monthlySalary || input.monthlySalary <= 0) {
    errors.push('Monthly salary is required and must be greater than 0');
  }

  if (!input.monthlyExpenses || input.monthlyExpenses < 0) {
    errors.push('Monthly expenses is required and cannot be negative');
  }

  if (input.monthlyExpenses >= input.monthlySalary) {
    errors.push('Monthly expenses cannot be greater than or equal to monthly salary');
  }

  if (!input.currentSavings || input.currentSavings < 0) {
    errors.push('Current savings cannot be negative');
  }

  if (!input.savingsPercentage || input.savingsPercentage < 0 || input.savingsPercentage > 100) {
    errors.push('Savings percentage must be between 0 and 100');
  }

  if (!input.goals || input.goals.length === 0) {
    errors.push('At least one financial goal is required');
  }

  input.goals.forEach((goal, index) => {
    if (!goal.title) {
      errors.push(`Goal ${index + 1}: Title is required`);
    }
    if (!goal.targetAmount || goal.targetAmount <= 0) {
      errors.push(`Goal ${index + 1}: Target amount must be greater than 0`);
    }
    if (!goal.timelineMonths || goal.timelineMonths <= 0) {
      errors.push(`Goal ${index + 1}: Timeline must be greater than 0 months`);
    }
  });

  return errors;
}

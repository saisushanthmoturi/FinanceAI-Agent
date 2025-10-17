import type { SimulationScenario, SimulationResult, MonthlyProjection } from '../types';

/**
 * Scenario Simulation Engine
 * Uses Monte Carlo simulation for financial projections
 */
export class SimulationEngine {
  private readonly SIMULATION_RUNS = 1000;
  private readonly MONTHS_TO_SIMULATE = 360; // 30 years

  /**
   * Run retirement simulation
   */
  async simulateRetirement(
    currentAge: number,
    retirementAge: number,
    currentSavings: number,
    monthlyIncome: number,
    monthlyExpenses: number,
    monthlySavings: number,
    expectedReturn: number = 0.10, // 10% annual return
    inflationRate: number = 0.06 // 6% annual inflation
  ): Promise<SimulationResult> {
    const monthsToRetirement = (retirementAge - currentAge) * 12;
    const results: number[][] = [];

    // Run Monte Carlo simulations
    for (let run = 0; run < this.SIMULATION_RUNS; run++) {
      const projection = this.runSingleSimulation(
        currentSavings,
        monthlySavings,
        monthsToRetirement,
        expectedReturn,
        inflationRate
      );
      results.push(projection);
    }

    // Calculate statistics
    const finalValues = results.map(r => r[r.length - 1]);
    finalValues.sort((a, b) => a - b);

    const successCount = finalValues.filter(v => v > 0).length;
    const successProbability = (successCount / this.SIMULATION_RUNS) * 100;

    const medianIndex = Math.floor(this.SIMULATION_RUNS / 2);
    const p10Index = Math.floor(this.SIMULATION_RUNS * 0.1);
    const p90Index = Math.floor(this.SIMULATION_RUNS * 0.9);

    // Generate monthly breakdown (median scenario)
    const medianProjection = results[medianIndex];
    const monthlyBreakdown = this.generateMonthlyBreakdown(
      medianProjection,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      inflationRate
    );

    return {
      successProbability,
      projectedNetWorth: medianProjection,
      monthlyBreakdown,
      bestCaseScenario: finalValues[p90Index],
      worstCaseScenario: finalValues[p10Index],
      medianScenario: finalValues[medianIndex],
      riskFactors: this.identifyRiskFactors(successProbability, finalValues[medianIndex]),
      recommendations: this.generateRecommendations(successProbability, monthlySavings, monthlyIncome),
    };
  }

  /**
   * Run single Monte Carlo simulation
   */
  private runSingleSimulation(
    initialSavings: number,
    monthlySavings: number,
    months: number,
    expectedReturn: number,
    inflationRate: number
  ): number[] {
    const projection: number[] = [initialSavings];
    let currentSavings = initialSavings;
    const monthlyReturn = expectedReturn / 12;
    const monthlyInflation = inflationRate / 12;

    for (let month = 1; month <= months; month++) {
      // Add randomness using normal distribution
      const randomReturn = this.normalRandom(monthlyReturn, monthlyReturn * 0.5);
      
      // Apply return and add savings
      currentSavings = currentSavings * (1 + randomReturn) + monthlySavings;
      
      // Adjust for inflation
      currentSavings = currentSavings * (1 - monthlyInflation);
      
      projection.push(Math.max(0, currentSavings));
    }

    return projection;
  }

  /**
   * Generate normal random number (Box-Muller transform)
   */
  private normalRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  /**
   * Generate monthly breakdown
   */
  private generateMonthlyBreakdown(
    projection: number[],
    monthlyIncome: number,
    monthlyExpenses: number,
    monthlySavings: number,
    inflationRate: number
  ): MonthlyProjection[] {
    const breakdown: MonthlyProjection[] = [];
    const monthlyInflation = inflationRate / 12;

    for (let month = 0; month < projection.length; month++) {
      const inflationFactor = Math.pow(1 + monthlyInflation, month);
      
      breakdown.push({
        month,
        income: monthlyIncome * inflationFactor,
        expenses: monthlyExpenses * inflationFactor,
        savings: monthlySavings,
        investments: projection[month],
        netWorth: projection[month],
      });
    }

    return breakdown;
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(successProbability: number, finalValue: number): string[] {
    const risks: string[] = [];

    if (successProbability < 70) {
      risks.push('Low probability of meeting retirement goals');
    }
    if (successProbability < 50) {
      risks.push('High risk of running out of money in retirement');
    }
    if (finalValue < 1000000) {
      risks.push('May not have sufficient corpus for comfortable retirement');
    }

    return risks;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    successProbability: number,
    monthlySavings: number,
    monthlyIncome: number
  ): string[] {
    const recommendations: string[] = [];
    const savingsRate = (monthlySavings / monthlyIncome) * 100;

    if (successProbability < 80) {
      recommendations.push('Consider increasing monthly savings by 10-20%');
    }
    if (savingsRate < 20) {
      recommendations.push('Aim to save at least 20% of your income');
    }
    if (successProbability < 60) {
      recommendations.push('Consider working 2-3 years longer or reducing retirement expenses');
    }

    recommendations.push('Diversify investments across equity, debt, and gold');
    recommendations.push('Review and rebalance portfolio annually');

    return recommendations;
  }

  /**
   * Simulate job loss scenario
   */
  async simulateJobLoss(
    currentSavings: number,
    monthlyExpenses: number,
    emergencyFund: number,
    monthsWithoutJob: number
  ): Promise<SimulationResult> {
    const projectedNetWorth: number[] = [];
    let remaining = currentSavings + emergencyFund;

    for (let month = 0; month <= monthsWithoutJob; month++) {
      remaining -= monthlyExpenses;
      projectedNetWorth.push(Math.max(0, remaining));
    }

    const survivalMonths = projectedNetWorth.filter(v => v > 0).length;
    const successProbability = (survivalMonths / monthsWithoutJob) * 100;

    return {
      successProbability,
      projectedNetWorth,
      monthlyBreakdown: [],
      bestCaseScenario: currentSavings + emergencyFund,
      worstCaseScenario: 0,
      medianScenario: projectedNetWorth[Math.floor(projectedNetWorth.length / 2)],
      riskFactors: survivalMonths < monthsWithoutJob 
        ? ['Insufficient emergency fund', 'May need to borrow or liquidate investments']
        : [],
      recommendations: survivalMonths < 6 
        ? ['Build emergency fund to cover 6 months expenses', 'Reduce non-essential expenses']
        : ['Maintain current emergency fund'],
    };
  }

  /**
   * Simulate investment scenario
   */
  async simulateInvestment(
    principal: number,
    monthlyInvestment: number,
    years: number,
    expectedReturn: number,
    riskLevel: 'low' | 'medium' | 'high'
  ): Promise<SimulationResult> {
    const volatility = riskLevel === 'low' ? 0.05 : riskLevel === 'medium' ? 0.15 : 0.25;
    const results: number[][] = [];

    for (let run = 0; run < this.SIMULATION_RUNS; run++) {
      const projection = this.runSingleSimulation(
        principal,
        monthlyInvestment,
        years * 12,
        expectedReturn,
        volatility
      );
      results.push(projection);
    }

    const finalValues = results.map(r => r[r.length - 1]);
    finalValues.sort((a, b) => a - b);

    const medianIndex = Math.floor(this.SIMULATION_RUNS / 2);
    const totalInvested = principal + (monthlyInvestment * years * 12);
    const medianReturn = finalValues[medianIndex];
    const successProbability = (finalValues.filter(v => v > totalInvested).length / this.SIMULATION_RUNS) * 100;

    return {
      successProbability,
      projectedNetWorth: results[medianIndex],
      monthlyBreakdown: [],
      bestCaseScenario: finalValues[Math.floor(this.SIMULATION_RUNS * 0.9)],
      worstCaseScenario: finalValues[Math.floor(this.SIMULATION_RUNS * 0.1)],
      medianScenario: medianReturn,
      riskFactors: riskLevel === 'high' 
        ? ['High volatility may lead to significant short-term losses']
        : [],
      recommendations: [
        `Expected return over ${years} years: ₹${Math.round(medianReturn).toLocaleString('en-IN')}`,
        'Stay invested for the long term',
        'Do not panic during market downturns',
      ],
    };
  }
}

export const simulationEngine = new SimulationEngine();

/**
 * Tax Service - Calculate tax based on latest Indian tax slabs (FY 2024-25)
 * Provides tax optimization strategies and investment recommendations
 */

export interface TaxSlab {
  min: number;
  max: number | null;
  rate: number;
}

export interface TaxCalculation {
  grossIncome: number;
  standardDeduction: number;
  totalDeductions: number;
  taxableIncome: number;
  taxBeforeRebate: number;
  rebate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
}

export interface TaxSavingScheme {
  id: string;
  name: string;
  section: string;
  maxLimit: number;
  currentInvestment: number;
  potentialSaving: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  returns: string;
  lockInPeriod: string;
  description: string;
  recommended: boolean;
}

export interface InvestmentPlan {
  scheme: TaxSavingScheme;
  monthlyAmount: number;
  totalAmount: number;
  taxSaved: number;
  netCost: number;
}

// New Tax Regime Slabs (FY 2024-25) - Default
const NEW_TAX_SLABS: TaxSlab[] = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 600000, rate: 5 },
  { min: 600001, max: 900000, rate: 10 },
  { min: 900001, max: 1200000, rate: 15 },
  { min: 1200001, max: 1500000, rate: 20 },
  { min: 1500001, max: null, rate: 30 },
];

// Old Tax Regime Slabs
const OLD_TAX_SLABS: TaxSlab[] = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250001, max: 500000, rate: 5 },
  { min: 500001, max: 1000000, rate: 20 },
  { min: 1000001, max: null, rate: 30 },
];

export class TaxService {
  /**
   * Calculate tax for New Tax Regime
   */
  calculateNewRegime(income: number): TaxCalculation {
    const standardDeduction = 50000; // Standard deduction for salaried
    const taxableIncome = Math.max(0, income - standardDeduction);
    
    let tax = 0;
    for (const slab of NEW_TAX_SLABS) {
      if (taxableIncome > slab.min) {
        const upperLimit = slab.max || taxableIncome;
        const taxableAmount = Math.min(taxableIncome, upperLimit) - slab.min;
        tax += (taxableAmount * slab.rate) / 100;
      }
    }

    // Rebate under Section 87A (if income <= 7 lakhs)
    const rebate = taxableIncome <= 700000 ? Math.min(tax, 25000) : 0;
    const taxAfterRebate = Math.max(0, tax - rebate);

    // Surcharge (if applicable)
    const surcharge = this.calculateSurcharge(income, taxAfterRebate);
    
    // Health & Education Cess (4%)
    const cess = (taxAfterRebate + surcharge) * 0.04;
    
    const totalTax = Math.round(taxAfterRebate + surcharge + cess);

    return {
      grossIncome: income,
      standardDeduction,
      totalDeductions: standardDeduction,
      taxableIncome,
      taxBeforeRebate: Math.round(tax),
      rebate: Math.round(rebate),
      surcharge: Math.round(surcharge),
      cess: Math.round(cess),
      totalTax,
      effectiveRate: income > 0 ? (totalTax / income) * 100 : 0,
    };
  }

  /**
   * Calculate tax for Old Tax Regime with deductions
   */
  calculateOldRegime(
    income: number,
    deductions: {
      section80C?: number;
      section80D?: number;
      section80CCD1B?: number;
      homeLoanInterest?: number;
      hra?: number;
      lta?: number;
    } = {}
  ): TaxCalculation {
    const standardDeduction = 50000;
    
    // Calculate total deductions
    const sec80C = Math.min(deductions.section80C || 0, 150000);
    const sec80D = Math.min(deductions.section80D || 0, 25000);
    const sec80CCD1B = Math.min(deductions.section80CCD1B || 0, 50000);
    const homeLoan = Math.min(deductions.homeLoanInterest || 0, 200000);
    const hra = deductions.hra || 0;
    const lta = deductions.lta || 0;
    
    const totalDeductions = standardDeduction + sec80C + sec80D + sec80CCD1B + homeLoan + hra + lta;
    const taxableIncome = Math.max(0, income - totalDeductions);
    
    let tax = 0;
    for (const slab of OLD_TAX_SLABS) {
      if (taxableIncome > slab.min) {
        const upperLimit = slab.max || taxableIncome;
        const taxableAmount = Math.min(taxableIncome, upperLimit) - slab.min;
        tax += (taxableAmount * slab.rate) / 100;
      }
    }

    // Rebate under Section 87A
    const rebate = taxableIncome <= 500000 ? Math.min(tax, 12500) : 0;
    const taxAfterRebate = Math.max(0, tax - rebate);

    // Surcharge
    const surcharge = this.calculateSurcharge(income, taxAfterRebate);
    
    // Cess
    const cess = (taxAfterRebate + surcharge) * 0.04;
    
    const totalTax = Math.round(taxAfterRebate + surcharge + cess);

    return {
      grossIncome: income,
      standardDeduction,
      totalDeductions,
      taxableIncome,
      taxBeforeRebate: Math.round(tax),
      rebate: Math.round(rebate),
      surcharge: Math.round(surcharge),
      cess: Math.round(cess),
      totalTax,
      effectiveRate: income > 0 ? (totalTax / income) * 100 : 0,
    };
  }

  /**
   * Calculate surcharge based on income
   */
  private calculateSurcharge(income: number, tax: number): number {
    if (income <= 5000000) return 0;
    if (income <= 10000000) return tax * 0.10;
    if (income <= 20000000) return tax * 0.15;
    if (income <= 50000000) return tax * 0.25;
    return tax * 0.37;
  }

  /**
   * Get tax saving schemes based on income and current investments
   */
  getTaxSavingSchemes(
    annualIncome: number,
    currentInvestments: {
      section80C?: number;
      section80D?: number;
      section80CCD1B?: number;
    } = {}
  ): TaxSavingScheme[] {
    const taxBracket = this.getTaxBracket(annualIncome);
    const taxRate = taxBracket / 100;

    const schemes: TaxSavingScheme[] = [
      {
        id: 'elss',
        name: 'ELSS Mutual Funds',
        section: '80C',
        maxLimit: 150000,
        currentInvestment: currentInvestments.section80C || 0,
        potentialSaving: 0,
        riskLevel: 'High',
        returns: '12-15% p.a.',
        lockInPeriod: '3 years',
        description: 'Equity-linked savings with tax benefits and wealth creation potential',
        recommended: annualIncome > 600000,
      },
      {
        id: 'ppf',
        name: 'Public Provident Fund (PPF)',
        section: '80C',
        maxLimit: 150000,
        currentInvestment: 0,
        potentialSaving: 0,
        riskLevel: 'Low',
        returns: '7.1% p.a. (tax-free)',
        lockInPeriod: '15 years',
        description: 'Government-backed safe investment with guaranteed returns',
        recommended: annualIncome <= 1000000,
      },
      {
        id: 'nps',
        name: 'National Pension System',
        section: '80CCD(1B)',
        maxLimit: 50000,
        currentInvestment: currentInvestments.section80CCD1B || 0,
        potentialSaving: 0,
        riskLevel: 'Medium',
        returns: '9-12% p.a.',
        lockInPeriod: 'Until retirement',
        description: 'Additional ₹50K deduction over 80C limit for retirement planning',
        recommended: annualIncome > 800000,
      },
      {
        id: 'health-insurance',
        name: 'Health Insurance Premium',
        section: '80D',
        maxLimit: 25000,
        currentInvestment: currentInvestments.section80D || 0,
        potentialSaving: 0,
        riskLevel: 'Low',
        returns: 'Health Coverage',
        lockInPeriod: 'Annual renewal',
        description: 'Essential health coverage with tax benefits (₹50K for senior citizens)',
        recommended: true,
      },
      {
        id: 'nsc',
        name: 'National Savings Certificate',
        section: '80C',
        maxLimit: 150000,
        currentInvestment: 0,
        potentialSaving: 0,
        riskLevel: 'Low',
        returns: '7.7% p.a.',
        lockInPeriod: '5 years',
        description: 'Post office scheme with guaranteed returns',
        recommended: annualIncome <= 800000,
      },
      {
        id: 'tax-saver-fd',
        name: '5-Year Tax Saver FD',
        section: '80C',
        maxLimit: 150000,
        currentInvestment: 0,
        potentialSaving: 0,
        riskLevel: 'Low',
        returns: '6-7% p.a.',
        lockInPeriod: '5 years',
        description: 'Bank fixed deposit with tax benefits',
        recommended: annualIncome <= 600000,
      },
    ];

    // Calculate potential savings for each scheme
    return schemes.map(scheme => {
      const remainingLimit = Math.max(0, scheme.maxLimit - scheme.currentInvestment);
      const potentialSaving = Math.round(remainingLimit * taxRate);
      return { ...scheme, potentialSaving };
    });
  }

  /**
   * Get investment plans based on salary
   */
  getInvestmentPlans(monthlySalary: number): InvestmentPlan[] {
    const annualIncome = monthlySalary * 12;
    const taxBracket = this.getTaxBracket(annualIncome);
    const taxRate = taxBracket / 100;

    const schemes = this.getTaxSavingSchemes(annualIncome);
    const plans: InvestmentPlan[] = [];

    // Recommend plans based on income
    if (monthlySalary <= 25000) {
      // Low income - focus on safe options
      plans.push(this.createPlan(schemes.find(s => s.id === 'ppf')!, 2000, taxRate));
      plans.push(this.createPlan(schemes.find(s => s.id === 'health-insurance')!, 500, taxRate));
    } else if (monthlySalary <= 50000) {
      // Medium income - balanced approach
      plans.push(this.createPlan(schemes.find(s => s.id === 'elss')!, 3000, taxRate));
      plans.push(this.createPlan(schemes.find(s => s.id === 'ppf')!, 2000, taxRate));
      plans.push(this.createPlan(schemes.find(s => s.id === 'nps')!, 2000, taxRate));
      plans.push(this.createPlan(schemes.find(s => s.id === 'health-insurance')!, 1000, taxRate));
    } else {
      // High income - maximize tax savings
      plans.push(this.createPlan(schemes.find(s => s.id === 'elss')!, 10000, taxRate));
      plans.push(this.createPlan(schemes.find(s => s.id === 'nps')!, 4200, taxRate));
      plans.push(this.createPlan(schemes.find(s => s.id === 'health-insurance')!, 2000, taxRate));
    }

    return plans;
  }

  /**
   * Create investment plan
   */
  private createPlan(scheme: TaxSavingScheme, monthlyAmount: number, taxRate: number): InvestmentPlan {
    const totalAmount = monthlyAmount * 12;
    const taxSaved = Math.round(totalAmount * taxRate);
    const netCost = totalAmount - taxSaved;

    return {
      scheme,
      monthlyAmount,
      totalAmount,
      taxSaved,
      netCost,
    };
  }

  /**
   * Get tax bracket percentage
   */
  private getTaxBracket(income: number): number {
    if (income <= 300000) return 0;
    if (income <= 600000) return 5;
    if (income <= 900000) return 10;
    if (income <= 1200000) return 15;
    if (income <= 1500000) return 20;
    return 30;
  }

  /**
   * Compare both tax regimes and recommend the better one
   */
  compareTaxRegimes(
    income: number,
    deductions: {
      section80C?: number;
      section80D?: number;
      section80CCD1B?: number;
      homeLoanInterest?: number;
    } = {}
  ): {
    newRegime: TaxCalculation;
    oldRegime: TaxCalculation;
    recommendation: 'new' | 'old';
    savings: number;
  } {
    const newRegime = this.calculateNewRegime(income);
    const oldRegime = this.calculateOldRegime(income, deductions);

    const recommendation = newRegime.totalTax < oldRegime.totalTax ? 'new' : 'old';
    const savings = Math.abs(newRegime.totalTax - oldRegime.totalTax);

    return {
      newRegime,
      oldRegime,
      recommendation,
      savings,
    };
  }
}

export const taxService = new TaxService();

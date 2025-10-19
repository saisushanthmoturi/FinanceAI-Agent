/**
 * Tax Optimization Service
 * 
 * Provides personalized tax-saving recommendations based on user's salary and financial situation
 * Supports both Old and New Tax Regimes in India
 */

import { getUserProfile } from './authService';
import type { UserProfile } from './authService';

// Tax Slabs for Old Regime (FY 2024-25)
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250001, max: 500000, rate: 5 },
  { min: 500001, max: 1000000, rate: 20 },
  { min: 1000001, max: Infinity, rate: 30 },
];

// Tax Slabs for New Regime (FY 2024-25)
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 600000, rate: 5 },
  { min: 600001, max: 900000, rate: 10 },
  { min: 900001, max: 1200000, rate: 15 },
  { min: 1200001, max: 1500000, rate: 20 },
  { min: 1500001, max: Infinity, rate: 30 },
];

export interface TaxCalculation {
  regime: 'old' | 'new';
  grossIncome: number;
  taxableIncome: number;
  totalDeductions: number;
  taxBeforeRebate: number;
  rebate: number;
  taxAfterRebate: number;
  cess: number;
  totalTaxLiability: number;
  effectiveTaxRate: number;
  slabWiseBreakdown: Array<{
    slab: string;
    amount: number;
    tax: number;
  }>;
}

export interface TaxSavingScheme {
  id: string;
  name: string;
  category: 'investment' | 'insurance' | 'loan' | 'donation' | 'savings';
  section: string;
  maxLimit: number;
  description: string;
  eligibility: string;
  benefits: string[];
  recommended: boolean;
  potentialSaving: number;
  lockInPeriod?: string;
  returns?: string;
  risk?: 'low' | 'medium' | 'high';
}

export interface TaxOptimizationReport {
  currentTax: TaxCalculation;
  optimizedTax: TaxCalculation;
  totalSavings: number;
  savingsPercentage: number;
  recommendations: TaxSavingScheme[];
  actionPlan: string[];
}

/**
 * Calculate tax based on income and regime
 */
export function calculateTax(income: number, regime: 'old' | 'new', deductions: number = 0): TaxCalculation {
  const slabs = regime === 'old' ? OLD_REGIME_SLABS : NEW_REGIME_SLABS;
  const taxableIncome = Math.max(0, income - deductions);
  
  let taxBeforeRebate = 0;
  const slabWiseBreakdown: Array<{ slab: string; amount: number; tax: number }> = [];

  for (const slab of slabs) {
    if (taxableIncome > slab.min) {
      const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
      const taxInSlab = (taxableInSlab * slab.rate) / 100;
      taxBeforeRebate += taxInSlab;

      if (taxInSlab > 0) {
        slabWiseBreakdown.push({
          slab: `₹${slab.min.toLocaleString('en-IN')} - ₹${slab.max === Infinity ? 'Above' : slab.max.toLocaleString('en-IN')}`,
          amount: taxableInSlab,
          tax: taxInSlab,
        });
      }
    }
  }

  // Rebate u/s 87A (for income up to 7 lakhs in new regime, 5 lakhs in old)
  const rebateLimit = regime === 'new' ? 700000 : 500000;
  const rebateAmount = regime === 'new' ? 25000 : 12500;
  const rebate = taxableIncome <= rebateLimit ? Math.min(taxBeforeRebate, rebateAmount) : 0;

  const taxAfterRebate = taxBeforeRebate - rebate;
  const cess = taxAfterRebate * 0.04; // 4% Health and Education Cess
  const totalTaxLiability = taxAfterRebate + cess;
  const effectiveTaxRate = income > 0 ? (totalTaxLiability / income) * 100 : 0;

  return {
    regime,
    grossIncome: income,
    taxableIncome,
    totalDeductions: deductions,
    taxBeforeRebate,
    rebate,
    taxAfterRebate,
    cess,
    totalTaxLiability,
    effectiveTaxRate,
    slabWiseBreakdown,
  };
}

/**
 * Get all tax-saving schemes applicable to user
 */
export function getTaxSavingSchemes(userProfile: UserProfile): TaxSavingScheme[] {
  const salary = userProfile.financialInfo?.annualSalary || 0;
  const hasHomeLoan = userProfile.financialInfo?.hasHomeLoan || false;
  const hasEducationLoan = userProfile.financialInfo?.hasEducationLoan || false;
  const age = userProfile.financialInfo?.age || 30;

  const schemes: TaxSavingScheme[] = [];

  // Section 80C - ₹1.5 Lakh limit
  schemes.push({
    id: '80c_ppf',
    name: 'Public Provident Fund (PPF)',
    category: 'savings',
    section: '80C',
    maxLimit: 150000,
    description: 'Long-term savings scheme with guaranteed returns and tax benefits',
    eligibility: 'All Indian citizens',
    benefits: [
      'Tax-free returns',
      'Government-backed safety',
      'Current interest rate: ~7.1%',
      'Compounding interest',
    ],
    recommended: salary >= 500000,
    potentialSaving: Math.min(150000, salary * 0.10) * 0.30, // Assuming 30% tax bracket
    lockInPeriod: '15 years',
    returns: '7-8% annually',
    risk: 'low',
  });

  schemes.push({
    id: '80c_elss',
    name: 'Equity Linked Savings Scheme (ELSS)',
    category: 'investment',
    section: '80C',
    maxLimit: 150000,
    description: 'Mutual funds with shortest lock-in period and potential for high returns',
    eligibility: 'All taxpayers',
    benefits: [
      'Shortest 3-year lock-in',
      'Potential for 12-15% returns',
      'Exposure to equity markets',
      'Tax deduction up to ₹1.5L',
    ],
    recommended: salary >= 600000 && age < 50,
    potentialSaving: Math.min(150000, salary * 0.15) * 0.30,
    lockInPeriod: '3 years',
    returns: '12-15% annually',
    risk: 'high',
  });

  schemes.push({
    id: '80c_nps',
    name: 'National Pension System (NPS)',
    category: 'savings',
    section: '80C + 80CCD(1B)',
    maxLimit: 200000, // 1.5L under 80C + 50K under 80CCD(1B)
    description: 'Retirement savings with additional ₹50,000 deduction',
    eligibility: 'All citizens aged 18-70',
    benefits: [
      'Extra ₹50K deduction over 80C',
      'Low-cost investment option',
      'Flexibility in fund allocation',
      'Tax-efficient retirement corpus',
    ],
    recommended: salary >= 800000,
    potentialSaving: 200000 * 0.30,
    lockInPeriod: 'Till retirement (60 years)',
    returns: '9-12% annually',
    risk: 'medium',
  });

  // Section 80D - Health Insurance
  schemes.push({
    id: '80d_health',
    name: 'Health Insurance Premium',
    category: 'insurance',
    section: '80D',
    maxLimit: age >= 60 ? 50000 : 25000,
    description: 'Deduction for health insurance premiums for self and family',
    eligibility: 'All taxpayers',
    benefits: [
      `₹${age >= 60 ? '50,000' : '25,000'} deduction for self/family`,
      'Additional ₹50K for parents above 60',
      'Coverage for medical emergencies',
      'Preventive health check-up: ₹5,000',
    ],
    recommended: true,
    potentialSaving: (age >= 60 ? 50000 : 25000) * 0.30,
    risk: 'low',
  });

  // Section 24(b) - Home Loan Interest
  if (hasHomeLoan) {
    schemes.push({
      id: '24b_homeloan',
      name: 'Home Loan Interest Deduction',
      category: 'loan',
      section: '24(b)',
      maxLimit: 200000,
      description: 'Deduction on interest paid for home loan',
      eligibility: 'Home loan borrowers',
      benefits: [
        'Up to ₹2 lakh deduction on interest',
        'No limit for let-out property',
        'Principal repayment under 80C',
        'Stamp duty and registration under 80C',
      ],
      recommended: true,
      potentialSaving: 200000 * 0.30,
      risk: 'low',
    });
  }

  // Section 80E - Education Loan Interest
  if (hasEducationLoan) {
    schemes.push({
      id: '80e_education',
      name: 'Education Loan Interest Deduction',
      category: 'loan',
      section: '80E',
      maxLimit: Infinity,
      description: 'Deduction on interest paid for education loan (No upper limit)',
      eligibility: 'Education loan borrowers',
      benefits: [
        'No maximum limit on deduction',
        'Available for 8 years or till loan is repaid',
        'Covers higher education in India/abroad',
        'For self, spouse, or children',
      ],
      recommended: true,
      potentialSaving: 50000 * 0.30, // Estimated
      risk: 'low',
    });
  }

  // Section 80G - Donations
  schemes.push({
    id: '80g_donation',
    name: 'Donations to Charitable Institutions',
    category: 'donation',
    section: '80G',
    maxLimit: Infinity,
    description: '50-100% deduction on donations to approved charitable institutions',
    eligibility: 'All taxpayers',
    benefits: [
      '100% deduction for PM Relief Fund',
      '50% deduction for approved NGOs',
      'Support social causes',
      'Tax certificate from institution',
    ],
    recommended: salary >= 1000000,
    potentialSaving: 50000 * 0.30, // Estimated
    risk: 'low',
  });

  // Section 80TTA/TTB - Interest on Savings
  schemes.push({
    id: age >= 60 ? '80ttb_interest' : '80tta_interest',
    name: 'Interest on Savings Account',
    category: 'savings',
    section: age >= 60 ? '80TTB' : '80TTA',
    maxLimit: age >= 60 ? 50000 : 10000,
    description: `Deduction on interest earned from savings account`,
    eligibility: age >= 60 ? 'Senior citizens' : 'All individuals below 60',
    benefits: [
      `₹${age >= 60 ? '50,000' : '10,000'} interest income tax-free`,
      'Applicable to savings/fixed deposits',
      age >= 60 ? 'Covers all deposit interest' : 'Only savings account interest',
      'Easy to claim',
    ],
    recommended: true,
    potentialSaving: (age >= 60 ? 50000 : 10000) * 0.30,
    risk: 'low',
  });

  // HRA Exemption (for salaried)
  if (userProfile.financialInfo?.employmentType === 'salaried') {
    schemes.push({
      id: 'hra_exemption',
      name: 'House Rent Allowance (HRA)',
      category: 'savings',
      section: 'Section 10(13A)',
      maxLimit: salary * 0.50, // Typically 50% of basic salary
      description: 'Tax exemption on HRA component of salary',
      eligibility: 'Salaried employees living in rented accommodation',
      benefits: [
        'Least of: Actual HRA, 50% of salary (metro) or 40% (non-metro), Rent minus 10% of salary',
        'Requires rent receipts',
        'PAN of landlord if rent > ₹1L/year',
        'Significant tax saving potential',
      ],
      recommended: true,
      potentialSaving: Math.min(salary * 0.30, 200000) * 0.30,
      risk: 'low',
    });
  }

  // Standard Deduction
  schemes.push({
    id: 'standard_deduction',
    name: 'Standard Deduction',
    category: 'savings',
    section: 'Section 16',
    maxLimit: 50000,
    description: 'Flat deduction for salaried individuals',
    eligibility: 'All salaried/pensioners',
    benefits: [
      'Automatic ₹50,000 deduction',
      'No documentation required',
      'Available in both tax regimes',
      'Replaces transport and medical allowances',
    ],
    recommended: true,
    potentialSaving: 50000 * 0.30,
    risk: 'low',
  });

  // LTA - Leave Travel Allowance
  if (userProfile.financialInfo?.employmentType === 'salaried') {
    schemes.push({
      id: 'lta_exemption',
      name: 'Leave Travel Allowance (LTA)',
      category: 'savings',
      section: 'Section 10(5)',
      maxLimit: 0, // Varies based on company policy
      description: 'Tax exemption on travel expenses during leave',
      eligibility: 'Salaried employees',
      benefits: [
        'Exemption on domestic travel expenses',
        'Can be claimed twice in a block of 4 years',
        'Covers shortest route fare',
        'Requires travel tickets',
      ],
      recommended: true,
      potentialSaving: 30000 * 0.30, // Estimated
      risk: 'low',
    });
  }

  return schemes.sort((a, b) => b.potentialSaving - a.potentialSaving);
}

/**
 * Generate comprehensive tax optimization report
 */
export async function generateTaxOptimizationReport(userId: string): Promise<TaxOptimizationReport> {
  const userProfile = await getUserProfile(userId);
  
  if (!userProfile.financialInfo?.annualSalary) {
    throw new Error('Annual salary information not provided. Please update your profile.');
  }

  const salary = userProfile.financialInfo.annualSalary;
  const regime = userProfile.financialInfo.taxRegime || 'new';

  // Calculate current tax (with minimal deductions)
  const standardDeduction = 50000;
  const currentTax = calculateTax(salary, regime, standardDeduction);

  // Get all applicable schemes
  const allSchemes = getTaxSavingSchemes(userProfile);
  const recommendedSchemes = allSchemes.filter(s => s.recommended);

  // Calculate optimized tax (with maximum deductions)
  let maxDeductions = standardDeduction;
  
  if (regime === 'old') {
    // Old regime allows these deductions
    maxDeductions += 150000; // 80C
    maxDeductions += 50000; // 80CCD(1B) for NPS
    maxDeductions += (userProfile.financialInfo.age && userProfile.financialInfo.age >= 60 ? 50000 : 25000); // 80D
    
    if (userProfile.financialInfo.hasHomeLoan) {
      maxDeductions += 200000; // 24(b)
    }
    
    if (userProfile.financialInfo.hasEducationLoan) {
      maxDeductions += 50000; // 80E (estimated)
    }
  }

  const optimizedTax = calculateTax(salary, regime, maxDeductions);

  const totalSavings = currentTax.totalTaxLiability - optimizedTax.totalTaxLiability;
  const savingsPercentage = currentTax.totalTaxLiability > 0 
    ? (totalSavings / currentTax.totalTaxLiability) * 100 
    : 0;

  // Generate action plan
  const actionPlan: string[] = [];
  
  if (recommendedSchemes.length > 0) {
    actionPlan.push('Invest in the recommended tax-saving schemes based on priority');
  }
  
  if (regime === 'new' && totalSavings > 50000) {
    actionPlan.push('Consider switching to Old Tax Regime for potentially higher savings');
  }
  
  actionPlan.push('Start investments early in the financial year for better returns');
  actionPlan.push('Keep all investment proofs and receipts for ITR filing');
  actionPlan.push('Review and update tax planning quarterly');
  
  if (userProfile.financialInfo.employmentType === 'salaried') {
    actionPlan.push('Submit investment declarations to employer for TDS optimization');
  }

  return {
    currentTax,
    optimizedTax,
    totalSavings,
    savingsPercentage,
    recommendations: recommendedSchemes,
    actionPlan,
  };
}

/**
 * Compare Old vs New Tax Regime
 */
export function compareregimes(salary: number, deductions: number = 0): {
  oldRegime: TaxCalculation;
  newRegime: TaxCalculation;
  recommendation: 'old' | 'new';
  savingsDifference: number;
} {
  const oldRegimeTax = calculateTax(salary, 'old', deductions);
  const newRegimeTax = calculateTax(salary, 'new', 0); // New regime doesn't allow most deductions

  const savingsDifference = oldRegimeTax.totalTaxLiability - newRegimeTax.totalTaxLiability;
  const recommendation = savingsDifference > 0 ? 'new' : 'old';

  return {
    oldRegime: oldRegimeTax,
    newRegime: newRegimeTax,
    recommendation,
    savingsDifference: Math.abs(savingsDifference),
  };
}

/**
 * Update user's financial information
 */
export async function updateFinancialInfo(
  userId: string,
  financialInfo: UserProfile['financialInfo']
): Promise<void> {
  try {
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../config/firebase');
    const { logActivity, ActivityType } = await import('./activityLogger');
    
    const userRef = doc(db, 'users', userId);
    
    // Update with server timestamp
    await updateDoc(userRef, {
      financialInfo,
      updatedAt: serverTimestamp(),
    });

    // Log the update
    await logActivity({
      userId,
      type: ActivityType.PROFILE_UPDATED,
      description: 'Financial information updated',
      metadata: {
        salary: financialInfo?.annualSalary,
        regime: financialInfo?.taxRegime,
      },
    });

    console.log('Financial info updated successfully for user:', userId);
  } catch (error) {
    console.error('Error updating financial info:', error);
    throw new Error('Failed to update financial information. Please try again.');
  }
}

/**
 * Loan & Tax Agent Service
 * AI-powered agent for loan recommendations and tax optimization strategies
 */

import type { UserFinancialProfile } from './userProfileService';
import { taxService } from './taxService';
import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText';

export interface LoanRecommendation {
  loanType: 'Home Loan' | 'Education Loan' | 'Personal Loan' | 'Top-up Loan';
  recommendedAmount: number;
  customAmount?: number; // User can override recommended amount
  purpose: string;
  taxBenefit: {
    section: string;
    annualSaving: number;
    lifeTimeSaving: number;
  };
  bestBanks: Array<{
    name: string;
    interestRate: number;
    processingFee: number;
    emi: number;
    specialFeatures: string[];
  }>;
  realTimeCalculations: {
    monthlyEMI: number;
    totalInterest: number;
    totalPayment: number;
    effectiveCost: number; // After tax benefits
    breakEvenPeriod: number; // Months
  };
  aiReasoning: string;
  riskAssessment: string;
  recommendation: 'Highly Recommended' | 'Recommended' | 'Consider Alternatives' | 'Not Recommended';
  allowCustomAmount: boolean; // Whether user can customize
}

export interface TaxOptimizationStrategy {
  strategyName: string;
  description: string;
  steps: string[];
  potentialSaving: number;
  implementationDifficulty: 'Easy' | 'Medium' | 'Complex';
  timeToImplement: string;
  requiredActions: Array<{
    action: string;
    priority: 'High' | 'Medium' | 'Low';
    deadline?: string;
    estimatedCost?: number;
  }>;
  aiInsights: string;
}

export interface PaymentConfirmation {
  confirmationId: string;
  userId: string;
  loanType: string;
  amount: number;
  bankName: string;
  emi: number;
  status: 'Pending Confirmation' | 'Confirmed' | 'Processing' | 'Completed' | 'Rejected';
  notification: {
    title: string;
    message: string;
    timestamp: Date;
    requiresAction: boolean;
  };
  paymentDetails: {
    processingFee: number;
    firstEMIDate: Date;
    accountNumber?: string;
    ifscCode?: string;
  };
  taxBenefitSummary: {
    annualSaving: number;
    lifeTimeSaving: number;
    effectiveCost: number;
  };
}

export class LoanTaxAgentService {
  /**
   * Get AI-powered loan recommendations based on user profile
   */
  async getLoanRecommendations(profile: UserFinancialProfile): Promise<LoanRecommendation[]> {
    const recommendations: LoanRecommendation[] = [];

    // Calculate affordability
    const monthlyIncome = profile.income.monthlySalary;
    const maxEMI = monthlyIncome * 0.40; // 40% of income for EMI

    // Calculate current EMI commitments
    const currentEMI = [...profile.deductions.homeLoan, ...profile.deductions.otherLoans]
      .reduce((sum, loan) => sum + loan.emi, 0);

    const availableEMI = maxEMI - currentEMI;

    // Home Loan Recommendation (if user doesn't have one)
    if (profile.deductions.homeLoan.length === 0 && monthlyIncome >= 30000) {
      const homeLoanRec = this.calculateHomeLoanRecommendation(monthlyIncome, availableEMI);
      recommendations.push(homeLoanRec);
    }

    // Education Loan (if user has children or wants to upskill)
    if (profile.personalInfo.age < 50) {
      const eduLoanRec = this.calculateEducationLoanRecommendation(monthlyIncome, availableEMI);
      recommendations.push(eduLoanRec);
    }

    // Personal Loan for Tax Planning (Short-term)
    if (availableEMI > 5000) {
      const personalLoanRec = this.calculatePersonalLoanForTax(monthlyIncome, availableEMI);
      recommendations.push(personalLoanRec);
    }

    // Get AI insights for each recommendation
    for (const rec of recommendations) {
      rec.aiReasoning = await this.getAIInsights(rec, profile);
    }

    return recommendations;
  }

  /**
   * Calculate Home Loan Recommendation with real-time data
   */
  private calculateHomeLoanRecommendation(monthlyIncome: number, availableEMI: number): LoanRecommendation {
    // Assume 20-year tenure, 8.5% interest
    const interestRate = 8.5;
    const tenure = 20 * 12; // 240 months
    
    // Calculate max loan amount based on available EMI
    const monthlyRate = interestRate / 12 / 100;
    const loanAmount = (availableEMI * (Math.pow(1 + monthlyRate, tenure) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, tenure));
    const recommendedAmount = Math.floor(loanAmount / 100000) * 100000; // Round to lakhs

    // Calculate EMI for recommended amount
    const emi = (recommendedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - recommendedAmount;

    // Tax benefits
    const annualInterest = totalInterest / 20; // Average per year
    const annualPrincipal = recommendedAmount / 20;
    const interestDeduction = Math.min(annualInterest, 200000); // Section 24(b) limit
    const principalDeduction = Math.min(annualPrincipal, 150000); // Section 80C limit
    const annualTaxSaving = (interestDeduction + principalDeduction) * 0.30; // 30% tax bracket
    const lifeTimeTaxSaving = annualTaxSaving * 20;

    const effectiveCost = totalPayment - lifeTimeTaxSaving;

    return {
      loanType: 'Home Loan',
      recommendedAmount,
      purpose: 'Purchase residential property with maximum tax benefits',
      taxBenefit: {
        section: '24(b) + 80C',
        annualSaving: Math.round(annualTaxSaving),
        lifeTimeSaving: Math.round(lifeTimeTaxSaving),
      },
      bestBanks: [
        {
          name: 'SBI Home Loan',
          interestRate: 8.50,
          processingFee: recommendedAmount * 0.0035,
          emi: Math.round(emi),
          specialFeatures: ['Lowest interest rate', 'Flexible prepayment', 'Tax benefits'],
        },
        {
          name: 'HDFC Home Loan',
          interestRate: 8.60,
          processingFee: recommendedAmount * 0.005,
          emi: Math.round(emi * 1.01),
          specialFeatures: ['Quick approval', 'Digital process', 'Balance transfer facility'],
        },
        {
          name: 'ICICI Home Loan',
          interestRate: 8.70,
          processingFee: recommendedAmount * 0.005,
          emi: Math.round(emi * 1.02),
          specialFeatures: ['Doorstep service', 'Women borrower benefits', 'Top-up facility'],
        },
      ],
      realTimeCalculations: {
        monthlyEMI: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        effectiveCost: Math.round(effectiveCost),
        breakEvenPeriod: Math.ceil((lifeTimeTaxSaving / totalPayment) * tenure),
      },
      aiReasoning: '',
      riskAssessment: monthlyIncome >= 50000 ? 'Low Risk' : 'Medium Risk',
      recommendation: recommendedAmount >= 2000000 ? 'Highly Recommended' : 'Recommended',
      allowCustomAmount: true, // User can customize home loan amount
    };
  }

  /**
   * Calculate Education Loan Recommendation
   */
  private calculateEducationLoanRecommendation(monthlyIncome: number, _availableEMI: number): LoanRecommendation {
    const interestRate = 9.5; // Education loan rate
    const tenure = 10 * 12; // 10 years
    const recommendedAmount = Math.min(1000000, monthlyIncome * 40); // Max 10L or 40x monthly income

    const monthlyRate = interestRate / 12 / 100;
    const emi = (recommendedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - recommendedAmount;

    // Education loan: Full interest deduction under Section 80E (no limit!)
    const annualTaxSaving = (totalInterest / 10) * 0.30;
    const lifeTimeTaxSaving = annualTaxSaving * 10;

    return {
      loanType: 'Education Loan',
      recommendedAmount,
      purpose: 'Higher education in India or abroad with 100% interest deduction',
      taxBenefit: {
        section: '80E',
        annualSaving: Math.round(annualTaxSaving),
        lifeTimeSaving: Math.round(lifeTimeTaxSaving),
      },
      bestBanks: [
        {
          name: 'SBI Student Loan',
          interestRate: 9.05,
          processingFee: 10000,
          emi: Math.round(emi * 0.98),
          specialFeatures: ['No collateral up to 7.5L', '100% finance', 'Moratorium period'],
        },
        {
          name: 'HDFC Credila',
          interestRate: 9.50,
          processingFee: 7500,
          emi: Math.round(emi),
          specialFeatures: ['Study abroad specialist', 'Quick sanction', 'Parent co-borrower'],
        },
        {
          name: 'Axis Bank Education Loan',
          interestRate: 9.70,
          processingFee: 10000,
          emi: Math.round(emi * 1.02),
          specialFeatures: ['Covers all expenses', 'Easy documentation', 'Top-up available'],
        },
      ],
      realTimeCalculations: {
        monthlyEMI: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        effectiveCost: Math.round(totalPayment - lifeTimeTaxSaving),
        breakEvenPeriod: tenure,
      },
      aiReasoning: '',
      riskAssessment: 'Low Risk (Investment in education)',
      recommendation: 'Highly Recommended',
      allowCustomAmount: true, // User can customize education loan amount
    };
  }

  /**
   * Calculate Personal Loan for Tax Planning
   */
  private calculatePersonalLoanForTax(_monthlyIncome: number, availableEMI: number): LoanRecommendation {
    const interestRate = 11.5;
    const tenure = 3 * 12; // 3 years
    const recommendedAmount = Math.min(300000, availableEMI * 30);

    const monthlyRate = interestRate / 12 / 100;
    const emi = (recommendedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - recommendedAmount;

    return {
      loanType: 'Personal Loan',
      recommendedAmount,
      purpose: 'Short-term liquidity for tax-saving investments (80C, 80CCD1B)',
      taxBenefit: {
        section: 'Indirect (via 80C investments)',
        annualSaving: Math.round(recommendedAmount * 0.30), // If invested in 80C
        lifeTimeSaving: Math.round(recommendedAmount * 0.30 * 3),
      },
      bestBanks: [
        {
          name: 'HDFC Personal Loan',
          interestRate: 10.75,
          processingFee: recommendedAmount * 0.02,
          emi: Math.round(emi * 0.95),
          specialFeatures: ['Instant approval', 'No collateral', 'Flexible tenure'],
        },
        {
          name: 'ICICI Instant Personal Loan',
          interestRate: 11.25,
          processingFee: recommendedAmount * 0.025,
          emi: Math.round(emi * 0.98),
          specialFeatures: ['Pre-approved offers', 'Digital process', '2-hour disbursal'],
        },
        {
          name: 'SBI Xpress Credit',
          interestRate: 11.50,
          processingFee: recommendedAmount * 0.01,
          emi: Math.round(emi),
          specialFeatures: ['Lowest processing fee', 'Existing customer benefits', 'Part prepayment'],
        },
      ],
      realTimeCalculations: {
        monthlyEMI: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        effectiveCost: Math.round(totalPayment - (recommendedAmount * 0.30)), // After tax benefit
        breakEvenPeriod: 12,
      },
      aiReasoning: '',
      riskAssessment: 'Medium Risk (Short-term debt)',
      recommendation: 'Consider Alternatives',
      allowCustomAmount: true, // User can customize personal loan amount
    };
  }

  /**
   * Get AI insights using Gemini API
   */
  private async getAIInsights(recommendation: LoanRecommendation, profile: UserFinancialProfile): Promise<string> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        return this.getFallbackInsights(recommendation, profile);
      }

      const prompt = `
You are a financial advisor AI. Analyze this loan recommendation for a user:

User Profile:
- Monthly Salary: ₹${profile.income.monthlySalary.toLocaleString()}
- Age: ${profile.personalInfo.age}
- Occupation: ${profile.personalInfo.occupation}

Loan Recommendation:
- Type: ${recommendation.loanType}
- Amount: ₹${recommendation.recommendedAmount.toLocaleString()}
- Monthly EMI: ₹${recommendation.realTimeCalculations.monthlyEMI.toLocaleString()}
- Tax Saving: ₹${recommendation.taxBenefit.annualSaving.toLocaleString()}/year

Provide a 2-sentence personalized insight on why this loan makes sense (or doesn't) for this user.
`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: { text: prompt },
          temperature: 0.7,
          maxOutputTokens: 150,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      const output = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text;
      return output || this.getFallbackInsights(recommendation, profile);
    } catch (error) {
      console.error('Error getting AI insights:', error);
      return this.getFallbackInsights(recommendation, profile);
    }
  }

  /**
   * Fallback insights when AI is unavailable
   */
  private getFallbackInsights(recommendation: LoanRecommendation, profile: UserFinancialProfile): string {
    const affordability = (recommendation.realTimeCalculations.monthlyEMI / profile.income.monthlySalary) * 100;

    if (recommendation.loanType === 'Home Loan') {
      if (affordability <= 30) {
        return `With your monthly salary of ₹${profile.income.monthlySalary.toLocaleString()}, the EMI of ₹${recommendation.realTimeCalculations.monthlyEMI.toLocaleString()} is highly affordable (${affordability.toFixed(1)}% of income). The tax savings of ₹${recommendation.taxBenefit.lifeTimeSaving.toLocaleString()} over 20 years make this an excellent wealth-building opportunity.`;
      } else {
        return `The EMI is ${affordability.toFixed(1)}% of your income, which is slightly high. Consider a smaller loan amount or longer tenure to reduce EMI burden while still enjoying tax benefits.`;
      }
    } else if (recommendation.loanType === 'Education Loan') {
      return `Education loans offer unlimited interest deduction under Section 80E. With total tax savings of ₹${recommendation.taxBenefit.lifeTimeSaving.toLocaleString()}, your effective cost is significantly reduced. This is an investment in career growth.`;
    } else {
      return `Personal loans for tax-saving investments can be strategic if you invest the amount wisely in 80C schemes. However, ensure the returns exceed the ${recommendation.bestBanks[0].interestRate}% interest cost.`;
    }
  }

  /**
   * Get comprehensive tax optimization strategies
   */
  async getTaxOptimizationStrategies(profile: UserFinancialProfile): Promise<TaxOptimizationStrategy[]> {
    const strategies: TaxOptimizationStrategy[] = [];

    const annualIncome = profile.income.annualSalary;
    // Calculate tax to determine potential savings
    taxService.calculateNewRegime(annualIncome);

    // Strategy 1: Maximize Section 80C
    if (profile.deductions.section80C.reduce((sum, d) => sum + d.amount, 0) < 150000) {
      strategies.push({
        strategyName: '80C Maximization Strategy',
        description: 'Maximize tax deduction of ₹1.5L under Section 80C through smart investments',
        steps: [
          'Invest ₹1.5L annually in ELSS mutual funds for wealth creation',
          'Or split: ₹75K in PPF (safe) + ₹75K in ELSS (growth)',
          'Allocate EPF contributions to reach the limit',
        ],
        potentialSaving: Math.round(150000 * 0.30), // ₹45,000
        implementationDifficulty: 'Easy',
        timeToImplement: '1 day',
        requiredActions: [
          {
            action: 'Open ELSS SIP with any mutual fund',
            priority: 'High',
            deadline: 'End of this month',
            estimatedCost: 12500, // ₹1.5L / 12 months
          },
        ],
        aiInsights: 'ELSS offers dual benefits: tax saving + potential 12-15% returns. Better than traditional FDs.',
      });
    }

    // Strategy 2: NPS Additional Deduction
    if (profile.deductions.section80CCD1B.reduce((sum, d) => sum + d.amount, 0) < 50000) {
      strategies.push({
        strategyName: 'NPS Extra Deduction',
        description: 'Get additional ₹50K deduction over and above 80C limit',
        steps: [
          'Open NPS account online (5 minutes)',
          'Invest ₹50,000 annually',
          'Choose equity-heavy option for better returns',
        ],
        potentialSaving: Math.round(50000 * 0.30), // ₹15,000
        implementationDifficulty: 'Easy',
        timeToImplement: '1 hour',
        requiredActions: [
          {
            action: 'Open NPS account via eNPS portal',
            priority: 'High',
            estimatedCost: 4200, // ₹50K / 12
          },
        ],
        aiInsights: 'NPS is the only way to get tax benefit beyond ₹1.5L limit. Perfect for retirement planning.',
      });
    }

    // Strategy 3: Health Insurance
    if (profile.deductions.section80D.reduce((sum, d) => sum + d.amount, 0) < 25000) {
      strategies.push({
        strategyName: 'Health Insurance Coverage',
        description: 'Get ₹25K deduction + essential health coverage',
        steps: [
          'Buy health insurance for self and family',
          'Premium up to ₹25K qualifies for deduction',
          'Additional ₹25K if parents are above 60',
        ],
        potentialSaving: Math.round(25000 * 0.30), // ₹7,500
        implementationDifficulty: 'Medium',
        timeToImplement: '1 week',
        requiredActions: [
          {
            action: 'Compare health insurance plans online',
            priority: 'High',
            estimatedCost: 15000,
          },
        ],
        aiInsights: 'Essential for medical emergencies. Tax benefit is a bonus on necessary protection.',
      });
    }

    // Strategy 4: Home Loan (if applicable)
    if (profile.deductions.homeLoan.length === 0 && annualIncome > 500000) {
      strategies.push({
        strategyName: 'Home Loan for Maximum Tax Benefit',
        description: 'Property ownership + up to ₹3.5L annual tax deduction',
        steps: [
          'Home loan interest: Up to ₹2L deduction (Section 24b)',
          'Principal repayment: Up to ₹1.5L (under 80C)',
          'Total potential deduction: ₹3.5L annually',
        ],
        potentialSaving: Math.round(350000 * 0.30), // ₹1,05,000
        implementationDifficulty: 'Complex',
        timeToImplement: '1-2 months',
        requiredActions: [
          {
            action: 'Research property options in your budget',
            priority: 'Medium',
          },
          {
            action: 'Get pre-approved home loan',
            priority: 'Medium',
          },
        ],
        aiInsights: 'Largest tax benefit available. Combines wealth creation with tax optimization.',
      });
    }

    return strategies;
  }

  /**
   * Execute loan application (AI Agent)
   */
  async executeLoanApplication(
    _userId: string, // Prefixed with _ to indicate intentionally unused
    loanRecommendation: LoanRecommendation,
    bankChoice: number
  ): Promise<{
    status: 'success' | 'pending' | 'error';
    message: string;
    applicationId?: string;
    nextSteps: string[];
  }> {
    // Simulate loan application process
    const bank = loanRecommendation.bestBanks[bankChoice];

    return {
      status: 'success',
      message: `Loan application initiated with ${bank.name}`,
      applicationId: `LOAN${Date.now()}`,
      nextSteps: [
        '1. Upload required documents (PAN, Aadhaar, Salary slips)',
        '2. Bank will verify your details within 24 hours',
        '3. Property valuation (for home loans)',
        '4. Loan sanction within 3-5 days',
        '5. Disbursal after documentation',
      ],
    };
  }

  /**
   * Recalculate loan with custom amount provided by user
   */
  async recalculateWithCustomAmount(
    loanType: 'Home Loan' | 'Education Loan' | 'Personal Loan',
    customAmount: number,
    profile: UserFinancialProfile
  ): Promise<LoanRecommendation> {
    // Get the appropriate calculation method based on loan type
    let recommendation: LoanRecommendation;

    if (loanType === 'Home Loan') {
      recommendation = this.calculateCustomHomeLoan(customAmount, profile.income.monthlySalary);
    } else if (loanType === 'Education Loan') {
      recommendation = this.calculateCustomEducationLoan(customAmount);
    } else {
      recommendation = this.calculateCustomPersonalLoan(customAmount);
    }

    // Get AI insights for custom amount
    recommendation.aiReasoning = await this.getAIInsightsForCustomAmount(
      recommendation,
      profile,
      customAmount
    );

    return recommendation;
  }

  /**
   * Calculate custom home loan
   */
  private calculateCustomHomeLoan(customAmount: number, monthlyIncome: number): LoanRecommendation {
    const interestRate = 8.5;
    const tenure = 20 * 12;
    
    const monthlyRate = interestRate / 12 / 100;
    const emi = (customAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - customAmount;

    const annualInterest = totalInterest / 20;
    const annualPrincipal = customAmount / 20;
    const interestDeduction = Math.min(annualInterest, 200000);
    const principalDeduction = Math.min(annualPrincipal, 150000);
    const annualTaxSaving = (interestDeduction + principalDeduction) * 0.30;
    const lifeTimeTaxSaving = annualTaxSaving * 20;

    const effectiveCost = totalPayment - lifeTimeTaxSaving;
    const affordability = (emi / monthlyIncome) * 100;

    return {
      loanType: 'Home Loan',
      recommendedAmount: customAmount,
      customAmount: customAmount,
      purpose: 'Purchase residential property with maximum tax benefits',
      taxBenefit: {
        section: '24(b) + 80C',
        annualSaving: Math.round(annualTaxSaving),
        lifeTimeSaving: Math.round(lifeTimeTaxSaving),
      },
      bestBanks: [
        {
          name: 'SBI Home Loan',
          interestRate: 8.50,
          processingFee: customAmount * 0.0035,
          emi: Math.round(emi),
          specialFeatures: ['Lowest interest rate', 'Flexible prepayment', 'Tax benefits'],
        },
        {
          name: 'HDFC Home Loan',
          interestRate: 8.60,
          processingFee: customAmount * 0.005,
          emi: Math.round(emi * 1.01),
          specialFeatures: ['Quick approval', 'Digital process', 'Balance transfer facility'],
        },
        {
          name: 'ICICI Home Loan',
          interestRate: 8.70,
          processingFee: customAmount * 0.005,
          emi: Math.round(emi * 1.02),
          specialFeatures: ['Doorstep service', 'Women borrower benefits', 'Top-up facility'],
        },
      ],
      realTimeCalculations: {
        monthlyEMI: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        effectiveCost: Math.round(effectiveCost),
        breakEvenPeriod: Math.ceil((lifeTimeTaxSaving / totalPayment) * tenure),
      },
      aiReasoning: '',
      riskAssessment: affordability <= 40 ? 'Low Risk' : affordability <= 50 ? 'Medium Risk' : 'High Risk',
      recommendation: affordability <= 40 ? 'Highly Recommended' : affordability <= 50 ? 'Recommended' : 'Not Recommended',
      allowCustomAmount: true,
    };
  }

  /**
   * Calculate custom education loan
   */
  private calculateCustomEducationLoan(customAmount: number): LoanRecommendation {
    const interestRate = 9.5;
    const tenure = 10 * 12;

    const monthlyRate = interestRate / 12 / 100;
    const emi = (customAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - customAmount;
    const annualTaxSaving = (totalInterest / 10) * 0.30;
    const lifeTimeTaxSaving = annualTaxSaving * 10;

    return {
      loanType: 'Education Loan',
      recommendedAmount: customAmount,
      customAmount: customAmount,
      purpose: 'Higher education in India or abroad with 100% interest deduction',
      taxBenefit: {
        section: '80E',
        annualSaving: Math.round(annualTaxSaving),
        lifeTimeSaving: Math.round(lifeTimeTaxSaving),
      },
      bestBanks: [
        {
          name: 'SBI Student Loan',
          interestRate: 9.05,
          processingFee: 10000,
          emi: Math.round(emi * 0.98),
          specialFeatures: ['No collateral up to 7.5L', '100% finance', 'Moratorium period'],
        },
        {
          name: 'HDFC Credila',
          interestRate: 9.50,
          processingFee: 7500,
          emi: Math.round(emi),
          specialFeatures: ['Study abroad specialist', 'Quick sanction', 'Parent co-borrower'],
        },
        {
          name: 'Axis Bank Education Loan',
          interestRate: 9.70,
          processingFee: 10000,
          emi: Math.round(emi * 1.02),
          specialFeatures: ['Covers all expenses', 'Easy documentation', 'Top-up available'],
        },
      ],
      realTimeCalculations: {
        monthlyEMI: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        effectiveCost: Math.round(totalPayment - lifeTimeTaxSaving),
        breakEvenPeriod: tenure,
      },
      aiReasoning: '',
      riskAssessment: 'Low Risk (Investment in education)',
      recommendation: 'Highly Recommended',
      allowCustomAmount: true,
    };
  }

  /**
   * Calculate custom personal loan
   */
  private calculateCustomPersonalLoan(customAmount: number): LoanRecommendation {
    const interestRate = 11.5;
    const tenure = 3 * 12;

    const monthlyRate = interestRate / 12 / 100;
    const emi = (customAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - customAmount;

    return {
      loanType: 'Personal Loan',
      recommendedAmount: customAmount,
      customAmount: customAmount,
      purpose: 'Short-term liquidity for tax-saving investments (80C, 80CCD1B)',
      taxBenefit: {
        section: 'Indirect (via 80C investments)',
        annualSaving: Math.round(customAmount * 0.30),
        lifeTimeSaving: Math.round(customAmount * 0.30 * 3),
      },
      bestBanks: [
        {
          name: 'HDFC Personal Loan',
          interestRate: 10.75,
          processingFee: customAmount * 0.02,
          emi: Math.round(emi * 0.95),
          specialFeatures: ['Instant approval', 'No collateral', 'Flexible tenure'],
        },
        {
          name: 'ICICI Instant Personal Loan',
          interestRate: 11.25,
          processingFee: customAmount * 0.025,
          emi: Math.round(emi * 0.98),
          specialFeatures: ['Pre-approved offers', 'Digital process', '2-hour disbursal'],
        },
        {
          name: 'SBI Xpress Credit',
          interestRate: 11.50,
          processingFee: customAmount * 0.01,
          emi: Math.round(emi),
          specialFeatures: ['Lowest processing fee', 'Existing customer benefits', 'Part prepayment'],
        },
      ],
      realTimeCalculations: {
        monthlyEMI: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        effectiveCost: Math.round(totalPayment - (customAmount * 0.30)),
        breakEvenPeriod: 12,
      },
      aiReasoning: '',
      riskAssessment: 'Medium Risk (Short-term debt)',
      recommendation: customAmount <= 300000 ? 'Recommended' : 'Consider Alternatives',
      allowCustomAmount: true,
    };
  }

  /**
   * Get AI insights for custom amount
   */
  private async getAIInsightsForCustomAmount(
    recommendation: LoanRecommendation,
    profile: UserFinancialProfile,
    customAmount: number
  ): Promise<string> {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
        return this.getFallbackInsightsForCustom(recommendation, profile, customAmount);
      }

      const prompt = `
You are a financial advisor AI analyzing a custom loan amount.

User Profile:
- Monthly Salary: ₹${profile.income.monthlySalary.toLocaleString()}
- Age: ${profile.personalInfo.age}

Custom Loan Request:
- Type: ${recommendation.loanType}
- Amount: ₹${customAmount.toLocaleString()}
- Monthly EMI: ₹${recommendation.realTimeCalculations.monthlyEMI.toLocaleString()}
- EMI as % of income: ${((recommendation.realTimeCalculations.monthlyEMI / profile.income.monthlySalary) * 100).toFixed(1)}%

Provide a 2-sentence analysis: Is this custom amount suitable for the user? Why or why not?
`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: { text: prompt },
          temperature: 0.7,
          maxOutputTokens: 150,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      const output = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text;
      return output || this.getFallbackInsightsForCustom(recommendation, profile, customAmount);
    } catch (error) {
      console.error('Error getting AI insights:', error);
      return this.getFallbackInsightsForCustom(recommendation, profile, customAmount);
    }
  }

  /**
   * Fallback insights for custom amount
   */
  private getFallbackInsightsForCustom(
    recommendation: LoanRecommendation,
    profile: UserFinancialProfile,
    customAmount: number
  ): string {
    const emiPercent = (recommendation.realTimeCalculations.monthlyEMI / profile.income.monthlySalary) * 100;

    if (emiPercent <= 30) {
      return `✅ Your custom amount of ₹${customAmount.toLocaleString()} is highly affordable at ${emiPercent.toFixed(1)}% of your income. With tax savings of ₹${recommendation.taxBenefit.lifeTimeSaving.toLocaleString()}, this is an excellent financial decision.`;
    } else if (emiPercent <= 40) {
      return `⚠️ Your custom amount of ₹${customAmount.toLocaleString()} results in EMI of ${emiPercent.toFixed(1)}% of income, which is manageable but slightly tight. Ensure you have emergency funds before proceeding.`;
    } else if (emiPercent <= 50) {
      return `⚠️ The EMI of ₹${recommendation.realTimeCalculations.monthlyEMI.toLocaleString()} (${emiPercent.toFixed(1)}% of income) is high. Consider reducing the loan amount to ₹${Math.round(customAmount * 0.7 / 100000) * 100000} for better financial health.`;
    } else {
      return `❌ The custom amount of ₹${customAmount.toLocaleString()} is NOT RECOMMENDED. EMI would be ${emiPercent.toFixed(1)}% of your income, leaving insufficient funds for other expenses. Maximum recommended: ₹${Math.round((profile.income.monthlySalary * 0.40 * 240) / 100000) * 100000}.`;
    }
  }

  /**
   * Create payment confirmation and send notification
   */
  async createPaymentConfirmation(
    userId: string,
    loanRecommendation: LoanRecommendation,
    bankChoice: number
  ): Promise<PaymentConfirmation> {
    const bank = loanRecommendation.bestBanks[bankChoice];
    const amount = loanRecommendation.customAmount || loanRecommendation.recommendedAmount;

    const confirmation: PaymentConfirmation = {
      confirmationId: `CONF${Date.now()}`,
      userId,
      loanType: loanRecommendation.loanType,
      amount,
      bankName: bank.name,
      emi: bank.emi,
      status: 'Pending Confirmation',
      notification: {
        title: `🔔 Loan Application Ready for Confirmation`,
        message: `AI Agent has found the best ${loanRecommendation.loanType} option for you!\n\n` +
                 `Bank: ${bank.name}\n` +
                 `Amount: ₹${amount.toLocaleString()}\n` +
                 `Monthly EMI: ₹${bank.emi.toLocaleString()}\n` +
                 `Interest Rate: ${bank.interestRate}%\n` +
                 `Annual Tax Saving: ₹${loanRecommendation.taxBenefit.annualSaving.toLocaleString()}\n\n` +
                 `💡 AI Insight: ${loanRecommendation.aiReasoning}\n\n` +
                 `Please confirm to proceed with the application.`,
        timestamp: new Date(),
        requiresAction: true,
      },
      paymentDetails: {
        processingFee: bank.processingFee,
        firstEMIDate: this.getFirstEMIDate(),
        accountNumber: undefined, // Will be filled after confirmation
        ifscCode: undefined,
      },
      taxBenefitSummary: {
        annualSaving: loanRecommendation.taxBenefit.annualSaving,
        lifeTimeSaving: loanRecommendation.taxBenefit.lifeTimeSaving,
        effectiveCost: loanRecommendation.realTimeCalculations.effectiveCost,
      },
    };

    // Save to localStorage for now (in production, save to Firestore)
    const confirmations = JSON.parse(localStorage.getItem('payment_confirmations') || '[]');
    confirmations.push(confirmation);
    localStorage.setItem('payment_confirmations', JSON.stringify(confirmations));

    console.log('✅ Payment confirmation created:', confirmation.confirmationId);
    console.log('📧 Notification sent to user');

    return confirmation;
  }

  /**
   * Confirm payment and proceed with loan application
   */
  async confirmPayment(confirmationId: string): Promise<{
    status: 'success' | 'error';
    message: string;
    applicationId?: string;
    nextSteps?: string[];
  }> {
    try {
      // Get confirmation from localStorage
      const confirmations = JSON.parse(localStorage.getItem('payment_confirmations') || '[]');
      const confirmationIndex = confirmations.findIndex(
        (c: PaymentConfirmation) => c.confirmationId === confirmationId
      );

      if (confirmationIndex === -1) {
        return {
          status: 'error',
          message: 'Confirmation not found',
        };
      }

      const confirmation = confirmations[confirmationIndex];

      // Update status
      confirmation.status = 'Confirmed';
      confirmation.notification.requiresAction = false;

      // Generate application ID
      const applicationId = `LOAN${Date.now()}`;

      // Update localStorage
      confirmations[confirmationIndex] = confirmation;
      localStorage.setItem('payment_confirmations', JSON.stringify(confirmations));

      console.log('✅ Payment confirmed:', confirmationId);
      console.log('📋 Loan application initiated:', applicationId);

      return {
        status: 'success',
        message: `🎉 Loan application confirmed successfully!\n\nApplication ID: ${applicationId}\nBank: ${confirmation.bankName}`,
        applicationId,
        nextSteps: [
          `1. Processing fee of ₹${confirmation.paymentDetails.processingFee.toLocaleString()} will be deducted`,
          `2. Upload required documents (PAN, Aadhaar, Salary slips, Bank statements)`,
          `3. Bank will verify your details within 24-48 hours`,
          `4. Credit score check and income verification`,
          `5. Loan sanction within 3-5 working days`,
          `6. Property valuation (for ${confirmation.loanType})`,
          `7. Legal verification and documentation`,
          `8. Loan disbursal to your account`,
          `9. First EMI on ${confirmation.paymentDetails.firstEMIDate.toLocaleDateString()}`,
          `\n💰 You'll save ₹${confirmation.taxBenefitSummary.annualSaving.toLocaleString()}/year in taxes!`,
        ],
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        status: 'error',
        message: 'Failed to confirm payment. Please try again.',
      };
    }
  }

  /**
   * Reject payment confirmation
   */
  async rejectPayment(confirmationId: string): Promise<void> {
    const confirmations = JSON.parse(localStorage.getItem('payment_confirmations') || '[]');
    const confirmationIndex = confirmations.findIndex(
      (c: PaymentConfirmation) => c.confirmationId === confirmationId
    );

    if (confirmationIndex >= 0) {
      confirmations[confirmationIndex].status = 'Rejected';
      localStorage.setItem('payment_confirmations', JSON.stringify(confirmations));
      console.log('❌ Payment confirmation rejected:', confirmationId);
    }
  }

  /**
   * Get all pending confirmations for user
   */
  async getPendingConfirmations(userId: string): Promise<PaymentConfirmation[]> {
    const confirmations = JSON.parse(localStorage.getItem('payment_confirmations') || '[]');
    return confirmations.filter(
      (c: PaymentConfirmation) => c.userId === userId && c.status === 'Pending Confirmation'
    );
  }

  /**
   * Calculate first EMI date (typically 30-45 days after disbursal)
   */
  private getFirstEMIDate(): Date {
    const today = new Date();
    today.setDate(today.getDate() + 45); // 45 days from now
    return today;
  }
}

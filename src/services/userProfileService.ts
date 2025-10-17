/**
 * User Profile Service
 * Manages user financial profile including salary, deductions, and custom properties
 */

import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserFinancialProfile {
  userId: string;
  personalInfo: {
    name: string;
    age: number;
    occupation: string;
    pan?: string;
  };
  income: {
    monthlySalary: number;
    annualSalary: number;
    otherIncome: number;
    rentalIncome: number;
    businessIncome: number;
    lastUpdated: Date;
  };
  deductions: {
    section80C: CustomDeduction[];
    section80D: CustomDeduction[];
    section80CCD1B: CustomDeduction[];
    homeLoan: LoanDetails[];
    otherLoans: LoanDetails[];
    customDeductions: CustomDeduction[];
  };
  investments: {
    active: Investment[];
    planned: Investment[];
  };
  taxRegime: 'old' | 'new';
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomDeduction {
  id: string;
  name: string;
  category: string; // '80C', '80D', '80CCD1B', 'Custom'
  amount: number;
  type: 'EPF' | 'PPF' | 'ELSS' | 'Insurance' | 'Health Insurance' | 'NPS' | 'Home Loan' | 'Education Loan' | 'Custom';
  description: string;
  startDate: Date;
  endDate?: Date;
  isRecurring: boolean;
  frequency?: 'Monthly' | 'Quarterly' | 'Yearly';
  proof?: string; // Document URL
  verified: boolean;
}

export interface LoanDetails {
  id: string;
  loanType: 'Home Loan' | 'Education Loan' | 'Personal Loan' | 'Car Loan' | 'Business Loan';
  bankName: string;
  principalAmount: number;
  outstandingAmount: number;
  interestRate: number;
  emi: number;
  tenure: number; // in months
  startDate: Date;
  endDate: Date;
  taxBenefit: {
    section: string;
    maxDeduction: number;
    currentYearBenefit: number;
  };
  calculatedData: {
    totalInterestPaid: number;
    principalPaid: number;
    remainingTenure: number;
    totalTaxSaved: number;
  };
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  expectedReturn: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  taxBenefit?: string;
}

export class UserProfileService {
  /**
   * Get user financial profile
   */
  async getProfile(userId: string): Promise<UserFinancialProfile | null> {
    try {
      const docRef = doc(db, 'user_profiles', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          income: {
            ...data.income,
            lastUpdated: data.income.lastUpdated?.toDate() || new Date(),
          },
          deductions: {
            ...data.deductions,
            section80C: data.deductions.section80C?.map((d: any) => ({
              ...d,
              startDate: d.startDate?.toDate() || new Date(),
              endDate: d.endDate?.toDate(),
            })) || [],
            section80D: data.deductions.section80D?.map((d: any) => ({
              ...d,
              startDate: d.startDate?.toDate() || new Date(),
              endDate: d.endDate?.toDate(),
            })) || [],
            section80CCD1B: data.deductions.section80CCD1B?.map((d: any) => ({
              ...d,
              startDate: d.startDate?.toDate() || new Date(),
              endDate: d.endDate?.toDate(),
            })) || [],
            homeLoan: data.deductions.homeLoan?.map((l: any) => ({
              ...l,
              startDate: l.startDate?.toDate() || new Date(),
              endDate: l.endDate?.toDate() || new Date(),
            })) || [],
            otherLoans: data.deductions.otherLoans?.map((l: any) => ({
              ...l,
              startDate: l.startDate?.toDate() || new Date(),
              endDate: l.endDate?.toDate() || new Date(),
            })) || [],
            customDeductions: data.deductions.customDeductions || [],
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserFinancialProfile;
      }

      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Fallback to localStorage
      const localProfile = localStorage.getItem(`profile_${userId}`);
      return localProfile ? JSON.parse(localProfile) : null;
    }
  }

  /**
   * Update salary in profile
   */
  async updateSalary(userId: string, monthlySalary: number): Promise<void> {
    try {
      const docRef = doc(db, 'user_profiles', userId);
      await updateDoc(docRef, {
        'income.monthlySalary': monthlySalary,
        'income.annualSalary': monthlySalary * 12,
        'income.lastUpdated': new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Salary updated successfully');
    } catch (error) {
      console.error('Error updating salary:', error);
      
      // Fallback to localStorage
      const profile = await this.getProfile(userId);
      if (profile) {
        profile.income.monthlySalary = monthlySalary;
        profile.income.annualSalary = monthlySalary * 12;
        profile.income.lastUpdated = new Date();
        localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
      }
    }
  }

  /**
   * Add custom deduction
   */
  async addCustomDeduction(userId: string, deduction: Omit<CustomDeduction, 'id'>): Promise<CustomDeduction> {
    try {
      const newDeduction: CustomDeduction = {
        ...deduction,
        id: Date.now().toString(),
      };

      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Add to appropriate category
      if (deduction.category === '80C') {
        profile.deductions.section80C.push(newDeduction);
      } else if (deduction.category === '80D') {
        profile.deductions.section80D.push(newDeduction);
      } else if (deduction.category === '80CCD1B') {
        profile.deductions.section80CCD1B.push(newDeduction);
      } else {
        profile.deductions.customDeductions.push(newDeduction);
      }

      profile.updatedAt = new Date();

      // Save to Firestore
      const docRef = doc(db, 'user_profiles', userId);
      await setDoc(docRef, profile);

      console.log('✅ Custom deduction added:', newDeduction.name);
      return newDeduction;
    } catch (error) {
      console.error('Error adding deduction:', error);
      throw error;
    }
  }

  /**
   * Add loan details with real-time calculations
   */
  async addLoan(userId: string, loan: Omit<LoanDetails, 'id' | 'calculatedData'>): Promise<LoanDetails> {
    try {
      // Calculate loan details in real-time
      const calculatedData = this.calculateLoanDetails(loan);

      const newLoan: LoanDetails = {
        ...loan,
        id: Date.now().toString(),
        calculatedData,
      };

      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      if (loan.loanType === 'Home Loan') {
        profile.deductions.homeLoan.push(newLoan);
      } else {
        profile.deductions.otherLoans.push(newLoan);
      }

      profile.updatedAt = new Date();

      // Save to Firestore
      const docRef = doc(db, 'user_profiles', userId);
      await setDoc(docRef, profile);

      console.log('✅ Loan added:', newLoan.loanType);
      return newLoan;
    } catch (error) {
      console.error('Error adding loan:', error);
      throw error;
    }
  }

  /**
   * Calculate real-time loan details
   */
  private calculateLoanDetails(loan: Omit<LoanDetails, 'id' | 'calculatedData'>): LoanDetails['calculatedData'] {
    const monthlyInterestRate = loan.interestRate / 12 / 100;
    const numberOfPayments = loan.tenure;

    // Calculate total interest
    const totalAmount = loan.emi * numberOfPayments;
    const totalInterestPaid = totalAmount - loan.principalAmount;
    const principalPaid = loan.principalAmount - loan.outstandingAmount;

    // Calculate remaining tenure
    const monthsElapsed = Math.ceil(principalPaid / (loan.emi - (loan.outstandingAmount * monthlyInterestRate)));
    const remainingTenure = numberOfPayments - monthsElapsed;

    // Calculate tax saved based on loan type
    let totalTaxSaved = 0;
    if (loan.loanType === 'Home Loan') {
      // Home loan interest: Up to ₹2L under Section 24(b)
      // Principal: Up to ₹1.5L under Section 80C
      const interestDeduction = Math.min(totalInterestPaid, 200000);
      const principalDeduction = Math.min(principalPaid, 150000);
      totalTaxSaved = (interestDeduction + principalDeduction) * 0.30; // Assuming 30% tax bracket
    } else if (loan.loanType === 'Education Loan') {
      // Education loan: Full interest deduction under Section 80E
      totalTaxSaved = totalInterestPaid * 0.30;
    }

    return {
      totalInterestPaid: Math.round(totalInterestPaid),
      principalPaid: Math.round(principalPaid),
      remainingTenure,
      totalTaxSaved: Math.round(totalTaxSaved),
    };
  }

  /**
   * Get total deductions for tax calculation
   */
  getTotalDeductions(profile: UserFinancialProfile): {
    section80C: number;
    section80D: number;
    section80CCD1B: number;
    homeLoanInterest: number;
    educationLoanInterest: number;
    total: number;
  } {
    const section80C = profile.deductions.section80C.reduce((sum, d) => sum + d.amount, 0);
    const section80D = profile.deductions.section80D.reduce((sum, d) => sum + d.amount, 0);
    const section80CCD1B = profile.deductions.section80CCD1B.reduce((sum, d) => sum + d.amount, 0);
    
    // Home loan interest
    const homeLoanInterest = profile.deductions.homeLoan.reduce((sum, loan) => {
      const monthlyInterestRate = loan.interestRate / 12 / 100;
      const monthlyInterest = loan.outstandingAmount * monthlyInterestRate;
      return sum + (monthlyInterest * 12); // Annual interest
    }, 0);

    // Education loan interest
    const educationLoanInterest = profile.deductions.otherLoans
      .filter(loan => loan.loanType === 'Education Loan')
      .reduce((sum, loan) => {
        const monthlyInterestRate = loan.interestRate / 12 / 100;
        const monthlyInterest = loan.outstandingAmount * monthlyInterestRate;
        return sum + (monthlyInterest * 12);
      }, 0);

    const total = section80C + section80D + section80CCD1B + homeLoanInterest + educationLoanInterest;

    return {
      section80C: Math.min(section80C, 150000), // Max limit
      section80D: Math.min(section80D, 25000),
      section80CCD1B: Math.min(section80CCD1B, 50000),
      homeLoanInterest: Math.min(homeLoanInterest, 200000),
      educationLoanInterest, // No limit
      total,
    };
  }

  /**
   * Create initial profile
   */
  async createProfile(userId: string, data: Partial<UserFinancialProfile>): Promise<UserFinancialProfile> {
    const profile: UserFinancialProfile = {
      userId,
      personalInfo: data.personalInfo || {
        name: '',
        age: 0,
        occupation: '',
      },
      income: data.income || {
        monthlySalary: 0,
        annualSalary: 0,
        otherIncome: 0,
        rentalIncome: 0,
        businessIncome: 0,
        lastUpdated: new Date(),
      },
      deductions: {
        section80C: [],
        section80D: [],
        section80CCD1B: [],
        homeLoan: [],
        otherLoans: [],
        customDeductions: [],
      },
      investments: {
        active: [],
        planned: [],
      },
      taxRegime: data.taxRegime || 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const docRef = doc(db, 'user_profiles', userId);
      await setDoc(docRef, profile);
      console.log('✅ Profile created successfully');
    } catch (error) {
      console.error('Error creating profile:', error);
      localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
    }

    return profile;
  }

  /**
   * Delete custom deduction
   */
  async deleteDeduction(userId: string, deductionId: string, category: string): Promise<void> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) return;

      if (category === '80C') {
        profile.deductions.section80C = profile.deductions.section80C.filter(d => d.id !== deductionId);
      } else if (category === '80D') {
        profile.deductions.section80D = profile.deductions.section80D.filter(d => d.id !== deductionId);
      } else if (category === '80CCD1B') {
        profile.deductions.section80CCD1B = profile.deductions.section80CCD1B.filter(d => d.id !== deductionId);
      } else {
        profile.deductions.customDeductions = profile.deductions.customDeductions.filter(d => d.id !== deductionId);
      }

      profile.updatedAt = new Date();

      const docRef = doc(db, 'user_profiles', userId);
      await setDoc(docRef, profile);

      console.log('✅ Deduction deleted');
    } catch (error) {
      console.error('Error deleting deduction:', error);
    }
  }

  /**
   * Delete loan
   */
  async deleteLoan(userId: string, loanId: string): Promise<void> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) return;

      profile.deductions.homeLoan = profile.deductions.homeLoan.filter(l => l.id !== loanId);
      profile.deductions.otherLoans = profile.deductions.otherLoans.filter(l => l.id !== loanId);

      profile.updatedAt = new Date();

      const docRef = doc(db, 'user_profiles', userId);
      await setDoc(docRef, profile);

      console.log('✅ Loan deleted');
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  }
}

export const userProfileService = new UserProfileService();

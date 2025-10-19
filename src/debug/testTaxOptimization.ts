/**
 * Debug Script for Tax Optimization
 * Run this to test if data is being saved and retrieved correctly
 */

import { updateFinancialInfo, generateTaxOptimizationReport } from '../services/taxOptimizationService';
import { getUserProfile } from '../services/authService';
import type { UserProfile } from '../services/authService';

/**
 * Test the complete flow:
 * 1. Update financial info
 * 2. Retrieve user profile
 * 3. Generate tax report
 */
export async function testTaxOptimizationFlow(userId: string) {
  console.log('=== Starting Tax Optimization Flow Test ===\n');

  try {
    // Step 1: Update financial information
    console.log('Step 1: Updating financial information...');
    const testFinancialInfo: UserProfile['financialInfo'] = {
      annualSalary: 1200000,
      taxRegime: 'new',
      age: 30,
      employmentType: 'salaried',
      hasHomeLoan: true,
      hasEducationLoan: false,
      hasHealthInsurance: true,
      dependents: 2,
      pan: 'ABCDE1234F',
    };

    await updateFinancialInfo(userId, testFinancialInfo);
    console.log('✓ Financial information updated successfully\n');

    // Step 2: Retrieve user profile
    console.log('Step 2: Retrieving user profile...');
    const userProfile = await getUserProfile(userId);
    console.log('✓ User profile retrieved');
    console.log('Financial Info:', userProfile.financialInfo);
    console.log('');

    // Step 3: Verify data was saved
    if (!userProfile.financialInfo) {
      throw new Error('Financial info was not saved to Firestore!');
    }

    if (userProfile.financialInfo.annualSalary !== testFinancialInfo.annualSalary) {
      throw new Error(
        `Salary mismatch! Expected: ${testFinancialInfo.annualSalary}, Got: ${userProfile.financialInfo.annualSalary}`
      );
    }
    console.log('✓ Data verification successful\n');

    // Step 4: Generate tax report
    console.log('Step 3: Generating tax optimization report...');
    const taxReport = await generateTaxOptimizationReport(userId);
    console.log('✓ Tax report generated successfully');
    console.log('Current Tax:', taxReport.currentTax.totalTaxLiability);
    console.log('Optimized Tax:', taxReport.optimizedTax.totalTaxLiability);
    console.log('Total Savings:', taxReport.totalSavings);
    console.log('Number of Recommendations:', taxReport.recommendations.length);
    console.log('');

    console.log('=== ✓ All Tests Passed Successfully! ===');
    return {
      success: true,
      userProfile,
      taxReport,
    };
  } catch (error) {
    console.error('=== ✗ Test Failed ===');
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Test just the data retrieval
 */
export async function testDataRetrieval(userId: string) {
  console.log('=== Testing Data Retrieval ===\n');

  try {
    const userProfile = await getUserProfile(userId);
    console.log('User Profile:', JSON.stringify(userProfile, null, 2));
    
    if (userProfile.financialInfo) {
      console.log('\n✓ Financial info exists');
      console.log('Salary:', userProfile.financialInfo.annualSalary);
      console.log('Tax Regime:', userProfile.financialInfo.taxRegime);
    } else {
      console.log('\n✗ No financial info found');
    }

    return userProfile;
  } catch (error) {
    console.error('Error retrieving data:', error);
    throw error;
  }
}

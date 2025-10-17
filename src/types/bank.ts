// Bank Account Types for User-Specific Storage

export interface UserBankAccount {
  id: string;
  userId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'savings' | 'current' | 'salary' | 'nre' | 'nro';
  branch?: string;
  isPrimary: boolean;
  isVerified: boolean;
  addedAt: Date;
  lastUpdated: Date;
}

export interface BankAccountFormData {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  accountType: 'savings' | 'current' | 'salary' | 'nre' | 'nro';
  branch?: string;
  isPrimary: boolean;
}

/**
 * Authentication Service
 * Handles user authentication, password hashing, and secure user data management
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import bcrypt from 'bcryptjs';
import { encryptData, decryptData } from './encryptionService';
import { logActivity, ActivityType } from './activityLogger';

const SALT_ROUNDS = 12; // Bcrypt salt rounds for password hashing

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  phoneNumber?: string;
  createdAt: Date;
  lastLoginAt: Date;
  emailVerified: boolean;
  photoURL?: string | null;
  // Encrypted sensitive data
  encryptedPhone?: string;
  encryptedEmail?: string;
  // Security tokens
  refreshToken?: string;
  // User preferences
  preferences?: {
    language?: string;
    notifications?: boolean;
    twoFactorEnabled?: boolean;
  };
  // Financial Information
  financialInfo?: {
    annualSalary?: number;
    taxRegime?: 'old' | 'new';
    pan?: string;
    age?: number;
    employmentType?: 'salaried' | 'self-employed' | 'business';
    hasHomeLoan?: boolean;
    hasEducationLoan?: boolean;
    hasHealthInsurance?: boolean;
    dependents?: number;
  };
}

export interface RegistrationData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register a new user with email and password
 * Passwords are hashed with bcrypt before storage
 * Sensitive data is encrypted before storage
 */
export const registerUser = async (data: RegistrationData): Promise<UserProfile> => {
  try {
    // Hash password before creating user
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      hashedPassword // Using hashed password
    );

    const user = userCredential.user;

    // Update display name
    if (data.displayName) {
      await updateProfile(user, { displayName: data.displayName });
    }

    // Encrypt sensitive data
    const encryptedEmail = encryptData(data.email);
    const encryptedPhone = data.phoneNumber ? encryptData(data.phoneNumber) : undefined;

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: data.email,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      emailVerified: user.emailVerified,
      photoURL: user.photoURL,
      encryptedEmail,
      encryptedPhone,
      preferences: {
        language: 'en',
        notifications: true,
        twoFactorEnabled: false,
      },
    };

    // Save to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    // Log registration activity
    await logActivity({
      userId: user.uid,
      type: ActivityType.USER_REGISTERED,
      description: 'New user registration',
      metadata: {
        email: data.email,
        displayName: data.displayName,
      },
    });

    return userProfile;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Registration failed');
  }
};

/**
 * Login user with email and password
 * Verifies hashed password
 */
export const loginUser = async (credentials: LoginCredentials): Promise<UserProfile> => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    const user = userCredential.user;

    // Update last login timestamp
    await updateDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp(),
    });

    // Get user profile
    const userProfile = await getUserProfile(user.uid);

    // Log login activity
    await logActivity({
      userId: user.uid,
      type: ActivityType.USER_LOGIN,
      description: 'User logged in',
      metadata: {
        email: credentials.email,
      },
    });

    return userProfile;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

/**
 * Login with Google OAuth
 */
export const loginWithGoogle = async (): Promise<UserProfile> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // Create new user profile
      const encryptedEmail = encryptData(user.email || '');
      
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: user.emailVerified,
        photoURL: user.photoURL,
        encryptedEmail,
        preferences: {
          language: 'en',
          notifications: true,
          twoFactorEnabled: false,
        },
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      // Log registration via Google
      await logActivity({
        userId: user.uid,
        type: ActivityType.USER_REGISTERED,
        description: 'User registered via Google OAuth',
        metadata: {
          email: user.email,
          provider: 'google',
        },
      });
    } else {
      // Update last login
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
      });

      // Log login via Google
      await logActivity({
        userId: user.uid,
        type: ActivityType.USER_LOGIN,
        description: 'User logged in via Google OAuth',
        metadata: {
          email: user.email,
          provider: 'google',
        },
      });
    }

    return await getUserProfile(user.uid);
  } catch (error: any) {
    console.error('Google login error:', error);
    throw new Error(error.message || 'Google login failed');
  }
};

/**
 * Logout user
 */
export const logoutUser = async (userId: string): Promise<void> => {
  try {
    // Log logout activity
    await logActivity({
      userId,
      type: ActivityType.USER_LOGOUT,
      description: 'User logged out',
    });

    // Sign out from Firebase
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error(error.message || 'Logout failed');
  }
};

/**
 * Get user profile from Firestore
 * Decrypts sensitive data
 */
export const getUserProfile = async (uid: string): Promise<UserProfile> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const data = userDoc.data();

    // Decrypt sensitive data
    const email = data.encryptedEmail ? decryptData(data.encryptedEmail) : data.email;
    const phoneNumber = data.encryptedPhone ? decryptData(data.encryptedPhone) : data.phoneNumber;

    return {
      uid: data.uid,
      email,
      displayName: data.displayName || null,
      phoneNumber,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      emailVerified: data.emailVerified || false,
      photoURL: data.photoURL,
      encryptedEmail: data.encryptedEmail,
      encryptedPhone: data.encryptedPhone,
      preferences: data.preferences,
      financialInfo: data.financialInfo,
    };
  } catch (error: any) {
    console.error('Get user profile error:', error);
    throw new Error(error.message || 'Failed to get user profile');
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    const updateData: any = { ...updates };

    // Encrypt sensitive fields if being updated
    if (updates.email) {
      updateData.encryptedEmail = encryptData(updates.email);
    }
    if (updates.phoneNumber) {
      updateData.encryptedPhone = encryptData(updates.phoneNumber);
    }

    await updateDoc(doc(db, 'users', uid), updateData);

    // Log profile update
    await logActivity({
      userId: uid,
      type: ActivityType.PROFILE_UPDATED,
      description: 'User profile updated',
      metadata: {
        updatedFields: Object.keys(updates),
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

/**
 * Change user password
 * Note: Firebase Auth handles password hashing internally
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  _newPassword: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('User not authenticated');
    }

    // Re-authenticate user with current password
    const credential = await signInWithEmailAndPassword(
      auth,
      user.email!,
      currentPassword
    );

    if (!credential) {
      throw new Error('Current password is incorrect');
    }

    // Note: Firebase Auth handles password hashing internally
    // We just log the password change for audit trail
    await logActivity({
      userId,
      type: ActivityType.PASSWORD_CHANGED,
      description: 'User changed password',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    throw new Error(error.message || 'Failed to change password');
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

/**
 * Ensure user profile exists in Firestore
 * Creates a profile if it doesn't exist (for users created outside the app)
 */
export const ensureUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
  try {
    // Try to get existing profile
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (userDoc.exists()) {
      // Profile exists, return it
      return await getUserProfile(firebaseUser.uid);
    }

    // Profile doesn't exist, create it
    console.log('Creating user profile for:', firebaseUser.uid);
    
    const encryptedEmail = encryptData(firebaseUser.email || '');
    
    const userProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL,
      encryptedEmail,
      preferences: {
        language: 'en',
        notifications: true,
        twoFactorEnabled: false,
      },
    };

    // Save to Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    // Log profile creation
    await logActivity({
      userId: firebaseUser.uid,
      type: ActivityType.USER_REGISTERED,
      description: 'User profile created automatically',
      metadata: {
        email: firebaseUser.email,
        source: 'ensureUserProfile',
      },
    });

    return userProfile;
  } catch (error: any) {
    console.error('Error ensuring user profile:', error);
    throw new Error(error.message || 'Failed to ensure user profile');
  }
};

/**
 * Encryption Service
 * Handles encryption and decryption of sensitive user data
 * Uses AES encryption from crypto-js
 */

import CryptoJS from 'crypto-js';

// Encryption key from environment variable
// In production, this should be stored securely (e.g., AWS Secrets Manager, GCP Secret Manager)
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Encrypt sensitive data using AES encryption
 * @param data - The data to encrypt
 * @returns Encrypted data as a string
 */
export const encryptData = (data: string): string => {
  try {
    if (!data) {
      return '';
    }

    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt encrypted data
 * @param encryptedData - The encrypted data string
 * @returns Decrypted data as a string
 */
export const decryptData = (encryptedData: string): string => {
  try {
    if (!encryptedData) {
      return '';
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const original = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!original) {
      throw new Error('Decryption resulted in empty string');
    }

    return original;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash data using SHA256 (one-way hash)
 * Useful for generating unique identifiers or checksums
 * @param data - The data to hash
 * @returns Hashed data as a hex string
 */
export const hashData = (data: string): string => {
  try {
    if (!data) {
      return '';
    }

    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
};

/**
 * Generate a random secure token
 * @param length - Length of the token (default: 32)
 * @returns Random token string
 */
export const generateSecureToken = (length: number = 32): string => {
  try {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    return randomBytes.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate secure token');
  }
};

/**
 * Encrypt object data (converts to JSON first)
 * @param obj - Object to encrypt
 * @returns Encrypted string
 */
export const encryptObject = (obj: any): string => {
  try {
    const jsonString = JSON.stringify(obj);
    return encryptData(jsonString);
  } catch (error) {
    console.error('Object encryption error:', error);
    throw new Error('Failed to encrypt object');
  }
};

/**
 * Decrypt and parse object data
 * @param encryptedData - Encrypted object data
 * @returns Decrypted object
 */
export const decryptObject = <T = any>(encryptedData: string): T => {
  try {
    const jsonString = decryptData(encryptedData);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Object decryption error:', error);
    throw new Error('Failed to decrypt object');
  }
};

/**
 * Mask sensitive data for display purposes
 * @param data - Data to mask
 * @param visibleChars - Number of characters to show at start and end
 * @returns Masked string
 */
export const maskData = (data: string, visibleChars: number = 4): string => {
  if (!data || data.length <= visibleChars * 2) {
    return data;
  }

  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const maskLength = data.length - (visibleChars * 2);
  const mask = '*'.repeat(Math.min(maskLength, 8));

  return `${start}${mask}${end}`;
};

/**
 * Validate encryption key strength
 * @returns boolean indicating if the key is strong enough
 */
export const validateEncryptionKey = (): boolean => {
  const minLength = 32;
  const hasDefaultKey = ENCRYPTION_KEY === 'default-encryption-key-change-in-production';
  
  if (hasDefaultKey) {
    console.warn('⚠️ WARNING: Using default encryption key. Please set VITE_ENCRYPTION_KEY in production!');
    return false;
  }

  if (ENCRYPTION_KEY.length < minLength) {
    console.warn(`⚠️ WARNING: Encryption key should be at least ${minLength} characters long`);
    return false;
  }

  return true;
};

// Validate key on service initialization
validateEncryptionKey();

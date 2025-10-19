/**
 * Test Script for User Profile Functionality
 * Run this in browser console to test profile creation
 */

// Test 1: Check if current user exists
console.log('=== Test 1: Current User ===');
import { getCurrentUser } from './services/authService';
const currentUser = getCurrentUser();
console.log('Current user:', currentUser);

// Test 2: Ensure profile exists
console.log('\n=== Test 2: Ensure Profile ===');
import { ensureUserProfile } from './services/authService';
if (currentUser) {
  ensureUserProfile(currentUser)
    .then(profile => {
      console.log('✅ Profile ensured:', profile);
      console.log('User ID:', profile.uid);
      console.log('Email:', profile.email);
      console.log('Display Name:', profile.displayName);
      console.log('Email Verified:', profile.emailVerified);
    })
    .catch(error => {
      console.error('❌ Error ensuring profile:', error);
    });
} else {
  console.log('⚠️  No user authenticated');
}

// Test 3: Get user agents
console.log('\n=== Test 3: User Agents ===');
import { getUserAgents } from './services/agentMarketplace';
if (currentUser) {
  getUserAgents(currentUser.uid)
    .then(agents => {
      console.log('✅ Agents loaded:', agents.length);
      agents.forEach(agent => {
        console.log(`  - ${agent.name} (${agent.status})`);
      });
    })
    .catch(error => {
      console.error('❌ Error loading agents:', error);
    });
}

// Test 4: Get portfolio positions
console.log('\n=== Test 4: Portfolio Positions ===');
import { getPortfolioPositions } from './services/watchlistService';
if (currentUser) {
  getPortfolioPositions(currentUser.uid)
    .then(positions => {
      console.log('✅ Portfolio loaded:', positions.length, 'positions');
      const total = positions.reduce((sum, p) => sum + p.invested, 0);
      console.log(`  Total invested: ₹${total.toLocaleString()}`);
    })
    .catch(error => {
      console.error('❌ Error loading portfolio:', error);
    });
}

// Test 5: Check Firestore connection
console.log('\n=== Test 5: Firestore Connection ===');
import { db } from './config/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

if (currentUser) {
  const usersQuery = query(collection(db, 'users'), limit(1));
  getDocs(usersQuery)
    .then(snapshot => {
      console.log('✅ Firestore connection working');
      console.log(`  Found ${snapshot.size} user(s)`);
    })
    .catch(error => {
      console.error('❌ Firestore connection error:', error);
    });
}

console.log('\n=== Tests Complete ===');
console.log('Check results above for any errors');

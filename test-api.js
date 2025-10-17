#!/usr/bin/env node

/**
 * Gemini API Test Script
 * 
 * This script tests the PaLM 2 API endpoint to verify it's working correctly.
 * Run this before testing the full application.
 * 
 * Usage:
 *   node test-api.js
 * 
 * Or with npm:
 *   npm run test-api
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText';

console.log('\n🧪 Gemini API Test Script\n');
console.log('=' .repeat(60));

// Test 1: Check API Key
console.log('\n📋 Test 1: API Key Configuration');
console.log('-'.repeat(60));

if (!GEMINI_API_KEY) {
  console.error('❌ FAILED: VITE_GEMINI_API_KEY not found in .env file');
  console.log('\n💡 Fix: Add your API key to .env:');
  console.log('   VITE_GEMINI_API_KEY=your_api_key_here');
  console.log('\n📚 Get an API key: https://makersuite.google.com/app/apikey\n');
  process.exit(1);
}

if (GEMINI_API_KEY.includes('your_')) {
  console.warn('⚠️  WARNING: API key looks like a placeholder');
  console.log('   Current value: ' + GEMINI_API_KEY);
  console.log('\n💡 Replace with your actual API key from Google AI Studio\n');
  process.exit(1);
}

console.log('✅ PASSED: API key found');
console.log('   Key (first 10 chars): ' + GEMINI_API_KEY.substring(0, 10) + '...');

// Test 2: API Endpoint
console.log('\n📋 Test 2: API Endpoint');
console.log('-'.repeat(60));
console.log('   Endpoint: ' + GEMINI_API_URL);

// Test 3: Simple API Call
console.log('\n📋 Test 3: API Request');
console.log('-'.repeat(60));
console.log('   Sending test request...');

const testPrompt = 'Explain what a financial health score is in one sentence.';

try {
  const response = await axios.post(
    `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
    {
      prompt: {
        text: testPrompt
      },
      temperature: 0.7,
      maxOutputTokens: 100
    },
    {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );

  console.log('✅ PASSED: API request successful');
  console.log('   Status: ' + response.status);
  console.log('   Response time: ' + response.headers['x-response-time'] || 'N/A');

  // Test 4: Response Format
  console.log('\n📋 Test 4: Response Format');
  console.log('-'.repeat(60));

  const output = response.data.candidates?.[0]?.output || response.data.candidates?.[0]?.text;
  
  if (!output) {
    console.error('❌ FAILED: No output in response');
    console.log('   Response data:', JSON.stringify(response.data, null, 2));
    process.exit(1);
  }

  console.log('✅ PASSED: Response format is correct');
  console.log('   Output length: ' + output.length + ' characters');

  // Test 5: Response Quality
  console.log('\n📋 Test 5: Response Quality');
  console.log('-'.repeat(60));
  console.log('   Prompt: "' + testPrompt + '"');
  console.log('   Response: "' + output.trim().substring(0, 200) + (output.length > 200 ? '...' : '') + '"');

  if (output.length < 20) {
    console.warn('⚠️  WARNING: Response seems too short');
  } else {
    console.log('✅ PASSED: Response quality looks good');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL TESTS PASSED!\n');
  console.log('✅ Your Gemini API is configured correctly');
  console.log('✅ The PaLM 2 endpoint is working');
  console.log('✅ You can now test the full application\n');
  console.log('Next steps:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Open http://localhost:5173');
  console.log('3. Test the Financial Health Score feature');
  console.log('4. Try the AI chatbot\n');

  process.exit(0);

} catch (error) {
  console.error('❌ FAILED: API request error\n');
  
  if (error.response) {
    // API returned an error
    console.error('API Error Response:');
    console.error('  Status: ' + error.response.status);
    console.error('  Status Text: ' + error.response.statusText);
    console.error('  Data:', JSON.stringify(error.response.data, null, 2));

    if (error.response.status === 404) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - The endpoint might not be available in your region');
      console.log('   - Try upgrading to Gemini Pro API with billing enabled');
      console.log('   - The app will use fallback logic automatically\n');
    } else if (error.response.status === 403) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - Your API key might be invalid');
      console.log('   - Get a new key: https://makersuite.google.com/app/apikey');
      console.log('   - Make sure API restrictions allow this domain\n');
    } else if (error.response.status === 429) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - You\'ve exceeded the API quota');
      console.log('   - Wait a few minutes and try again');
      console.log('   - Check quota: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas\n');
    }
  } else if (error.request) {
    // Request was made but no response
    console.error('No response received:');
    console.error('  Message: ' + error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Check your internet connection');
    console.log('   - Verify the API endpoint URL');
    console.log('   - Check if firewall is blocking the request\n');
  } else {
    // Something else went wrong
    console.error('Error: ' + error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Check the error message above');
    console.log('   - Verify your .env file is properly formatted');
    console.log('   - Make sure axios is installed: npm install\n');
  }

  console.log('⚠️  Note: The application will still work using fallback logic');
  console.log('   AI features will use rule-based calculations instead\n');

  process.exit(1);
}

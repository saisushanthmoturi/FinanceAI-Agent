# Testing Guide - FinanceAI Pro

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Create `.env` file:
```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

**Note**: App works without API keys using fallback mechanisms!

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open Browser
Navigate to: `http://localhost:5173`

---

## Testing Checklist

### ✅ Authentication
- [ ] Login with email/password
- [ ] Google sign-in (if Firebase configured)
- [ ] Logout

### ✅ Dashboard
- [ ] View financial health score (works with/without API)
- [ ] Check spending overview chart
- [ ] Review quick actions
- [ ] View tax savings card
- [ ] Test chat button (bottom-right)

### ✅ Unified Data View
- [ ] View accounts summary
- [ ] Check recent transactions
- [ ] Add new bank account
- [ ] Validate account number (10-18 digits)
- [ ] Test IFSC code validation (11 chars)

### ✅ Tax Optimization
- [ ] View tax-saving recommendations
- [ ] Test chat/voice bot integration
- [ ] Check AI recommendations section
- [ ] Verify floating chat button

### ✅ Autonomous Agents
- [ ] View agent cards (Tax, Investment, Debt)
- [ ] Check agent status and actions
- [ ] Verify consent tracking

### ✅ Profile Page
- [ ] View user details
- [ ] View bank accounts (requires password)
- [ ] Test secure account viewing
- [ ] Verify masked account numbers

### ✅ Chat & Voice Bot

#### Without API Key (Fallback Mode)
Test these queries and verify fallback responses:

**English Queries**:
- "How do I budget my money?"
- "How can I save more?"
- "Where should I invest?"
- "How to save tax?"

**Hindi Queries**:
- "मुझे बजट कैसे बनाना चाहिए?"
- "मैं कैसे बचत कर सकता हूं?"
- "मुझे कहां निवेश करना चाहिए?"
- "टैक्स कैसे बचाएं?"

**Expected**: Rule-based responses in the same language

#### With API Key (AI Mode)
- [ ] Ask complex financial questions
- [ ] Test multi-turn conversations
- [ ] Verify context awareness
- [ ] Check response quality

---

## Feature Testing Matrix

### Financial Health Score

| Test Case | Without API | With API |
|-----------|-------------|----------|
| Calculate score | ✅ Local calc | ✅ AI-powered |
| View components | ✅ Basic | ✅ Detailed |
| Get recommendations | ✅ Generic | ✅ Personalized |

### Chat Bot

| Feature | Without API | With API |
|---------|-------------|----------|
| Budget questions | ✅ Rule-based | ✅ AI response |
| Savings advice | ✅ Rule-based | ✅ AI response |
| Investment tips | ✅ Rule-based | ✅ AI response |
| Tax optimization | ✅ Rule-based | ✅ AI response |
| Multi-language | ✅ Hindi/English | ✅ All languages |
| Context awareness | ❌ No | ✅ Yes |

### Tax Optimization

| Feature | Without API | With API |
|---------|-------------|----------|
| View recommendations | ✅ Templates | ✅ AI-powered |
| Chat integration | ✅ Rule-based | ✅ AI response |
| Deduction suggestions | ✅ Standard | ✅ Personalized |

---

## Browser Console Testing

### Check for Errors
Open Developer Tools (F12) and look for:

**✅ Expected Messages**:
```
Gemini API key not configured, using fallback calculation
Using fallback calculation method
Voice input processing not yet implemented
```

**❌ Unexpected Errors**:
```
Failed to fetch
CORS error
undefined is not a function
```

### Network Tab
- Check API calls to Gemini
- Verify timeout handling (should fallback after 10-15s)
- Check Firebase operations (if configured)

### Console Logs
Monitor for:
- API errors with status codes
- Fallback mechanism activation
- Response parsing issues

---

## Test Scenarios

### Scenario 1: Complete New User Flow
1. Sign up / Login
2. View Dashboard (empty state)
3. Add bank account in Unified Data View
4. Check financial health score
5. Chat with bot about budgeting
6. View tax recommendations
7. Check profile page

### Scenario 2: API Key Testing
1. Start without API key → Verify fallbacks work
2. Add valid API key → Restart server
3. Test same features → Verify AI responses
4. Compare quality of responses

### Scenario 3: Error Handling
1. Enter invalid bank account (short number)
2. Enter invalid IFSC code (wrong length)
3. Test chat with very long message
4. Test rapid successive messages
5. Verify graceful error messages

### Scenario 4: Multi-Language Support
1. Ask question in English → Get English response
2. Ask question in Hindi → Get Hindi response
3. Mix languages → Verify handling
4. Test voice input (browser dependent)

---

## Performance Testing

### Load Time
- [ ] Initial page load < 3s
- [ ] Dashboard load < 2s
- [ ] Chat response < 5s (with API)
- [ ] Chat response < 1s (fallback)

### Responsiveness
- [ ] Test on mobile viewport (375px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop (1920px)
- [ ] Verify all features accessible

### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

---

## Common Issues & Solutions

### Issue: "API key not valid"
**Solution**: 
1. Check `.env` file exists
2. Verify key starts with `AIza`
3. Restart dev server
4. Check for typos or extra spaces

### Issue: Chat returns same response
**Solution**: 
- This is expected in fallback mode
- Add Gemini API key for varied responses

### Issue: Bank account validation fails
**Solution**: 
- Account number: 10-18 digits
- IFSC code: exactly 11 characters
- No special characters allowed

### Issue: Voice bot not working
**Solution**: 
- Check browser supports Web Speech API
- Grant microphone permissions
- Use HTTPS (required for voice)

### Issue: Financial health score always same
**Solution**: 
- Fallback uses simple calculation
- Add API key for AI-powered scoring
- Vary income/expense inputs

---

## Automated Testing (Future)

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

---

## Demo Data

### Sample User Profile
- Email: demo@financeai.com
- Income: ₹100,000/month
- Expenses: ₹60,000/month
- Savings: ₹40,000/month

### Sample Bank Account
- Account Number: 1234567890123456
- IFSC Code: SBIN0001234
- Bank Name: State Bank of India
- Account Type: Savings

### Sample Chat Queries
1. "How can I save ₹10,000 per month?"
2. "What are the best tax-saving options under 80C?"
3. "Should I invest in mutual funds or fixed deposits?"
4. "How much emergency fund should I have?"
5. "मुझे रिटायरमेंट के लिए कितना बचाना चाहिए?"

---

## Reporting Issues

When reporting bugs, please include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser console errors**
5. **Screenshots** (if applicable)
6. **Environment**: API key configured (yes/no)

---

## Success Criteria

### ✅ MVP Complete When:
- [ ] All pages load without errors
- [ ] Chat works (with or without API)
- [ ] Bank accounts can be added/viewed
- [ ] Financial health score displays
- [ ] Tax recommendations show
- [ ] Profile page accessible
- [ ] Responsive on all devices
- [ ] No console errors (except API warnings)

### ✅ Production Ready When:
- [ ] All MVP criteria met
- [ ] Firebase fully configured
- [ ] Gemini API key set up
- [ ] Error tracking implemented
- [ ] Analytics configured
- [ ] Security audit passed
- [ ] Performance optimized
- [ ] Documentation complete

---

## Next Steps After Testing

1. **Configure Firebase**: Set up authentication and database
2. **Add Gemini API Key**: Enable full AI features
3. **Customize Branding**: Update colors, logo, text
4. **Add Real Data**: Connect to actual financial APIs
5. **Deploy**: Vercel, Netlify, or Firebase Hosting
6. **Monitor**: Set up error tracking and analytics

---

## Support

For questions or issues:
- Check `GEMINI_API_SETUP.md` for API configuration
- Review `BUG_FIXES.md` for known issues
- Check `IMPLEMENTATION_SUMMARY.md` for feature details

**Happy Testing! 🚀**

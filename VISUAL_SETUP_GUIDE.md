# 🎬 Visual Setup Guide - Follow These Exact Steps

## 🎯 Goal: Get your app running with real APIs in 10 minutes

---

## 🔥 Part 1: Firebase (5 minutes)

### Step 1: Create Project
**URL:** https://console.firebase.google.com

**You'll see:**
```
┌─────────────────────────────────────┐
│  Firebase Console                   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   + Add project               │ │ ← CLICK THIS
│  └───────────────────────────────┘ │
│                                     │
│  Your existing projects (if any)    │
└─────────────────────────────────────┘
```

**Actions:**
1. Click the big "**Add project**" button
2. Enter name: `financeai-vibeathon`
3. Click "**Continue**"
4. **Disable** Google Analytics (toggle off)
5. Click "**Create project**"
6. Wait ~30 seconds

---

### Step 2: Register Web App
**You'll see:**
```
┌─────────────────────────────────────┐
│  Get started by adding Firebase    │
│  to your app                        │
│                                     │
│   [iOS]  [Android]  [</>]  [Unity] │ ← CLICK </>
│                      ↑              │
│                   Click here        │
└─────────────────────────────────────┘
```

**Actions:**
1. Click the **Web icon** (`</>`)
2. App nickname: `FinanceAI`
3. **DON'T** check "Firebase Hosting"
4. Click "**Register app**"

---

### Step 3: Copy Your Config (MOST IMPORTANT!)
**You'll see a code snippet:**
```javascript
// Add Firebase SDK
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "financeai-vibeathon.firebaseapp.com",
  projectId: "financeai-vibeathon",
  storageBucket: "financeai-vibeathon.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
```

**🎯 Copy these 6 values RIGHT NOW:**
```
apiKey          → AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxx
authDomain      → financeai-vibeathon.firebaseapp.com
projectId       → financeai-vibeathon
storageBucket   → financeai-vibeathon.appspot.com
messagingSenderId → 123456789012
appId           → 1:123456789012:web:abc123def456
```

**Save to a text file temporarily!**

---

### Step 4: Enable Authentication
**Left sidebar:**
```
┌─────────────────────┐
│  Build              │
│  ├─ Authentication  │ ← CLICK THIS
│  ├─ Firestore       │
│  ├─ Storage         │
└─────────────────────┘
```

**You'll see:**
```
┌─────────────────────────────────────┐
│  Authentication                     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Get started                 │ │ ← CLICK THIS
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Then:**
```
┌─────────────────────────────────────┐
│  Sign-in method                     │
│                                     │
│  Native providers                   │
│  ┌─────────────────────────────┐   │
│  │ Email/Password       Disabled│   │ ← CLICK THIS ROW
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Actions:**
1. Click "**Get started**"
2. Click on "**Email/Password**" row
3. Toggle **Enable** (first toggle only)
4. Click "**Save**"

---

### Step 5: Create Firestore Database
**Left sidebar:**
```
┌─────────────────────┐
│  Build              │
│  ├─ Authentication  │
│  ├─ Firestore       │ ← CLICK THIS
│  ├─ Storage         │
└─────────────────────┘
```

**You'll see:**
```
┌─────────────────────────────────────┐
│  Cloud Firestore                    │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Create database             │ │ ← CLICK THIS
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Modal appears:**
```
┌─────────────────────────────────────┐
│  Create database                    │
│                                     │
│  Choose starting mode:              │
│                                     │
│  ○ Production mode                  │
│  ● Test mode                        │ ← SELECT THIS
│                                     │
│  [Cancel]  [Next]                   │
└─────────────────────────────────────┘
```

**Actions:**
1. Click "**Create database**"
2. Select "**Test mode**" (radio button)
3. Click "**Next**"
4. Choose location: "**asia-south1 (Mumbai)**" (or closest to you)
5. Click "**Enable**"

✅ **Firebase Setup Complete!**

---

## 🤖 Part 2: Google Gemini API (2 minutes)

### Step 1: Go to AI Studio
**URL:** https://aistudio.google.com/app/apikey

**You'll see:**
```
┌─────────────────────────────────────┐
│  Google AI Studio                   │
│                                     │
│  Get an API key                     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Create API key              │ │ ← CLICK THIS
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Actions:**
1. Sign in with your Google account
2. Click "**Create API key**"

---

### Step 2: Select Project
**Dropdown appears:**
```
┌─────────────────────────────────────┐
│  Create API key                     │
│                                     │
│  Select a Google Cloud project:    │
│                                     │
│  ▼ financeai-vibeathon             │ ← SELECT YOUR FIREBASE PROJECT
│    [Other projects...]              │
│                                     │
│  Or                                 │
│  ○ Create new project               │
│                                     │
│  [Cancel]  [Create API key]         │
└─────────────────────────────────────┘
```

**Actions:**
1. Select your Firebase project: `financeai-vibeathon`
2. Click "**Create API key in existing project**"

---

### Step 3: Copy API Key
**Success screen:**
```
┌─────────────────────────────────────┐
│  API key created                    │
│                                     │
│  Your API key:                      │
│                                     │
│  AIzaSyA-xxxxxxxxxxxxxxxxxxxxxxx    │ ← COPY THIS!
│                                     │
│  ⚠️ Keep your API key secure        │
│                                     │
│  [Copy]  [Close]                    │
└─────────────────────────────────────┘
```

**🎯 COPY THIS KEY IMMEDIATELY!**
You can only see it once!

✅ **Gemini API Setup Complete!**

---

## 📝 Part 3: Configure Your App (1 minute)

### Step 1: Open Terminal
```bash
cd /Users/moturisaisushanth/Downloads/vibeathonx
```

### Step 2: Create .env File
```bash
cp .env.example .env
```

### Step 3: Edit .env File
Open `.env` in your code editor and paste your values:

```bash
# ============================================
# FIREBASE CONFIG (from Part 1, Step 3)
# ============================================
VITE_FIREBASE_API_KEY=AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=financeai-vibeathon.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=financeai-vibeathon
VITE_FIREBASE_STORAGE_BUCKET=financeai-vibeathon.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456

# ============================================
# GEMINI API (from Part 2, Step 3)
# ============================================
VITE_GEMINI_API_KEY=AIzaSyA-xxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# OPTIONAL - Account Aggregator (for production)
# ============================================
VITE_AA_CLIENT_ID=your-aa-client-id
VITE_AA_CLIENT_SECRET=your-aa-secret
VITE_AA_API_URL=https://api.accountaggregator.example.com
```

**⚠️ Important:**
- Remove any quotes around values
- No spaces before or after `=`
- Save the file

---

## 🚀 Part 4: Launch! (30 seconds)

### Install Dependencies
```bash
npm install
```

### Start Dev Server
```bash
npm run dev
```

**You'll see:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Open Browser
**URL:** http://localhost:5173

---

## ✅ Verify Everything Works

### Dashboard Checklist
- [ ] Financial Health Score shows (0-100)
- [ ] Total Balance displayed
- [ ] Monthly Income/Expenses shown
- [ ] Accounts list appears
- [ ] Recent transactions visible
- [ ] Charts render correctly

### AI Features Checklist
- [ ] Chat icon opens chatbot
- [ ] Can send messages
- [ ] AI responds
- [ ] Scenario simulation works
- [ ] Behavioral insights display

### No Errors Checklist
- [ ] No console errors (Press F12)
- [ ] No red text in terminal
- [ ] All components load

---

## 🎉 SUCCESS!

You now have a fully functional AI-powered financial platform!

### What to do next:
1. ✅ Test all features
2. ✅ Review `DEMO_SCRIPT.md` for presentation
3. ✅ Customize the UI/branding
4. ✅ Practice your demo

---

## 🆘 Troubleshooting

### Problem: "Firebase: Error (auth/invalid-api-key)"
**Solution:**
```bash
# Verify API key in .env
cat .env | grep FIREBASE_API_KEY

# Should NOT have quotes or spaces
# ✅ VITE_FIREBASE_API_KEY=AIzaSy...
# ❌ VITE_FIREBASE_API_KEY="AIzaSy..."
# ❌ VITE_FIREBASE_API_KEY = AIzaSy...
```

### Problem: "Gemini API quota exceeded"
**Solution:**
- Free tier: 15 requests/minute
- Wait 60 seconds or upgrade
- Check usage: https://aistudio.google.com/app/apikey

### Problem: Port 5173 already in use
**Solution:**
```bash
# Find and kill process
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 5174
```

### Problem: Module not found errors
**Solution:**
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

### Problem: Cannot find Firebase project in AI Studio
**Solution:**
1. Wait 5 minutes (project needs to sync)
2. Or: Select "Create new project"
3. Link it later in Google Cloud Console

---

## 📞 Quick Reference

### Firebase Console
https://console.firebase.google.com

### Google AI Studio  
https://aistudio.google.com/app/apikey

### Your App (after setup)
http://localhost:5173

### Documentation
- `README.md` - Project overview
- `SETUP.md` - Detailed setup
- `API_KEYS_GUIDE.md` - Complete API guide
- `DEMO_SCRIPT.md` - Presentation script
- `ARCHITECTURE.md` - System architecture

---

## 🎯 Time Breakdown

| Step | Time | Status |
|------|------|--------|
| Firebase project creation | 2 min | □ |
| Firebase configuration | 2 min | □ |
| Gemini API setup | 2 min | □ |
| Configure .env | 1 min | □ |
| npm install & start | 3 min | □ |
| **Total** | **10 min** | □ |

---

## 🌟 Pro Tips

1. **Keep API keys safe** - Never commit to GitHub
2. **Use test mode** - Perfect for hackathons
3. **Check console** - F12 for debugging
4. **Cache responses** - Reduce API calls
5. **Demo data works** - No APIs needed for basic demo

---

**Happy Hacking! 🚀**

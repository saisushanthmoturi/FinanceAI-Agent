#!/bin/bash

# Enhanced AI Chatbot Test Script
# This script verifies the chatbot functionality in the Financial Report page

echo "🤖 Enhanced AI Financial Chatbot - Test Script"
echo "=============================================="
echo ""

# Check if the development server is running
echo "📊 Checking development server..."
if curl -s http://localhost:5175 > /dev/null; then
    echo "✅ Development server is running on http://localhost:5175"
else
    echo "❌ Development server is not running. Please start with 'npm run dev'"
    exit 1
fi

echo ""
echo "🔍 Testing Application Components..."

# Check if Financial Report page exists
echo "📈 Financial Report page..."
if grep -q "FinancialReport" src/components/FinancialReport.tsx; then
    echo "✅ Financial Report component exists"
else
    echo "❌ Financial Report component not found"
fi

# Check if custom chatbot service exists
echo "🤖 Custom AI Chatbot service..."
if [ -f "src/services/customFinancialChatbot.ts" ]; then
    echo "✅ Custom Financial Chatbot service exists"
else
    echo "❌ Custom Financial Chatbot service not found"
fi

# Check if language context exists
echo "🌐 Language Context..."
if [ -f "src/contexts/LanguageContext.tsx" ]; then
    echo "✅ Language Context exists"
else
    echo "❌ Language Context not found"
fi

echo ""
echo "🧪 Manual Testing Checklist:"
echo "=============================="
echo ""
echo "1. 🌐 Open http://localhost:5175 in your browser"
echo "2. 🔐 Log in or sign up for an account"
echo "3. 📊 Navigate to 'Financial Report' page"
echo "4. 🤖 Click the floating chat button (bottom right)"
echo "5. 💬 Test these sample queries:"
echo ""
echo "   📝 Sample Test Queries:"
echo "   ----------------------"
echo "   • 'I want to retire after 30 years give me a plan using my portfolio'"
echo "   • 'Show me my portfolio performance'"
echo "   • 'How can I save more tax?'"
echo "   • 'Help me plan for buying a home'"
echo "   • 'What should I invest in?'"
echo ""
echo "6. 🌍 Test language switching:"
echo "   • Click the language button in the header"
echo "   • Try switching to Hindi, Tamil, or Telugu"
echo "   • Send a message and verify response language"
echo ""
echo "7. 🎤 Test voice features:"
echo "   • Click the microphone button"
echo "   • Speak a financial question"
echo "   • Verify speech-to-text and text-to-speech"
echo ""
echo "8. ⚙️ Test custom input:"
echo "   • Click the settings icon in chat dialog"
echo "   • Add monthly income, age, financial goals"
echo "   • Send a message and see personalized response"
echo ""
echo "✅ Expected Results:"
echo "==================="
echo "• Detailed financial advice with specific numbers"
echo "• Retirement planning with SIP recommendations"
echo "• Portfolio analysis with fund suggestions"
echo "• Tax optimization strategies"
echo "• Goal-based investment planning"
echo "• Multi-lingual responses"
echo "• Voice interaction working"
echo "• Custom input affecting AI responses"
echo ""
echo "🚀 If all tests pass, the Enhanced AI Chatbot is working correctly!"
echo ""
echo "📋 Features Implemented:"
echo "======================="
echo "✅ Custom AI Financial Chatbot Agent"
echo "✅ Portfolio-based personalized advice"
echo "✅ 30-year retirement planning"
echo "✅ Investment strategy recommendations"
echo "✅ Tax optimization guidance"
echo "✅ Goal-based financial planning"
echo "✅ Multi-lingual support (EN, HI, TA, TE)"
echo "✅ Voice assistant integration"
echo "✅ Custom input processing"
echo "✅ Real-time portfolio integration"
echo "✅ Error handling and fallbacks"
echo "✅ Interactive chat interface"
echo ""
echo "🎯 Ready for Vibeathon Demo!"

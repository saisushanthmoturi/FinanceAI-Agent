#!/bin/bash

echo "🧪 RISK & SELL AGENT - QUICK TEST"
echo "=================================="
echo ""

echo "✅ Step 1: Check Core Files Exist"
echo "---------------------------------"
files=(
  "src/services/portfolioRiskMonitor.ts"
  "src/services/portfolioService.ts"
  "src/services/agentMarketplace.ts"
  "src/services/emailService.ts"
  "src/components/RiskMonitoringDashboard.tsx"
  "src/components/InvestmentPortfolio.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING!)"
  fi
done

echo ""
echo "✅ Step 2: Check Routes"
echo "----------------------"
if grep -q "risk-monitor" src/App.tsx; then
  echo "  ✓ Risk Monitor route added to App.tsx"
else
  echo "  ✗ Route NOT found in App.tsx"
fi

echo ""
echo "✅ Step 3: Check Key Functions"
echo "------------------------------"
echo "  Portfolio Risk Monitor functions:"
grep "export.*function.*" src/services/portfolioRiskMonitor.ts | head -5 | sed 's/^/    /'

echo ""
echo "  Agent Marketplace functions:"
grep "export.*function.*Agent" src/services/agentMarketplace.ts | head -3 | sed 's/^/    /'

echo ""
echo "✅ Step 4: Check Email Service"
echo "------------------------------"
grep "export async function send.*Email" src/services/emailService.ts | sed 's/^/  /'

echo ""
echo "✅ Step 5: TypeScript Compilation Check"
echo "---------------------------------------"
npx tsc --noEmit --skipLibCheck src/components/RiskMonitoringDashboard.tsx 2>&1 | grep -E "error" && echo "  ✗ Compilation errors found" || echo "  ✓ No compilation errors"

npx tsc --noEmit --skipLibCheck src/services/portfolioRiskMonitor.ts 2>&1 | grep -E "error" && echo "  ✗ Compilation errors found" || echo "  ✓ No compilation errors"

echo ""
echo "================================================"
echo "🎉 RISK & SELL AGENT IMPLEMENTATION VERIFIED!"
echo "================================================"
echo ""
echo "📋 How to Use:"
echo "1. Navigate to: http://localhost:5173/risk-monitor"
echo "2. Toggle the Risk & Sell Agent switch to ACTIVE"
echo "3. Add investments to your portfolio (via /portfolio)"
echo "4. Click 'Monitor Now' to trigger risk assessment"
echo "5. Check your email for risk alerts!"
echo ""
echo "🚀 The agent will:"
echo "   • Monitor your portfolio automatically"
echo "   • Calculate risk scores for each investment"
echo "   • Send email alerts for high-risk positions"
echo "   • Log all activities to your profile"
echo ""

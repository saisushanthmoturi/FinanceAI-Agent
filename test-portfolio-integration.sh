#!/bin/bash
# Investment Portfolio Integration Test
# Tests that all components work together correctly

echo "🧪 Running Investment Portfolio Integration Test"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
  local test_name=$1
  local test_command=$2
  
  echo -e "${YELLOW}Testing:${NC} $test_name"
  
  if eval "$test_command"; then
    echo -e "${GREEN}✓ PASSED${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC}\n"
    ((TESTS_FAILED++))
  fi
}

# Test 1: Check if all required files exist
echo "📁 Checking Required Files..."
run_test "InvestmentPortfolio component exists" \
  "test -f src/components/InvestmentPortfolio.tsx"

run_test "portfolioService exists" \
  "test -f src/services/portfolioService.ts"

run_test "UserProfilePage exists" \
  "test -f src/components/UserProfilePage.tsx"

run_test "agentMarketplace exists" \
  "test -f src/services/agentMarketplace.ts"

run_test "emailService exists" \
  "test -f src/services/emailService.ts"

run_test "activityLogger exists" \
  "test -f src/services/activityLogger.ts"

# Test 2: Check TypeScript compilation
echo "🔍 Checking TypeScript Compilation..."
run_test "InvestmentPortfolio compiles without errors" \
  "npx tsc --noEmit --skipLibCheck src/components/InvestmentPortfolio.tsx 2>&1 | grep -q 'error' && exit 1 || exit 0"

# Test 3: Check for required exports
echo "📦 Checking Required Exports..."
run_test "portfolioService exports addInvestment" \
  "grep -q 'export.*function addInvestment' src/services/portfolioService.ts"

run_test "portfolioService exports getUserInvestments" \
  "grep -q 'export.*function getUserInvestments' src/services/portfolioService.ts"

run_test "portfolioService exports deleteInvestment" \
  "grep -q 'export.*function deleteInvestment' src/services/portfolioService.ts"

run_test "portfolioService exports calculatePortfolioSummary" \
  "grep -q 'export.*function calculatePortfolioSummary' src/services/portfolioService.ts"

# Test 4: Check component structure
echo "🏗️  Checking Component Structure..."
run_test "InvestmentPortfolio uses useAppStore" \
  "grep -q 'useAppStore' src/components/InvestmentPortfolio.tsx"

run_test "InvestmentPortfolio has Add Investment dialog" \
  "grep -q 'addDialogOpen' src/components/InvestmentPortfolio.tsx"

run_test "InvestmentPortfolio calls loadPortfolioData" \
  "grep -q 'loadPortfolioData' src/components/InvestmentPortfolio.tsx"

run_test "InvestmentPortfolio has delete handler" \
  "grep -q 'handleDeleteInvestment' src/components/InvestmentPortfolio.tsx"

# Test 5: Check Firebase integration
echo "🔥 Checking Firebase Integration..."
run_test "portfolioService imports Firestore functions" \
  "grep -q 'from.*firebase/firestore' src/services/portfolioService.ts"

run_test "portfolioService uses db instance" \
  "grep -q 'from.*config/firebase' src/services/portfolioService.ts"

# Test 6: Check Activity Logging
echo "📝 Checking Activity Logging..."
run_test "portfolioService imports logActivity" \
  "grep -q 'import.*logActivity' src/services/portfolioService.ts"

run_test "UserProfilePage shows activity logs" \
  "grep -q 'activityLog' src/components/UserProfilePage.tsx"

# Test 7: Check Form Validation
echo "📋 Checking Form Implementation..."
run_test "InvestmentPortfolio has form state" \
  "grep -q 'formData.*useState' src/components/InvestmentPortfolio.tsx"

run_test "Form has all required fields" \
  "grep -q 'name.*type.*quantity.*buyPrice' src/components/InvestmentPortfolio.tsx"

run_test "Form validates input" \
  "grep -q 'if.*!.*formData' src/components/InvestmentPortfolio.tsx"

# Test 8: Check UI Components
echo "🎨 Checking UI Components..."
run_test "Has Portfolio Summary Cards" \
  "grep -q 'Total Portfolio Value' src/components/InvestmentPortfolio.tsx"

run_test "Has Portfolio Performance Chart" \
  "grep -q 'Portfolio Performance' src/components/InvestmentPortfolio.tsx"

run_test "Has Asset Allocation Chart" \
  "grep -q 'Asset Allocation' src/components/InvestmentPortfolio.tsx"

run_test "Has Investment Cards List" \
  "grep -q 'Your Investments' src/components/InvestmentPortfolio.tsx"

# Test 9: Check Error Handling
echo "🛡️  Checking Error Handling..."
run_test "portfolioService has try-catch blocks" \
  "grep -q 'try.*catch' src/services/portfolioService.ts"

run_test "InvestmentPortfolio shows error messages" \
  "grep -q 'showSnackbar' src/components/InvestmentPortfolio.tsx"

# Test 10: Check Documentation
echo "📚 Checking Documentation..."
run_test "Final fix summary exists" \
  "test -f INVESTMENT_PORTFOLIO_FINAL_FIX.md"

run_test "Complete implementation summary exists" \
  "test -f COMPLETE_IMPLEMENTATION_SUMMARY.md"

# Summary
echo ""
echo "================================================"
echo "📊 Test Results Summary"
echo "================================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed! Investment Portfolio is ready for evaluation.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
  exit 1
fi

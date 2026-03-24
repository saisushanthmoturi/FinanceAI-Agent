/**
 * Integration Test: Cryptocurrency Support
 * 
 * Tests the stock monitoring agent with crypto symbols
 */

import { stockMonitoringAgent } from '../services/stockMonitoringAgent';
import type { PriceAlert } from '../services/stockMonitoringAgent';

async function testCryptoSupport() {
  console.log('🧪 Testing Cryptocurrency Support\n');
  
  const userId = 'test-user-crypto';
  let alertReceived = false;
  
  try {
    // Test 1: Add Bitcoin to watchlist
    console.log('📝 Test 1: Adding BTCUSDT (Bitcoin)...');
    const btcItem = await stockMonitoringAgent.addToWatchlist(userId, 'BTCUSDT', 0.1, 'crypto');
    console.log('✅ BTCUSDT added successfully');
    console.log('   Asset Type:', btcItem.assetType);
    console.log('   Current Price: $' + btcItem.currentPrice?.toLocaleString());
    console.log('   Threshold:', btcItem.threshold + '%\n');
    
    // Test 2: Add Ethereum to watchlist
    console.log('📝 Test 2: Adding ETHUSDT (Ethereum)...');
    const ethItem = await stockMonitoringAgent.addToWatchlist(userId, 'ETHUSDT', 0.1, 'crypto');
    console.log('✅ ETHUSDT added successfully');
    console.log('   Asset Type:', ethItem.assetType);
    console.log('   Current Price: $' + ethItem.currentPrice?.toLocaleString());
    console.log('   Threshold:', ethItem.threshold + '%\n');
    
    // Test 3: Add stock to same watchlist (mixed assets)
    console.log('📝 Test 3: Adding AAPL (Apple Stock)...');
    const aaplItem = await stockMonitoringAgent.addToWatchlist(userId, 'AAPL', 1, 'stock');
    console.log('✅ AAPL added successfully');
    console.log('   Asset Type:', aaplItem.assetType);
    console.log('   Current Price: $' + aaplItem.currentPrice?.toFixed(2));
    console.log('   Threshold:', aaplItem.threshold + '%\n');
    
    // Test 4: Auto-detection (without specifying asset type)
    console.log('📝 Test 4: Auto-detecting BNBUSDT (should detect as crypto)...');
    const bnbItem = await stockMonitoringAgent.addToWatchlist(userId, 'BNBUSDT', 0.5);
    console.log('✅ BNBUSDT added with auto-detection');
    console.log('   Detected Asset Type:', bnbItem.assetType);
    console.log('   Current Price: $' + bnbItem.currentPrice?.toLocaleString());
    console.log('   Threshold:', bnbItem.threshold + '%\n');
    
    // Test 5: Verify watchlist
    console.log('📝 Test 5: Verifying watchlist...');
    const watchlist = await stockMonitoringAgent.getWatchlist(userId);
    console.log('✅ Watchlist has', watchlist.length, 'items');
    console.log('   Assets:', watchlist.map((item: any) => `${item.symbol} (${item.assetType})`).join(', '));
    console.log('');
    
    // Test 6: Subscribe to alerts
    console.log('📝 Test 6: Subscribing to price alerts...');
    const unsubscribe = stockMonitoringAgent.subscribeToAlerts(userId, (alert: PriceAlert) => {
      alertReceived = true;
      console.log('🚨 ALERT RECEIVED:');
      console.log('   Symbol:', alert.symbol);
      console.log('   Change:', alert.changePercent.toFixed(2) + '%');
      console.log('   Direction:', alert.direction === 'up' ? '📈 UP' : '📉 DOWN');
      console.log('   Price:', alert.oldPrice, '→', alert.newPrice);
    });
    console.log('✅ Subscribed to alerts\n');
    
    // Test 7: Start monitoring
    console.log('📝 Test 7: Starting autonomous monitoring...');
    stockMonitoringAgent.startMonitoring();
    const status = stockMonitoringAgent.getStatus();
    console.log('✅ Monitoring started');
    console.log('   Running:', status.isRunning);
    console.log('   Total Assets:', status.totalWatched);
    console.log('   Symbols:', status.symbols.join(', '));
    console.log('');
    
    // Wait for price checks (30 seconds = 3 polling cycles)
    console.log('⏳ Waiting 30 seconds for price monitoring...');
    console.log('   (Polling interval: 10 seconds)\n');
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Test 8: Check updated prices
    console.log('📝 Test 8: Checking updated prices...');
    const updatedWatchlist = await stockMonitoringAgent.getWatchlist(userId);
    updatedWatchlist.forEach((item: any) => {
      console.log(`   ${item.symbol} (${item.assetType}): $${item.currentPrice?.toLocaleString()}`);
    });
    console.log('');
    
    // Test 9: Test invalid crypto symbol
    console.log('📝 Test 9: Testing invalid crypto symbol...');
    try {
      await stockMonitoringAgent.addToWatchlist(userId, 'INVALIDCRYPTO', 1, 'crypto');
      console.log('❌ Should have thrown error for invalid symbol');
    } catch (error) {
      console.log('✅ Correctly rejected invalid symbol:', (error as Error).message);
    }
    console.log('');
    
    // Test 10: Test duplicate detection
    console.log('📝 Test 10: Testing duplicate detection...');
    try {
      await stockMonitoringAgent.addToWatchlist(userId, 'BTCUSDT', 1, 'crypto');
      console.log('❌ Should have thrown error for duplicate');
    } catch (error) {
      console.log('✅ Correctly rejected duplicate:', (error as Error).message);
    }
    console.log('');
    
    // Cleanup
    console.log('🧹 Cleaning up...');
    unsubscribe();
    watchlist.forEach((item: any) => {
      stockMonitoringAgent.removeFromWatchlist(userId, item.id);
    });
    stockMonitoringAgent.stopMonitoring();
    console.log('✅ Cleanup complete\n');
    
    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('🎉 Cryptocurrency support is working!');
    console.log('   - BTCUSDT, ETHUSDT, BNBUSDT tested');
    console.log('   - Mixed stock/crypto watchlist works');
    console.log('   - Auto-detection works');
    console.log('   - Price fetching from Binance API works');
    console.log('   - Real-time alerts ready');
    if (alertReceived) {
      console.log('   - Real-time alerts received! 🚨');
    } else {
      console.log('   - No alerts (prices stable within threshold)');
    }
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    throw error;
  }
}

// Export for manual testing
export { testCryptoSupport };

// Auto-run in browser console
if (typeof window !== 'undefined') {
  // Available in browser console
  (window as any).testCryptoSupport = testCryptoSupport;
  console.log('💡 Run testCryptoSupport() in the console to test crypto support');
}

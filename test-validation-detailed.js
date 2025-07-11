const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestModule = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = requestModule.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testValidationDetailed() {
  console.log('🧪 Testing Detailed Trick Validation Behavior...\n');
  
  try {
    // Step 1: Create auto-mode game
    console.log('1. Creating auto-mode game...');
    const createResponse = await makeRequest('http://localhost:3001/api/create', {
      method: 'POST',
      body: JSON.stringify({ hostName: 'auto' })
    });
    
    const createData = createResponse.data;
    console.log(`✅ Auto game created: ${createData.gameId}`);
    console.log(`   Status: ${createData.game.status}`);
    
    // Step 2: Submit human bid to trigger AI bidding
    console.log('\n2. Submitting human bid...');
    const bidResponse = await makeRequest('http://localhost:3001/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: createData.gameId,
        playerId: createData.playerId,
        action: 'submitBid',
        data: { bid: 3 }
      })
    });
    
    console.log('✅ Human bid submitted');
    
    // Step 3: Check immediate state after bidding
    console.log('\n3. Checking state after bidding...');
    const postBidResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
    const postBidGame = postBidResponse.data.game;
    const round = postBidGame.rounds[0];
    
    console.log(`   Status: ${postBidGame.status}`);
    console.log(`   Bids: ${JSON.stringify(round.bids)}`);
    console.log(`   Tricks: ${JSON.stringify(round.tricks)}`);
    console.log(`   Total bids: ${Object.keys(round.bids).length}`);
    console.log(`   Total tricks submitted: ${Object.keys(round.tricks || {}).length}`);
    
    if (round.tricks && Object.keys(round.tricks).length > 0) {
      const totalTricks = Object.values(round.tricks).reduce((sum, t) => sum + t, 0);
      console.log(`   Total tricks claimed: ${totalTricks}/13`);
      
      if (totalTricks === 13) {
        console.log('   ✅ AI players filled all 13 tricks correctly!');
        console.log('   ✅ Validation system working - AI respects 13-trick limit');
        
        // Test: Try to submit more tricks (should fail)
        console.log('\n4. Testing validation - trying to submit additional tricks...');
        const extraTricksResponse = await makeRequest('http://localhost:3001/api/action', {
          method: 'POST',
          body: JSON.stringify({
            gameId: createData.gameId,
            playerId: createData.playerId,
            action: 'submitTricks',
            data: { tricks: 2 }
          })
        });
        
        if (!extraTricksResponse.ok) {
          console.log('   ✅ Correctly rejected additional tricks');
          console.log(`      Error: ${extraTricksResponse.data.error}`);
          console.log(`      Validation: ${extraTricksResponse.data.validation || 'none'}`);
        } else {
          console.log('   ❌ Should have rejected additional tricks');
        }
        
      } else if (totalTricks < 13) {
        console.log(`   ⚠️  Only ${totalTricks} tricks claimed, ${13 - totalTricks} remaining`);
        
        // Test: Try to submit more than remaining
        const remaining = 13 - totalTricks;
        console.log(`\n4. Testing validation - trying to submit ${remaining + 2} tricks (should fail)...`);
        const excessResponse = await makeRequest('http://localhost:3001/api/action', {
          method: 'POST',
          body: JSON.stringify({
            gameId: createData.gameId,
            playerId: createData.playerId,
            action: 'submitTricks',
            data: { tricks: remaining + 2 }
          })
        });
        
        if (!excessResponse.ok) {
          console.log('   ✅ Correctly rejected excess tricks');
          console.log(`      Error: ${excessResponse.data.error}`);
          console.log(`      Validation: ${excessResponse.data.validation}`);
          console.log(`      Available: ${excessResponse.data.available}`);
        } else {
          console.log('   ❌ Should have rejected excess tricks');
        }
        
        // Test: Submit exactly the remaining amount
        console.log(`\n   Testing exact remaining amount (${remaining})...`);
        const exactResponse = await makeRequest('http://localhost:3001/api/action', {
          method: 'POST',
          body: JSON.stringify({
            gameId: createData.gameId,
            playerId: createData.playerId,
            action: 'submitTricks',
            data: { tricks: remaining }
          })
        });
        
        if (exactResponse.ok) {
          console.log('   ✅ Accepted exact remaining tricks');
          
          // Check final state
          const finalResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
          const finalGame = finalResponse.data.game;
          const finalRound = finalGame.rounds[0];
          const finalTotal = Object.values(finalRound.tricks).reduce((sum, t) => sum + t, 0);
          
          console.log(`   Final total tricks: ${finalTotal}`);
          if (finalTotal === 13) {
            console.log('   ✅ Perfect! Final total is exactly 13');
          } else {
            console.log(`   ❌ Final total ${finalTotal} != 13`);
          }
        } else {
          console.log('   ❌ Failed to submit exact remaining:', exactResponse.data.error);
        }
      }
    } else {
      console.log('   ⚠️  No tricks submitted yet - AI might not have processed');
      
      // Wait and check again
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('\n   Rechecking after delay...');
      const delayedResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
      const delayedGame = delayedResponse.data.game;
      const delayedRound = delayedGame.rounds[0];
      
      console.log(`   Status: ${delayedGame.status}`);
      console.log(`   Tricks: ${JSON.stringify(delayedRound.tricks || {})}`);
    }
    
    console.log('\n🎉 Detailed validation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testValidationDetailed(); 
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

async function testHumanFirst() {
  console.log('🧪 Testing Human-First Trick Submission in Auto-Mode...\n');
  
  try {
    // Step 1: Create auto-mode game
    console.log('1. Creating auto-mode game...');
    const createResponse = await makeRequest('http://localhost:3001/api/create', {
      method: 'POST',
      body: JSON.stringify({ hostName: 'auto' })
    });
    
    const createData = createResponse.data;
    console.log(`✅ Auto game created: ${createData.gameId}`);
    
    // Step 2: Submit human bid to trigger AI bidding
    console.log('\n2. Submitting human bid...');
    await makeRequest('http://localhost:3001/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: createData.gameId,
        playerId: createData.playerId,
        action: 'submitBid',
        data: { bid: 3 }
      })
    });
    console.log('✅ Human bid submitted, game should move to playing phase');
    
    // Step 3: Human submits tricks first (should trigger AI)
    console.log('\n3. Human player submitting tricks first...');
    
    // Test invalid tricks first
    console.log('   Testing negative tricks...');
    const negativeResponse = await makeRequest('http://localhost:3001/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: createData.gameId,
        playerId: createData.playerId,
        action: 'submitTricks',
        data: { tricks: -1 }
      })
    });
    
    if (!negativeResponse.ok) {
      console.log('   ✅ Correctly rejected -1 tricks');
      console.log(`      Error: ${negativeResponse.data.error}`);
      console.log(`      Validation: ${negativeResponse.data.validation}`);
    } else {
      console.log('   ❌ Should have rejected -1 tricks');
    }
    
    // Test too many tricks
    console.log('   Testing 15 tricks...');
    const highResponse = await makeRequest('http://localhost:3001/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: createData.gameId,
        playerId: createData.playerId,
        action: 'submitTricks',
        data: { tricks: 15 }
      })
    });
    
    if (!highResponse.ok) {
      console.log('   ✅ Correctly rejected 15 tricks');
      console.log(`      Error: ${highResponse.data.error}`);
      console.log(`      Validation: ${highResponse.data.validation}`);
    } else {
      console.log('   ❌ Should have rejected 15 tricks');
    }
    
    // Submit valid tricks
    console.log('   Testing valid tricks (4)...');
    const validResponse = await makeRequest('http://localhost:3001/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: createData.gameId,
        playerId: createData.playerId,
        action: 'submitTricks',
        data: { tricks: 4 }
      })
    });
    
    if (validResponse.ok) {
      console.log('   ✅ Valid tricks (4) accepted');
      
      // Wait for AI processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check final state
      console.log('\n4. Checking final state after AI processing...');
      const finalResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
      const finalGame = finalResponse.data.game;
      const finalRound = finalGame.rounds[0];
      
      console.log(`   Status: ${finalGame.status}`);
      console.log(`   All tricks: ${JSON.stringify(finalRound.tricks)}`);
      
      if (finalRound.tricks && Object.keys(finalRound.tricks).length > 0) {
        const totalTricks = Object.values(finalRound.tricks).reduce((sum, t) => sum + t, 0);
        console.log(`   Total tricks: ${totalTricks}`);
        
        if (totalTricks === 13) {
          console.log('   ✅ Perfect! AI validation working correctly');
          console.log('   ✅ Total tricks equals exactly 13');
          
          // Show individual breakdown
          Object.entries(finalRound.tricks).forEach(([playerId, tricks]) => {
            const player = finalGame.players[playerId];
            const bid = finalRound.bids[playerId];
            console.log(`      ${player.name}: bid ${bid}, got ${tricks} tricks`);
          });
          
        } else {
          console.log(`   ❌ ERROR: Total tricks ${totalTricks} != 13`);
          console.log('   Individual tricks:', finalRound.tricks);
        }
      }
      
    } else {
      console.log('   ❌ Valid tricks submission failed:', validResponse.data);
    }
    
    console.log('\n🎉 Human-first trick submission test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHumanFirst(); 
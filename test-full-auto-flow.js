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

async function testFullAutoFlow() {
  console.log('🧪 Testing Full Auto-Game Flow with Trick Validation...\n');
  
  try {
    // Step 1: Create auto-mode game
    console.log('1. Creating auto-mode game...');
    const createResponse = await makeRequest('http://localhost:3001/api/create', {
      method: 'POST',
      body: JSON.stringify({ hostName: 'auto' })
    });
    
    if (!createResponse.ok) {
      console.log('❌ Failed to create game:', createResponse.data);
      return;
    }
    
    const createData = createResponse.data;
    console.log(`✅ Auto game created: ${createData.gameId}`);
    console.log(`   Players: ${Object.keys(createData.game.players).length}`);
    console.log(`   Status: ${createData.game.status}`);
    console.log('');
    
    // Step 2: Human player submits bid (triggers AI bids)
    console.log('2. Human player submitting bid...');
    const bidResponse = await makeRequest('http://localhost:3001/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: createData.gameId,
        playerId: createData.playerId,
        action: 'submitBid',
        data: { bid: 3 }
      })
    });
    
    if (!bidResponse.ok) {
      console.log('❌ Failed to submit bid:', bidResponse.data);
      return;
    }
    
    console.log('✅ Human bid submitted, AI bids processed automatically');
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 3: Check game state after bidding
    console.log('\n3. Checking game state after bidding...');
    const stateResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
    const game = stateResponse.data.game;
    
    console.log(`   Status: ${game.status}`);
    console.log(`   Current Round: ${game.currentRound}`);
    
    if (game.rounds.length > 0) {
      const round = game.rounds[0];
      console.log(`   Bids: ${JSON.stringify(round.bids)}`);
      console.log(`   Bid count: ${Object.keys(round.bids).length}`);
      
      if (game.status === 'playing') {
        console.log('✅ Game moved to playing phase automatically');
        
        // Step 4: Test trick validation
        console.log('\n4. Testing trick validation...');
        
        // Test invalid tricks
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
        } else {
          console.log('   ❌ Should have rejected 15 tricks');
        }
        
        // Test valid tricks submission
        console.log('   Testing valid tricks (5)...');
        const validResponse = await makeRequest('http://localhost:3001/api/action', {
          method: 'POST',
          body: JSON.stringify({
            gameId: createData.gameId,
            playerId: createData.playerId,
            action: 'submitTricks',
            data: { tricks: 5 }
          })
        });
        
        if (validResponse.ok) {
          console.log('   ✅ Valid tricks (5) accepted');
          
          // Wait for AI processing
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check final state
          console.log('\n5. Checking final game state...');
          const finalResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
          const finalGame = finalResponse.data.game;
          const finalRound = finalGame.rounds[0];
          
          console.log(`   Final Status: ${finalGame.status}`);
          console.log(`   Final Tricks: ${JSON.stringify(finalRound.tricks)}`);
          
          if (finalRound.tricks && Object.keys(finalRound.tricks).length > 0) {
            const totalTricks = Object.values(finalRound.tricks).reduce((sum, t) => sum + t, 0);
            console.log(`   Total Tricks: ${totalTricks}`);
            
            if (totalTricks === 13) {
              console.log('   ✅ Perfect! Total tricks equals exactly 13');
              console.log('   ✅ Trick validation system working correctly!');
            } else {
              console.log(`   ❌ ERROR: Total tricks ${totalTricks} != 13`);
            }
          }
          
        } else {
          console.log('   ❌ Valid tricks submission failed:', validResponse.data);
        }
        
      } else {
        console.log('❌ Game did not move to playing phase');
      }
    }
    
    console.log('\n🎉 Full auto-game flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFullAutoFlow(); 
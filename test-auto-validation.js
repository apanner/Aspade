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

async function testAutoValidation() {
  console.log('🧪 Testing Auto-Mode Trick Validation...\n');
  
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
    console.log(`   Game mode: ${createData.game.teamConfig?.gameMode || 'unknown'}`);
    console.log(`   Players: ${Object.keys(createData.game.players).length}`);
    console.log('');
    
    // Wait a moment for AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Check current game state
    console.log('2. Checking game state...');
    const stateResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
    const game = stateResponse.data.game;
    
    console.log(`   Status: ${game.status}`);
    console.log(`   Current Round: ${game.currentRound}`);
    console.log(`   Team Config: ${JSON.stringify(game.teamConfig)}`);
    
    if (game.rounds.length > 0) {
      const round = game.rounds[0];
      console.log(`   Round 1 Bids: ${JSON.stringify(round.bids)}`);
      console.log(`   Round 1 Tricks: ${JSON.stringify(round.tricks)}`);
      
      if (round.tricks && Object.keys(round.tricks).length > 0) {
        const totalTricks = Object.values(round.tricks).reduce((sum, t) => sum + t, 0);
        console.log(`   Total Tricks: ${totalTricks}`);
        
        if (totalTricks === 13) {
          console.log('✅ Perfect! AI validation working correctly');
        } else {
          console.log(`❌ ERROR: Total tricks ${totalTricks} != 13`);
          console.log('   Individual tricks:', round.tricks);
        }
      } else {
        console.log('   No tricks submitted yet');
      }
    }
    
    // Step 3: Test manual trick validation (if game allows it)
    console.log('\n3. Testing manual trick validation...');
    const playerId = createData.playerId;
    
    // Try to submit invalid tricks (negative)
    try {
      const response = await makeRequest('http://localhost:3001/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId: createData.gameId,
          playerId: playerId,
          action: 'submitTricks',
          data: { tricks: -1 }
        })
      });
      
      if (!response.ok) {
        console.log('✅ Correctly rejected -1 tricks');
        console.log(`   Error: ${response.data.error}`);
      } else {
        console.log('❌ Should have rejected -1 tricks');
      }
    } catch (error) {
      console.log('✅ Correctly rejected -1 tricks (caught exception)');
    }
    
    // Try to submit too many tricks
    try {
      const response = await makeRequest('http://localhost:3001/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId: createData.gameId,
          playerId: playerId,
          action: 'submitTricks',
          data: { tricks: 15 }
        })
      });
      
      if (!response.ok) {
        console.log('✅ Correctly rejected 15 tricks');
        console.log(`   Error: ${response.data.error}`);
      } else {
        console.log('❌ Should have rejected 15 tricks');
      }
    } catch (error) {
      console.log('✅ Correctly rejected 15 tricks (caught exception)');
    }
    
    console.log('\n🎉 Auto-mode validation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAutoValidation(); 
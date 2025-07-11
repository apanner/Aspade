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

async function debugGameFlow() {
  console.log('🐛 Debugging Game Flow Step-by-Step...\n');
  
  try {
    // Step 1: Create auto-mode game
    console.log('1. Creating auto-mode game...');
    const createResponse = await makeRequest('http://localhost:3001/api/create', {
      method: 'POST',
      body: JSON.stringify({ hostName: 'auto' })
    });
    
    const createData = createResponse.data;
    console.log(`✅ Auto game created: ${createData.gameId}`);
    console.log(`   Initial status: ${createData.game.status}`);
    console.log(`   Initial players: ${Object.keys(createData.game.players).length}`);
    console.log(`   Host player ID: ${createData.playerId}`);
    
    // Step 2: Check game state before bid
    console.log('\n2. Checking game state before bid...');
    const preBidResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
    const preBidGame = preBidResponse.data.game;
    
    console.log(`   Status: ${preBidGame.status}`);
    console.log(`   Current round: ${preBidGame.currentRound}`);
    console.log(`   Rounds array length: ${preBidGame.rounds.length}`);
    
    if (preBidGame.rounds.length > 0) {
      const round = preBidGame.rounds[0];
      console.log(`   Round 1 bids: ${JSON.stringify(round.bids)}`);
      console.log(`   Bid count: ${Object.keys(round.bids).length}`);
    }
    
    // Step 3: Submit human bid
    console.log('\n3. Submitting human bid...');
    const bidResponse = await makeRequest('http://localhost:3001/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: createData.gameId,
        playerId: createData.playerId,
        action: 'submitBid',
        data: { bid: 3 }
      })
    });
    
    console.log(`   Bid response status: ${bidResponse.ok ? 'Success' : 'Failed'}`);
    if (!bidResponse.ok) {
      console.log(`   Error: ${bidResponse.data.error}`);
      return;
    }
    
    // Step 4: Check game state immediately after bid
    console.log('\n4. Checking game state immediately after bid...');
    const postBidResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
    const postBidGame = postBidResponse.data.game;
    
    console.log(`   Status: ${postBidGame.status}`);
    console.log(`   Current round: ${postBidGame.currentRound}`);
    
    if (postBidGame.rounds.length > 0) {
      const round = postBidGame.rounds[0];
      console.log(`   Round 1 bids: ${JSON.stringify(round.bids)}`);
      console.log(`   Bid count: ${Object.keys(round.bids).length}`);
      console.log(`   Round status: ${round.status}`);
      
      // Check which players haven't bid yet
      const playerIds = Object.keys(postBidGame.players);
      const playersBid = Object.keys(round.bids);
      const playersNotBid = playerIds.filter(pid => !playersBid.includes(pid));
      
      console.log(`   Total players: ${playerIds.length}`);
      console.log(`   Players who bid: ${playersBid.length}`);
      console.log(`   Players not bid: ${playersNotBid.length}`);
      
      if (playersNotBid.length > 0) {
        console.log(`   Players who haven't bid:`, playersNotBid.map(pid => postBidGame.players[pid].name));
      }
    }
    
    // Step 5: Wait and check again (AI processing might be async)
    console.log('\n5. Waiting 2 seconds and checking again...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const delayedResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
    const delayedGame = delayedResponse.data.game;
    
    console.log(`   Status after delay: ${delayedGame.status}`);
    
    if (delayedGame.rounds.length > 0) {
      const round = delayedGame.rounds[0];
      console.log(`   Bids after delay: ${JSON.stringify(round.bids)}`);
      console.log(`   Bid count after delay: ${Object.keys(round.bids).length}`);
      console.log(`   Round status after delay: ${round.status}`);
      
      if (Object.keys(round.bids).length === Object.keys(delayedGame.players).length) {
        console.log('   ✅ All players have bid!');
        
        if (delayedGame.status === 'playing') {
          console.log('   ✅ Game moved to playing phase');
          
          // Now test trick submission
          console.log('\n6. Testing trick submission...');
          const tricksResponse = await makeRequest('http://localhost:3001/api/action', {
            method: 'POST',
            body: JSON.stringify({
              gameId: createData.gameId,
              playerId: createData.playerId,
              action: 'submitTricks',
              data: { tricks: 3 }
            })
          });
          
          if (tricksResponse.ok) {
            console.log('   ✅ Tricks submitted successfully');
            
            // Check final state
            await new Promise(resolve => setTimeout(resolve, 1000));
            const finalResponse = await makeRequest(`http://localhost:3001/api/game/${createData.gameId}`);
            const finalGame = finalResponse.data.game;
            const finalRound = finalGame.rounds[0];
            
            console.log(`   Final tricks: ${JSON.stringify(finalRound.tricks)}`);
            if (finalRound.tricks) {
              const totalTricks = Object.values(finalRound.tricks).reduce((sum, t) => sum + t, 0);
              console.log(`   Total tricks: ${totalTricks}`);
              if (totalTricks === 13) {
                console.log('   ✅ Perfect! Validation working correctly');
              }
            }
            
          } else {
            console.log(`   ❌ Tricks submission failed: ${tricksResponse.data.error}`);
          }
          
        } else {
          console.log(`   ❌ Game status is ${delayedGame.status}, not playing`);
        }
      } else {
        console.log('   ❌ Not all players have bid yet');
      }
    }
    
    console.log('\n🐛 Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugGameFlow(); 
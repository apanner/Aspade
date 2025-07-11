const http = require('http');

const API_URL = 'http://localhost:3001';

async function request(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${endpoint}`);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`${res.statusCode}: ${result.error || res.statusMessage}`));
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
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

async function demonstrateTrickReview() {
  console.log('🎮 Demonstrating Trick Review Feature\n');
  
  try {
    // Create game
    const game = await request('/api/create', {
      method: 'POST',
      body: JSON.stringify({
        hostName: 'Host',
        gameMode: 'individual',
        teamNames: { red: 'Red Team', blue: 'Blue Team' }
      })
    });
    
    console.log(`✅ Game created: ${game.gameId}`);
    
    // Join 3 more players
    const players = [];
    for (let i = 2; i <= 4; i++) {
      const player = await request('/api/join', {
        method: 'POST',
        body: JSON.stringify({
          code: game.code,
          playerName: `Player${i}`
        })
      });
      players.push(player.playerId);
    }
    
    console.log(`✅ 4 players joined`);
    
    // Start game
    await request('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: game.gameId,
        playerId: game.playerId,
        action: 'startGame'
      })
    });
    
    console.log(`✅ Game started`);
    
    // Submit bids
    const bids = [3, 3, 3, 4]; // Total = 13
    const allPlayers = [game.playerId, ...players];
    
    for (let i = 0; i < allPlayers.length; i++) {
      await request('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId: game.gameId,
          playerId: allPlayers[i],
          action: 'submitBid',
          data: { bid: bids[i] }
        })
      });
    }
    
    console.log(`✅ All bids submitted: ${bids.join(', ')}`);
    console.log(`✅ Game automatically moved to playing phase`);
    
    // Submit tricks - HOST LAST to trigger review
    const tricks = [2, 4, 3, 4]; // Total = 13
    
    // Submit tricks for non-host players first
    for (let i = 1; i < allPlayers.length; i++) {
      await request('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId: game.gameId,
          playerId: allPlayers[i],
          action: 'submitTricks',
          data: { tricks: tricks[i] }
        })
      });
      console.log(`✅ Player ${i+1} submitted ${tricks[i]} tricks`);
    }
    
    console.log('⏳ Now host submits tricks (should trigger review)...');
    
    // Host submits last to trigger review
    await request('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: game.gameId,
        playerId: allPlayers[0], // Host
        action: 'submitTricks',
        data: { tricks: tricks[0] }
      })
    });
    
    console.log(`✅ Host submitted ${tricks[0]} tricks`);
    
    // Check game state
    const gameState = await request(`/api/game/${game.gameId}`);
    console.log(`✅ Game Status: ${gameState.game.status}`);
    
    if (gameState.game.status === 'trick_review') {
      console.log('🎯 SUCCESS: Game moved to TRICK_REVIEW state!');
      console.log('📋 Trick Review Modal should now appear with:');
      console.log('   - Host: B:3 W:2 (editable)');
      console.log('   - Player2: B:3 W:4 (editable)');
      console.log('   - Player3: B:3 W:3 (editable)');
      console.log('   - Player4: B:4 W:4 (editable)');
      console.log('   - Total: 13/13 tricks ✅');
      console.log('   - "Approve & Continue" button available');
      
      // Test trick editing
      console.log('\n🔧 Testing trick editing...');
      await request('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId: game.gameId,
          playerId: game.playerId,
          action: 'editPlayerTricks',
          data: { targetPlayerId: players[0], newTricks: 3 }
        })
      });
      console.log('✅ Host edited Player2 tricks from 4 to 3');
      
      // Test approval
      console.log('\n✅ Testing approval...');
      await request('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId: game.gameId,
          playerId: game.playerId,
          action: 'approveTricks'
        })
      });
      console.log('✅ Host approved tricks - game should move to scoring');
      
      // Check final state
      const finalState = await request(`/api/game/${game.gameId}`);
      console.log(`✅ Final Game Status: ${finalState.game.status}`);
      
    } else {
      console.log(`❌ Expected trick_review, got ${gameState.game.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the demo
demonstrateTrickReview(); 
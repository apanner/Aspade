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

async function debugTrickReview() {
  console.log('🔍 Debugging Trick Review Flow...\n');
  
  try {
    // Create game
    console.log('Step 1: Creating game...');
    const game = await request('/api/create', {
      method: 'POST',
      body: JSON.stringify({
        hostName: 'Host',
        gameMode: 'individual'
      })
    });
    
    console.log(`✅ Game created: ${game.gameId}`);
    console.log(`   Status: ${game.game.status}`);
    console.log(`   Players: ${Object.keys(game.game.players).length}`);
    
    // Join 3 more players
    console.log('\nStep 2: Adding players...');
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
      console.log(`   Player${i} joined: ${player.playerId}`);
    }
    
    // Check game state
    console.log('\nStep 3: Checking game state before start...');
    let gameState = await request(`/api/game/${game.gameId}`);
    console.log(`   Status: ${gameState.game.status}`);
    console.log(`   Players: ${Object.keys(gameState.game.players).length}`);
    
    // Start game
    console.log('\nStep 4: Starting game...');
    await request('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: game.gameId,
        playerId: game.playerId,
        action: 'startGame'
      })
    });
    
    console.log('✅ Game started');
    
    // Check game state after start
    gameState = await request(`/api/game/${game.gameId}`);
    console.log(`   Status: ${gameState.game.status}`);
    console.log(`   Current Round: ${gameState.game.currentRound}`);
    
    // Submit bids
    console.log('\nStep 5: Submitting bids...');
    const bids = [3, 3, 3, 4];
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
      console.log(`   Player ${i+1} bid: ${bids[i]}`);
    }
    
    // Check game state after bids
    gameState = await request(`/api/game/${game.gameId}`);
    console.log(`\n✅ All bids submitted`);
    console.log(`   Status: ${gameState.game.status}`);
    console.log(`   Bids: ${JSON.stringify(gameState.game.rounds[0].bids)}`);
    
    // Submit tricks for non-host players first
    console.log('\nStep 6: Submitting tricks (non-host first)...');
    const tricks = [2, 4, 3, 4]; // Total = 13
    
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
      console.log(`   Player ${i+1} submitted ${tricks[i]} tricks`);
      
      // Check game state after each submission
      gameState = await request(`/api/game/${game.gameId}`);
      console.log(`     Status: ${gameState.game.status}`);
      console.log(`     Tricks so far: ${JSON.stringify(gameState.game.rounds[0].tricks)}`);
    }
    
    // Host submits last
    console.log('\nStep 7: Host submits tricks (should trigger review)...');
    await request('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: game.gameId,
        playerId: allPlayers[0],
        action: 'submitTricks',
        data: { tricks: tricks[0] }
      })
    });
    
    console.log(`   Host submitted ${tricks[0]} tricks`);
    
    // Final check
    gameState = await request(`/api/game/${game.gameId}`);
    console.log(`\n📊 FINAL GAME STATE:`);
    console.log(`   Status: ${gameState.game.status}`);
    console.log(`   State: ${gameState.game.state}`);
    console.log(`   All Tricks: ${JSON.stringify(gameState.game.rounds[0].tricks)}`);
    
    const totalTricks = Object.values(gameState.game.rounds[0].tricks).reduce((sum, t) => sum + t, 0);
    console.log(`   Total Tricks: ${totalTricks}`);
    
    if (gameState.game.status === 'trick_review') {
      console.log('\n🎯 SUCCESS: Game is in TRICK_REVIEW state!');
    } else {
      console.log(`\n❌ ISSUE: Expected trick_review, got ${gameState.game.status}`);
    }
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
  }
}

// Run the debug
debugTrickReview(); 
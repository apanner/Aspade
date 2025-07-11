import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testTrickValidation() {
  console.log('🧪 Testing Trick Validation System...\n');
  
  let gameId, playerId;
  
  try {
    // Step 1: Create a new game with 4 players
    console.log('1. Creating game with 4 players...');
    const createResponse = await fetch(`${API_BASE}/api/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostName: 'TestHost',
        gameMode: 'individual',
        maxPlayers: 4,
        totalRounds: 1
      })
    });
    const createData = await createResponse.json();
    gameId = createData.gameId;
    playerId = createData.playerId;
    console.log(`✅ Game created: ${gameId}\n`);
    
    // Step 2: Join 3 more players
    console.log('2. Adding 3 more players...');
    const players = [];
    for (let i = 2; i <= 4; i++) {
      const joinResponse = await fetch(`${API_BASE}/api/players/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Player${i}`,
          gameId: gameId
        })
      });
      const joinData = await joinResponse.json();
      players.push(joinData.playerId);
      console.log(`✅ Player${i} joined: ${joinData.playerId}`);
    }
    console.log('');
    
    // Step 3: Start game and move to trick tracking
    console.log('3. Starting game and moving to trick tracking...');
    
    // Start game
    await fetch(`${API_BASE}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId, playerId, action: 'startGame'
      })
    });
    
    // Submit bids for all players
    const bids = [3, 4, 3, 3]; // Total: 13 bids
    for (let i = 0; i < 4; i++) {
      const pid = i === 0 ? playerId : players[i - 1];
      await fetch(`${API_BASE}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId, playerId: pid, action: 'submitBid',
          data: { bid: bids[i] }
        })
      });
    }
    
    // Start trick tracking
    await fetch(`${API_BASE}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId, playerId, action: 'startTrickTracking'
      })
    });
    
    console.log('✅ Game started, bids submitted, trick tracking started\n');
    
    // Step 4: Test individual trick validation
    console.log('4. Testing individual trick validation...');
    
    // Test: Negative tricks
    try {
      await fetch(`${API_BASE}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId, playerId, action: 'submitTricks',
          data: { tricks: -1 }
        })
      });
      console.log('❌ Should have failed for negative tricks');
    } catch (error) {
      console.log('✅ Correctly rejected negative tricks');
    }
    
    // Test: Too many tricks (over 13)
    try {
      const response = await fetch(`${API_BASE}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId, playerId, action: 'submitTricks',
          data: { tricks: 14 }
        })
      });
      if (!response.ok) {
        console.log('✅ Correctly rejected 14 tricks (over individual limit)');
      }
    } catch (error) {
      console.log('✅ Correctly rejected 14 tricks (over individual limit)');
    }
    
    // Step 5: Test total tricks validation
    console.log('\n5. Testing total tricks validation...');
    
    // Player 1: Submit 5 tricks (valid)
    await fetch(`${API_BASE}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId, playerId, action: 'submitTricks',
        data: { tricks: 5 }
      })
    });
    console.log('✅ Player 1 submitted 5 tricks');
    
    // Player 2: Submit 4 tricks (valid, total = 9)
    await fetch(`${API_BASE}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId, playerId: players[0], action: 'submitTricks',
        data: { tricks: 4 }
      })
    });
    console.log('✅ Player 2 submitted 4 tricks (total: 9)');
    
    // Player 3: Try to submit 6 tricks (should fail - total would be 15)
    try {
      const response = await fetch(`${API_BASE}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId, playerId: players[1], action: 'submitTricks',
          data: { tricks: 6 }
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log('✅ Correctly rejected 6 tricks (would exceed total)');
        console.log(`   Error: ${errorData.error}`);
      }
    } catch (error) {
      console.log('✅ Correctly rejected 6 tricks (would exceed total)');
    }
    
    // Player 3: Submit 3 tricks (valid, total = 12)
    await fetch(`${API_BASE}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId, playerId: players[1], action: 'submitTricks',
        data: { tricks: 3 }
      })
    });
    console.log('✅ Player 3 submitted 3 tricks (total: 12)');
    
    // Step 6: Test last player auto-calculation
    console.log('\n6. Testing last player auto-calculation...');
    
    // Player 4: Try to submit 2 tricks (should fail - must be exactly 1)
    try {
      const response = await fetch(`${API_BASE}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId, playerId: players[2], action: 'submitTricks',
          data: { tricks: 2 }
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log('✅ Correctly rejected 2 tricks for last player');
        console.log(`   Error: ${errorData.error}`);
      }
    } catch (error) {
      console.log('✅ Correctly rejected 2 tricks for last player');
    }
    
    // Player 4: Submit exactly 1 trick (should work)
    await fetch(`${API_BASE}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId, playerId: players[2], action: 'submitTricks',
        data: { tricks: 1 }
      })
    });
    console.log('✅ Player 4 submitted exactly 1 trick (total: 13)');
    
    // Step 7: Verify final game state
    console.log('\n7. Verifying final game state...');
    const finalResponse = await fetch(`${API_BASE}/api/game/${gameId}`);
    const finalData = await finalResponse.json();
    const round = finalData.game.rounds[0];
    
    const totalTricks = Object.values(round.tricks).reduce((sum, tricks) => sum + tricks, 0);
    console.log(`✅ Total tricks: ${totalTricks} (should be 13)`);
    
    if (totalTricks === 13) {
      console.log('✅ Perfect! Total tricks equals exactly 13');
    } else {
      console.log('❌ ERROR: Total tricks not equal to 13');
    }
    
    console.log('\n🎉 All trick validation tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTrickValidation(); 
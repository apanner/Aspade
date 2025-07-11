const API_URL = 'http://localhost:3001';

async function makeRequest(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`${response.status}: ${errorData.error || response.statusText}`);
  }

  return response.json();
}

async function testTrickReviewFlow() {
  console.log('🧪 Testing Trick Review Flow...\n');

  try {
    // 1. Create game
    console.log('1️⃣ Creating game...');
    const createResult = await makeRequest('/api/create', {
      method: 'POST',
      body: JSON.stringify({
        playerName: 'Host',
        teamNames: { red: 'Red Team', blue: 'Blue Team' }
      })
    });
    
    const gameId = createResult.gameId;
    const hostId = createResult.playerId;
    console.log(`   Game created: ${gameId}, Host: ${hostId}`);

    // 2. Join players
    console.log('2️⃣ Adding players...');
    const players = ['Player2', 'Player3', 'Player4'];
    const playerIds = [hostId];
    
    for (const playerName of players) {
      const joinResult = await makeRequest('/api/join', {
        method: 'POST',
        body: JSON.stringify({
          code: createResult.code,
          playerName: playerName
        })
      });
      playerIds.push(joinResult.playerId);
      console.log(`   ${playerName} joined: ${joinResult.playerId}`);
    }

    // 3. Start game
    console.log('3️⃣ Starting game...');
    await makeRequest('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: gameId,
        playerId: hostId,
        action: 'startGame'
      })
    });
    console.log('   Game started!');

    // 4. Submit bids
    console.log('4️⃣ Submitting bids...');
    const bids = [3, 2, 4, 4]; // Total = 13
    for (let i = 0; i < playerIds.length; i++) {
      await makeRequest('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId: gameId,
          playerId: playerIds[i],
          action: 'submitBid',
          data: { bid: bids[i] }
        })
      });
      console.log(`   Player ${i + 1} bid: ${bids[i]}`);
    }

    // 5. Start trick tracking
    console.log('5️⃣ Starting trick tracking...');
    await makeRequest('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: gameId,
        playerId: hostId,
        action: 'startTrickTracking'
      })
    });
    console.log('   Trick tracking started!');

    // 6. Submit tricks (total = 13)
    console.log('6️⃣ Submitting tricks...');
    const tricks = [2, 3, 4, 4]; // Total = 13
    for (let i = 0; i < playerIds.length; i++) {
      await makeRequest('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId: gameId,
          playerId: playerIds[i],
          action: 'submitTricks',
          data: { tricks: tricks[i] }
        })
      });
      console.log(`   Player ${i + 1} submitted ${tricks[i]} tricks`);
    }

    // 7. Check game state - should be in trick_review
    console.log('7️⃣ Checking game state...');
    const gameState = await makeRequest(`/api/game/${gameId}`);
    console.log(`   Game status: ${gameState.game.status}`);
    console.log(`   Game state: ${gameState.game.state}`);
    
    if (gameState.game.status !== 'trick_review') {
      throw new Error(`Expected trick_review, got ${gameState.game.status}`);
    }
    console.log('   ✅ Game moved to trick_review state!');

    // 8. Test trick editing
    console.log('8️⃣ Testing trick editing...');
    const targetPlayerId = playerIds[1]; // Player 2
    const newTricks = 5;
    await makeRequest('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: gameId,
        playerId: hostId, // Host editing
        action: 'editPlayerTricks',
        data: { targetPlayerId, newTricks }
      })
    });
    console.log(`   Host edited Player 2's tricks to ${newTricks}`);

    // 9. Check updated state
    console.log('9️⃣ Checking updated tricks...');
    const updatedState = await makeRequest(`/api/game/${gameId}`);
    const currentRound = updatedState.game.rounds[0];
    console.log('   Current tricks:', currentRound.tricks);
    
    const totalTricks = Object.values(currentRound.tricks).reduce((sum, t) => sum + t, 0);
    console.log(`   Total tricks: ${totalTricks}`);

    // 10. Approve tricks
    console.log('🔟 Approving tricks...');
    await makeRequest('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId: gameId,
        playerId: hostId,
        action: 'approveTricks'
      })
    });
    console.log('   Tricks approved!');

    // 11. Check final state
    console.log('1️⃣1️⃣ Checking final state...');
    const finalState = await makeRequest(`/api/game/${gameId}`);
    console.log(`   Final game status: ${finalState.game.status}`);
    console.log(`   Final game state: ${finalState.game.state}`);
    
    if (finalState.game.status !== 'scoring') {
      throw new Error(`Expected scoring, got ${finalState.game.status}`);
    }
    console.log('   ✅ Game moved to scoring state!');

    // 12. Display scores
    console.log('1️⃣2️⃣ Final scores:');
    const finalRound = finalState.game.rounds[0];
    console.log('   Round scores:', finalRound.scores);
    console.log('   Team scores:', finalState.game.scores);

    console.log('\n🎉 Trick Review Flow Test PASSED!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}

async function testTrickEditingValidation() {
  console.log('\n🧪 Testing Trick Editing Validation...\n');

  try {
    // Create a fresh game and get to trick_review state
    console.log('Setting up game for validation testing...');
    const createResult = await makeRequest('/api/create', {
      method: 'POST',
      body: JSON.stringify({
        playerName: 'Host',
        teamNames: { red: 'Red Team', blue: 'Blue Team' }
      })
    });
    
    const gameId = createResult.gameId;
    const hostId = createResult.playerId;
    
    // Join players and start game
    const players = ['Player2', 'Player3', 'Player4'];
    const playerIds = [hostId];
    
    for (const playerName of players) {
      const joinResult = await makeRequest('/api/join', {
        method: 'POST',
        body: JSON.stringify({
          code: createResult.code,
          playerName: playerName
        })
      });
      playerIds.push(joinResult.playerId);
    }

    // Start game and submit bids
    await makeRequest('/api/action', {
      method: 'POST',
      body: JSON.stringify({ gameId, playerId: hostId, action: 'startGame' })
    });

    const bids = [3, 3, 3, 4];
    for (let i = 0; i < playerIds.length; i++) {
      await makeRequest('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId, playerId: playerIds[i], action: 'submitBid', data: { bid: bids[i] }
        })
      });
    }

    // Start trick tracking and submit tricks
    await makeRequest('/api/action', {
      method: 'POST',
      body: JSON.stringify({ gameId, playerId: hostId, action: 'startTrickTracking' })
    });

    const tricks = [3, 3, 3, 4];
    for (let i = 0; i < playerIds.length; i++) {
      await makeRequest('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId, playerId: playerIds[i], action: 'submitTricks', data: { tricks: tricks[i] }
        })
      });
    }

    console.log('✅ Game is now in trick_review state');

    // Test 1: Invalid trick value (negative)
    console.log('Test 1: Invalid trick value (negative)');
    try {
      await makeRequest('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId, playerId: hostId, action: 'editPlayerTricks',
          data: { targetPlayerId: playerIds[1], newTricks: -1 }
        })
      });
      throw new Error('Should have failed');
    } catch (error) {
      if (error.message.includes('between 0 and 13')) {
        console.log('   ✅ Correctly rejected negative tricks');
      } else {
        throw error;
      }
    }

    // Test 2: Invalid trick value (too high)
    console.log('Test 2: Invalid trick value (too high)');
    try {
      await makeRequest('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId, playerId: hostId, action: 'editPlayerTricks',
          data: { targetPlayerId: playerIds[1], newTricks: 14 }
        })
      });
      throw new Error('Should have failed');
    } catch (error) {
      if (error.message.includes('between 0 and 13')) {
        console.log('   ✅ Correctly rejected tricks > 13');
      } else {
        throw error;
      }
    }

    // Test 3: Total exceeds 13
    console.log('Test 3: Total exceeds 13');
    try {
      await makeRequest('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId, playerId: hostId, action: 'editPlayerTricks',
          data: { targetPlayerId: playerIds[1], newTricks: 10 }
        })
      });
      throw new Error('Should have failed');
    } catch (error) {
      if (error.message.includes('exceed 13 tricks')) {
        console.log('   ✅ Correctly rejected total > 13');
      } else {
        throw error;
      }
    }

    // Test 4: Valid edit
    console.log('Test 4: Valid edit');
    await makeRequest('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId, playerId: hostId, action: 'editPlayerTricks',
        data: { targetPlayerId: playerIds[1], newTricks: 2 }
      })
    });
    console.log('   ✅ Successfully edited tricks');

    // Test 5: Non-host cannot edit
    console.log('Test 5: Non-host cannot edit');
    try {
      await makeRequest('/api/action', {
        method: 'POST',
        body: JSON.stringify({
          gameId, playerId: playerIds[1], action: 'editPlayerTricks',
          data: { targetPlayerId: playerIds[2], newTricks: 5 }
        })
      });
      throw new Error('Should have failed');
    } catch (error) {
      if (error.message.includes('Only host can edit')) {
        console.log('   ✅ Correctly rejected non-host edit');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Trick Editing Validation Test PASSED!');

  } catch (error) {
    console.error('\n❌ Validation test failed:', error.message);
    throw error;
  }
}

// Run tests
if (require.main === module) {
  testTrickReviewFlow()
    .then(() => testTrickEditingValidation())
    .then(() => {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Tests failed:', error.message);
      process.exit(1);
    });
} 
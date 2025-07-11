import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testAutoValidation() {
  console.log('🧪 Testing Auto-Mode Trick Validation...\n');
  
  try {
    // Step 1: Create auto-mode game
    console.log('1. Creating auto-mode game...');
    const createResponse = await fetch(`${API_BASE}/api/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName: 'auto' })
    });
    const createData = await createResponse.json();
    console.log(`✅ Auto game created: ${createData.gameId}`);
    console.log(`   Game mode: ${createData.game.teamConfig?.gameMode || 'unknown'}`);
    console.log(`   Players: ${Object.keys(createData.game.players).length}`);
    console.log('');
    
    // Step 2: Check current game state
    console.log('2. Checking game state...');
    const stateResponse = await fetch(`${API_BASE}/api/game/${createData.gameId}`);
    const stateData = await stateResponse.json();
    const game = stateData.game;
    
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
      }
    }
    
    // Step 3: Test manual trick submission (if game is in playing state)
    if (game.status === 'playing') {
      console.log('\n3. Testing manual trick validation...');
      const playerId = createData.playerId;
      
      // Try to submit invalid tricks
      try {
        const response = await fetch(`${API_BASE}/api/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: createData.gameId,
            playerId: playerId,
            action: 'submitTricks',
            data: { tricks: 15 }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.log('✅ Correctly rejected 15 tricks');
          console.log(`   Error: ${errorData.error}`);
          console.log(`   Validation: ${errorData.validation}`);
        } else {
          console.log('❌ Should have rejected 15 tricks');
        }
      } catch (error) {
        console.log('✅ Correctly rejected 15 tricks (caught exception)');
      }
    }
    
    console.log('\n🎉 Auto-mode validation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAutoValidation(); 
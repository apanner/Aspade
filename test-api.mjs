import fetch from 'node-fetch';

async function testAPI() {
  const BASE_URL = 'http://localhost:3001';
  
  try {
    console.log('🔍 Testing API endpoints...\n');
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test create game
    console.log('\n2. Testing create game...');
    const createResponse = await fetch(`${BASE_URL}/api/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostName: 'Test Host' }),
    });
    
    if (!createResponse.ok) {
      throw new Error(`HTTP error! status: ${createResponse.status}`);
    }
    
    const createData = await createResponse.json();
    console.log('✅ Game created:', {
      gameId: createData.gameId,
      code: createData.code,
      playerId: createData.playerId,
      playerCount: Object.keys(createData.game.players).length
    });
    
    // Test join game
    console.log('\n3. Testing join game...');
    const joinResponse = await fetch(`${BASE_URL}/api/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code: createData.code, 
        playerName: 'Test Player 2' 
      }),
    });
    
    if (!joinResponse.ok) {
      throw new Error(`HTTP error! status: ${joinResponse.status}`);
    }
    
    const joinData = await joinResponse.json();
    console.log('✅ Player joined:', {
      playerId: joinData.playerId,
      playerCount: Object.keys(joinData.game.players).length,
      teams: {
        red: Object.values(joinData.game.players).filter(p => p.team === 'red').length,
        blue: Object.values(joinData.game.players).filter(p => p.team === 'blue').length
      }
    });
    
    // Test get game state
    console.log('\n4. Testing get game state...');
    const gameStateResponse = await fetch(`${BASE_URL}/api/game/${createData.gameId}`);
    
    if (!gameStateResponse.ok) {
      throw new Error(`HTTP error! status: ${gameStateResponse.status}`);
    }
    
    const gameStateData = await gameStateResponse.json();
    console.log('✅ Game state retrieved:', {
      status: gameStateData.game.status,
      currentRound: gameStateData.game.currentRound,
      playerCount: Object.keys(gameStateData.game.players).length
    });
    
    console.log('\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

testAPI(); 
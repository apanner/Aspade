const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Production middleware
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://www.apanner.com');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Create games directory if it doesn't exist
const GAMES_DIR = path.join(__dirname, 'games');
const PLAYERS_DIR = path.join(__dirname, 'players');
const PLAYER_PROFILES_DIR = path.join(__dirname, 'player_profiles');
const GAME_HISTORY_DIR = path.join(__dirname, 'game_history');

if (!fs.existsSync(GAMES_DIR)) {
  fs.mkdirSync(GAMES_DIR, { recursive: true });
}

if (!fs.existsSync(PLAYERS_DIR)) {
  fs.mkdirSync(PLAYERS_DIR, { recursive: true });
}

if (!fs.existsSync(PLAYER_PROFILES_DIR)) {
  fs.mkdirSync(PLAYER_PROFILES_DIR, { recursive: true });
}

if (!fs.existsSync(GAME_HISTORY_DIR)) {
  fs.mkdirSync(GAME_HISTORY_DIR, { recursive: true });
}

// JSON File Storage Functions
function saveGameToFile(gameId, gameData) {
  const filePath = path.join(GAMES_DIR, `${gameId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(gameData, null, 2));
  console.log(`Game ${gameId} saved to ${filePath}`);
}

function loadGameFromFile(gameId) {
  const filePath = path.join(GAMES_DIR, `${gameId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading game ${gameId}:`, error);
    return null;
  }
}

function deleteGameFile(gameId) {
  const filePath = path.join(GAMES_DIR, `${gameId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Game file ${gameId}.json deleted`);
    return true;
  }
  return false;
}

function getAllGameFiles() {
  const files = fs.readdirSync(GAMES_DIR);
  return files.filter(file => file.endsWith('.json')).map(file => file.replace('.json', ''));
}

function savePlayerSession(playerId, sessionData) {
  const filePath = path.join(PLAYERS_DIR, `${playerId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
}

function loadPlayerSession(playerId) {
  const filePath = path.join(PLAYERS_DIR, `${playerId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading player session ${playerId}:`, error);
    return null;
  }
}

function deletePlayerSession(playerId) {
  const filePath = path.join(PLAYERS_DIR, `${playerId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Player session ${playerId}.json deleted`);
    return true;
  }
  return false;
}

// Utility functions
function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generatePlayerId() {
  return Math.random().toString(36).substr(2, 9);
}

function assignTeam(players, teamConfig = { numberOfTeams: 2, playersPerTeam: 2, autoAssignTeams: true }) {
  if (!teamConfig.autoAssignTeams) {
    // Manual team assignment - players will choose their teams
    return players;
  }

  const playerIds = Object.keys(players);
  const { numberOfTeams, playersPerTeam } = teamConfig;
  
  // Create team names dynamically
  const teamNames = [];
  for (let i = 1; i <= numberOfTeams; i++) {
    teamNames.push(`team${i}`);
  }
  
  // Assign players to teams in round-robin fashion
  // This will distribute players based on the specified playersPerTeam
  playerIds.forEach((pid, index) => {
    const teamIndex = index % numberOfTeams;
    players[pid].team = teamNames[teamIndex];
  });
  
  return players;
}

// Legacy function for backward compatibility
function assignPlayerToTeam(players) {
  const playerCount = Object.keys(players).length;
  // First player (host) gets red, then alternate: blue, red, blue
  return playerCount % 2 === 0 ? 'blue' : 'red';
}

function calculateScore(bid, tricksWon) {
  // Nil bid rules
  if (bid === 0) {
    return tricksWon; // Bid 0: get 0 points if win 0 tricks, get number of tricks if win any
  }
  
  // Made bid exactly
  if (tricksWon === bid) {
    return bid * 10; // Made bid = 10 × bid value
  }
  
  // Overtricks (bags)
  if (tricksWon > bid) {
    return (bid * 10) + (tricksWon - bid); // Made bid + 1 point per extra trick
  }
  
  // Failed bid - new scoring system
  // Score = tricks won × 10 - (bid - tricks won) × 10
  return (tricksWon * 10) - ((bid - tricksWon) * 10);
}

function cleanupOldGames() {
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  const gameIds = getAllGameFiles();
  
  gameIds.forEach(gameId => {
    const game = loadGameFromFile(gameId);
    if (game && game.createdAt < twoHoursAgo) {
      deleteGameFile(gameId);
      console.log(`Cleaned up old game: ${gameId}`);
    }
  });
}

function backupGames() {
  const gameIds = getAllGameFiles();
  const backup = {
    games: gameIds.map(id => [id, loadGameFromFile(id)]),
    timestamp: Date.now()
  };
  fs.writeFileSync('games-backup.json', JSON.stringify(backup, null, 2));
  console.log('Games backed up to games-backup.json');
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  const gameIds = getAllGameFiles();
  res.json({ 
    status: 'ok', 
    activeGames: gameIds.length,
    uptime: process.uptime()
  });
});

// Root API endpoint
app.get('/', (req, res) => {
  const gameIds = getAllGameFiles();
  res.json({ 
    message: 'Spades Game API Server',
    status: 'running', 
    activeGames: gameIds.length,
    uptime: process.uptime(),
    endpoints: {
      health: '/health',
      createGame: '/api/create',
      joinGame: '/api/join',
      gameState: '/api/game/:gameId',
      gameAction: '/api/action',
      admin: '/api/admin/games'
    }
  });
});

// Player management functions
function savePlayerToFile(playerId, playerData) {
  const filePath = path.join(PLAYERS_DIR, `${playerId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(playerData, null, 2));
  console.log(`Player ${playerId} saved to ${filePath}`);
}

function loadPlayerFromFile(playerId) {
  const filePath = path.join(PLAYERS_DIR, `${playerId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading player ${playerId}:`, error);
    return null;
  }
}

function getAllPlayerFiles() {
  const files = fs.readdirSync(PLAYERS_DIR);
  return files.filter(file => file.endsWith('.json')).map(file => file.replace('.json', ''));
}

function deletePlayerFile(playerId) {
  const filePath = path.join(PLAYERS_DIR, `${playerId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Player file ${playerId}.json deleted`);
    return true;
  }
  return false;
}

// Player Profile API Endpoints
app.post('/api/players/login', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Player name is required' });
  }
  
  // Check if player exists
  let profile = loadPlayerProfile(name);
  
  if (!profile) {
    // Create new player profile
    profile = createPlayerProfile(name);
  } else {
    // Update existing profile
    profile = updatePlayerProfile(name, {
      loginCount: profile.loginCount + 1
    });
  }
  
  // Find active games for this player
  const activeGames = findPlayerActiveGames(name);
  
  res.json({
    success: true,
    profile: profile,
    activeGames: activeGames,
    hasActiveGames: activeGames.length > 0
  });
});

app.post('/api/players/resume', (req, res) => {
  const { playerName, gameId } = req.body;
  
  if (!playerName || !gameId) {
    return res.status(400).json({ error: 'Player name and game ID are required' });
  }
  
  // Load the game
  const game = loadGameFromFile(gameId);
  
  if (!game) {
    return res.json({
      success: false,
      error: 'Game not found or has ended',
      redirectTo: 'dashboard'
    });
  }
  
  // Check if player is in this game
  const playerEntry = Object.entries(game.players).find(([pid, player]) => 
    player.name.toLowerCase() === playerName.toLowerCase()
  );
  
  if (!playerEntry) {
    return res.json({
      success: false,
      error: 'You are not in this game',
      redirectTo: 'dashboard'
    });
  }
  
  const [playerId, player] = playerEntry;
  
  // Check if game is still active
  if (game.status === 'completed') {
    return res.json({
      success: false,
      error: 'This game has already ended',
      redirectTo: 'dashboard'
    });
  }
  
  // Update player status to active
  game.players[playerId].status = 'active';
  game.players[playerId].lastActivity = Date.now();
  game.lastActivity = Date.now();
  
  // Save game
  saveGameToFile(gameId, game);
  
  res.json({
    success: true,
    gameId: gameId,
    playerId: playerId,
    gameData: game,
    redirectTo: 'game'
  });
});

app.get('/api/players/:name/profile', (req, res) => {
  const { name } = req.params;
  const profile = loadPlayerProfile(name);
  
  if (!profile) {
    return res.status(404).json({ error: 'Player profile not found' });
  }
  
  const activeGames = findPlayerActiveGames(name);
  const gameHistory = loadGameHistory(name);
  
  res.json({
    success: true,
    profile: profile,
    activeGames: activeGames,
    gameHistory: gameHistory
  });
});

app.get('/api/players/:name/games', (req, res) => {
  const { name } = req.params;
  const activeGames = findPlayerActiveGames(name);
  
  res.json({
    success: true,
    activeGames: activeGames
  });
});

// Enhanced player registration with profile management
app.post('/api/players/register', (req, res) => {
  const { name, gameId, playerId, joinedAt, isOnline } = req.body;
  
  // Handle general player registration (from frontend auth)
  if (playerId && name && !gameId) {
    const playerData = {
      id: playerId,
      name: name.trim(),
      joinedAt: joinedAt || Date.now(),
      isOnline: isOnline !== false,
      lastSeen: Date.now()
    };
    
    savePlayerToFile(playerId, playerData);
    
    return res.json({
      success: true,
      playerId: playerId,
      message: 'Player registered successfully'
    });
  }
  
  // Handle game-specific registration (original logic)
  if (!name || !gameId) {
    return res.status(400).json({ error: 'Name and game ID are required for game registration' });
  }
  
  // Create/update player profile
  let profile = loadPlayerProfile(name);
  if (!profile) {
    profile = createPlayerProfile(name);
  } else {
    profile = updatePlayerProfile(name, {});
  }
  
  const game = loadGameFromFile(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (game.status === 'completed') {
    return res.status(400).json({ error: 'Game has already ended' });
  }
  
  // Check if player is already in the game
  const existingPlayer = Object.values(game.players).find(p => 
    p.name.toLowerCase() === name.toLowerCase()
  );
  
  if (existingPlayer) {
    // Player is resuming - find their player ID
    const resumingPlayerId = Object.keys(game.players).find(pid => 
      game.players[pid].name.toLowerCase() === name.toLowerCase()
    );
    
    // Update player status
    game.players[resumingPlayerId].status = 'active';
    game.players[resumingPlayerId].lastActivity = Date.now();
    game.lastActivity = Date.now();
    
    saveGameToFile(gameId, game);
    
    return res.json({
      success: true,
      playerId: resumingPlayerId,
      game: game,
      resuming: true,
      message: 'Welcome back! Resuming your game...'
    });
  }
  
  // Check if game is full
  const playerCount = Object.keys(game.players).length;
  if (playerCount >= game.maxPlayers) {
    return res.status(400).json({ error: 'Game is full' });
  }
  
  // Add new player
  const newPlayerId = generatePlayerId();
  const newPlayer = {
    id: newPlayerId,
    name: name,
    team: game.gameMode === 'individual' ? null : assignPlayerToTeam(game.players),
    status: 'active',
    bid: null,
    tricks: 0,
    score: 0,
    roundScores: [],
    lastActivity: Date.now(),
    isHost: false,
    isComputer: false
  };
  
  game.players[newPlayerId] = newPlayer;
  game.lastActivity = Date.now();
  
  saveGameToFile(gameId, game);
  
  res.json({
    success: true,
    playerId: newPlayerId,
    game: game,
    resuming: false,
    message: 'Successfully joined the game!'
  });
});

// Legacy player registration endpoint removed to avoid conflicts with new profile system

// Update player status
app.post('/api/players/status', (req, res) => {
  const { playerId, isOnline, lastSeen } = req.body;
  
  if (!playerId) {
    return res.status(400).json({ error: 'playerId is required' });
  }

  let existingPlayer = loadPlayerFromFile(playerId);
  
  // If player doesn't exist, create a basic player record
  if (!existingPlayer) {
    existingPlayer = {
      id: playerId,
      name: 'Guest Player',
      isOnline: true,
      lastSeen: Date.now(),
      joinedAt: Date.now()
    };
  }

  const updatedPlayer = {
    ...existingPlayer,
    isOnline: isOnline !== false,
    lastSeen: lastSeen || Date.now()
  };

  savePlayerToFile(playerId, updatedPlayer);
  
  res.json({ success: true, player: updatedPlayer });
});

// Get all players (for admin)
app.get('/api/admin/players', (req, res) => {
  const playerIds = getAllPlayerFiles();
  const players = playerIds.map(id => {
    const player = loadPlayerFromFile(id);
    // Ensure player has required properties
    if (!player || !player.id || !player.name) return null;

    // Check if player is recently active (within 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const isRecentlyActive = player.lastSeen && player.lastSeen > fiveMinutesAgo;

    return {
      id: player.id,
      name: player.name,
      email: player.email || 'N/A',
      gamesPlayed: player.gamesPlayed || 0,
      lastSeen: player.lastSeen ? new Date(player.lastSeen).toLocaleString() : 'Unknown',
      isOnline: player.isOnline && isRecentlyActive
    };
  }).filter(Boolean);
  
  res.json({ players });
});

// Delete players (for admin)
app.delete('/api/admin/players', (req, res) => {
  const { playerIds } = req.body;
  
  if (!playerIds || !Array.isArray(playerIds)) {
    return res.status(400).json({ error: 'playerIds array is required' });
  }
  
  const deletedPlayers = [];
  const failedPlayers = [];
  
  playerIds.forEach(playerId => {
    if (deletePlayerFile(playerId)) {
      deletedPlayers.push(playerId);
    } else {
      failedPlayers.push(playerId);
    }
  });
  
  res.json({ 
    success: true, 
    deletedPlayers, 
    failedPlayers,
    message: `Deleted ${deletedPlayers.length} players` 
  });
});

// Get all games (for admin)
app.get('/api/admin/games', (req, res) => {
  const gameIds = getAllGameFiles();
  const games = gameIds.map(id => {
    const game = loadGameFromFile(id);
    return game ? {
      id: game.id,
      code: game.code,
      title: game.title || 'Untitled Game',
      host: game.hostName,
      players: Object.keys(game.players).length,
      status: game.status,
      createdAt: new Date(game.createdAt).toISOString().split('T')[0],
      lastActivity: new Date(game.lastActivity || game.createdAt).toLocaleString()
    } : null;
  }).filter(Boolean);
  
  res.json({ games });
});

// Delete games (for admin)
app.delete('/api/admin/games', (req, res) => {
  const { gameIds } = req.body;
  
  if (!gameIds || !Array.isArray(gameIds)) {
    return res.status(400).json({ error: 'gameIds array is required' });
  }
  
  const deletedGames = [];
  const failedGames = [];
  
  gameIds.forEach(gameId => {
    if (deleteGameFile(gameId)) {
      deletedGames.push(gameId);
    } else {
      failedGames.push(gameId);
    }
  });
  
  res.json({ 
    success: true, 
    deletedGames, 
    failedGames,
    message: `Deleted ${deletedGames.length} games` 
  });
});

// Create game
app.post('/api/create', (req, res) => {
  const { 
    hostName,
    gameMode = 'teams',
    numberOfTeams = 2,
    playersPerTeam = 2,
    autoAssignTeams = true,
    bidTimer = 300,
    biddingStyle = 'visible',
    totalRounds = 13,
    maxPlayers = 4,
    teamConfigs = [],
    title = '',
    description = ''
  } = req.body;
  
  if (!hostName || !hostName.trim()) {
    return res.status(400).json({ error: 'Host name is required' });
  }

  const gameId = generateGameCode();
  const hostId = generatePlayerId();
  const isAutoMode = hostName.trim().toLowerCase() === 'auto';
  
  // Force auto-mode to use individual game mode
  const finalGameMode = isAutoMode ? 'individual' : gameMode;
  
  // Create team configuration
  const teamConfig = {
    gameMode: finalGameMode,
    numberOfTeams: parseInt(numberOfTeams),
    playersPerTeam: parseInt(playersPerTeam),
    autoAssignTeams
  };

  // Initialize team scores object dynamically
  let initialScores = {};
  if (finalGameMode === 'teams') {
    for (let i = 1; i <= teamConfig.numberOfTeams; i++) {
      initialScores[`team${i}`] = 0;
    }
  } else {
    // Individual mode - scores will be per player
    initialScores = {};
  }

  const game = {
    id: gameId,
    code: gameId,
    hostId,
    hostName: isAutoMode ? 'Human Player' : hostName.trim(),
    title: isAutoMode ? 'Auto Game' : (title.trim() || `${hostName.trim()}'s Game`),
    description: description.trim() || '',
    createdAt: Date.now(),
    lastActivity: Date.now(),
    status: 'lobby',
    state: 'lobby',
    currentRound: 0,
    maxRounds: parseInt(totalRounds),
    totalRounds: parseInt(totalRounds),
    maxPlayers: isAutoMode ? 4 : parseInt(maxPlayers), // Auto-mode always 4 players
    // Team configuration
    teamConfig,
    teamConfigs: teamConfigs.length > 0 ? teamConfigs : [],
    biddingStyle,
    bidTimer: parseInt(bidTimer),
    players: {},
    rounds: [],
    scores: initialScores,
    roundScores: {} // For overall score tracking
  };

  // Add the host player
  game.players[hostId] = {
    id: hostId,
    name: isAutoMode ? 'Human Player' : hostName.trim(),
    team: finalGameMode === 'teams' ? 'team1' : null, // First team or no team for individual
    isHost: true,
    joinedAt: Date.now(),
    isComputer: false
  };

  // Assign teams if auto-assign is enabled
  if (teamConfig.autoAssignTeams && gameMode === 'teams') {
    assignTeam(game.players, teamConfig);
  }

  // If auto mode, add computer players to fill the game
  if (isAutoMode) {
    const computerPlayers = generateComputerPlayers();
    
    for (let i = 0; i < computerPlayers.length; i++) {
      const computerPlayerId = generatePlayerId();
      
      game.players[computerPlayerId] = {
        id: computerPlayerId,
        name: computerPlayers[i].name,
        team: null, // Individual mode - no teams
        isHost: false,
        joinedAt: Date.now(),
        isComputer: true,
        personality: computerPlayers[i].personality
      };
    }
    
    // Auto-start the game if we have 4 players
    if (Object.keys(game.players).length === 4) {
      game.status = 'bidding';
      game.state = 'bidding';
      game.currentRound = 1;
      game.rounds.push({
        round: 1,
        bids: {},
        tricks: {},
        scores: {},
        status: 'bidding'
      });
    }
  }

  // Save game to file
  saveGameToFile(gameId, game);
  
  // Save player session
  savePlayerSession(hostId, { gameId, playerId: hostId });
  
  res.json({ 
    gameId, 
    code: gameId, 
    playerId: hostId, 
    game,
    autoMode: isAutoMode,
    message: isAutoMode ? 'Auto mode activated! Computer players added and game started.' : null
  });
});

// Generate computer player names
function generateComputerPlayers() {
  const computerPlayers = [
    { name: 'Rookie Bot', personality: 'conservative' },
    { name: 'Strategic Sam', personality: 'smart' }, 
    { name: 'Aggressive Alice', personality: 'aggressive' }
  ];
  return computerPlayers;
}

// AI Auto-play functions
function generateAIBid(personality, roundNumber) {
  // Generate bid based on personality and round
  let baseBid;
  
  switch (personality) {
    case 'conservative':
      // Conservative: bid low, avoid nil unless early rounds
      baseBid = Math.max(0, Math.floor(Math.random() * 4) + 1);
      if (roundNumber <= 3 && Math.random() < 0.2) baseBid = 0; // 20% chance nil early
      break;
    case 'smart':
      // Smart: reasonable bids based on round
      baseBid = Math.max(0, Math.floor(Math.random() * 6) + 1);
      if (roundNumber <= 2 && Math.random() < 0.15) baseBid = 0; // 15% chance nil early
      break;
    case 'aggressive':
      // Aggressive: higher bids, more risk
      baseBid = Math.max(1, Math.floor(Math.random() * 8) + 2);
      if (Math.random() < 0.1) baseBid = 0; // 10% chance nil anytime
      break;
    default:
      baseBid = Math.floor(Math.random() * 4) + 1;
  }
  
  return Math.min(baseBid, roundNumber); // Cap at current round number
}

function generateAITricks(personality, bid) {
  // Generate tricks based on personality and bid
  let tricks;
  
  switch (personality) {
    case 'conservative':
      // Conservative: try to make bid exactly or slightly under
      if (bid === 0) {
        tricks = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 2) + 1;
      } else {
        tricks = Math.max(0, bid + Math.floor(Math.random() * 3) - 1);
      }
      break;
    case 'smart':
      // Smart: good at making bids
      if (bid === 0) {
        tricks = Math.random() < 0.8 ? 0 : Math.floor(Math.random() * 2) + 1;
      } else {
        tricks = Math.max(0, bid + Math.floor(Math.random() * 2) - 1);
      }
      break;
    case 'aggressive':
      // Aggressive: often overbid
      if (bid === 0) {
        tricks = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * 3) + 1;
      } else {
        tricks = Math.max(0, bid + Math.floor(Math.random() * 4) - 1);
      }
      break;
    default:
      tricks = Math.max(0, Math.floor(Math.random() * 8));
  }
  
  return Math.min(tricks, bid); // Cap at bid (can't win more than you bid typically)
}

// Note: AI auto-play is now handled immediately within each action handler
// No need for separate processAIBids or processAITricks functions

// Join game
app.post('/api/join', (req, res) => {
  const { code, playerName } = req.body;
  
  if (!code || !playerName || !playerName.trim()) {
    return res.status(400).json({ error: 'Code and player name are required' });
  }

  const game = loadGameFromFile(code.toUpperCase());
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (game.status !== 'lobby') {
    return res.status(400).json({ error: 'Game already in progress' });
  }

  // Check against the game's configured max players
  const maxPlayers = parseInt(game.maxPlayers) || 4;
  if (Object.keys(game.players).length >= maxPlayers) {
    return res.status(400).json({ error: `Game is full (${maxPlayers} players maximum)` });
  }

  const playerId = generatePlayerId();
  const isAutoMode = playerName.trim().toLowerCase() === 'auto';
  
  // Determine team assignment based on game mode
  const team = game.teamConfig?.gameMode === 'teams' ? assignPlayerToTeam(game.players) : null;
  
  // Add the human player
  game.players[playerId] = {
    id: playerId,
    name: isAutoMode ? 'Human Player' : playerName.trim(),
    team,
    isHost: false,
    joinedAt: Date.now(),
    isComputer: false
  };

  // If auto mode, add computer players to fill the game
  if (isAutoMode) {
    const computerPlayers = generateComputerPlayers();
    const remainingSlots = 4 - Object.keys(game.players).length;
    
    for (let i = 0; i < Math.min(remainingSlots, computerPlayers.length); i++) {
      const computerPlayerId = generatePlayerId();
      // Use same team assignment logic as human players
      const computerTeam = game.teamConfig?.gameMode === 'teams' ? assignPlayerToTeam(game.players) : null;
      
      game.players[computerPlayerId] = {
        id: computerPlayerId,
        name: computerPlayers[i].name,
        team: computerTeam,
        isHost: false,
        joinedAt: Date.now(),
        isComputer: true,
        personality: computerPlayers[i].personality
      };
    }
    
    // Auto-start the game if we have 4 players
    if (Object.keys(game.players).length === 4) {
      game.status = 'bidding';
      game.state = 'bidding';
      game.currentRound = 1;
      game.rounds.push({
        round: 1,
        bids: {},
        tricks: {},
        scores: {},
        status: 'bidding'
      });
    }
  }

  game.lastActivity = Date.now();

  // Save updated game
  saveGameToFile(game.id, game);
  
  // Save player session
  savePlayerSession(playerId, { gameId: code.toUpperCase(), playerId });
  
  res.json({ 
    playerId, 
    game,
    autoMode: isAutoMode,
    message: isAutoMode ? 'Auto mode activated! Computer players added.' : null
  });
});

// Get game state
app.get('/api/game/:gameId', (req, res) => {
  const game = loadGameFromFile(req.params.gameId.toUpperCase());
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  // Migrate existing games: populate roundScores from completed rounds
  if (!game.roundScores) {
    game.roundScores = {};
  }
  
  // Check if any completed rounds are missing from roundScores
  let migrated = false;
  game.rounds.forEach((round, index) => {
    const roundNumber = index + 1;
    if (round.status === 'completed' && round.scores && Object.keys(round.scores).length > 0) {
      if (!game.roundScores[roundNumber]) {
        game.roundScores[roundNumber] = { ...round.scores };
        console.log(`📊 Migrated round ${roundNumber} scores to roundScores`);
        migrated = true;
      }
    }
  });

  // Migrate existing auto-games to individual mode
  const isAutoGame = game.title === 'Auto Game' || game.hostName === 'Human Player';
  if (isAutoGame && game.teamConfig?.gameMode === 'teams') {
    console.log(`🔄 Migrating auto-game ${game.id} to individual mode`);
    
    // Update game mode to individual
    game.teamConfig.gameMode = 'individual';
    
    // Set all players to no team
    Object.keys(game.players).forEach(playerId => {
      game.players[playerId].team = null;
    });
    
    // Clear team scores and use empty object for individual mode
    game.scores = {};
    
    console.log(`✅ Auto-game ${game.id} migrated to individual mode`);
    migrated = true;
  }
  
  // Save the migrated game if we made changes
  if (migrated) {
    saveGameToFile(game.id, game);
  }
  
  res.json({ game });
});

// Game actions
app.post('/api/action', (req, res) => {
  const { gameId, playerId, action, data } = req.body;
  
  const game = loadGameFromFile(gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const player = game.players[playerId];
  if (!player) {
    return res.status(400).json({ error: 'Player not in game' });
  }

  switch (action) {
    case 'startGame':
      if (!player.isHost) {
        return res.status(403).json({ error: 'Only host can start game' });
      }
      if (Object.keys(game.players).length < 2) {
        return res.status(400).json({ error: 'Need at least 2 players' });
      }
      game.status = 'bidding';
      game.state = 'bidding';
      game.currentRound = 1;
      game.rounds.push({
        round: 1,
        bids: {},
        tricks: {},
        scores: {},
        status: 'bidding'
      });
      
      console.log(`🎮 Game started! Round ${game.currentRound} - Bidding phase`);
      
      // Immediately process AI bids when game starts
      const aiPlayersForStart = Object.entries(game.players).filter(([pid, player]) => 
        player.isComputer && game.rounds[game.currentRound - 1].bids[pid] === undefined
      );
      
      // Submit bids for AI players immediately
      aiPlayersForStart.forEach(([pid, player]) => {
        const aiBid = generateAIBid(player.personality, game.currentRound);
        game.rounds[game.currentRound - 1].bids[pid] = aiBid;
        console.log(`🤖 ${player.name} (${player.personality}) bids ${aiBid} tricks`);
      });
      
      // Check if all players have bid after processing AI bids
      const allPlayersHaveBidStart = Object.keys(game.players).every(pid => 
        game.rounds[game.currentRound - 1].bids[pid] !== undefined
      );
      
      if (allPlayersHaveBidStart) {
        game.rounds[game.currentRound - 1].status = 'playing';
        game.status = 'playing';
        game.state = 'playing';
        console.log(`🎯 All players have bid! Moving to trick tracking phase.`);
      }
      break;

    case 'submitBid':
      const { bid } = data;
      if (game.status !== 'bidding') {
        return res.status(400).json({ error: 'Not in bidding phase' });
      }
      if (bid < 0 || bid > game.currentRound) {
        return res.status(400).json({ error: `Invalid bid. Must be between 0 and ${game.currentRound}` });
      }
      
      const currentRound = game.rounds[game.currentRound - 1];
      currentRound.bids[playerId] = bid;
      
      console.log(`👤 ${game.players[playerId].name} bids ${bid} tricks`);
      
      // Immediately process AI bids after human player bids
      const aiPlayers = Object.entries(game.players).filter(([pid, player]) => 
        player.isComputer && currentRound.bids[pid] === undefined
      );
      
      // Submit bids for AI players immediately
      aiPlayers.forEach(([pid, player]) => {
        const aiBid = generateAIBid(player.personality, game.currentRound);
        currentRound.bids[pid] = aiBid;
        console.log(`🤖 ${player.name} (${player.personality}) bids ${aiBid} tricks`);
      });
      
      // Check if all players have bid after processing AI bids
      const allPlayersHaveBid = Object.keys(game.players).every(pid => 
        currentRound.bids[pid] !== undefined
      );
      
      if (allPlayersHaveBid) {
        currentRound.status = 'playing';
        game.status = 'playing';
        game.state = 'playing';
        console.log(`🎯 All players have bid! Moving to trick tracking phase.`);
      }
      break;

    case 'submitTricks':
      const { tricks } = data;
      if (game.status !== 'playing') {
        return res.status(400).json({ error: 'Not in playing phase' });
      }
      
      const round = game.rounds[game.currentRound - 1];
      const totalPlayers = Object.keys(game.players).length;
      const maxTricksPerRound = game.currentRound; // Progressive rounds: Round 1 = 1 trick, Round 2 = 2 tricks, etc.
      
      // VALIDATION: Check if tricks exceed individual limit
      if (tricks < 0 || tricks > maxTricksPerRound) {
        return res.status(400).json({ 
          error: `Tricks must be between 0 and ${maxTricksPerRound}`,
          validation: 'individual_limit'
        });
      }
      
      // Note: We allow players to submit any valid tricks (0 to maxTricksPerRound)
      // Host will review and fix any conflicts in the trick review phase
      
      // Accept the tricks submission
      round.tricks[playerId] = tricks;
      
      console.log(`👤 ${game.players[playerId].name} got ${tricks} tricks (bid: ${round.bids[playerId]})`);
      
      // Immediately process AI tricks after human player submits tricks
      const aiPlayersForTricks = Object.entries(game.players).filter(([pid, player]) => 
        player.isComputer && round.tricks[pid] === undefined
      );
      
      console.log(`🔍 AI Players to process tricks: ${aiPlayersForTricks.length}`);
      console.log(`🔍 Current tricks state: ${JSON.stringify(round.tricks)}`);
      aiPlayersForTricks.forEach(([pid, player]) => {
        console.log(`   - ${player.name} (${pid}): isComputer=${player.isComputer}, hasTricks=${round.tricks[pid] !== undefined}`);
      });
      
      // Submit tricks for AI players immediately with validation
      for (let i = 0; i < aiPlayersForTricks.length; i++) {
        const [pid, player] = aiPlayersForTricks[i];
        const bid = round.bids[pid];
        
        // Calculate current total AFTER previous AI players have been processed
        const currentTotal = Object.values(round.tricks).reduce((sum, t) => sum + t, 0);
        const remainingTricks = maxTricksPerRound - currentTotal;
        
        // Check if this is the last AI player
        const isLastAIPlayer = i === aiPlayersForTricks.length - 1;
        
        let aiTricks;
        if (isLastAIPlayer) {
          // Last AI player gets exactly the remaining tricks
          aiTricks = remainingTricks;
          console.log(`🤖 ${player.name} (last AI player) gets remaining ${aiTricks} tricks (total was ${currentTotal})`);
        } else {
          // Generate AI tricks but ensure total doesn't exceed limit
          const rawAITricks = generateAITricks(player.personality, bid);
          aiTricks = Math.min(rawAITricks, remainingTricks);
          console.log(`🤖 ${player.name} generated ${rawAITricks}, capped at ${aiTricks} (${remainingTricks} remaining, total was ${currentTotal})`);
        }
        
        // Assign tricks and log
        round.tricks[pid] = aiTricks;
        console.log(`🤖 ${player.name} (${player.personality}) got ${aiTricks} tricks (bid: ${bid})`);
        
        // Log running total for debugging
        const newTotal = Object.values(round.tricks).reduce((sum, t) => sum + t, 0);
        console.log(`   Running total after ${player.name}: ${newTotal}`);
      }
      
      // Check if all players have submitted tricks after processing AI tricks
      const allPlayersHaveTricks = Object.keys(game.players).every(pid => 
        round.tricks[pid] !== undefined
      );
      
      if (allPlayersHaveTricks) {
        // Always move to trick review phase - host will verify and fix any issues
        const finalTotal = Object.values(round.tricks).reduce((sum, t) => sum + t, 0);
        
        // Move to trick review phase for host approval
        round.status = 'review';
        game.status = 'trick_review';
        game.state = 'trick_review';
        console.log(`🔍 All players have submitted tricks! Moving to review phase. Total: ${finalTotal} tricks (Required: ${maxTricksPerRound})`);
      }
      break;

    case 'editPlayerTricks':
      if (!player.isHost) {
        return res.status(403).json({ error: 'Only host can edit tricks' });
      }
      if (game.status !== 'trick_review') {
        return res.status(400).json({ error: 'Not in trick review phase' });
      }
      
      const { targetPlayerId, newTricks } = data;
      const editRound = game.rounds[game.currentRound - 1];
      const maxTricksForEdit = game.currentRound; // Progressive rounds: Round 1 = 1 trick, Round 2 = 2 tricks, etc.
      
      // Validation
      if (newTricks < 0 || newTricks > maxTricksForEdit) {
        return res.status(400).json({ error: `Tricks must be between 0 and ${maxTricksForEdit}` });
      }
      
      // Allow host to edit any player's tricks - they will validate the total before approval
      
      editRound.tricks[targetPlayerId] = newTricks;
      console.log(`🔧 Host edited ${game.players[targetPlayerId].name}'s tricks to ${newTricks}`);
      break;

    case 'approveTricks':
      if (!player.isHost) {
        return res.status(403).json({ error: 'Only host can approve tricks' });
      }
      if (game.status !== 'trick_review') {
        return res.status(400).json({ error: 'Not in trick review phase' });
      }
      
      const approveRound = game.rounds[game.currentRound - 1];
      const requiredTricks = game.currentRound; // Progressive rounds: Round 1 = 1 trick, Round 2 = 2 tricks, etc.
      
      // Final validation before approval
      const approveTotal = Object.values(approveRound.tricks).reduce((sum, t) => sum + t, 0);
      if (approveTotal !== requiredTricks) {
        return res.status(400).json({ 
          error: `Total tricks must equal ${requiredTricks}. Current total: ${approveTotal}`,
          validation: 'total_not_correct'
        });
      }
      
      // Calculate scores
      Object.keys(game.players).forEach(pid => {
        const playerBid = approveRound.bids[pid];
        const playerTricks = approveRound.tricks[pid];
        approveRound.scores[pid] = calculateScore(playerBid, playerTricks);
      });
      
      // Update team scores
      Object.entries(approveRound.scores).forEach(([pid, score]) => {
        const playerTeam = game.players[pid].team;
        game.scores[playerTeam] += score;
      });
      
      approveRound.status = 'completed';
      game.status = 'scoring';
      game.state = 'scoring';
      console.log(`✅ Host approved tricks! Round ${game.currentRound} complete. Total: ${approveTotal} tricks`);
      break;

    case 'startTrickTracking':
      if (!player.isHost) {
        return res.status(403).json({ error: 'Only host can start trick tracking' });
      }
      if (game.status !== 'bidding') {
        return res.status(400).json({ error: 'Not in bidding phase' });
      }
      
      const currentRoundForTracking = game.rounds[game.currentRound - 1];
      
      // Check if all players have bid
      const allHaveBid = Object.keys(game.players).every(pid => 
        currentRoundForTracking.bids[pid] !== undefined
      );
      
      if (!allHaveBid) {
        return res.status(400).json({ error: 'All players must bid first' });
      }
      
      currentRoundForTracking.status = 'playing';
      game.status = 'playing';
      game.state = 'playing';
      
      console.log(`🎯 Trick tracking started for Round ${game.currentRound}`);
      
      // Immediately process AI tricks when trick tracking starts
      const aiPlayersForTrickTracking = Object.entries(game.players).filter(([pid, player]) => 
        player.isComputer && currentRoundForTracking.tricks[pid] === undefined
      );
      
      // Submit tricks for AI players immediately with validation
      let remainingTricksForTracking = game.currentRound;
      aiPlayersForTrickTracking.forEach(([pid, player], index) => {
        const bid = currentRoundForTracking.bids[pid];
        const isLastAIPlayer = index === aiPlayersForTrickTracking.length - 1;
        
        let aiTricks;
        if (isLastAIPlayer) {
          // Last AI player gets exactly the remaining tricks
          aiTricks = remainingTricksForTracking;
        } else {
          // Generate AI tricks but ensure total doesn't exceed limit
          const rawAITricks = generateAITricks(player.personality, bid);
          aiTricks = Math.min(rawAITricks, remainingTricksForTracking);
          remainingTricksForTracking -= aiTricks;
        }
        
        currentRoundForTracking.tricks[pid] = aiTricks;
        console.log(`🤖 ${player.name} (${player.personality}) got ${aiTricks} tricks (bid: ${bid})`);
      });
      
      // Check if all players have submitted tricks after processing AI tricks
      const allPlayersHaveTricksTrack = Object.keys(game.players).every(pid => 
        currentRoundForTracking.tricks[pid] !== undefined
      );
      
      if (allPlayersHaveTricksTrack) {
        // Move to trick review phase for host approval (don't auto-complete)
        const finalTotalTrack = Object.values(currentRoundForTracking.tricks).reduce((sum, t) => sum + t, 0);
        
        // Move to trick review phase instead of auto-completing
        currentRoundForTracking.status = 'review';
        game.status = 'trick_review';
        game.state = 'trick_review';
        console.log(`🔍 All players have submitted tricks! Moving to review phase. Total: ${finalTotalTrack} tricks (Required: ${game.currentRound})`);
      }
      break;

    case 'completeRound':
      if (!player.isHost) {
        return res.status(403).json({ error: 'Only host can complete round' });
      }
      if (game.status !== 'playing') {
        return res.status(400).json({ error: 'Not in playing phase' });
      }
      
      const roundToComplete = game.rounds[game.currentRound - 1];
      
      // Check if all players have submitted tricks
      const allHaveTricks = Object.keys(game.players).every(pid => 
        roundToComplete.tricks[pid] !== undefined
      );
      
      if (!allHaveTricks) {
        return res.status(400).json({ error: 'All players must submit tricks first' });
      }
      
      // Calculate scores if not already done
      if (Object.keys(roundToComplete.scores).length === 0) {
        Object.keys(game.players).forEach(pid => {
          const playerBid = roundToComplete.bids[pid];
          const playerTricks = roundToComplete.tricks[pid];
          roundToComplete.scores[pid] = calculateScore(playerBid, playerTricks);
        });
        
        // Update team scores - support variable team configurations
        Object.entries(roundToComplete.scores).forEach(([pid, score]) => {
          const playerTeam = game.players[pid].team;
          if (!game.scores[playerTeam]) {
            game.scores[playerTeam] = 0;
          }
          game.scores[playerTeam] += score;
        });

        // Store individual round scores for overall score tracking
        if (!game.roundScores) {
          game.roundScores = {};
        }
        if (!game.roundScores[game.currentRound]) {
          game.roundScores[game.currentRound] = {};
        }
        game.roundScores[game.currentRound] = { ...roundToComplete.scores };
      }
      
      roundToComplete.status = 'completed';
      game.status = 'scoring';
      game.state = 'scoring';
      break;

    case 'nextRound':
      if (!player.isHost) {
        return res.status(403).json({ error: 'Only host can advance round' });
      }
      if (game.currentRound >= game.maxRounds) {
        game.status = 'completed';
        game.state = 'completed';
        console.log(`🏆 Game completed! Final scores - Red: ${game.scores.red}, Blue: ${game.scores.blue}`);
      } else {
        game.currentRound++;
        game.rounds.push({
          round: game.currentRound,
          bids: {},
          tricks: {},
          scores: {},
          status: 'bidding'
        });
        game.status = 'bidding';
        game.state = 'bidding';
        
        console.log(`🎮 Starting Round ${game.currentRound} - Bidding phase`);
        
        // Immediately process AI bids for new round
        const aiPlayersForNewRound = Object.entries(game.players).filter(([pid, player]) => 
          player.isComputer && game.rounds[game.currentRound - 1].bids[pid] === undefined
        );
        
        // Submit bids for AI players immediately
        aiPlayersForNewRound.forEach(([pid, player]) => {
          const aiBid = generateAIBid(player.personality, game.currentRound);
          game.rounds[game.currentRound - 1].bids[pid] = aiBid;
          console.log(`🤖 ${player.name} (${player.personality}) bids ${aiBid} tricks`);
        });
        
        // Check if all players have bid after processing AI bids
        const allPlayersHaveBidNewRound = Object.keys(game.players).every(pid => 
          game.rounds[game.currentRound - 1].bids[pid] !== undefined
        );
        
        if (allPlayersHaveBidNewRound) {
          game.rounds[game.currentRound - 1].status = 'playing';
          game.status = 'playing';
          game.state = 'playing';
          console.log(`🎯 All players have bid! Moving to trick tracking phase.`);
        }
      }
      break;

    case 'deleteGame':
      if (!player.isHost) {
        return res.status(403).json({ error: 'Only host can delete game' });
      }
      
      // Delete all player sessions for this game
      Object.keys(game.players).forEach(pid => {
        deletePlayerSession(pid);
      });
      
      // Delete the game file
      deleteGameFile(game.id);
      
      return res.json({ success: true, gameDeleted: true });
      break;

    case 'leaveGame':
      // Remove player from game
      delete game.players[playerId];
      
      // Delete player session
      deletePlayerSession(playerId);
      
      // If the host left, make someone else host or delete game if empty
      if (player.isHost) {
        const remainingPlayerIds = Object.keys(game.players);
        if (remainingPlayerIds.length > 0) {
          // Make the first remaining player the host
          game.players[remainingPlayerIds[0]].isHost = true;
          game.hostId = remainingPlayerIds[0];
          game.hostName = game.players[remainingPlayerIds[0]].name;
        } else {
          // No players left, delete the game
          deleteGameFile(game.id);
          return res.json({ success: true, gameDeleted: true });
        }
      }
      
      // If game is in lobby and too few players, keep it in lobby
      if (game.status === 'lobby' || Object.keys(game.players).length < 2) {
        game.status = 'lobby';
        game.state = 'lobby';
      }
      
      break;

    case 'cancelGame':
      if (!player.isHost) {
        return res.status(403).json({ error: 'Only host can cancel the game' });
      }
      
      // Send cancellation message to all players (in a real app, this would be via websockets)
      // For now, we'll just delete the game and let polling detect it
      console.log(`🚫 Host ${player.name} cancelled game ${game.id} - ${game.title}`);
      
      // Delete all player sessions for this game first
      Object.keys(game.players).forEach(pid => {
        deletePlayerSession(pid);
        console.log(`🔄 Cleared session for player ${game.players[pid].name}`);
      });
      
      // Delete the game file
      deleteGameFile(game.id);
      
      return res.json({ 
        success: true, 
        gameDeleted: true, 
        message: 'Game has been cancelled by the host. All players have been notified.' 
      });
      break;

    default:
      return res.status(400).json({ error: 'Unknown action' });
  }

  // Migrate existing games: populate roundScores from completed rounds
  if (!game.roundScores) {
    game.roundScores = {};
  }
  
  // Check if any completed rounds are missing from roundScores
  let migrated = false;
  game.rounds.forEach((round, index) => {
    const roundNumber = index + 1;
    if (round.status === 'completed' && round.scores && Object.keys(round.scores).length > 0) {
      if (!game.roundScores[roundNumber]) {
        game.roundScores[roundNumber] = { ...round.scores };
        console.log(`📊 Migrated round ${roundNumber} scores to roundScores`);
        migrated = true;
      }
    }
  });

  // Migrate existing auto-games to individual mode
  const isAutoGame = game.title === 'Auto Game' || game.hostName === 'Human Player';
  if (isAutoGame && game.teamConfig?.gameMode === 'teams') {
    console.log(`🔄 Migrating auto-game ${game.id} to individual mode`);
    
    // Update game mode to individual
    game.teamConfig.gameMode = 'individual';
    
    // Set all players to no team
    Object.keys(game.players).forEach(playerId => {
      game.players[playerId].team = null;
    });
    
    // Clear team scores and use empty object for individual mode
    game.scores = {};
    
    console.log(`✅ Auto-game ${game.id} migrated to individual mode`);
    migrated = true;
  }

  // Update last activity and save game
  game.lastActivity = Date.now();
  saveGameToFile(game.id, game);
  
  // Save again if we made migration changes
  if (migrated) {
    saveGameToFile(game.id, game);
  }
  
  res.json({ success: true, game });
});

// Player Profile Management Functions
function createPlayerProfile(playerName) {
  const playerId = generatePlayerId();
  const profile = {
    playerId,
    name: playerName,
    createdAt: Date.now(),
    lastLogin: Date.now(),
    loginCount: 1,
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      totalBids: 0,
      bidsMade: 0,
      bidAccuracy: 0
    },
    preferences: {
      favoriteTeamName: '',
      preferredGameMode: 'teams',
      notifications: true
    }
  };
  
  savePlayerProfile(playerName, profile);
  return profile;
}

function savePlayerProfile(playerName, profileData) {
  const filePath = path.join(PLAYER_PROFILES_DIR, `${playerName.toLowerCase()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(profileData, null, 2));
  console.log(`Player profile ${playerName} saved`);
}

function loadPlayerProfile(playerName) {
  const filePath = path.join(PLAYER_PROFILES_DIR, `${playerName.toLowerCase()}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading player profile ${playerName}:`, error);
    return null;
  }
}

function updatePlayerProfile(playerName, updates) {
  const profile = loadPlayerProfile(playerName);
  if (profile) {
    Object.assign(profile, updates);
    profile.lastLogin = Date.now();
    savePlayerProfile(playerName, profile);
    return profile;
  }
  return null;
}

function findPlayerActiveGames(playerName) {
  const profile = loadPlayerProfile(playerName);
  if (!profile) return [];
  
  const activeGames = [];
  const gameIds = getAllGameFiles();
  
  gameIds.forEach(gameId => {
    const game = loadGameFromFile(gameId);
    if (game) {
      // Check if player is in this game
      const playerInGame = Object.values(game.players).find(p => 
        p.name.toLowerCase() === playerName.toLowerCase()
      );
      
      if (playerInGame && game.status !== 'completed') {
        activeGames.push({
          gameId: game.id,
          gameCode: game.code,
          title: game.title,
          status: game.status,
          currentRound: game.currentRound,
          totalRounds: game.totalRounds,
          playerCount: Object.keys(game.players).length,
          lastActivity: game.lastActivity,
          playerId: Object.keys(game.players).find(pid => 
            game.players[pid].name.toLowerCase() === playerName.toLowerCase()
          )
        });
      }
    }
  });
  
  // Sort by last activity (most recent first)
  return activeGames.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
}

function saveGameHistory(playerName, gameData) {
  const filePath = path.join(GAME_HISTORY_DIR, `${playerName.toLowerCase()}_history.json`);
  
  let history = { playerId: '', recentGames: [], activeGames: [] };
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      history = JSON.parse(data);
    } catch (error) {
      console.error(`Error loading game history for ${playerName}:`, error);
    }
  }
  
  // Add to recent games
  history.recentGames.unshift(gameData);
  
  // Keep only last 10 games
  if (history.recentGames.length > 10) {
    history.recentGames = history.recentGames.slice(0, 10);
  }
  
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  console.log(`Game history updated for ${playerName}`);
}

function loadGameHistory(playerName) {
  const filePath = path.join(GAME_HISTORY_DIR, `${playerName.toLowerCase()}_history.json`);
  if (!fs.existsSync(filePath)) {
    return { playerId: '', recentGames: [], activeGames: [] };
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading game history for ${playerName}:`, error);
    return { playerId: '', recentGames: [], activeGames: [] };
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Games directory: ${GAMES_DIR}`);
  console.log(`Players directory: ${PLAYERS_DIR}`);
  
  // Run cleanup every hour
  setInterval(cleanupOldGames, 60 * 60 * 1000);
  
  // Backup games every 30 minutes
  setInterval(backupGames, 30 * 60 * 1000);
}); 
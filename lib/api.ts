
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';



// Types
export interface Player {
  id: string;
  name: string;
  team: 'red' | 'blue';
  isHost: boolean;
  joinedAt: number;
  totalScore: number;
  isComputer?: boolean;
  personality?: 'conservative' | 'smart' | 'aggressive';
}

export interface GameRound {
  round: number;
  tricksThisRound: number;
  bids: Record<string, number>;
  tricks: Record<string, number>;
  scores: Record<string, number>;
  status: 'bidding' | 'playing' | 'review' | 'completed';
}

export interface Game {
  id: string;
  code: string;
  hostId: string;
  hostName: string;
  title?: string;
  createdAt: number;
  lastActivity?: number;
  status: 'lobby' | 'bidding' | 'playing' | 'trick_review' | 'scoring' | 'completed';
  state: 'lobby' | 'bidding' | 'playing' | 'trick_review' | 'scoring' | 'completed';
  currentRound: number;
  maxRounds: number;
  totalRounds: number;
  players: Record<string, Player>;
  rounds: GameRound[];
  scores: { red: number; blue: number };
}

export interface CreateGameResponse {
  gameId: string;
  code: string;
  playerId: string;
  game: Game;
}

export interface JoinGameResponse {
  playerId: string;
  game: Game;
  autoMode?: boolean;
  message?: string;
}

export interface GameStateResponse {
  game: Game;
}

export interface ActionResponse {
  success: boolean;
  game: Game;
}

// API Error class
export class APIError extends Error {
  constructor(public status: number, message: string, public errorData?: any) {
    super(message);
    this.name = 'APIError';
    // Copy all error data fields to the error object
    if (errorData) {
      Object.assign(this, errorData);
    }
  }
}

// Base API functions
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(response.status, errorData.error || 'Request failed', errorData);
  }

  return response.json();
}

// Game API functions
export const gameAPI = {
  // Create a new game
  async createGame(gameConfig: any): Promise<CreateGameResponse> {
    return apiRequest<CreateGameResponse>('/api/create', {
      method: 'POST',
      body: JSON.stringify(gameConfig),
    });
  },

  // Join an existing game
  async joinGame(code: string, playerName: string): Promise<JoinGameResponse> {
    return apiRequest<JoinGameResponse>('/api/join', {
      method: 'POST',
      body: JSON.stringify({ code, playerName }),
    });
  },

  // Get current game state
  async getGameState(gameId: string): Promise<GameStateResponse> {
    return apiRequest<GameStateResponse>(`/api/game/${gameId}`);
  },

  // Game actions
  async startGame(gameId: string, playerId: string): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'startGame',
      }),
    });
  },

  async submitBid(gameId: string, playerId: string, bid: number): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'submitBid',
        data: { bid },
      }),
    });
  },

  async submitTricks(gameId: string, playerId: string, tricks: number): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'submitTricks',
        data: { tricks },
      }),
    });
  },

  async nextRound(gameId: string, playerId: string): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'nextRound',
      }),
    });
  },

  async startTrickTracking(gameId: string, playerId: string): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'startTrickTracking',
      }),
    });
  },

  async completeRound(gameId: string, playerId: string): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'completeRound',
      }),
    });
  },

  async leaveGame(gameId: string, playerId: string): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'leaveGame',
      }),
    });
  },

  async deleteGame(gameId: string, playerId: string): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'deleteGame',
      }),
    });
  },

  async cancelGame(gameId: string, playerId: string): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'cancelGame',
      }),
    });
  },

  async editPlayerTricks(gameId: string, playerId: string, targetPlayerId: string, newTricks: number): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'editPlayerTricks',
        data: { targetPlayerId, newTricks },
      }),
    });
  },

  async approveTricks(gameId: string, playerId: string): Promise<ActionResponse> {
    return apiRequest<ActionResponse>('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerId,
        action: 'approveTricks',
      }),
    });
  },

  // Alias for getGameState to match what game-screen.tsx expects
  async getGame(gameId: string): Promise<GameStateResponse> {
    return this.getGameState(gameId);
  },
};

// Smart polling system
export class GamePoller {
  private intervalId: NodeJS.Timeout | null = null;
  private currentInterval: number = 3000;
  private callbacks: ((game: Game) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];

  // Dynamic polling intervals based on game phase
  private getPollingInterval(gameStatus: string): number {
    switch (gameStatus) {
      case 'lobby':
        return 3000;
      case 'bidding':
        return 1000;
      case 'playing':
        return 1000;
      case 'scoring':
        return 2000;
      case 'completed':
        return 5000;
      default:
        return 3000;
    }
  }

  // Start polling for game updates
  startPolling(gameId: string, initialStatus: string = 'lobby') {
    this.stopPolling();
    
    this.currentInterval = this.getPollingInterval(initialStatus);
    
    const poll = async () => {
      try {
        const response = await gameAPI.getGameState(gameId);
        const game = response.game;
        
        // Update polling interval based on current game status
        const newInterval = this.getPollingInterval(game.status);
        if (newInterval !== this.currentInterval) {
          this.currentInterval = newInterval;
          this.startPolling(gameId, game.status);
          return;
        }
        
        // Notify all callbacks
        this.callbacks.forEach(callback => callback(game));
        
      } catch (error) {
        console.error('Polling error:', error);
        // Notify error callbacks
        this.errorCallbacks.forEach(callback => callback(error as Error));
        // Continue polling even on error, but maybe with longer interval
        this.currentInterval = Math.min(this.currentInterval * 1.5, 10000);
      }
    };

    // Initial poll
    poll();
    
    // Set up interval
    this.intervalId = setInterval(poll, this.currentInterval);
  }

  // Stop polling
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Add callback for game updates
  onGameUpdate(callback: (game: Game) => void) {
    this.callbacks.push(callback);
  }

  // Add callback for errors
  onError(callback: (error: Error) => void) {
    this.errorCallbacks.push(callback);
  }

  // Remove callback
  removeGameUpdate(callback: (game: Game) => void) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  // Remove error callback
  removeError(callback: (error: Error) => void) {
    this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
  }

  // Clear all callbacks
  clearCallbacks() {
    this.callbacks = [];
    this.errorCallbacks = [];
  }
}

// Utility functions
export const gameUtils = {
  // Get team members
  getTeamMembers(game: Game, team: 'red' | 'blue'): Player[] {
    return Object.values(game.players).filter(player => player.team === team);
  },

  // Get current round data
  getCurrentRound(game: Game): GameRound | null {
    if (game.currentRound === 0) return null;
    return game.rounds[game.currentRound - 1] || null;
  },

  // Check if player has submitted bid
  hasPlayerBid(game: Game, playerId: string): boolean {
    const round = this.getCurrentRound(game);
    return round ? playerId in round.bids : false;
  },

  // Check if player has submitted tricks
  hasPlayerTricks(game: Game, playerId: string): boolean {
    const round = this.getCurrentRound(game);
    return round ? playerId in round.tricks : false;
  },

  // Get team score for current round
  getTeamRoundScore(game: Game, team: 'red' | 'blue'): number {
    const round = this.getCurrentRound(game);
    if (!round) return 0;
    
    return Object.entries(game.players)
      .filter(([_, player]) => player.team === team)
      .reduce((total, [playerId, _]) => {
        return total + (round.scores[playerId] || 0);
      }, 0);
  },

  // Get winning team
  getWinningTeam(game: Game): 'red' | 'blue' | 'tie' | null {
    if (game.status !== 'completed') return null;
    
    if (game.scores.red > game.scores.blue) return 'red';
    if (game.scores.blue > game.scores.red) return 'blue';
    return 'tie';
  },

  // Format game code for display
  formatGameCode(code: string): string {
    return code.toUpperCase().split('').join(' ');
  },
};

// Enhanced session storage with robust error handling and fallback mechanisms
export const sessionStorage = {
  // Save player session with multiple storage strategies
  savePlayerSession(gameId: string, playerId: string, playerName: string) {
    const session = {
      gameId,
      playerId,
      playerName,
      timestamp: Date.now(),
    };
    
    console.log('🔐 Saving session:', session);
    
    // Strategy 1: Try localStorage
    try {
      localStorage.setItem('spadeSync_session', JSON.stringify(session));
      console.log('✅ Session saved to localStorage');
    } catch (error) {
      console.warn('⚠️ localStorage save failed:', error);
    }
    
    // Strategy 2: Try sessionStorage as fallback
    try {
      window.sessionStorage.setItem('spadeSync_session', JSON.stringify(session));
      console.log('✅ Session saved to sessionStorage');
    } catch (error) {
      console.warn('⚠️ sessionStorage save failed:', error);
    }
    
    // Strategy 3: Save to URL parameters as additional fallback
    try {
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('sid', btoa(JSON.stringify({gameId, playerId, playerName})));
        window.history.replaceState({}, '', url);
        console.log('✅ Session saved to URL params');
      }
    } catch (error) {
      console.warn('⚠️ URL params save failed:', error);
    }
    
    // Strategy 4: Save to a global variable as last resort
    try {
      if (typeof window !== 'undefined') {
        (window as any).spadeSync_session = session;
        console.log('✅ Session saved to global variable');
      }
    } catch (error) {
      console.warn('⚠️ Global variable save failed:', error);
    }
  },

  // Save player name only (for login without game)
  savePlayerName(playerName: string) {
    const existingSession = this.getPlayerSession();
    const session = {
      gameId: existingSession?.gameId || '',
      playerId: existingSession?.playerId || '',
      playerName,
      timestamp: Date.now(),
    };
    
    console.log('🔐 Saving player name:', playerName);
    
    // Use same multi-strategy approach
    try {
      localStorage.setItem('spadeSync_session', JSON.stringify(session));
    } catch (error) {
      console.warn('⚠️ localStorage save failed for player name:', error);
    }
    
    try {
      window.sessionStorage.setItem('spadeSync_session', JSON.stringify(session));
    } catch (error) {
      console.warn('⚠️ sessionStorage save failed for player name:', error);
    }
  },

  // Get player session with multiple retrieval strategies
  getPlayerSession(): { gameId: string; playerId: string; playerName: string } | null {
    console.log('🔍 Retrieving session...');
    
    // Strategy 1: Try localStorage first
    try {
      const session = localStorage.getItem('spadeSync_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
          console.log('✅ Session found in localStorage:', parsed);
          return parsed;
        } else {
          console.log('⏰ Session expired in localStorage');
        }
      }
    } catch (error) {
      console.warn('⚠️ localStorage retrieval failed:', error);
    }
    
    // Strategy 2: Try sessionStorage
    try {
      const session = window.sessionStorage.getItem('spadeSync_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
          console.log('✅ Session found in sessionStorage:', parsed);
          return parsed;
        } else {
          console.log('⏰ Session expired in sessionStorage');
        }
      }
    } catch (error) {
      console.warn('⚠️ sessionStorage retrieval failed:', error);
    }
    
    // Strategy 3: Try URL parameters
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const sessionData = url.searchParams.get('sid');
        if (sessionData) {
          const decoded = JSON.parse(atob(sessionData));
          console.log('✅ Session found in URL params:', decoded);
          return decoded;
        }
      }
    } catch (error) {
      console.warn('⚠️ URL params retrieval failed:', error);
    }
    
    // Strategy 4: Try global variable
    try {
      if (typeof window !== 'undefined' && (window as any).spadeSync_session) {
        const session = (window as any).spadeSync_session;
        if (Date.now() - session.timestamp < 4 * 60 * 60 * 1000) {
          console.log('✅ Session found in global variable:', session);
          return session;
        } else {
          console.log('⏰ Session expired in global variable');
        }
      }
    } catch (error) {
      console.warn('⚠️ Global variable retrieval failed:', error);
    }
    
    console.log('❌ No valid session found');
    return null;
  },

  // Clear player session from all locations
  clearPlayerSession() {
    console.log('🗑️ Clearing session from all locations...');
    
    // Clear localStorage
    try {
      localStorage.removeItem('spadeSync_session');
      console.log('✅ Session cleared from localStorage');
    } catch (error) {
      console.warn('⚠️ localStorage clear failed:', error);
    }
    
    // Clear sessionStorage
    try {
      window.sessionStorage.removeItem('spadeSync_session');
      console.log('✅ Session cleared from sessionStorage');
    } catch (error) {
      console.warn('⚠️ sessionStorage clear failed:', error);
    }
    
    // Clear URL parameters
    try {
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('sid');
        window.history.replaceState({}, '', url);
        console.log('✅ Session cleared from URL params');
      }
    } catch (error) {
      console.warn('⚠️ URL params clear failed:', error);
    }
    
    // Clear global variable
    try {
      if (typeof window !== 'undefined') {
        delete (window as any).spadeSync_session;
        console.log('✅ Session cleared from global variable');
      }
    } catch (error) {
      console.warn('⚠️ Global variable clear failed:', error);
    }
  },
};

// Health check
export async function healthCheck(): Promise<{ status: string; activeGames: number; uptime: number }> {
  return apiRequest('/health');
} 

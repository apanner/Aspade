
// Session Management Patch for basePath compatibility
// This file patches the frontend to handle session management with basePath

(function() {
  console.log('🔧 Loading session management patch...');
  
  // Enhanced localStorage wrapper that handles basePath
  const sessionStoragePatched = {
    savePlayerSession: function(gameId, playerId, playerName) {
      const session = {
        gameId,
        playerId, 
        playerName,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem('spadeSync_session', JSON.stringify(session));
        // Also save to URL params as backup
        if (window.history && window.history.replaceState) {
          const url = new URL(window.location);
          url.searchParams.set('sid', btoa(JSON.stringify({gameId, playerId, playerName})));
          window.history.replaceState({}, '', url);
        }
        console.log('✅ Session saved:', session);
      } catch (e) {
        console.warn('⚠️ localStorage not available, session saved to URL only');
      }
    },
    
    savePlayerName: function(playerName) {
      const existingSession = this.getPlayerSession();
      const session = {
        gameId: existingSession?.gameId || '',
        playerId: existingSession?.playerId || '',
        playerName,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem('spadeSync_session', JSON.stringify(session));
        console.log('✅ Player name saved:', playerName);
      } catch (e) {
        console.warn('⚠️ localStorage not available for player name');
      }
    },
    
    getPlayerSession: function() {
      try {
        // Try localStorage first
        const session = localStorage.getItem('spadeSync_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
            console.log('✅ Session found in localStorage:', parsed);
            return parsed;
          }
        }
      } catch (e) {
        console.warn('⚠️ localStorage not accessible');
      }
      
      // Fallback to URL params
      try {
        const url = new URL(window.location);
        const sessionData = url.searchParams.get('sid');
        if (sessionData) {
          const decoded = JSON.parse(atob(sessionData));
          console.log('✅ Session found in URL:', decoded);
          return decoded;
        }
      } catch (e) {
        console.warn('⚠️ URL session not available');
      }
      
      console.log('❌ No session found');
      return null;
    },
    
    clearPlayerSession: function() {
      try {
        localStorage.removeItem('spadeSync_session');
      } catch (e) {}
      
      try {
        const url = new URL(window.location);
        url.searchParams.delete('sid');
        window.history.replaceState({}, '', url);
      } catch (e) {}
      console.log('✅ Session cleared');
    }
  };
  
  // Override window.sessionStorage to use our patched version
  if (typeof window !== 'undefined') {
    window.sessionStoragePatched = sessionStoragePatched;
    
    // Also patch any existing sessionStorage references
    if (window.sessionStorage) {
      Object.keys(sessionStoragePatched).forEach(key => {
        window.sessionStorage[key] = sessionStoragePatched[key];
      });
    }
  }
  
  // Override global sessionStorage if it exists
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStoragePatched).forEach(key => {
      sessionStorage[key] = sessionStoragePatched[key];
    });
  }
  
  console.log('🔧 Session management patch loaded and applied');
})();

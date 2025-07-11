# Spade Card Game - Project Summary

## 🎮 Overview
A fully-featured real-time multiplayer Spade card game built with **Next.js 15** (frontend) and **Express.js** (backend). The application supports both human players and AI computer players, with flexible team configurations for 4-20 players. Features include instant "auto-mode" for testing, comprehensive scoring systems, and a polished casino-inspired UI design.

## 🏗️ Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js 15.2.4 with TypeScript
- **Styling**: TailwindCSS + Shadcn/ui components
- **Port**: 3000
- **State Management**: React hooks with local state
- **Real-time Updates**: Polling-based system (every 2 minutes)

### Backend (Express.js)
- **Framework**: Express.js with Node.js
- **Port**: 3001
- **Storage**: File-based JSON storage (`games.json`, `players.json`)
- **API**: RESTful endpoints with real-time game state management

## 🌟 Key Features

### 1. **Flexible Game Configuration**
- **Player Limits**: Support for 4-20 players per game
- **Game Modes**: Teams (2-6 teams) or Individual (free-for-all)
- **Team Sizes**: 1-10 players per team with auto-assignment or manual selection
- **Auto-Mode**: Instant 4-player individual games with AI for testing

### 2. **Advanced AI System**
- **Three AI Personalities**: Rookie Bot (conservative), Strategic Sam (smart), Aggressive Alice (aggressive)
- **Auto-Play Logic**: AI players automatically submit bids and tricks with no delays
- **Personality-Based Decisions**: Each AI makes unique choices based on their traits
- **Seamless Integration**: AI can fill slots in any game configuration

### 3. **Comprehensive Scoring System**
- **Round-by-Round Tracking**: Complete history of all completed rounds
- **Cumulative Scores**: Running totals with proper team aggregation
- **Team Standings**: "Team Name + Player Names: Total" format for team games
- **Individual Rankings**: Clear player-by-player standings for individual games
- **Migration Support**: Automatic data migration for backward compatibility

### 4. **Real-time Multiplayer**
- **Scalable Architecture**: Support for up to 20 players per game
- **Real-time Synchronization**: Polling-based updates with automatic migration
- **Player Management**: Registration, status tracking, and session management
- **Game Lobbies**: Join/leave functionality with exit confirmation dialogs

### 5. **Admin Panel & Monitoring**
- **Game Management**: View, monitor, and delete active games
- **Player Tracking**: Real-time player status and session monitoring  
- **Data Backup**: Automatic game backup and cleanup systems
- **Development Tools**: Complete oversight for testing and debugging

### 6. **Mobile-First UI Design**
- **Casino-Inspired Theme**: Elegant design with professional styling
- **Responsive Layout**: Optimized for mobile devices and tablets
- **Enhanced UX**: Smooth animations, hover effects, and visual feedback
- **Accessibility**: Clear navigation, status indicators, and user guidance

## 📁 Project Structure

```
lite_spade/
├── components/                 # React components
│   ├── ui/                    # Shadcn/ui components
│   ├── auth-provider.tsx      # Authentication wrapper
│   ├── login-screen.tsx       # Login with auto-detection
│   ├── dashboard.tsx          # Game dashboard
│   ├── game-screen.tsx        # Main game interface
│   ├── game-lobby.tsx         # Pre-game lobby
│   ├── bidding-screen.tsx     # Bidding phase
│   ├── trick-tracking-screen.tsx # Trick playing phase
│   └── [other game components]
├── src/app/                   # Next.js app router
│   ├── api/                   # API route handlers (proxies)
│   │   ├── admin/            # Admin panel endpoints
│   │   ├── create/           # Game creation
│   │   ├── game/[gameId]/    # Game state endpoints
│   │   ├── action/           # Game actions
│   │   └── players/          # Player management
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page (login)
├── hooks/                     # Custom React hooks
├── lib/                       # Utility functions
└── [config files]
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install dependencies**
```bash
git clone [repository-url]
cd lite_spade
npm install
```

2. **Start the backend server**
```bash
# In terminal 1
node server/server.js
# Server runs on http://localhost:3001
```

3. **Start the frontend development server**
```bash
# In terminal 2
npm run dev
# Frontend runs on http://localhost:3000
```

### Environment Setup
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Data files: `games.json` and `players.json` created automatically

## 🔌 API Endpoints

### Backend (Express.js - Port 3001)
```
GET    /api/games                    # List all games
POST   /api/games                    # Create new game
GET    /api/games/:id                # Get game state
POST   /api/games/:id/action         # Perform game action
DELETE /api/games/:id                # Delete game

GET    /api/players                  # List all players
POST   /api/players/register         # Register player
POST   /api/players/status           # Update player status
DELETE /api/players/:id              # Delete player

GET    /api/admin/games              # Admin: List games
DELETE /api/admin/games/:id          # Admin: Delete game
GET    /api/admin/players            # Admin: List players
DELETE /api/admin/players/:id        # Admin: Delete player
```

### Frontend (Next.js API Routes - Port 3000)
```
POST   /api/create                   # Proxy to backend game creation
GET    /api/game/[gameId]            # Proxy to backend game state
POST   /api/action                   # Proxy to backend game actions
GET    /api/admin/games              # Proxy to backend admin games
DELETE /api/admin/games              # Proxy to backend admin games
GET    /api/admin/players            # Proxy to backend admin players
DELETE /api/admin/players            # Proxy to backend admin players
POST   /api/players/register         # Proxy to backend player registration
POST   /api/players/status           # Proxy to backend player status
```

## 🎯 Game Flow

### Regular Game Flow
1. **Login**: Enter player name
2. **Dashboard**: View available games or create new one
3. **Create Game**: Configure teams (2-6 teams), players (4-20), and game rules
4. **Lobby**: Wait for players to join based on your configuration
5. **Game**: Play through bidding and trick-taking phases with real-time scoring

### Auto-Mode Flow (Testing & Single Player)
1. **Login**: Type "auto" as player name
2. **Auto-Creation**: System creates instant 4-player individual game
3. **Direct Redirect**: Skip dashboard, go directly to game screen
4. **Ready to Play**: Game starts immediately with 3 AI players (Rookie Bot, Strategic Sam, Aggressive Alice)
5. **Individual Competition**: No teams - 4 players competing against each other

### Game Configuration Options
- **Game Modes**: Teams (2-6 teams) or Individual (free-for-all)
- **Player Limits**: 4-20 players maximum per game
- **Team Sizes**: 1-10 players per team with auto-assign or manual selection
- **Scoring**: Round-by-round tracking with cumulative totals and team standings
- **AI Integration**: Computer players can fill slots in any game mode

## 🤖 Computer Player System

### Fully Implemented Features ✅
- **Three AI Personalities**: 
  - **Rookie Bot** (Conservative): Low-risk bidding, tries to make exact bids
  - **Strategic Sam** (Smart): Balanced play with reasonable bid strategies
  - **Aggressive Alice** (Aggressive): High-risk bidding with bold play style
- **Auto-Play Logic**: AI players automatically submit bids and tricks immediately
- **Personality-Based Decisions**: Each AI makes different choices based on their traits
- **Visual Indicators**: Clear UI distinction with bot icons and status indicators
- **Seamless Integration**: No delays or waiting - AI responds instantly

### Advanced Features
- **Dynamic Bid Generation**: AI considers round number and personality for bid decisions
- **Trick Calculation**: AI determines trick results based on bid strategy and personality
- **Individual Mode Optimized**: AI players work perfectly in auto-mode individual games
- **Team Mode Compatible**: AI can be assigned to teams in regular multiplayer games

## 🛠️ Development Workflow

### Adding New Features
1. **Backend**: Add endpoints to `server/server.js`
2. **Frontend API**: Create proxy routes in `src/app/api/`
3. **Components**: Add React components in `components/`
4. **UI**: Use Shadcn/ui components for consistent styling

### Testing
- **Auto-Mode**: Use "auto" login for instant 4-player games
- **Manual Testing**: Create games with multiple browser tabs
- **Admin Panel**: Monitor games and players at `/admin`

### File Storage
- **Games**: Stored in `games.json` with automatic backup
- **Players**: Stored in `players.json` with cleanup
- **Data Format**: JSON with proper validation and defaults

## 🎨 UI Components

### Custom Components
- **LoginScreen**: Entry point with auto-detection
- **Dashboard**: Game management interface
- **GameScreen**: Main game interface with multiple phases
- **GameLobby**: Pre-game player waiting area
- **AdminPanel**: Development/monitoring tools

### Shadcn/ui Components
- Cards, Buttons, Forms, Dialogs
- Tables, Badges, Toasts
- Consistent design system throughout

## 🔧 Technical Details

### State Management
- **Game State**: Stored in backend, synchronized via polling
- **Player Status**: Tracked with heartbeat system
- **Real-time Updates**: 2-minute polling interval to prevent overwhelming

### Error Handling
- **Hydration Errors**: Resolved with `suppressHydrationWarning`
- **API Errors**: Proper error responses and user feedback
- **Data Validation**: Input validation on both frontend and backend

### Performance
- **Efficient Polling**: Throttled API calls to prevent spam
- **Data Persistence**: File-based storage with atomic writes
- **Client-Side Rendering**: Optimized for browser compatibility

## 🆕 Recent Updates (January 2025)

### **Auto-Mode Individual vs Team Fix** ✅
- **Fixed**: Auto-mode was creating mixed team assignments (team1/red/blue) instead of individual players
- **Solution**: Auto-mode now uses `gameMode: 'individual'` with all players having `team: null`
- **Migration**: Added automatic conversion of existing auto-games to individual mode
- **Result**: Auto-mode now properly shows 4 individual players competing against each other

### **Total Score Calculation Fix** ✅
- **Fixed**: Total column in leaderboard showing 0 for all players despite completed rounds
- **Solution**: Added dynamic total calculation by summing round scores from `game.roundScores`
- **Enhanced**: Fixed team standings to use calculated player totals
- **Result**: Accurate total scores displayed in both individual and team games

### **Enhanced Team Standings Display** ✅
- **Added**: "Team Name + Player Names: Total" format for team games
- **Improved**: Team standings hidden for individual games (like auto-mode)
- **Enhanced**: Shows team members under team names in both current and overall tabs
- **Result**: Clear distinction between team and individual game displays

### **Player Limits Fix** ✅
- **Fixed**: Server had hard-coded 4-player limit preventing larger games
- **Solution**: Server now respects the game's configured `maxPlayers` (4-20 players)
- **Maintained**: Auto-mode remains fixed at 4 players for consistent testing
- **Result**: Hosts can now create games with up to 20 players as intended

### **Overall Scores Migration Fix** ✅
- **Fixed**: "No completed rounds yet" showing even with completed rounds
- **Solution**: Added migration logic to populate `game.roundScores` from completed `game.rounds`
- **Enhanced**: Migration runs on both game fetch and game actions
- **Result**: Historical round data properly displayed in Overall Scores tab

### **AI Auto-Play Implementation** ✅
- **Added**: Three AI personalities with distinct playing styles
  - **Rookie Bot** (conservative): Low bids, tries to make exactly
  - **Strategic Sam** (smart): Reasonable bids, good at making them  
  - **Aggressive Alice** (aggressive): Higher bids, more risk-taking
- **Implemented**: Immediate AI response system for bids and tricks
- **Enhanced**: AI players automatically submit actions without delays
- **Result**: Seamless auto-mode experience with realistic AI behavior

## 🚧 Current Status

### ✅ Completed Features
- [x] **Auto-mode functionality** with instant 4-player individual games
- [x] **AI player system** with 3 personalities and auto-play logic
- [x] **Flexible team configuration** supporting 2-6 teams, 1-10 players per team
- [x] **Individual vs team game modes** with proper scoring and display
- [x] **Dynamic player limits** from 4-20 players per game
- [x] **Overall scores tracking** with round-by-round history
- [x] **Enhanced leaderboard** with team standings and cumulative scores
- [x] **Migration system** for backward compatibility
- [x] **Admin panel** with real-time monitoring and game management
- [x] **Mobile-first UI** with casino-inspired design and animations
- [x] **Complete game flow** from lobby through scoring with exit functionality

### 🎯 Fully Functional
- **Auto-Mode**: Type "auto" → instant 4-player individual game with AI
- **Regular Games**: Host configurable team/individual games up to 20 players
- **Game Mechanics**: Complete bidding, trick tracking, and scoring system
- **Real-time Updates**: Polling-based synchronization with migration support
- **Score Tracking**: Round-by-round and cumulative scoring with team standings

### 📋 Future Enhancements
1. **WebSocket Integration**: Replace polling with real-time connections
2. **Advanced AI**: More sophisticated bidding and playing strategies  
3. **Tournament Mode**: Multi-game tournaments with brackets
4. **Spectator Mode**: Allow observers to watch games
5. **Statistics**: Player performance analytics and history
6. **Mobile App**: Native mobile application
7. **Production Deployment**: Scalable cloud deployment

## 💡 Development Tips

### Quick Testing
- Use "auto" login to instantly create test games
- Use admin panel to monitor game states
- Multiple browser tabs for multi-player testing

### Code Organization
- Keep components modular and reusable
- Use TypeScript for type safety
- Follow Next.js 15 app router conventions
- Maintain clean API layer separation

### Debugging
- Check `games.json` and `players.json` for data issues
- Use browser dev tools for frontend debugging
- Monitor server logs for backend issues
- Admin panel provides real-time system overview

---

**Last Updated**: January 2025
**Version**: 2.0.0 - Full Feature Release
**Tech Stack**: Next.js 15, Express.js, TypeScript, TailwindCSS, Shadcn/ui
**Status**: Production Ready with AI Auto-Play and Scalable Multiplayer Support 
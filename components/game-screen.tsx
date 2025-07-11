"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GameLobby } from "@/components/game-lobby"
import { BiddingScreen } from "@/components/bidding-screen"
import { TrickTrackingScreen } from "@/components/trick-tracking-screen"
import { LeaderboardScreen } from "@/components/leaderboard-screen"
import { TrickReviewModal } from "@/components/trick-review-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { gameAPI, sessionStorage, GamePoller } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Home, 
  Wifi, 
  WifiOff,
  Spade,
  Users,
  Trophy,
  LogOut
} from "lucide-react"
import type { Game } from "@/lib/api"

type GameScreenProps = {
  gameId: string
}

export function GameScreen({ gameId }: GameScreenProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')
  const [retryCount, setRetryCount] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    console.log('🎮 GameScreen useEffect - gameId:', gameId)
    
    const session = sessionStorage.getPlayerSession()
    console.log('📦 Session from storage:', session)
    
    if (!session) {
      console.error('❌ No session found, redirecting to dashboard')
      toast({
        title: "Session Expired",
        description: "Please join a game first",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }

    if (session.gameId !== gameId) {
      console.error('❌ Game ID mismatch:', { sessionGameId: session.gameId, routeGameId: gameId })
      toast({
        title: "Game Mismatch",
        description: "This isn't the game you joined",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }

    console.log('✅ Session valid, setting player ID:', session.playerId)
    setCurrentPlayerId(session.playerId)

    // Initialize game poller
    const poller = new GamePoller()
    
    poller.onGameUpdate((gameData) => {
      setGame(gameData)
      setLoading(false)
      setError(null)
      setConnectionStatus('connected')
      setRetryCount(0)
    })
    
    poller.onError((error) => {
      console.error("Game polling error:", error)
      setError("Connection lost")
      setConnectionStatus('disconnected')
      setRetryCount(prev => prev + 1)
    })
    
    poller.startPolling(gameId, 'lobby')

    return () => {
      poller.stopPolling()
    }
  }, [gameId, router, toast])

  const handleGameAction = async (action: string, data?: any) => {
    if (!currentPlayerId) {
      toast({
        title: "Error",
        description: "You are not properly connected to the game",
        variant: "destructive",
      })
      return
    }

    try {
      setConnectionStatus('connecting')
      
      // Handle different actions
      switch (action) {
        case 'startGame':
          await gameAPI.startGame(gameId, currentPlayerId)
          break
        case 'submitBid':
          await gameAPI.submitBid(gameId, currentPlayerId, data.bid)
          break
        case 'submitTricks':
          await gameAPI.submitTricks(gameId, currentPlayerId, data.tricks)
          break
        case 'startTrickTracking':
          await gameAPI.startTrickTracking(gameId, currentPlayerId)
          break
        case 'completeRound':
          await gameAPI.completeRound(gameId, currentPlayerId)
          break
        case 'nextRound':
          await gameAPI.nextRound(gameId, currentPlayerId)
          break
        case 'leaveGame':
          await gameAPI.leaveGame(gameId, currentPlayerId)
          break
        case 'deleteGame':
          await gameAPI.deleteGame(gameId, currentPlayerId)
          break
        case 'editPlayerTricks':
          await gameAPI.editPlayerTricks(gameId, currentPlayerId, data.targetPlayerId, data.newTricks)
          break
        case 'approveTricks':
          await gameAPI.approveTricks(gameId, currentPlayerId)
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }
      
      setConnectionStatus('connected')
      // Game state will be updated via polling
    } catch (error) {
      console.error("Game action error:", error)
      setConnectionStatus('disconnected')
      toast({
        title: "Action Failed",
        description: "Unable to perform action. Check your connection.",
        variant: "destructive",
      })
    }
  }

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    setConnectionStatus('connecting')
    
    try {
      const gameData = await gameAPI.getGame(gameId)
      setGame(gameData.game)
      setLoading(false)
      setConnectionStatus('connected')
    } catch (error) {
      setError("Failed to reconnect")
      setConnectionStatus('disconnected')
      setLoading(false)
    }
  }

  const handleExitGame = async () => {
    if (!currentPlayerId) return
    
    setIsExiting(true)
    
    try {
      await gameAPI.leaveGame(gameId, currentPlayerId)
      
      // Clear session
      sessionStorage.clearPlayerSession()
      
      toast({
        title: "Left Game",
        description: "You have successfully left the game",
      })
      
      router.push("/dashboard")
    } catch (error) {
      console.error("Error leaving game:", error)
      toast({
        title: "Error",
        description: "Failed to leave game properly, but you'll be taken to dashboard",
        variant: "destructive",
      })
      
      // Still redirect even if the API call fails
      sessionStorage.clearPlayerSession()
      router.push("/dashboard")
    } finally {
      setIsExiting(false)
    }
  }

  const handleCallOffGame = async () => {
    if (!currentPlayerId || !game) return
    
    setIsExiting(true)
    
    try {
      // Call the cancelGame API
      await gameAPI.cancelGame(gameId, currentPlayerId)
      
      // Clear session
      sessionStorage.clearPlayerSession()
      
      toast({
        title: "Game Called Off",
        description: "The game has been cancelled and all players have been notified",
      })
      
      router.push("/dashboard")
    } catch (error) {
      console.error("Error calling off game:", error)
      toast({
        title: "Error",
        description: "Failed to cancel game, but you'll be taken to dashboard",
        variant: "destructive",
      })
      
      // Still redirect even if the API call fails
      sessionStorage.clearPlayerSession()
      router.push("/dashboard")
    } finally {
      setIsExiting(false)
    }
  }

  const handleEditTricks = async (targetPlayerId: string, newTricks: number) => {
    await handleGameAction('editPlayerTricks', { targetPlayerId, newTricks })
  }

  const handleApproveTricks = async () => {
    await handleGameAction('approveTricks')
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600" />
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-600" />
    }
  }

  const getGameStateDisplay = (state: string) => {
    switch (state) {
      case 'lobby':
        return { 
          icon: <Users className="h-4 w-4" />, 
          label: 'Waiting for Players',
          color: 'bg-blue-500/20 text-blue-700 border-blue-500/30'
        }
      case 'bidding':
        return { 
          icon: <Spade className="h-4 w-4" />, 
          label: 'Bidding Phase',
          color: 'bg-casino-accent/20 text-casino-accent border-casino-accent/30'
        }
      case 'playing':
        return { 
          icon: <Trophy className="h-4 w-4" />, 
          label: 'Playing Round',
          color: 'bg-green-500/20 text-green-700 border-green-500/30'
        }
      case 'trick_review':
        return { 
          icon: <Trophy className="h-4 w-4" />, 
          label: 'Reviewing Tricks',
          color: 'bg-orange-500/20 text-orange-700 border-orange-500/30'
        }
      case 'scoring':
        return { 
          icon: <Trophy className="h-4 w-4" />, 
          label: 'Round Complete',
          color: 'bg-purple-500/20 text-purple-700 border-purple-500/30'
        }
      case 'completed':
        return { 
          icon: <Trophy className="h-4 w-4" />, 
          label: 'Game Complete',
          color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
        }
      default:
        return { 
          icon: <AlertCircle className="h-4 w-4" />, 
          label: 'Unknown State',
          color: 'bg-secondary text-secondary-foreground'
        }
    }
  }

  // Enhanced Loading Screen
  if (loading) {
    return (
      <div className="container max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-casino-accent/20 border-t-casino-accent mx-auto"></div>
              <Spade className="h-6 w-6 text-casino-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-casino-primary">Loading Game</h3>
              <p className="text-sm text-muted-foreground">
                {retryCount > 0 ? `Reconnecting... (Attempt ${retryCount})` : 'Connecting to game...'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              {getConnectionStatusIcon()}
              <span className="text-xs text-muted-foreground capitalize">{connectionStatus}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Enhanced Error Screen
  if (error) {
    return (
      <div className="container max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-casino-primary">Connection Problem</CardTitle>
            <CardDescription>
              {error}
              {retryCount > 3 && " - Multiple connection attempts failed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">Unable to Connect</AlertTitle>
              <AlertDescription className="text-red-600">
                Check your internet connection and try again.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="border-casino-subtle hover:bg-accent-hover transition-casino"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-casino-primary hover:bg-primary/90 text-primary-foreground transition-casino"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Game Not Found
  if (!game) {
    return (
      <div className="container max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-casino-primary">Game Not Found</h3>
              <p className="text-sm text-muted-foreground">This game may have ended or been deleted.</p>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-casino-primary hover:bg-primary/90 text-primary-foreground transition-casino"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Connection Status Bar
  const gameState = game.state || game.status
  const stateDisplay = getGameStateDisplay(gameState)

  const connectionStatusBar = connectionStatus !== 'connected' && (
    <div className="container max-w-md mx-auto px-4 pb-2">
      <Alert className={`border-${connectionStatus === 'connecting' ? 'yellow' : 'red'}-500/30 bg-${connectionStatus === 'connecting' ? 'yellow' : 'red'}-500/10`}>
        {getConnectionStatusIcon()}
        <AlertTitle className={`text-${connectionStatus === 'connecting' ? 'yellow' : 'red'}-700`}>
          {connectionStatus === 'connecting' ? 'Reconnecting...' : 'Connection Lost'}
        </AlertTitle>
        <AlertDescription className={`text-${connectionStatus === 'connecting' ? 'yellow' : 'red'}-600`}>
          {connectionStatus === 'connecting' 
            ? 'Syncing with other players...' 
            : 'Some features may not work properly.'}
        </AlertDescription>
      </Alert>
    </div>
  )

  // Game State Display
  const gameStateBar = (
    <div className="container max-w-md mx-auto px-4 pb-4">
      <div className="flex items-center justify-between p-3 bg-casino-surface shadow-casino-card border-casino-subtle rounded-lg">
        <div className="flex items-center gap-2">
          {stateDisplay.icon}
          <span className="font-medium text-casino-primary">{stateDisplay.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={stateDisplay.color}>
            Round {game.currentRound}
          </Badge>
          {getConnectionStatusIcon()}
          
          {/* Exit Game Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-500/10 hover:text-red-600 transition-casino"
                disabled={isExiting}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-casino-surface border-casino-subtle">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-casino-primary flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  {game.hostId === currentPlayerId ? 'Host Options' : 'Leave Game'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  {game.hostId === currentPlayerId ? (
                    <>
                      As the game host, you can either leave the game (others continue playing) or call off the entire game for everyone.
                    </>
                  ) : (
                    <>
                      Are you sure you want to leave this game? Other players will be notified of your departure.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className={game.hostId === currentPlayerId ? "flex-col gap-2" : ""}>
                <AlertDialogCancel className="border-casino-subtle hover:bg-accent-hover">
                  Cancel
                </AlertDialogCancel>
                
                {game.hostId === currentPlayerId ? (
                  <>
                    {/* Host Option 1: Just Leave */}
                    <AlertDialogAction
                      onClick={handleExitGame}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={isExiting}
                    >
                      {isExiting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Leaving...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 mr-2" />
                          Just Leave (Others Continue)
                        </>
                      )}
                    </AlertDialogAction>
                    
                    {/* Host Option 2: Call Off Game */}
                    <AlertDialogAction
                      onClick={handleCallOffGame}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={isExiting}
                    >
                      {isExiting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Calling Off...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Call Off Game (End for Everyone)
                        </>
                      )}
                    </AlertDialogAction>
                  </>
                ) : (
                  /* Regular Player: Just Leave */
                  <AlertDialogAction
                    onClick={handleExitGame}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isExiting}
                  >
                    {isExiting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Leaving...
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Game
                      </>
                    )}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )

  // Render appropriate screen based on game state
  const gameComponent = (() => {
    switch (gameState) {
      case "lobby":
        return (
          <GameLobby
            game={game}
            currentPlayerId={currentPlayerId}
            onGameAction={handleGameAction}
          />
        )
      case "bidding":
        return (
          <BiddingScreen
            game={game}
            currentPlayerId={currentPlayerId}
            onGameAction={handleGameAction}
          />
        )
      case "playing":
      case "trick_review":
        return (
          <TrickTrackingScreen
            game={game}
            currentPlayerId={currentPlayerId}
            onGameAction={handleGameAction}
          />
        )
      case "scoring":
      case "completed":
        return (
          <LeaderboardScreen
            game={game}
            currentPlayerId={currentPlayerId}
            onGameAction={handleGameAction}
          />
        )
      default:
        return (
          <div className="container max-w-md mx-auto p-4">
            <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-casino-primary mb-2">Unknown Game State</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Game state: {gameState}
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-casino-primary hover:bg-primary/90 text-primary-foreground transition-casino"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )
    }
  })()

  return (
    <div className="min-h-screen bg-background">
      {connectionStatusBar}
      {gameStateBar}
      <div className="transition-all duration-300 ease-in-out">
        {gameComponent}
      </div>
      
      {/* Trick Review Modal */}
      <TrickReviewModal
        game={game}
        currentPlayerId={currentPlayerId}
        isHost={game.hostId === currentPlayerId}
        onEditTricks={handleEditTricks}
        onApproveTricks={handleApproveTricks}
      />
    </div>
  )
} 
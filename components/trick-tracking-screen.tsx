"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GameHeader } from "@/components/game-header"
import { 
  Crown, 
  CheckCircle, 
  Clock, 
  Target, 
  Trophy, 
  Calculator,
  Bot,
  Users,
  CheckSquare,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Game } from "@/lib/api"

type User = {
  id: string
  name: string
  email: string
}

type TrickTrackingScreenProps = {
  game: Game
  currentPlayerId: string | null
  onGameAction: (action: string, data?: any) => Promise<void>
}

export function TrickTrackingScreen({ game, currentPlayerId, onGameAction }: TrickTrackingScreenProps) {
  const { toast } = useToast()
  const [selectedTricks, setSelectedTricks] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const currentPlayer = currentPlayerId ? game.players[currentPlayerId] : null
  const currentRound = game.rounds?.[game.currentRound - 1]
  const hasSubmittedTricks = currentPlayer && currentRound?.tricks && currentPlayerId && currentRound.tricks[currentPlayerId] !== undefined
  const isHost = currentPlayerId === game.hostId
  
  // Mock user object for GameHeader
  const user: User = {
    id: currentPlayerId || '',
    name: currentPlayer?.name || 'Player',
    email: 'player@spadescore.com'
  }

  // Create gameData object for GameHeader compatibility
  const gameData = {
    ...game,
    title: game.title || "Spades Game",
    hostName: game.hostName || "Host"
  }

  const handleSubmitTricks = async () => {
    if (!selectedTricks || !currentPlayerId) return
    
    const tricksValue = parseInt(selectedTricks)

    if (isNaN(tricksValue) || tricksValue < 0) {
      toast({
        title: "Invalid Tricks",
        description: "Please enter a valid number for your tricks",
        variant: "destructive",
      })
      return
    }
    
    setSubmitting(true)
    try {
      await onGameAction("submitTricks", { 
        tricks: tricksValue
      })
      
      toast({
        title: "Tricks Submitted",
        description: `You won ${tricksValue} tricks`,
      })
      
      setSelectedTricks("")
    } catch (error: any) {
      console.error("Error submitting tricks:", error)
      
      // Handle specific validation errors
      if (error.validation === 'individual_limit') {
        toast({
          title: "Invalid Tricks",
          description: `Tricks must be between 0 and ${game.currentRound}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to submit tricks",
          variant: "destructive",
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const completeRound = async () => {
    if (!isHost) return

    try {
      setSubmitting(true)
      console.log(`Completing round ${game.currentRound}`)
      
      await onGameAction("completeRound")

      toast({
        title: "Round Completed",
        description: "Scores have been calculated",
      })
    } catch (error) {
      console.error("Error completing round:", error)
      toast({
        title: "Error",
        description: "Failed to complete round",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getTricksOptions = () => {
    const tricksThisRound = currentRound?.tricksThisRound || game.currentRound
    const options = []
    for (let i = 0; i <= tricksThisRound; i++) {
      options.push(i.toString())
    }
    return options
  }

  const allTricksSubmitted = Object.keys(game.players).every(playerId => 
    currentRound?.tricks && currentRound.tricks[playerId] !== undefined
  )

  const getTeamBadgeStyle = (team: string) => {
    switch (team) {
      case 'red':
        return 'bg-red-500/20 text-red-700 border-red-500/30'
      case 'blue':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  const calculateScore = (bid: number, tricks: number) => {
    // Nil bid rules
    if (bid === 0) {
      return tricks; // Bid 0: get points equal to tricks won
    }
    
    // Made bid exactly
    if (tricks === bid) {
      return bid * 10; // Made bid = 10 × bid value
    }
    
    // Overtricks (bags)
    if (tricks > bid) {
      return (bid * 10) + (tricks - bid); // Made bid + 1 point per extra trick
    }
    
    // Failed bid
    // Score = tricks won × 10 - (bid - tricks won) × 10
    return (tricks * 10) - ((bid - tricks) * 10);
  }

  const getPlayerBid = (playerId: string) => {
    return currentRound?.bids?.[playerId] || 0
  }

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      {/* Game Header */}
      <GameHeader gameData={gameData} user={user} isHost={isHost} />

      {/* Round Information */}
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-casino-accent" />
            Round {game.currentRound} - Trick Tracking
          </CardTitle>
          <CardDescription>Enter how many tricks you actually won</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-casino-accent/10 rounded-lg border border-casino-accent/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-casino-accent" />
                <span className="text-sm font-medium text-casino-accent">Total Tricks</span>
              </div>
              <p className="text-3xl font-bold text-casino-primary">{game.currentRound}</p>
            </div>
            <div className="text-center p-4 bg-secondary/10 rounded-lg border border-casino-subtle">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Available</span>
              </div>
              <p className="text-3xl font-bold text-casino-primary">{game.currentRound}</p>
              <p className="text-xs text-muted-foreground mt-1">Total for this round</p>
            </div>
          </div>
          
          {/* Tricks Distribution */}
          {currentRound?.tricks && Object.keys(currentRound.tricks).length > 0 && (
            <div className="mt-4 p-3 bg-secondary/10 rounded-lg border border-casino-subtle">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="h-4 w-4 text-casino-accent" />
                <span className="text-sm font-medium text-casino-accent">Tricks Claimed</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Total claimed: {Object.values(currentRound.tricks).reduce((sum, t) => sum + t, 0)} / {game.currentRound}</p>
                {Object.values(currentRound.tricks).reduce((sum, t) => sum + t, 0) !== game.currentRound && (
                  <p className="text-blue-600 font-medium">ℹ️ Host will review and approve the final distribution</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Bid Display */}
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-casino-primary" />
            Your Bid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 bg-secondary/20 rounded-lg border border-casino-subtle">
            <p className="text-2xl font-bold text-casino-primary">
              {currentPlayerId ? getPlayerBid(currentPlayerId) : 0} tricks
            </p>
            <p className="text-xs text-muted-foreground mt-1">Your target for this round</p>
          </div>
        </CardContent>
      </Card>

      {/* Trick Submission */}
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-casino-primary" />
            Tricks Won
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasSubmittedTricks ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tricks" className="text-sm font-medium">How many tricks did you win?</Label>
                <Select value={selectedTricks} onValueChange={setSelectedTricks}>
                  <SelectTrigger className="bg-secondary/20 border-casino-subtle transition-casino">
                    <SelectValue placeholder="Select tricks won" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTricksOptions().map(tricks => (
                      <SelectItem key={tricks} value={tricks}>
                        {tricks} {parseInt(tricks) === 1 ? 'trick' : 'tricks'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Score Preview */}
              {selectedTricks && currentPlayerId && (
                <div className="p-3 bg-casino-accent/10 rounded-lg border border-casino-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-casino-accent" />
                    <span className="text-sm font-medium text-casino-accent">Score Preview</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Bid: {getPlayerBid(currentPlayerId)} | Won: {selectedTricks}</p>
                    <p className="font-bold text-casino-primary">
                      Score: {calculateScore(getPlayerBid(currentPlayerId), parseInt(selectedTricks))} points
                    </p>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleSubmitTricks}
                disabled={!selectedTricks || submitting}
                className="w-full bg-casino-primary hover:bg-primary/90 text-primary-foreground transition-casino transform-casino-hover"
                size="lg"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                    Submitting...
                  </div>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Submit Tricks
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Alert className="border-green-500/30 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Tricks Submitted!</AlertTitle>
              <AlertDescription className="text-green-600">
                You won <span className="font-bold">{currentPlayerId && currentRound?.tricks?.[currentPlayerId]}</span> tricks.
                Waiting for other players...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Player Status */}
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-casino-primary" />
            Player Progress
          </CardTitle>
          <CardDescription>Bid vs Tricks comparison</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(game.players).map(([playerId, player]) => {
            const hasTricks = currentRound?.tricks && currentRound.tricks[playerId] !== undefined
            const tricksValue = currentRound?.tricks?.[playerId] || 0
            const bidValue = getPlayerBid(playerId)
            const score = hasTricks ? calculateScore(bidValue, tricksValue) : 0
            const madeContractFlag = hasTricks && tricksValue === bidValue
            
            return (
              <div key={playerId} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border-casino-subtle border hover:bg-secondary/20 transition-casino">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-casino-subtle">
                      <AvatarImage src="" alt={player.name} />
                      <AvatarFallback className="bg-casino-accent text-accent-foreground font-semibold">
                        {player.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                      player.isComputer ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{player.name}</span>
                      {player.isComputer && (
                        <Bot className="h-4 w-4 text-blue-500" />
                      )}
                      {playerId === game.hostId && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`${getTeamBadgeStyle(player.team)} text-xs`}
                      >
                        Team {player.team?.charAt(0).toUpperCase() + player.team?.slice(1)}
                      </Badge>
                      {hasTricks && (
                        <Badge variant={madeContractFlag ? "default" : "secondary"} className="text-xs">
                          {madeContractFlag ? "Contract Made!" : "Contract Missed"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Bid: {bidValue} | Won: {hasTricks ? tricksValue : '?'} | Score: {hasTricks ? score : '?'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasTricks ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400 animate-pulse" />
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* All Tricks Submitted */}
      {allTricksSubmitted && (
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardContent className="p-4">
            <Alert className="border-blue-500/30 bg-blue-500/10">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-700">All Tricks Submitted!</AlertTitle>
              <AlertDescription className="text-blue-600">
                {isHost ? 
                  "All players have submitted their tricks. You can complete the round now." :
                  "All tricks are in! Waiting for the host to complete the round..."
                }
              </AlertDescription>
            </Alert>
            
            {isHost && (
              <Button 
                onClick={completeRound}
                disabled={submitting}
                className="w-full mt-4 bg-casino-accent hover:bg-accent/90 text-accent-foreground transition-casino transform-casino-hover"
                size="lg"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full"></div>
                    Completing...
                  </div>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Complete Round
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
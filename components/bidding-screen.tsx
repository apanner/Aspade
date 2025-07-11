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
  Eye, 
  EyeOff, 
  Bot,
  AlertCircle,
  Trophy,
  Play,
  Users
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Game } from "@/lib/api"

type User = {
  id: string
  name: string
  email: string
}

type BiddingScreenProps = {
  game: Game
  currentPlayerId: string | null
  onGameAction: (action: string, data?: any) => Promise<void>
}

export function BiddingScreen({ game, currentPlayerId, onGameAction }: BiddingScreenProps) {
  const { toast } = useToast()
  const [selectedBid, setSelectedBid] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const currentPlayer = currentPlayerId ? game.players[currentPlayerId] : null
  const currentRound = game.rounds?.[game.currentRound - 1]
  const hasSubmittedBid = currentPlayer && currentRound?.bids && currentPlayerId && currentRound.bids[currentPlayerId] !== undefined
  const isHost = currentPlayerId === game.hostId
  
  // Mock user object for GameHeader
  const user: User = {
    id: currentPlayerId || '',
    name: currentPlayer?.name || 'Player',
    email: 'player@spadescore.com'
  }

  // Determine if bidding is visible (you can make this configurable later)
  const isVisibleBidding = true // Default to visible for now

  // Create gameData object for GameHeader compatibility
  const gameData = {
    ...game,
    title: game.title || "Spades Game",
    hostName: game.hostName || "Host"
  }

  const handleSubmitBid = async () => {
    if (!selectedBid || !currentPlayerId) return
    
    const bidValue = parseInt(selectedBid)
    const maxBidAllowed = currentRound?.tricksThisRound || game.currentRound

    if (isNaN(bidValue) || bidValue < 0) {
      toast({
        title: "Invalid Bid",
        description: "Please enter a valid number for your bid",
        variant: "destructive",
      })
      return
    }
    
    // Validate bid against round number limit
    if (bidValue > maxBidAllowed) {
      toast({
        title: "Bid Too High",
        description: `For round ${game.currentRound}, maximum bid allowed is ${maxBidAllowed}`,
        variant: "destructive",
      })
      return
    }
    
    setSubmitting(true)
    try {
      await onGameAction("submitBid", { 
        bid: bidValue
      })
      
      toast({
        title: "Bid Submitted",
        description: `You bid ${bidValue} tricks`,
      })
      
      setSelectedBid("")
    } catch (error) {
      console.error("Error submitting bid:", error)
      toast({
        title: "Error",
        description: "Failed to submit bid",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const startTrickTracking = async () => {
    if (!isHost) return

    try {
      setSubmitting(true)
      console.log(`Starting trick tracking for round ${game.currentRound}`)
      
      await onGameAction("startTrickTracking")

      toast({
        title: "Round Started",
        description: "Players can now track their tricks",
      })
    } catch (error) {
      console.error("Error starting trick tracking:", error)
      toast({
        title: "Error",
        description: "Failed to start trick tracking",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getBidOptions = () => {
    const tricksThisRound = currentRound?.tricksThisRound || game.currentRound
    const options = []
    for (let i = 0; i <= tricksThisRound; i++) {
      options.push(i.toString())
    }
    return options
  }

  const allBidsSubmitted = Object.keys(game.players).every(playerId => 
    currentRound?.bids && currentRound.bids[playerId] !== undefined
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

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      {/* Game Header */}
      <GameHeader gameData={gameData} user={user} isHost={isHost} />

      {/* Round Information */}
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-casino-accent" />
            Round {game.currentRound} - Bidding
          </CardTitle>
          <CardDescription>Submit your bid for this round</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 bg-casino-accent/10 rounded-lg border border-casino-accent/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-casino-accent" />
              <span className="text-sm font-medium text-casino-accent">Tricks Available</span>
            </div>
            <p className="text-3xl font-bold text-casino-primary">
              {currentRound?.tricksThisRound || game.currentRound}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bidding Section */}
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isVisibleBidding ? (
                <Eye className="h-5 w-5 text-casino-primary" />
              ) : (
                <EyeOff className="h-5 w-5 text-casino-primary" />
              )}
              <span>Your Bid</span>
            </div>
            <Badge variant="outline" className="border-casino-subtle text-casino-primary">
              {isVisibleBidding ? "Visible" : "Hidden"} Bidding
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasSubmittedBid ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bid" className="text-sm font-medium">Select Your Bid</Label>
                <Select value={selectedBid} onValueChange={setSelectedBid}>
                  <SelectTrigger className="bg-secondary/20 border-casino-subtle transition-casino">
                    <SelectValue placeholder={`Bid 0-${currentRound?.tricksThisRound || game.currentRound} tricks`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getBidOptions().map(bid => (
                      <SelectItem key={bid} value={bid}>
                        {bid} {parseInt(bid) === 1 ? 'trick' : 'tricks'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleSubmitBid}
                disabled={!selectedBid || submitting}
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
                    <Target className="h-4 w-4 mr-2" />
                    Submit Bid
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Alert className="border-green-500/30 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Bid Submitted!</AlertTitle>
              <AlertDescription className="text-green-600">
                You bid <span className="font-bold">{currentPlayerId && currentRound?.bids?.[currentPlayerId]}</span> tricks.
                Waiting for other players...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Player Bids */}
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-casino-primary" />
            Player Bids
          </CardTitle>
          <CardDescription>
            {isVisibleBidding ? 'Bid values are visible to all players' : 'Bid values are hidden until all submit'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(game.players).map(([playerId, player]) => {
            const hasBid = currentRound?.bids && currentRound.bids[playerId] !== undefined
            const bidValue = currentRound?.bids?.[playerId]
            
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
                      {hasBid && isVisibleBidding && (
                        <Badge variant="secondary" className="text-xs bg-casino-accent/20 text-casino-accent">
                          {bidValue} tricks
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasBid ? (
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

      {/* All Bids Submitted */}
      {allBidsSubmitted && (
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardContent className="p-4">
            <Alert className="border-blue-500/30 bg-blue-500/10">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-700">All Bids Submitted!</AlertTitle>
              <AlertDescription className="text-blue-600">
                {isHost ? 
                  "All players have submitted their bids. You can start trick tracking now." :
                  "All bids are in! Waiting for the host to start trick tracking..."
                }
              </AlertDescription>
            </Alert>
            
            {isHost && (
              <Button 
                onClick={startTrickTracking}
                disabled={submitting}
                className="w-full mt-4 bg-casino-accent hover:bg-accent/90 text-accent-foreground transition-casino transform-casino-hover"
                size="lg"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full"></div>
                    Starting...
                  </div>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Trick Tracking
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
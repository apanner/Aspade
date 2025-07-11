"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Crown, 
  Users, 
  Copy, 
  Play, 
  LogOut, 
  Bot, 
  Facebook, 
  MessageCircle, 
  Share2,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Game } from "@/lib/api"

type GameLobbyProps = {
  game: Game & {
    teamConfigs?: Array<{
      id: string
      name: string
      color: string
      colorName: string
      bg: string
    }>
  }
  currentPlayerId: string | null
  onGameAction: (action: string, data?: any) => Promise<void>
}

export function GameLobby({ game, currentPlayerId, onGameAction }: GameLobbyProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [exitLoading, setExitLoading] = useState(false)
  
  const isHost = currentPlayerId === game.hostId
  const playerCount = Object.keys(game.players).length
  const minPlayers = 2
  const canStartGame = playerCount >= minPlayers

  const gameLink = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/join/${game.id}`
    }
    return ""
  }, [game.id])

  const playerList = useMemo(() => {
    const players = game.players || {}
    return Object.values(players).sort((a: any, b: any) => {
      // Put the host first
      if (a.isHost && !b.isHost) return -1
      if (!a.isHost && b.isHost) return 1
      // Then sort by join time
      return (a.joinedAt || 0) - (b.joinedAt || 0)
    })
  }, [game.players])

  const handleCopyCode = async () => {
    try {
      const textToCopy = game.code || game.id
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Game code copied to clipboard",
        duration: 1500,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      })
    }
  }

  // Social sharing functions
  const shareToWhatsApp = () => {
    const text = `Join my Spades game! Game code: ${game.id} or use this link: ${gameLink}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
  }
  
  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameLink)}`
    window.open(facebookUrl, '_blank')
  }
  
  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join my Spades game!`,
        text: `Join my Spades game! Use game code: ${game.id}`,
        url: gameLink
      }).catch(err => {
        console.error('Error sharing:', err)
        handleCopyCode() // Fallback to copying
      })
    } else {
      handleCopyCode() // Fallback for browsers that don't support sharing
    }
  }

  const handleStartGame = async () => {
    if (!isHost) return
    await onGameAction("startGame")
  }

  const handleExitGame = async () => {
    try {
      setExitLoading(true)
      
      if (isHost) {
        await onGameAction("deleteGame")
        toast({
          title: "Game deleted",
          description: "You've deleted the game as the host",
        })
      } else {
        await onGameAction("leaveGame", { playerId: currentPlayerId })
        toast({
          title: "Left game",
          description: "You've left the game successfully",
        })
      }
      
      router.push('/dashboard')
    } catch (error) {
      console.error("Error exiting game:", error)
      toast({
        title: "Error",
        description: "Failed to exit the game. Please try again.",
        variant: "destructive",
      })
    } finally {
      setExitLoading(false)
    }
  }

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

  // Function to get display name for a team
  const getTeamDisplayName = (teamId: string): string => {
    // Check if we have custom team configurations
    if (game.teamConfigs && Array.isArray(game.teamConfigs)) {
      const teamConfig = game.teamConfigs.find((config: any) => config.id === teamId)
      if (teamConfig && teamConfig.name) {
        return teamConfig.name
      }
    }
    
    // Fallback to capitalize the team ID (team1 -> Team1)
    return teamId.charAt(0).toUpperCase() + teamId.slice(1)
  }

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <div className="p-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent-hover transition-casino">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div className="flex flex-col items-center">
              <h1 className="text-lg font-semibold text-casino-primary">
                {game.title || "Spades Game"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Hosted by {game.hostName}
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isHost ? "Delete Game" : "Leave Game"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isHost 
                      ? "Are you sure you want to delete this game? All players will be disconnected."
                      : "Are you sure you want to leave this game?"
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleExitGame} disabled={exitLoading}>
                    {isHost ? "Delete Game" : "Leave Game"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>

      {/* Game Code and Sharing */}
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-casino-primary" />
            Game Lobby
          </CardTitle>
          <CardDescription>Share this code with friends to join</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border-casino-subtle border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Game Code</p>
              <p className="text-3xl font-mono font-bold text-casino-primary tracking-wider">
                {game.code || game.id}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCopyCode}
              className="transition-casino transform-casino-hover"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Social Sharing */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Share with friends</p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={shareToWhatsApp}
                className="flex-1 transition-casino transform-casino-hover"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={shareToFacebook}
                className="flex-1 transition-casino transform-casino-hover"
              >
                <Facebook className="h-4 w-4 mr-1" />
                Facebook
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={shareNative}
                className="flex-1 transition-casino transform-casino-hover"
              >
                <Share2 className="h-4 w-4 mr-1" />
                More
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Players ({playerCount}/4)</span>
            <Badge variant="outline" className="border-casino-subtle text-casino-primary">
              Lobby
            </Badge>
          </CardTitle>
          <CardDescription>
            {playerCount < 4 ? 
              `Waiting for ${4 - playerCount} more players...` : 
              'All players ready!'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {playerList.map((player: any) => (
            <div key={player.id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border-casino-subtle border hover:bg-secondary/20 transition-casino">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-casino-subtle">
                    <AvatarImage src={player.photoURL || ""} alt={player.name} />
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
                    {player.isHost && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {player.isComputer ? 'Computer Player' : 'Human Player'}
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${getTeamBadgeStyle(player.team)} font-medium`}
              >
                {player.team ? `Team ${getTeamDisplayName(player.team)}` : 'No Team'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Game Actions */}
      {isHost ? (
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardContent className="p-4">
            <div className="text-center space-y-4">
              {canStartGame ? (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700">Ready to Start!</AlertTitle>
                  <AlertDescription className="text-green-600">
                    All players are ready. You can start the game now.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-yellow-500/30 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-700">Waiting for Players</AlertTitle>
                  <AlertDescription className="text-yellow-600">
                    Need at least {minPlayers - playerCount} more players to start.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleStartGame}
                disabled={!canStartGame}
                className="w-full bg-casino-primary hover:bg-primary/90 text-primary-foreground transition-casino transform-casino-hover"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Game
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardContent className="p-6 text-center">
            <div className="animate-pulse mb-4">
              <Crown className="h-8 w-8 text-yellow-500 mx-auto" />
            </div>
            <p className="text-sm text-muted-foreground">
              Waiting for <span className="font-medium text-casino-primary">{game.hostName}</span> to start the game...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
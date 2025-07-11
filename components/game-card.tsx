"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "@/lib/utils"
import { 
  Users, 
  ArrowRight, 
  Crown, 
  Clock, 
  Trophy, 
  Spade,
  Bot,
  Eye,
  Play
} from "lucide-react"

type Player = {
  id: string
  name: string
  team: string
  isComputer?: boolean
  isHost?: boolean
  photoURL?: string
}

type Game = {
  id: string
  title: string
  hostId: string
  hostName: string
  createdAt: number
  currentRound: number
  totalRounds: number
  players: Record<string, Player>
  status?: string
  scores?: Record<string, number>
}

export function GameCard({ game }: { game: Game }) {
  const playerCount = Object.keys(game.players || {}).length
  const maxPlayers = 4
  const progress = game.totalRounds > 0 ? Math.round((game.currentRound / game.totalRounds) * 100) : 0
  const isInProgress = game.status === "in_progress" || game.currentRound > 0
  const isLobby = game.status === "lobby" || game.currentRound === 0
  const isFull = playerCount >= maxPlayers
  
  const getGameStatus = () => {
    if (isLobby) return "Waiting for players"
    if (isInProgress) return `Round ${game.currentRound}/${game.totalRounds}`
    return "Completed"
  }

  const getStatusBadge = () => {
    if (isLobby) {
      return (
        <Badge variant="outline" className="border-casino-subtle text-casino-primary">
          Lobby
        </Badge>
      )
    } else if (isInProgress) {
      return (
        <Badge className="bg-casino-accent text-accent-foreground">
          In Progress
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-secondary/60">
          Completed
        </Badge>
      )
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

  const getPlayersByTeam = () => {
    const players = Object.values(game.players || {})
    const redTeam = players.filter(p => p.team === 'red')
    const blueTeam = players.filter(p => p.team === 'blue')
    return { redTeam, blueTeam }
  }

  const { redTeam, blueTeam } = getPlayersByTeam()

  const getButtonAction = () => {
    if (isLobby && !isFull) {
      return {
        text: "Join Game",
        icon: <Users className="h-4 w-4" />,
        variant: "default" as const
      }
    } else if (isInProgress) {
      return {
        text: "Continue",
        icon: <Play className="h-4 w-4" />,
        variant: "default" as const
      }
    } else {
      return {
        text: "View Game",
        icon: <Eye className="h-4 w-4" />,
        variant: "outline" as const
      }
    }
  }

  const buttonAction = getButtonAction()

  return (
    <Card className="bg-casino-surface shadow-casino-card border-casino-subtle hover:shadow-casino-gaming transition-casino hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Spade className="h-4 w-4 text-casino-accent" />
              <CardTitle className="text-base text-casino-primary">{game.title || "Spades Game"}</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Hosted by <span className="font-medium text-casino-primary">{game.hostName}</span> • {formatDistanceToNow(game.createdAt)} ago
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 space-y-3">
        {/* Game Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{getGameStatus()}</span>
            <span className="text-casino-primary font-medium">{playerCount}/{maxPlayers} players</span>
          </div>
          {isInProgress && (
            <div className="w-full bg-secondary/30 h-1.5 rounded-full">
              <div 
                className="bg-casino-accent h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}
        </div>

        {/* Teams Display */}
        {playerCount > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {/* Red Team */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium">Red Team</span>
              </div>
              <div className="space-y-1">
                {redTeam.slice(0, 2).map((player) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar className="h-6 w-6 border border-casino-subtle">
                        <AvatarImage src="" alt={player.name} />
                        <AvatarFallback className="text-xs bg-casino-accent text-accent-foreground">
                          {player.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {player.isComputer && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border border-background"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium truncate">{player.name}</span>
                        {player.id === game.hostId && (
                          <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {redTeam.length === 0 && (
                  <div className="text-xs text-muted-foreground py-1">Waiting for players...</div>
                )}
              </div>
            </div>

            {/* Blue Team */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium">Blue Team</span>
              </div>
              <div className="space-y-1">
                {blueTeam.slice(0, 2).map((player) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar className="h-6 w-6 border border-casino-subtle">
                        <AvatarImage src="" alt={player.name} />
                        <AvatarFallback className="text-xs bg-casino-accent text-accent-foreground">
                          {player.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {player.isComputer && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border border-background"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium truncate">{player.name}</span>
                        {player.id === game.hostId && (
                          <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {blueTeam.length === 0 && (
                  <div className="text-xs text-muted-foreground py-1">Waiting for players...</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Stats */}
        {isInProgress && game.scores && (
          <div className="flex items-center justify-between pt-2 border-t border-casino-subtle">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-casino-accent" />
              <span className="text-xs text-muted-foreground">Scores</span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-red-600 font-medium">
                Red: {Object.values(game.scores).reduce((a, b) => a + b, 0) || 0}
              </span>
              <span className="text-blue-600 font-medium">
                Blue: {Object.values(game.scores).reduce((a, b) => a + b, 0) || 0}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3">
        <Link href={`/games/${game.id}`} className="w-full">
          <Button 
            variant={buttonAction.variant} 
            className="w-full bg-casino-primary hover:bg-primary/90 text-primary-foreground transition-casino transform-casino-hover"
            size="sm"
          >
            <span>{buttonAction.text}</span>
            {buttonAction.icon && <span className="ml-2">{buttonAction.icon}</span>}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
} 
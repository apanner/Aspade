"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, Trophy, ArrowRight, BarChart3, Clock } from "lucide-react"
import type { Game } from "@/lib/api"

// Extended game type for enhanced scoring
type EnhancedGame = Game & {
  roundScores?: Record<number, Record<string, number>>
  teamConfig?: {
    gameMode: string
    numberOfTeams: number
    playersPerTeam: number
    autoAssignTeams: boolean
  }
}

type LeaderboardScreenProps = {
  game: Game & { 
    roundScores?: Record<number, Record<string, number>>
    teamConfig?: any
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

export function LeaderboardScreen({ game, currentPlayerId, onGameAction }: LeaderboardScreenProps) {
  const isHost = currentPlayerId === game.hostId
  const currentRound = game.rounds[game.currentRound - 1]
  const isGameComplete = game.currentRound >= game.totalRounds

  const handleNextRound = async () => {
    if (!isHost) return
    await onGameAction("nextRound")
  }

  // Calculate total scores for each player from completed rounds
  const playerTotalScores: Record<string, number> = {}
  Object.keys(game.players).forEach(playerId => {
    let total = 0
    for (let round = 1; round <= game.currentRound; round++) {
      if (game.roundScores && game.roundScores[round] && game.roundScores[round][playerId]) {
        total += game.roundScores[round][playerId]
      }
    }
    playerTotalScores[playerId] = total
  })



  const sortedPlayers = Object.entries(game.players)
    .map(([playerId, player]) => ({
      playerId,
      ...player,
      roundScore: currentRound?.scores?.[playerId] || 0,
      totalScore: playerTotalScores[playerId] || 0,
    }))
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))

  // Get team scores dynamically using calculated total scores
  const teamScores: Record<string, number> = {}
  Object.entries(game.players).forEach(([playerId, player]) => {
    if (player.team) {
      if (!teamScores[player.team]) {
        teamScores[player.team] = 0
      }
      teamScores[player.team] += playerTotalScores[playerId] || 0
    }
  })

  // Get team names dynamically and map to display names
  const teamNames = Object.keys(teamScores)
  
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
  
  // Check if this is an individual game (no teams)
  const isIndividualGame = game.teamConfig?.gameMode === 'individual' || teamNames.length === 0

  // Calculate round-by-round data
  const completedRounds: number[] = []
  const roundData: Record<number, Record<string, number>> = {}
  
  for (let round = 1; round <= game.currentRound; round++) {
    if (game.roundScores && game.roundScores[round]) {
      completedRounds.push(round)
      roundData[round] = game.roundScores[round]
    }
  }

  // Calculate cumulative scores
  const cumulativeScores: Record<string, Record<number, number>> = {}
  Object.keys(game.players).forEach(playerId => {
    cumulativeScores[playerId] = {}
    let runningTotal = 0
    
    completedRounds.forEach(round => {
      const roundScore = roundData[round]?.[playerId] || 0
      runningTotal += roundScore
      cumulativeScores[playerId][round] = runningTotal
    })
  })

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{isGameComplete ? 'Final Results' : 'Game Results'}</span>
            <Badge variant={isGameComplete ? 'default' : 'secondary'}>
              {isGameComplete ? 'Complete' : `Round ${game.currentRound}`}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isGameComplete ? 'Game complete!' : `Round ${game.currentRound} of ${game.totalRounds}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Current Round
              </TabsTrigger>
              <TabsTrigger value="overall" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overall Scores
              </TabsTrigger>
            </TabsList>

            {/* Current Round Tab */}
            <TabsContent value="current" className="space-y-6">
                          {/* Team Scores - Only show for team games */}
            {!isIndividualGame && teamNames.length > 1 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Team Standings</p>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(teamNames.length, 3)}, 1fr)` }}>
                  {teamNames.map((teamName, index) => {
                    // Get team members
                    const teamMembers = Object.values(game.players).filter(p => p.team === teamName)
                    const memberNames = teamMembers.map(p => p.name).join(", ")
                    
                    return (
                      <div key={teamName} className={`text-center p-4 rounded-lg border ${
                        index === 0 ? 'bg-red-50 border-red-200 text-red-800' :
                        index === 1 ? 'bg-blue-50 border-blue-200 text-blue-800' :
                        index === 2 ? 'bg-green-50 border-green-200 text-green-800' :
                        index === 3 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                        'bg-purple-50 border-purple-200 text-purple-800'
                      }`}>
                        <p className="text-sm font-medium capitalize">{getTeamDisplayName(teamName)}</p>
                        <p className="text-xs text-muted-foreground mb-1">{memberNames}</p>
                        <p className="text-2xl font-bold">{teamScores[teamName] || 0}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

              {/* Individual Player Scores */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Individual Scores</p>
                <div className="space-y-2">
                  {sortedPlayers.map((player, index) => (
                    <div key={player.playerId} className="flex items-center justify-between p-3 bg-background rounded border">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {index === 0 && isGameComplete && (
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          )}
                          <span className="text-lg font-bold text-muted-foreground">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.name}</span>
                            {player.playerId === game.hostId && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {player.team && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {getTeamDisplayName(player.team)}
                              </Badge>
                            )}
                            {!isGameComplete && (
                              <span className="text-xs text-muted-foreground">
                                +{player.roundScore} this round
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{player.totalScore || 0}</p>
                        <p className="text-xs text-muted-foreground">total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Round Details */}
              {currentRound && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Round {game.currentRound} Details</p>
                  <div className="space-y-2">
                    {Object.entries(game.players).map(([playerId, player]) => {
                      const bid = currentRound.bids?.[playerId] || 0
                      const tricks = currentRound.tricks?.[playerId] || 0
                      const score = currentRound.scores?.[playerId] || 0
                      const made = bid === tricks
                      
                      return (
                        <div key={playerId} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <span className="font-medium">{player.name}</span>
                          <div className="flex items-center gap-2">
                            <span>Bid: {bid}</span>
                            <span>Won: {tricks}</span>
                            <Badge variant={made ? 'default' : 'secondary'}>
                              {made ? 'Made' : 'Failed'}
                            </Badge>
                            <span className="font-medium">{score > 0 ? '+' : ''}{score}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Overall Scores Tab */}
            <TabsContent value="overall" className="space-y-6">
              {completedRounds.length > 0 ? (
                <>
                  {/* Overall Team Standings - Only show for team games */}
                  {!isIndividualGame && teamNames.length > 1 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Team Standings</p>
                      <div className="space-y-2">
                        {teamNames
                          .map(teamName => ({ 
                            name: teamName, 
                            score: teamScores[teamName] || 0,
                            members: Object.values(game.players).filter(p => p.team === teamName).map(p => p.name).join(", ")
                          }))
                          .sort((a, b) => b.score - a.score)
                          .map((team, index) => (
                            <div key={team.name} className="flex items-center justify-between p-3 bg-background rounded border">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                                <div>
                                  <span className="font-medium capitalize">{getTeamDisplayName(team.name)}</span>
                                  <p className="text-xs text-muted-foreground">{team.members}</p>
                                </div>
                              </div>
                              <span className="text-xl font-bold">{team.score}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Round-by-Round Scores Table */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Round-by-Round Scores</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Player</th>
                            {completedRounds.map(round => (
                              <th key={round} className="text-center p-2">R{round}</th>
                            ))}
                            <th className="text-center p-2 font-bold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedPlayers.map(player => (
                            <tr key={player.playerId} className="border-b">
                              <td className="p-2 font-medium">{player.name}</td>
                              {completedRounds.map(round => {
                                const roundScore = roundData[round]?.[player.playerId] || 0
                                return (
                                  <td key={round} className="text-center p-2">
                                    <span className={roundScore > 0 ? 'text-green-600' : roundScore < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                                      {roundScore > 0 ? '+' : ''}{roundScore}
                                    </span>
                                  </td>
                                )
                              })}
                              <td className="text-center p-2 font-bold bg-muted/20">{player.totalScore || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cumulative Score Chart */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cumulative Scores</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Player</th>
                            {completedRounds.map(round => (
                              <th key={round} className="text-center p-2">After R{round}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedPlayers.map(player => (
                            <tr key={player.playerId} className="border-b">
                              <td className="p-2 font-medium">{player.name}</td>
                              {completedRounds.map(round => {
                                const cumulativeScore = cumulativeScores[player.playerId]?.[round] || 0
                                return (
                                  <td key={round} className="text-center p-2">
                                    <span className={cumulativeScore > 0 ? 'text-green-600' : cumulativeScore < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                                      {cumulativeScore}
                                    </span>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="font-medium">No completed rounds yet</p>
                  <p className="text-sm">Overall scores will appear after the first round is completed</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="mt-6 space-y-4">
            {isHost && !isGameComplete && (
              <Button onClick={handleNextRound} className="w-full bg-casino-primary hover:bg-primary/90 text-primary-foreground transition-casino">
                <ArrowRight className="h-4 w-4 mr-2" />
                Next Round
              </Button>
            )}

            {isGameComplete && (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-green-800">
                  {teamNames.length > 1 
                    ? `${getTeamDisplayName(teamNames.reduce((winner, team) => teamScores[team] > teamScores[winner] ? team : winner, teamNames[0]))} Wins!`
                    : `${sortedPlayers[0]?.name} Wins!`
                  }
                </p>
                <p className="text-sm text-green-600">
                  Game complete after {game.currentRound} rounds
                </p>
              </div>
            )}

            {!isHost && !isGameComplete && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Waiting for {game.hostName} to start the next round...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
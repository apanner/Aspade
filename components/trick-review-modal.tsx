"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Edit3, Users, Crown, AlertTriangle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type Game = {
  id: string
  players: Record<string, any>
  rounds: any[]
  currentRound: number
  hostId: string
  status: string
}

type TrickReviewModalProps = {
  game: Game
  currentPlayerId: string | null
  isHost: boolean
  onEditTricks: (targetPlayerId: string, newTricks: number) => Promise<void>
  onApproveTricks: () => Promise<void>
}

export function TrickReviewModal({ game, currentPlayerId, isHost, onEditTricks, onApproveTricks }: TrickReviewModalProps) {
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const isOpen = game.status === 'trick_review'
  const currentRound = game.rounds[game.currentRound - 1]
  
  if (!currentRound) return null

  const totalTricks = Object.values(currentRound.tricks || {}).reduce((sum: number, tricks: any) => sum + (tricks || 0), 0)
  const requiredTricks = game.currentRound // Progressive rounds: Round 1 = 1 trick, Round 2 = 2 tricks, etc.
  const isValid = totalTricks === requiredTricks

  const handleEditStart = (playerId: string, currentTricks: number) => {
    if (!isHost) return
    setEditingPlayer(playerId)
    setEditValue(currentTricks.toString())
  }

  const handleEditSave = async (playerId: string) => {
    const newTricks = parseInt(editValue)
    if (isNaN(newTricks) || newTricks < 0 || newTricks > requiredTricks) {
      toast({
        title: "Invalid Tricks",
        description: `Tricks must be between 0 and ${requiredTricks}`,
        variant: "destructive",
      })
      return
    }

    try {
      await onEditTricks(playerId, newTricks)
      setEditingPlayer(null)
      toast({
        title: "Tricks Updated",
        description: `Updated ${game.players[playerId].name}'s tricks to ${newTricks}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update tricks",
        variant: "destructive",
      })
    }
  }

  const handleEditCancel = () => {
    setEditingPlayer(null)
    setEditValue('')
  }

  const handleApprove = async () => {
    if (!isValid) {
      toast({
        title: "Cannot Approve",
        description: `Total tricks must equal exactly ${requiredTricks}`,
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      await onApproveTricks()
      toast({
        title: "Tricks Approved",
        description: "Round completed successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve tricks",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto w-[95vw]" suppressHydrationWarning={true}>
        <DialogHeader suppressHydrationWarning={true}>
          <DialogTitle className="flex items-center gap-2" suppressHydrationWarning={true}>
            <Users className="h-5 w-5" />
            Trick Review & Approval
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <Card suppressHydrationWarning={true}>
            <CardHeader className="pb-3" suppressHydrationWarning={true}>
              <CardTitle className="text-lg flex items-center justify-between" suppressHydrationWarning={true}>
                <span>Round {game.currentRound} Summary</span>
                <Badge 
                  variant={isValid ? "default" : "destructive"}
                  className="text-sm"
                  suppressHydrationWarning={true}
                >
                  Total: {totalTricks}/{requiredTricks}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent suppressHydrationWarning={true}>
              {!isValid && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    Total tricks must equal {requiredTricks}. Current total: {totalTricks}
                  </span>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                {isHost ? "Review and edit player tricks as needed. Total must equal the round number before approval." : "Waiting for host to review and approve the tricks."}
              </div>
            </CardContent>
          </Card>

          {/* Player List */}
          <div className="space-y-3">
            {Object.entries(game.players).map(([playerId, player]: [string, any]) => {
              const bid = currentRound.bids?.[playerId] || 0
              const tricks = currentRound.tricks?.[playerId] || 0
              const isEditing = editingPlayer === playerId
              const madeContract = bid === tricks

              return (
                <Card key={playerId} className="hover:bg-secondary/20 transition-colors" suppressHydrationWarning={true}>
                  <CardContent className="p-4" suppressHydrationWarning={true}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.name}</span>
                          {playerId === game.hostId && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                          {playerId === currentPlayerId && (
                            <Badge variant="outline" className="text-xs" suppressHydrationWarning={true}>You</Badge>
                          )}
                        </div>
                        
                        <Badge 
                          variant={madeContract ? "default" : "secondary"}
                          className="text-xs"
                          suppressHydrationWarning={true}
                        >
                          {madeContract ? "Contract Made" : "Contract Missed"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Bid (non-editable) */}
                        <div className="text-sm">
                          <span className="text-muted-foreground">B:</span>
                          <span className="font-bold ml-1">{bid}</span>
                        </div>

                        {/* Tricks (editable for host) */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">W:</span>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max={requiredTricks.toString()}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-16 h-8 text-center"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditSave(playerId)
                                  } else if (e.key === 'Escape') {
                                    handleEditCancel()
                                  }
                                }}
                                autoFocus
                                suppressHydrationWarning={true}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditSave(playerId)}
                                className="h-8 px-2"
                                suppressHydrationWarning={true}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleEditCancel}
                                className="h-8 px-2"
                                suppressHydrationWarning={true}
                              >
                                ×
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold min-w-[20px] text-center">{tricks}</span>
                              {isHost && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditStart(playerId, tricks)}
                                  className="h-6 w-6 p-0"
                                  suppressHydrationWarning={true}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Actions */}
          {isHost && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleApprove}
                disabled={!isValid || submitting}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                size="lg"
                suppressHydrationWarning={true}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Approving...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Continue
                  </>
                )}
              </Button>
            </div>
          )}

          {!isHost && (
            <div className="text-center p-4 bg-secondary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Waiting for host to review and approve the trick distribution...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 
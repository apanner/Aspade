"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { useToast } from "../../../hooks/use-toast";
import { gameAPI, sessionStorage, APIError, GamePoller, gameUtils, type Game } from "../../../lib/api";
import { 
  Users, 
  Crown, 
  Copy, 
  Play, 
  ArrowRight, 
  Trophy,
  Home,
  Loader2,
  CheckCircle,
  Clock
} from "lucide-react";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const gameId = params.gameId as string;
  const pollerRef = useRef<GamePoller | null>(null);
  
  // State
  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bidInput, setBidInput] = useState("");
  const [tricksInput, setTricksInput] = useState("");

  // Initialize game and polling
  useEffect(() => {
    const initGame = async () => {
      try {
        // Get player session
        const session = sessionStorage.getPlayerSession();
        if (!session || session.gameId !== gameId) {
          router.push("/");
          return;
        }

        setCurrentPlayer(session.playerId);

        // Get initial game state
        const response = await gameAPI.getGameState(gameId);
        setGame(response.game);

        // Start polling
        pollerRef.current = new GamePoller();
        pollerRef.current.onGameUpdate((updatedGame) => {
          setGame(updatedGame);
        });
        pollerRef.current.startPolling(gameId, response.game.status);

      } catch (error) {
        console.error("Error initializing game:", error);
        toast({
          title: "Error",
          description: "Failed to load game",
          variant: "destructive",
        });
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    initGame();

    // Cleanup on unmount
    return () => {
      if (pollerRef.current) {
        pollerRef.current.stopPolling();
      }
    };
  }, [gameId, router, toast]);

  // Actions
  const handleCopyCode = () => {
    if (game) {
      navigator.clipboard.writeText(game.code);
      toast({
        title: "Copied!",
        description: "Game code copied to clipboard",
      });
    }
  };

  const handleStartGame = async () => {
    if (!game || !currentPlayer) return;
    
    setActionLoading(true);
    try {
      await gameAPI.startGame(gameId, currentPlayer);
      toast({
        title: "Game Started!",
        description: "Time to place your bids",
      });
    } catch (error) {
      console.error("Error starting game:", error);
      const errorMessage = error instanceof APIError ? error.message : "Failed to start game";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !currentPlayer || !bidInput.trim()) return;
    
    const bid = parseInt(bidInput.trim());
    if (isNaN(bid) || bid < 0 || bid > (game?.currentRound || 13)) {
      toast({
        title: "Invalid Bid",
        description: `Bid must be between 0 and ${game?.currentRound || 13}`,
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await gameAPI.submitBid(gameId, currentPlayer, bid);
      setBidInput("");
      toast({
        title: "Bid Submitted!",
        description: `You bid ${bid} tricks`,
      });
    } catch (error) {
      console.error("Error submitting bid:", error);
      const errorMessage = error instanceof APIError ? error.message : "Failed to submit bid";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitTricks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !currentPlayer || !tricksInput.trim()) return;
    
    const tricks = parseInt(tricksInput.trim());
    if (isNaN(tricks) || tricks < 0 || tricks > (game?.currentRound || 13)) {
      toast({
        title: "Invalid Tricks",
        description: `Tricks must be between 0 and ${game?.currentRound || 13}`,
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await gameAPI.submitTricks(gameId, currentPlayer, tricks);
      setTricksInput("");
      toast({
        title: "Tricks Submitted!",
        description: `You won ${tricks} tricks`,
      });
    } catch (error) {
      console.error("Error submitting tricks:", error);
      const errorMessage = error instanceof APIError ? error.message : "Failed to submit tricks";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextRound = async () => {
    if (!game || !currentPlayer) return;
    
    setActionLoading(true);
    try {
      await gameAPI.nextRound(gameId, currentPlayer);
      toast({
        title: "Next Round!",
        description: game.currentRound >= game.maxRounds ? "Game complete!" : "Time for the next round",
      });
    } catch (error) {
      console.error("Error advancing round:", error);
      const errorMessage = error instanceof APIError ? error.message : "Failed to advance round";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGame = () => {
    sessionStorage.clearPlayerSession();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="container max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game || !currentPlayer) {
    return (
      <div className="container max-w-md mx-auto p-4 min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Game Not Found</CardTitle>
            <CardDescription>This game may have ended or doesn't exist</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const player = game.players[currentPlayer];
  const isHost = player?.isHost;
  const redTeam = gameUtils.getTeamMembers(game, 'red');
  const blueTeam = gameUtils.getTeamMembers(game, 'blue');
  const currentRound = gameUtils.getCurrentRound(game);

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">SpadeSync Lite</h1>
            <p className="text-sm text-muted-foreground">
              Round {game.currentRound} of {game.maxRounds}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {gameUtils.formatGameCode(game.code)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleCopyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant={game.status === 'completed' ? 'default' : 'secondary'}>
            {game.status === 'lobby' && 'Waiting for Players'}
            {game.status === 'bidding' && 'Bidding Phase'}
            {game.status === 'playing' && 'Playing Phase'}
            {game.status === 'scoring' && 'Scoring Phase'}
            {game.status === 'completed' && 'Game Complete'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleLeaveGame}>
            <Home className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-600">Red Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {redTeam.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{p.name}</span>
                  {p.isHost && <Crown className="h-3 w-3 text-yellow-500" />}
                </div>
                {currentRound && (
                  <div className="flex items-center gap-1">
                    {gameUtils.hasPlayerBid(game, p.id) && game.status !== 'lobby' && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                    {gameUtils.hasPlayerTricks(game, p.id) && game.status === 'playing' && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="text-xl font-bold text-red-600 pt-2 border-t">
              {game.scores.red}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-600">Blue Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {blueTeam.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{p.name}</span>
                  {p.isHost && <Crown className="h-3 w-3 text-yellow-500" />}
                </div>
                {currentRound && (
                  <div className="flex items-center gap-1">
                    {gameUtils.hasPlayerBid(game, p.id) && game.status !== 'lobby' && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                    {gameUtils.hasPlayerTricks(game, p.id) && game.status === 'playing' && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="text-xl font-bold text-blue-600 pt-2 border-t">
              {game.scores.blue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Status & Actions */}
      {game.status === 'lobby' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Waiting for Players
            </CardTitle>
            <CardDescription>
              Need at least 2 players to start. Share code: {game.code}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isHost && Object.keys(game.players).length >= 2 && (
              <Button onClick={handleStartGame} disabled={actionLoading} className="w-full">
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Game
                  </>
                )}
              </Button>
            )}
            {!isHost && (
              <div className="text-center text-muted-foreground">
                <Clock className="h-6 w-6 mx-auto mb-2" />
                <p>Waiting for host to start the game</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {game.status === 'bidding' && (
        <Card>
          <CardHeader>
            <CardTitle>Place Your Bid</CardTitle>
            <CardDescription>
                              How many tricks do you think you'll win? (0-{game?.currentRound || 13})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!gameUtils.hasPlayerBid(game, currentPlayer) ? (
              <form onSubmit={handleSubmitBid} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bid">Your Bid</Label>
                  <Input
                    id="bid"
                    type="number"
                    min="0"
                                      max={game?.currentRound?.toString() || "13"}
                  placeholder={`Enter bid (0-${game?.currentRound || 13})`}
                    value={bidInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBidInput(e.target.value)}
                    className="text-center text-lg"
                  />
                </div>
                <Button type="submit" disabled={actionLoading} className="w-full">
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Bid"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">Bid Submitted!</p>
                <p className="text-muted-foreground">
                  You bid {currentRound?.bids[currentPlayer]} tricks
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Waiting for other players...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {game.status === 'playing' && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Tricks Won</CardTitle>
            <CardDescription>
                              How many tricks did you actually win? (0-{game?.currentRound || 13})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!gameUtils.hasPlayerTricks(game, currentPlayer) ? (
              <form onSubmit={handleSubmitTricks} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tricks">Tricks Won</Label>
                  <Input
                    id="tricks"
                    type="number"
                    min="0"
                                      max={game?.currentRound?.toString() || "13"}
                  placeholder={`Enter tricks won (0-${game?.currentRound || 13})`}
                    value={tricksInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTricksInput(e.target.value)}
                    className="text-center text-lg"
                  />
                </div>
                <Button type="submit" disabled={actionLoading} className="w-full">
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Tricks"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">Tricks Submitted!</p>
                <p className="text-muted-foreground">
                  You won {currentRound?.tricks[currentPlayer]} tricks
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Waiting for other players...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {game.status === 'scoring' && (
        <Card>
          <CardHeader>
            <CardTitle>Round {game.currentRound} Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentRound && (
              <div className="space-y-3">
                {Object.entries(game.players).map(([playerId, player]) => (
                  <div key={playerId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">{player.name}</span>
                      <span className={`ml-2 text-sm ${player.team === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
                        ({player.team})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Bid: {currentRound.bids[playerId]} | Won: {currentRound.tricks[playerId]}
                      </div>
                      <div className="font-bold">
                        {currentRound.scores[playerId] > 0 ? '+' : ''}{currentRound.scores[playerId]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {isHost && (
              <Button onClick={handleNextRound} disabled={actionLoading} className="w-full">
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Advancing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {game.currentRound >= game.maxRounds ? "Complete Game" : "Next Round"}
                  </>
                )}
              </Button>
            )}
            
            {!isHost && (
              <div className="text-center text-muted-foreground">
                <Clock className="h-6 w-6 mx-auto mb-2" />
                <p>Waiting for host to advance to next round</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {game.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              Game Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              {(() => {
                const winner = gameUtils.getWinningTeam(game);
                if (winner === 'tie') {
                  return <p className="text-lg font-medium">It's a tie!</p>;
                } else {
                  return (
                    <p className="text-lg font-medium">
                      <span className={winner === 'red' ? 'text-red-600' : 'text-blue-600'}>
                        {winner === 'red' ? 'Red' : 'Blue'} Team Wins!
                      </span>
                    </p>
                  );
                }
              })()}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{game.scores.red}</div>
                <div className="text-sm text-muted-foreground">Red Team</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{game.scores.blue}</div>
                <div className="text-sm text-muted-foreground">Blue Team</div>
              </div>
            </div>
            
            <Button onClick={handleLeaveGame} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              New Game
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
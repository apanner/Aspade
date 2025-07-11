"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { 
  ArrowLeft, 
  Trash2, 
  Users, 
  GamepadIcon,
  Search,
  RefreshCw,
  Crown,
  Calendar,
  Clock,
  Trophy
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Player = {
  id: string
  name: string
  email?: string
  gamesPlayed: number
  lastSeen: string
  isOnline: boolean
}

type Game = {
  id: string
  title: string
  code: string
  host: string
  players: number
  status: "lobby" | "playing" | "completed"
  createdAt: string
  lastActivity: string
}

export function AdminPanel() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<Player[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())
  const [searchPlayers, setSearchPlayers] = useState("")
  const [searchGames, setSearchGames] = useState("")
  const [activeTab, setActiveTab] = useState<"players" | "games">("games")
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch data from API
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch games from API
      const gamesResponse = await fetch('/api/admin/games')
      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json()
        const validGames = (gamesData.games || []).filter((game: any) => game && game.id)
        setGames(validGames)
      } else {
        console.error('Failed to fetch games:', gamesResponse.status)
        setGames([])
      }
      
      // Fetch players from API
      const playersResponse = await fetch('/api/admin/players')
      if (playersResponse.ok) {
        const playersData = await playersResponse.json()
        const validPlayers = (playersData.players || []).filter((player: any) => player && player.id && player.name)
        setPlayers(validPlayers)
      } else {
        console.error('Failed to fetch players:', playersResponse.status)
        setPlayers([])
      }
      
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      setGames([])
      setPlayers([])
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePlayerSelection = (playerId: string, checked: boolean) => {
    const newSelected = new Set(selectedPlayers)
    if (checked) {
      newSelected.add(playerId)
    } else {
      newSelected.delete(playerId)
    }
    setSelectedPlayers(newSelected)
  }

  const handleGameSelection = (gameId: string, checked: boolean) => {
    const newSelected = new Set(selectedGames)
    if (checked) {
      newSelected.add(gameId)
    } else {
      newSelected.delete(gameId)
    }
    setSelectedGames(newSelected)
  }

  const handleDeleteSelectedPlayers = async () => {
    try {
      const playerIds = Array.from(selectedPlayers)
      
      const response = await fetch('/api/admin/players', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerIds }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Refresh the players list
        await fetchData()
        setSelectedPlayers(new Set())
        
        toast({
          title: "Success",
          description: result.message || `Deleted ${playerIds.length} player(s)`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete players')
      }
    } catch (error) {
      console.error('Delete players error:', error)
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete players",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSelectedGames = async () => {
    try {
      const gameIds = Array.from(selectedGames)
      
      const response = await fetch('/api/admin/games', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameIds }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Refresh the games list
        await fetchData()
        setSelectedGames(new Set())
        
        toast({
          title: "Success",
          description: result.message || `Deleted ${gameIds.length} game(s)`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete games')
      }
    } catch (error) {
      console.error('Delete games error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete games", 
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    setRefreshKey(prev => prev + 1)
    await fetchData()
  }

  const filteredPlayers = players.filter(player => {
    if (!player || !player.name) return false
    const playerName = player.name.toLowerCase()
    const searchTerm = searchPlayers.toLowerCase()
    const nameMatch = playerName.includes(searchTerm)
    const emailMatch = player.email && player.email.toLowerCase().includes(searchTerm)
    return nameMatch || emailMatch
  })

  const filteredGames = games.filter(game => {
    if (!game) return false
    const searchTerm = searchGames.toLowerCase()
    const titleMatch = game.title && game.title.toLowerCase().includes(searchTerm)
    const codeMatch = game.code && game.code.toLowerCase().includes(searchTerm)
    const hostMatch = game.host && game.host.toLowerCase().includes(searchTerm)
    return titleMatch || codeMatch || hostMatch
  })

  const getStatusBadge = (status: Game["status"]) => {
    switch (status) {
      case "lobby":
        return <Badge variant="secondary">Lobby</Badge>
      case "playing":
        return <Badge className="bg-gradient-team-blue text-white">Playing</Badge>
      case "completed":
        return <Badge className="bg-gradient-team-green text-white">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center gap-2 text-amber-400">
          <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full"></div>
          <span className="text-lg">Loading admin panel...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-start justify-center">
      <div key={`admin-${refreshKey}-${games.length}-${players.length}`} className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-lg shadow-2xl border border-slate-600/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-1 text-slate-300 hover:text-amber-400 hover:bg-slate-700/50">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-1 bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-600/50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown className="h-6 w-6 text-amber-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            </div>
            <p className="text-xs text-amber-400/90 font-medium">A-SPADE ONLINE MANAGEMENT</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{players.length}</div>
              <div className="text-sm text-slate-400">Total Players</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <GamepadIcon className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{games.length}</div>
              <div className="text-sm text-slate-400">Total Games</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{players.filter(p => p.isOnline).length}</div>
              <div className="text-sm text-slate-400">Online Now</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg w-fit border border-slate-700/50">
          <Button
            variant={activeTab === "games" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("games")}
            className={`gap-1 ${activeTab === "games" ? "bg-amber-500 text-white" : "text-slate-300 hover:text-white hover:bg-slate-700/50"}`}
          >
            <GamepadIcon className="h-4 w-4" />
            Games
          </Button>
          <Button
            variant={activeTab === "players" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("players")}
            className={`gap-1 ${activeTab === "players" ? "bg-amber-500 text-white" : "text-slate-300 hover:text-white hover:bg-slate-700/50"}`}
          >
            <Users className="h-4 w-4" />
            Players
          </Button>
        </div>

        {/* Games Tab */}
        {activeTab === "games" && (
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <GamepadIcon className="h-5 w-5 text-amber-400" />
                    Games Management
                  </CardTitle>
                  <CardDescription className="text-slate-400">Manage game history and active games</CardDescription>
                </div>
              <div className="flex items-center gap-2">
                {selectedGames.size > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1">
                        <Trash2 className="h-4 w-4" />
                        Delete ({selectedGames.size})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Selected Games</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedGames.size} game(s)? This will permanently remove their data files and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelectedGames}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games..."
                value={searchGames}
                onChange={(e) => setSearchGames(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedGames.size === filteredGames.length && filteredGames.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGames(new Set(filteredGames.map(g => g.id)))
                        } else {
                          setSelectedGames(new Set())
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGames.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedGames.has(game.id)}
                        onCheckedChange={(checked) => handleGameSelection(game.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{game.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{game.code}</Badge>
                    </TableCell>
                    <TableCell>{game.host}</TableCell>
                    <TableCell>{game.players}</TableCell>
                    <TableCell>{getStatusBadge(game.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {game.createdAt}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {game.lastActivity}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredGames.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No games found matching your search.
              </div>
            )}
          </CardContent>
        </Card>
      )}

        {/* Players Tab */}
        {activeTab === "players" && (
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="h-5 w-5 text-amber-400" />
                    Players Management
                  </CardTitle>
                  <CardDescription className="text-slate-400">Manage player accounts and data</CardDescription>
                </div>
              <div className="flex items-center gap-2">
                {selectedPlayers.size > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1">
                        <Trash2 className="h-4 w-4" />
                        Delete ({selectedPlayers.size})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Selected Players</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedPlayers.size} player(s)? This will permanently remove their accounts and game history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelectedPlayers}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchPlayers}
                onChange={(e) => setSearchPlayers(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPlayers.size === filteredPlayers.length && filteredPlayers.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPlayers(new Set(filteredPlayers.map(p => p.id)))
                        } else {
                          setSelectedPlayers(new Set())
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Games Played</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPlayers.has(player.id)}
                        onCheckedChange={(checked) => handlePlayerSelection(player.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {player.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                        {player.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{player.email}</TableCell>
                    <TableCell>{player.gamesPlayed}</TableCell>
                    <TableCell>
                      <Badge variant={player.isOnline ? "default" : "secondary"}>
                        {player.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{player.lastSeen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredPlayers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No players found matching your search.
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
} 
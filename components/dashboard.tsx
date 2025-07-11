"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  PlusCircle, 
  History, 
  LogOut, 
  Users, 
  Trophy, 
  Spade,
  Database,
  Loader2
} from "lucide-react"
import { GameCard } from "@/components/game-card"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

type Game = {
  id: string
  title: string
  hostId: string
  hostName: string
  createdAt: number
  currentRound: number
  totalRounds: number
  players: Record<string, any>
  status?: string
}

export function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeGames, setActiveGames] = useState<Game[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [currentBackend] = useState('Express.js') // Current backend provider

  useEffect(() => {
    console.log('🏠 Dashboard useEffect - loading:', loading, 'user:', user)
    
    if (!loading && !user) {
      console.log('❌ No user found, redirecting to login')
      router.push("/")
      return
    }

    if (user) {
      console.log('✅ User authenticated, loading dashboard for:', user.name)
      // Mock active games for now - in real implementation would fetch from API
      const fetchGames = async () => {
        try {
          // TODO: Implement getUserActiveGames API call
          setActiveGames([])
        } catch (error) {
          console.error("Error fetching games:", error)
          toast({
            title: "❌ Error",
            description: "Failed to load your active games",
            variant: "destructive",
          })
        } finally {
          setGamesLoading(false)
        }
      }

      fetchGames()
    }
  }, [user, loading, router, toast])

  const handleSignOut = async () => {
    try {
      signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "❌ Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center gap-2 text-amber-400">
          <Loader2 className="animate-spin w-8 h-8" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-start justify-center">
      <div className="container max-w-md mx-auto p-4 space-y-6">
        {/* Game Logo and Title */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-lg shadow-2xl border border-slate-600/50 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-amber-500/20 rounded-full p-2.5 border-2 border-amber-500/30">
              <Spade className="h-10 w-10 text-amber-400" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">A-SPADE Online</h1>
              <p className="text-xs text-amber-400/90 font-medium">MOBILE SPADES EXPERIENCE</p>
            </div>
          </div>
        </div>
      
        {/* User Profile */}
        <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg shadow-xl border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Avatar className="border-2 border-amber-500/30">
              <AvatarImage src="" alt={user.name} />
              <AvatarFallback className="bg-amber-500/20 text-amber-400 font-bold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-semibold text-white">{user.name}</h2>
              <p className="text-xs text-slate-400">{user.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Database className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-amber-400">{currentBackend}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:bg-red-500/10 text-slate-400 hover:text-red-400">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-3 mb-4">
          <Link href="/create-game" className="no-underline flex-1">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-medium py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:scale-105">
              <PlusCircle className="h-4 w-4" />
              Create Game
            </div>
          </Link>
          <Link href="/join-game" className="no-underline flex-1">
            <div className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 text-sm font-medium py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:scale-105 border border-slate-600/50">
              <Users className="h-4 w-4" />
              Join Game
            </div>
          </Link>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Link href="/history" passHref className="no-underline">
            <div className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg p-4 h-24 flex flex-col items-center justify-center gap-1.5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 backdrop-blur-sm">
              <History className="h-6 w-6 text-amber-400" />
              <span className="font-semibold text-sm text-white">History</span>
            </div>
          </Link>
          <Link href="/leaderboard" passHref className="no-underline">
            <div className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg p-4 h-24 flex flex-col items-center justify-center gap-1.5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 backdrop-blur-sm">
              <Trophy className="h-6 w-6 text-amber-400" />
              <span className="font-semibold text-sm text-white">Leaderboard</span>
            </div>
          </Link>
        </div>

        {/* Active Games Section */}
        <div className="mt-2">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2.5 rounded-t-lg border border-slate-700/50 flex items-center justify-between backdrop-blur-sm">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-white">
              <Spade className="h-4 w-4 text-amber-400" />
              Active Games
            </h3>
            {activeGames.length > 0 && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs px-2">
                {activeGames.length} {activeGames.length === 1 ? 'Game' : 'Games'}
              </Badge>
            )}
          </div>

          <div className="border-x border-b border-slate-700/50 rounded-b-lg overflow-hidden shadow-xl backdrop-blur-sm">
            {gamesLoading ? (
              <div className="flex items-center justify-center py-8 bg-slate-800/30">
                <div className="flex items-center gap-2 text-amber-400">
                  <Loader2 className="animate-spin h-6 w-6" />
                  <span className="text-sm">Loading games...</span>
                </div>
              </div>
            ) : activeGames.length > 0 ? (
              <div className="divide-y divide-slate-700/30">
                {activeGames
                  .filter(game => game.status === "in_progress")
                  .slice(0, 2)
                  .map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
              </div>
            ) : (
              <div className="bg-slate-800/30 p-6 flex flex-col items-center justify-center text-center">
                <div className="bg-amber-500/10 rounded-full p-3 mb-3">
                  <Spade className="h-6 w-6 text-amber-400" />
                </div>
                <p className="text-sm font-medium text-slate-300">No active games</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Create a new game or join an existing one</p>
                <div className="flex gap-3">
                  <Link href="/create-game" className="no-underline">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-300 flex items-center gap-1">
                      <PlusCircle className="h-3.5 w-3.5" />
                      Create Game
                    </div>
                  </Link>
                  <Link href="/join-game" className="no-underline">
                    <div className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-300 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Join Game
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
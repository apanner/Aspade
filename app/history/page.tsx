"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GameHistory } from "@/components/game-history"
import { useAuth } from "@/components/auth-provider"

// Sample gaming data for demonstration - in real app this would come from API
const sampleHistoryGames = [
  {
    id: "EPIC1",
    title: "Epic Spades Championship",
    hostId: "user1",
    hostName: "Alex",
    completedAt: Date.now() - 86400000, // 1 day ago
    totalRounds: 10,
    duration: 45,
    players: {
      user1: { name: "You", team: "red", avatar: "" },
      user2: { name: "Sarah", team: "red", avatar: "" },
      user3: { name: "Mike", team: "blue", avatar: "" },
      user4: { name: "Emma", team: "blue", avatar: "" }
    },
    rounds: [
      {
        roundNumber: 1,
        bids: { user1: 3, user2: 2, user3: 4, user4: 1 },
        tricks: { user1: 3, user2: 3, user3: 3, user4: 1 },
        scores: { user1: 33, user2: 21, user3: 31, user4: 11 },
        teamScores: { red: 54, blue: 42 }
      },
      {
        roundNumber: 2,
        bids: { user1: 4, user2: 3, user3: 2, user4: 3 },
        tricks: { user1: 4, user2: 2, user3: 2, user4: 4 },
        scores: { user1: 44, user2: 22, user3: 22, user4: 34 },
        teamScores: { red: 66, blue: 56 }
      },
      // More rounds...
    ],
    finalScores: { user1: 420, user2: 380, user3: 350, user4: 390 },
    teamFinalScores: { red: 800, blue: 740 },
    winnerTeam: "red"
  },
  {
    id: "CLASH2",
    title: "Friday Night Clash",
    hostId: "user2",
    hostName: "Sarah",
    completedAt: Date.now() - 259200000, // 3 days ago
    totalRounds: 8,
    duration: 32,
    players: {
      user1: { name: "You", team: "blue", avatar: "" },
      user2: { name: "Sarah", team: "red", avatar: "" },
      user3: { name: "Alex", team: "red", avatar: "" },
      user4: { name: "Jordan", team: "blue", avatar: "" }
    },
    rounds: [
      {
        roundNumber: 1,
        bids: { user1: 2, user2: 4, user3: 3, user4: 3 },
        tricks: { user1: 1, user2: 4, user3: 4, user4: 3 },
        scores: { user1: 12, user2: 44, user3: 34, user4: 33 },
        teamScores: { blue: 45, red: 78 }
      }
    ],
    finalScores: { user1: 290, user2: 410, user3: 390, user4: 310 },
    teamFinalScores: { blue: 600, red: 800 },
    winnerTeam: "red"
  }
]

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [games, setGames] = useState(sampleHistoryGames)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
      return
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return <GameHistory user={user} games={games} />
} 
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LeaderboardPage() {
  return (
    <div className="container max-w-md mx-auto p-4">
      <div className="mb-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top players across all games</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No leaderboard data available yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Play some games to see rankings here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
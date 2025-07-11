"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { gameAPI, sessionStorage } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  Users, 
  Hash, 
  UserPlus,
  Sparkles,
  Bot,
  AlertCircle,
  Info
} from "lucide-react"
import Link from "next/link"

export function JoinGameForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    gameCode: "",
    playerName: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'gameCode' ? value.toUpperCase() : value 
    }))
  }

  const isAutoMode = formData.playerName.toLowerCase() === 'auto'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.gameCode.trim()) {
      toast({
        title: "Missing Game Code",
        description: "Please enter the 4-letter game code",
        variant: "destructive",
      })
      return
    }

    if (formData.gameCode.length !== 4) {
      toast({
        title: "Invalid Game Code",
        description: "Game code must be exactly 4 letters",
        variant: "destructive",
      })
      return
    }

    if (!formData.playerName.trim()) {
      toast({
        title: "Missing Player Name",
        description: "Please enter your name to join",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const response = await gameAPI.joinGame(formData.gameCode.trim(), formData.playerName.trim())

      // Save session
      sessionStorage.savePlayerSession(
        response.game.id,
        response.playerId,
        formData.playerName.trim()
      )

      // Show special message for auto mode
      if (response.autoMode || isAutoMode) {
        toast({
          title: "🤖 Auto Mode Activated!",
          description: "Computer players added! Game starting automatically...",
        })
      } else {
        toast({
          title: "Joined Successfully!",
          description: `Welcome to ${response.game.hostName}'s game!`,
        })
      }

      router.push(`/games/${response.game.id}`)
    } catch (error) {
      console.error("Error joining game:", error)
      toast({
        title: "Failed to Join Game",
        description: "Please check the code and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
              <h1 className="text-lg font-semibold text-casino-primary flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Join Game
              </h1>
              <p className="text-xs text-muted-foreground">Enter your friend's game code</p>
            </div>

            <div className="w-8"></div> {/* Spacer for centering */}
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Game Code Section */}
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-casino-accent" />
              Game Code
            </CardTitle>
            <CardDescription>Enter the 4-letter code from your host</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gameCode" className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-casino-primary" />
                Code
              </Label>
              <Input
                id="gameCode"
                name="gameCode"
                placeholder="ABCD"
                value={formData.gameCode}
                onChange={handleChange}
                maxLength={4}
                className="text-center text-2xl font-mono tracking-widest bg-secondary/20 border-casino-subtle transition-casino"
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                Game codes are 4 letters (case insensitive)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Player Info Section */}
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-casino-accent" />
              Player Information
            </CardTitle>
            <CardDescription>How you'll appear to other players</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-casino-primary" />
                Your Name
              </Label>
              <Input
                id="playerName"
                name="playerName"
                placeholder="Enter your name"
                value={formData.playerName}
                onChange={handleChange}
                maxLength={20}
                className="bg-secondary/20 border-casino-subtle transition-casino"
                required
              />
            </div>

            {/* Auto Mode Info */}
            <Alert className="border-blue-500/30 bg-blue-500/10">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-700">Quick Test Mode</AlertTitle>
              <AlertDescription className="text-blue-600">
                Type <span className="font-mono bg-blue-500/20 px-1 rounded">auto</span> as your name to instantly play with 3 computer players!
              </AlertDescription>
            </Alert>

            {/* Auto Mode Visual Feedback */}
            {isAutoMode && (
              <Alert className="border-green-500/30 bg-green-500/10">
                <Bot className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-700">Auto Mode Detected!</AlertTitle>
                <AlertDescription className="text-green-600">
                  You'll be joined with 3 AI players automatically. Perfect for testing!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Join Button */}
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardContent className="p-4">
            <Button 
              type="submit" 
              className="w-full bg-casino-primary hover:bg-primary/90 text-primary-foreground transition-casino transform-casino-hover"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                  Joining Game...
                </div>
              ) : (
                <>
                  {isAutoMode ? (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Join with AI Players
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Game
                    </>
                  )}
                </>
              )}
            </Button>
            
            {!loading && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                {isAutoMode ? 
                  "Perfect for testing game scenarios" :
                  "Make sure you have the correct code from your host"
                }
              </p>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-casino-accent flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-casino-primary">Need Help?</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Ask your friend for their 4-letter game code</p>
                  <p>• Game codes are shown in the game lobby</p>
                  <p>• Type "auto" to practice with computer players</p>
                  <p>• Make sure you're joining the right game!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 
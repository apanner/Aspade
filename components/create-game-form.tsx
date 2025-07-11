"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { gameAPI, sessionStorage } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  RefreshCw, 
  Plus, 
  Users, 
  Clock, 
  Trophy,
  Spade,
  Settings,
  Eye,
  EyeOff,
  Timer,
  AlertCircle,
  Sparkles,
  Shuffle
} from "lucide-react"
import Link from "next/link"

// Auto-generated title options
const TITLE_PREFIXES = [
  "Friday Night",
  "Weekend",
  "Epic",
  "Legendary",
  "Ultimate",
  "Championship",
  "Elite",
  "Master",
  "Pro",
  "Victory"
]

const TITLE_SUFFIXES = [
  "Spades",
  "Showdown",
  "Battle",
  "Challenge",
  "Tournament",
  "Championship",
  "Legends",
  "Warriors",
  "Masters",
  "Heroes"
]

// Team names and colors
const TEAM_NAMES = [
  "Spade Aces", "Diamond Kings", "Heart Queens", "Club Jacks",
  "Thunder Bolts", "Lightning Strikes", "Storm Riders", "Fire Dragons",
  "Mighty Eagles", "Roaring Lions", "Swift Panthers", "Brave Wolves",
  "Golden Hawks", "Silver Foxes", "Bronze Bears", "Iron Tigers",
  "Crimson Crusaders", "Azure Arrows", "Emerald Eagles", "Violet Vipers",
  "Royal Flush", "Straight Shooters", "Wild Cards", "Full House",
  "Ace Pilots", "King Makers", "Queen Bees", "Jack Rabbits",
  "Shadow Ninjas", "Cyber Knights", "Neon Rebels", "Plasma Pirates"
]

const TEAM_COLORS = [
  { name: "Crimson", color: "#ef4444", bg: "bg-red-500" },
  { name: "Azure", color: "#3b82f6", bg: "bg-blue-500" },
  { name: "Emerald", color: "#10b981", bg: "bg-emerald-500" },
  { name: "Violet", color: "#8b5cf6", bg: "bg-purple-500" },
  { name: "Amber", color: "#f59e0b", bg: "bg-amber-500" },
  { name: "Rose", color: "#ec4899", bg: "bg-pink-500" },
  { name: "Teal", color: "#14b8a6", bg: "bg-teal-500" },
  { name: "Indigo", color: "#6366f1", bg: "bg-indigo-500" },
  { name: "Lime", color: "#84cc16", bg: "bg-lime-500" },
  { name: "Cyan", color: "#06b6d4", bg: "bg-cyan-500" },
  { name: "Orange", color: "#f97316", bg: "bg-orange-500" },
  { name: "Fuchsia", color: "#d946ef", bg: "bg-fuchsia-500" }
]

export function CreateGameForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [gameData, setGameData] = useState({
    title: "",
    totalRounds: "13",
    cardProgressionMode: "increasing",
    biddingStyle: "visible",
    scoringSystem: "standard",
    grouping: "individual",
    maxPlayers: "4",
    enableTimer: false,
    timerDuration: "60",
    bidTimer: "300",
    description: "",
    hostName: "",
    // Team configuration
    gameMode: "teams",
    numberOfTeams: "2",
    playersPerTeam: "2",
    autoAssignTeams: true,
  })

  // Team configuration state
  const [teamConfigs, setTeamConfigs] = useState<Array<{
    id: string;
    name: string;
    color: string;
    colorName: string;
    bg: string;
  }>>([])

  // Generate random teams
  const generateRandomTeams = (count: number) => {
    const usedNames = new Set<string>()
    const usedColors = new Set<number>()
    const teams = []

    for (let i = 0; i < count; i++) {
      // Get random unused name
      let name = ""
      do {
        name = TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)]
      } while (usedNames.has(name))
      usedNames.add(name)

      // Get random unused color
      let colorIndex = 0
      do {
        colorIndex = Math.floor(Math.random() * TEAM_COLORS.length)
      } while (usedColors.has(colorIndex))
      usedColors.add(colorIndex)

      const colorConfig = TEAM_COLORS[colorIndex]
      teams.push({
        id: `team${i + 1}`,
        name,
        color: colorConfig.color,
        colorName: colorConfig.name,
        bg: colorConfig.bg
      })
    }

    return teams
  }

  // Auto-generate title and populate host name on component mount
  useEffect(() => {
    const generateRandomTitle = () => {
      const prefix = TITLE_PREFIXES[Math.floor(Math.random() * TITLE_PREFIXES.length)]
      const suffix = TITLE_SUFFIXES[Math.floor(Math.random() * TITLE_SUFFIXES.length)]
      return `${prefix} ${suffix}`
    }
    
    // Get existing player session if available
    const existingSession = sessionStorage.getPlayerSession()
    const hostName = existingSession?.playerName || ""
    
    console.log("Create Game Form - Session check:", { existingSession, hostName })
    
    // Generate default title - just use the random title, not the host name
    const gameTitle = generateRandomTitle()
    
    setGameData((prev) => ({ 
      ...prev, 
      title: gameTitle,
      hostName: hostName
    }))
    
    // Generate initial teams
    const initialTeams = generateRandomTeams(2)
    setTeamConfigs(initialTeams)
    
    // Show info if no session found
    if (!existingSession) {
      console.log("No existing session found - user needs to login first")
    }
  }, [])

  // Update teams when numberOfTeams changes
  useEffect(() => {
    if (gameData.gameMode === "teams") {
      const count = parseInt(gameData.numberOfTeams)
      if (count > 0 && count <= 6) {
        const newTeams = generateRandomTeams(count)
        setTeamConfigs(newTeams)
      }
    }
  }, [gameData.numberOfTeams, gameData.gameMode])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setGameData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setGameData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setGameData((prev) => ({ ...prev, [name]: checked }))
  }

  const generateNewTitle = () => {
    const prefix = TITLE_PREFIXES[Math.floor(Math.random() * TITLE_PREFIXES.length)]
    const suffix = TITLE_SUFFIXES[Math.floor(Math.random() * TITLE_SUFFIXES.length)]
    const newTitle = `${prefix} ${suffix}`
    setGameData((prev) => ({ ...prev, title: newTitle }))
  }

  const regenerateTeams = () => {
    const count = parseInt(gameData.numberOfTeams)
    if (count > 0 && count <= 6) {
      const newTeams = generateRandomTeams(count)
      setTeamConfigs(newTeams)
    }
  }

  const updateTeamName = (teamId: string, newName: string) => {
    setTeamConfigs(prev => prev.map(team => 
      team.id === teamId 
        ? { ...team, name: newName }
        : team
    ))
  }

  const validateTeamConfiguration = () => {
    if (gameData.gameMode === 'individual') {
      return { isValid: true, error: null }
    }

    const numberOfTeams = parseInt(gameData.numberOfTeams)
    const playersPerTeam = parseInt(gameData.playersPerTeam)
    const maxPlayers = parseInt(gameData.maxPlayers)
    const totalRequiredPlayers = numberOfTeams * playersPerTeam

    // Check minimum requirements
    if (numberOfTeams < 2) {
      return {
        isValid: false,
        error: "You need at least 2 teams for team mode."
      }
    }

    if (playersPerTeam < 1) {
      return {
        isValid: false,
        error: "Each team needs at least 1 player."
      }
    }

    // Check if total required players exceeds max players
    if (totalRequiredPlayers > maxPlayers) {
      return {
        isValid: false,
        error: `Team configuration requires ${totalRequiredPlayers} players but max players is set to ${maxPlayers}. Please adjust your settings.`
      }
    }

    // Check if we have enough teams for all players
    if (numberOfTeams > maxPlayers) {
      return {
        isValid: false,
        error: "Number of teams cannot exceed maximum players."
      }
    }

    // Provide helpful information about team distribution
    let distributionInfo = `Configuration: ${numberOfTeams} teams × ${playersPerTeam} players = ${totalRequiredPlayers} total players required.`
    
    if (totalRequiredPlayers < maxPlayers) {
      const extraPlayers = maxPlayers - totalRequiredPlayers
      distributionInfo += ` ${extraPlayers} extra players will be distributed evenly across teams.`
    }

    return { 
      isValid: true, 
      error: null,
      info: distributionInfo
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!gameData.title.trim()) {
      toast({
        title: "Missing Game Title",
        description: "Please enter a title for your game",
        variant: "destructive",
      })
      return
    }

    if (!gameData.hostName.trim()) {
      toast({
        title: "Missing Host Name", 
        description: "Please enter your name as the host",
        variant: "destructive",
      })
      return
    }

    // Validate team configuration
    const teamValidation = validateTeamConfiguration()
    if (!teamValidation.isValid) {
      toast({
        title: "Invalid Team Configuration",
        description: teamValidation.error,
        variant: "destructive",
      })
      return
    }

    // Show info about team configuration
    if (teamValidation.info) {
      toast({
        title: "Team Configuration",
        description: teamValidation.info,
      })
    }

    try {
      setLoading(true)

      // Create game with full configuration
      const gameConfig = {
        hostName: gameData.hostName.trim(),
        gameMode: gameData.gameMode,
        numberOfTeams: parseInt(gameData.numberOfTeams),
        playersPerTeam: parseInt(gameData.playersPerTeam),
        autoAssignTeams: gameData.autoAssignTeams,
        bidTimer: parseInt(gameData.bidTimer),
        biddingStyle: gameData.biddingStyle,
        totalRounds: parseInt(gameData.totalRounds),
        // Team configurations
        teamConfigs: teamConfigs,
        // Additional frontend-specific data
        title: gameData.title.trim(),
        maxPlayers: parseInt(gameData.maxPlayers),
        timerDuration: parseInt(gameData.timerDuration),
        description: gameData.description,
      }

      console.log("Creating game with config:", gameConfig)
      
      // Show loading toast
      const loadingToast = toast({
        title: "Creating Game...",
        description: "Setting up your Spades game with teams and configurations.",
        duration: 0, // Keep showing until dismissed
      })

      const response = await gameAPI.createGame(gameConfig)
      console.log("Game creation response:", response)

      // Save session
      sessionStorage.savePlayerSession(
        response.gameId,
        response.playerId,
        gameConfig.hostName
      )

      // Dismiss loading toast
      loadingToast.dismiss?.()

      toast({
        title: "Game Created Successfully!",
        description: `"${gameConfig.title}" is ready. Redirecting to lobby...`,
        duration: 2000,
      })

      console.log("Redirecting to:", `/games/${response.gameId}`)
      
      // Immediate redirect - no delay needed
      router.push(`/games/${response.gameId}`)
    } catch (error) {
      console.error("Error creating game:", error)
      toast({
        title: "Failed to Create Game",
        description: "Something went wrong. Please try again.",
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
                <Plus className="h-5 w-5" />
                Create New Game
              </h1>
              <p className="text-xs text-muted-foreground">Set up your Spades game</p>
      </div>

            <div className="w-8"></div> {/* Spacer for centering */}
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Spade className="h-5 w-5 text-casino-accent" />
              Game Information
            </CardTitle>
            <CardDescription>Basic game details and identification</CardDescription>
        </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hostName" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-casino-primary" />
                Your Name (Host)
              </Label>
              <Input
                id="hostName"
                name="hostName"
                placeholder="Enter your name"
                value={gameData.hostName}
                onChange={handleChange}
                className="bg-secondary/20 border-casino-subtle transition-casino"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-casino-primary" />
                Game Title
              </Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  name="title"
                  placeholder="Friday Night Spades"
                  value={gameData.title}
                  onChange={handleChange}
                  className="flex-1 bg-secondary/20 border-casino-subtle transition-casino"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateNewTitle}
                  className="hover:bg-accent-hover transition-casino transform-casino-hover"
                  title="Generate new title"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-casino-primary" />
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Add any special rules or notes for players..."
                value={gameData.description}
                onChange={handleChange}
                rows={3}
                className="bg-secondary/20 border-casino-subtle transition-casino"
              />
            </div>
          </CardContent>
        </Card>

        {/* Game Configuration */}
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-casino-accent" />
              Game Rules
            </CardTitle>
            <CardDescription>Configure how your game will be played</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalRounds">Number of Rounds</Label>
              <Input
                id="totalRounds"
                name="totalRounds"
                type="number"
                min="1"
                max="30"
                value={gameData.totalRounds}
                onChange={handleChange}
                  className="bg-secondary/20 border-casino-subtle transition-casino"
              />
            </div>

            <div className="space-y-2">
                <Label htmlFor="maxPlayers">Max Players</Label>
                <Select value={gameData.maxPlayers} onValueChange={(value) => handleSelectChange("maxPlayers", value)}>
                  <SelectTrigger className="bg-secondary/20 border-casino-subtle transition-casino">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="4">4 players</SelectItem>
                    <SelectItem value="6">6 players</SelectItem>
                    <SelectItem value="8">8 players</SelectItem>
                    <SelectItem value="10">10 players</SelectItem>
                    <SelectItem value="12">12 players</SelectItem>
                    <SelectItem value="14">14 players</SelectItem>
                    <SelectItem value="16">16 players</SelectItem>
                    <SelectItem value="18">18 players</SelectItem>
                    <SelectItem value="20">20 players</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                {gameData.biddingStyle === "visible" ? (
                  <Eye className="h-4 w-4 text-casino-primary" />
                ) : (
                  <EyeOff className="h-4 w-4 text-casino-primary" />
                )}
                Bidding Style
              </Label>
              <RadioGroup
                value={gameData.biddingStyle}
                onValueChange={(value) => handleSelectChange("biddingStyle", value)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 bg-secondary/10 rounded-lg border border-casino-subtle hover:bg-secondary/20 transition-casino">
                  <RadioGroupItem value="visible" id="visible" />
                  <Label htmlFor="visible" className="flex-1 cursor-pointer">
                    <div className="font-medium">Visible</div>
                    <div className="text-xs text-muted-foreground">Everyone sees bids</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-secondary/10 rounded-lg border border-casino-subtle hover:bg-secondary/20 transition-casino">
                  <RadioGroupItem value="invisible" id="invisible" />
                  <Label htmlFor="invisible" className="flex-1 cursor-pointer">
                    <div className="font-medium">Hidden</div>
                    <div className="text-xs text-muted-foreground">Bids revealed later</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scoringSystem">Scoring System</Label>
              <Select value={gameData.scoringSystem} onValueChange={(value) => handleSelectChange("scoringSystem", value)}>
                <SelectTrigger className="bg-secondary/20 border-casino-subtle transition-casino">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (10 + tricks for exact bids)</SelectItem>
                  <SelectItem value="partnership">Partnership (team bonuses)</SelectItem>
                  <SelectItem value="cutthroat">Cutthroat (individual play)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Team Configuration */}
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-casino-accent" />
              Team Configuration
            </CardTitle>
            <CardDescription>Set up teams and player assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-casino-primary" />
                Game Mode
              </Label>
              <RadioGroup
                value={gameData.gameMode}
                onValueChange={(value) => handleSelectChange("gameMode", value)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 bg-secondary/10 rounded-lg border border-casino-subtle hover:bg-secondary/20 transition-casino">
                  <RadioGroupItem value="teams" id="teams" />
                  <Label htmlFor="teams" className="flex-1 cursor-pointer">
                    <div className="font-medium">Teams</div>
                    <div className="text-xs text-muted-foreground">Players work in teams</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-secondary/10 rounded-lg border border-casino-subtle hover:bg-secondary/20 transition-casino">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="flex-1 cursor-pointer">
                    <div className="font-medium">Individual</div>
                    <div className="text-xs text-muted-foreground">Every player for themselves</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {gameData.gameMode === "teams" && (
              <>
                <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                    <Label htmlFor="numberOfTeams">Number of Teams</Label>
                    <Select value={gameData.numberOfTeams} onValueChange={(value) => handleSelectChange("numberOfTeams", value)}>
                      <SelectTrigger className="bg-secondary/20 border-casino-subtle transition-casino">
                        <SelectValue />
                </SelectTrigger>
                <SelectContent>
                        <SelectItem value="2">2 teams</SelectItem>
                        <SelectItem value="3">3 teams</SelectItem>
                        <SelectItem value="4">4 teams</SelectItem>
                        <SelectItem value="5">5 teams</SelectItem>
                        <SelectItem value="6">6 teams</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
                    <Label htmlFor="playersPerTeam">Players per Team</Label>
                    <Select value={gameData.playersPerTeam} onValueChange={(value) => handleSelectChange("playersPerTeam", value)}>
                      <SelectTrigger className="bg-secondary/20 border-casino-subtle transition-casino">
                        <SelectValue />
                </SelectTrigger>
                <SelectContent>
                        <SelectItem value="1">1 player</SelectItem>
                        <SelectItem value="2">2 players</SelectItem>
                        <SelectItem value="3">3 players</SelectItem>
                        <SelectItem value="4">4 players</SelectItem>
                        <SelectItem value="5">5 players</SelectItem>
                        <SelectItem value="6">6 players</SelectItem>
                        <SelectItem value="7">7 players</SelectItem>
                        <SelectItem value="8">8 players</SelectItem>
                        <SelectItem value="9">9 players</SelectItem>
                        <SelectItem value="10">10 players</SelectItem>
                </SelectContent>
              </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-casino-subtle">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-casino-primary" />
                    <div>
                      <Label htmlFor="autoAssignTeams" className="font-medium">Auto-assign Teams</Label>
                      <p className="text-xs text-muted-foreground">Automatically balance players across teams</p>
                    </div>
                  </div>
                  <Switch
                    id="autoAssignTeams"
                    checked={gameData.autoAssignTeams}
                    onCheckedChange={(checked) => handleSwitchChange("autoAssignTeams", checked)}
                  />
            </div>

                {/* Team Preview */}
                {teamConfigs.length > 0 && (
                  <div className="space-y-3">
            <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Spade className="h-4 w-4 text-casino-accent" />
                        Team Preview
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={regenerateTeams}
                        className="h-8 px-3 hover:bg-accent-hover transition-casino transform-casino-hover"
                        title="Generate new team names and colors"
                      >
                        <Shuffle className="h-3 w-3 mr-1" />
                        Shuffle
                      </Button>
                    </div>
                    
                    <div className="grid gap-2">
                      {teamConfigs.map((team, index) => (
                        <div
                          key={team.id}
                          className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-casino-subtle hover:bg-secondary/20 transition-casino"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className={`w-6 h-6 rounded-full shadow-sm border-2 border-white/20 flex-shrink-0`}
                                style={{ backgroundColor: team.color }}
                              ></div>
                              <Input
                                value={team.name}
                                onChange={(e) => updateTeamName(team.id, e.target.value)}
                                className="text-sm font-medium bg-transparent border-none h-8 px-2 focus:bg-secondary/20 transition-casino"
                                placeholder={`Team ${index + 1} name`}
                                maxLength={25}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: `${team.color}20`,
                                color: team.color,
                                borderColor: `${team.color}40`
                              }}
                            >
                              {team.colorName}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Team {index + 1}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-xs text-muted-foreground p-2 bg-secondary/5 rounded border border-casino-subtle">
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3" />
                        <span className="font-medium">Team Configuration</span>
                      </div>
                      <div className="space-y-0.5">
                        <div>• Each team will have {gameData.playersPerTeam} player{parseInt(gameData.playersPerTeam) !== 1 ? 's' : ''}</div>
                        <div>• Team names are editable, colors are randomly generated</div>
                        <div>• Players {gameData.autoAssignTeams ? 'will be automatically assigned' : 'can choose their preferred team'}</div>
                        <div>• Click "Shuffle" to regenerate names and colors</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Real-time validation feedback */}
                {(() => {
                  const validation = validateTeamConfiguration()
                  const numberOfTeams = parseInt(gameData.numberOfTeams)
                  const playersPerTeam = parseInt(gameData.playersPerTeam)
                  const maxPlayers = parseInt(gameData.maxPlayers)
                  const totalRequired = numberOfTeams * playersPerTeam
                  
                  if (!validation.isValid) {
                    return (
                      <Alert className="bg-red-500/10 border-red-500/30">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-700">Configuration Error</AlertTitle>
                        <AlertDescription className="text-red-600">
                          {validation.error}
                        </AlertDescription>
                      </Alert>
                    )
                  }

                  if (gameData.autoAssignTeams) {
                    return (
                      <Alert className="bg-blue-500/10 border-blue-500/30">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-700">Auto-assignment Enabled</AlertTitle>
                        <AlertDescription className="text-blue-600">
                          Players will be automatically assigned to teams as they join.
                          <br/>Required: {totalRequired} players ({numberOfTeams} teams × {playersPerTeam} players), Max: {maxPlayers} players.
                          {totalRequired < maxPlayers && <><br/>Extra {maxPlayers - totalRequired} players will be distributed evenly across teams.</>}
                        </AlertDescription>
                      </Alert>
                    )
                  }

                  return (
                    <Alert className="bg-green-500/10 border-green-500/30">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-700">Manual Team Selection</AlertTitle>
                      <AlertDescription className="text-green-600">
                        Players can choose their own teams when joining the game.
                        <br/>Team slots: {totalRequired} ({numberOfTeams} teams × {playersPerTeam} players), Max: {maxPlayers} players.
                      </AlertDescription>
                    </Alert>
                  )
                })()}
              </>
            )}
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card className="bg-casino-surface shadow-casino-card border-casino-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-casino-accent" />
              Advanced Options
            </CardTitle>
            <CardDescription>Optional features and customizations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-casino-subtle">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-casino-primary" />
                <div>
                  <Label htmlFor="enableTimer" className="font-medium">Round Timer</Label>
                  <p className="text-xs text-muted-foreground">Set time limits for rounds</p>
                </div>
              </div>
              <Switch
                id="enableTimer"
                checked={gameData.enableTimer}
                onCheckedChange={(checked) => handleSwitchChange("enableTimer", checked)}
              />
            </div>

            {gameData.enableTimer && (
              <div className="space-y-2 pl-4 border-l-2 border-casino-accent/30">
                <Label htmlFor="timerDuration" className="text-sm">Timer Duration</Label>
                <Select
                  value={gameData.timerDuration}
                  onValueChange={(value) => handleSelectChange("timerDuration", value)}
                >
                  <SelectTrigger className="bg-secondary/20 border-casino-subtle transition-casino">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-casino-primary" />
                Bid Timer
              </Label>
              <Select
                value={gameData.bidTimer}
                onValueChange={(value) => handleSelectChange("bidTimer", value)}
              >
                <SelectTrigger className="bg-secondary/20 border-casino-subtle transition-casino">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                  <SelectItem value="180">3 minutes</SelectItem>
                  <SelectItem value="240">4 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="360">6 minutes</SelectItem>
                  <SelectItem value="420">7 minutes</SelectItem>
                  <SelectItem value="480">8 minutes</SelectItem>
                  <SelectItem value="540">9 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Time limit for each player to make their bid. If time expires, auto-bid 0.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Create Button */}
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
                  <div className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                  <div className="flex flex-col text-center">
                    <span className="font-medium">Creating Game...</span>
                    <span className="text-xs opacity-80">Setting up teams & configurations</span>
                  </div>
                </div>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Game
                </>
              )}
            </Button>
            
            {!loading && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                Your friends will need the game code to join
              </p>
            )}
          </CardContent>
        </Card>
        </form>
    </div>
  )
} 
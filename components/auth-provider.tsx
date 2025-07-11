"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface User {
  id: string
  name: string
  email: string
  isGuest: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signInAsGuest: (name: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cookie utilities
const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

const getCookie = (name: string): string | null => {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

// Register player with server
const registerPlayer = async (name: string, playerId: string) => {
  try {
    await fetch('/api/players/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        playerId, 
        name, 
        joinedAt: Date.now(),
        isOnline: true 
      }),
    })
  } catch (error) {
    console.error('Failed to register player:', error)
  }
}

// Update player status
const updatePlayerStatus = async (playerId: string, isOnline: boolean) => {
  try {
    await fetch('/api/players/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerId, isOnline, lastSeen: Date.now() }),
    })
  } catch (error) {
    console.error('Failed to update player status:', error)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing guest user in cookies first, then localStorage as fallback
    const cookieUser = getCookie('guestUser')
    const localStorageUser = localStorage.getItem('guestUser')
    
    let savedUser = null
    
    if (cookieUser) {
      try {
        savedUser = JSON.parse(cookieUser)
      } catch (error) {
        console.error('Error parsing cookie user:', error)
      }
    } else if (localStorageUser) {
      try {
        savedUser = JSON.parse(localStorageUser)
        // Migrate from localStorage to cookie
        setCookie('guestUser', localStorageUser)
        localStorage.removeItem('guestUser')
      } catch (error) {
        console.error('Error parsing localStorage user:', error)
      }
    }

    if (savedUser && savedUser.name) {
      setUser(savedUser)
      // Register/update player status on the server (throttled)
      const lastRegistration = getCookie('lastRegistration')
      const now = Date.now()
      
      // Only register if it's been more than 5 minutes since last registration
      if (!lastRegistration || now - parseInt(lastRegistration) > 300000) {
        registerPlayer(savedUser.name, savedUser.id)
        setCookie('lastRegistration', now.toString())
      }
    }
    
    setLoading(false)
  }, [])

  // Update player status when window becomes visible/hidden
  useEffect(() => {
    if (!user) return

    let lastHeartbeat = 0
    const HEARTBEAT_THROTTLE = 30000 // 30 seconds minimum between heartbeats

    const handleVisibilityChange = () => {
      const isOnline = !document.hidden
      updatePlayerStatus(user.id, isOnline)
    }

    const handleBeforeUnload = () => {
      updatePlayerStatus(user.id, false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Send heartbeat every 2 minutes (less frequent)
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden) {
        const now = Date.now()
        if (now - lastHeartbeat >= HEARTBEAT_THROTTLE) {
          lastHeartbeat = now
          updatePlayerStatus(user.id, true)
        }
      }
    }, 120000) // 2 minutes

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearInterval(heartbeatInterval)
    }
  }, [user])

  const signInAsGuest = (name: string) => {
    const guestUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: `guest@aspade.online`,
      isGuest: true,
    }
    
    setUser(guestUser)
    
    // Save to both cookie and localStorage for redundancy
    const userString = JSON.stringify(guestUser)
    setCookie('guestUser', userString)
    localStorage.setItem('guestUser', userString)
    
    // Register player on server
    registerPlayer(guestUser.name, guestUser.id)
  }

  const signOut = () => {
    if (user) {
      // Update player status to offline
      updatePlayerStatus(user.id, false)
    }
    
    setUser(null)
    deleteCookie('guestUser')
    localStorage.removeItem('guestUser')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 
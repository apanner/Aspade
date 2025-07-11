const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const resolvedParams = await params
    const gameId = resolvedParams.gameId
    
    const response = await fetch(`${BACKEND_URL}/api/game/${gameId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return Response.json({ error: data.error || 'Failed to get game state' }, { status: response.status })
    }
    
    return Response.json(data)
  } catch (error) {
    console.error('Error getting game state:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
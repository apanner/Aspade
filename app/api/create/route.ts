const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/api/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return Response.json({ error: data.error || 'Failed to create game' }, { status: response.status })
    }
    
    return Response.json(data)
  } catch (error) {
    console.error('Error creating game:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
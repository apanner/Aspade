import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { playerName, gameId } = await request.json();
    
    if (!playerName || !gameId) {
      return NextResponse.json({ error: 'Player name and game ID are required' }, { status: 400 });
    }
    
    // Forward to Express backend
    const response = await fetch('http://localhost:3001/api/players/resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerName, gameId }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Resume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
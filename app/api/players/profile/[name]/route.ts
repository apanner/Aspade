import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const resolvedParams = await params;
    const { name } = resolvedParams;
    
    if (!name) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }
    
    // Forward to Express backend
    const response = await fetch(`http://localhost:3001/api/players/${encodeURIComponent(name)}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
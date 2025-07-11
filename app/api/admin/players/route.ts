import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'http://localhost:3001'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/players`)
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/api/admin/players`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error deleting players:', error)
    return NextResponse.json(
      { error: 'Failed to delete players' },
      { status: 500 }
    )
  }
} 
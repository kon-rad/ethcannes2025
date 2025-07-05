import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json()

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
      include: { characters: true }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress },
        include: { characters: true }
      })
    }

    // Set session cookie
    const response = NextResponse.json({ 
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        characters: user.characters
      }
    })

    // Set a simple session cookie (in production, use proper session management)
    response.cookies.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('Wallet auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
} 
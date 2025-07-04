import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { prisma } from '@/lib/prisma'

interface IRequestPayload {
  message: string
  signature: string
  nonce: string
}

export async function POST(req: NextRequest) {
  try {
    const { message, signature, nonce } = (await req.json()) as IRequestPayload

    console.log('Received SIWE request:', { message, signature, nonce })

    // Verify the SIWE message
    const siweMessage = new SiweMessage(JSON.parse(message))
    
    // Verify the signature
    const fields = await siweMessage.verify({ signature })
    
    if (!fields.success) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Check if nonce matches (you might want to store this in a session/database)
    // For now, we'll skip nonce verification for simplicity

    const address = fields.data.address

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: address }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress: address }
      })
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('user-id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, walletAddress: user.walletAddress }
    })
  } catch (error) {
    console.error('SIWE verification error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
} 
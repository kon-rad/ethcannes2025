import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from '@worldcoin/minikit-js'
import { prisma } from '@/lib/prisma'

interface IRequestPayload {
  message?: string
  signature?: string
  nonce: string
  payload?: MiniAppWalletAuthSuccessPayload
}

export async function POST(req: NextRequest) {
  try {
    const { message, signature, nonce, payload } = (await req.json()) as IRequestPayload

    console.log('Received SIWE request:', { message, signature, nonce, payload })

    let address: string

    // Handle World App Mini Kit authentication
    if (payload) {
      // Verify the nonce matches
      const cookieStore = await cookies()
      const storedNonce = cookieStore.get('siwe')?.value
      
      console.log('Nonce verification:', { 
        receivedNonce: nonce, 
        storedNonce: storedNonce,
        match: nonce === storedNonce 
      })
      
      if (nonce !== storedNonce) {
        return NextResponse.json({
          status: 'error',
          isValid: false,
          message: 'Invalid nonce',
        }, { status: 400 })
      }

      try {
        console.log('Verifying SIWE message with nonce:', nonce)
        const validMessage = await verifySiweMessage(payload, nonce)
        console.log('SIWE verification result:', validMessage)
        
        if (!validMessage.isValid) {
          return NextResponse.json({
            status: 'error',
            isValid: false,
            message: 'Invalid SIWE message',
          }, { status: 400 })
        }
        address = payload.address
      } catch (error: any) {
        console.error('SIWE verification error:', error)
        return NextResponse.json({
          status: 'error',
          isValid: false,
          message: error.message,
        }, { status: 400 })
      }
    } 
    // Handle regular SIWE authentication
    else if (message && signature) {
      // Verify the SIWE message
      const siweMessage = new SiweMessage(JSON.parse(message))
      
      // Verify the signature
      const fields = await siweMessage.verify({ signature })
      
      if (!fields.success) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }

      address = fields.data.address
    } else {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
    }

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
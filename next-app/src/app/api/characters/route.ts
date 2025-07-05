import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// GET /api/characters - Get all characters for the authenticated user
export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const characters = await prisma.aICharacter.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(characters)
  } catch (error) {
    console.error('Error fetching characters:', error)
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
}

// POST /api/characters - Create a new AI character
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      name, 
      description,
      systemPrompt, 
      imageUrl, 
      ownerWalletAddress,
      exclusiveContentPrice,
      chatPricePerMessage,
      voicePricePerMinute,
      brandPromoPrice
    } = await req.json()

    if (!name || !description || !systemPrompt) {
      return NextResponse.json({ error: 'Name, description, and system prompt are required' }, { status: 400 })
    }

    const character = await prisma.aICharacter.create({
      data: {
        name,
        description,
        systemPrompt,
        imageUrl,
        ownerWalletAddress,
        exclusiveContentPrice,
        chatPricePerMessage,
        voicePricePerMinute,
        brandPromoPrice,
        userId
      }
    })

    return NextResponse.json(character, { status: 201 })
  } catch (error) {
    console.error('Error creating character:', error)
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 })
  }
} 
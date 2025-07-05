import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// GET /api/characters/[id] - Get a single character
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const character = await prisma.aICharacter.findFirst({
      where: { 
        id: id,
        userId 
      },
      include: {
        user: {
          select: {
            walletAddress: true
          }
        }
      }
    })

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    return NextResponse.json(character)
  } catch (error) {
    console.error('Error fetching character:', error)
    return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 })
  }
}

// PUT /api/characters/[id] - Update a character
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updateData = await req.json()

    // Verify character belongs to user
    const existingCharacter = await prisma.aICharacter.findFirst({
      where: { 
        id: id,
        userId 
      }
    })

    if (!existingCharacter) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Update character with all provided fields
    const updatedCharacter = await prisma.aICharacter.update({
      where: { id: id },
      data: {
        name: updateData.name,
        description: updateData.description,
        systemPrompt: updateData.systemPrompt,
        imageUrl: updateData.imageUrl,
        ownerWalletAddress: updateData.ownerWalletAddress,
        exclusiveContentPrice: updateData.exclusiveContentPrice,
        chatPricePerMessage: updateData.chatPricePerMessage,
        voicePricePerMinute: updateData.voicePricePerMinute,
        brandPromoPrice: updateData.brandPromoPrice,
        contractAddress: updateData.contractAddress
      },
      include: {
        user: {
          select: {
            walletAddress: true
          }
        }
      }
    })

    return NextResponse.json(updatedCharacter)
  } catch (error) {
    console.error('Error updating character:', error)
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
  }
} 
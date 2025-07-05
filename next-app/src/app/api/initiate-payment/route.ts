import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { characterId, serviceType } = await req.json()
    
    if (!characterId || !serviceType) {
      return NextResponse.json(
        { error: 'Character ID and service type are required' },
        { status: 400 }
      )
    }

    // Generate unique payment ID
    const paymentId = crypto.randomUUID().replace(/-/g, '')
    
    // Get character details
    const character = await prisma.aICharacter.findUnique({
      where: { id: characterId },
      select: {
        id: true,
        name: true,
        exclusiveContentPrice: true,
        chatPricePerMessage: true,
        voicePricePerMinute: true,
        brandPromoPrice: true,
        ownerWalletAddress: true,
        contractAddress: true
      }
    })

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    // Determine price based on service type
    let price = 0
    switch (serviceType) {
      case 'exclusiveContent':
        price = character.exclusiveContentPrice
        break
      case 'chat':
        price = character.chatPricePerMessage
        break
      case 'voice':
        price = character.voicePricePerMinute
        break
      case 'brandPromo':
        price = character.brandPromoPrice
        break
      default:
        return NextResponse.json(
          { error: 'Invalid service type' },
          { status: 400 }
        )
    }

    // TODO: Store the payment ID in your database for verification
    // For now, we'll return the payment details
    return NextResponse.json({
      id: paymentId,
      characterId: character.id,
      characterName: character.name,
      serviceType,
      price,
      recipientAddress: '0x5f80c3F3f6b6D9744eC1c2b0FA912CD0007B825B', // Hardcoded for testing
      description: `Payment for ${serviceType} from ${character.name}`
    })

  } catch (error) {
    console.error('Error initiating payment:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
} 
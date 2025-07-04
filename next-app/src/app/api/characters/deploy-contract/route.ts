import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// POST /api/characters/deploy-contract - Deploy smart contract for a character
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { characterId } = await req.json()

    if (!characterId) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 })
    }

    // Get character data
    const character = await prisma.aICharacter.findFirst({
      where: { id: characterId, userId },
      include: { user: true }
    })

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // TODO: Deploy smart contract using Hardhat
    // The contract should be deployed with:
    // - characterOwner: character.user.walletAddress
    // - platform: platform address (from env)
    // - platformFeePercent: 15
    // - All service prices from the character record
    
    // Convert consultation call price from cents to wei for smart contract
    const consultationCallPriceInWei = character.consultationCallPrice === '0' || !character.consultationCallPrice
      ? '0' 
      : (parseFloat(character.consultationCallPrice) * 1e16).toString() // Convert cents to wei
    
    // For now, we'll simulate deployment and return a placeholder address
    const contractAddress = `0x${Math.random().toString(16).substr(2, 40)}`
    
    console.log('Would deploy contract with:', {
      characterOwner: character.user.walletAddress,
      platform: process.env.PLATFORM_ADDRESS || '0x0000000000000000000000000000000000000000',
      platformFeePercent: 15,
      servicePrices: {
        exclusiveContentAccess: character.exclusiveContentPrice || '1000000000000000000', // 1 ETH default
        chatPerMessage: character.chatPrice || '0', // Free by default
        voicePerMinute: character.voicePrice || '500000000000000000', // 0.5 ETH default
        brandPromo: character.brandPromoPrice || '5000000000000000000' // 5 ETH default
      }
    })

    // Update character with contract address
    const updatedCharacter = await prisma.aICharacter.update({
      where: { id: characterId },
      data: { contractAddress }
    })

    return NextResponse.json({ 
      success: true, 
      contractAddress,
      character: updatedCharacter 
    })
  } catch (error) {
    console.error('Error deploying contract:', error)
    return NextResponse.json({ error: 'Failed to deploy contract' }, { status: 500 })
  }
} 
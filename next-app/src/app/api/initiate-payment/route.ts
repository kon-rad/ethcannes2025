import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { characterId, amount } = await req.json()

    if (!characterId || !amount) {
      return NextResponse.json({ error: 'Character ID and amount are required' }, { status: 400 })
    }

    // Generate a unique reference ID for this payment
    const uuid = crypto.randomUUID().replace(/-/g, '')

    // TODO: Store the payment reference in your database
    // This should include characterId, amount, reference ID, and status
    // You can use this to verify the payment later

    return NextResponse.json({ 
      id: uuid,
      characterId,
      amount,
      status: 'pending'
    })
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
  }
} 
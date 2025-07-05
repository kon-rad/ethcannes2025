import { NextRequest, NextResponse } from 'next/server'
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js'

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload
}

export async function POST(req: NextRequest) {
  try {
    const { payload } = (await req.json()) as IRequestPayload

    // IMPORTANT: Here we should fetch the reference you created in /initiate-payment to ensure the transaction we are verifying is the same one we initiated
    // const reference = getReferenceFromDB()

    // For now, we'll verify the transaction directly
    if (payload.status === 'success') {
      // 1. Check that the transaction we received from the mini app is valid
      const response = await fetch(
        `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.APP_ID}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to verify transaction with World App')
      }

      const transaction = await response.json()

      // 2. Here we optimistically confirm the transaction.
      // Otherwise, you can poll until the status == mined
      if (transaction.status !== 'failed') {
        // TODO: Update your database to mark the payment as successful
        // TODO: Grant access to the exclusive content
        
        return NextResponse.json({ 
          success: true,
          transactionId: payload.transaction_id,
          amount: transaction.amount,
          recipient: transaction.recipient
        })
      } else {
        return NextResponse.json({ 
          success: false,
          error: 'Transaction failed'
        })
      }
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Payment was not successful'
      })
    }
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to confirm payment'
      },
      { status: 500 }
    )
  }
} 
# Exclusive Content Payment System

This document explains how the exclusive content payment system works in the Augmi.

## Overview

The payment system allows users to purchase exclusive content from AI characters using World App's payment functionality. Payments are made in WLD (Worldcoin) tokens and sent directly to the character creator's wallet address.

## How It Works

1. **Character Creation**: When creating a character, the owner sets an `exclusiveContentPrice` in wei (ETH units)
2. **Payment Flow**: Users can click "Access Exclusive Content" to purchase access
3. **World App Integration**: Payments are processed through World App using the MiniKit
4. **Database Tracking**: All payments are tracked in the database with status updates

## Database Schema

The payment system uses a new `Payment` model in the database:

```prisma
model Payment {
  id            String   @id @default(cuid())
  referenceId   String   @unique // Unique reference for payment tracking
  characterId   String
  character     AICharacter @relation(fields: [characterId], references: [id], onDelete: Cascade)
  amount        String   // Amount in wei
  type          String   // "exclusive_content", "consultation", "sponsorship", etc.
  status        String   // "pending", "completed", "failed"
  transactionId String?  // World App transaction ID
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("payments")
}
```

## API Endpoints

### POST /api/initiate-payment
- Creates a payment record in the database
- Returns a unique reference ID for the payment
- Parameters: `characterId`, `amount`, `type`

### POST /api/confirm-payment
- Verifies the payment with World App
- Updates the payment status in the database
- Parameters: World App payment payload

## Payment Flow

1. User clicks "Access Exclusive Content" button
2. System checks:
   - User is authenticated
   - User is not buying their own content
   - World App is available
   - Character has exclusive content available
3. Payment is initiated via `/api/initiate-payment`
4. World App payment command is sent with:
   - Reference ID
   - Character owner's wallet address as recipient
   - WLD amount (converted from ETH price)
   - Description
5. User confirms payment in World App
6. Payment is confirmed via `/api/confirm-payment`
7. Payment status is updated in database
8. User receives access to exclusive content

## Configuration

### Environment Variables
- `APP_ID`: Your World App application ID
- `DEV_PORTAL_API_KEY`: World Developer Portal API key (for production verification)

### Mini App Config
The payment system uses the configuration in `src/lib/mini-app-config.ts`:
- Supported tokens: WLD, USDC
- Minimum payment amount: 0.1 WLD
- Payment descriptions for different content types

## Security Considerations

1. **Payment Verification**: In production, always verify payments using the World Developer Portal API
2. **Reference Validation**: Ensure payment references match what was stored in the database
3. **User Authentication**: Verify users are authenticated before allowing payments
4. **Ownership Checks**: Prevent users from buying their own content

## Future Enhancements

1. **Real-time Exchange Rates**: Fetch current ETH/WLD exchange rates
2. **Payment History**: Show users their payment history
3. **Refund System**: Implement refund functionality
4. **Multiple Payment Methods**: Support additional payment tokens
5. **Subscription Model**: Allow recurring payments for ongoing access

## Testing

To test the payment system:

1. Create a character with exclusive content pricing
2. Open the app in World App
3. Navigate to the character profile
4. Click "Access Exclusive Content"
5. Complete the payment flow in World App
6. Verify the payment is recorded in the database

## Troubleshooting

- **"Please open this app in World App"**: The payment system only works within World App
- **"Payment failed"**: Check the browser console for detailed error messages
- **"Reference not found"**: The payment reference may have expired or been invalidated
- **"Transaction failed"**: The on-chain transaction may have failed due to insufficient funds or network issues 
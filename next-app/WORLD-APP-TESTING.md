# World App Payment Testing Guide

This guide explains how to test the payment system with World App, including both testnet and mainnet options.

## 🧪 Testing Options

### Option 1: Testnet Testing (Recommended for Development)

**Pros:**
- ✅ No real money involved
- ✅ Free testnet tokens available
- ✅ Safe for development and testing
- ✅ No risk of losing funds

**Cons:**
- ❌ Limited testnet features
- ❌ May not reflect exact mainnet behavior

### Option 2: Mainnet Testing (Production)

**Pros:**
- ✅ Real-world conditions
- ✅ Full feature set available
- ✅ Actual transaction verification

**Cons:**
- ❌ Requires real WLD tokens
- ❌ Real money involved
- ❌ Risk of losing funds if errors occur

## 🚀 Getting Started with Testnet

### Step 1: Get Testnet WLD Tokens

1. **Open World App**
2. **Enable Developer Mode** (if available):
   - Go to Settings
   - Look for "Developer Mode" or "Testnet Mode"
   - Enable it
3. **Get Testnet Tokens**:
   - Use the testnet faucet in World App
   - Or request tokens from the World App team

### Step 2: Configure Your App for Testnet

Add this environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_USE_TESTNET=true
```

### Step 3: Set Up Test Character

1. **Create a Character** with a reasonable exclusive content price:
   - Set `exclusiveContentPrice` to something like `1000000000000000000` (1 ETH in wei)
   - This will convert to about 0.5 WLD for testing

2. **Use Test Wallet Address**:
   - Make sure the character owner has a testnet wallet address
   - You can use any valid Ethereum address format for testing

## 🔧 Testing Steps

### 1. **Start Your Development Server**

```bash
cd next-app
npm run dev
```

### 2. **Open in World App**

1. **Open World App** on your device
2. **Navigate to your app** (you'll need to add it to World App first)
3. **Ensure you're on testnet** if testing with testnet tokens

### 3. **Test the Payment Flow**

1. **Sign In**: Use World App authentication
2. **Create a Character**: Set up a character with exclusive content pricing
3. **Navigate to Character Profile**: Go to the character you want to test
4. **Click "Access Exclusive Content"**: This will initiate the payment
5. **Complete Payment**: Follow the World App payment flow
6. **Verify Success**: Check that the payment is recorded in your database

### 4. **Check Database**

Verify the payment was recorded:

```sql
-- Check payments table
SELECT * FROM payments ORDER BY createdAt DESC LIMIT 5;

-- Check payment status
SELECT referenceId, status, amount, type FROM payments WHERE status = 'completed';
```

## 🌐 Mainnet Testing

### Prerequisites

1. **Real WLD Tokens**: You need actual WLD tokens in your World App wallet
2. **Production App ID**: Your app must be approved for mainnet
3. **Real Wallet Addresses**: Use actual wallet addresses for character owners

### Configuration

Remove or set the testnet flag to false:

```bash
# .env.local
NEXT_PUBLIC_USE_TESTNET=false
```

### Testing Process

Same as testnet, but with real tokens and mainnet network.

## 🐛 Troubleshooting

### Common Issues

#### 1. **"Please open this app in World App"**
- **Solution**: Make sure you're accessing the app through World App, not a regular browser
- **Check**: Verify MiniKit.isInstalled() returns true

#### 2. **"Minimum payment amount is X WLD"**
- **Solution**: Increase the character's exclusive content price
- **Testnet**: Minimum is 0.01 WLD
- **Mainnet**: Minimum is 0.1 WLD

#### 3. **"Payment failed"**
- **Check**: Browser console for detailed error messages
- **Common causes**:
  - Insufficient WLD balance
  - Network connectivity issues
  - Invalid wallet address

#### 4. **"Reference not found"**
- **Solution**: The payment reference may have expired
- **Check**: Database for the payment record
- **Fix**: Try the payment again

### Debug Mode

Enable debug logging by adding this to your browser console:

```javascript
// Enable MiniKit debug mode
window.MiniKit.debug = true;
```

## 📊 Monitoring Payments

### Database Queries

```sql
-- View all payments
SELECT 
  p.referenceId,
  p.status,
  p.amount,
  p.type,
  p.createdAt,
  c.name as character_name
FROM payments p
JOIN ai_characters c ON p.characterId = c.id
ORDER BY p.createdAt DESC;

-- View successful payments
SELECT * FROM payments WHERE status = 'completed';

-- View failed payments
SELECT * FROM payments WHERE status = 'failed';
```

### API Endpoints

- **GET** `/api/payments` - List all payments (you may need to create this)
- **GET** `/api/payments/[referenceId]` - Get specific payment details

## 🔒 Security Considerations

### Testnet
- ✅ Safe to use any wallet addresses
- ✅ No real value at risk
- ✅ Can test all features freely

### Mainnet
- ⚠️ Use only trusted wallet addresses
- ⚠️ Verify all payment amounts
- ⚠️ Test thoroughly before going live
- ⚠️ Implement proper error handling

## 📱 World App Integration

### Required Setup

1. **App Registration**: Your app must be registered with World App
2. **App ID**: You need a valid app ID for mainnet
3. **Whitelist**: Your app may need to be whitelisted

### Mini App Commands

The payment system uses these MiniKit commands:

```typescript
// Initiate payment
const { finalPayload } = await MiniKit.commandsAsync.pay(payload);

// Check if MiniKit is available
if (MiniKit.isInstalled()) {
  // Proceed with payment
}
```

## 🎯 Best Practices

1. **Start with Testnet**: Always test on testnet first
2. **Use Small Amounts**: Start with small payment amounts
3. **Monitor Logs**: Check browser console and server logs
4. **Test Error Cases**: Test with insufficient funds, network issues, etc.
5. **Verify Database**: Always check that payments are recorded correctly

## 📞 Support

If you encounter issues:

1. **Check World App Documentation**: https://developer.worldcoin.org/
2. **Review MiniKit Documentation**: https://developer.worldcoin.org/mini-apps
3. **Check Browser Console**: For detailed error messages
4. **Verify Network**: Ensure you're on the correct network (testnet/mainnet)

## 🚀 Next Steps

Once testing is complete:

1. **Deploy to Production**: Set up your production environment
2. **Configure Mainnet**: Update app configuration for mainnet
3. **Monitor Payments**: Set up monitoring and alerting
4. **User Testing**: Have real users test the payment flow
5. **Go Live**: Launch your payment system to users 
# World ID Human Verification Setup

This guide explains how to set up World ID human verification for character creation in the Augmi app.

## Overview

The character creation process now requires users to verify their humanity using World ID before they can create AI characters. This prevents spam and ensures quality content.

## Setup Steps

### 1. Create Incognito Action in World Developer Portal

1. Go to [World Developer Portal](https://developer.worldcoin.org)
2. Navigate to your app settings
3. Go to the "Incognito Actions" section
4. Create a new incognito action with the following settings:

**Action ID**: `create-character`
**Description**: "Verify humanity to create AI character"
**Max Verifications**: `1` (each user can only verify once for character creation)
**Verification Level**: `Orb` (requires Orb verification)

### 2. Environment Variables

Ensure your `.env.local` file contains:

```env
APP_ID=app_your_app_id_here
```

The `APP_ID` should be in the format `app_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

### 3. Verification Flow

The verification process works as follows:

1. User clicks "Create Character" button
2. User must first click "Verify Humanity" button
3. World App opens verification drawer
4. User completes World ID verification
5. Backend verifies the proof
6. User can now create their character

### 4. API Endpoints

The verification system uses the following API endpoint:

- `POST /api/verify` - Verifies World ID proofs

### 5. Security Considerations

- **Proof Verification**: All proofs are verified on the backend using the World ID API
- **One-time Verification**: Each user can only verify once per action (prevents spam)
- **Orb Requirement**: Requires Orb verification for maximum security
- **Signal Validation**: Uses wallet address as signal to prevent impersonation

## Testing

To test the verification system:

1. Open the app in World App
2. Click "Create Character"
3. Click "Verify Humanity"
4. Complete the World ID verification process
5. Verify that the character creation form becomes available
6. Create a character

## Troubleshooting

### "Please open this app in World App"
- The verification only works within World App
- Make sure you're testing in the World App environment

### "Verification failed"
- Check that the incognito action is properly configured in the Developer Portal
- Verify that the `APP_ID` environment variable is correct
- Check the browser console for detailed error messages

### "User cannot verify for this action again"
- This is expected behavior - each user can only verify once per action
- The verification is tied to the user's World ID and action ID

## Production Considerations

1. **Rate Limiting**: Consider implementing rate limiting on the verify endpoint
2. **Logging**: Log verification attempts for monitoring
3. **Error Handling**: Implement proper error handling for verification failures
4. **User Experience**: Consider caching verification status to avoid repeated verifications

## Future Enhancements

1. **Verification Expiry**: Add time-based verification expiry
2. **Multiple Actions**: Create different verification actions for different features
3. **Analytics**: Track verification success rates and user behavior
4. **Fallback**: Implement alternative verification methods for edge cases 
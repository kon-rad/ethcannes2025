# World App Mini App Setup Guide

This guide will help you set up and test the Augmi as a World App Mini App.

## Prerequisites

1. **World App**: Make sure you have the World App installed on your device
2. **Developer Account**: You'll need access to the World Developer Portal
3. **ngrok**: For local development and testing

## Setup Steps

### 1. Install Dependencies

```bash
cd next-app
npm install
```

### 2. Set up Environment Variables

Create a `.env.local` file in the `next-app` directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Optional: For production deployment
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 3. Set up the Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Set up ngrok for Testing

Install ngrok if you haven't already:

```bash
# On macOS with Homebrew
brew install ngrok

# Or download from https://ngrok.com/
```

Start ngrok to expose your local server:

```bash
ngrok http 3000
```

This will give you a public URL like `https://abc123.ngrok.io`

### 6. Configure in World Developer Portal

1. Go to [World Developer Portal](https://developer.worldcoin.org)
2. Create a new Mini App or use an existing one
3. Set the Mini App URL to your ngrok URL: `https://abc123.ngrok.io`
4. Configure the following settings:
   - **App Name**: Augmi
   - **Description**: Create and monetize AI characters with exclusive content
   - **Icon**: Upload an appropriate icon
   - **Category**: Entertainment or Social

## Testing the Mini App

### 1. Open in World App

1. Open the World App on your device
2. Navigate to the Mini Apps section
3. Find your app and tap to open it
4. The app should load and show "Running in World App - Mini App Mode"

### 2. Test Authentication

1. You'll see two login options:
   - **Sign in with World App** (green button with 🌍 icon) - for native World App authentication
   - **Connect MetaMask** (purple button) - for traditional wallet authentication
2. Choose "Sign in with World App" for the best Mini App experience
3. Complete the authentication process in World App
4. You should see the main app interface with a 🌍 indicator

### 3. Test Character Management

1. Create a new AI character
2. View and manage your characters
3. Test the character profile pages

## Mini App Features

### Current Implementation

- ✅ **World App Detection**: Automatically detects when running in World App
- ✅ **Native World App Login**: Sign in directly with World App wallet
- ✅ **Dual Authentication**: Support for both World App and MetaMask login
- ✅ **Character Management**: Create and view AI characters
- ✅ **Mobile-Optimized UI**: Designed for World App environment
- ✅ **Session Management**: Persistent authentication
- ✅ **Visual Indicators**: Shows when running in Mini App mode

### Future Enhancements

- 🔄 **Payment Integration**: Pay for character access using WLD
- 🔄 **Voice Chat**: Real-time voice conversations with AI characters
- 🔄 **Exclusive Content**: Premium content behind paywalls
- 🔄 **Notifications**: Push notifications for new content
- 🔄 **Social Features**: Share characters and content

## File Structure

```
next-app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main app with Mini App detection
│   │   └── api/
│   │       ├── auth/             # Authentication endpoints
│   │       └── characters/       # Character management
│   ├── lib/
│   │   └── mini-app-config.ts   # Mini App configuration
│   └── components/              # Reusable components
└── MINI-APP-SETUP.md           # This file
```

## Troubleshooting

### Common Issues

1. **MiniKit not installed**: Make sure you're opening the app from within World App
2. **Authentication issues**: Verify your environment variables are set correctly
3. **ngrok issues**: Make sure ngrok is running and the URL is accessible
4. **Database issues**: Run `npx prisma db push` to ensure the database is set up

### Debug Mode

To enable debug logging, add this to your browser console:

```javascript
localStorage.setItem('minikit-debug', 'true')
```

## Production Deployment

When ready for production:

1. Deploy your app to a hosting service (Vercel, Netlify, etc.)
2. Update the Mini App URL in the Developer Portal
3. Set up proper environment variables
4. Add error handling and monitoring

## Support

For issues with:
- **World App Mini Apps**: Check the [World Documentation](https://docs.world.org)
- **This Implementation**: Check the code comments and this guide
- **General Development**: Refer to Next.js and React documentation 
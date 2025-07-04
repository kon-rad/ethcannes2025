# Chat Setup Guide

## Environment Variables

To use the chat functionality, you need to set up the following environment variables:

### 1. Create a `.env.local` file

Create a file called `.env.local` in the `next-app` directory with the following content:

```bash
# Database
DATABASE_URL="file:./dev.db"

# Together AI API Key (required for chat functionality)
TOGETHER_API_KEY="your_together_ai_api_key_here"

# Next.js
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Get a Together AI API Key

1. Go to [https://together.ai](https://together.ai)
2. Sign up for a free account
3. Navigate to your API keys section
4. Create a new API key
5. Copy the API key and replace `your_together_ai_api_key_here` in your `.env.local` file

### 3. Generate a NextAuth Secret

You can generate a random secret using:

```bash
openssl rand -base64 32
```

Or use any random string for development.

### 4. Restart the Development Server

After creating the `.env.local` file, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Troubleshooting

### "AI service not configured" Error

If you see this error, it means the `TOGETHER_API_KEY` is not set or invalid. Make sure:

1. The `.env.local` file exists in the `next-app` directory
2. The `TOGETHER_API_KEY` is correctly set
3. You've restarted the development server after adding the environment variable

### "Authentication required" Error

This means you need to log in first. The chat functionality requires authentication. Make sure you're logged in through the World App authentication system.

## Free Tier Limits

Together AI offers a free tier with:
- 1,000 requests per month
- Access to various AI models including Llama 3.1 8B Instruct Turbo

For production use, consider upgrading to a paid plan. 
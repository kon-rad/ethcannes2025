# AI Chat & Profile Hub Setup

## Overview
The AI chat functionality and profile hub allow users to have conversations with AI characters using Together AI's LLM service, with a comprehensive dashboard for managing characters and viewing analytics.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install together-ai
```

### 2. Environment Variables
Add the following to your `.env.local` file:
```
TOGETHER_API_KEY=your_together_ai_api_key_here
S3_UPLOAD_KEY=your_aws_access_key_id
S3_UPLOAD_SECRET=your_aws_secret_access_key
S3_UPLOAD_BUCKET=your_s3_bucket_name
S3_UPLOAD_REGION=us-west-2
```

### 3. Database Migration
After updating the Prisma schema, run:
```bash
npx prisma generate
npx prisma db push
```

## Features Implemented

### 🎯 AI Profile Hub (`/ai-profile`)
- **Characters Tab**: View and manage all AI characters
- **Chat History Tab**: View all conversations with quick chat interface
- **Analytics Tab**: Dashboard with character and message statistics
- **Quick Chat**: Send messages directly from the hub interface

### 💬 Chat Interface
- Real-time chat with AI characters using their system prompts
- Message history persistence in SQLite database
- Responsive design with mobile support
- Typing indicators and loading states
- Character-specific chat pages (`/character/[id]/chat`)

### 🖼️ Image Generation
- **FLUX.1 Kontext Model**: High-quality conditional image generation using existing character images
- **Stable Diffusion XL**: Initial image generation for characters without existing images
- **S3 Integration**: Automatic image upload to AWS S3 for persistent storage
- **Custom Prompts**: Optional text prompts with validation and content filtering
- **Conditional Generation**: Uses existing character images as reference for new variations
- **Professional Headshots**: Character-specific prompts for consistent branding

### 🔧 Integrated Services
- **TogetherAiService**: Core AI service with streaming support
- **ChatService**: High-level chat interface using AI models
- **aiModels**: Configurable AI model selection
- **aiService**: Additional AI utilities (summarization, image generation)
- **ImageGenerationService**: FLUX.1 Kontext image generation for character portraits

### 📊 API Endpoints
- `POST /api/chat` - Send a message to an AI character
- `GET /api/chat?characterId=...` - Get chat history for a character
- `POST /api/generate-image` - Generate character images (FLUX.1 Kontext + Stable Diffusion XL)

### 🗄️ Database Schema
- `ChatMessage` model for storing conversation history
- Relationships with `User` and `AICharacter` models
- Automatic message persistence and retrieval

### 🤖 AI Model Integration
- **Default Model**: Llama 3.1 8B Instruct Turbo
- **Available Models**: 8 different Llama variants
- **Configurable**: Temperature, max tokens, streaming options
- **Error Handling**: Comprehensive error handling and retry logic

## Usage

### Accessing the AI Hub
1. Navigate to the main page
2. Click "AI Hub" button in the header
3. Use the tabs to switch between features

### Chatting with Characters
1. **From AI Hub**: Select a character and use the quick chat
2. **From Character Cards**: Click "Chat" button on any character
3. **From Character Profile**: Click "Start Chat" button
4. **Direct URL**: Navigate to `/character/[id]/chat`

### Managing Characters
1. **Create**: Use "Create Character" button
2. **Manage**: Click "Manage" on character cards
3. **View All**: Use the Characters tab in AI Hub
4. **Generate Images**: Use the image generation feature on character profile pages

## File Structure
```
src/
├── app/
│   ├── ai-profile/
│   │   └── page.tsx (AI Profile Hub with tabs)
│   ├── character/[id]/
│   │   ├── page.tsx (character profile with chat button)
│   │   └── chat/
│   │       └── page.tsx (dedicated chat interface)
│   └── api/
│       ├── chat/
│       │   └── route.ts (chat API endpoints)
│       └── generate-image/
│           └── route.ts (image generation API endpoint)
├── components/
│   ├── CharacterList.tsx (updated with chat buttons)
│   └── Header.tsx (updated with AI Hub link)
├── services/
│   ├── togetherAiService.ts (core AI service)
│   ├── aiService.ts (AI utilities)
│   └── imageGenerationService.ts (FLUX.1 Kontext image generation)
├── utils/
│   └── aiModels.ts (AI model configurations)
├── lib/
│   ├── chatService.ts (integrated chat service)
│   └── prisma.ts (database client)
└── prisma/
    └── schema.prisma (updated with ChatMessage model)
```

## AI Models Available
- **Llama 3.3 70B Instruct Turbo** (default for chat)
- **Llama 3.1 8B Instruct Turbo** (fast, efficient)
- **Llama 3.1 70B Instruct Turbo** (high quality)
- **Llama 3.1 405B Instruct Turbo** (largest model)
- **Llama 3.2 3B Instruct Turbo** (lightweight)
- **Llama 3.2 11B Vision Instruct Turbo** (vision support)

## Notes
- Currently uses a mock user ID for development
- In production, integrate with your authentication system
- The Together AI service supports both streaming and non-streaming responses
- Chat history is automatically maintained and can be viewed in the AI Hub
- All AI services are reusable for other features in your app
- The system uses character-specific system prompts for personalized responses 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { chatService } from '@/lib/chatService';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { characterId, message } = await request.json();

    if (!characterId || !message) {
      return NextResponse.json(
        { error: 'Character ID and message are required' },
        { status: 400 }
      );
    }

    // Get user from session
    const cookieStore = await cookies();
    const userId = cookieStore.get('user-id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the character and user from the session
    const character = await prisma.aICharacter.findUnique({
      where: { id: characterId },
      include: { user: true }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Save user message to database
    const userMessage = await prisma.chatMessage.create({
      data: {
        content: message,
        role: 'user',
        userId: userId,
        characterId: characterId,
      },
    });

    // Get conversation history (last 10 messages for context)
    const conversationHistory = await prisma.chatMessage.findMany({
      where: {
        characterId: characterId,
        userId: userId,
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // Convert to Together AI format
    const aiMessages = conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Generate AI response using description instead of systemPrompt
    const aiResponse = await chatService.generateCharacterResponse(
      character.description,
      message,
      aiMessages
    );

    // Save AI response to database
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        content: aiResponse,
        role: 'assistant',
        userId: userId,
        characterId: characterId,
      },
    });

    return NextResponse.json({
      message: aiResponse,
      messageId: assistantMessage.id,
      timestamp: assistantMessage.createdAt,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Check if it's a Together AI API key error
    if (error instanceof Error && error.message.includes('TOGETHER_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please set up your Together AI API key.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');

    if (!characterId) {
      return NextResponse.json(
        { error: 'Character ID is required' },
        { status: 400 }
      );
    }

    // Get user from session
    const cookieStore = await cookies();
    const userId = cookieStore.get('user-id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get chat history
    const messages = await prisma.chatMessage.findMany({
      where: {
        characterId: characterId,
        userId: userId,
      },
      orderBy: { createdAt: 'asc' },
      take: 50, // Limit to last 50 messages
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
} 
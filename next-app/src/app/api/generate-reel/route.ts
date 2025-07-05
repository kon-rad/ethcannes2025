import { NextRequest, NextResponse } from 'next/server';
import { ReelGenerationService } from '@/services/reelGenerationService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      characterId,
      customPrompt,
      additionalContext,
      userId
    } = body;

    console.log('🎬 Generate Reel API - Received request:', {
      characterId,
      hasCustomPrompt: !!customPrompt,
      hasAdditionalContext: !!additionalContext,
      userId
    });

    // Validate required parameters
    if (!characterId) {
      return NextResponse.json(
        { error: 'Character ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch character data from database
    console.log('📊 Fetching character data from database...');
    const character = await prisma.aICharacter.findUnique({
      where: { id: characterId },
      select: {
        id: true,
        name: true,
        description: true,
        systemPrompt: true,
        imageUrl: true,
        userId: true
      }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Verify user owns the character
    if (character.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to character' },
        { status: 403 }
      );
    }

    console.log('✅ Character data retrieved:', {
      name: character.name,
      description: character.description,
      hasSystemPrompt: !!character.systemPrompt,
      hasImageUrl: !!character.imageUrl
    });

    // Prepare character data for the service
    const characterData = {
      name: character.name,
      description: character.description,
      systemPrompt: '', // Use empty string since we're replacing with description
      imageUrl: character.imageUrl || undefined
    };

    // Generate reel using the service
    console.log('🎥 Calling reel generation service...');
    const reelService = new ReelGenerationService();
    const result = await reelService.generateReel({
      characterData,
      customPrompt,
      additionalContext
    });

    console.log('📹 Reel generation result:', result);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    // Save the generated reel as a post in the database
    let post = null;
    try {
      console.log('💾 Saving reel as post to database...');
      post = await prisma.post.create({
        data: {
          type: 'video',
          imageUrl: result.reelUrl, // Using imageUrl field to store video URL
          title: customPrompt || `Generated reel for ${character.name}`,
          description: `Reel generated using AI prompt: ${result.generatedPrompt}`,
          prompt: result.generatedPrompt,
          userId,
          characterId
        }
      });

      console.log('✅ Post created successfully:', post);
    } catch (dbError) {
      console.error('❌ Failed to save post to database:', dbError);
      // Continue without saving post if database isn't ready
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      reelUrl: result.reelUrl,
      generatedPrompt: result.generatedPrompt,
      post
    });

  } catch (error) {
    console.error('❌ Generate Reel API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate reel' },
      { status: 500 }
    );
  }
} 
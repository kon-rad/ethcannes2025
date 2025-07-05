import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { summaryGenerationService } from '@/services/summaryGenerationService';
import { tavilySearchService } from '@/services/tavilySearchService';

export async function POST(request: NextRequest) {
  try {
    const { characterId, query, topicCount = 5 } = await request.json();

    if (!characterId || !query) {
      return NextResponse.json(
        { error: 'Character ID and query are required' },
        { status: 400 }
      );
    }

    // 获取用户会话
    const cookieStore = await cookies();
    const userId = cookieStore.get('user-id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 验证用户存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 验证角色存在
    const character = await prisma.aICharacter.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    console.log('Starting combined search and topic generation:', {
      query,
      userId,
      characterId
    });

    // 1. 执行搜索并保存结果
    const searchResults = await tavilySearchService.searchAndSave(
      { query },
      userId,
      characterId
    );

    // 2. 生成图像生成提示
    const summary = await summaryGenerationService.generateImagePrompts({
      characterId,
      userId,
      topicCount,
      searchResults
    });

    return NextResponse.json({
      success: true,
      topics: summary.topics
    });

  } catch (error) {
    console.error('Topics API error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate topic suggestions' },
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

    // 获取用户会话
    const cookieStore = await cookies();
    const userId = cookieStore.get('user-id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 获取保存的主题
    const topics = await summaryGenerationService.getSavedTopics(userId, characterId);

    if (!topics) {
      return NextResponse.json(
        { error: 'No topic suggestions found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ topics });

  } catch (error) {
    console.error('Get topics API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch topic suggestions' },
      { status: 500 }
    );
  }
} 
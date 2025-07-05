import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { summaryGenerationService } from '@/services/summaryGenerationService';

export async function POST(request: NextRequest) {
  try {
    const { characterId, topicCount = 5, format = 'list' } = await request.json();

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

    // 验证当前状态中存在搜索结果
    const currentState = await prisma.currentState.findUnique({
      where: {
        userId_characterId: {
          userId,
          characterId
        }
      }
    });

    if (!currentState?.searchResults) {
      return NextResponse.json(
        { error: 'No search results found. Please perform a search first.' },
        { status: 400 }
      );
    }

    // 生成主题摘要
    const summary = await summaryGenerationService.generateTopicSummary({
      characterId,
      userId,
      topicCount,
      format
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
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { tavilySearchService } from '@/services/tavilySearchService';

export async function POST(request: NextRequest) {
  try {
    const { query, characterId } = await request.json();

    if (!query || !characterId) {
      return NextResponse.json(
        { error: 'Query and character ID are required' },
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

    // 获取角色
    const character = await prisma.aICharacter.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    console.log('Starting search and save operation with:', {
      query,
      userId,
      characterId
    });

    // 执行搜索并保存结果
    const searchResults = await tavilySearchService.searchAndSave(
      { query },
      userId,
      characterId
    );

    return NextResponse.json({
      success: true,
      results: searchResults
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    // 提供更详细的错误信息
    let errorMessage = 'Failed to process search request';
    let details = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      details = { 
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
    
    return NextResponse.json(
      { error: errorMessage, details },
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

    // 获取最新搜索结果
    const searchResults = await tavilySearchService.getLatestSearchResults(userId, characterId);

    return NextResponse.json({ results: searchResults });

  } catch (error) {
    console.error('Get search results API error:', error);
    
    // 提供更详细的错误信息
    let errorMessage = 'Failed to fetch search results';
    let details = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      details = { 
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
    
    return NextResponse.json(
      { error: errorMessage, details },
      { status: 500 }
    );
  }
} 
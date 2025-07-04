import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/posts - Fetch posts for a user or character
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const characterId = searchParams.get('characterId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId && !characterId) {
      return NextResponse.json(
        { error: 'Either userId or characterId is required' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (characterId) {
      where.characterId = characterId;
    }

    console.log('Fetching posts with criteria:', { where, limit, offset });

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true
          }
        },
        character: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    console.log('Found posts:', posts.length, 'posts');

    return NextResponse.json({
      posts,
      pagination: {
        limit,
        offset,
        hasMore: posts.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const { type, content, imageUrl, title, description, userId, characterId } = await request.json();

    if (!type || !userId) {
      return NextResponse.json(
        { error: 'Type and userId are required' },
        { status: 400 }
      );
    }

    // Validate post type
    const validTypes = ['image', 'text', 'video'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid post type. Must be one of: image, text, video' },
        { status: 400 }
      );
    }

    // Validate required fields based on type
    if (type === 'image' && !imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required for image posts' },
        { status: 400 }
      );
    }

    if (type === 'text' && !content) {
      return NextResponse.json(
        { error: 'Content is required for text posts' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        type,
        content,
        imageUrl,
        title,
        description,
        userId,
        characterId
      },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true
          }
        },
        character: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      }
    });

    return NextResponse.json(post);

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 
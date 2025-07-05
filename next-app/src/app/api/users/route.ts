import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');

    if (!userId && !walletAddress) {
      return NextResponse.json(
        { error: 'Either userId or walletAddress is required' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (userId) {
      where.id = userId;
    }
    if (walletAddress) {
      where.walletAddress = walletAddress;
    }

    const user = await prisma.user.findFirst({
      where,
      include: {
        characters: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            systemPrompt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
} 
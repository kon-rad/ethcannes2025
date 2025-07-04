'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Post {
  id: string;
  type: 'image' | 'text' | 'video';
  content?: string;
  imageUrl?: string;
  title?: string;
  description?: string;
  createdAt: string;
  user: {
    id: string;
    walletAddress: string;
  };
  character?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

interface PostFeedProps {
  userId?: string;
  characterId?: string;
  limit?: number;
}

export default function PostFeed({ userId, characterId, limit = 20 }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchPosts = async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString()
      });

      if (userId) {
        params.append('userId', userId);
      }
      if (characterId) {
        params.append('characterId', characterId);
      }

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      
      if (reset) {
        setPosts(data.posts);
        setOffset(limit);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
        setOffset(prev => prev + limit);
      }
      
      setHasMore(data.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
  }, [userId, characterId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={() => fetchPosts(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
          {/* Post Header */}
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              {post.character?.imageUrl ? (
                <Image
                  src={post.character.imageUrl}
                  alt={post.character.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm">
                    {post.user.walletAddress.slice(2, 4).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-900">
                  {post.character?.name || shortenAddress(post.user.walletAddress)}
                </p>
                {post.character && (
                  <span className="ml-2 text-xs text-gray-500">
                    by {shortenAddress(post.user.walletAddress)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Post Content */}
          {post.title && (
            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
          )}
          
          {post.description && (
            <p className="text-gray-600 mb-4">{post.description}</p>
          )}

          {post.type === 'image' && post.imageUrl && (
            <div className="mb-4">
              <Image
                src={post.imageUrl}
                alt={post.title || 'Generated image'}
                width={600}
                height={400}
                className="rounded-lg w-full h-auto"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}

          {post.type === 'text' && post.content && (
            <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
          )}

          {/* Post Footer */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="capitalize">{post.type} post</span>
            {post.character && (
              <span className="text-blue-600">@{post.character.name}</span>
            )}
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => fetchPosts(false)}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
} 
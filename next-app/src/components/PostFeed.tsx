'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  type: string;
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
  characterId?: string;
}

export default function PostFeed({ characterId }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, [characterId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Fetch posts - if characterId is provided, filter by that character
      const url = characterId 
        ? `/api/posts?characterId=${characterId}&limit=50`
        : '/api/posts?limit=50';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      } else {
        setError('Failed to fetch posts');
      }
    } catch (err) {
      setError('Failed to fetch posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCharacterClick = (characterId: string) => {
    router.push(`/character/${characterId}`);
  };

  // Generate random heart count between 20-50
  const getRandomHeartCount = () => {
    return Math.floor(Math.random() * (50 - 20 + 1)) + 20;
  };

  // Generate random view count between 160-2400
  const getRandomViewCount = () => {
    return Math.floor(Math.random() * (2400 - 160 + 1)) + 160;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F2937]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B7280]">{error}</p>
        <button 
          onClick={fetchPosts}
          className="mt-4 px-4 py-2 bg-[#1F2937] text-white rounded-lg hover:bg-[#374151] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B7280] text-lg">No posts yet</p>
        <p className="text-[#9CA3AF] text-sm mt-2">Be the first to create some content!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Post Header */}
          <div className="p-4 pb-2">
            <div className="flex items-center space-x-2 mb-2">
              {post.character ? (
                <button
                  onClick={() => handleCharacterClick(post.character!.id)}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  {post.character.imageUrl ? (
                    <Image
                      src={post.character.imageUrl}
                      alt={post.character.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[#F3F4F6] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-semibold text-[#1F2937] text-sm truncate hover:text-[#374151] transition-colors">
                      {post.character.name}
                    </h3>
                    <p className="text-[#6B7280] text-xs">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </button>
              ) : (
                <>
                  <div className="w-8 h-8 bg-[#F3F4F6] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1F2937] text-sm truncate">
                      Unknown Character
                    </h3>
                    <p className="text-[#6B7280] text-xs">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <div className="text-[#6B7280] text-xs">
              {formatAddress(post.user.walletAddress)}
            </div>
          </div>

          {/* Post Image - Larger and more prominent */}
          {post.imageUrl && (
            <div className="relative w-full h-64">
              <Image
                src={post.imageUrl}
                alt={post.title || 'Post image'}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Post Title */}
          {post.title && (
            <div className="p-4 pt-3">
              <h4 className="text-sm font-semibold text-[#1F2937] line-clamp-2">{post.title}</h4>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span>{getRandomHeartCount()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{getRandomViewCount()}</span>
                </div>
              </div>
              
              {/* Post Type Badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                post.type === 'image' ? 'bg-blue-100 text-blue-800' :
                post.type === 'video' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 
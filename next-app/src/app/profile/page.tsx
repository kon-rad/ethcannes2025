'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import PostFeed from '@/components/PostFeed';

interface User {
  id: string;
  walletAddress: string;
  createdAt: string;
  characters: Array<{
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    systemPrompt: string;
  }>;
}

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'characters'>('posts');
  const [imagePrompts, setImagePrompts] = useState<{ [key: string]: string }>({});
  const [reelPrompts, setReelPrompts] = useState<{ [key: string]: string }>({});
  const [generatingImage, setGeneratingImage] = useState<{ [key: string]: boolean }>({});
  const [generatingReel, setGeneratingReel] = useState<{ [key: string]: boolean }>({});
  const [postFeedRefreshKey, setPostFeedRefreshKey] = useState(0); // Add refresh key for PostFeed

  const userId = searchParams.get('userId');
  const walletAddress = searchParams.get('walletAddress');

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId && !walletAddress) {
        setError('User ID or wallet address is required');
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (walletAddress) params.append('walletAddress', walletAddress);

        const response = await fetch(`/api/users?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, walletAddress]);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const generateNewImage = async (character: any) => {
    if (!user) return;

    setGeneratingImage(prev => ({ ...prev, [character.id]: true }));
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: character.id,
          characterName: character.name,
          characterDescription: character.description,
          prompt: imagePrompts[character.id] || undefined,
          existingImageUrl: character.imageUrl || undefined,
          userId: user.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setImagePrompts(prev => ({ ...prev, [character.id]: '' }));
        
        // Refresh the post feed to show the new post
        setPostFeedRefreshKey(prev => prev + 1);
        
        alert('New image generated and posted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate image: ${errorMessage}`);
    } finally {
      setGeneratingImage(prev => ({ ...prev, [character.id]: false }));
    }
  };

  const generateNewReel = async (character: any) => {
    if (!user) return;

    setGeneratingReel(prev => ({ ...prev, [character.id]: true }));
    try {
      const response = await fetch('/api/generate-reel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: character.id,
          customPrompt: reelPrompts[character.id] || undefined,
          userId: user.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReelPrompts(prev => ({ ...prev, [character.id]: '' }));
        
        // Refresh the post feed to show the new post
        setPostFeedRefreshKey(prev => prev + 1);
        
        alert('Reel generated successfully! Check the console for debugging information.');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate reel');
      }
    } catch (error) {
      console.error('Error generating reel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate reel: ${errorMessage}`);
    } finally {
      setGeneratingReel(prev => ({ ...prev, [character.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-black text-2xl font-bold">
                  {user.walletAddress.slice(2, 4).toUpperCase()}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {shortenAddress(user.walletAddress)}
              </h1>
              <p className="text-gray-600 mt-1">
                Member since {formatDate(user.createdAt)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {user.characters.length} character{user.characters.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'characters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Characters
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'posts' ? (
          <PostFeed userId={user.id} refreshKey={postFeedRefreshKey} />
        ) : (
          <div className="space-y-6">
            {user.characters.map((character) => (
              <div key={character.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex">
                  {/* Character Image */}
                  <div className="w-48 h-48 flex-shrink-0">
                    {character.imageUrl ? (
                      <Image
                        src={character.imageUrl}
                        alt={character.name}
                        width={192}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Character Info and Actions */}
                  <div className="flex-1 p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {character.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {character.description}
                      </p>
                    </div>

                    {/* Generate Image Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Generate Image Post</h4>
                      <div className="space-y-2">
                        <textarea
                          value={imagePrompts[character.id] || ''}
                          onChange={(e) => setImagePrompts(prev => ({ ...prev, [character.id]: e.target.value }))}
                          placeholder={`Create a new social media post image featuring ${character.name} that's relevant to their expertise: ${character.description}. Leave empty for auto-generated on-brand content.`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          disabled={generatingImage[character.id]}
                        />
                        <button
                          onClick={() => generateNewImage(character)}
                          disabled={generatingImage[character.id]}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-black px-4 py-2 rounded-md text-sm transition-colors flex items-center space-x-2"
                        >
                          {generatingImage[character.id] ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Generate Image</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Generate Reel Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Generate Reel</h4>
                      <div className="space-y-2">
                        <textarea
                          value={reelPrompts[character.id] || ''}
                          onChange={(e) => setReelPrompts(prev => ({ ...prev, [character.id]: e.target.value }))}
                          placeholder={`Optional prompt for reel generation. Leave empty for auto-generated prompt.`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          disabled={generatingReel[character.id]}
                        />
                        <button
                          onClick={() => generateNewReel(character)}
                          disabled={generatingReel[character.id]}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-black px-4 py-2 rounded-md text-sm transition-colors flex items-center space-x-2"
                        >
                          {generatingReel[character.id] ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Generate Reel</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
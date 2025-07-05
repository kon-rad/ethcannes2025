'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'

interface Character {
  id: string
  name: string
  description: string
  systemPrompt: string
  imageUrl?: string
  ownerWalletAddress: string
  createdAt: string
  user: {
    walletAddress: string
  }
}

export default function AIProfileHome() {
  const router = useRouter()
  const { address } = useWallet()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      if (response.ok) {
        const userData = await response.json()
        // User is authenticated
        fetchCharacters()
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters')
      if (response.ok) {
        const data = await response.json()
        setCharacters(data)
      }
    } catch (error) {
      console.error('Error fetching characters:', error)
    }
  }

  // Generate random follower and post counts for demo purposes
  const getRandomFollowers = () => {
    const min = 234
    const max = 200000
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const getRandomPosts = () => {
    const min = 5
    const max = 150
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
        {/* Header */}
        <div className="bg-[#F8F9FA] backdrop-blur-lg rounded-2xl p-4 mb-6 border border-[#9CA3AF]/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1F2937]">AI Characters</h1>
              <p className="text-[#6B7280] mt-2">Browse and manage all AI characters</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="btn-ghost"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Characters List */}
        {characters.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-[#1F2937] mb-4">No Characters Found</h3>
            <p className="text-[#6B7280]">
              No AI characters have been created yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {characters.map((character) => (
              <div
                key={character.id}
                onClick={() => router.push(`/character/${character.id}`)}
                className="flex items-center space-x-4 p-3 bg-[#F8F9FA] rounded-xl border border-[#9CA3AF]/20 hover:border-[#9CA3AF]/40 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                {/* Avatar Image */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#9CA3AF]/20 rounded-full overflow-hidden flex items-center justify-center">
                    {character.imageUrl ? (
                      <img
                        src={character.imageUrl}
                        alt={character.name}
                        className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Character Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[#1F2937] mb-1 truncate">
                    {character.name}
                  </h3>
                  <div className="flex space-x-4 text-sm text-[#6B7280]">
                    <span>{formatNumber(getRandomPosts())} posts</span>
                    <span>{formatNumber(getRandomFollowers())} followers</span>
                  </div>
                </div>
                
                {/* Arrow indicator */}
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#3B82F6] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
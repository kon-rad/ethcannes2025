'use client'

import { useState, useEffect } from 'react'

interface Character {
  id: string
  name: string
  description: string
  systemPrompt: string
  imageUrl?: string
  ownerWalletAddress: string
  createdAt: string
}

export default function CharacterList() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters')
      if (response.ok) {
        const data = await response.json()
        setCharacters(data)
      }
    } catch (error) {
      console.error('Error fetching characters:', error)
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
      </div>
    )
  }

  if (characters.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] mb-3 sm:mb-4">No Characters Yet</h2>
        <p className="text-[#6B7280] mb-6 text-sm sm:text-base">
          Create your first AI character to start building your digital presence
        </p>
      </div>
    )
  }

  return (
    <div className="px-2 sm:px-0">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2937] mb-6 sm:mb-8">Your AI Characters</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {characters.map((character) => (
          <div
            key={character.id}
            className="bg-[#F8F9FA] backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-[#9CA3AF]/20 hover:border-[#9CA3AF]/40 transition-all duration-200"
          >
            {character.imageUrl && (
              <div className="w-full h-40 sm:h-48 bg-[#9CA3AF]/20 rounded-lg mb-4 flex items-center justify-center">
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
            <h3 className="text-lg sm:text-xl font-semibold text-[#1F2937] mb-2">{character.name}</h3>
            <p className="text-[#6B7280] text-sm mb-3 line-clamp-2">
              {character.description}
            </p>
            

            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <span className="text-xs text-[#9CA3AF]">
                Created {new Date(character.createdAt).toLocaleDateString()}
              </span>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button 
                  onClick={() => window.location.href = `/character/${character.id}`}
                  className=" btn-sm flex items-center justify-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
                </button>
                <button 
                  onClick={() => window.location.href = `/character/${character.id}`}
                  className=""
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 
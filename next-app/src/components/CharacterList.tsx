'use client'

import { useState, useEffect } from 'react'

interface Character {
  id: string
  name: string
  description: string
  systemPrompt: string
  imageUrl?: string
  contractAddress?: string
  consultationCallPrice?: string
  sponsorshipReelPrice?: string
  exclusiveContentPrice?: string
  chatPrice?: string
  voicePrice?: string
  brandPromoPrice?: string
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

  const formatPrice = (price: string | undefined, type: 'consultation' | 'sponsorship') => {
    if (!price || price === '0') return 'Free'
    
    if (type === 'consultation') {
      return `${price}¢/min`
    } else {
      const ethPrice = parseFloat(price) / 1e18
      return `${ethPrice.toFixed(3)} ETH`
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (characters.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">No Characters Yet</h2>
        <p className="text-gray-300 mb-6">
          Create your first AI character to start monetizing exclusive content
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-8">Your AI Characters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((character) => (
          <div
            key={character.id}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200"
          >
            {character.imageUrl && (
              <div className="w-full h-48 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
            <h3 className="text-xl font-semibold text-white mb-2">{character.name}</h3>
            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
              {character.description}
            </p>
            
            {/* Pricing Information */}
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Consultation:</span>
                <span className="text-green-400 font-medium">
                  {formatPrice(character.consultationCallPrice, 'consultation')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Sponsorship:</span>
                <span className="text-green-400 font-medium">
                  {formatPrice(character.sponsorshipReelPrice, 'sponsorship')}
                </span>
              </div>
            </div>
            
            {character.contractAddress && (
              <div className="mb-4 p-3 bg-green-900/20 rounded-lg">
                <p className="text-green-400 text-xs font-mono">
                  Contract: {character.contractAddress.slice(0, 6)}...{character.contractAddress.slice(-4)}
                </p>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                Created {new Date(character.createdAt).toLocaleDateString()}
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => window.location.href = `/character/${character.id}`}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
                </button>
                <button 
                  onClick={() => window.location.href = `/character/${character.id}`}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
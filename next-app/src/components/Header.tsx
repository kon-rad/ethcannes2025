'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user?: any
  onLogout: () => void
  onCreateCharacter?: () => void
}

export default function Header({ user, onLogout, onCreateCharacter }: HeaderProps) {
  const { isConnected, address } = useWallet()
  const router = useRouter()
  const [shortAddress, setShortAddress] = useState('')

  useEffect(() => {
    if (address) {
      setShortAddress(`${address.slice(0, 6)}...${address.slice(-4)}`)
    }
  }, [address])

  const handleCreateCharacter = () => {
    if (onCreateCharacter) {
      onCreateCharacter()
    } else {
      router.push('/create-character')
    }
  }

  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">AI Influencer Platform</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Wallet Status */}
                {user?.walletAddress && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white text-sm font-medium">
                      {shortAddress}
                    </span>
                  </div>
                )}
                
                {/* AI Profile Hub Button */}
                <button
                  onClick={() => router.push('/ai-profile')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>AI Hub</span>
                </button>
                
                {/* Create Character Button */}
                <button
                  onClick={handleCreateCharacter}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                  title="Create Character"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 4v16m8-8H4" 
                    />
                  </svg>
                </button>
                
                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="text-gray-300 text-sm">
                Not connected
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 
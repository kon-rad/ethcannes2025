'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user?: any
  onLogout: () => void
  onCreateCharacter?: () => void
  isInWorldApp?: boolean
}

export default function Header({ user, onLogout, onCreateCharacter, isInWorldApp }: HeaderProps) {
  const { isConnected, address } = useWallet()
  const router = useRouter()
  const [shortAddress, setShortAddress] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    onLogout()
    setIsMobileMenuOpen(false)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-[#F8F9FA] backdrop-blur-lg border-b border-[#9CA3AF]/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/')}
          >
            <img
              src="/augmi-logo.png"
              alt="Augmi Logo"
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
            <h1 className="text-lg sm:text-2xl font-bold text-[#1F2937]">Augmi</h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Wallet Status */}
                {user?.walletAddress && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                    <span className="text-[#1F2937] text-sm font-medium">
                      {shortAddress}
                    </span>
                    {isInWorldApp && (
                      <span className="text-[#22C55E] text-xs">🌍 World App</span>
                    )}
                  </div>
                )}
                
                {/* Dashboard Button */}
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-cyberpunk-secondary flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
                
                {/* AI Profile Hub Button */}
                <button
                  onClick={() => router.push('/ai-profile')}
                  className="btn-cyberpunk-secondary flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden sm:inline">AI Hub</span>
                </button>
                
                {/* Create Character Button */}
                <button
                  onClick={handleCreateCharacter}
                  className="btn-cyberpunk btn-sm p-2 flex items-center justify-center"
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
                  onClick={handleLogout}
                  className="btn-cyberpunk-danger"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="text-[#6B7280] text-sm">
                Not connected
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="btn-ghost p-2"
              aria-label="Toggle mobile menu"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#9CA3AF]/20 py-4 space-y-3">
            {user ? (
              <>
                {/* Wallet Status Mobile */}
                {user?.walletAddress && (
                  <div className="flex items-center justify-between p-3 bg-[#9CA3AF]/5 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                      <span className="text-[#1F2937] text-sm font-medium">
                        {shortAddress}
                      </span>
                      {isInWorldApp && (
                        <span className="text-[#22C55E] text-xs">🌍</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Mobile Menu Items */}
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="w-full text-left btn-cyberpunk-secondary flex items-center space-x-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  <span>Dashboard</span>
                </button>
                
                <button
                  onClick={() => handleNavigation('/ai-profile')}
                  className="w-full text-left btn-cyberpunk-secondary flex items-center space-x-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>AI Profile Hub</span>
                </button>
                
                <button
                  onClick={handleCreateCharacter}
                  className="w-full text-left btn-cyberpunk flex items-center space-x-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Character</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left btn-cyberpunk-danger flex items-center space-x-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="text-[#6B7280] text-sm p-3">
                Not connected
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
} 
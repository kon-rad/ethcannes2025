'use client'

import { useState, useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import Header from '@/components/Header'
import CharacterCreator from '@/components/CharacterCreator'

interface AppWrapperProps {
  children: React.ReactNode
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showCreator, setShowCreator] = useState(false)
  const [isInWorldApp, setIsInWorldApp] = useState(false)

  useEffect(() => {
    // Check if we're running in World App
    const checkWorldApp = () => {
      try {
        const installed = MiniKit.isInstalled()
        setIsInWorldApp(installed)
        console.log('MiniKit installed:', installed)
      } catch (error) {
        console.log('MiniKit not available:', error)
        setIsInWorldApp(false)
      }
    }

    checkWorldApp()
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // If not authenticated, don't show the header
  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onCreateCharacter={() => setShowCreator(true)}
        isInWorldApp={isInWorldApp}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {showCreator ? (
          <CharacterCreator 
            onClose={() => setShowCreator(false)}
            onCharacterCreated={() => {
              setShowCreator(false)
              // Refresh character list
            }}
            user={user}
          />
        ) : (
          children
        )}
      </main>
    </div>
  )
} 
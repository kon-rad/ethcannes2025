'use client'

import { useState, useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import CharacterList from '@/components/CharacterList'
import CharacterCreator from '@/components/CharacterCreator'
import LoginButton from '@/components/LoginButton'
import Header from '@/components/Header'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showCreator, setShowCreator] = useState(false)
  const [isInWorldApp, setIsInWorldApp] = useState(false)

  useEffect(() => {
    // Check if we're running in World App
    const checkWorldApp = () => {
      const installed = MiniKit.isInstalled()
      setIsInWorldApp(installed)
      console.log('MiniKit installed:', installed)
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

  const handleLogin = async () => {
    // This function will be called by the LoginButton component after successful SIWE authentication
    await checkAuthStatus()
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md w-full mx-4">
          <h1 className="text-4xl font-bold text-white mb-4">AI Influencer Platform</h1>
          <p className="text-gray-300 mb-8">
            Create AI characters and monetize exclusive content with World App
          </p>
          
          <LoginButton onLogin={handleLogin} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onCreateCharacter={() => setShowCreator(true)}
        isInWorldApp={isInWorldApp}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCreator ? (
          <CharacterCreator 
            onClose={() => setShowCreator(false)}
            onCharacterCreated={() => {
              setShowCreator(false)
              // Refresh character list
            }}
          />
        ) : (
          <CharacterList />
        )}
      </main>
    </div>
  )
} 
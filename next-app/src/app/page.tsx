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
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-4">
        <div className="bg-[#F8F9FA] backdrop-blur-lg rounded-2xl p-6 sm:p-8 text-center w-full max-w-md mx-auto border border-[#9CA3AF]/20">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#1F2937] mb-4">Augmi</h1>
          <p className="text-[#6B7280] mb-6 sm:mb-8 text-sm sm:text-base">
            Create AI characters and build your digital presence with World App
          </p>
          
          <LoginButton onLogin={handleLogin} />
        </div>
      </div>
    )
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
          />
        ) : (
          <CharacterList />
        )}
      </main>
    </div>
  )
} 
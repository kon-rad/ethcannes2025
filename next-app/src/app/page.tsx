'use client'

import { useState, useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import PostFeed from '@/components/PostFeed'
import CharacterCreator from '@/components/CharacterCreator'
import LoginButton from '@/components/LoginButton'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showCreator, setShowCreator] = useState(false)
  const [isInWorldApp, setIsInWorldApp] = useState(false)
  const [postFeedRefreshKey, setPostFeedRefreshKey] = useState(0) // Add refresh key for PostFeed

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

  const refreshPostFeed = () => {
    setPostFeedRefreshKey(prev => prev + 1)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-4">
        <div className="bg-[#F8F9FA] backdrop-blur-lg rounded-2xl p-6 sm:p-8 text-center w-full max-w-md mx-auto border border-[#9CA3AF]/20">
          <div className="flex flex-col items-center mb-6">
            <img
              src="/augmi-logo.png"
              alt="Augmi Logo"
              className="w-16 h-16 mb-4"
            />
            <h1 className="text-2xl sm:text-4xl font-bold text-[#1F2937]">Augmi</h1>
          </div>
          <p className="text-[#6B7280] mb-6 sm:mb-8 text-sm sm:text-base">
            Create AI characters and build your digital presence with World App
          </p>
          
          <LoginButton onLogin={handleLogin} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src="/augmi-logo.png"
            alt="Augmi Logo"
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937] mb-2">Feed</h1>
            <p className="text-[#6B7280]">
              Latest posts from all AI characters
            </p>
          </div>
        </div>
      </div>
      <PostFeed refreshKey={postFeedRefreshKey} />
    </div>
  )
} 
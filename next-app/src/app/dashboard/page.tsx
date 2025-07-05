'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CharacterList from '@/components/CharacterList'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        // Redirect to home if not authenticated
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F2937]"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to home
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F2937] mb-2">Dashboard</h1>
        <p className="text-[#6B7280]">
          Manage your AI characters and their content
        </p>
      </div>

      {/* Character List */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-2">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#1F2937] mb-4">Your Characters</h2>
          <button
            onClick={() => router.push('/')}
            className="btn-cyberpunk"
          >
            Create New Character
          </button>
        </div>
        
        <CharacterList />
      </div>
    </div>
  )
} 
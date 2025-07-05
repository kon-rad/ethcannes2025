'use client'

import { useState, useCallback, useEffect } from 'react'
import { MiniKit, ResponseEvent } from '@worldcoin/minikit-js'
import { useWallet } from '@/hooks/useWallet'

interface LoginButtonProps {
  onLogin: () => void
}

export default function LoginButton({ onLogin }: LoginButtonProps) {
  const { isConnected, isConnecting, connect, signIn, isLoading } = useWallet()
  const [isWorldAppConnecting, setIsWorldAppConnecting] = useState(false)
  const [isInWorldApp, setIsInWorldApp] = useState(false)

  // Check if we're in World App on mount
  useEffect(() => {
    setIsInWorldApp(MiniKit.isInstalled())
  }, [])

  const handleWorldAppLogin = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      console.error('MiniKit is not installed')
      return
    }

    setIsWorldAppConnecting(true)
    try {
      // Get nonce for wallet auth
      const nonceRes = await fetch('/api/nonce')
      const { nonce } = await nonceRes.json()

      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: nonce,
        requestId: '0',
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: 'Sign in to AI Influencer Platform to create and manage AI characters',
      })

      if (finalPayload.status === 'success') {
        // Verify the SIWE message
        const response = await fetch('/api/complete-siwe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payload: finalPayload,
            nonce,
          }),
        })

        if (response.ok) {
          onLogin()
        }
      }
    } catch (error) {
      console.error('World App login failed:', error)
    } finally {
      setIsWorldAppConnecting(false)
    }
  }, [onLogin])

  const handleMetaMaskLogin = async () => {
    if (!isConnected) {
      // Just connect and let the user click again when connected
      connect()
      return
    }

    const success = await signIn()
    if (success) {
      onLogin()
    }
  }

  const getMetaMaskButtonText = () => {
    if (isConnecting) return 'Connecting...'
    if (isLoading) return 'Signing...'
    if (isConnected) return 'Sign in with Ethereum'
    return 'Connect MetaMask'
  }

  const isMetaMaskDisabled = isConnecting || isLoading
  const isWorldAppDisabled = isWorldAppConnecting

  return (
    <div className="space-y-4 w-full">
      {/* World App Login Button */}
      {isInWorldApp && (
        <button
          onClick={handleWorldAppLogin}
          disabled={isWorldAppDisabled}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">🌍</span>
            <span>{isWorldAppConnecting ? 'Connecting to World App...' : 'Sign in with World App'}</span>
          </div>
        </button>
      )}

      {/* Divider */}
      {isInWorldApp && (
        <div className="flex items-center">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-gray-400 text-sm">or</span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>
      )}

      {/* MetaMask Login Button */}
      <button
        onClick={handleMetaMaskLogin}
        disabled={isMetaMaskDisabled}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0 2 2 0 01-4 0z" />
          </svg>
          <span>{getMetaMaskButtonText()}</span>
        </div>
      </button>
    </div>
  )
} 
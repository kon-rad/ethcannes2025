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
    try {
      const installed = MiniKit.isInstalled()
      setIsInWorldApp(installed)
      console.log('MiniKit installed:', installed)
    } catch (error) {
      console.log('MiniKit not available:', error)
      setIsInWorldApp(false)
    }
  }, [])

  const handleWorldAppLogin = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      alert('Please open this app in World App to use World App authentication')
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
        statement: 'Sign in to Augmi to create and manage AI characters',
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
          const result = await response.json()
          console.log('Login successful:', result)
          onLogin()
        } else {
          const error = await response.json()
          console.error('Login failed:', error)
          alert(`Login failed: ${error.message || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('World App login failed:', error)
      alert('World App login failed. Please try again.')
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
      {/* World App Login Button - Always show, but handle gracefully */}
      <button
        onClick={handleWorldAppLogin}
        disabled={isWorldAppDisabled}
        className={`w-full btn-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg disabled:cursor-not-allowed ${
          isInWorldApp 
            ? '' 
            : 'btn-secondary'
        }`}
      >
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg">🌍</span>
          <span className="text-sm sm:text-base">
            {isWorldAppConnecting 
              ? 'Connecting to World App...' 
              : isInWorldApp 
                ? 'Sign in with World App' 
                : 'Sign in with World App (Open in World App)'
            }
          </span>
        </div>
      </button>

      {/* Divider */}
      <div className="flex items-center">
        <div className="flex-1 border-t border-[#9CA3AF]/20"></div>
        <span className="px-4 text-[#9CA3AF] text-sm">or</span>
        <div className="flex-1 border-t border-[#9CA3AF]/20"></div>
      </div>

      {/* MetaMask Login Button */}
      <button
        onClick={handleMetaMaskLogin}
        disabled={isMetaMaskDisabled}
        className="w-full  btn-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0 2 2 0 01-4 0z" />
          </svg>
          <span className="text-sm sm:text-base">{getMetaMaskButtonText()}</span>
        </div>
      </button>

      {/* Info message when not in World App */}
      {!isInWorldApp && (
        <div className="mt-4 p-3 bg-[#3B82F6]/20 border border-[#3B82F6]/30 rounded-lg">
          <p className="text-[#3B82F6] text-xs sm:text-sm text-center">
            💡 For the best experience, open this app in World App to use native authentication
          </p>
        </div>
      )}
    </div>
  )
} 
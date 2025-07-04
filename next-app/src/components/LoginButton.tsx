'use client'

import { useWallet } from '@/hooks/useWallet'

interface LoginButtonProps {
  onLogin: () => void
}

export default function LoginButton({ onLogin }: LoginButtonProps) {
  const { isConnected, isConnecting, connect, signIn, isLoading } = useWallet()

  const handleLogin = async () => {
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

  const getButtonText = () => {
    if (isConnecting) return 'Connecting...'
    if (isLoading) return 'Signing...'
    if (isConnected) return 'Sign in with Ethereum'
    return 'Connect MetaMask'
  }

  const isDisabled = isConnecting || isLoading

  return (
    <button
      onClick={handleLogin}
      disabled={isDisabled}
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg disabled:cursor-not-allowed"
    >
      <div className="flex items-center space-x-2">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0 2 2 0 01-4 0z" />
        </svg>
        <span>{getButtonText()}</span>
      </div>
    </button>
  )
} 
'use client'

import { useWallet } from '@/hooks/useWallet'

export default function WalletStatus() {
  const { address, isConnected, disconnect } = useWallet()

  if (!isConnected) {
    return null
  }

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  return (
    <div className="flex items-center space-x-4 bg-gray-100 p-3 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-gray-700">Connected</span>
      </div>
      <span className="text-sm text-gray-600 font-mono">{shortAddress}</span>
      <button
        onClick={disconnect}
        className="text-sm text-red-600 hover:text-red-800 transition-colors"
      >
        Disconnect
      </button>
    </div>
  )
} 
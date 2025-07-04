'use client'

import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'

interface WagmiProviderProps {
  children: React.ReactNode
}

const queryClient = new QueryClient()

export default function WagmiProvider({ children }: WagmiProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        {children}
      </WagmiConfig>
    </QueryClientProvider>
  )
} 
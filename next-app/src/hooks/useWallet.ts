'use client'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { SiweMessage } from 'siwe'
import { getAddress } from 'viem'

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

interface UseWalletReturn {
  address: string | undefined
  isConnected: boolean
  isConnecting: boolean
  connect: () => void
  disconnect: () => void
  signIn: () => Promise<boolean>
  isLoading: boolean
}

export function useWallet(): UseWalletReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [address, setAddress] = useState<string | undefined>()
  const { disconnect: wagmiDisconnect } = useDisconnect()

  // Check if MetaMask is connected on mount and listen for account changes
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && window.ethereum.isMetaMask) {
        try {
                  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          const checksummedAddress = getAddress(accounts[0])
          setAddress(checksummedAddress)
          console.log('Found existing MetaMask connection:', checksummedAddress)
        }
        } catch (error) {
          console.error('Failed to check MetaMask connection:', error)
        }
      } else {
        console.log('MetaMask not detected or not primary provider')
      }
    }
    
    checkConnection()

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      console.log('Accounts changed:', accounts)
      if (accounts.length === 0) {
        setAddress(undefined)
      } else {
        const checksummedAddress = getAddress(accounts[0])
        setAddress(checksummedAddress)
      }
    }

    // Listen for chain changes
    const handleChainChanged = () => {
      console.log('Chain changed, reloading...')
      window.location.reload()
    }

    if (window.ethereum && window.ethereum.isMetaMask) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (window.ethereum && window.ethereum.isMetaMask) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const signIn = async (): Promise<boolean> => {
    if (!address) return false
    
    setIsLoading(true)
    try {
      // Get nonce from server
      const nonceResponse = await fetch('/api/nonce')
      const { nonce } = await nonceResponse.json()

      // Create SIWE message with checksummed address
      const checksummedAddress = getAddress(address)
      // Get current chain ID from MetaMask
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      const chainIdNumber = parseInt(chainId, 16)
      
      console.log('Current chain ID:', chainIdNumber)
      
      const message = new SiweMessage({
        domain: window.location.hostname,
        address: checksummedAddress,
        statement: 'Sign in to the Augmi',
        uri: window.location.origin,
        version: '1',
        chainId: chainIdNumber,
        nonce,
      })

      const messageToSign = message.prepareMessage()

      // Request signature from MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [messageToSign, checksummedAddress],
      })

      // Send to server for verification
      const requestBody = {
        message: JSON.stringify(message),
        signature,
        nonce,
      }
      
      console.log('Sending SIWE request:', requestBody)
      
      const response = await fetch('/api/complete-siwe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('SIWE verification failed:', errorData)
        throw new Error(`Authentication failed: ${errorData.error || 'Unknown error'}`)
      }

      return true
    } catch (error) {
      console.error('Sign in error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    // Check if MetaMask is available
    if (!window.ethereum) {
      alert('Please install MetaMask to use this application')
      return
    }

    // Check if MetaMask is the primary provider
    if (!window.ethereum.isMetaMask) {
      const message = `Multiple wallet extensions detected. Please:
1. Disable other wallet extensions (Phantom, etc.)
2. Refresh the page
3. Try connecting again with MetaMask as your primary wallet`
      alert(message)
      return
    }

    setIsConnecting(true)
    try {
      console.log('Requesting MetaMask accounts...')
      
      // Try to connect to MetaMask specifically
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      console.log('MetaMask accounts:', accounts)
      if (accounts.length > 0) {
        const checksummedAddress = getAddress(accounts[0])
        setAddress(checksummedAddress)
        console.log('Connected to address:', checksummedAddress)
      } else {
        throw new Error('No accounts found')
      }
    } catch (error: any) {
      console.error('Failed to connect to MetaMask:', error)
      
      if (error.code === 4001) {
        alert('Please connect your MetaMask wallet to continue')
      } else if (error.code === -32002) {
        alert('Please check MetaMask - connection request is pending')
      } else {
        alert(`Connection failed: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setAddress(undefined)
    wagmiDisconnect()
  }

  return {
    address,
    isConnected: !!address,
    isConnecting,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signIn,
    isLoading,
  }
} 
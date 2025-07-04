'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { uploadToS3 } from '@/lib/s3'

export default function CreateCharacter() {
  const router = useRouter()
  const { address } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [ethPrice, setEthPrice] = useState<number>(0)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    consultationCallPrice: '0', // 0 for free, otherwise cents per minute
    sponsorshipReelPrice: '500000000000000000', // ~$1 USD at ~$2000 ETH (will be updated with real price)
    exclusiveContentPrice: '1000000000000000000', // 1 ETH in wei
    chatPrice: '0', // Free by default
    voicePrice: '500000000000000000', // 0.5 ETH per minute in wei
    brandPromoPrice: '1000000000000000000', // ~$2 USD at ~$2000 ETH (will be updated with real price)
    image: null as File | null
  })
  const [imagePreview, setImagePreview] = useState<string>('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthStatus()
    getEthPrice()
  }, [])



  const getEthPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      const data = await response.json()
      const price = data.ethereum.usd
      setEthPrice(price)
      
      // Update sponsorship reel price to $1 USD equivalent
      const oneDollarInWei = (1 / price) * 1e18
      // Update brand promo price to $2 USD equivalent
      const twoDollarInWei = (2 / price) * 1e18
      setFormData(prev => ({
        ...prev,
        sponsorshipReelPrice: oneDollarInWei.toString(),
        brandPromoPrice: twoDollarInWei.toString()
      }))
    } catch (error) {
      console.error('Failed to fetch ETH price:', error)
      // Fallback to default values - set sponsorship reel to approximately $1 USD worth of ETH
      setFormData(prev => ({
        ...prev,
        sponsorshipReelPrice: '500000000000000000', // ~$1 USD at ~$2000 ETH
        brandPromoPrice: '1000000000000000000' // ~$2 USD at ~$2000 ETH
      }))
    }
  }

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // First upload image to S3
      let imageUrl = ''
      if (formData.image) {
        const uploadResult = await uploadToS3(formData.image)
        imageUrl = uploadResult.url
      }

      // Convert consultation call price from cents to wei for smart contract
      const consultationCallPriceInWei = formData.consultationCallPrice === '0' 
        ? '0' 
        : (parseFloat(formData.consultationCallPrice) * 1e16).toString() // Convert cents to wei (1 cent = 0.01 ETH = 1e16 wei)
      
      // Create character in database
      const characterData = {
        name: formData.name,
        description: formData.description,
        systemPrompt: formData.systemPrompt,
        consultationCallPrice: formData.consultationCallPrice, // Store in cents for display
        sponsorshipReelPrice: formData.sponsorshipReelPrice, // Store in wei for smart contract
        exclusiveContentPrice: formData.exclusiveContentPrice, // Store in wei
        chatPrice: formData.chatPrice, // Store in wei
        voicePrice: formData.voicePrice, // Store in wei
        brandPromoPrice: formData.brandPromoPrice, // Store in wei
        imageUrl: imageUrl
      }

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Deploy smart contract for the character
        const deployResponse = await fetch('/api/characters/deploy-contract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ characterId: result.id }),
        })

        if (deployResponse.ok) {
          const deployResult = await deployResponse.json()
          console.log('Smart contract deployed:', deployResult.contractAddress)
        } else {
          console.warn('Failed to deploy smart contract, but character was created')
        }
        
        router.push('/')
      } else {
        throw new Error('Failed to create character')
      }
    } catch (error) {
      console.error('Error creating character:', error)
      alert('Failed to create character. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatWeiToEth = (wei: string) => {
    if (!wei || wei === '0') return '0'
    const eth = parseFloat(wei) / 1e18
    return eth.toFixed(6)
  }

  const formatWeiToUSD = (wei: string) => {
    if (!ethPrice) return 'Loading...'
    const eth = parseFloat(wei) / 1e18
    const usd = eth * ethPrice
    return `$${usd.toFixed(2)}`
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Create AI Character</h1>
            <button
              onClick={() => router.push('/')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Character Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter character name"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                Description *
              </label>
              <textarea
                id="description"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe your AI character"
              />
            </div>

            {/* System Prompt */}
            <div>
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-white mb-2">
                System Prompt *
              </label>
              <textarea
                id="systemPrompt"
                required
                rows={4}
                value={formData.systemPrompt}
                onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Define how your AI character should behave and respond"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-white mb-2">
                Character Image
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="image"
                  className="cursor-pointer bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white hover:bg-white/20 transition-colors"
                >
                  Choose Image
                </label>
                {imagePreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Section */}
            <div className="border-t border-white/20 pt-6">
              <h2 className="text-xl font-semibold text-white mb-4">Pricing Configuration</h2>
              
              {/* Consultation Call Price */}
              <div className="mb-4">
                <label htmlFor="consultationCallPrice" className="block text-sm font-medium text-white mb-2">
                  One-on-One Consultation Call Price
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    id="consultationCallPrice"
                    min="0"
                    step="0.01"
                    value={formData.consultationCallPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, consultationCallPrice: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0 for free, otherwise cents per minute"
                  />
                  <span className="text-white text-sm">cents per minute</span>
                </div>
              </div>

              {/* Sponsorship Reel Price */}
              <div className="mb-4">
                <label htmlFor="sponsorshipReelPrice" className="block text-sm font-medium text-white mb-2">
                  Sponsorship Reel Price
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    id="sponsorshipReelPrice"
                    min="0"
                    step="0.000001"
                    value={formatWeiToEth(formData.sponsorshipReelPrice)}
                    onChange={(e) => {
                      const eth = parseFloat(e.target.value) || 0
                      const wei = (eth * 1e18).toString()
                      setFormData(prev => ({ ...prev, sponsorshipReelPrice: wei }))
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                  <span className="text-white text-sm">ETH ({formatWeiToUSD(formData.sponsorshipReelPrice)})</span>
                </div>
              </div>

              {/* Exclusive Content Price */}
              <div className="mb-4">
                <label htmlFor="exclusiveContentPrice" className="block text-sm font-medium text-white mb-2">
                  Exclusive Content Price
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    id="exclusiveContentPrice"
                    min="0"
                    step="0.000001"
                    value={formatWeiToEth(formData.exclusiveContentPrice)}
                    onChange={(e) => {
                      const eth = parseFloat(e.target.value) || 0
                      const wei = (eth * 1e18).toString()
                      setFormData(prev => ({ ...prev, exclusiveContentPrice: wei }))
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                  <span className="text-white text-sm">ETH ({formatWeiToUSD(formData.exclusiveContentPrice)})</span>
                </div>
              </div>

              {/* Chat Price */}
              <div className="mb-4">
                <label htmlFor="chatPrice" className="block text-sm font-medium text-white mb-2">
                  Chat Price (per message)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    id="chatPrice"
                    min="0"
                    step="0.000001"
                    value={formatWeiToEth(formData.chatPrice)}
                    onChange={(e) => {
                      const eth = parseFloat(e.target.value) || 0
                      const wei = (eth * 1e18).toString()
                      setFormData(prev => ({ ...prev, chatPrice: wei }))
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                  <span className="text-white text-sm">ETH ({formatWeiToUSD(formData.chatPrice)})</span>
                </div>
              </div>

              {/* Voice Price */}
              <div className="mb-4">
                <label htmlFor="voicePrice" className="block text-sm font-medium text-white mb-2">
                  Voice Price (per minute)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    id="voicePrice"
                    min="0"
                    step="0.000001"
                    value={formatWeiToEth(formData.voicePrice)}
                    onChange={(e) => {
                      const eth = parseFloat(e.target.value) || 0
                      const wei = (eth * 1e18).toString()
                      setFormData(prev => ({ ...prev, voicePrice: wei }))
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                  <span className="text-white text-sm">ETH ({formatWeiToUSD(formData.voicePrice)})</span>
                </div>
              </div>

              {/* Brand Promo Price */}
              <div className="mb-4">
                <label htmlFor="brandPromoPrice" className="block text-sm font-medium text-white mb-2">
                  Brand Promo Price
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    id="brandPromoPrice"
                    min="0"
                    step="0.000001"
                    value={formatWeiToEth(formData.brandPromoPrice)}
                    onChange={(e) => {
                      const eth = parseFloat(e.target.value) || 0
                      const wei = (eth * 1e18).toString()
                      setFormData(prev => ({ ...prev, brandPromoPrice: wei }))
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                  <span className="text-white text-sm">ETH ({formatWeiToUSD(formData.brandPromoPrice)})</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Character</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 
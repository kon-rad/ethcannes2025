'use client'

import { useState, useEffect } from 'react'
import { getWLDPriceInUSD } from '@/lib/worldcoin-pricing'
import { MiniKit } from '@worldcoin/minikit-js'

interface CharacterCreatorProps {
  onClose: () => void
  onCharacterCreated: () => void
  user?: any // Add user prop to get current user's wallet address
}

export default function CharacterCreator({ onClose, onCharacterCreated, user }: CharacterCreatorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [ethPrice, setEthPrice] = useState<number>(0)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    ownerWalletAddress: '',
    exclusiveContentPrice: 0.0067,
    image: null as File | null
  })
  const [wldPriceUSD, setWldPriceUSD] = useState<number | null>(null)

  useEffect(() => {
    const fetchWLDPrice = async () => {
      try {
        const price = await getWLDPriceInUSD()
        setWldPriceUSD(price)
      } catch (error) {
        console.error('Failed to fetch WLD price:', error)
      }
    }
    
    fetchWLDPrice()
  }, [])

  // Auto-populate owner wallet address when user is available
  useEffect(() => {
    if (user?.walletAddress) {
      setFormData(prev => ({ ...prev, ownerWalletAddress: user.walletAddress }))
    } else {
      // Fallback to MiniKit wallet address if available
      try {
        if (MiniKit.isInstalled() && (window as any).MiniKit?.walletAddress) {
          setFormData(prev => ({ ...prev, ownerWalletAddress: (window as any).MiniKit.walletAddress }))
        }
      } catch (error) {
        console.log('MiniKit not available for wallet address')
      }
    }
  }, [user])

  const formatUSDEquivalent = (wldAmount: number) => {
    if (!wldPriceUSD) return '';
    return `(~$${(wldAmount * wldPriceUSD).toFixed(2)} USD)`;
  };

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
      // First upload image to S3 if provided
      let imageUrl = ''
      if (formData.image) {
        const formDataToSend = new FormData()
        formDataToSend.append('image', formData.image)
        formDataToSend.append('characterId', 'temp-' + Date.now()) // Temporary ID for new characters

        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formDataToSend,
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          imageUrl = uploadResult.imageUrl
        } else {
          throw new Error('Failed to upload image')
        }
      }

      // Create character in database
      const characterData = {
        name: formData.name,
        description: formData.description,
        systemPrompt: formData.systemPrompt,
        ownerWalletAddress: formData.ownerWalletAddress,
        exclusiveContentPrice: formData.exclusiveContentPrice,
        chatPricePerMessage: 0, // Set to 0 since we removed this field
        voicePricePerMinute: 0, // Set to 0 since we removed this field
        brandPromoPrice: 0, // Set to 0 since we removed this field
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
        
        onCharacterCreated()
        // Reset form
        setFormData({
          name: '',
          description: '',
          systemPrompt: '',
          ownerWalletAddress: user?.walletAddress || '',
          exclusiveContentPrice: 0.0067,
          image: null
        })
        setImagePreview('')
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

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[#F8F9FA] backdrop-blur-lg rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-[#9CA3AF]/20">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1F2937]">Create AI Character</h2>
          <button
            onClick={onClose}
            className="btn-ghost text-2xl sm:text-3xl p-2"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#1F2937] mb-2">
              Character Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input"
              placeholder="Enter character name"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#1F2937] mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              placeholder="Describe your AI character"
            />
          </div>



          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-[#1F2937] mb-2">
              Character Image
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="image"
                className="cursor-pointer btn-secondary text-center sm:text-left"
              >
                Choose Image
              </label>
              {imagePreview && (
                <div className="w-20 h-20 rounded-lg overflow-hidden mx-auto sm:mx-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Payment Configuration */}
          <div className="border-t border-[#9CA3AF]/20 pt-4 sm:pt-6">
            <h3 className="text-lg sm:text-xl font-semibold text-[#1F2937] mb-4">Payment Configuration</h3>
            
            {/* Owner Wallet Address */}
            <div className="mb-4">
              <label htmlFor="ownerWalletAddress" className="block text-sm font-medium text-[#1F2937] mb-2">
                Owner Wallet Address *
              </label>
              <input
                type="text"
                id="ownerWalletAddress"
                required
                value={formData.ownerWalletAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerWalletAddress: e.target.value }))}
                className="input"
                placeholder="Enter wallet address where payments will be sent"
              />
              <p className="text-[#6B7280] text-xs mt-1">
                This is the wallet address where any future payments for this character will be sent
              </p>
            </div>

            {/* Exclusive Content Price */}
            <div>
              <label htmlFor="exclusiveContentPrice" className="block text-sm font-medium text-[#1F2937] mb-2">
                Exclusive Content Price (WLD) *
              </label>
              <input
                type="number"
                id="exclusiveContentPrice"
                step="0.001"
                min="0"
                required
                value={formData.exclusiveContentPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, exclusiveContentPrice: parseFloat(e.target.value) || 0 }))}
                className="input"
                placeholder="0.0067"
              />
              <p className="text-[#6B7280] text-xs mt-1">
                Price for exclusive content access {formatUSDEquivalent(formData.exclusiveContentPrice)}
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1  flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getWLDPriceInUSD } from '@/lib/worldcoin-pricing'

interface Character {
  id: string
  name: string
  description: string
  systemPrompt: string
  imageUrl?: string
  ownerWalletAddress: string
  exclusiveContentPrice: number
  chatPricePerMessage: number
  voicePricePerMinute: number
  brandPromoPrice: number
  contractAddress?: string
  createdAt: string
  user: {
    walletAddress: string
  }
}

export default function EditCharacter() {
  const router = useRouter()
  const params = useParams()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [wldPriceUSD, setWldPriceUSD] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    ownerWalletAddress: '',
    exclusiveContentPrice: 0.0067,
    image: null as File | null
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchCharacter()
    }
  }, [params.id])

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

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      if (!response.ok) {
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/')
    }
  }

  const fetchCharacter = async () => {
    try {
      const response = await fetch(`/api/characters/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCharacter(data)
        
        // Populate form data with existing character data
        setFormData({
          name: data.name,
          description: data.description,
          systemPrompt: data.systemPrompt || '',
          ownerWalletAddress: data.ownerWalletAddress,
          exclusiveContentPrice: data.exclusiveContentPrice,
          image: null
        })
        
        // Set image preview if character has an image
        if (data.imageUrl) {
          setImagePreview(data.imageUrl)
        }
      } else if (response.status === 401) {
        setError('Unauthorized - Please log in')
        router.push('/')
      } else if (response.status === 404) {
        setError('Character not found')
      } else {
        setError('Failed to fetch character')
      }
    } catch (error) {
      console.error('Error fetching character:', error)
      setError('Failed to fetch character')
    } finally {
      setLoading(false)
    }
  }

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
    if (!character) return

    setIsSaving(true)

    try {
      // First upload image to S3 if a new image was selected
      let imageUrl = character.imageUrl || ''
      if (formData.image) {
        const formDataToSend = new FormData()
        formDataToSend.append('image', formData.image)
        formDataToSend.append('characterId', character.id)

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

      // Update character in database
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

      const response = await fetch(`/api/characters/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      })

      if (response.ok) {
        const updatedCharacter = await response.json()
        setCharacter(updatedCharacter)
        alert('Character updated successfully!')
        router.push(`/character/${params.id}`)
      } else {
        throw new Error('Failed to update character')
      }
    } catch (error) {
      console.error('Error updating character:', error)
      alert('Failed to update character. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F2937]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#EF4444] text-lg mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="text-[#1F2937]">Character not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-[#F8F9FA] backdrop-blur-lg rounded-2xl p-4 sm:p-6 lg:p-8 border border-[#9CA3AF]/20">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937]">Edit Character</h1>
            <button
              onClick={() => router.push(`/character/${params.id}`)}
              className="btn-ghost p-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
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

            {/* System Prompt */}
            <div>
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-[#1F2937] mb-2">
                System Prompt
              </label>
              <textarea
                id="systemPrompt"
                rows={4}
                value={formData.systemPrompt}
                onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                className="input"
                placeholder="Define the character's personality, behavior, and responses"
              />
              <p className="text-[#6B7280] text-xs mt-1">
                This defines how your AI character behaves and responds in conversations
              </p>
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
                  Choose New Image
                </label>
                {imagePreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden mx-auto sm:mx-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-[#6B7280] text-xs mt-1">
                Leave empty to keep the current image
              </p>
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
                onClick={() => router.push(`/character/${params.id}`)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 
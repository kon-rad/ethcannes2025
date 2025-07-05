'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import PostFeed from '@/components/PostFeed'
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from '@worldcoin/minikit-js'
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
  userId: string
  user: {
    walletAddress: string
  }
}

export default function CharacterManagement() {
  const router = useRouter()
  const params = useParams()
  const { address } = useWallet()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [user, setUser] = useState<any>(null)
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [isEditingCharacter, setIsEditingCharacter] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    ownerWalletAddress: '',
    exclusiveContentPrice: 0.5,
    chatPricePerMessage: 0.001,
    voicePricePerMinute: 0.01,
    brandPromoPrice: 0.05
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [wldPriceUSD, setWldPriceUSD] = useState<number | null>(null)
  const [isOwner, setIsOwner] = useState(false)



  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (params.id && user) {
      fetchCharacter()
    }
  }, [params.id, user])

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

  const fetchCharacter = async () => {
    try {
      const response = await fetch(`/api/characters/public/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCharacter(data)
        
        // Check if current user is the owner
        if (user && data.userId === user.id) {
          setIsOwner(true)
        } else {
          setIsOwner(false)
        }
      } else {
        setError('Character not found')
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



  const generateNewImage = async () => {
    if (!character || !user) return

    setGeneratingImage(true)
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: character.id,
          characterName: character.name,
          characterDescription: character.description,
          prompt: imagePrompt || undefined,
          existingImageUrl: character.imageUrl || undefined,
          userId: user.id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Don't update the character's imageUrl - this is for posts, not avatar changes
        // The image is already saved as a post in the database
        setImagePrompt('')
        alert('New image generated and posted successfully!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }
    } catch (error) {
      console.error('Error generating image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Provide more helpful error messages
      if (errorMessage.includes('FLUX.1 Kontext failed') || errorMessage.includes('FLUX.1 Dev failed')) {
        alert('Image generation is temporarily unavailable. Please try again in a few minutes.')
      } else if (errorMessage.includes('Invalid image format')) {
        alert('The provided image format is not supported. Please try a different image.')
      } else if (errorMessage.includes('No images generated')) {
        alert('The AI model failed to generate an image. Please try again with a different prompt.')
      } else {
        alert(`Failed to generate image: ${errorMessage}`)
      }
    } finally {
      setGeneratingImage(false)
    }
  }

  const tipCreator = async () => {
    if (!character) return

    setProcessingPayment(true)
    try {
      // 1. Initiate payment
      const initResponse = await fetch('/api/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: character.id,
          serviceType: 'exclusiveContent'
        }),
      })

      if (!initResponse.ok) {
        const errorData = await initResponse.json()
        throw new Error(errorData.error || 'Failed to initiate payment')
      }

      const paymentData = await initResponse.json()

      // 2. Check if MiniKit is available
      if (!MiniKit.isInstalled()) {
        alert('World App is required for payments. Please install World App to continue.')
        return
      }

      // 3. Create payment payload
      const payload: PayCommandInput = {
        reference: paymentData.id,
        to: paymentData.recipientAddress,
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(paymentData.price, Tokens.WLD).toString(),
          },
        ],
        description: paymentData.description,
      }

      // 4. Send payment command (async version as per World App docs)
      console.log('Sending payment command with payload:', payload)
      
      const { finalPayload } = await MiniKit.commandsAsync.pay(payload)
      
      console.log('Payment response received:', finalPayload)

      if (finalPayload.status === 'success') {
        console.log('Payment successful, confirming with backend...')
        // 5. Confirm payment
        const confirmResponse = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: finalPayload }),
        })

        const confirmation = await confirmResponse.json()
        console.log('Backend confirmation response:', confirmation)
        
        if (confirmation.success) {
          alert('Tip sent successfully! Thank you for supporting the creator.')
          // TODO: Update UI to show exclusive content
        } else {
          throw new Error(confirmation.error || 'Payment confirmation failed')
        }
      } else {
        console.error('Payment failed with status:', finalPayload.status)
        console.error('Full payment response:', finalPayload)
        throw new Error(`Payment was not completed. Status: ${finalPayload.status}, Details: ${JSON.stringify(finalPayload)}`)
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        fullError: error
      })
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Tip failed: ${errorMessage}`)
    } finally {
      setProcessingPayment(false)
    }
  }



  const startEditing = () => {
    if (!character) return
    
    setEditFormData({
      name: character.name,
      description: character.description,
      systemPrompt: '', // Set to empty string since we're not using it
      ownerWalletAddress: character.ownerWalletAddress,
      exclusiveContentPrice: character.exclusiveContentPrice,
      chatPricePerMessage: character.chatPricePerMessage,
      voicePricePerMinute: character.voicePricePerMinute,
      brandPromoPrice: character.brandPromoPrice
    })
    setIsEditingCharacter(true)
  }

  const cancelEditing = () => {
    setIsEditingCharacter(false)
    setSelectedImage(null)
    setImagePreview(null)
    setEditFormData({
      name: '',
      description: '',
      systemPrompt: '',
      ownerWalletAddress: '',
      exclusiveContentPrice: 0.5,
      chatPricePerMessage: 0.001,
      voicePricePerMinute: 0.01,
      brandPromoPrice: 0.05
    })
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !character) return null

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', selectedImage)
      formData.append('characterId', character.id)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data.imageUrl
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const saveCharacter = async () => {
    if (!character) return

    try {
      let imageUrl = character.imageUrl

      // Upload new image if selected
      if (selectedImage) {
        const uploadedImageUrl = await uploadImage()
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl
        } else {
          return // Don't save if image upload failed
        }
      }

      // Update character in database
      const response = await fetch(`/api/characters/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editFormData,
          imageUrl
        }),
      })

      if (response.ok) {
        const updatedCharacter = await response.json()
        setCharacter(updatedCharacter)
        setIsEditingCharacter(false)
        setSelectedImage(null)
        setImagePreview(null)
        alert('Character updated successfully!')
      } else {
        throw new Error('Failed to update character')
      }
    } catch (error) {
      console.error('Error updating character:', error)
      alert(`Failed to update character: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F2937]"></div>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937]">{character.name}</h1>
              <p className="text-[#6B7280] mt-2 text-sm sm:text-base">{character.description}</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {isOwner && !isEditingCharacter && (
                              <button
                onClick={startEditing}
                className="btn-cyberpunk-accent flex items-center justify-center space-x-2"
              >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Character</span>
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="btn-ghost p-2"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Character Image */}
          <div className="mb-6 sm:mb-8">
            {isEditingCharacter ? (
              <div className="space-y-4">
                            <div className="p-3 sm:p-4 bg-[#F3F4F6] rounded-lg">
              <p className="text-[#1F2937] text-xs sm:text-sm">
                👤 <strong>Avatar/Profile Image:</strong> This is your character's main profile image that appears in their profile and character cards. This is different from post images.
              </p>
            </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-gray-700 mx-auto sm:mx-0">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : character.imageUrl ? (
                      <img
                        src={character.imageUrl}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs sm:text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">
                      Character Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="block w-full text-sm text-[#1F2937] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#6B7280] file:text-white hover:file:bg-[#4B5563] file:cursor-pointer"
                    />
                    <p className="text-[#6B7280] text-xs mt-1">
                      Upload a new image (JPEG, PNG, WebP, max 5MB)
                    </p>
                    {uploadingImage && (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 border-2 border-[#6B7280] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[#6B7280] text-sm">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {character.imageUrl ? (
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover mx-auto sm:mx-0"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-700 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                    <span className="text-gray-400 text-xs sm:text-sm">No Image</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Image Generation Section - Owner Only */}
          {isOwner && !isEditingCharacter && (
            <div className="mb-6 sm:mb-8">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">
                    Image Prompt (Optional)
                  </label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder={`Create a new social media post image featuring ${character.name} that's relevant to their expertise: ${character.description}. Leave empty for auto-generated on-brand content.`}
                    className="w-full px-3 sm:px-4 py-3 bg-white border border-[#9CA3AF]/30 rounded-lg text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6B7280] text-sm sm:text-base"
                    rows={3}
                    disabled={generatingImage}
                  />
                  <p className="text-[#6B7280] text-xs mt-1">
                    Leave empty to use auto-generated on-brand prompt based on character's expertise
                  </p>
                </div>
                <button
                  onClick={generateNewImage}
                  disabled={generatingImage}
                  className="w-full sm:w-auto btn-cyberpunk flex items-center justify-center space-x-2"
                >
                  {generatingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{character.imageUrl ? 'Generate New Post Image' : 'Generate Initial Post Image'}</span>
                    </>
                  )}
                </button>
                
                {/* Chat Button */}
                <div className="mt-4">
                  <button
                    onClick={() => router.push(`/character/${params.id}/chat`)}
                    className="w-full sm:w-auto btn-cyberpunk-accent flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Chat with {character.name}</span>
                  </button>
                </div>


              </div>
            </div>
          )}

        {/* Non-Owner View - Show character info and chat option */}
        {!isOwner && !isEditingCharacter && (
          <div className="mb-6 sm:mb-8">
            <div className="p-4 bg-[#F3F4F6] rounded-lg">
              <h3 className="text-lg font-semibold text-[#1F2937] mb-4">About {character.name}</h3>
              <p className="text-[#374151] text-sm mb-4">{character.description}</p>
              
              <div className="mt-4">
                <button
                  onClick={() => router.push(`/character/${params.id}/chat`)}
                  className="w-full btn-cyberpunk-accent flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Chat with {character.name}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tip Creator Section - Available to All Users */}
        {!isEditingCharacter && (
          <div className="mb-6 sm:mb-8">
            <div className="p-4 bg-[#F3F4F6] rounded-lg">
              <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Support {character.name}</h3>
              <p className="text-[#374151] text-sm mb-4">
                Show your appreciation and support the creator with a tip
              </p>
              
              <button
                onClick={tipCreator}
                disabled={processingPayment}
                className="w-full sm:w-auto btn-cyberpunk-secondary flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                {processingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Tip...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Tip {character.exclusiveContentPrice} WLD 
                      {wldPriceUSD && (
                        <span className="text-xs opacity-75">
                          {' '}(~${(character.exclusiveContentPrice * wldPriceUSD).toFixed(2)} USD)
                        </span>
                      )}
                      {' '}to Support Creator
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

          {/* Character Details Edit Form */}
          {isEditingCharacter && (
            <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">
                  Character Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-3 bg-white border border-[#9CA3AF]/30 rounded-lg text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6B7280] text-sm sm:text-base"
                  placeholder="Enter character name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-3 bg-white border border-[#9CA3AF]/30 rounded-lg text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6B7280] text-sm sm:text-base"
                  rows={3}
                  placeholder="Enter character description"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">
                  Owner Wallet Address
                </label>
                <input
                  type="text"
                  value={editFormData.ownerWalletAddress}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, ownerWalletAddress: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-3 bg-white border border-[#9CA3AF]/30 rounded-lg text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6B7280] text-sm sm:text-base"
                  placeholder="Enter wallet address where payments will be sent"
                />
                <p className="text-[#6B7280] text-xs mt-1">
                  This is the wallet address where any future payments for this character will be sent
                </p>
              </div>

              {/* Pricing Configuration */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-[#1F2937] mb-4">Pricing Configuration (WLD)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">
                      Tip Amount
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={editFormData.exclusiveContentPrice}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, exclusiveContentPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 sm:px-4 py-3 bg-white border border-[#9CA3AF]/30 rounded-lg text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6B7280] text-sm sm:text-base"
                      placeholder="0.5"
                    />
                    <p className="text-[#6B7280] text-xs mt-1">
                      Default tip amount for supporting the creator {formatUSDEquivalent(editFormData.exclusiveContentPrice)}
                    </p>
                  </div>


                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={saveCharacter}
                  className="btn-cyberpunk-accent flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={cancelEditing}
                  className="bg-[#6B7280] hover:bg-[#4B5563] text-white px-6 py-3 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          {!isEditingCharacter && (
            <div className="mt-6 sm:mt-8">
              <h3 className="text-lg sm:text-xl font-semibold text-[#1F2937] mb-4 sm:mb-6">
                {character.name}'s Posts
              </h3>
              <div className="bg-[#F3F4F6] rounded-lg p-3 sm:p-6">
                <PostFeed characterId={character.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
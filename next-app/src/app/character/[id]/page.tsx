'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import PostFeed from '@/components/PostFeed'

interface Character {
  id: string
  name: string
  description: string
  systemPrompt: string
  imageUrl?: string
  contractAddress?: string
  consultationCallPrice?: string
  sponsorshipReelPrice?: string
  exclusiveContentPrice?: string
  chatPrice?: string
  voicePrice?: string
  brandPromoPrice?: string
  createdAt: string
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
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    consultationCallPrice: '',
    sponsorshipReelPrice: ''
  })
  const [user, setUser] = useState<any>(null)
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [isEditingCharacter, setIsEditingCharacter] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    consultationCallPrice: '',
    sponsorshipReelPrice: '',
    exclusiveContentPrice: '',
    chatPrice: '',
    voicePrice: '',
    brandPromoPrice: ''
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [autoPosting, setAutoPosting] = useState(false)
  const [postType, setPostType] = useState<'social' | 'professional' | 'casual' | 'creative'>('social')

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchCharacter()
    }
  }, [params.id])

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
      const response = await fetch(`/api/characters/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCharacter(data)
        setFormData({
          consultationCallPrice: data.consultationCallPrice || '0',
          sponsorshipReelPrice: data.sponsorshipReelPrice || '0'
        })
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching character:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Update database first
      const response = await fetch(`/api/characters/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedCharacter = await response.json()
        setCharacter(updatedCharacter)
        
        // TODO: Update smart contract prices if contract exists
        if (updatedCharacter.contractAddress) {
          console.log('Would update smart contract prices:', {
            consultationCallPrice: formData.consultationCallPrice,
            sponsorshipReelPrice: formData.sponsorshipReelPrice
          })
          // TODO: Call smart contract functions to update prices
          // This would require wallet connection and transaction signing
        }
        
        setIsEditing(false)
      } else {
        throw new Error('Failed to update character')
      }
    } catch (error) {
      console.error('Error updating character:', error)
      alert('Failed to update character. Please try again.')
    }
  }

  const formatPrice = (price: string | undefined, type: 'consultation' | 'sponsorship') => {
    if (!price || price === '0') return 'Free'
    
    if (type === 'consultation') {
      return `${price}¢/min`
    } else {
      const ethPrice = parseFloat(price) / 1e18
      return `${ethPrice.toFixed(3)} ETH`
    }
  }

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

  const autoPost = async () => {
    if (!character || !user) return

    setAutoPosting(true)
    try {
      const response = await fetch('/api/auto-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: character.id,
          userId: user.id,
          postType
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Auto post created successfully!\n\nTitle: ${data.title}\nDescription: ${data.description}`)
        // The posts feed will update automatically, no need to refresh
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create auto post')
      }
    } catch (error) {
      console.error('Error creating auto post:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to create auto post: ${errorMessage}`)
    } finally {
      setAutoPosting(false)
    }
  }

  const startEditing = () => {
    if (!character) return
    
    setEditFormData({
      name: character.name,
      description: character.description,
      systemPrompt: character.systemPrompt,
      consultationCallPrice: character.consultationCallPrice || '',
      sponsorshipReelPrice: character.sponsorshipReelPrice || '',
      exclusiveContentPrice: character.exclusiveContentPrice || '',
      chatPrice: character.chatPrice || '',
      voicePrice: character.voicePrice || '',
      brandPromoPrice: character.brandPromoPrice || ''
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
      consultationCallPrice: '',
      sponsorshipReelPrice: '',
      exclusiveContentPrice: '',
      chatPrice: '',
      voicePrice: '',
      brandPromoPrice: ''
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Character not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">{character.name}</h1>
              <p className="text-gray-300 mt-2">{character.description}</p>
            </div>
            <div className="flex space-x-4">
              {!isEditingCharacter && (
                <button
                  onClick={startEditing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Character</span>
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Character Image */}
          <div className="mb-8">
            {isEditingCharacter ? (
              <div className="space-y-4">
                <div className="p-4 bg-purple-900/20 rounded-lg">
                  <p className="text-purple-300 text-sm">
                    👤 <strong>Avatar/Profile Image:</strong> This is your character's main profile image that appears in their profile and character cards. This is different from post images.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-700">
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
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white mb-2">
                      Character Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Upload a new image (JPEG, PNG, WebP, max 5MB)
                    </p>
                    {uploadingImage && (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-purple-400 text-sm">Uploading...</span>
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
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Image Generation Section */}
          {!isEditingCharacter && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Generate Image Posts
              </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-900/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  📸 <strong>Image Posts:</strong> Generate images that will be saved as posts in your character's feed. This does NOT change your character's avatar/profile image.
                </p>
              </div>
              {character.imageUrl && (
                <div className="p-4 bg-blue-900/20 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    💡 <strong>FLUX.1 Kontext Mode:</strong> This will use your existing image as a reference to generate a new variation. If FLUX.1 Kontext fails, it will automatically fallback to FLUX.1 Dev.
                  </p>
                </div>
              )}
              {!character.imageUrl && (
                <div className="p-4 bg-yellow-900/20 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    🎨 <strong>Initial Generation:</strong> Creating your first character image using FLUX.1 Dev.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Image Prompt (Optional)
                </label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder={`Professional headshot of ${character.name}, ${character.description}, high quality, detailed, professional lighting, studio background`}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  disabled={generatingImage}
                />
                <p className="text-gray-400 text-xs mt-1">
                  Leave empty to use default prompt based on character description
                </p>
              </div>
              <button
                onClick={generateNewImage}
                disabled={generatingImage}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                {generatingImage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Chat with {character.name}</span>
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Auto Post Section */}
          {!isEditingCharacter && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Auto Post Generation
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-900/20 rounded-lg">
                  <p className="text-green-300 text-sm">
                    🤖 <strong>AI-Powered Auto Post:</strong> This will analyze your character's information and automatically generate a social media post with an appropriate image, title, and description.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Post Type
                  </label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={autoPosting}
                  >
                    <option value="social">Social Media Post</option>
                    <option value="professional">Professional/Business</option>
                    <option value="casual">Casual/Relaxed</option>
                    <option value="creative">Creative/Artistic</option>
                  </select>
                  <p className="text-gray-400 text-xs mt-1">
                    Choose the style and tone for your auto-generated post
                  </p>
                </div>

                <button
                  onClick={autoPost}
                  disabled={autoPosting}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {autoPosting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Auto Post...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Auto Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Character Details Edit Form */}
          {isEditingCharacter && (
            <div className="mb-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Character Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter character name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Enter character description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  System Prompt
                </label>
                <textarea
                  value={editFormData.systemPrompt}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={6}
                  placeholder="Enter system prompt for AI behavior"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Consultation Call Price (cents per minute)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editFormData.consultationCallPrice}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, consultationCallPrice: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0 for free"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Sponsorship Reel Price (ETH)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={editFormData.sponsorshipReelPrice}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, sponsorshipReelPrice: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Exclusive Content Price (ETH)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={editFormData.exclusiveContentPrice}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, exclusiveContentPrice: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Chat Price (ETH per message)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={editFormData.chatPrice}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, chatPrice: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Voice Price (ETH per minute)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={editFormData.voicePrice}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, voicePrice: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Brand Promo Price (ETH)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={editFormData.brandPromoPrice}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, brandPromoPrice: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={saveCharacter}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={cancelEditing}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Contract Information */}
          {character.contractAddress && (
            <div className="mb-8 p-4 bg-green-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Smart Contract</h3>
              <p className="text-green-400 font-mono text-sm">
                {character.contractAddress}
              </p>
            </div>
          )}

          {/* Pricing Section */}
          {!isEditingCharacter && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Pricing</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Only you can update smart contract prices
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit Prices'}
                </button>
              </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Consultation Call Price (cents per minute)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.consultationCallPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, consultationCallPrice: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0 for free"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Sponsorship Reel Price (ETH)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={formData.sponsorshipReelPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, sponsorshipReelPrice: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Price in ETH"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-2">Consultation Calls</h4>
                  <p className="text-2xl font-bold text-green-400">
                    {formatPrice(character.consultationCallPrice, 'consultation')}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">One-on-one consultation calls</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-2">Sponsorship Reels</h4>
                  <p className="text-2xl font-bold text-green-400">
                    {formatPrice(character.sponsorshipReelPrice, 'sponsorship')}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">Brand promotion on their channel</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* System Prompt */}
          {!isEditingCharacter && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">System Prompt</h3>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{character.systemPrompt}</p>
              </div>
            </div>
          )}

          {/* Statistics */}
          {!isEditingCharacter && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white/5 rounded-lg text-center">
                <h4 className="text-lg font-medium text-white mb-2">Total Revenue</h4>
                <p className="text-2xl font-bold text-green-400">0 ETH</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg text-center">
                <h4 className="text-lg font-medium text-white mb-2">Consultation Calls</h4>
                <p className="text-2xl font-bold text-blue-400">0</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg text-center">
                <h4 className="text-lg font-medium text-white mb-2">Sponsorship Reels</h4>
                <p className="text-2xl font-bold text-purple-400">0</p>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          {!isEditingCharacter && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white mb-6">
                {character.name}'s Posts
              </h3>
              <div className="bg-white/5 rounded-lg p-6">
                <PostFeed characterId={character.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
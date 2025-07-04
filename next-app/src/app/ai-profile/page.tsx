'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'

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

interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string
  characterId: string
  character: {
    name: string
    imageUrl?: string
  }
}

type TabType = 'characters' | 'chat' | 'analytics'

export default function AIProfileHome() {
  const router = useRouter()
  const { address } = useWallet()
  const [activeTab, setActiveTab] = useState<TabType>('characters')
  const [characters, setCharacters] = useState<Character[]>([])
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (activeTab === 'characters') {
      fetchCharacters()
    } else if (activeTab === 'chat') {
      fetchChatHistory()
    }
  }, [activeTab])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      if (response.ok) {
        const userData = await response.json()
        // User is authenticated
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters')
      if (response.ok) {
        const data = await response.json()
        setCharacters(data)
      }
    } catch (error) {
      console.error('Error fetching characters:', error)
    }
  }

  const fetchChatHistory = async () => {
    try {
      // For now, we'll fetch chat history for all characters
      // In a real app, you'd want to paginate this
      const allMessages: ChatMessage[] = []
      
      for (const character of characters) {
        const response = await fetch(`/api/chat?characterId=${character.id}`)
        if (response.ok) {
          const data = await response.json()
          const messagesWithCharacter = data.messages?.map((msg: any) => ({
            ...msg,
            character: {
              name: character.name,
              imageUrl: character.imageUrl
            }
          })) || []
          allMessages.push(...messagesWithCharacter)
        }
      }
      
      // Sort by creation date, newest first
      allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setChatHistory(allMessages.slice(0, 20)) // Show last 20 messages
    } catch (error) {
      console.error('Error fetching chat history:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !selectedCharacter) return

    setSending(true)
    const userMessage = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          message: userMessage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Add new messages to chat history
        const newMessages: ChatMessage[] = [
          {
            id: `user-${Date.now()}`,
            content: userMessage,
            role: 'user',
            createdAt: new Date().toISOString(),
            characterId: selectedCharacter.id,
            character: {
              name: selectedCharacter.name,
              imageUrl: selectedCharacter.imageUrl
            }
          },
          {
            id: data.messageId,
            content: data.message,
            role: 'assistant',
            createdAt: data.timestamp,
            characterId: selectedCharacter.id,
            character: {
              name: selectedCharacter.name,
              imageUrl: selectedCharacter.imageUrl
            }
          }
        ]
        
        setChatHistory(prev => [...newMessages, ...prev.slice(0, 18)]) // Keep last 20 messages
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">AI Profile Hub</h1>
              <p className="text-gray-300 mt-2">Manage your AI characters and conversations</p>
            </div>
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

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="flex space-x-8 border-b border-white/20">
            <button
              onClick={() => setActiveTab('characters')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'characters'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              Characters
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              Chat History
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          {activeTab === 'characters' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Your AI Characters</h2>
                <button
                  onClick={() => router.push('/create-character')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create New Character
                </button>
              </div>
              
              {characters.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-white mb-4">No Characters Yet</h3>
                  <p className="text-gray-300 mb-6">
                    Create your first AI character to start building your digital presence
                  </p>
                  <button
                    onClick={() => router.push('/create-character')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Create Character
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {characters.map((character) => (
                    <div
                      key={character.id}
                      className="bg-white/5 rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200"
                    >
                      {character.imageUrl && (
                        <div className="w-full h-32 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                          <img
                            src={character.imageUrl}
                            alt={character.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-white mb-2">{character.name}</h3>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {character.description}
                      </p>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/character/${character.id}/chat`)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Chat</span>
                        </button>
                        <button
                          onClick={() => router.push(`/character/${character.id}`)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Chat History</h2>
                <div className="flex space-x-4">
                  <select
                    value={selectedCharacter?.id || ''}
                    onChange={(e) => {
                      const character = characters.find(c => c.id === e.target.value)
                      setSelectedCharacter(character || null)
                    }}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">All Characters</option>
                    {characters.map(character => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Chat Input */}
              {selectedCharacter && (
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    {selectedCharacter.imageUrl && (
                      <img
                        src={selectedCharacter.imageUrl}
                        alt={selectedCharacter.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <span className="text-white font-medium">Chat with {selectedCharacter.name}</span>
                  </div>
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={`Message ${selectedCharacter.name}...`}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}

              {/* Chat History */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No chat history yet. Start a conversation!</p>
                  </div>
                ) : (
                  chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-white'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          {message.character.imageUrl && (
                            <img
                              src={message.character.imageUrl}
                              alt={message.character.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          )}
                          <span className="text-xs opacity-75">{message.character.name}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white/5 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-white mb-2">Total Characters</h3>
                  <p className="text-3xl font-bold text-purple-400">{characters.length}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-white mb-2">Total Messages</h3>
                  <p className="text-3xl font-bold text-blue-400">{chatHistory.length}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-white mb-2">Active Conversations</h3>
                  <p className="text-3xl font-bold text-green-400">
                    {new Set(chatHistory.map(m => m.characterId)).size}
                  </p>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-white/5 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {chatHistory.slice(0, 5).map((message) => (
                    <div key={message.id} className="flex items-center space-x-3 text-sm">
                      <span className="text-gray-400">{formatTime(message.createdAt)}</span>
                      <span className="text-white">{message.character.name}</span>
                      <span className="text-gray-300">
                        {message.role === 'user' ? 'sent a message' : 'replied'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
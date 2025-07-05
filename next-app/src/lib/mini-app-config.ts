export const MINI_APP_CONFIG = {
  // Your contract address for receiving payments
  // Replace with your actual deployed contract address
  PAYMENT_CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
  
  // Minimum payment amount in WLD
  MIN_PAYMENT_AMOUNT: 0.1,
  
  // App metadata
  APP_NAME: 'AI Influencer Platform',
  APP_DESCRIPTION: 'Create and monetize AI characters with exclusive content',
  
  // Supported tokens
  SUPPORTED_TOKENS: ['WLD', 'USDC'] as const,
  
  // Payment descriptions
  PAYMENT_DESCRIPTIONS: {
    CHARACTER_ACCESS: 'Access to AI character content',
    EXCLUSIVE_CONTENT: 'Exclusive AI character content',
    VOICE_CHAT: 'Voice chat with AI character',
    BRAND_PROMOTION: 'Brand promotion with AI character'
  }
} as const 
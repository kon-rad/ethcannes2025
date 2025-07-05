export const MINI_APP_CONFIG = {
  // Environment configuration
  IS_TESTNET: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true',
  
  // Network configuration
  NETWORK: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true' ? 'testnet' : 'mainnet',
  
  // Your contract address for receiving payments
  // Replace with your actual deployed contract address
  PAYMENT_CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
  
  // Minimum payment amount in WLD (World App requires $0.1 minimum)
  MIN_PAYMENT_AMOUNT: 0.1,
  
  // App metadata
  APP_NAME: 'Augmi',
  APP_DESCRIPTION: 'Create and monetize AI characters with exclusive content',
  
  // Supported tokens
  SUPPORTED_TOKENS: ['WLD', 'USDC'] as const,
  
  // Payment descriptions
  PAYMENT_DESCRIPTIONS: {
    CHARACTER_ACCESS: 'Access to AI character content',
    EXCLUSIVE_CONTENT: 'Exclusive AI character content',
    VOICE_CHAT: 'Voice chat with AI character',
    BRAND_PROMOTION: 'Brand promotion with AI character'
  },
  
  // Testnet configuration
  TESTNET_CONFIG: {
    MIN_PAYMENT_AMOUNT: 0.01, // Lower minimum for testing (but still needs to meet $0.1 USD requirement)
    NETWORK_NAME: 'World Chain Testnet',
  },
  
  // Mainnet configuration
  MAINNET_CONFIG: {
    MIN_PAYMENT_AMOUNT: 0.1,
    NETWORK_NAME: 'World Chain Mainnet',
  }
} as const 
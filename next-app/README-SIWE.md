# Sign-In with Ethereum (SIWE) Setup

This project now uses Sign-In with Ethereum (SIWE) with MetaMask for authentication instead of World App.

## Features

- **MetaMask Integration**: Connect your MetaMask wallet
- **SIWE Authentication**: Secure authentication using Ethereum signatures
- **Session Management**: Automatic session handling with cookies
- **User Management**: Create and manage users based on wallet addresses

## How it Works

1. **Connect Wallet**: Click "Connect MetaMask" to connect your wallet
2. **Sign Message**: Sign a SIWE message to authenticate
3. **Session Creation**: Server verifies signature and creates a session
4. **Access Platform**: Use the platform with your authenticated session

## Components

### `useWallet` Hook
- Manages wallet connection state
- Handles SIWE message signing
- Provides connection/disconnection functions

### `LoginButton` Component
- Shows connection status
- Handles the authentication flow
- Updates button text based on state

### `WalletStatus` Component
- Displays connected wallet address
- Provides disconnect option
- Shows connection status

## API Endpoints

### `/api/nonce`
- Generates a unique nonce for SIWE message
- Used to prevent replay attacks

### `/api/complete-siwe`
- Verifies SIWE message signature
- Creates or finds user in database
- Sets session cookie

### `/api/auth/status`
- Checks if user is authenticated
- Returns user data if authenticated

### `/api/auth/logout`
- Clears session cookie
- Logs user out

## Dependencies

- `wagmi`: Ethereum wallet connection
- `viem`: Ethereum utilities
- `siwe`: Sign-In with Ethereum message handling
- `@wagmi/core`: Core wagmi functionality

## Usage

1. Install MetaMask browser extension
2. Click "Connect MetaMask" button
3. Approve connection in MetaMask
4. Sign the SIWE message when prompted
5. You're now authenticated!

## Security

- Nonces prevent replay attacks
- SIWE messages are cryptographically verified
- Session cookies are httpOnly and secure
- Wallet addresses are used as unique identifiers

## Development

To run the development server:

```bash
cd next-app
npm run dev
```

Make sure you have MetaMask installed and connected to a test network for development. 
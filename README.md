# Augmi

A Next.js application that allows users to create AI characters and monetize exclusive content using World App authentication and smart contracts.

## Features

- **World App Authentication**: Secure wallet-based authentication using World App
- **AI Character Creation**: Create AI characters with names, system prompts, and images
- **Smart Contract Integration**: Each character gets its own payment router contract
- **Monetization**: Set prices for exclusive content, chat, voice calls, and brand promotions
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: SQLite with Prisma ORM
- **Smart Contracts**: Solidity with Hardhat 3
- **Authentication**: World App MiniKit SDK
- **Payments**: World App Pay command (WLD/USDC)

## Project Structure

```
avaapp/
├── contracts/                    # Smart contracts
│   └── CharacterPaymentRouter.sol
├── ignition/                     # Hardhat deployment modules
│   └── modules/
│       └── CharacterPaymentRouter.ts
├── next-app/                     # Next.js frontend
│   ├── src/
│   │   ├── app/                  # App router pages
│   │   ├── components/           # React components
│   │   └── lib/                  # Utilities
│   └── prisma/                   # Database schema
└── worlddocs.txt                 # World App documentation
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Install smart contract dependencies
npm install @openzeppelin/contracts

# Navigate to Next.js app and install dependencies
cd next-app
npm install prisma @prisma/client @worldcoin/minikit-js siwe
```

### 2. Set Up Database

```bash
cd next-app

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 3. Configure Environment Variables

Create `.env` file in the `next-app` directory:

```env
DATABASE_URL="file:./dev.db"
```

### 4. Deploy Smart Contracts

```bash
# From the root directory
npx hardhat compile
npx hardhat ignition deploy ignition/modules/CharacterPaymentRouter.ts
```

### 5. Start Development Server

```bash
cd next-app
npm run dev
```

## Usage

1. **Authentication**: Users sign in with World App wallet
2. **Create Characters**: Set up AI characters with personality and pricing
3. **Deploy Contracts**: Each character gets its own payment router contract
4. **Monetize**: Fans can pay for exclusive content, chat, voice calls, and brand promotions

## Smart Contract Features

- **CharacterPaymentRouter**: Handles payments for each AI character
- **Platform Fees**: Automatic 15% platform fee collection
- **Multiple Services**: Support for exclusive content, chat, voice, and brand promotions
- **Secure Withdrawals**: Creators can withdraw their earnings

## API Endpoints

- `GET /api/nonce` - Generate nonce for World App authentication
- `POST /api/complete-siwe` - Complete SIWE authentication
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout user
- `GET /api/characters` - Get user's characters
- `POST /api/characters` - Create new character

## Next Steps

1. **World App Integration**: Configure Mini App in World App Developer Portal
2. **Payment Integration**: Implement World App Pay command for actual payments
3. **Content Generation**: Integrate with Fal API and Google Veo 2 for AI content
4. **Smart Contract Deployment**: Deploy to World Chain testnet/mainnet
5. **Advanced Features**: Add chat interface, voice calls, and brand dashboard

## Development Commands

```bash
# Smart Contracts
npx hardhat compile
npx hardhat test
npx hardhat ignition deploy ignition/modules/CharacterPaymentRouter.ts

# Next.js App
cd next-app
npm run dev
npm run build
npm run start

# Database
npx prisma studio
npx prisma db push
npx prisma generate
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License

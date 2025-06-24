# 🚀 RenewdLauncher Telegram Bot

A modern Telegram bot for launching ERC-20 tokens on Ethereum with automated Uniswap V3 liquidity provision.

## ✨ Features

- 🤖 **Modern Telegram Interface** - Interactive buttons and user-friendly design
- 🔐 **Secure Wallet Management** - Automatic wallet creation with encrypted private keys
- 💎 **Token Launching** - Deploy ERC-20 tokens with custom metadata
- 🌊 **Automated Liquidity** - One-sided liquidity provision on Uniswap V3
- 🔥 **Firebase Backend** - Scalable database and cloud functions
- ⛽ **Gas Optimization** - Efficient batch operations for cost savings
- 📊 **Analytics** - Track launches, balances, and transaction history

## 🛠️ Tech Stack

- **Backend**: Node.js, Firebase Functions, Firestore
- **Blockchain**: Ethers.js, Alchemy, Uniswap V3
- **Bot Framework**: node-telegram-bot-api
- **Deployment**: Firebase Hosting, Cloud Functions

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Firebase CLI
- Telegram Bot Token (from @BotFather)
- Alchemy API Key
- Firebase Project

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/renewdlauncher-bot.git
cd renewdlauncher-bot
npm install
cd functions && npm install && cd ..
```

### 2. Environment Setup

Create a `.env` file in the project root:

```bash
# Copy the example and fill in your values
cp .env.example .env
```

Required environment variables:

```bash
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://your-project.web.app/webhook

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Ethereum Configuration
ALCHEMY_API_KEY=your_alchemy_api_key
ALCHEMY_NETWORK=sepolia
CONTRACT_ADDRESS=0xf1074ed25ea472671ddb08b5680f7b444b5e9ae3

# Bot Configuration
LAUNCH_FEE_ETH=0.011
PLATFORM_PRIVATE_KEY=your_platform_wallet_private_key
PLATFORM_WALLET_ADDRESS=0xYourPlatformWalletAddress
```

### 3. Firebase Setup

```bash
# Login to Firebase
firebase login

# Set your project
firebase use your-project-id

# Deploy functions
npm run deploy:functions
```

### 4. Set Webhook

```bash
# After deployment, set the webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-project.web.app/webhook"}'
```

## 📁 Project Structure

```
├── src/
│   ├── bot/
│   │   ├── handlers.js      # Bot command and callback handlers
│   │   └── interface.js     # UI messages and keyboards
│   ├── services/
│   │   ├── blockchain.js    # Ethereum/contract interactions
│   │   └── database.js      # Firestore database operations
│   └── contracts/
│       └── abi.js          # Smart contract ABIs
├── functions/
│   ├── index.js            # Firebase Functions (webhook handler)
│   └── package.json        # Functions dependencies
├── firebase.json           # Firebase configuration
├── firestore.rules         # Database security rules
├── config.js              # Application configuration
├── index.js               # Local development entry point
└── RenewdLauncher_Batch.sol # Smart contract source
```

## 🔐 Security Features

- **Encrypted Private Keys** - AES-256-CBC encryption for user wallets
- **Secure Firebase Rules** - Proper access control for user data
- **Environment Variables** - All sensitive data in environment variables
- **Webhook Validation** - Secure webhook endpoints with secret validation

## 🚀 Deployment Options

### Firebase (Recommended)

```bash
# Interactive deployment
npm run deploy:interactive

# Manual deployment
npm run deploy:functions
```

### Other Platforms

- **Heroku**: Easy git-based deployment
- **Railway**: Modern alternative with automatic deployments
- **DigitalOcean**: VPS deployment with Docker
- **AWS/GCP**: Enterprise-grade infrastructure

## 📊 Bot Commands

- `/start` - Initialize bot and create wallet
- `/launch` - Start token creation process
- `/wallet` - View wallet info and balance
- `/balance` - Check ETH balance
- `/deposit` - Get deposit address
- `/mytokens` - View launched tokens
- `/stats` - User statistics

## 🔧 Development

### Local Development

```bash
# Start local development server
npm run dev

# Run setup wizard
npm run setup
```

### Testing

```bash
# Test contract interactions
node debug_contract.js

# Check Firebase connection
firebase functions:shell
```

### Monitoring

```bash
# View real-time logs
npm run logs

# Health check
curl https://your-project.web.app/health
```

## 📈 Smart Contract

The bot uses a batch deployment smart contract that:

- ✅ Deploys ERC-20 tokens with 1B supply
- ✅ Distributes 80% to liquidity, 20% to creator
- ✅ Adds one-sided liquidity to Uniswap V3
- ✅ Collects platform fees (0.01 ETH per launch)
- ✅ Uses minimal ETH for liquidity (0.001 ETH)

**Current Contract**: `0xf1074ed25ea472671ddb08b5680f7b444b5e9ae3` (Sepolia)

## 🛡️ Environment Variables Security

⚠️ **NEVER commit these files:**

- `.env`
- `.env.local`
- `.env.production`
- Any files containing private keys or API keys

✅ **Safe to commit:**

- `.env.example` (template with no real values)
- `config.js` (uses environment variables)
- Source code files

## 🆘 Troubleshooting

### Bot Not Responding

1. Check webhook status:

   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

2. Check function logs:

   ```bash
   npm run logs
   ```

3. Test health endpoint:
   ```bash
   curl https://your-project.web.app/health
   ```

### Deployment Issues

1. Verify Firebase project is set:

   ```bash
   firebase projects:list
   firebase use your-project-id
   ```

2. Check environment variables are configured in Firebase Console

3. Ensure all APIs are enabled (Cloud Functions, Firestore, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Uniswap V3 Documentation](https://docs.uniswap.org/protocol/introduction)

## ⚡ Performance

- **Cold Start**: ~2-3 seconds (Firebase Functions)
- **Response Time**: <500ms (warm functions)
- **Concurrent Users**: 1000+ (Firebase scaling)
- **Cost**: ~$0-5/month for small-medium usage

## 🔄 Updates

To update the bot:

```bash
git pull origin main
npm install
cd functions && npm install && cd ..
npm run deploy:functions
```

---

**⚠️ Disclaimer**: This bot is for educational purposes. Always test thoroughly on testnets before mainnet deployment. Be aware of gas costs and smart contract risks.

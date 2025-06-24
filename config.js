require("dotenv").config();

const config = {
  // Telegram Configuration
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || "",
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || "",
    options: {
      polling: process.env.NODE_ENV === "development",
      webHook: process.env.NODE_ENV === "production",
    },
  },

  // Firebase Configuration
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  },

  // Ethereum Configuration
  ethereum: {
    alchemyApiKey: process.env.ALCHEMY_API_KEY || "",
    network: process.env.ALCHEMY_NETWORK || "sepolia",
    contractAddress:
      process.env.CONTRACT_ADDRESS ||
      "0xf1074ed25ea472671ddb08b5680f7b444b5e9ae3",
    chainId: 11155111, // Sepolia testnet
    blockExplorer: "https://sepolia.etherscan.io",
    uniswapUrl: "https://app.uniswap.org/#/swap",
  },

  // Bot Settings
  bot: {
    launchFeeETH: process.env.LAUNCH_FEE_ETH || "0.011", // 0.01 platform fee + 0.001 liquidity ETH
    platformPrivateKey: process.env.PLATFORM_PRIVATE_KEY || "",
    platformWalletAddress: process.env.PLATFORM_WALLET_ADDRESS || "",
    maxRetries: 3,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    minBalanceForLaunch: "0.011",
  },

  // Database Collections
  collections: {
    users: "users",
    sessions: "sessions",
    launches: "launches",
    transactions: "transactions",
  },

  // Validation
  validation: {
    tokenName: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9\s\-_.]+$/,
    },
    tokenSymbol: {
      minLength: 2,
      maxLength: 10,
      pattern: /^[A-Z0-9]+$/,
    },
    metadata: {
      maxLength: 500,
    },
  },
};

// Validation
const requiredFields = [
  "telegram.token",
  "firebase.projectId",
  "ethereum.alchemyApiKey",
];

function validateConfig() {
  const missing = [];

  requiredFields.forEach((field) => {
    const keys = field.split(".");
    let value = config;

    for (const key of keys) {
      value = value[key];
      if (!value) {
        missing.push(field);
        break;
      }
    }
  });

  if (missing.length > 0) {
    console.error("❌ Missing required configuration:", missing);
    process.exit(1);
  }

  console.log("✅ Configuration validated successfully");
}

module.exports = { config, validateConfig };

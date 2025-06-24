#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setup() {
  console.log("🚀 Welcome to RenewdLauncher Bot Setup!\n");

  // Collect configuration
  const config = {};

  console.log("📱 Telegram Configuration:");
  config.TELEGRAM_BOT_TOKEN = await prompt("Enter your Telegram Bot Token: ");
  config.TELEGRAM_WEBHOOK_URL =
    (await prompt("Enter your webhook URL (or press enter to skip): ")) || "";

  console.log("\n🔥 Firebase Configuration:");
  config.FIREBASE_PROJECT_ID = await prompt("Enter your Firebase Project ID: ");
  config.FIREBASE_CLIENT_EMAIL = await prompt(
    "Enter your Firebase Client Email: "
  );
  console.log(
    "⚠️  For the private key, paste it including the -----BEGIN/END----- lines:"
  );
  config.FIREBASE_PRIVATE_KEY = await prompt(
    "Enter your Firebase Private Key: "
  );

  console.log("\n⛓️  Ethereum Configuration:");
  config.ALCHEMY_API_KEY = await prompt("Enter your Alchemy API Key: ");
  config.ALCHEMY_NETWORK =
    (await prompt("Enter network (default: eth-sepolia): ")) || "eth-sepolia";
  config.CONTRACT_ADDRESS =
    (await prompt(
      "Enter contract address (default: 0xbb0571dfe4046f83f0b7676f2fc2408a2a6a4b6c): "
    )) || "0xbb0571dfe4046f83f0b7676f2fc2408a2a6a4b6c";

  console.log("\n🤖 Bot Configuration:");
  config.LAUNCH_FEE_ETH =
    (await prompt("Enter launch fee in ETH (default: 0.01): ")) || "0.01";
  config.PLATFORM_WALLET_ADDRESS = await prompt(
    "Enter platform wallet address (where fees go): "
  );
  config.PLATFORM_PRIVATE_KEY = await prompt(
    "Enter platform wallet private key: "
  );

  console.log("\n📊 Optional Configuration:");
  config.ADMIN_CHAT_ID =
    (await prompt("Enter admin Telegram chat ID (optional): ")) || "";
  config.WEBHOOK_SECRET =
    (await prompt("Enter webhook secret (optional): ")) || "";

  // Generate .env file
  const envContent = `# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=${config.TELEGRAM_BOT_TOKEN}
TELEGRAM_WEBHOOK_URL=${config.TELEGRAM_WEBHOOK_URL}

# Firebase Configuration
FIREBASE_PROJECT_ID=${config.FIREBASE_PROJECT_ID}
FIREBASE_PRIVATE_KEY="${config.FIREBASE_PRIVATE_KEY.replace(/\n/g, "\\n")}"
FIREBASE_CLIENT_EMAIL=${config.FIREBASE_CLIENT_EMAIL}

# Ethereum Configuration
ALCHEMY_API_KEY=${config.ALCHEMY_API_KEY}
ALCHEMY_NETWORK=${config.ALCHEMY_NETWORK}
CONTRACT_ADDRESS=${config.CONTRACT_ADDRESS}

# Bot Configuration
LAUNCH_FEE_ETH=${config.LAUNCH_FEE_ETH}
PLATFORM_WALLET_ADDRESS=${config.PLATFORM_WALLET_ADDRESS}
PLATFORM_PRIVATE_KEY=${config.PLATFORM_PRIVATE_KEY}

# Environment
NODE_ENV=development

# Optional
ADMIN_CHAT_ID=${config.ADMIN_CHAT_ID}
WEBHOOK_SECRET=${config.WEBHOOK_SECRET}
`;

  // Write .env file
  fs.writeFileSync(".env", envContent);
  console.log("\n✅ Created .env file");

  // Copy .env to functions directory
  fs.writeFileSync("functions/.env", envContent);
  console.log("✅ Created functions/.env file");

  console.log("\n🎉 Setup completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Run: npm install");
  console.log("2. Run: cd functions && npm install");
  console.log("3. Test locally: npm run dev");
  console.log("4. Deploy: npm run deploy");
  console.log("\n📖 Read README.md for detailed instructions");

  rl.close();
}

// Check if this is the main module
if (require.main === module) {
  setup().catch(console.error);
}

module.exports = setup;

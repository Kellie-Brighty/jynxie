#!/usr/bin/env node

const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, silent = false) {
  try {
    const result = execSync(command, {
      encoding: "utf8",
      stdio: silent ? "pipe" : "inherit",
    });
    return result;
  } catch (error) {
    log(`❌ Error executing: ${command}`, "red");
    log(error.message, "red");
    process.exit(1);
  }
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  log("\n🚀 RenewdLauncher Bot Deployment Script", "cyan");
  log("======================================\n", "cyan");

  // Check if Firebase CLI is installed
  try {
    exec("firebase --version", true);
    log("✅ Firebase CLI is installed", "green");
  } catch {
    log("❌ Firebase CLI not found. Installing...", "red");
    exec("npm install -g firebase-tools");
  }

  // Check if logged in to Firebase
  try {
    exec("firebase projects:list", true);
    log("✅ Firebase authentication verified", "green");
  } catch {
    log("❌ Not logged in to Firebase. Please login...", "yellow");
    exec("firebase login");
  }

  // Check deployment type
  const deployType = await question(
    "\n🔧 Deployment type:\n1. Functions only (faster)\n2. Full deployment (functions + hosting)\n\nChoose (1 or 2): "
  );

  // Environment check
  const checkEnv = await question(
    "\n⚠️  Have you configured all environment variables in Firebase Console? (y/n): "
  );
  if (checkEnv.toLowerCase() !== "y") {
    log("\n📋 Please configure environment variables first:", "yellow");
    log("1. Go to Firebase Console → Functions → Configuration", "yellow");
    log(
      "2. Add all required environment variables from DEPLOYMENT.md",
      "yellow"
    );
    log("3. Run this script again\n", "yellow");
    process.exit(0);
  }

  // Webhook URL check
  const webhookUrl = await question(
    "\n🔗 What is your webhook URL? (e.g., https://your-project.web.app/webhook): "
  );

  log("\n🚀 Starting deployment...", "blue");

  // Install dependencies
  log("\n📦 Installing dependencies...", "blue");
  exec("npm install");

  // Deploy based on type
  if (deployType === "1") {
    log("\n🔧 Deploying functions only...", "blue");
    exec("firebase deploy --only functions");
  } else {
    log("\n🔧 Deploying functions and hosting...", "blue");
    exec("firebase deploy");
  }

  log("\n✅ Deployment completed!", "green");

  // Set webhook
  const setBotWebhook = await question(
    "\n🔗 Set Telegram webhook now? (y/n): "
  );
  if (setBotWebhook.toLowerCase() === "y") {
    const botToken = await question("🤖 Enter your bot token: ");

    try {
      const curlCommand = `curl -X POST "https://api.telegram.org/bot${botToken}/setWebhook" -H "Content-Type: application/json" -d '{"url": "${webhookUrl}"}'`;
      log("\n🔗 Setting webhook...", "blue");
      exec(curlCommand);
      log("✅ Webhook set successfully!", "green");
    } catch (error) {
      log("❌ Failed to set webhook. You can set it manually:", "red");
      log(
        `curl -X POST "https://api.telegram.org/bot${botToken}/setWebhook" -H "Content-Type: application/json" -d '{"url": "${webhookUrl}"}'`,
        "yellow"
      );
    }
  }

  // Health check
  const healthCheck = await question("\n🏥 Perform health check? (y/n): ");
  if (healthCheck.toLowerCase() === "y") {
    try {
      const healthUrl = webhookUrl.replace("/webhook", "/health");
      const curlCommand = `curl -s "${healthUrl}"`;
      log("\n🏥 Checking health...", "blue");
      const result = exec(curlCommand, true);
      log(`✅ Health check result: ${result}`, "green");
    } catch (error) {
      log("❌ Health check failed. Check logs manually.", "red");
    }
  }

  log("\n🎉 Deployment complete!", "green");
  log("\n📋 Next steps:", "cyan");
  log("1. Test your bot in Telegram", "cyan");
  log("2. Monitor logs: npm run logs", "cyan");
  log("3. Check health: curl https://your-domain.web.app/health", "cyan");
  log("4. Set up monitoring alerts in Firebase Console", "cyan");

  rl.close();
}

main().catch((error) => {
  log(`❌ Deployment failed: ${error.message}`, "red");
  process.exit(1);
});

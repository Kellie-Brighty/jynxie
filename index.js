const TelegramBot = require("node-telegram-bot-api");
const BotHandlers = require("./src/bot/handlers");
const { config, validateConfig } = require("./config");

class RenewdLauncherBot {
  constructor() {
    // Validate configuration
    validateConfig();

    // Initialize Telegram bot
    this.bot = new TelegramBot(config.telegram.token, {
      polling: config.telegram.options.polling,
      webHook: config.telegram.options.webHook,
    });

    // Initialize handlers
    this.handlers = new BotHandlers(this.bot);

    console.log("🚀 RenewdLauncher Bot initializing...");
  }

  async start() {
    try {
      // Initialize handlers
      this.handlers.init();

      // Setup error handlers
      this.setupErrorHandlers();

      // Setup webhook if in production
      if (config.telegram.options.webHook) {
        await this.setupWebhook();
      }

      // Get bot info
      const me = await this.bot.getMe();
      console.log(`✅ Bot started successfully: @${me.username}`);
      console.log(
        `📡 Mode: ${config.telegram.options.polling ? "Polling" : "Webhook"}`
      );
      console.log(`🌐 Network: ${config.ethereum.network}`);
      console.log(`📄 Contract: ${config.ethereum.contractAddress}`);

      // Send startup notification to admin (optional)
      if (process.env.ADMIN_CHAT_ID) {
        try {
          await this.bot.sendMessage(
            process.env.ADMIN_CHAT_ID,
            `🚀 *RenewdLauncher Bot Started*\n\n` +
              `🕐 *Time:* ${new Date().toLocaleString()}\n` +
              `🌐 *Network:* ${config.ethereum.network}\n` +
              `📄 *Contract:* \`${config.ethereum.contractAddress}\`\n` +
              `📡 *Mode:* ${
                config.telegram.options.polling ? "Polling" : "Webhook"
              }`,
            { parse_mode: "Markdown" }
          );
        } catch (error) {
          console.log("ℹ️ Could not send startup notification to admin");
        }
      }
    } catch (error) {
      console.error("❌ Failed to start bot:", error);
      process.exit(1);
    }
  }

  async setupWebhook() {
    try {
      if (!config.telegram.webhookUrl) {
        throw new Error("Webhook URL is required for webhook mode");
      }

      await this.bot.setWebHook(config.telegram.webhookUrl);
      console.log(`✅ Webhook set: ${config.telegram.webhookUrl}`);
    } catch (error) {
      console.error("❌ Failed to setup webhook:", error);
      throw error;
    }
  }

  setupErrorHandlers() {
    // Handle bot polling errors
    this.bot.on("polling_error", (error) => {
      console.error("❌ Polling error:", error);
    });

    // Handle bot webhook errors
    this.bot.on("webhook_error", (error) => {
      console.error("❌ Webhook error:", error);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down bot gracefully...");

      try {
        if (config.telegram.options.polling) {
          await this.bot.stopPolling();
        }
        console.log("✅ Bot stopped successfully");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    });

    process.on("SIGTERM", async () => {
      console.log("\n🛑 Received SIGTERM, shutting down...");

      try {
        if (config.telegram.options.polling) {
          await this.bot.stopPolling();
        }
        console.log("✅ Bot stopped successfully");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    });
  }

  // Method to stop the bot
  async stop() {
    try {
      if (config.telegram.options.polling) {
        await this.bot.stopPolling();
      }
      console.log("✅ Bot stopped");
    } catch (error) {
      console.error("❌ Error stopping bot:", error);
      throw error;
    }
  }
}

// Start the bot if this file is run directly
if (require.main === module) {
  const bot = new RenewdLauncherBot();
  bot.start().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

module.exports = RenewdLauncherBot;

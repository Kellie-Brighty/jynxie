const BotInterface = require("./interface");
const BlockchainService = require("../services/blockchain");
const DatabaseService = require("../services/database");
const crypto = require("crypto");
const { config } = require("../../config");

class BotHandlers {
  constructor(bot) {
    this.bot = bot;
    this.ui = new BotInterface();
    this.blockchain = new BlockchainService();
    this.db = new DatabaseService();

    // Track user sessions and states
    this.userStates = new Map();

    console.log("✅ Bot handlers initialized");
  }

  // Initialize all handlers
  init() {
    this.setupCommands();
    this.setupCallbacks();
    this.setupTextHandlers();
    this.startBalanceMonitoring();
  }

  // Setup command handlers
  setupCommands() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStart(msg);
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      await this.sendMessage(
        msg.chat.id,
        this.ui.getHelpMessage(),
        this.ui.getMainMenu()
      );
    });

    // Balance command
    this.bot.onText(/\/balance/, async (msg) => {
      await this.handleBalance(msg.from.id, msg.chat.id);
    });

    // Wallet command
    this.bot.onText(/\/wallet/, async (msg) => {
      await this.handleWallet(msg.from.id, msg.chat.id);
    });
  }

  // Setup callback query handlers
  setupCallbacks() {
    this.bot.on("callback_query", async (callbackQuery) => {
      const action = callbackQuery.data;
      const msg = callbackQuery.message;
      const userId = callbackQuery.from.id;
      const chatId = msg.chat.id;

      try {
        switch (action) {
          case "main_menu":
            await this.handleMainMenu(userId, chatId, msg.message_id);
            break;
          case "launch_token":
            await this.handleLaunchToken(userId, chatId, msg.message_id);
            break;
          case "launch_start":
            await this.startTokenCreation(userId, chatId, msg.message_id);
            break;
          case "launch_confirm":
            await this.handleLaunchConfirm(userId, chatId, msg.message_id);
            break;
          case "launch_cancel":
            await this.handleLaunchCancel(userId, chatId, msg.message_id);
            break;
          case "wallet":
            await this.handleWallet(userId, chatId, msg.message_id);
            break;
          case "deposit":
            await this.handleDeposit(userId, chatId, msg.message_id);
            break;
          case "withdraw":
            await this.handleWithdraw(userId, chatId, msg.message_id);
            break;
          case "check_balance":
            await this.handleBalance(userId, chatId, msg.message_id);
            break;
          case "my_tokens":
            await this.handleMyTokens(userId, chatId, msg.message_id);
            break;
          case "stats":
            await this.handleStats(userId, chatId, msg.message_id);
            break;
          case "help":
            await this.editMessage(
              chatId,
              msg.message_id,
              this.ui.getHelpMessage(),
              this.ui.getBackButton("main_menu")
            );
            break;
          case "tx_history":
            await this.handleTransactionHistory(userId, chatId, msg.message_id);
            break;
        }

        // Answer callback query
        await this.bot.answerCallbackQuery(callbackQuery.id);
      } catch (error) {
        console.error("❌ Error handling callback query:", error);
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: "Error occurred, please try again",
        });
      }
    });
  }

  // Setup text message handlers
  setupTextHandlers() {
    this.bot.on("message", async (msg) => {
      if (msg.text && !msg.text.startsWith("/")) {
        await this.handleTextInput(msg);
      }
    });
  }

  // Handle start command
  async handleStart(msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    try {
      let user = await this.db.getUser(userId);

      if (!user) {
        // Create new user with wallet
        const wallet = await this.blockchain.createUserWallet();
        const balance = await this.blockchain.getBalance(wallet.address);

        const userData = {
          username: msg.from.username,
          firstName: msg.from.first_name,
          lastName: msg.from.last_name,
          wallet: {
            address: wallet.address,
            privateKey: this.encryptPrivateKey(wallet.privateKey),
            balance: balance,
          },
        };

        user = await this.db.createUser(userId, userData);
        console.log(`✅ New user created: ${userId}`);
      } else {
        // Update balance for existing user
        const balance = await this.blockchain.getBalance(user.wallet.address);
        await this.db.updateUserBalance(userId, balance);
        user.wallet.balance = balance;
      }

      const welcomeMessage = this.ui.getWelcomeMessage(user);
      await this.sendMessage(chatId, welcomeMessage, this.ui.getMainMenu());
    } catch (error) {
      console.error("❌ Error in start handler:", error);
      await this.sendMessage(
        chatId,
        this.ui.getErrorMessage("Failed to initialize. Please try again.")
      );
    }
  }

  // Handle main menu
  async handleMainMenu(userId, chatId, messageId = null) {
    try {
      const user = await this.db.getUser(userId);
      if (!user) {
        await this.sendMessage(chatId, "Please start with /start first.");
        return;
      }

      const welcomeMessage = this.ui.getWelcomeMessage(user);

      if (messageId) {
        await this.editMessage(
          chatId,
          messageId,
          welcomeMessage,
          this.ui.getMainMenu()
        );
      } else {
        await this.sendMessage(chatId, welcomeMessage, this.ui.getMainMenu());
      }
    } catch (error) {
      console.error("❌ Error in main menu handler:", error);
    }
  }

  // Handle token launch initiation
  async handleLaunchToken(userId, chatId, messageId) {
    try {
      const user = await this.db.getUser(userId);
      const balance = parseFloat(user.wallet.balance || 0);
      const minBalance = parseFloat(config.bot.minBalanceForLaunch);

      if (balance < minBalance) {
        const message = `${this.ui.emojis.warning} *Insufficient Balance*

You need at least ${config.bot.minBalanceForLaunch} ETH to launch a token.
Current balance: ${balance.toFixed(4)} ETH

Please deposit more ETH to continue.`;

        await this.editMessage(
          chatId,
          messageId,
          message,
          this.ui.getWalletMenu()
        );
        return;
      }

      const message = `${this.ui.emojis.rocket} *Ready to Launch Your Token!*

${this.ui.emojis.success} Balance: ${balance.toFixed(4)} ETH ✓
${this.ui.emojis.success} Minimum required: ${minBalance} ETH ✓

Let's create your token step by step:

1️⃣ Enter token name
2️⃣ Enter token symbol
3️⃣ Add description (optional)
4️⃣ Review and confirm
5️⃣ Launch!

Ready to start?`;

      await this.editMessage(
        chatId,
        messageId,
        message,
        this.ui.getLaunchFlowMenu("start")
      );
    } catch (error) {
      console.error("❌ Error in launch token handler:", error);
    }
  }

  // Start token creation process
  async startTokenCreation(userId, chatId, messageId) {
    try {
      // Create session
      const session = await this.db.createSession(userId, {
        type: "token_creation",
        state: "waiting_name",
        data: {},
      });

      this.userStates.set(userId, {
        sessionId: session.id,
        state: "waiting_name",
        data: {},
      });

      const message = `${this.ui.emojis.rocket} *Step 1/3: Token Name*

Please enter your token name:

📝 *Examples:*
• Shiba Inu
• Pepe Token
• My Awesome Coin

${this.ui.emojis.warning} *Rules:*
• 2-50 characters
• Letters, numbers, spaces allowed
• No special characters`;

      await this.editMessage(
        chatId,
        messageId,
        message,
        this.ui.getCancelButton()
      );
    } catch (error) {
      console.error("❌ Error starting token creation:", error);
    }
  }

  // Handle text input based on user state
  async handleTextInput(msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    const userState = this.userStates.get(userId);
    if (!userState) return;

    try {
      switch (userState.state) {
        case "waiting_name":
          await this.handleTokenName(userId, chatId, text, userState);
          break;
        case "waiting_symbol":
          await this.handleTokenSymbol(userId, chatId, text, userState);
          break;
        case "waiting_metadata":
          await this.handleTokenMetadata(userId, chatId, text, userState);
          break;
        case "waiting_withdraw_amount":
          await this.handleWithdrawAmount(userId, chatId, text, userState);
          break;
        case "waiting_withdraw_address":
          await this.handleWithdrawAddress(userId, chatId, text, userState);
          break;
      }
    } catch (error) {
      console.error("❌ Error handling text input:", error);
      await this.sendMessage(
        chatId,
        this.ui.getErrorMessage("Something went wrong. Please try again.")
      );
    }
  }

  // Handle token name input
  async handleTokenName(userId, chatId, text, userState) {
    const validation = config.validation.tokenName;

    if (
      text.length < validation.minLength ||
      text.length > validation.maxLength
    ) {
      await this.sendMessage(
        chatId,
        `${this.ui.emojis.error} Token name must be between ${validation.minLength}-${validation.maxLength} characters.`
      );
      return;
    }

    if (!validation.pattern.test(text)) {
      await this.sendMessage(
        chatId,
        `${this.ui.emojis.error} Token name contains invalid characters. Use only letters, numbers, spaces, hyphens, underscores, and dots.`
      );
      return;
    }

    // Update session
    userState.data.name = text;
    userState.state = "waiting_symbol";
    this.userStates.set(userId, userState);

    await this.db.updateSession(userState.sessionId, {
      state: "waiting_symbol",
      data: userState.data,
    });

    const message = `${this.ui.emojis.success} Token name: *${text}*

${this.ui.emojis.rocket} *Step 2/3: Token Symbol*

Please enter your token symbol (ticker):

📝 *Examples:*
• SHIB
• PEPE
• MYTOKEN

${this.ui.emojis.warning} *Rules:*
• 2-10 characters
• UPPERCASE letters and numbers only
• No spaces or special characters`;

    await this.sendMessage(chatId, message, this.ui.getCancelButton());
  }

  // Handle token symbol input
  async handleTokenSymbol(userId, chatId, text, userState) {
    const validation = config.validation.tokenSymbol;
    const symbol = text.toUpperCase();

    if (
      symbol.length < validation.minLength ||
      symbol.length > validation.maxLength
    ) {
      await this.sendMessage(
        chatId,
        `${this.ui.emojis.error} Token symbol must be between ${validation.minLength}-${validation.maxLength} characters.`
      );
      return;
    }

    if (!validation.pattern.test(symbol)) {
      await this.sendMessage(
        chatId,
        `${this.ui.emojis.error} Token symbol must contain only uppercase letters and numbers.`
      );
      return;
    }

    // Update session
    userState.data.symbol = symbol;
    userState.state = "waiting_metadata";
    this.userStates.set(userId, userState);

    await this.db.updateSession(userState.sessionId, {
      state: "waiting_metadata",
      data: userState.data,
    });

    const message = `${this.ui.emojis.success} Token symbol: *${symbol}*

${this.ui.emojis.rocket} *Step 3/3: Description (Optional)*

Add a description for your token:

📝 *Examples:*
• "The next big meme coin!"
• "Utility token for my project"
• "Website: mytoken.com | Twitter: @mytoken"

${this.ui.emojis.warning} *Note:* You can skip this step by typing "skip"`;

    await this.sendMessage(chatId, message, this.ui.getCancelButton());
  }

  // Handle token metadata input
  async handleTokenMetadata(userId, chatId, text, userState) {
    const metadata = text.toLowerCase() === "skip" ? "" : text;

    if (metadata.length > config.validation.metadata.maxLength) {
      await this.sendMessage(
        chatId,
        `${this.ui.emojis.error} Description is too long. Maximum ${config.validation.metadata.maxLength} characters.`
      );
      return;
    }

    // Update session
    userState.data.metadata = metadata;
    userState.state = "confirm";
    this.userStates.set(userId, userState);

    await this.db.updateSession(userState.sessionId, {
      state: "confirm",
      data: userState.data,
    });

    // Show preview
    const previewMessage = this.ui.getTokenPreview(userState.data);
    await this.sendMessage(
      chatId,
      previewMessage,
      this.ui.getLaunchFlowMenu("confirm")
    );
  }

  // Handle launch confirmation
  async handleLaunchConfirm(userId, chatId, messageId) {
    try {
      const userState = this.userStates.get(userId);
      if (!userState || userState.state !== "confirm") {
        await this.sendMessage(chatId, "Session expired. Please start again.");
        return;
      }

      const user = await this.db.getUser(userId);
      const balance = parseFloat(user.wallet.balance || 0);
      const minBalance = parseFloat(config.bot.minBalanceForLaunch);

      if (balance < minBalance) {
        await this.editMessage(
          chatId,
          messageId,
          this.ui.getErrorMessage("Insufficient balance for launch")
        );
        return;
      }

      // Show progress
      await this.editMessage(
        chatId,
        messageId,
        this.ui.getProgressMessage(1, 4, "Preparing batch transaction...")
      );

      // Create launch record
      const launch = await this.db.createLaunch({
        telegramId: userId,
        tokenName: userState.data.name,
        tokenSymbol: userState.data.symbol,
        metadata: userState.data.metadata,
        ethAmount: config.bot.launchFeeETH,
        status: "pending",
      });

      // Update progress
      await this.editMessage(
        chatId,
        messageId,
        this.ui.getProgressMessage(2, 4, "Deploying token contract...")
      );

      // Launch token using batch approach with fixed liquidity
      const privateKey = this.decryptPrivateKey(user.wallet.privateKey);
      const result = await this.blockchain.launchTokenBatch(
        privateKey,
        userState.data.name,
        userState.data.symbol,
        userState.data.metadata
      );

      if (result.success) {
        // Update progress
        await this.editMessage(
          chatId,
          messageId,
          this.ui.getProgressMessage(
            3,
            4,
            "Token deployed! Adding liquidity..."
          )
        );

        // Update launch record
        await this.db.updateLaunch(launch.id, {
          status: "success",
          tokenAddress: result.tokenAddress,
          txHash: result.liquidityTxHash, // Use liquidity tx as main hash
          deployTxHash: result.deployTxHash,
          liquidityTxHash: result.liquidityTxHash,
          gasUsed: result.gasUsed,
          blockNumber: result.blockNumber,
        });

        // Update user balance
        const newBalance = await this.blockchain.getBalance(
          user.wallet.address
        );
        await this.db.updateUserBalance(userId, newBalance);

        // Update progress
        await this.editMessage(
          chatId,
          messageId,
          this.ui.getProgressMessage(4, 4, "Finalizing launch...")
        );

        // Generate links
        const links = this.blockchain.generateLinks(
          result.tokenAddress,
          result.liquidityTxHash
        );

        // Show success with batch info
        const successMessage = this.ui.getBatchLaunchSuccessMessage(
          result,
          links
        );
        const successKeyboard = this.ui.updateKeyboardUrls(
          this.ui.getLaunchFlowMenu("success"),
          links
        );

        await this.editMessage(
          chatId,
          messageId,
          successMessage,
          successKeyboard
        );

        // Clean up session
        await this.db.endSession(userState.sessionId);
        this.userStates.delete(userId);
      } else {
        // Update launch record with error
        await this.db.updateLaunch(launch.id, {
          status: "failed",
          error: result.error,
        });

        await this.editMessage(
          chatId,
          messageId,
          this.ui.getErrorMessage(
            result.error,
            "The batch approach failed. Please check your balance and try again."
          )
        );
      }
    } catch (error) {
      console.error("❌ Error in batch launch confirm:", error);
      await this.editMessage(
        chatId,
        messageId,
        this.ui.getErrorMessage("Batch launch failed. Please try again.")
      );
    }
  }

  // Handle wallet actions
  async handleWallet(userId, chatId, messageId = null) {
    try {
      const user = await this.db.getUser(userId);
      const balance = await this.blockchain.getBalance(user.wallet.address);

      // Update balance in database
      await this.db.updateUserBalance(userId, balance);

      const walletMessage = this.ui.getWalletMessage(user, balance);

      if (messageId) {
        await this.editMessage(
          chatId,
          messageId,
          walletMessage,
          this.ui.getWalletMenu()
        );
      } else {
        await this.sendMessage(chatId, walletMessage, this.ui.getWalletMenu());
      }
    } catch (error) {
      console.error("❌ Error in wallet handler:", error);
    }
  }

  // Handle deposit
  async handleDeposit(userId, chatId, messageId) {
    try {
      const user = await this.db.getUser(userId);
      const depositMessage = this.ui.getDepositMessage(user.wallet.address);

      await this.editMessage(
        chatId,
        messageId,
        depositMessage,
        this.ui.getBackButton("wallet")
      );
    } catch (error) {
      console.error("❌ Error in deposit handler:", error);
    }
  }

  // Handle balance check
  async handleBalance(userId, chatId, messageId = null) {
    try {
      const user = await this.db.getUser(userId);
      const balance = await this.blockchain.getBalance(user.wallet.address);

      // Update balance in database
      await this.db.updateUserBalance(userId, balance);

      const isEnough =
        parseFloat(balance) >= parseFloat(config.bot.minBalanceForLaunch);
      const balanceMessage = this.ui.getBalanceMessage(balance, isEnough);

      if (messageId) {
        await this.editMessage(
          chatId,
          messageId,
          balanceMessage,
          this.ui.getBackButton("wallet")
        );
      } else {
        await this.sendMessage(
          chatId,
          balanceMessage,
          this.ui.getBackButton("wallet")
        );
      }
    } catch (error) {
      console.error("❌ Error in balance handler:", error);
    }
  }

  // Handle my tokens
  async handleMyTokens(userId, chatId, messageId) {
    try {
      const tokens = await this.db.getUserLaunches(userId);
      const tokensMessage = this.ui.getMyTokensMessage(tokens);

      await this.editMessage(
        chatId,
        messageId,
        tokensMessage,
        this.ui.getBackButton("main_menu")
      );
    } catch (error) {
      console.error("❌ Error in my tokens handler:", error);
    }
  }

  // Handle statistics
  async handleStats(userId, chatId, messageId) {
    try {
      const stats = await this.db.getUserStats(userId);
      const statsMessage = this.ui.getStatsMessage(stats);

      await this.editMessage(
        chatId,
        messageId,
        statsMessage,
        this.ui.getBackButton("main_menu")
      );
    } catch (error) {
      console.error("❌ Error in stats handler:", error);
    }
  }

  // Start balance monitoring
  startBalanceMonitoring() {
    setInterval(async () => {
      try {
        // Clean up expired sessions every hour
        await this.db.cleanupExpiredSessions();
      } catch (error) {
        console.error("❌ Error in background tasks:", error);
      }
    }, 60 * 60 * 1000); // Every hour
  }

  // Utility methods
  async sendMessage(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, {
        parse_mode: "Markdown",
        ...options,
      });
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  }

  async editMessage(chatId, messageId, text, options = {}) {
    try {
      return await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...options,
      });
    } catch (error) {
      console.error("❌ Error editing message:", error);
    }
  }

  // Encrypt/decrypt private keys (updated for Node.js v23+ compatibility)
  encryptPrivateKey(privateKey) {
    try {
      const algorithm = "aes-256-cbc";
      const key = crypto
        .createHash("sha256")
        .update(config.bot.platformPrivateKey || "default-key")
        .digest();
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(privateKey, "utf8", "hex");
      encrypted += cipher.final("hex");

      return iv.toString("hex") + ":" + encrypted;
    } catch (error) {
      console.error("❌ Error encrypting private key:", error);
      throw new Error("Failed to encrypt private key");
    }
  }

  decryptPrivateKey(encryptedPrivateKey) {
    try {
      const algorithm = "aes-256-cbc";
      const key = crypto
        .createHash("sha256")
        .update(config.bot.platformPrivateKey || "default-key")
        .digest();

      const parts = encryptedPrivateKey.split(":");
      if (parts.length !== 2) {
        throw new Error("Invalid encrypted key format");
      }

      const iv = Buffer.from(parts[0], "hex");
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("❌ Error decrypting private key:", error);
      throw new Error("Failed to decrypt private key");
    }
  }
}

module.exports = BotHandlers;

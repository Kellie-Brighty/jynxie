const { config } = require("../../config");

class BotInterface {
  constructor() {
    this.emojis = {
      // Main Actions
      rocket: "🚀",
      wallet: "💰",
      tokens: "🪙",
      stats: "📊",
      help: "ℹ️",
      settings: "⚙️",

      // Status
      success: "✅",
      error: "❌",
      warning: "⚠️",
      loading: "⏳",
      pending: "🔄",

      // Navigation
      back: "🔙",
      next: "➡️",
      home: "🏠",
      cancel: "❌",

      // Features
      deposit: "💸",
      withdraw: "🏧",
      balance: "💳",
      history: "📜",
      new: "🆕",

      // Links
      etherscan: "🔍",
      uniswap: "🦄",
      share: "📤",
      copy: "📋",
    };
  }

  // Main Menu
  getMainMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `${this.emojis.rocket} Launch Token`,
              callback_data: "launch_token",
            },
            {
              text: `${this.emojis.wallet} My Wallet`,
              callback_data: "wallet",
            },
          ],
          [
            {
              text: `${this.emojis.tokens} My Tokens`,
              callback_data: "my_tokens",
            },
            { text: `${this.emojis.stats} Statistics`, callback_data: "stats" },
          ],
          [
            {
              text: `${this.emojis.help} Help & Support`,
              callback_data: "help",
            },
            {
              text: `${this.emojis.settings} Settings`,
              callback_data: "settings",
            },
          ],
        ],
      },
    };
  }

  // Wallet Menu
  getWalletMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `${this.emojis.deposit} Deposit ETH`,
              callback_data: "deposit",
            },
            {
              text: `${this.emojis.withdraw} Withdraw`,
              callback_data: "withdraw",
            },
          ],
          [
            {
              text: `${this.emojis.balance} Check Balance`,
              callback_data: "check_balance",
            },
            {
              text: `${this.emojis.history} Transaction History`,
              callback_data: "tx_history",
            },
          ],
          [
            {
              text: `${this.emojis.back} Back to Menu`,
              callback_data: "main_menu",
            },
          ],
        ],
      },
    };
  }

  // Token Launch Flow Menu
  getLaunchFlowMenu(step) {
    const keyboards = {
      start: {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `${this.emojis.rocket} Start Creating Token`,
                callback_data: "launch_start",
              },
            ],
            [
              {
                text: `${this.emojis.back} Back to Menu`,
                callback_data: "main_menu",
              },
            ],
          ],
        },
      },
      confirm: {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `${this.emojis.success} Launch Token Now`,
                callback_data: "launch_confirm",
              },
            ],
            [
              {
                text: `${this.emojis.settings} Edit Details`,
                callback_data: "launch_edit",
              },
              {
                text: `${this.emojis.cancel} Cancel`,
                callback_data: "launch_cancel",
              },
            ],
          ],
        },
      },
      success: {
        reply_markup: {
          inline_keyboard: [
            [
              { text: `${this.emojis.etherscan} View on Etherscan`, url: "" },
              { text: `${this.emojis.uniswap} Trade on Uniswap`, url: "" },
            ],
            [
              {
                text: `${this.emojis.share} Share Token`,
                callback_data: "share_token",
              },
              {
                text: `${this.emojis.rocket} Launch Another`,
                callback_data: "launch_token",
              },
            ],
            [
              {
                text: `${this.emojis.home} Back to Menu`,
                callback_data: "main_menu",
              },
            ],
          ],
        },
      },
    };

    return keyboards[step] || keyboards.start;
  }

  // Back Button
  getBackButton(callback) {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: `${this.emojis.back} Back`, callback_data: callback }],
        ],
      },
    };
  }

  // Cancel Button
  getCancelButton() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `${this.emojis.cancel} Cancel`,
              callback_data: "main_menu",
            },
          ],
        ],
      },
    };
  }

  // Welcome Message
  getWelcomeMessage(user) {
    return `${this.emojis.rocket} *Welcome to RenewdLauncher!*

Hello ${user.firstName || "there"}! 👋

Your personal token launcher is ready. Create and deploy ERC-20 tokens instantly with automatic Uniswap V3 liquidity!

${this.emojis.wallet} *Your Wallet:* \`${user.wallet.address}\`
${this.emojis.balance} *Balance:* ${user.wallet.balance} ETH

${this.emojis.warning} *Minimum balance needed:* ${
      config.bot.minBalanceForLaunch
    } ETH

What would you like to do?`;
  }

  // Wallet Info Message
  getWalletMessage(user, balance) {
    return `${this.emojis.wallet} *Your Wallet Information*

${this.emojis.balance} *Address:*
\`${user.wallet.address}\`

${this.emojis.balance} *Current Balance:*
*${balance} ETH*

${this.emojis.warning} *Minimum for launch:* ${
      config.bot.minBalanceForLaunch
    } ETH

${
  balance >= config.bot.minBalanceForLaunch
    ? `${this.emojis.success} Ready to launch tokens!`
    : `${this.emojis.warning} Please deposit more ETH to launch tokens`
}

Choose an action:`;
  }

  // Token Launch Preview
  getTokenPreview(tokenData) {
    return `${this.emojis.rocket} *Token Launch Preview*

${this.emojis.tokens} *Name:* ${tokenData.name}
${this.emojis.tokens} *Symbol:* ${tokenData.symbol}
📝 *Description:* ${tokenData.metadata || "No description provided"}

💰 *Total Supply:* 1,000,000,000 ${tokenData.symbol}
💸 *Launch Fee:* ${config.bot.launchFeeETH} ETH
⛽ *Estimated Gas:* ~0.011 ETH (0.01 platform fee + 0.001 liquidity)

${this.emojis.success} *After launch you'll receive:*
• Token contract address
• Automatic Uniswap V3 listing
• Direct trading links

Ready to launch?`;
  }

  // Batch Launch Success Message
  getBatchLaunchSuccessMessage(launchResult, links) {
    return `${this.emojis.success} *Token Launched Successfully!*

${
  this.emojis.rocket
} *Congratulations!* Your token is now live with liquidity on Uniswap V3!

${this.emojis.tokens} *Contract Address:*
\`${launchResult.tokenAddress}\`

📝 *Deploy Transaction:*
\`${launchResult.deployTxHash}\`

🌊 *Liquidity Transaction:*
\`${launchResult.liquidityTxHash}\`

${this.emojis.uniswap} *Your token has minimal ETH liquidity and is tradeable!*

⛽ *Total Gas Used:* ${(parseInt(launchResult.gasUsed) / 1000000).toFixed(2)}M
📦 *Block:* ${launchResult.blockNumber}

${this.emojis.success} *Batch Launch Complete:*
✅ Token deployed successfully
✅ Liquidity pool created
✅ Ready for trading

${this.emojis.warning} *Important:* Save your contract address safely!`;
  }

  // Launch Success Message
  getLaunchSuccessMessage(launchResult, links) {
    return `${this.emojis.success} *Token Launched Successfully!*

${this.emojis.rocket} *Congratulations!* Your token is now live on Ethereum!

${this.emojis.tokens} *Contract Address:*
\`${launchResult.tokenAddress}\`

${this.emojis.etherscan} *Transaction:*
\`${launchResult.txHash}\`

${this.emojis.uniswap} *Your token is automatically listed on Uniswap V3!*

⛽ *Gas Used:* ${(parseInt(launchResult.gasUsed) / 1000000).toFixed(2)}M
📦 *Block:* ${launchResult.blockNumber}

${this.emojis.warning} *Important:* Save your contract address safely!`;
  }

  // Batch Launch Success Message
  getBatchLaunchSuccessMessage(launchResult, links) {
    return `${this.emojis.success} *Token Launched Successfully!*

${
  this.emojis.rocket
} *Congratulations!* Your token is now live with liquidity on Uniswap V3!

${this.emojis.tokens} *Contract Address:*
\`${launchResult.tokenAddress}\`

📝 *Deploy Transaction:*
\`${launchResult.deployTxHash}\`

🌊 *Liquidity Transaction:*
\`${launchResult.liquidityTxHash}\`

${this.emojis.uniswap} *Your token has minimal ETH liquidity and is tradeable!*

⛽ *Total Gas Used:* ${(parseInt(launchResult.gasUsed) / 1000000).toFixed(2)}M
📦 *Block:* ${launchResult.blockNumber}

${this.emojis.success} *Batch Launch Complete:*
✅ Token deployed successfully
✅ Liquidity pool created
✅ Ready for trading

${this.emojis.warning} *Important:* Save your contract address safely!`;
  }

  // Progress Message
  getProgressMessage(step, totalSteps, description) {
    const progress = "▓".repeat(step) + "▒".repeat(totalSteps - step);
    return `${this.emojis.loading} *${description}*

Progress: [${progress}] ${step}/${totalSteps}

Please wait...`;
  }

  // Error Message
  getErrorMessage(error, suggestion = null) {
    return `${this.emojis.error} *Error Occurred*

${error}

${suggestion ? `💡 *Suggestion:* ${suggestion}` : ""}

Please try again or contact support if the issue persists.`;
  }

  // Balance Check Message
  getBalanceMessage(balance, isEnough) {
    return `${this.emojis.balance} *Balance Check*

Current Balance: *${balance} ETH*
Required: *${config.bot.minBalanceForLaunch} ETH*

${
  isEnough
    ? `${this.emojis.success} You have enough balance to launch tokens!`
    : `${this.emojis.warning} You need ${(
        parseFloat(config.bot.minBalanceForLaunch) - parseFloat(balance)
      ).toFixed(4)} more ETH`
}`;
  }

  // Deposit Instructions
  getDepositMessage(address) {
    return `${this.emojis.deposit} *Deposit ETH to Your Wallet*

${this.emojis.wallet} *Your deposit address:*
\`${address}\`

${this.emojis.warning} *Important Instructions:*
• Send ETH to the address above
• Minimum deposit: 0.011 ETH
• Only send ETH from Ethereum mainnet
• Your balance will update automatically

${this.emojis.loading} *Status:* Monitoring for deposits...

${this.emojis.copy} Tap the address to copy it!`;
  }

  // Token List Message
  getMyTokensMessage(tokens) {
    if (tokens.length === 0) {
      return `${this.emojis.tokens} *My Tokens*

You haven't launched any tokens yet.

${this.emojis.rocket} Ready to create your first token?`;
    }

    let message = `${this.emojis.tokens} *My Tokens* (${tokens.length})\n\n`;

    tokens.slice(0, 5).forEach((token, index) => {
      const date = new Date(
        token.createdAt.seconds * 1000
      ).toLocaleDateString();
      message += `${index + 1}. *${token.tokenName}* (${token.tokenSymbol})
   📅 ${date} • ${
        token.status === "success" ? this.emojis.success : this.emojis.error
      }
   📍 \`${token.tokenAddress || "Failed"}\`\n\n`;
    });

    if (tokens.length > 5) {
      message += `... and ${tokens.length - 5} more tokens`;
    }

    return message;
  }

  // Statistics Message
  getStatsMessage(stats) {
    return `${this.emojis.stats} *Your Statistics*

${this.emojis.rocket} *Total Launches:* ${stats.totalLaunches}
${this.emojis.success} *Successful:* ${stats.successfulLaunches}
💰 *Total Spent:* ${parseFloat(stats.totalSpent).toFixed(4)} ETH
📊 *Success Rate:* ${
      stats.totalLaunches > 0
        ? Math.round((stats.successfulLaunches / stats.totalLaunches) * 100)
        : 0
    }%

📅 *Member Since:* ${new Date(
      stats.joinedAt.seconds * 1000
    ).toLocaleDateString()}

${
  stats.totalLaunches > 0
    ? `${this.emojis.success} Great job launching tokens!`
    : `${this.emojis.rocket} Ready to launch your first token?`
}`;
  }

  // Help Message
  getHelpMessage() {
    return `${this.emojis.help} *Help & Support*

${this.emojis.rocket} *How to Launch a Token:*
1. Ensure you have at least ${config.bot.minBalanceForLaunch} ETH
2. Click "Launch Token"
3. Enter token name and symbol
4. Add description (optional)
5. Confirm and launch!

${this.emojis.wallet} *About Wallet:*
• Your wallet is automatically created
• Private keys are securely encrypted
• You can deposit/withdraw anytime

${this.emojis.warning} *Important:*
• Minimum launch fee: ${config.bot.launchFeeETH} ETH
• Gas fees are additional
• Tokens get automatic Uniswap listing

💬 *Need help?* Contact @YourSupportHandle`;
  }

  // Format Address (shortened)
  formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Format Amount
  formatAmount(amount, decimals = 4) {
    return parseFloat(amount).toFixed(decimals);
  }

  // Format Time
  formatTime(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  // Loading Animation
  getLoadingAnimation(step = 0) {
    const frames = ["⏳", "⌛", "⏳", "⌛"];
    return frames[step % frames.length];
  }

  // Success Animation
  getSuccessAnimation() {
    return "🎉";
  }

  // Update keyboard URLs
  updateKeyboardUrls(keyboard, urls) {
    const newKeyboard = JSON.parse(JSON.stringify(keyboard));

    newKeyboard.reply_markup.inline_keyboard.forEach((row) => {
      row.forEach((button) => {
        if (button.text.includes("Etherscan") && urls.etherscan) {
          button.url = urls.etherscan;
        }
        if (button.text.includes("Uniswap") && urls.uniswap) {
          button.url = urls.uniswap;
        }
      });
    });

    return newKeyboard;
  }
}

module.exports = BotInterface;

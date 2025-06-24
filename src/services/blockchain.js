const { ethers } = require("ethers");
const { config } = require("../../config");
const { FACTORY_ABI, TOKEN_ABI, ERC20_ABI } = require("../contracts/abi");

class BlockchainService {
  constructor() {
    this.provider = new ethers.AlchemyProvider(
      config.ethereum.network,
      config.ethereum.alchemyApiKey
    );

    this.factoryContract = new ethers.Contract(
      config.ethereum.contractAddress,
      FACTORY_ABI,
      this.provider
    );

    console.log("✅ Blockchain service initialized");
  }

  // Create a new wallet for user
  async createUserWallet() {
    try {
      const wallet = ethers.Wallet.createRandom();
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase,
      };
    } catch (error) {
      console.error("❌ Error creating wallet:", error);
      throw new Error("Failed to create wallet");
    }
  }

  // Get wallet from private key
  getWallet(privateKey) {
    try {
      return new ethers.Wallet(privateKey, this.provider);
    } catch (error) {
      console.error("❌ Error getting wallet:", error);
      throw new Error("Invalid private key");
    }
  }

  // Get ETH balance
  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("❌ Error getting balance:", error);
      throw new Error("Failed to get balance");
    }
  }

  // Get token balance
  async getTokenBalance(tokenAddress, walletAddress) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        TOKEN_ABI,
        this.provider
      );
      const balance = await tokenContract.balanceOf(walletAddress);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error("❌ Error getting token balance:", error);
      return "0";
    }
  }

  // Batch approach: Deploy token first (more reliable)
  async launchTokenBatch(userPrivateKey, tokenName, tokenSymbol, metadata) {
    try {
      const wallet = this.getWallet(userPrivateKey);
      const factoryWithSigner = this.factoryContract.connect(wallet);

      console.log(`🚀 Batch launching token: ${tokenName} (${tokenSymbol})`);

      // Step 1: Deploy token only (0.01 ETH platform fee)
      console.log("📝 Step 1: Deploying token...");
      const deployGasEstimate = await factoryWithSigner.deployToken.estimateGas(
        tokenName,
        tokenSymbol,
        metadata,
        { value: ethers.parseEther("0.01") }
      );

      const deployGasLimit = (deployGasEstimate * BigInt(120)) / BigInt(100);

      const deployTx = await factoryWithSigner.deployToken(
        tokenName,
        tokenSymbol,
        metadata,
        {
          value: ethers.parseEther("0.01"),
          gasLimit: deployGasLimit,
        }
      );

      console.log(`⏳ Token deployment tx: ${deployTx.hash}`);
      const deployReceipt = await deployTx.wait();
      console.log(`✅ Token deployed! Block: ${deployReceipt.blockNumber}`);

      // Extract token address and index from logs
      const tokenCreatedEvent = deployReceipt.logs.find(
        (log) =>
          log.topics[0] === ethers.id("ERC20TokenCreated(address,uint256)")
      );

      if (!tokenCreatedEvent) {
        throw new Error("Token creation event not found");
      }

      const tokenAddress = ethers.AbiCoder.defaultAbiCoder().decode(
        ["address", "uint256"],
        tokenCreatedEvent.data
      )[0];

      // Get token index (should be tokenCount - 1)
      const tokenCount = await factoryWithSigner.tokenCount();
      const tokenIndex = tokenCount - BigInt(1);

      console.log(`📍 Token address: ${tokenAddress}`);
      console.log(`📊 Token index: ${tokenIndex}`);

      // Step 2: Add liquidity (0.001 ETH)
      console.log("🌊 Step 2: Adding liquidity...");
      const liquidityGasEstimate =
        await factoryWithSigner.addLiquidity.estimateGas(tokenIndex, {
          value: ethers.parseEther("0.001"),
        });

      const liquidityGasLimit =
        (liquidityGasEstimate * BigInt(120)) / BigInt(100);

      const liquidityTx = await factoryWithSigner.addLiquidity(tokenIndex, {
        value: ethers.parseEther("0.001"),
        gasLimit: liquidityGasLimit,
      });

      console.log(`⏳ Liquidity tx: ${liquidityTx.hash}`);
      const liquidityReceipt = await liquidityTx.wait();
      console.log(`✅ Liquidity added! Block: ${liquidityReceipt.blockNumber}`);

      return {
        success: true,
        tokenAddress: tokenAddress,
        deployTxHash: deployTx.hash,
        liquidityTxHash: liquidityTx.hash,
        blockNumber: liquidityReceipt.blockNumber,
        gasUsed: (deployReceipt.gasUsed + liquidityReceipt.gasUsed).toString(),
        txHash: liquidityTx.hash, // Use liquidity tx as main tx hash
      };
    } catch (error) {
      console.error("❌ Error in batch token launch:", error);

      let errorMessage = "Failed to launch token";
      if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient ETH balance for transaction";
      } else if (error.message.includes("reverted")) {
        errorMessage = "Transaction reverted - check contract conditions";
      } else if (error.message.includes("Insufficient launch fee")) {
        errorMessage = "Insufficient launch fee provided";
      }

      return {
        success: false,
        error: errorMessage,
        details: error.message,
      };
    }
  }

  // Original combined approach (kept for compatibility)
  async launchToken(
    userPrivateKey,
    tokenName,
    tokenSymbol,
    metadata,
    purchaseAmount = "0"
  ) {
    try {
      const wallet = this.getWallet(userPrivateKey);
      const factoryWithSigner = this.factoryContract.connect(wallet);

      console.log(`🚀 Launching token: ${tokenName} (${tokenSymbol})`);

      // Estimate gas
      const gasEstimate = await factoryWithSigner.deployCoin.estimateGas(
        tokenName,
        tokenSymbol,
        metadata,
        { value: ethers.parseEther(purchaseAmount) }
      );

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

      // Execute transaction
      const tx = await factoryWithSigner.deployCoin(
        tokenName,
        tokenSymbol,
        metadata,
        {
          value: ethers.parseEther(purchaseAmount),
          gasLimit: gasLimit,
        }
      );

      console.log(`⏳ Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Token launched! Block: ${receipt.blockNumber}`);

      // Extract token address from logs
      const tokenCreatedEvent = receipt.logs.find(
        (log) => log.topics[0] === ethers.id("ERC20TokenCreated(address)")
      );

      let tokenAddress = null;
      if (tokenCreatedEvent) {
        tokenAddress = ethers.AbiCoder.defaultAbiCoder().decode(
          ["address"],
          tokenCreatedEvent.data
        )[0];
      }

      return {
        success: true,
        txHash: tx.hash,
        tokenAddress: tokenAddress,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ Error launching token:", error);

      let errorMessage = "Failed to launch token";
      if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient ETH balance for transaction";
      } else if (error.message.includes("reverted")) {
        errorMessage = "Transaction reverted - check contract conditions";
      }

      return {
        success: false,
        error: errorMessage,
        details: error.message,
      };
    }
  }

  // Get token information
  async getTokenInfo(tokenAddress) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        TOKEN_ABI,
        this.provider
      );

      const [name, symbol, decimals, totalSupply, creator] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply(),
        tokenContract.creator(),
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        creator,
      };
    } catch (error) {
      console.error("❌ Error getting token info:", error);
      throw new Error("Failed to get token information");
    }
  }

  // Get deployed tokens count
  async getTokenCount() {
    try {
      const count = await this.factoryContract.tokenCount();
      return Number(count);
    } catch (error) {
      console.error("❌ Error getting token count:", error);
      return 0;
    }
  }

  // Get deployed token by index
  async getDeployedToken(index) {
    try {
      const tokenInfo = await this.factoryContract.deployedTokens(index);
      return {
        address: tokenInfo.tokenAddress,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        deployer: tokenInfo.deployer,
        timestamp: Number(tokenInfo.time),
        metadata: tokenInfo.metadata,
        launchFeeCollected: ethers.formatEther(
          tokenInfo.launchFeeCollected || 0
        ),
        tokenId: Number(tokenInfo.tokenId || 0),
      };
    } catch (error) {
      console.error("❌ Error getting deployed token:", error);
      return null;
    }
  }

  // Get recent launches
  async getRecentLaunches(limit = 10) {
    try {
      const count = await this.getTokenCount();
      const launches = [];

      const start = Math.max(0, count - limit);
      for (let i = count - 1; i >= start; i--) {
        const token = await this.getDeployedToken(i);
        if (token) {
          launches.push(token);
        }
      }

      return launches;
    } catch (error) {
      console.error("❌ Error getting recent launches:", error);
      return [];
    }
  }

  // Transfer ETH
  async transferETH(fromPrivateKey, toAddress, amount) {
    try {
      const wallet = this.getWallet(fromPrivateKey);

      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
      });

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("❌ Error transferring ETH:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Platform revenue management
  async getPlatformStats() {
    try {
      const [totalTokens, totalFees, contractBalance] =
        await this.factoryContract.getPlatformStats();
      return {
        totalTokens: Number(totalTokens),
        totalFeesCollected: ethers.formatEther(totalFees),
        contractBalance: ethers.formatEther(contractBalance),
      };
    } catch (error) {
      console.error("❌ Error getting platform stats:", error);
      return {
        totalTokens: 0,
        totalFeesCollected: "0",
        contractBalance: "0",
      };
    }
  }

  async withdrawPlatformFees(platformPrivateKey) {
    try {
      const platformWallet = this.getWallet(platformPrivateKey);
      const factoryWithSigner = this.factoryContract.connect(platformWallet);

      const tx = await factoryWithSigner.withdrawPlatformFees();
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("❌ Error withdrawing platform fees:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async collectTradingFees(tokenIndex, platformPrivateKey) {
    try {
      const platformWallet = this.getWallet(platformPrivateKey);
      const factoryWithSigner = this.factoryContract.connect(platformWallet);

      const tx = await factoryWithSigner.collectTradingFees(tokenIndex);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("❌ Error collecting trading fees:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get current gas price
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: ethers.formatUnits(feeData.gasPrice, "gwei"),
        maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas, "gwei"),
        maxPriorityFeePerGas: ethers.formatUnits(
          feeData.maxPriorityFeePerGas,
          "gwei"
        ),
      };
    } catch (error) {
      console.error("❌ Error getting gas price:", error);
      return null;
    }
  }

  // Generate links
  generateLinks(tokenAddress, txHash) {
    return {
      etherscan: `${config.ethereum.blockExplorer}/address/${tokenAddress}`,
      etherscanTx: `${config.ethereum.blockExplorer}/tx/${txHash}`,
      uniswap: `${config.ethereum.uniswapUrl}?outputCurrency=${tokenAddress}`,
    };
  }

  // Validate Ethereum address
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  // Format amount with proper decimals
  formatAmount(amount, decimals = 18) {
    return ethers.formatUnits(amount, decimals);
  }

  // Parse amount to wei
  parseAmount(amount, decimals = 18) {
    return ethers.parseUnits(amount.toString(), decimals);
  }
}

module.exports = BlockchainService;

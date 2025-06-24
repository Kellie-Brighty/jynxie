
# TokenLauncher Telegram Bot Project

## Overview

This project enables a Telegram bot that allows users to easily launch ERC-20 tokens on the Ethereum blockchain with instant Uniswap V3 liquidity. It leverages a custom smart contract system consisting of an ERC20 token implementation, a factory contract, and integration with Uniswap V3 for liquidity provisioning.

## Key Features

- Launch an ERC-20 token with just a few inputs via Telegram
- Automatically provide token liquidity on Uniswap V3 using one-sided liquidity
- Optional ETH-based token purchase immediately after launch
- No need for users to write or deploy smart contracts manually
- Smart contract includes token deployment listing and market cap calculation
- Platform owner (you) earns from launch fees, token allocation, and optionally trading fees

## Smart Contract Components

### 1. Token.sol
Implements a mintable and burnable ERC-20 token that stores platform and creator addresses.

### 2. Factory.sol
Manages token deployment, liquidity provisioning, and token listing. Key functions include:
- `deployCoin(...)`: Deploys a new token and adds liquidity
- `provideLiquidity(...)`: Adds token-only liquidity to Uniswap
- `getDeploysByPage(...)`: Returns paginated list of deployed tokens with market cap estimates
- `collectFees(...)`: Collects Uniswap V3 trading fees (can be upgraded to support revenue sharing)
- `withdrawFees()`: Withdraws WETH/ETH fees for the platform owner

## Revenue Model

- **ETH Launch Fee**: Required ETH payment to initiate a token launch (to be implemented)
- **Token Allocation**: 1% of total token supply is reserved for the platform owner
- **Uniswap Fee Sharing**: Will be implemented to split trading fees 50/50 between platform and token creator

## Telegram Bot Flow

1. `/start` → User is welcomed and prompted to begin token creation
2. Collects token name, symbol, and metadata (description)
3. Prompts user to send ETH to launch token
4. Once ETH is confirmed, backend calls `deployCoin(...)` on the contract
5. User receives token address, Uniswap link, and Etherscan link

## Technologies Required

- **Telegram API** (node-telegram-bot-api or python-telegram-bot)
- **Blockchain SDK** (ethers.js or web3.py)
- **Smart Contract Deployment** (already completed)
- **Hosting** (e.g., Vercel, DigitalOcean, or AWS)
- **Ethereum Node Access** (via Alchemy or Infura)

## Optional Future Enhancements

- Enable custom supply setting
- Offer token verification or featured listings for a fee
- Implement referral system
- Add Telegram admin panel for managing launches and viewing analytics

## Status

- Smart contracts written ✅
- Telegram bot logic planned ✅
- Revenue system partially implemented (launch fee & token allocation done, trading fee sharing pending)

## Notes on Social Media and Metadata Input

Currently, the smart contract does not support structured fields for user social media handles (like Twitter or Telegram) separately.

However, it does accept a generic `metadata` string during token deployment:
```solidity
function deployCoin(string memory _name, string memory _symbol, string memory _metadata)
```

This `metadata` field can be used by the Telegram bot to collect and store user-provided information such as:
- Twitter handle
- Telegram username or group link
- Website or description

Example usage from the bot:
> Enter your token description or any socials you'd like to attach:  
> Website: shibainu.eth | Twitter: @shibainu | Telegram: t.me/shibainu

This metadata is saved on-chain and can be read later for display or indexing.

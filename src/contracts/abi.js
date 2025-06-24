// RenewdLauncher Contract ABI (One-Sided Liquidity Version)
const FACTORY_ABI = [
  // Events
  "event ERC20TokenCreated(address indexed tokenAddress, uint256 launchFee)",
  "event LaunchFeeCollected(address indexed platformController, uint256 amount)",
  "event LiquidityProvided(address indexed tokenAddress, uint256 tokenAmount, uint256 ethAmount)",
  "event BatchLaunchCompleted(address indexed tokenAddress, uint256 positionId)",

  // Main Functions
  "function deployCoin(string memory _name, string memory _symbol, string memory _metadata) public payable",

  // New batch functions
  "function deployToken(string memory _name, string memory _symbol, string memory _metadata) public payable returns (uint256)",
  "function addLiquidity(uint256 tokenIndex) public payable",

  // View Functions
  "function deployedTokens(uint256) public view returns (address tokenAddress, string name, string symbol, address deployer, uint256 time, string metadata, uint256 launchFeeCollected, uint256 tokenId, bool liquidityAdded)",
  "function tokenCount() public view returns (uint256)",
  "function platformController() public view returns (address)",
  "function totalFeesCollected() public view returns (uint256)",
  "function getTokenInfo(uint256 tokenIndex) external view returns (address tokenAddress, string name, string symbol, address deployer, uint256 time, string metadata, uint256 launchFeeCollected, uint256 tokenId)",
  "function getPlatformStats() external view returns (uint256 totalTokens, uint256 totalFees, uint256 contractBalance)",

  // Constants
  "function POSITION_MANAGER() public view returns (address)",
  "function WETH() public view returns (address)",
  "function LAUNCH_FEE() public view returns (uint256)",

  // Payable receive
  "receive() external payable",

  // Platform management
  "function collectPlatformFees() external",
  "function setPlatformController(address newController) external",
];

// Token Contract ABI (for deployed tokens)
const TOKEN_ABI = [
  // ERC20 Standard
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",

  // Custom Fields
  "function creator() public view returns (address)",
  "function platform() public view returns (address)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
  "event Approval(address indexed owner, address indexed spender, uint256 amount)",
];

// ERC20 ABI for WETH and other tokens
const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
];

module.exports = {
  FACTORY_ABI,
  TOKEN_ABI,
  ERC20_ABI,
};

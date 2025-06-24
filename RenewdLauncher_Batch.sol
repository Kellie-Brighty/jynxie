// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
}

interface IToken {
    function creator() external view returns (address);
}

interface IWETH {
    function deposit() external payable;
    function approve(address spender, uint256 amount) external returns (bool);
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external returns (address pool);
    
    function mint(MintParams calldata params) external returns (
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );
    
    function collect(CollectParams calldata params) external payable returns (
        uint256 amount0,
        uint256 amount1
    );
}

contract Token {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public creator;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, address _creator, address _launcher) {
        name = _name;
        symbol = _symbol;
        creator = _creator;
        totalSupply = 1_000_000_000 * 10**decimals; // 1B tokens
        
        // Token distribution
        uint256 liquidityAmount = (totalSupply * 80) / 100; // 80% for liquidity
        uint256 creatorAmount = totalSupply - liquidityAmount; // 20% for creator
        
        balanceOf[_launcher] = liquidityAmount; // Send to launcher for liquidity
        balanceOf[_creator] = creatorAmount;    // Send to creator
        
        emit Transfer(address(0), _launcher, liquidityAmount);
        emit Transfer(address(0), _creator, creatorAmount);
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(balanceOf[from] >= amount, "Insufficient balance");
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
}

contract Factory {
    event ERC20TokenCreated(address tokenAddress, uint256 launchFee);
    event LaunchFeeCollected(address platformController, uint256 amount);
    event LiquidityProvided(address tokenAddress, uint256 tokenAmount, uint256 ethAmount);
    event BatchLaunchCompleted(address tokenAddress, uint256 positionId);

    struct TokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        address deployer;
        uint256 time;
        string metadata;
        uint256 launchFeeCollected;
        uint256 tokenId;
        bool liquidityAdded;
    }

    mapping(uint256 => TokenInfo) public deployedTokens;
    uint256 public tokenCount = 0;
    address public platformController;
    uint256 public totalFeesCollected = 0;

    // CORRECTED SEPOLIA ADDRESSES
    address public constant POSITION_MANAGER = 0x1238536071E1c677A632429e3655c799b22cDA52;
    address public constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    
    // Launch configuration
    uint256 public constant LAUNCH_FEE = 0.01 ether;
    uint24 private constant FEE_TIER = 10000; // 1%
    uint256 private constant LIQUIDITY_TOKEN_AMOUNT = 800_000_000 * 10**18; // 80% of supply
    uint256 private constant MINIMAL_ETH = 1000000000000000; // 0.001 ETH
    
    constructor() {
        platformController = msg.sender;
    }

    receive() external payable {}

    // Step 1: Deploy token only (collects platform fee) - External version
    function deployToken(
        string memory _name, 
        string memory _symbol, 
        string memory _metadata
    ) public payable returns (uint256 tokenIndex) {
        // Validate launch fee only
        require(msg.value >= LAUNCH_FEE, "Insufficient launch fee");
        
        return deployTokenInternal(_name, _symbol, _metadata);
    }
    
    // Internal token deployment function
    function deployTokenInternal(
        string memory _name, 
        string memory _symbol, 
        string memory _metadata
    ) internal returns (uint256 tokenIndex) {
        // Collect platform fee
        uint256 platformFee = LAUNCH_FEE;
        totalFeesCollected += platformFee;
        
        // Send fee to platform controller
        payable(platformController).transfer(platformFee);
        emit LaunchFeeCollected(platformController, platformFee);
        
        // Create token
        Token t = new Token(_name, _symbol, msg.sender, address(this));
        emit ERC20TokenCreated(address(t), platformFee);
        
        // Record token info (without liquidity initially)
        deployedTokens[tokenCount] = TokenInfo({
            tokenAddress: address(t),
            name: _name,
            symbol: _symbol,
            deployer: msg.sender,
            time: block.timestamp,
            metadata: _metadata,
            launchFeeCollected: platformFee,
            tokenId: 0, // Will be set when liquidity is added
            liquidityAdded: false
        });
        
        tokenIndex = tokenCount;
        tokenCount++;
        
        return tokenIndex;
    }
    
    // Step 2: Add liquidity with minimal ETH (separate transaction)
    function addLiquidity(uint256 tokenIndex) public payable {
        require(tokenIndex < tokenCount, "Invalid token index");
        require(msg.value >= MINIMAL_ETH, "Insufficient ETH for liquidity");
        
        TokenInfo storage tokenInfo = deployedTokens[tokenIndex];
        require(!tokenInfo.liquidityAdded, "Liquidity already added");
        require(msg.sender == tokenInfo.deployer, "Only deployer can add liquidity");
        
        address tokenAddress = tokenInfo.tokenAddress;
        
        // Add liquidity with minimal ETH
        uint256 positionId = provideMinimalLiquidity(tokenAddress, msg.value);
        
        // Update token info
        tokenInfo.tokenId = positionId;
        tokenInfo.liquidityAdded = true;
        
        emit BatchLaunchCompleted(tokenAddress, positionId);
    }
    
    // Combined function for convenience (does both steps in one tx)
    function deployCoin(
        string memory _name, 
        string memory _symbol, 
        string memory _metadata
    ) public payable {
        // Validate total fee needed
        require(msg.value >= LAUNCH_FEE + MINIMAL_ETH, "Insufficient launch fee and liquidity");
        
        // Step 1: Deploy token (internal call)
        uint256 tokenIndex = deployTokenInternal(_name, _symbol, _metadata);
        
        // Step 2: Add liquidity with remaining ETH
        uint256 liquidityETH = msg.value - LAUNCH_FEE;
        addLiquidityInternal(tokenIndex, liquidityETH);
    }
    
    // Internal liquidity function
    function addLiquidityInternal(uint256 tokenIndex, uint256 ethAmount) internal {
        TokenInfo storage tokenInfo = deployedTokens[tokenIndex];
        address tokenAddress = tokenInfo.tokenAddress;
        
        // Add liquidity
        uint256 positionId = provideMinimalLiquidity(tokenAddress, ethAmount);
        
        // Update token info
        tokenInfo.tokenId = positionId;
        tokenInfo.liquidityAdded = true;
        
        emit BatchLaunchCompleted(tokenAddress, positionId);
    }
    
    function provideMinimalLiquidity(address tokenAddress, uint256 availableETH) internal returns (uint256 positionId) {
        // Determine token order for Uniswap V3
        bool tokenIsToken0 = tokenAddress < WETH;
        address token0 = tokenIsToken0 ? tokenAddress : WETH;
        address token1 = tokenIsToken0 ? WETH : tokenAddress;
        
        // Approve token for position manager
        IERC20(tokenAddress).approve(POSITION_MANAGER, LIQUIDITY_TOKEN_AMOUNT);
        
        INonfungiblePositionManager manager = INonfungiblePositionManager(POSITION_MANAGER);
        
        // Use MORE ETH to avoid edge cases - use all available ETH
        uint256 ethAmount = availableETH;
        
        // Wrap ETH to WETH for Uniswap V3
        IWETH(WETH).deposit{value: ethAmount}();
        IWETH(WETH).approve(POSITION_MANAGER, ethAmount);
        
        // FIXED: Use more reasonable price and tick ranges
        uint160 sqrtPriceX96;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        
        if (tokenIsToken0) {
            // Token is token0, WETH is token1
            // Price: 1 token = 0.00001 ETH (less extreme price)
            sqrtPriceX96 = 7922816251426433759354; // sqrt(0.00001) * 2^96
            tickLower = -276400; // FIXED: Multiple of 200 for 1% fee tier
            tickUpper = -276200; // FIXED: Multiple of 200 for 1% fee tier
            amount0Desired = LIQUIDITY_TOKEN_AMOUNT; // 800M tokens
            amount1Desired = ethAmount; // Available ETH
        } else {
            // WETH is token0, Token is token1  
            // Price: 1 ETH = 100000 tokens (less extreme)
            sqrtPriceX96 = 7922816251426433759354395; // sqrt(100000) * 2^96
            tickLower = 276200;  // FIXED: Multiple of 200 for 1% fee tier
            tickUpper = 276400;  // FIXED: Multiple of 200 for 1% fee tier
            amount0Desired = ethAmount; // Available ETH
            amount1Desired = LIQUIDITY_TOKEN_AMOUNT; // 800M tokens
        }
        
        // Create pool if it doesn't exist
        manager.createAndInitializePoolIfNecessary(token0, token1, FEE_TIER, sqrtPriceX96);
        
        // Mint position with both tokens (not truly one-sided but appears so economically)
        (positionId, , ,) = manager.mint(
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: FEE_TIER,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: amount0Desired,
                amount1Desired: amount1Desired,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this), // Contract owns the position
                deadline: block.timestamp + 3600
            })
        );
        
        emit LiquidityProvided(tokenAddress, LIQUIDITY_TOKEN_AMOUNT, ethAmount);
        return positionId;
    }

    // Platform revenue collection
    function collectPlatformFees() external {
        require(msg.sender == platformController, "Only platform controller");
        payable(platformController).transfer(address(this).balance);
    }

    // Get platform statistics
    function getPlatformStats() external view returns (uint256, uint256, uint256) {
        return (tokenCount, totalFeesCollected, address(this).balance);
    }

    // Emergency functions
    function setPlatformController(address newController) external {
        require(msg.sender == platformController, "Only current controller");
        platformController = newController;
    }
} 
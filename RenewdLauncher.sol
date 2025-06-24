// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

interface IERC20Errors {
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
    error ERC20InvalidSender(address sender);
    error ERC20InvalidReceiver(address receiver);
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
    error ERC20InvalidApprover(address approver);
    error ERC20InvalidSpender(address spender);
}

interface IToken {
    function creator() external view returns (address);
}

interface IWETH {
    function withdraw(uint256 amount) external;
}

interface IUniswapV3Factory {
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address);
}

interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
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

    function factory() external view returns (address);
    function WETH9() external view returns (address);
    function positions(uint256 tokenId) external view returns (
        uint96 nonce,
        address operator,
        address token0,
        address token1,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        uint256 feeGrowthInside0LastX128,
        uint256 feeGrowthInside1LastX128,
        uint128 tokensOwed0,
        uint128 tokensOwed1
    );
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
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function ownerOf(uint256 tokenId) external view returns (address);
}
contract Factory {
    event ERC20TokenCreated(address tokenAddress);

    struct TokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        address deployer;
        uint256 time;
        string metadata;
        uint256 marketCapInETH;
    }

    mapping(uint256 => TokenInfo) public deployedTokens;
    uint256 public tokenCount = 0;
    address public platformController;

    address public constant POSITION_MANAGER = 0x1238536071E1c677A632429e3655c799b22cDA52;
    uint256 constant Q96 = 2 ** 96;
    address public constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address public constant SWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;

    uint24 private constant FEE_TIER = 10000;
    uint256 private constant VIRTUAL_ETH = 1.5 ether;

    event TokenPurchased(address buyer, address tokenOut, uint256 ethSpent, uint256 tokensReceived);

    constructor() {
        platformController = msg.sender;
    }

    receive() external payable {}

    function deployCoin(string memory _name, string memory _symbol, string memory _metadata) public payable {
        Token t = new Token(_name, _symbol, msg.sender, address(this));
        emit ERC20TokenCreated(address(t));

        address coinAddress = address(t);
        provideLiquidity(coinAddress, WETH);

        if (msg.value > 0) {
            ISwapRouter02(SWAP_ROUTER).exactInputSingle{ value: msg.value }(
                ISwapRouter02.ExactInputSingleParams({
                    tokenIn: WETH,
                    tokenOut: coinAddress,
                    fee: 10000,
                    recipient: msg.sender,
                    amountIn: msg.value,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );
        }

        deployedTokens[tokenCount] = TokenInfo({
            tokenAddress: coinAddress,
            name: _name,
            symbol: _symbol,
            deployer: msg.sender,
            time: block.timestamp,
            metadata: _metadata,
            marketCapInETH: 0
        });

        tokenCount++;
    }
    function collectFees(uint256 tokenId) external returns (uint256 amount0, uint256 amount1) {
        (, , address token0Raw, address token1Raw, , , , , , , , ) =
            INonfungiblePositionManager(POSITION_MANAGER).positions(tokenId);

        address token0 = token0Raw;
        address token1 = token1Raw;

        if (token0Raw == WETH && token1Raw != WETH) {
            token0 = token1Raw;
            token1 = token1Raw;
        }

        address creator = IToken(token0).creator();
        require(msg.sender == platformController || msg.sender == creator, "Not authorized");

        uint256 beforeToken0 = IERC20(token0).balanceOf(address(this));
        uint256 beforeToken1 = IERC20(token1).balanceOf(address(this));

        INonfungiblePositionManager.CollectParams memory params = INonfungiblePositionManager.CollectParams({
            tokenId: tokenId,
            recipient: address(this),
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        });

        INonfungiblePositionManager(POSITION_MANAGER).collect(params);

        uint256 collected0 = IERC20(token0).balanceOf(address(this)) - beforeToken0;
        uint256 collected1 = IERC20(token1).balanceOf(address(this)) - beforeToken1;

        if (collected0 > 0) {
            uint256 half0 = collected0 / 2;
            IERC20(token0).transfer(platformController, half0);
            IERC20(token0).transfer(creator, collected0 - half0);
        }

        if (collected1 > 0) {
            uint256 half1 = collected1 / 2;
            IERC20(token1).transfer(platformController, half1);
            IERC20(token1).transfer(creator, collected1 - half1);
        }

        return (collected0, collected1);
    }

    function provideLiquidity(address tokenA, address tokenB) public {
        bool tokenAIsToken0 = tokenA < tokenB;
        address token0 = tokenAIsToken0 ? tokenA : tokenB;
        address token1 = tokenAIsToken0 ? tokenB : tokenA;

        IERC20(token0).approve(POSITION_MANAGER, type(uint256).max);
        IERC20(token1).approve(POSITION_MANAGER, type(uint256).max);

        INonfungiblePositionManager manager = INonfungiblePositionManager(POSITION_MANAGER);

        uint160 sqrtPriceX96 = tokenAIsToken0
            ? 3068365595550320841079178
            : 2045645379722529521098596513701367;

        int24 tickLower = tokenAIsToken0 ? int24(-203000) : int24(-887200);
        int24 tickUpper = tokenAIsToken0 ? int24(887200) : int24(203000);
        uint256 amount0Desired = tokenAIsToken0 ? 1000000000000000000000000000 : 0;
        uint256 amount1Desired = tokenAIsToken0 ? 0 : 1000000000000000000000000000;

        manager.createAndInitializePoolIfNecessary(token0, token1, 10000, sqrtPriceX96);

        manager.mint(
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: 10000,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: amount0Desired,
                amount1Desired: amount1Desired,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp
            })
        );
    }
}
contract Token {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public creator;
    address public platform;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    constructor(
        string memory _name,
        string memory _symbol,
        address _creator,
        address _platform
    ) {
        name = _name;
        symbol = _symbol;
        creator = _creator;
        platform = _platform;
        totalSupply = 1_000_000_000 * 10 ** uint256(decimals);
        balanceOf[_platform] = totalSupply;
        emit Transfer(address(0), _platform, totalSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Not enough");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Balance too low");
        require(allowance[from][msg.sender] >= amount, "Allowance too low");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

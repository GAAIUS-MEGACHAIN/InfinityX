// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract InfinityXFactoryToken {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public totalSupply;
    address public immutable creator;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory tokenName, string memory tokenSymbol, uint8 tokenDecimals, uint256 initialSupply, address owner) {
        name = tokenName;
        symbol = tokenSymbol;
        decimals = tokenDecimals;
        creator = owner;
        totalSupply = initialSupply;
        balanceOf[owner] = initialSupply;
        emit Transfer(address(0), owner, initialSupply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "allowance");
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - value;
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "zero-to");
        require(balanceOf[from] >= value, "balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}

contract InfinityXTokenFactory {
    address public owner;
    address public treasury;
    uint256 public serviceFeeWei;
    address[] public tokens;

    event TokenCreated(address indexed creator, address indexed token, string name, string symbol, uint8 decimals, uint256 supply);
    event TreasuryUpdated(address indexed treasury);
    event FeeUpdated(uint256 fee);

    constructor(address initialTreasury, uint256 initialServiceFeeWei) {
        owner = msg.sender;
        treasury = initialTreasury;
        serviceFeeWei = initialServiceFeeWei;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "owner");
        _;
    }

    function createToken(string calldata name, string calldata symbol, uint8 decimals, uint256 initialSupply) external payable returns (address token) {
        require(msg.value >= serviceFeeWei, "fee");
        token = address(new InfinityXFactoryToken(name, symbol, decimals, initialSupply, msg.sender));
        tokens.push(token);
        (bool ok,) = treasury.call{value: msg.value}("");
        require(ok, "treasury");
        emit TokenCreated(msg.sender, token, name, symbol, decimals, initialSupply);
    }

    function setTreasury(address nextTreasury) external onlyOwner {
        require(nextTreasury != address(0), "zero");
        treasury = nextTreasury;
        emit TreasuryUpdated(nextTreasury);
    }

    function setServiceFee(uint256 nextFeeWei) external onlyOwner {
        serviceFeeWei = nextFeeWei;
        emit FeeUpdated(nextFeeWei);
    }

    function tokenCount() external view returns (uint256) {
        return tokens.length;
    }
}

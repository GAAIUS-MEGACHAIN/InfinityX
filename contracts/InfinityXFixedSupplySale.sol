// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @notice Fixed-supply sale adapter. It sells pre-funded IFX inventory and never mints.
/// @dev Bonding curves with real funds require formal audit and liquidity/risk controls.
contract InfinityXFixedSupplySale {
    IERC20 public immutable ifx;
    address public owner;
    address public treasury;
    uint256 public sold;
    uint256 public basePriceWei;
    uint256 public slopeWei;

    event Bought(address indexed buyer, uint256 ifxAmount, uint256 paid);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address ifxToken, address initialTreasury, uint256 initialBasePriceWei, uint256 initialSlopeWei) {
        require(ifxToken != address(0) && initialTreasury != address(0), "zero address");
        ifx = IERC20(ifxToken);
        owner = msg.sender;
        treasury = initialTreasury;
        basePriceWei = initialBasePriceWei;
        slopeWei = initialSlopeWei;
    }

    function quote(uint256 amount) public view returns (uint256) {
        return (basePriceWei * amount) + (slopeWei * ((sold + amount) * (sold + amount) - sold * sold) / 2);
    }

    function buy(uint256 amount) external payable {
        uint256 cost = quote(amount);
        require(msg.value >= cost, "insufficient payment");
        sold += amount;
        require(ifx.transfer(msg.sender, amount), "ifx transfer failed");
        payable(treasury).transfer(cost);
        if (msg.value > cost) payable(msg.sender).transfer(msg.value - cost);
        emit Bought(msg.sender, amount, cost);
    }

    function setCurve(uint256 nextBasePriceWei, uint256 nextSlopeWei) external onlyOwner {
        basePriceWei = nextBasePriceWei;
        slopeWei = nextSlopeWei;
    }
}

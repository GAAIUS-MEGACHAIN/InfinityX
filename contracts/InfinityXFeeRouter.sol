// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Starter EVM fee router for InfinityX service fees.
/// @dev Requires professional audit before mainnet custody or production use.
contract InfinityXFeeRouter {
    address public owner;
    address public treasury;
    uint16 public swapFeeBps = 15;
    uint16 public bridgeFeeBps = 20;
    uint16 public buyFeeBps = 25;
    uint16 public ifxDiscountPercent = 50;

    event TreasuryChanged(address indexed treasury);
    event FeeUpdated(string indexed feeType, uint16 bps);
    event FeeCollected(address indexed payer, address indexed token, uint256 amount, string service);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address initialTreasury) {
        require(initialTreasury != address(0), "treasury zero");
        owner = msg.sender;
        treasury = initialTreasury;
    }

    function setTreasury(address nextTreasury) external onlyOwner {
        require(nextTreasury != address(0), "treasury zero");
        treasury = nextTreasury;
        emit TreasuryChanged(nextTreasury);
    }

    function setFee(string calldata feeType, uint16 bps) external onlyOwner {
        require(bps <= 100, "fee too high");
        bytes32 key = keccak256(bytes(feeType));
        if (key == keccak256("swap")) swapFeeBps = bps;
        else if (key == keccak256("bridge")) bridgeFeeBps = bps;
        else if (key == keccak256("buy")) buyFeeBps = bps;
        else revert("unknown fee");
        emit FeeUpdated(feeType, bps);
    }

    function quote(uint256 amount, uint16 bps, bool paysWithIfx) public view returns (uint256) {
        uint256 fee = (amount * bps) / 10000;
        return paysWithIfx ? (fee * (100 - ifxDiscountPercent)) / 100 : fee;
    }

    receive() external payable {
        emit FeeCollected(msg.sender, address(0), msg.value, "native");
        payable(treasury).transfer(msg.value);
    }
}

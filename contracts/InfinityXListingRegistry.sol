// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Token/dApp listing application registry.
/// @dev Stores applications and review state. Do not treat as an endorsement oracle.
contract InfinityXListingRegistry {
    address public owner;

    struct Listing {
        address applicant;
        string kind;
        string name;
        string metadataUri;
        uint8 status; // 0 pending, 1 approved, 2 rejected
    }

    Listing[] public listings;

    event ListingApplied(uint256 indexed id, address indexed applicant, string kind, string name);
    event ListingReviewed(uint256 indexed id, uint8 status);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function apply(string calldata kind, string calldata name, string calldata metadataUri) external returns (uint256 id) {
        id = listings.length;
        listings.push(Listing(msg.sender, kind, name, metadataUri, 0));
        emit ListingApplied(id, msg.sender, kind, name);
    }

    function review(uint256 id, uint8 status) external onlyOwner {
        require(status == 1 || status == 2, "bad status");
        listings[id].status = status;
        emit ListingReviewed(id, status);
    }
}

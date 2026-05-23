// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract InfinityXGuardianRecovery {
    struct Recovery {
        address wallet;
        address proposedOwner;
        uint64 executeAfter;
        uint8 approvals;
        bool executed;
    }

    uint64 public immutable delaySeconds;
    uint8 public immutable threshold;
    mapping(address => bool) public guardians;
    mapping(bytes32 => Recovery) public recoveries;
    mapping(bytes32 => mapping(address => bool)) public approved;

    event RecoveryProposed(bytes32 indexed id, address indexed wallet, address indexed proposedOwner, uint64 executeAfter);
    event RecoveryApproved(bytes32 indexed id, address indexed guardian, uint8 approvals);
    event RecoveryExecuted(bytes32 indexed id);
    event RecoveryCancelled(bytes32 indexed id);

    constructor(address[] memory initialGuardians, uint8 requiredApprovals, uint64 delay) {
        require(requiredApprovals > 0, "threshold");
        threshold = requiredApprovals;
        delaySeconds = delay;
        for (uint256 index = 0; index < initialGuardians.length; index++) {
            guardians[initialGuardians[index]] = true;
        }
    }

    modifier onlyGuardian() {
        require(guardians[msg.sender], "guardian");
        _;
    }

    function propose(address wallet, address proposedOwner, bytes32 salt) external onlyGuardian returns (bytes32 id) {
        require(wallet != address(0) && proposedOwner != address(0), "zero");
        id = keccak256(abi.encode(wallet, proposedOwner, salt, block.chainid));
        Recovery storage recovery = recoveries[id];
        require(recovery.wallet == address(0), "exists");
        recovery.wallet = wallet;
        recovery.proposedOwner = proposedOwner;
        recovery.executeAfter = uint64(block.timestamp) + delaySeconds;
        _approve(id, recovery);
        emit RecoveryProposed(id, wallet, proposedOwner, recovery.executeAfter);
    }

    function approve(bytes32 id) external onlyGuardian {
        Recovery storage recovery = recoveries[id];
        require(recovery.wallet != address(0), "missing");
        _approve(id, recovery);
    }

    function execute(bytes32 id) external {
        Recovery storage recovery = recoveries[id];
        require(recovery.wallet != address(0), "missing");
        require(!recovery.executed, "executed");
        require(recovery.approvals >= threshold, "approvals");
        require(block.timestamp >= recovery.executeAfter, "delay");
        recovery.executed = true;
        emit RecoveryExecuted(id);
    }

    function cancel(bytes32 id) external {
        Recovery storage recovery = recoveries[id];
        require(msg.sender == recovery.wallet, "wallet");
        delete recoveries[id];
        emit RecoveryCancelled(id);
    }

    function _approve(bytes32 id, Recovery storage recovery) internal {
        require(!approved[id][msg.sender], "approved");
        approved[id][msg.sender] = true;
        recovery.approvals += 1;
        emit RecoveryApproved(id, msg.sender, recovery.approvals);
    }
}

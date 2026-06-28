// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IRateLimiter.sol";

/**
 * @title RateLimiter
 * @notice Enforces per-wallet and per-corridor transfer velocity caps and cooldowns.
 */
contract RateLimiter is IRateLimiter, AccessControl {
    bytes32 public constant ROUTER_ROLE = keccak256("ROUTER_ROLE");

    mapping(bytes32 => RateLimit) public corridorLimits;
    
    mapping(address => mapping(bytes32 => uint256)) public lastTransferTime;
    mapping(address => mapping(bytes32 => uint256)) public windowStart;
    mapping(address => mapping(bytes32 => uint256)) public windowCount;
    mapping(address => mapping(bytes32 => uint256)) public windowAmount;

    error RateLimitExceeded();

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function checkRateLimit(
        address sender,
        uint256 amount,
        bytes32 corridorId
    ) external view override returns (bool) {
        RateLimit memory limit = corridorLimits[corridorId];
        if (limit.windowDuration == 0) return true;

        if (block.timestamp < lastTransferTime[sender][corridorId] + limit.cooldownPeriod) {
            return false;
        }

        uint256 start = windowStart[sender][corridorId];
        if (block.timestamp >= start + limit.windowDuration) {
            return amount <= limit.maxAmount && limit.maxCount >= 1;
        } else {
            if (windowCount[sender][corridorId] + 1 > limit.maxCount) return false;
            if (windowAmount[sender][corridorId] + amount > limit.maxAmount) return false;
            return true;
        }
    }

    function recordTransfer(
        address sender,
        uint256 amount,
        bytes32 corridorId
    ) external override onlyRole(ROUTER_ROLE) {
        RateLimit memory limit = corridorLimits[corridorId];
        if (limit.windowDuration == 0) return;

        uint256 start = windowStart[sender][corridorId];
        if (block.timestamp >= start + limit.windowDuration) {
            windowStart[sender][corridorId] = block.timestamp;
            windowCount[sender][corridorId] = 1;
            windowAmount[sender][corridorId] = amount;
        } else {
            windowCount[sender][corridorId] += 1;
            windowAmount[sender][corridorId] += amount;
        }
        lastTransferTime[sender][corridorId] = block.timestamp;

        emit TransferRecorded(sender, corridorId, amount);
    }

    function setCorridorRateLimit(
        bytes32 corridorId,
        RateLimit calldata limit
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        corridorLimits[corridorId] = limit;
        emit RateLimitUpdated(corridorId, limit.maxAmount, limit.maxCount);
    }
}

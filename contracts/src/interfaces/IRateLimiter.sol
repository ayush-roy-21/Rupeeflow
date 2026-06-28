// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IRateLimiter
 * @notice Interface for per-wallet and per-corridor transfer rate limiting.
 */
interface IRateLimiter {
    struct RateLimit {
        uint256 maxAmount;        // Max transfer amount per window
        uint256 maxCount;         // Max number of transfers per window
        uint256 windowDuration;   // Time window in seconds
        uint256 cooldownPeriod;   // Cooldown between transfers
    }

    event RateLimitUpdated(bytes32 indexed corridorId, uint256 maxAmount, uint256 maxCount);
    event TransferRecorded(address indexed sender, bytes32 indexed corridorId, uint256 amount);

    function checkRateLimit(
        address sender,
        uint256 amount,
        bytes32 corridorId
    ) external returns (bool allowed);

    function recordTransfer(
        address sender,
        uint256 amount,
        bytes32 corridorId
    ) external;

    function setCorridorRateLimit(
        bytes32 corridorId,
        RateLimit calldata limit
    ) external;
}

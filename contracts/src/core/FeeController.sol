// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IFeeController.sol";

/**
 * @title FeeController
 * @notice Dynamic fee calculation engine with tiered pricing, volume discounts, and corridor-specific overrides.
 */
contract FeeController is IFeeController, AccessControl {
    uint256 public baseFeeRate = 30;           // Default fee in basis points (30 = 0.30%)
    uint256 public constant MAX_FEE = 500;     // 5% maximum fee cap

    mapping(bytes32 => uint256) public corridorFeeOverrides;
    mapping(bytes32 => bool) public hasCorridorOverride;
    FeeTier[] public feeTiers;                 // Volume-based discount tiers

    // User 30-day rolling volume tracking (for tier calculations)
    mapping(address => uint256) public user30DayVolume;
    mapping(address => uint256) public volumeLastUpdated;

    error FeeExceedsMax();

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function calculateFee(
        address sender,
        uint256 amount,
        bytes32 corridorId
    ) external view override returns (uint256 fee, uint256 netAmount) {
        uint256 rate = baseFeeRate;

        // Apply corridor override if present
        if (hasCorridorOverride[corridorId]) {
            rate = corridorFeeOverrides[corridorId];
        } else if (feeTiers.length > 0) {
            // Check volume discount tiers
            uint256 userVol = user30DayVolume[sender];
            for (uint256 i = feeTiers.length; i > 0; i--) {
                if (userVol >= feeTiers[i - 1].minVolume) {
                    rate = feeTiers[i - 1].feeRate;
                    break;
                }
            }
        }

        if (rate > MAX_FEE) {
            revert FeeExceedsMax();
        }

        fee = (amount * rate) / 10000;
        netAmount = amount - fee;
        return (fee, netAmount);
    }

    function recordVolume(address sender, uint256 amount) external {
        if (block.timestamp >= volumeLastUpdated[sender] + 30 days) {
            user30DayVolume[sender] = amount;
        } else {
            user30DayVolume[sender] += amount;
        }
        volumeLastUpdated[sender] = block.timestamp;
    }

    function setBaseFeeRate(uint256 newRate) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newRate > MAX_FEE) revert FeeExceedsMax();
        uint256 old = baseFeeRate;
        baseFeeRate = newRate;
        emit BaseFeeRateUpdated(old, newRate);
    }

    function setCorridorFee(bytes32 corridorId, uint256 feeRate) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (feeRate > MAX_FEE) revert FeeExceedsMax();
        corridorFeeOverrides[corridorId] = feeRate;
        hasCorridorOverride[corridorId] = true;
        emit CorridorFeeUpdated(corridorId, feeRate);
    }

    function setFeeTiers(FeeTier[] calldata tiers) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        delete feeTiers;
        for (uint256 i = 0; i < tiers.length; i++) {
            if (tiers[i].feeRate > MAX_FEE) revert FeeExceedsMax();
            feeTiers.push(tiers[i]);
        }
        emit FeeTiersUpdated(tiers.length);
    }
}

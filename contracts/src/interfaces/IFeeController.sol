// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IFeeController
 * @notice Interface for dynamic remittance fee calculation engine.
 */
interface IFeeController {
    struct FeeTier {
        uint256 minVolume;    // Minimum 30-day volume for this tier
        uint256 feeRate;      // Fee rate in basis points (e.g., 30 = 0.30%)
    }

    event BaseFeeRateUpdated(uint256 oldRate, uint256 newRate);
    event CorridorFeeUpdated(bytes32 indexed corridorId, uint256 feeRate);
    event FeeTiersUpdated(uint256 count);

    function calculateFee(
        address sender,
        uint256 amount,
        bytes32 corridorId
    ) external view returns (uint256 fee, uint256 netAmount);

    function setBaseFeeRate(uint256 newRate) external;
    function setCorridorFee(bytes32 corridorId, uint256 feeRate) external;
    function setFeeTiers(FeeTier[] calldata tiers) external;
}

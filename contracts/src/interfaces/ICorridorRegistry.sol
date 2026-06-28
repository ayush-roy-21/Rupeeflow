// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title ICorridorRegistry
 * @notice Interface for managing cross-border remittance corridor configurations.
 */
interface ICorridorRegistry {
    struct Corridor {
        bytes32 id;                  // keccak256(abi.encodePacked("US-IN")) for US->India
        string sourceCountry;        // ISO 3166-1 alpha-2 (e.g., "US")
        string destCountry;          // ISO 3166-1 alpha-2 (e.g., "IN")
        address settlementToken;     // ERC-20 CBDC token address used for settlement
        bool active;                 // Whether corridor accepts transfers
        uint256 minAmount;           // Minimum transfer amount (in CBDC token decimals)
        uint256 maxAmount;           // Maximum transfer amount
        uint256 dailyLimit;          // Daily aggregate limit per corridor
        uint256 reportingThreshold;  // AML reporting threshold
        uint256 expiryDuration;      // Transfer expiry duration in seconds
    }

    event CorridorRegistered(bytes32 indexed corridorId, string source, string dest, address settlementToken);
    event CorridorUpdated(bytes32 indexed corridorId, bool active);
    event CorridorDeactivated(bytes32 indexed corridorId);

    function registerCorridor(Corridor calldata corridor) external;
    function updateCorridor(bytes32 corridorId, Corridor calldata corridor) external;
    function deactivateCorridor(bytes32 corridorId) external;
    function getCorridor(bytes32 corridorId) external view returns (Corridor memory);
    function getActiveCorridors() external view returns (Corridor[] memory);
    function isCorridorActive(bytes32 corridorId) external view returns (bool);
}

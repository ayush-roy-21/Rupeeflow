// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IAMLModule
 * @notice Interface for on-chain anti-money laundering (AML) screening and wallet clustering.
 */
interface IAMLModule {
    event TransactionScreened(bytes32 indexed transferId, uint8 riskScore, bool flagged);
    event WalletClusterFlagged(uint256 indexed clusterId, address[] wallets, bytes32 reason);
    event WalletAddedToCluster(address indexed wallet, uint256 indexed clusterId);

    function screenTransaction(
        address sender,
        address recipient,
        uint256 amount,
        bytes32 corridorId
    ) external returns (uint8 riskScore, bool flagged);

    function flagWalletCluster(
        address[] calldata wallets,
        bytes32 reason
    ) external;

    function getWalletRiskScore(address wallet) external view returns (uint8);

    function addToCluster(
        address[] calldata wallets,
        uint256 clusterId
    ) external;

    function getClusterMembers(uint256 clusterId) external view returns (address[] memory);
}

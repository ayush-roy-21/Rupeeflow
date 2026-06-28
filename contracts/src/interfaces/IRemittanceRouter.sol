// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IRemittanceRouter
 * @notice Interface for the central orchestrator of RupeeFlow remittances.
 */
interface IRemittanceRouter {
    enum TransferStatus {
        INITIATED,    // 0 - Funds deposited in escrow
        COMPLETED,    // 1 - Funds released to recipient
        CANCELLED,    // 2 - Cancelled by sender
        FLAGGED,      // 3 - AML flagged, pending review
        REJECTED,     // 4 - Rejected after AML review
        REFUNDED,     // 5 - Funds returned to sender
        EXPIRED       // 6 - Expired past deadline
    }

    struct Transfer {
        bytes32 id;
        address sender;
        address recipient;
        address settlementToken;
        uint256 amount;          // Gross amount (before fees)
        uint256 netAmount;       // Amount after fees
        uint256 fee;             // Protocol fee
        bytes32 corridorId;
        TransferStatus status;
        uint8 riskScore;
        uint256 createdAt;
        uint256 completedAt;
        uint256 expiresAt;
        bytes metadata;          // Arbitrary metadata (encoded)
    }

    event TransferInitiated(
        bytes32 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        bytes32 corridorId,
        uint8 riskScore
    );
    event TransferCompleted(bytes32 indexed transferId, address indexed recipient, uint256 netAmount, uint256 completedAt);
    event TransferCancelled(bytes32 indexed transferId, address indexed sender);
    event TransferFlagged(bytes32 indexed transferId, uint8 riskScore, bytes32 reason);
    event TransferRejected(bytes32 indexed transferId, bytes32 reason);
    event TransferRefunded(bytes32 indexed transferId, address indexed sender, uint256 amount);
    event TransferExpired(bytes32 indexed transferId);
    event FeeTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    function initiateTransfer(
        address recipient,
        uint256 amount,
        bytes32 corridorId,
        bytes calldata metadata
    ) external returns (bytes32 transferId);

    function completeTransfer(
        bytes32 transferId,
        bytes[] calldata signatures
    ) external;

    function cancelTransfer(bytes32 transferId) external;
    function claimRefund(bytes32 transferId) external;
    function rejectTransfer(bytes32 transferId, bytes32 reason) external;
    function getUserTransfers(address user) external view returns (bytes32[] memory);
    function getTransfer(bytes32 transferId) external view returns (Transfer memory);
}

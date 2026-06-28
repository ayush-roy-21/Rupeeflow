// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IMultiSigEscrow
 * @notice Interface for trustless multi-signature CBDC escrow custody.
 */
interface IMultiSigEscrow {
    enum EscrowStatus {
        EMPTY,
        DEPOSITED,
        RELEASED,
        REFUNDED
    }

    struct EscrowDeposit {
        address depositor;            // Who deposited (Router on behalf of sender)
        address beneficiary;          // Who receives on release
        address token;                // ERC-20 CBDC token held in escrow
        uint256 amount;
        uint256 depositedAt;
        uint256 expiresAt;
        EscrowStatus status;
    }

    event FundsDeposited(bytes32 indexed transferId, uint256 amount);
    event FundsReleased(bytes32 indexed transferId, address indexed beneficiary, uint256 amount);
    event FundsRefunded(bytes32 indexed transferId, address indexed depositor, uint256 amount);
    event SignersUpdated(address[] signers, uint256 threshold);

    function deposit(
        bytes32 transferId,
        address depositor,
        address beneficiary,
        address token,
        uint256 amount,
        uint256 expiresAt
    ) external;

    function release(
        bytes32 transferId,
        bytes[] calldata signatures
    ) external;

    function refund(bytes32 transferId) external;

    function updateSigners(
        address[] calldata newSigners,
        uint256 newThreshold
    ) external;
}

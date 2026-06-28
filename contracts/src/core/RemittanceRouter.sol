// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IRemittanceRouter.sol";
import "../interfaces/IMultiSigEscrow.sol";
import "../interfaces/IFeeController.sol";
import "../interfaces/IAMLModule.sol";
import "../interfaces/ICorridorRegistry.sol";
import "../interfaces/IRateLimiter.sol";
import "../libraries/TransferLib.sol";

/**
 * @title RemittanceRouter
 * @notice Central entry point and orchestrator for RupeeFlow cross-border remittances.
 */
contract RemittanceRouter is IRemittanceRouter, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    IMultiSigEscrow public immutable escrow;
    IFeeController public immutable feeController;
    IAMLModule public immutable amlModule;
    ICorridorRegistry public immutable corridorRegistry;
    IRateLimiter public immutable rateLimiter;

    address public feeTreasury;
    uint256 public transferCount;

    mapping(bytes32 => Transfer) public transfers;
    mapping(address => bytes32[]) public userTransfers;

    error InvalidRecipient();
    error InvalidAmount();
    error InvalidCorridor();
    error TransferNotFound();
    error InvalidTransferStatus();
    error UnauthorizedCaller();
    error TransferNotExpired();
    error RateLimitExceeded();

    constructor(
        address admin,
        address _escrow,
        address _feeController,
        address _amlModule,
        address _corridorRegistry,
        address _rateLimiter,
        address _feeTreasury
    ) {
        require(
            admin != address(0) && _escrow != address(0) && _feeController != address(0) &&
            _amlModule != address(0) && _corridorRegistry != address(0) && _rateLimiter != address(0) &&
            _feeTreasury != address(0),
            "Zero address"
        );

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(GUARDIAN_ROLE, admin);

        escrow = IMultiSigEscrow(_escrow);
        feeController = IFeeController(_feeController);
        amlModule = IAMLModule(_amlModule);
        corridorRegistry = ICorridorRegistry(_corridorRegistry);
        rateLimiter = IRateLimiter(_rateLimiter);
        feeTreasury = _feeTreasury;
    }

    function initiateTransfer(
        address recipient,
        uint256 amount,
        bytes32 corridorId,
        bytes calldata metadata
    ) external override nonReentrant whenNotPaused returns (bytes32 transferId) {
        if (recipient == address(0)) revert InvalidRecipient();

        ICorridorRegistry.Corridor memory corridor = corridorRegistry.getCorridor(corridorId);
        if (!corridor.active) revert InvalidCorridor();
        if (amount < corridor.minAmount || amount > corridor.maxAmount) revert InvalidAmount();

        if (!rateLimiter.checkRateLimit(msg.sender, amount, corridorId)) {
            revert RateLimitExceeded();
        }

        (uint8 riskScore, bool flagged) = amlModule.screenTransaction(msg.sender, recipient, amount, corridorId);
        (uint256 fee, uint256 netAmount) = feeController.calculateFee(msg.sender, amount, corridorId);

        rateLimiter.recordTransfer(msg.sender, amount, corridorId);

        transferId = TransferLib.generateTransferId(msg.sender, recipient, amount, transferCount++, block.timestamp);
        uint256 expiresAt = block.timestamp + corridor.expiryDuration;

        TransferStatus initialStatus = flagged ? TransferStatus.FLAGGED : TransferStatus.INITIATED;

        transfers[transferId] = Transfer({
            id: transferId,
            sender: msg.sender,
            recipient: recipient,
            settlementToken: corridor.settlementToken,
            amount: amount,
            netAmount: netAmount,
            fee: fee,
            corridorId: corridorId,
            status: initialStatus,
            riskScore: riskScore,
            createdAt: block.timestamp,
            completedAt: 0,
            expiresAt: expiresAt,
            metadata: metadata
        });

        userTransfers[msg.sender].push(transferId);

        // Pull gross CBDC tokens from user
        IERC20(corridor.settlementToken).safeTransferFrom(msg.sender, address(this), amount);

        // Send protocol fee to treasury
        if (fee > 0) {
            IERC20(corridor.settlementToken).safeTransfer(feeTreasury, fee);
        }

        // Deposit netAmount into escrow
        IERC20(corridor.settlementToken).forceApprove(address(escrow), netAmount);
        escrow.deposit(transferId, msg.sender, recipient, corridor.settlementToken, netAmount, expiresAt);

        emit TransferInitiated(transferId, msg.sender, recipient, amount, fee, corridorId, riskScore);
        if (flagged) {
            emit TransferFlagged(transferId, riskScore, "AML Threshold Exceeded");
        }

        return transferId;
    }

    function completeTransfer(
        bytes32 transferId,
        bytes[] calldata signatures
    ) external override nonReentrant whenNotPaused {
        Transfer storage t = transfers[transferId];
        if (t.id == bytes32(0)) revert TransferNotFound();
        if (t.status != TransferStatus.INITIATED) revert InvalidTransferStatus();

        t.status = TransferStatus.COMPLETED;
        t.completedAt = block.timestamp;

        escrow.release(transferId, signatures);

        emit TransferCompleted(transferId, t.recipient, t.netAmount, block.timestamp);
    }

    function cancelTransfer(bytes32 transferId) external override nonReentrant {
        Transfer storage t = transfers[transferId];
        if (t.id == bytes32(0)) revert TransferNotFound();
        if (msg.sender != t.sender) revert UnauthorizedCaller();
        if (t.status != TransferStatus.INITIATED && t.status != TransferStatus.FLAGGED) revert InvalidTransferStatus();

        t.status = TransferStatus.CANCELLED;
        escrow.refund(transferId);

        emit TransferCancelled(transferId, t.sender);
    }

    function claimRefund(bytes32 transferId) external override nonReentrant {
        Transfer storage t = transfers[transferId];
        if (t.id == bytes32(0)) revert TransferNotFound();
        if (msg.sender != t.sender) revert UnauthorizedCaller();

        if (block.timestamp < t.expiresAt && t.status == TransferStatus.INITIATED) {
            revert TransferNotExpired();
        }

        if (t.status != TransferStatus.CANCELLED && t.status != TransferStatus.REJECTED && t.status != TransferStatus.EXPIRED) {
            if (block.timestamp >= t.expiresAt && t.status == TransferStatus.INITIATED) {
                t.status = TransferStatus.EXPIRED;
                emit TransferExpired(transferId);
            } else {
                revert InvalidTransferStatus();
            }
        }

        escrow.refund(transferId);
        emit TransferRefunded(transferId, t.sender, t.netAmount);
    }

    function rejectTransfer(
        bytes32 transferId,
        bytes32 reason
    ) external override onlyRole(OPERATOR_ROLE) {
        Transfer storage t = transfers[transferId];
        if (t.id == bytes32(0)) revert TransferNotFound();
        if (t.status != TransferStatus.FLAGGED) revert InvalidTransferStatus();

        t.status = TransferStatus.REJECTED;
        escrow.refund(transferId);

        emit TransferRejected(transferId, reason);
    }

    function pause() external {
        require(hasRole(GUARDIAN_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Unauthorized pause");
        _pause();
    }

    function unpause() external {
        require(hasRole(GUARDIAN_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Unauthorized unpause");
        _unpause();
    }

    function setFeeTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Zero address");
        address old = feeTreasury;
        feeTreasury = newTreasury;
        emit FeeTreasuryUpdated(old, newTreasury);
    }

    function getUserTransfers(address user) external view override returns (bytes32[] memory) {
        return userTransfers[user];
    }

    function getTransfer(bytes32 transferId) external view override returns (Transfer memory) {
        if (transfers[transferId].id == bytes32(0)) revert TransferNotFound();
        return transfers[transferId];
    }
}

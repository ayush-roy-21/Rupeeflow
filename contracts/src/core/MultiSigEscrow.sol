// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IMultiSigEscrow.sol";

/**
 * @title MultiSigEscrow
 * @notice Trustless CBDC escrow vault requiring M-of-N off-chain ECDSA signatures for fund release.
 */
contract MultiSigEscrow is IMultiSigEscrow, AccessControl, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    bytes32 public constant ROUTER_ROLE = keccak256("ROUTER_ROLE");
    bytes32 public constant RELEASE_TYPEHASH = keccak256(
        "Release(bytes32 transferId,address beneficiary,address token,uint256 amount,uint256 nonce)"
    );

    address[] public signers;
    mapping(address => bool) public isSigner;
    uint256 public threshold;         // M-of-N required signatures
    uint256 public refundTimelock;    // Minimum time before refund allowed (default 24h)

    mapping(bytes32 => EscrowDeposit) public deposits;
    mapping(bytes32 => uint256) public nonces;

    error InsufficientSignatures();
    error InvalidSignature();
    error DuplicateSigner();
    error EscrowNotDeposited();
    error RefundTimelockActive();

    constructor(
        address admin,
        address[] memory initialSigners,
        uint256 initialThreshold
    ) EIP712("RupeeFlowMultiSigEscrow", "1") {
        require(admin != address(0), "Invalid admin");
        require(initialSigners.length >= initialThreshold && initialThreshold > 0, "Invalid threshold");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);

        for (uint256 i = 0; i < initialSigners.length; i++) {
            require(initialSigners[i] != address(0), "Zero signer");
            require(!isSigner[initialSigners[i]], "Duplicate initial signer");
            isSigner[initialSigners[i]] = true;
            signers.push(initialSigners[i]);
        }
        threshold = initialThreshold;
        refundTimelock = 24 hours;
    }

    function deposit(
        bytes32 transferId,
        address depositor,
        address beneficiary,
        address token,
        uint256 amount,
        uint256 expiresAt
    ) external override onlyRole(ROUTER_ROLE) nonReentrant {
        require(deposits[transferId].status == EscrowStatus.EMPTY, "Already deposited");
        require(token != address(0) && amount > 0, "Invalid deposit params");

        // Transfer tokens from depositor (usually Router or User) to escrow
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        deposits[transferId] = EscrowDeposit({
            depositor: depositor,
            beneficiary: beneficiary,
            token: token,
            amount: amount,
            depositedAt: block.timestamp,
            expiresAt: expiresAt,
            status: EscrowStatus.DEPOSITED
        });

        emit FundsDeposited(transferId, amount);
    }

    function release(
        bytes32 transferId,
        bytes[] calldata signatures
    ) external override nonReentrant {
        EscrowDeposit storage dep = deposits[transferId];
        if (dep.status != EscrowStatus.DEPOSITED) revert EscrowNotDeposited();
        if (signatures.length < threshold) revert InsufficientSignatures();

        uint256 currentNonce = nonces[transferId]++;
        
        // Verify M-of-N signatures
        bytes32 structHash = keccak256(
            abi.encode(RELEASE_TYPEHASH, transferId, dep.beneficiary, dep.token, dep.amount, currentNonce)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        address[] memory recovered = new address[](signatures.length);
        for (uint256 i = 0; i < signatures.length; i++) {
            (address signerAddr, ECDSA.RecoverError err, ) = ECDSA.tryRecover(digest, signatures[i]);
            if (err != ECDSA.RecoverError.NoError || !isSigner[signerAddr]) {
                revert InvalidSignature();
            }
            for (uint256 j = 0; j < i; j++) {
                if (recovered[j] == signerAddr) revert DuplicateSigner();
            }
            recovered[i] = signerAddr;
        }

        dep.status = EscrowStatus.RELEASED;
        IERC20(dep.token).safeTransfer(dep.beneficiary, dep.amount);

        emit FundsReleased(transferId, dep.beneficiary, dep.amount);
    }

    function refund(bytes32 transferId) external override onlyRole(ROUTER_ROLE) nonReentrant {
        EscrowDeposit storage dep = deposits[transferId];
        if (dep.status != EscrowStatus.DEPOSITED) revert EscrowNotDeposited();
        
        // Ensure refund occurs after expiry or timelock
        if (block.timestamp < dep.expiresAt && block.timestamp < dep.depositedAt + refundTimelock) {
            revert RefundTimelockActive();
        }

        dep.status = EscrowStatus.REFUNDED;
        IERC20(dep.token).safeTransfer(dep.depositor, dep.amount);

        emit FundsRefunded(transferId, dep.depositor, dep.amount);
    }

    function updateSigners(
        address[] calldata newSigners,
        uint256 newThreshold
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newSigners.length >= newThreshold && newThreshold > 0, "Invalid threshold");

        for (uint256 i = 0; i < signers.length; i++) {
            isSigner[signers[i]] = false;
        }
        delete signers;

        for (uint256 i = 0; i < newSigners.length; i++) {
            require(newSigners[i] != address(0), "Zero signer");
            require(!isSigner[newSigners[i]], "Duplicate signer");
            isSigner[newSigners[i]] = true;
            signers.push(newSigners[i]);
        }
        threshold = newThreshold;

        emit SignersUpdated(newSigners, newThreshold);
    }
}

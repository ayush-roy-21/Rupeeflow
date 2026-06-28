# Smart Contract Specifications — RupeeFlow

> Detailed specifications for all Solidity smart contracts in the RupeeFlow protocol.

---

## Table of Contents

- [Overview](#overview)
- [Dependency Graph](#dependency-graph)
- [Solidity Version & Compiler](#solidity-version--compiler)
- [Core Contracts](#core-contracts)
  - [RemittanceRouter](#remittanceroutersol)
  - [MultiSigEscrow](#multisigescerowsol)
  - [FeeController](#feecontrollersol)
- [Compliance Contracts](#compliance-contracts)
  - [AMLModule](#amlmodulesol)
  - [SanctionsList](#sanctionslistsol)
  - [RateLimiter](#ratelimitersol)
- [Governance Contracts](#governance-contracts)
  - [CorridorRegistry](#corridorregistrysol)
  - [EmergencyGuardian](#emergencyguardiansol)
- [Libraries](#libraries)
- [Interfaces](#interfaces)
- [Events](#events)
- [Error Codes](#error-codes)
- [Storage Layout](#storage-layout)

---

## Overview

All contracts are built with **Solidity 0.8.24** and leverage **OpenZeppelin Contracts v5.x** for battle-tested security primitives. The protocol follows a modular architecture where the `RemittanceRouter` acts as the central orchestrator, delegating specialized operations to dedicated modules.

---

## Dependency Graph

```
RemittanceRouter
├── inherits: ReentrancyGuard, Pausable, AccessControl
├── uses: IMultiSigEscrow (MultiSigEscrow)
├── uses: IFeeController (FeeController)
├── uses: IAMLModule (AMLModule)
├── uses: IERC20 (USDC)
├── uses: TransferLib
└── uses: CorridorLib

MultiSigEscrow
├── inherits: ReentrancyGuard, AccessControl
├── uses: ECDSA, EIP712
├── uses: SafeERC20
└── uses: IERC20 (USDC)

FeeController
├── inherits: AccessControl
└── uses: CorridorLib

AMLModule
├── inherits: AccessControl
├── uses: AMLScoring (library)
└── uses: SanctionsList

RateLimiter
└── inherits: AccessControl

CorridorRegistry
└── inherits: AccessControl

EmergencyGuardian
├── inherits: AccessControl
└── uses: IPausable (Router, Escrow)
```

---

## Solidity Version & Compiler

```toml
# foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
optimizer = true
optimizer_runs = 10000
evm_version = "cancun"
via_ir = true

[profile.default.fuzz]
runs = 1000
max_test_rejects = 500000

[profile.default.invariant]
runs = 256
depth = 128

[profile.ci]
fuzz = { runs = 10000 }
invariant = { runs = 512, depth = 256 }
```

---

## Core Contracts

### `RemittanceRouter.sol`

**Purpose**: Central entry point and orchestrator for all remittance operations.

**Inheritance**: `ReentrancyGuard`, `Pausable`, `AccessControl`

**Roles**:
| Role | Description |
|------|-------------|
| `DEFAULT_ADMIN_ROLE` | Can grant/revoke other roles |
| `OPERATOR_ROLE` | Can complete/reject flagged transfers |
| `GUARDIAN_ROLE` | Can pause/unpause the protocol |

#### State Variables

```solidity
IERC20 public immutable usdc;
IMultiSigEscrow public escrow;
IFeeController public feeController;
IAMLModule public amlModule;
ICorridorRegistry public corridorRegistry;
IRateLimiter public rateLimiter;

mapping(bytes32 => Transfer) public transfers;
mapping(address => bytes32[]) public userTransfers;

uint256 public transferCount;
```

#### Structs

```solidity
struct Transfer {
    bytes32 id;
    address sender;
    address recipient;
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

enum TransferStatus {
    INITIATED,    // 0 - Funds deposited in escrow
    COMPLETED,    // 1 - Funds released to recipient
    CANCELLED,    // 2 - Cancelled by sender
    FLAGGED,      // 3 - AML flagged, pending review
    REJECTED,     // 4 - Rejected after AML review
    REFUNDED,     // 5 - Funds returned to sender
    EXPIRED       // 6 - Expired past deadline
}
```

#### Functions

```solidity
/// @notice Initiates a new cross-border transfer
/// @param recipient The recipient wallet address
/// @param amount The gross USDC amount (6 decimals)
/// @param corridorId The corridor identifier (e.g., keccak256("US-IN"))
/// @param metadata Arbitrary encoded metadata
/// @return transferId The unique transfer identifier
function initiateTransfer(
    address recipient,
    uint256 amount,
    bytes32 corridorId,
    bytes calldata metadata
) external nonReentrant whenNotPaused returns (bytes32 transferId);

/// @notice Completes a transfer by releasing escrowed funds
/// @param transferId The transfer to complete
/// @param signatures Multi-sig signatures authorizing release
function completeTransfer(
    bytes32 transferId,
    bytes[] calldata signatures
) external nonReentrant whenNotPaused;

/// @notice Cancels a pending transfer (sender only)
/// @param transferId The transfer to cancel
function cancelTransfer(bytes32 transferId) external nonReentrant;

/// @notice Claims refund for cancelled/rejected/expired transfer
/// @param transferId The transfer to refund
function claimRefund(bytes32 transferId) external nonReentrant;

/// @notice Rejects a flagged transfer (operator only)
/// @param transferId The flagged transfer to reject
/// @param reason Encoded rejection reason
function rejectTransfer(
    bytes32 transferId,
    bytes32 reason
) external onlyRole(OPERATOR_ROLE);

/// @notice Gets all transfers for a user
/// @param user The user address
/// @return transferIds Array of transfer IDs
function getUserTransfers(address user) external view returns (bytes32[] memory);

/// @notice Gets transfer details
/// @param transferId The transfer ID
/// @return transfer The Transfer struct
function getTransfer(bytes32 transferId) external view returns (Transfer memory);
```

---

### `MultiSigEscrow.sol`

**Purpose**: Trustless USDC custody with multi-signature release authorization.

**Inheritance**: `ReentrancyGuard`, `AccessControl`, `EIP712`

**Key Design**: Uses off-chain EIP-712 typed signatures collected and submitted in a single transaction (Gnosis Safe pattern).

#### State Variables

```solidity
IERC20 public immutable usdc;
address[] public signers;
uint256 public threshold;         // M-of-N required signatures
uint256 public refundTimelock;    // Minimum time before refund allowed

mapping(bytes32 => EscrowDeposit) public deposits;
mapping(bytes32 => bool) public usedNonces;
```

#### Structs

```solidity
struct EscrowDeposit {
    address depositor;            // Who deposited (Router on behalf of sender)
    address beneficiary;          // Who receives on release
    uint256 amount;
    uint256 depositedAt;
    uint256 expiresAt;
    EscrowStatus status;
}

enum EscrowStatus {
    EMPTY,
    DEPOSITED,
    RELEASED,
    REFUNDED
}
```

#### Functions

```solidity
/// @notice Deposits USDC into escrow for a transfer
/// @dev Only callable by the RemittanceRouter
function deposit(
    bytes32 transferId,
    address depositor,
    address beneficiary,
    uint256 amount,
    uint256 expiresAt
) external onlyRole(ROUTER_ROLE) nonReentrant;

/// @notice Releases escrowed funds to beneficiary
/// @dev Requires threshold signatures from authorized signers
function release(
    bytes32 transferId,
    bytes[] calldata signatures
) external nonReentrant;

/// @notice Refunds deposited funds after timelock expires
/// @dev Callable by router for cancelled/rejected/expired transfers
function refund(bytes32 transferId) external onlyRole(ROUTER_ROLE) nonReentrant;

/// @notice Updates the signer set and threshold
/// @dev Admin only, emits SignersUpdated event
function updateSigners(
    address[] calldata newSigners,
    uint256 newThreshold
) external onlyRole(DEFAULT_ADMIN_ROLE);
```

#### Signature Verification

```solidity
// EIP-712 type hash for release authorization
bytes32 constant RELEASE_TYPEHASH = keccak256(
    "Release(bytes32 transferId,address beneficiary,uint256 amount,uint256 nonce)"
);

function _verifySignatures(
    bytes32 transferId,
    address beneficiary,
    uint256 amount,
    bytes[] calldata signatures
) internal view returns (bool) {
    bytes32 structHash = keccak256(
        abi.encode(RELEASE_TYPEHASH, transferId, beneficiary, amount, nonce)
    );
    bytes32 digest = _hashTypedDataV4(structHash);

    address[] memory recovered = new address[](signatures.length);
    for (uint256 i = 0; i < signatures.length; i++) {
        recovered[i] = ECDSA.recover(digest, signatures[i]);
        require(_isSigner(recovered[i]), "Invalid signer");
        // Check for duplicate signers
        for (uint256 j = 0; j < i; j++) {
            require(recovered[i] != recovered[j], "Duplicate signer");
        }
    }
    return recovered.length >= threshold;
}
```

---

### `FeeController.sol`

**Purpose**: Dynamic fee calculation with tiered pricing and corridor-specific overrides.

**Inheritance**: `AccessControl`

#### State Variables

```solidity
uint256 public baseFeeRate;           // Default fee in basis points (e.g., 30 = 0.30%)
uint256 public constant MAX_FEE = 500; // 5% maximum fee cap

mapping(bytes32 => uint256) public corridorFeeOverrides;
FeeTier[] public feeTiers;            // Volume-based discount tiers

struct FeeTier {
    uint256 minVolume;    // Minimum 30-day volume for this tier
    uint256 feeRate;      // Fee rate in basis points
}
```

#### Functions

```solidity
/// @notice Calculates the fee for a transfer
/// @param sender The sender address (for volume lookup)
/// @param amount The transfer amount
/// @param corridorId The corridor identifier
/// @return fee The calculated fee amount
/// @return netAmount The amount after fee deduction
function calculateFee(
    address sender,
    uint256 amount,
    bytes32 corridorId
) external view returns (uint256 fee, uint256 netAmount);

/// @notice Sets the base fee rate (in basis points)
function setBaseFeeRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE);

/// @notice Sets a corridor-specific fee override
function setCorridorFee(bytes32 corridorId, uint256 feeRate) external onlyRole(DEFAULT_ADMIN_ROLE);

/// @notice Configures volume-based fee tiers
function setFeeTiers(FeeTier[] calldata tiers) external onlyRole(DEFAULT_ADMIN_ROLE);
```

---

## Compliance Contracts

### `AMLModule.sol`

**Purpose**: Real-time on-chain AML transaction screening and wallet cluster management.

See [AML_MODULE.md](AML_MODULE.md) for full documentation.

#### Key Functions

```solidity
/// @notice Screens a transaction for AML compliance
function screenTransaction(
    address sender,
    address recipient,
    uint256 amount,
    bytes32 corridorId
) external returns (uint8 riskScore, bool flagged);

/// @notice Flags a cluster of wallets as suspicious
function flagWalletCluster(
    address[] calldata wallets,
    bytes32 reason
) external onlyRole(AML_OFFICER_ROLE);

/// @notice Gets the risk score for a wallet
function getWalletRiskScore(address wallet) external view returns (uint8);

/// @notice Adds wallets to an existing cluster
function addToCluster(
    address[] calldata wallets,
    uint256 clusterId
) external onlyRole(AML_OFFICER_ROLE);

/// @notice Gets all wallets in a cluster
function getClusterMembers(uint256 clusterId) external view returns (address[] memory);
```

---

### `SanctionsList.sol`

**Purpose**: On-chain sanctions blocklist with oracle update capability.

```solidity
/// @notice Checks if an address is sanctioned
function isSanctioned(address account) external view returns (bool);

/// @notice Batch-updates the sanctions list
function updateSanctionsList(
    address[] calldata toAdd,
    address[] calldata toRemove
) external onlyRole(SANCTIONS_ADMIN_ROLE);
```

---

### `RateLimiter.sol`

**Purpose**: Per-wallet and per-corridor transfer rate limiting.

```solidity
struct RateLimit {
    uint256 maxAmount;        // Max transfer amount per window
    uint256 maxCount;         // Max number of transfers per window
    uint256 windowDuration;   // Time window in seconds
    uint256 cooldownPeriod;   // Cooldown between transfers
}

/// @notice Checks if a transfer is within rate limits
function checkRateLimit(
    address sender,
    uint256 amount,
    bytes32 corridorId
) external returns (bool allowed);

/// @notice Records a transfer for rate limiting tracking
function recordTransfer(
    address sender,
    uint256 amount,
    bytes32 corridorId
) external onlyRole(ROUTER_ROLE);

/// @notice Configures rate limits for a corridor
function setCorridorRateLimit(
    bytes32 corridorId,
    RateLimit calldata limit
) external onlyRole(DEFAULT_ADMIN_ROLE);
```

---

## Governance Contracts

### `CorridorRegistry.sol`

**Purpose**: Manages remittance corridor configurations.

```solidity
struct Corridor {
    bytes32 id;                  // keccak256("US-IN") for US→India
    string sourceCountry;        // ISO 3166-1 alpha-2
    string destCountry;
    bool active;
    uint256 minAmount;           // Minimum transfer (USDC, 6 decimals)
    uint256 maxAmount;           // Maximum transfer
    uint256 dailyLimit;          // Daily aggregate limit per corridor
    uint256 reportingThreshold;  // AML reporting threshold
    uint256 expiryDuration;      // Transfer expiry in seconds
}

/// @notice Registers a new corridor
function registerCorridor(Corridor calldata corridor) external onlyRole(DEFAULT_ADMIN_ROLE);

/// @notice Updates corridor configuration
function updateCorridor(bytes32 corridorId, Corridor calldata corridor) external onlyRole(DEFAULT_ADMIN_ROLE);

/// @notice Deactivates a corridor
function deactivateCorridor(bytes32 corridorId) external onlyRole(DEFAULT_ADMIN_ROLE);

/// @notice Gets corridor configuration
function getCorridor(bytes32 corridorId) external view returns (Corridor memory);

/// @notice Gets all active corridors
function getActiveCorridors() external view returns (Corridor[] memory);
```

---

### `EmergencyGuardian.sol`

**Purpose**: Circuit breaker with multi-sig controlled emergency shutdown.

```solidity
/// @notice Emergency pause - halts all protocol operations
function emergencyPause() external onlyRole(GUARDIAN_ROLE);

/// @notice Unpause - requires timelock delay
function unpause() external onlyRole(GUARDIAN_ROLE);

/// @notice Sets the unpause timelock duration
function setUnpauseDelay(uint256 delay) external onlyRole(DEFAULT_ADMIN_ROLE);
```

---

## Libraries

### `TransferLib.sol`

Utility functions for transfer data encoding/decoding and ID generation.

```solidity
library TransferLib {
    /// @notice Generates a unique transfer ID
    function generateTransferId(
        address sender,
        address recipient,
        uint256 amount,
        uint256 nonce,
        uint256 timestamp
    ) internal pure returns (bytes32);

    /// @notice Encodes transfer metadata
    function encodeMetadata(
        string memory reference,
        string memory purpose
    ) internal pure returns (bytes memory);
}
```

### `AMLScoring.sol`

Risk scoring calculation algorithms.

```solidity
library AMLScoring {
    /// @notice Calculates velocity score based on transaction history
    function calculateVelocityScore(
        uint256 txCount,
        uint256 totalVolume,
        uint256 timeWindow
    ) internal pure returns (uint8);

    /// @notice Calculates cluster association risk
    function calculateClusterScore(
        uint8 clusterRiskLevel,
        uint256 clusterSize
    ) internal pure returns (uint8);

    /// @notice Combines individual scores into aggregate risk
    function aggregateScore(
        uint8 sanctionsScore,
        uint8 velocityScore,
        uint8 clusterScore,
        uint8 amountScore
    ) internal pure returns (uint8);
}
```

### `CorridorLib.sol`

Corridor utility functions.

```solidity
library CorridorLib {
    /// @notice Creates a corridor ID from country codes
    function corridorId(
        string memory source,
        string memory dest
    ) internal pure returns (bytes32);

    /// @notice Validates corridor configuration
    function validate(Corridor memory corridor) internal pure returns (bool);
}
```

---

## Events

### RemittanceRouter Events

```solidity
event TransferInitiated(
    bytes32 indexed transferId,
    address indexed sender,
    address indexed recipient,
    uint256 amount,
    uint256 fee,
    bytes32 corridorId,
    uint8 riskScore
);

event TransferCompleted(
    bytes32 indexed transferId,
    address indexed recipient,
    uint256 netAmount,
    uint256 completedAt
);

event TransferCancelled(bytes32 indexed transferId, address indexed sender);
event TransferFlagged(bytes32 indexed transferId, uint8 riskScore, bytes32 reason);
event TransferRejected(bytes32 indexed transferId, bytes32 reason);
event TransferRefunded(bytes32 indexed transferId, address indexed sender, uint256 amount);
event TransferExpired(bytes32 indexed transferId);
```

### Escrow Events

```solidity
event FundsDeposited(bytes32 indexed transferId, uint256 amount);
event FundsReleased(bytes32 indexed transferId, address indexed beneficiary, uint256 amount);
event FundsRefunded(bytes32 indexed transferId, address indexed depositor, uint256 amount);
event SignersUpdated(address[] signers, uint256 threshold);
```

### AML Events

```solidity
event TransactionScreened(bytes32 indexed transferId, uint8 riskScore, bool flagged);
event WalletClusterFlagged(uint256 indexed clusterId, address[] wallets, bytes32 reason);
event WalletAddedToCluster(address indexed wallet, uint256 indexed clusterId);
event SanctionsListUpdated(uint256 addedCount, uint256 removedCount);
```

---

## Error Codes

```solidity
// RemittanceRouter errors
error InvalidRecipient();              // Recipient is zero address
error InvalidAmount();                 // Amount is zero or below minimum
error InvalidCorridor();               // Corridor not active
error TransferNotFound();              // Transfer ID doesn't exist
error InvalidTransferStatus();         // Wrong status for this operation
error UnauthorizedCaller();            // Caller not authorized
error TransferNotExpired();            // Cannot refund before expiry
error InsufficientAllowance();         // USDC allowance too low

// Escrow errors
error InsufficientSignatures();        // Below threshold
error InvalidSignature();              // Signature recovery failed
error DuplicateSigner();               // Same signer signed twice
error EscrowNotDeposited();            // No funds in escrow
error RefundTimelockActive();          // Refund timelock not expired

// AML errors
error SanctionedAddress();             // Address is on sanctions list
error RateLimitExceeded();             // Transfer rate limit hit
error AmountExceedsCorridorLimit();    // Above corridor max amount

// Fee errors
error FeeExceedsMax();                 // Calculated fee above 5% cap
```

---

## Storage Layout

> Important for future proxy upgrades. Storage slots must be preserved.

### RemittanceRouter Storage

| Slot | Variable | Type |
|------|----------|------|
| 0 | `escrow` | `address` |
| 1 | `feeController` | `address` |
| 2 | `amlModule` | `address` |
| 3 | `corridorRegistry` | `address` |
| 4 | `rateLimiter` | `address` |
| 5 | `transferCount` | `uint256` |
| 6 | `transfers` | `mapping(bytes32 => Transfer)` |
| 7 | `userTransfers` | `mapping(address => bytes32[])` |

### MultiSigEscrow Storage

| Slot | Variable | Type |
|------|----------|------|
| 0 | `signers` | `address[]` |
| 1 | `threshold` | `uint256` |
| 2 | `refundTimelock` | `uint256` |
| 3 | `deposits` | `mapping(bytes32 => EscrowDeposit)` |
| 4 | `usedNonces` | `mapping(bytes32 => bool)` |

*Note: Immutable variables (`usdc`) are stored in the contract bytecode, not in storage slots.*

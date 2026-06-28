# API Reference — RupeeFlow Smart Contracts

> Complete API reference for all public and external functions across RupeeFlow smart contracts.

---

## Table of Contents

- [RemittanceRouter](#remittancerouter)
- [MultiSigEscrow](#multisigescerow)
- [FeeController](#feecontroller)
- [AMLModule](#amlmodule)
- [SanctionsList](#sanctionslist)
- [RateLimiter](#ratelimiter)
- [CorridorRegistry](#corridorregistry)
- [EmergencyGuardian](#emergencyguardian)

---

## RemittanceRouter

> Main entry point for all remittance operations.

### Write Functions

#### `initiateTransfer`

Initiates a new cross-border remittance transfer.

```solidity
function initiateTransfer(
    address recipient,
    uint256 amount,
    bytes32 corridorId,
    bytes calldata metadata
) external nonReentrant whenNotPaused returns (bytes32 transferId)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `recipient` | `address` | Recipient wallet address |
| `amount` | `uint256` | Gross USDC amount (6 decimals, e.g., `1000000` = 1 USDC) |
| `corridorId` | `bytes32` | Corridor identifier (e.g., `keccak256("US-IN")`) |
| `metadata` | `bytes` | Arbitrary encoded metadata |

**Returns**: `transferId` — Unique identifier for the transfer.

**Requirements**:
- `recipient != address(0)`
- `amount >= corridor.minAmount`
- `amount <= corridor.maxAmount`
- Corridor must be active
- Sender must have approved Router for `amount` USDC
- AML screening must pass (not sanctioned)
- Rate limit must not be exceeded

**Events**: `TransferInitiated(transferId, sender, recipient, amount, fee, corridorId, riskScore)`

---

#### `completeTransfer`

Completes a transfer by releasing escrowed funds to the recipient.

```solidity
function completeTransfer(
    bytes32 transferId,
    bytes[] calldata signatures
) external nonReentrant whenNotPaused
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `transferId` | `bytes32` | The transfer to complete |
| `signatures` | `bytes[]` | Multi-sig EIP-712 signatures authorizing release |

**Requirements**:
- Transfer status must be `INITIATED` or `FLAGGED` (manually approved)
- Signatures must meet escrow threshold (M-of-N)
- Caller must have `OPERATOR_ROLE`

**Events**: `TransferCompleted(transferId, recipient, netAmount, completedAt)`

---

#### `cancelTransfer`

Cancels a pending transfer (sender only).

```solidity
function cancelTransfer(bytes32 transferId) external nonReentrant
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `transferId` | `bytes32` | The transfer to cancel |

**Requirements**:
- `msg.sender` must be the transfer sender
- Transfer status must be `INITIATED`

**Events**: `TransferCancelled(transferId, sender)`

---

#### `claimRefund`

Claims a refund for a cancelled, rejected, or expired transfer.

```solidity
function claimRefund(bytes32 transferId) external nonReentrant
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `transferId` | `bytes32` | The transfer to refund |

**Requirements**:
- Transfer status must be `CANCELLED`, `REJECTED`, or expired (`block.timestamp > expiresAt`)
- Refund timelock must have elapsed (for cancellations)

**Events**: `TransferRefunded(transferId, sender, amount)`

---

#### `rejectTransfer`

Rejects a flagged transfer after AML review (operator only).

```solidity
function rejectTransfer(
    bytes32 transferId,
    bytes32 reason
) external onlyRole(OPERATOR_ROLE)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `transferId` | `bytes32` | The flagged transfer to reject |
| `reason` | `bytes32` | Encoded rejection reason |

**Requirements**:
- Transfer status must be `FLAGGED`
- Caller must have `OPERATOR_ROLE`

**Events**: `TransferRejected(transferId, reason)`

---

### Read Functions

#### `getTransfer`

```solidity
function getTransfer(bytes32 transferId) external view returns (Transfer memory)
```

Returns the full `Transfer` struct for a given transfer ID.

---

#### `getUserTransfers`

```solidity
function getUserTransfers(address user) external view returns (bytes32[] memory)
```

Returns all transfer IDs associated with a user address.

---

#### `transferCount`

```solidity
function transferCount() external view returns (uint256)
```

Returns the total number of transfers created.

---

## MultiSigEscrow

> Trustless USDC custody with multi-signature release.

### Write Functions

#### `deposit`

```solidity
function deposit(
    bytes32 transferId,
    address depositor,
    address beneficiary,
    uint256 amount,
    uint256 expiresAt
) external onlyRole(ROUTER_ROLE) nonReentrant
```

Deposits USDC into escrow. Only callable by the RemittanceRouter.

---

#### `release`

```solidity
function release(
    bytes32 transferId,
    bytes[] calldata signatures
) external nonReentrant
```

Releases escrowed USDC to the beneficiary with multi-sig authorization.

**Requirements**:
- `signatures.length >= threshold`
- All signatures must recover to valid signers
- No duplicate signers

---

#### `refund`

```solidity
function refund(bytes32 transferId) external onlyRole(ROUTER_ROLE) nonReentrant
```

Refunds escrowed USDC to the original depositor. Only callable by Router.

---

#### `updateSigners`

```solidity
function updateSigners(
    address[] calldata newSigners,
    uint256 newThreshold
) external onlyRole(DEFAULT_ADMIN_ROLE)
```

Updates the signer set and threshold. `newThreshold <= newSigners.length`.

---

### Read Functions

#### `deposits`

```solidity
function deposits(bytes32 transferId) external view returns (EscrowDeposit memory)
```

---

#### `signers`

```solidity
function signers(uint256 index) external view returns (address)
```

---

#### `threshold`

```solidity
function threshold() external view returns (uint256)
```

---

## FeeController

> Dynamic fee calculation engine.

### Write Functions

#### `setBaseFeeRate`

```solidity
function setBaseFeeRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE)
```

Sets the base fee rate in basis points (e.g., `30` = 0.30%). Max: 500 (5%).

---

#### `setCorridorFee`

```solidity
function setCorridorFee(bytes32 corridorId, uint256 feeRate) external onlyRole(DEFAULT_ADMIN_ROLE)
```

Sets a corridor-specific fee override. Set to `0` to remove override.

---

#### `setFeeTiers`

```solidity
function setFeeTiers(FeeTier[] calldata tiers) external onlyRole(DEFAULT_ADMIN_ROLE)
```

Configures volume-based discount tiers. Tiers must be sorted by `minVolume` ascending.

---

### Read Functions

#### `calculateFee`

```solidity
function calculateFee(
    address sender,
    uint256 amount,
    bytes32 corridorId
) external view returns (uint256 fee, uint256 netAmount)
```

Calculates the protocol fee and net amount for a transfer.

---

## AMLModule

> On-chain AML compliance and wallet cluster management.

### Write Functions

#### `screenTransaction`

```solidity
function screenTransaction(
    address sender,
    address recipient,
    uint256 amount,
    bytes32 corridorId
) external returns (uint8 riskScore, bool flagged)
```

Screens a transaction through the full AML pipeline. Reverts if either party is sanctioned.

---

#### `flagWalletCluster`

```solidity
function flagWalletCluster(
    address[] calldata wallets,
    bytes32 reason
) external onlyRole(AML_OFFICER_ROLE)
```

Creates a new flagged wallet cluster.

---

#### `addToCluster`

```solidity
function addToCluster(
    address[] calldata wallets,
    uint256 clusterId
) external onlyRole(AML_OFFICER_ROLE)
```

Adds wallets to an existing cluster.

---

### Read Functions

#### `getWalletRiskScore`

```solidity
function getWalletRiskScore(address wallet) external view returns (uint8)
```

Returns the current risk score for a wallet (based on cluster membership and history).

---

#### `getClusterMembers`

```solidity
function getClusterMembers(uint256 clusterId) external view returns (address[] memory)
```

Returns all wallet addresses in a cluster.

---

## SanctionsList

### Write Functions

#### `updateSanctionsList`

```solidity
function updateSanctionsList(
    address[] calldata toAdd,
    address[] calldata toRemove
) external onlyRole(SANCTIONS_ADMIN_ROLE)
```

Batch-updates the sanctions blocklist.

---

### Read Functions

#### `isSanctioned`

```solidity
function isSanctioned(address account) external view returns (bool)
```

---

## RateLimiter

### Write Functions

#### `recordTransfer`

```solidity
function recordTransfer(
    address sender,
    uint256 amount,
    bytes32 corridorId
) external onlyRole(ROUTER_ROLE)
```

Records a transfer for rate limiting tracking.

---

#### `setCorridorRateLimit`

```solidity
function setCorridorRateLimit(
    bytes32 corridorId,
    RateLimit calldata limit
) external onlyRole(DEFAULT_ADMIN_ROLE)
```

---

### Read Functions

#### `checkRateLimit`

```solidity
function checkRateLimit(
    address sender,
    uint256 amount,
    bytes32 corridorId
) external view returns (bool allowed)
```

---

## CorridorRegistry

### Write Functions

#### `registerCorridor`

```solidity
function registerCorridor(Corridor calldata corridor) external onlyRole(DEFAULT_ADMIN_ROLE)
```

---

#### `updateCorridor`

```solidity
function updateCorridor(bytes32 corridorId, Corridor calldata corridor) external onlyRole(DEFAULT_ADMIN_ROLE)
```

---

#### `deactivateCorridor`

```solidity
function deactivateCorridor(bytes32 corridorId) external onlyRole(DEFAULT_ADMIN_ROLE)
```

---

### Read Functions

#### `getCorridor`

```solidity
function getCorridor(bytes32 corridorId) external view returns (Corridor memory)
```

---

#### `getActiveCorridors`

```solidity
function getActiveCorridors() external view returns (Corridor[] memory)
```

---

## EmergencyGuardian

### Write Functions

#### `emergencyPause`

```solidity
function emergencyPause() external onlyRole(GUARDIAN_ROLE)
```

Immediately pauses all protocol operations.

---

#### `unpause`

```solidity
function unpause() external onlyRole(GUARDIAN_ROLE)
```

Unpauses the protocol. Subject to timelock delay.

---

#### `setUnpauseDelay`

```solidity
function setUnpauseDelay(uint256 delay) external onlyRole(DEFAULT_ADMIN_ROLE)
```

Sets the minimum delay between pause and unpause.

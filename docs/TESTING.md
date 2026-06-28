# Testing Strategy — RupeeFlow

> Complete test strategy, coverage targets, and methodology for achieving 95%+ code coverage using Forge and mainnet forking.

---

## Table of Contents

- [Overview](#overview)
- [Test Pyramid](#test-pyramid)
- [Coverage Targets](#coverage-targets)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Fork Tests](#fork-tests)
- [Invariant Tests](#invariant-tests)
- [Gas Benchmarks](#gas-benchmarks)
- [CI/CD Pipeline](#cicd-pipeline)
- [Running Tests](#running-tests)

---

## Overview

RupeeFlow follows a **multi-layered testing strategy** designed to achieve **95%+ code coverage** while ensuring correctness across all protocol interactions. We use **Foundry's Forge** as the testing framework, leveraging:

- **Unit Tests** — Individual function correctness
- **Integration Tests** — Multi-contract interaction flows
- **Fork Tests** — Real CBDC tokens on forked Base mainnet
- **Invariant/Fuzz Tests** — Property-based testing with random inputs

---

## Test Pyramid

```
                    ┌───────────────┐
                    │   Fork Tests  │    ~15 tests
                    │  (Mainnet)    │    Real CBDC, real Base state
                    ├───────────────┤
                    │  Invariant /  │    ~10 tests
                    │  Fuzz Tests   │    Property-based, random inputs
                ┌───┤               ├───┐
                │   ├───────────────┤   │
                │   │  Integration  │   │   ~25 tests
                │   │    Tests      │   │   Multi-contract flows
                │   ├───────────────┤   │
                │   │               │   │
                │   │  Unit Tests   │   │   ~60 tests
                │   │               │   │   Individual functions
                └───┴───────────────┴───┘
                
Total: ~110 tests targeting 95%+ coverage
```

---

## Coverage Targets

| Contract | Target Coverage | Critical Functions |
|----------|----------------|-------------------|
| `RemittanceRouter.sol` | 98% | `initiateTransfer`, `completeTransfer`, `cancelTransfer`, `claimRefund` |
| `MultiSigEscrow.sol` | 98% | `deposit`, `release`, `refund`, signature verification |
| `FeeController.sol` | 95% | `calculateFee`, tier calculations, corridor overrides |
| `AMLModule.sol` | 95% | `screenTransaction`, `flagWalletCluster`, scoring algorithms |
| `RateLimiter.sol` | 95% | `checkRateLimit`, `recordTransfer`, window calculations |
| `CorridorRegistry.sol` | 90% | `registerCorridor`, `updateCorridor`, `deactivateCorridor` |
| `EmergencyGuardian.sol` | 90% | `emergencyPause`, `unpause`, timelock |
| `TransferLib.sol` | 95% | `generateTransferId`, `encodeMetadata` |
| `AMLScoring.sol` | 95% | All scoring functions |
| **Overall** | **95%+** | — |

---

## Unit Tests

### `test/unit/RemittanceRouter.t.sol`

```solidity
// Test: Successful transfer initiation
function test_initiateTransfer_success() public { ... }

// Test: Reverts with zero amount
function test_initiateTransfer_revertsOnZeroAmount() public { ... }

// Test: Reverts with invalid recipient (address(0))
function test_initiateTransfer_revertsOnZeroRecipient() public { ... }

// Test: Reverts with inactive corridor
function test_initiateTransfer_revertsOnInactiveCorridor() public { ... }

// Test: Reverts when paused
function test_initiateTransfer_revertsWhenPaused() public { ... }

// Test: Reverts with insufficient CBDC allowance
function test_initiateTransfer_revertsOnInsufficientAllowance() public { ... }

// Test: Transfer completion with valid multi-sig
function test_completeTransfer_success() public { ... }

// Test: Transfer cancellation by sender
function test_cancelTransfer_success() public { ... }

// Test: Cannot cancel someone else's transfer
function test_cancelTransfer_revertsOnUnauthorized() public { ... }

// Test: Refund after expiry
function test_claimRefund_afterExpiry() public { ... }

// Test: Cannot refund before expiry
function test_claimRefund_revertsBeforeExpiry() public { ... }

// Test: Reject flagged transfer (operator)
function test_rejectTransfer_operatorOnly() public { ... }

// Test: Transfer status transitions
function test_statusTransitions_allPaths() public { ... }

// Test: Event emissions
function test_events_transferInitiated() public { ... }
function test_events_transferCompleted() public { ... }
```

### `test/unit/MultiSigEscrow.t.sol`

```solidity
// Test: Deposit CBDC into escrow
function test_deposit_success() public { ... }

// Test: Release with valid 2-of-3 signatures
function test_release_twoOfThreeSignatures() public { ... }

// Test: Release reverts with insufficient signatures
function test_release_revertsOnInsufficientSignatures() public { ... }

// Test: Release reverts with invalid signature
function test_release_revertsOnInvalidSignature() public { ... }

// Test: Release reverts with duplicate signer
function test_release_revertsOnDuplicateSigner() public { ... }

// Test: Refund after timelock
function test_refund_afterTimelock() public { ... }

// Test: Refund reverts during timelock
function test_refund_revertsDuringTimelock() public { ... }

// Test: Update signers and threshold
function test_updateSigners_success() public { ... }

// Test: EIP-712 domain separator correctness
function test_domainSeparator() public { ... }
```

### `test/unit/FeeController.t.sol`

```solidity
// Test: Base fee calculation
function test_calculateFee_baseFee() public { ... }

// Test: Corridor-specific fee override
function test_calculateFee_corridorOverride() public { ... }

// Test: Volume-based tier discount
function test_calculateFee_tierDiscount() public { ... }

// Test: Fee cap enforcement (max 5%)
function test_calculateFee_feeCapEnforced() public { ... }

// Test: Zero fee for whitelisted corridors
function test_calculateFee_zeroFee() public { ... }

// Fuzz: Fee never exceeds MAX_FEE
function testFuzz_calculateFee_neverExceedsMax(uint256 amount) public { ... }
```

### `test/unit/AMLModule.t.sol`

```solidity
// Test: Clean transaction passes screening
function test_screenTransaction_cleanPass() public { ... }

// Test: Sanctioned address reverts
function test_screenTransaction_sanctionedReverts() public { ... }

// Test: High velocity flags transaction
function test_screenTransaction_highVelocityFlag() public { ... }

// Test: Flagged cluster member gets high score
function test_screenTransaction_flaggedCluster() public { ... }

// Test: Structuring detection
function test_screenTransaction_structuringDetected() public { ... }

// Test: Flag wallet cluster
function test_flagWalletCluster_success() public { ... }

// Test: Add wallets to existing cluster
function test_addToCluster_success() public { ... }

// Test: Risk score aggregation
function test_aggregateScore_weightedCorrectly() public { ... }

// Fuzz: Risk score always 0-100
function testFuzz_riskScore_bounded(uint8 v, uint8 c, uint8 a) public { ... }
```

### `test/unit/RateLimiter.t.sol`

```solidity
// Test: First transfer within limits
function test_checkRateLimit_firstTransferPasses() public { ... }

// Test: Exceeding count limit
function test_checkRateLimit_countLimitExceeded() public { ... }

// Test: Exceeding volume limit
function test_checkRateLimit_volumeLimitExceeded() public { ... }

// Test: Window reset allows new transfers
function test_checkRateLimit_windowReset() public { ... }

// Test: Cooldown enforcement
function test_checkRateLimit_cooldownEnforced() public { ... }
```

---

## Integration Tests

### `test/integration/TransferLifecycle.t.sol`

End-to-end transfer lifecycle simulations:

```solidity
// Test: Full happy path — initiate → complete
function test_lifecycle_initiateAndComplete() public { ... }

// Test: Cancel and refund flow
function test_lifecycle_cancelAndRefund() public { ... }

// Test: AML flag → operator review → approve
function test_lifecycle_flagReviewApprove() public { ... }

// Test: AML flag → operator review → reject → refund
function test_lifecycle_flagReviewRejectRefund() public { ... }

// Test: Transfer expiry → automatic refund eligibility
function test_lifecycle_expiryRefund() public { ... }

// Test: Multiple concurrent transfers by same sender
function test_lifecycle_concurrentTransfers() public { ... }

// Test: Transfer with fee calculation and escrow
function test_lifecycle_feeCalculationAccuracy() public { ... }
```

### `test/integration/AMLIntegration.t.sol`

```solidity
// Test: AML + rate limiter combined enforcement
function test_amlRateLimiter_combined() public { ... }

// Test: Flagged cluster member blocked across corridors
function test_amlCluster_crossCorridorBlocking() public { ... }

// Test: Structuring detection across multiple transfers
function test_amlStructuring_multiTransfer() public { ... }
```

### `test/integration/EscrowMultiSig.t.sol`

```solidity
// Test: 2-of-3 signing workflow
function test_multisig_twoOfThree() public { ... }

// Test: 3-of-5 signing workflow
function test_multisig_threeOfFive() public { ... }

// Test: Signer rotation mid-lifecycle
function test_multisig_signerRotation() public { ... }

// Test: Cross-transfer signature isolation
function test_multisig_signatureIsolation() public { ... }
```

---

## Fork Tests

Fork tests run against a **live fork of Base mainnet** to validate real CBDC token interactions.

### `test/fork/BaseFork.t.sol`

```solidity
// Base class for all fork tests
abstract contract BaseForkTest is Test {
    uint256 baseFork;

    function setUp() public virtual {
        // Fork Base mainnet at latest block
        baseFork = vm.createFork(vm.envString("BASE_RPC_URL"));
        vm.selectFork(baseFork);

        // CBDC token on Base
        usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    }

    /// @dev Deal CBDC to an address using storage manipulation
    function _dealCBDC(address to, uint256 amount) internal {
        deal(address(usdc), to, amount);
    }
}
```

### `test/fork/CBDCFork.t.sol`

```solidity
// Test: Real CBDC transfer through escrow on forked Base
function test_fork_realCBDCTransfer() public {
    // 1. Deal CBDC to sender
    _dealCBDC(sender, 1000e6); // 1000 CBDC tokens

    // 2. Approve Router
    vm.prank(sender);
    usdc.approve(address(router), 1000e6);

    // 3. Initiate transfer
    vm.prank(sender);
    bytes32 txId = router.initiateTransfer(
        recipient, 1000e6, corridorId, ""
    );

    // 4. Verify escrow holds CBDC
    assertEq(usdc.balanceOf(address(escrow)), netAmount);

    // 5. Complete with multi-sig
    bytes[] memory sigs = _signRelease(txId, recipient, netAmount);
    router.completeTransfer(txId, sigs);

    // 6. Verify recipient received CBDC
    assertEq(usdc.balanceOf(recipient), netAmount);
}

// Test: CBDC approval edge cases on forked state
function test_fork_usdcApprovalEdgeCases() public { ... }

// Test: Large transfer on forked Base
function test_fork_largeTransfer() public { ... }

// Test: Multiple transfers consuming real CBDC on fork
function test_fork_multipleTransfers() public { ... }

// Test: Gas consumption on actual Base fork
function test_fork_gasConsumption() public { ... }
```

---

## Invariant Tests

Stateful fuzz tests that verify protocol invariants hold across random transaction sequences.

### `test/invariant/EscrowInvariant.t.sol`

```solidity
/// @notice Invariant: Escrow CBDC balance >= sum of all active deposits
function invariant_escrowBalanceCoversDeposits() public {
    uint256 totalDeposited = escrowHandler.ghost_totalDeposited()
                           - escrowHandler.ghost_totalReleased()
                           - escrowHandler.ghost_totalRefunded();
    assertGe(usdc.balanceOf(address(escrow)), totalDeposited);
}

/// @notice Invariant: No deposit can be released AND refunded
function invariant_noDoubleSpend() public {
    // For each transfer, status is never both RELEASED and REFUNDED
    for (uint256 i = 0; i < escrowHandler.ghost_transferCount(); i++) {
        bytes32 txId = escrowHandler.ghost_transferAt(i);
        EscrowStatus status = escrow.deposits(txId).status;
        assertTrue(
            status != EscrowStatus.RELEASED || status != EscrowStatus.REFUNDED
        );
    }
}

/// @notice Invariant: Total released + total refunded <= total deposited
function invariant_conservationOfFunds() public {
    assertLe(
        escrowHandler.ghost_totalReleased() + escrowHandler.ghost_totalRefunded(),
        escrowHandler.ghost_totalDeposited()
    );
}
```

### `test/invariant/AMLInvariant.t.sol`

```solidity
/// @notice Invariant: Risk scores are always in [0, 100]
function invariant_riskScoreBounded() public {
    for (uint256 i = 0; i < amlHandler.ghost_screenedCount(); i++) {
        uint8 score = amlHandler.ghost_scoreAt(i);
        assertLe(score, 100);
    }
}

/// @notice Invariant: Sanctioned addresses never pass screening
function invariant_sanctionedNeverPass() public {
    // Verified by the handler: any screenTransaction with a sanctioned
    // address must revert
}

/// @notice Invariant: Cluster membership is consistent
function invariant_clusterConsistency() public {
    // Every wallet in clusterMap points to a valid cluster
}
```

---

## Gas Benchmarks

```bash
# Run gas benchmarks
forge test --gas-report

# Expected output:
# ┌──────────────────────┬─────────────┬────────┬────────┬────────┐
# │ Function             │ Min         │ Avg    │ Median │ Max    │
# ├──────────────────────┼─────────────┼────────┼────────┼────────┤
# │ initiateTransfer     │ 105,234     │120,456 │118,332 │145,678 │
# │ completeTransfer     │  72,345     │ 85,234 │ 83,456 │ 98,765 │
# │ cancelTransfer       │  52,123     │ 65,234 │ 63,456 │ 78,901 │
# │ claimRefund          │  45,678     │ 55,234 │ 53,456 │ 68,901 │
# │ screenTransaction    │  35,678     │ 42,345 │ 40,234 │ 55,678 │
# │ deposit              │  65,234     │ 72,345 │ 70,456 │ 85,678 │
# │ release              │  78,901     │ 88,234 │ 86,456 │ 98,765 │
# │ refund               │  45,678     │ 52,345 │ 50,456 │ 62,345 │
# └──────────────────────┴─────────────┴────────┴────────┴────────┘
```

---

## CI/CD Pipeline

### `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  FOUNDRY_PROFILE: ci
  BASE_RPC_URL: ${{ secrets.BASE_RPC_URL }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
        with:
          version: nightly

      - name: Build
        working-directory: contracts
        run: forge build --sizes

      - name: Unit Tests
        working-directory: contracts
        run: forge test --match-path "test/unit/*" -vvv

      - name: Integration Tests
        working-directory: contracts
        run: forge test --match-path "test/integration/*" -vvv

      - name: Fork Tests
        working-directory: contracts
        run: forge test --match-path "test/fork/*" -vvv --fork-url $BASE_RPC_URL

      - name: Invariant Tests
        working-directory: contracts
        run: forge test --match-path "test/invariant/*" -vvv

      - name: Coverage
        working-directory: contracts
        run: |
          forge coverage --report lcov
          # Fail if coverage < 95%

      - name: Gas Report
        working-directory: contracts
        run: forge test --gas-report
```

---

## Running Tests

```bash
cd contracts

# Run all tests
forge test

# Verbose output
forge test -vvvv

# Run specific test file
forge test --match-path test/unit/RemittanceRouter.t.sol

# Run specific test function
forge test --match-test test_initiateTransfer_success

# Run with gas report
forge test --gas-report

# Run coverage
forge coverage

# Run coverage with lcov output
forge coverage --report lcov

# Run fork tests only
forge test --match-path "test/fork/*" --fork-url $BASE_RPC_URL

# Run with specific block (reproducible)
forge test --match-path "test/fork/*" --fork-url $BASE_RPC_URL --fork-block-number 12345678

# Run invariant tests with more runs
forge test --match-path "test/invariant/*" -vvv
```

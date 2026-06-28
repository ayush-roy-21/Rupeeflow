# AML Compliance Module — RupeeFlow

> Detailed documentation of the on-chain Anti-Money Laundering (AML) module, including risk scoring algorithms, wallet cluster detection, and compliance architecture.

---

## Table of Contents

- [Overview](#overview)
- [Compliance Architecture](#compliance-architecture)
- [Transaction Screening Pipeline](#transaction-screening-pipeline)
- [Risk Scoring Algorithm](#risk-scoring-algorithm)
- [Wallet Cluster Detection](#wallet-cluster-detection)
- [Sanctions Integration](#sanctions-integration)
- [Structuring Detection](#structuring-detection)
- [Compliance Events & Reporting](#compliance-events--reporting)
- [Configuration Parameters](#configuration-parameters)
- [Regulatory Considerations](#regulatory-considerations)

---

## Overview

The RupeeFlow AML Module is an **on-chain compliance engine** that screens every transaction in real-time before funds enter escrow. It combines four detection mechanisms:

1. **Sanctions Screening** — Blocklist check against known sanctioned addresses
2. **Velocity Analysis** — Transaction frequency and volume pattern detection
3. **Wallet Clustering** — Graph-based suspicious wallet group identification
4. **Structuring Detection** — Split-transaction pattern recognition

The module produces a **risk score (0–100)** for each transaction and automatically flags high-risk transfers for manual review.

---

## Compliance Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      AML Compliance Stack                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                 SCREENING LAYER (on-chain)                   │  │
│  │                                                              │  │
│  │  RemittanceRouter.initiateTransfer()                         │  │
│  │         │                                                    │  │
│  │         ▼                                                    │  │
│  │  AMLModule.screenTransaction()                               │  │
│  │         │                                                    │  │
│  │    ┌────┼────────┬─────────────┬──────────────┐              │  │
│  │    ▼    ▼        ▼             ▼              ▼              │  │
│  │  Sanctions  Velocity     Cluster         Structuring         │  │
│  │  Check      Analysis     Check           Detection           │  │
│  │    │          │            │                │                 │  │
│  │    └──────────┴────────────┴────────────────┘                │  │
│  │                     │                                        │  │
│  │                     ▼                                        │  │
│  │              Aggregate Risk Score (0-100)                    │  │
│  │                     │                                        │  │
│  │              ┌──────┴──────┐                                 │  │
│  │              │   < 30      │──── PASS (auto-approve)         │  │
│  │              │   30-70     │──── REVIEW (manual)             │  │
│  │              │   > 70      │──── FLAG (auto-flag)            │  │
│  │              │   = 100     │──── BLOCK (sanctioned)          │  │
│  │              └─────────────┘                                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              MANAGEMENT LAYER (admin-controlled)             │  │
│  │                                                              │  │
│  │  • AML Officer: Flag clusters, update thresholds             │  │
│  │  • Sanctions Admin: Update blocklist                         │  │
│  │  • Operator: Review flagged transfers, approve/reject        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              ORACLE LAYER (future, off-chain feeds)          │  │
│  │                                                              │  │
│  │  • Chainalysis Sanctions Oracle                              │  │
│  │  • TRM Labs risk feeds                                       │  │
│  │  • Elliptic transaction scoring                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Transaction Screening Pipeline

Every call to `initiateTransfer()` triggers the following pipeline:

### Step 1: Sanctions Check
```solidity
// Immediate block if either party is sanctioned
if (sanctionsList.isSanctioned(sender) || sanctionsList.isSanctioned(recipient)) {
    revert SanctionedAddress();
}
```
- **Result**: Binary pass/block
- **Sanctioned = instant revert** (transaction never proceeds)

### Step 2: Velocity Score
```solidity
// Calculate transaction velocity over sliding windows
uint8 velocityScore = AMLScoring.calculateVelocityScore(
    _getTransactionCount(sender, WINDOW_24H),
    _getTransactionVolume(sender, WINDOW_24H),
    WINDOW_24H
);
```
- Tracks per-wallet transaction count and volume over 24h and 7d windows
- Higher frequency/volume = higher score
- Uses exponential decay: recent transactions weighted more heavily

### Step 3: Cluster Check
```solidity
// Check if sender or recipient belongs to a flagged cluster
uint256 senderCluster = clusterMap[sender];
uint256 recipientCluster = clusterMap[recipient];
uint8 clusterScore = 0;

if (senderCluster != 0 && flaggedClusters[senderCluster]) {
    clusterScore = clusterRisk[senderCluster];
}
if (recipientCluster != 0 && flaggedClusters[recipientCluster]) {
    clusterScore = max(clusterScore, clusterRisk[recipientCluster]);
}
```
- Wallets are grouped into clusters by AML officers
- Each cluster has a risk level (0–100)
- Association with a flagged cluster raises the score

### Step 4: Structuring Detection
```solidity
// Detect potential structuring (splitting transactions to avoid thresholds)
uint8 amountScore = _detectStructuring(
    sender,
    amount,
    corridorRegistry.getCorridor(corridorId).reportingThreshold
);
```
- Checks if sender's recent transfers aggregate near reporting thresholds
- Pattern: Multiple transfers just below the threshold in a short window
- Configurable per corridor based on regulatory requirements

### Step 5: Aggregate & Decide
```solidity
uint8 totalScore = AMLScoring.aggregateScore(
    sanctionsScore,    // 0 (passed) — sanctioned addresses already reverted
    velocityScore,
    clusterScore,
    amountScore
);

bool flagged = totalScore >= flagThreshold;
```

---

## Risk Scoring Algorithm

### Score Components

| Component | Weight | Range | Description |
|-----------|--------|-------|-------------|
| Sanctions | 0.40 | 0 or 100 | Binary — sanctioned addresses are blocked outright |
| Velocity | 0.25 | 0–100 | Transaction frequency and volume over time windows |
| Cluster | 0.25 | 0–100 | Association with flagged wallet clusters |
| Amount | 0.10 | 0–100 | Proximity to reporting thresholds + structuring patterns |

### Velocity Scoring Formula

```
VelocityScore = min(100, (txCount_24h / maxTx_24h) × 50 + (volume_24h / maxVol_24h) × 50)

Where:
  txCount_24h   = Number of transfers in last 24 hours
  maxTx_24h     = Corridor-specific maximum expected transactions (default: 10)
  volume_24h    = Total CBDC volume in last 24 hours  
  maxVol_24h    = Corridor-specific maximum expected volume (default: $50,000)
```

### Aggregate Formula

```
AggregateScore = w_sanctions × SanctionsScore
               + w_velocity  × VelocityScore
               + w_cluster   × ClusterScore  
               + w_amount    × AmountScore

// With configurable weights (default shown above)
```

### Decision Thresholds

| Score Range | Decision | Action |
|-------------|----------|--------|
| 0–29 | **PASS** | Auto-approved, transfer proceeds to escrow |
| 30–69 | **REVIEW** | Transfer proceeds but marked for manual review |
| 70–99 | **FLAG** | Transfer status set to FLAGGED, funds held, operator notified |
| 100 | **BLOCK** | Transaction reverts (sanctions hit) |

---

## Wallet Cluster Detection

### Concept

Wallet clusters represent groups of addresses controlled by or associated with the same entity. The AML module maintains an on-chain cluster registry:

```
Cluster #42 (Risk Level: 85, FLAGGED)
├── 0xA1b2...C3d4  (flagged origin)
├── 0xE5f6...G7h8  (transaction counterparty)
├── 0xI9j0...K1l2  (shared funding source)
└── 0xM3n4...O5p6  (common withdrawal destination)
```

### Cluster Management

```solidity
// Flag a new cluster of suspicious wallets
function flagWalletCluster(
    address[] calldata wallets,
    bytes32 reason          // e.g., keccak256("SMURFING"), keccak256("MIXING")
) external onlyRole(AML_OFFICER_ROLE) {
    uint256 clusterId = nextClusterId++;
    for (uint256 i = 0; i < wallets.length; i++) {
        clusterMap[wallets[i]] = clusterId;
    }
    flaggedClusters[clusterId] = true;
    clusterRisk[clusterId] = 85; // Default high risk for flagged clusters
    emit WalletClusterFlagged(clusterId, wallets, reason);
}

// Add wallets to an existing cluster
function addToCluster(
    address[] calldata wallets,
    uint256 clusterId
) external onlyRole(AML_OFFICER_ROLE) {
    require(clusterId < nextClusterId, "Invalid cluster");
    for (uint256 i = 0; i < wallets.length; i++) {
        clusterMap[wallets[i]] = clusterId;
        emit WalletAddedToCluster(wallets[i], clusterId);
    }
}
```

### Cluster Heuristics

Clusters are identified through off-chain analysis and registered on-chain. Common heuristics:

| Heuristic | Description |
|-----------|-------------|
| **Common Funding** | Multiple wallets funded from the same source |
| **Round-Robin** | Wallets that cyclically transfer to each other |
| **Timing Correlation** | Wallets that transact within narrow time windows |
| **Deposit Splitting** | Funds split into equal amounts across wallets |
| **Shared Withdrawal** | Multiple wallets withdrawing to the same destination |

---

## Sanctions Integration

### Current Implementation (v1)

The `SanctionsList.sol` contract maintains an on-chain blocklist updated by the `SANCTIONS_ADMIN_ROLE`:

```solidity
mapping(address => bool) private _sanctioned;

function isSanctioned(address account) external view returns (bool) {
    return _sanctioned[account];
}

function updateSanctionsList(
    address[] calldata toAdd,
    address[] calldata toRemove
) external onlyRole(SANCTIONS_ADMIN_ROLE) {
    for (uint256 i = 0; i < toAdd.length; i++) {
        _sanctioned[toAdd[i]] = true;
    }
    for (uint256 i = 0; i < toRemove.length; i++) {
        _sanctioned[toRemove[i]] = false;
    }
    emit SanctionsListUpdated(toAdd.length, toRemove.length);
}
```

### Planned Enhancement (v2)

Integration with **Chainalysis Sanctions Oracle** for real-time, automatically-updated sanctions screening:

```solidity
// v2: Oracle-based sanctions check
interface IChainalysisSanctionsOracle {
    function isSanctioned(address addr) external view returns (bool);
}

IChainalysisSanctionsOracle public sanctionsOracle;
```

---

## Structuring Detection

### What is Structuring?

Structuring (also called "smurfing") is the practice of breaking large transactions into smaller ones to avoid regulatory reporting thresholds. For example:

- **Reporting threshold**: $10,000
- **Structuring pattern**: Five transfers of $1,990 within 48 hours

### Detection Algorithm

```solidity
function _detectStructuring(
    address sender,
    uint256 amount,
    uint256 reportingThreshold
) internal view returns (uint8 score) {
    // Get recent transfers by this sender
    uint256 recentVolume = _getTransactionVolume(sender, WINDOW_48H);
    uint256 recentCount = _getTransactionCount(sender, WINDOW_48H);

    // Check if cumulative volume approaches threshold
    uint256 cumulativeWithCurrent = recentVolume + amount;

    if (recentCount >= 3 && cumulativeWithCurrent >= reportingThreshold * 80 / 100) {
        // Multiple small transfers aggregating near threshold
        score = uint8((cumulativeWithCurrent * 100) / reportingThreshold);
        if (score > 100) score = 100;

        // Bonus score if individual amounts are suspiciously uniform
        if (_isUniformAmountPattern(sender, WINDOW_48H)) {
            score = uint8(min(100, score + 20));
        }
    }
}
```

---

## Compliance Events & Reporting

### Events Emitted

```solidity
// Every transaction screening
event TransactionScreened(
    bytes32 indexed transferId,
    address indexed sender,
    address indexed recipient,
    uint256 amount,
    uint8 riskScore,
    bool flagged
);

// Wallet cluster operations
event WalletClusterFlagged(uint256 indexed clusterId, address[] wallets, bytes32 reason);
event WalletAddedToCluster(address indexed wallet, uint256 indexed clusterId);
event ClusterRiskUpdated(uint256 indexed clusterId, uint8 oldRisk, uint8 newRisk);

// Sanctions list changes
event SanctionsListUpdated(uint256 addedCount, uint256 removedCount);

// Transfer disposition
event TransferFlagged(bytes32 indexed transferId, uint8 riskScore, bytes32 reason);
event TransferRejected(bytes32 indexed transferId, bytes32 reason);
event TransferManuallyApproved(bytes32 indexed transferId, address approvedBy);
```

### Off-Chain Compliance Reporting

Events can be indexed by off-chain systems (TheGraph subgraph, custom indexer) to generate:

- **Suspicious Activity Reports (SARs)** — Automated from flagged transfers
- **Currency Transaction Reports (CTRs)** — Triggered by threshold amounts
- **Compliance Dashboards** — Real-time monitoring for compliance teams
- **Audit Trails** — Complete transaction and screening history

---

## Configuration Parameters

All parameters are configurable by the `DEFAULT_ADMIN_ROLE`:

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `flagThreshold` | 70 | 1–100 | Score above which transfers are auto-flagged |
| `reviewThreshold` | 30 | 1–100 | Score above which transfers need manual review |
| `velocityWeight` | 25 | 0–100 | Weight of velocity score in aggregate |
| `clusterWeight` | 25 | 0–100 | Weight of cluster score in aggregate |
| `amountWeight` | 10 | 0–100 | Weight of amount score in aggregate |
| `sanctionsWeight` | 40 | 0–100 | Weight of sanctions score in aggregate |
| `maxTx24h` | 10 | 1–1000 | Maximum expected transactions per 24h |
| `maxVolume24h` | 50000e6 | 1–∞ | Maximum expected volume per 24h (CBDC) |
| `structuringWindow` | 48 hours | 1h–7d | Time window for structuring detection |
| `defaultClusterRisk` | 85 | 1–100 | Default risk level for newly flagged clusters |

---

## Regulatory Considerations

### Compliance Standards

| Standard | Relevance | Implementation |
|----------|-----------|----------------|
| **FATF Travel Rule** | Cross-border value transfer | Metadata field for originator/beneficiary info |
| **BSA/AML (US)** | Anti-money laundering | On-chain screening + SAR generation |
| **OFAC Sanctions** | Sanctioned entity blocking | SanctionsList.sol with oracle feed |
| **MiCA (EU)** | Crypto-asset regulation | Transfer limit compliance |
| **PMLA (India)** | Prevention of money laundering | Threshold-based reporting |

### Important Disclaimers

> **⚠️ This AML module is a technical implementation and does not constitute legal compliance advice.** Organizations deploying RupeeFlow must:
>
> 1. Obtain appropriate licenses for money transmission in their jurisdictions
> 2. Conduct independent legal review of compliance requirements
> 3. Integrate with licensed compliance providers (Chainalysis, Elliptic, TRM Labs)
> 4. Implement off-chain KYC/KYB processes as required by law
> 5. Register with relevant financial regulators (FinCEN, FCA, etc.)

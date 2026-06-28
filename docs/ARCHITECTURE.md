# Architecture — RupeeFlow Decentralized Remittance Protocol

> Deep-dive into the system architecture, design decisions, and component interactions.

---

## Table of Contents

- [System Overview](#system-overview)
- [Design Principles](#design-principles)
- [Layer Architecture](#layer-architecture)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Transfer Lifecycle](#transfer-lifecycle)
- [Multi-Signature Escrow Model](#multi-signature-escrow-model)
- [AML Compliance Engine](#aml-compliance-engine)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow](#data-flow)
- [Upgrade Strategy](#upgrade-strategy)
- [Network Architecture](#network-architecture)

---

## System Overview

RupeeFlow is designed as a **modular, upgradeable protocol** consisting of three primary layers:

```
┌─────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                   │
│          React SPA + wagmi/viem Web3 Stack           │
├─────────────────────────────────────────────────────┤
│                  PROTOCOL LAYER                      │
│     RemittanceRouter ← Central Orchestrator          │
│     ┌──────────┬──────────────┬────────────────┐     │
│     │ Escrow   │ Fee Engine   │ AML Compliance │     │
│     └──────────┴──────────────┴────────────────┘     │
├─────────────────────────────────────────────────────┤
│                  SETTLEMENT LAYER                    │
│       CBDCs (Central Bank Digital Currencies)         │
├─────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                │
│       Base L2 (Optimism Stack) → Ethereum L1         │
└─────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Trustless by Default
All fund custody is handled through the multi-sig escrow contract. No single entity — including the protocol deployer — can unilaterally move user funds. The escrow requires M-of-N signatures from independent signers to release.

### 2. Compliance-First
Unlike many DeFi protocols that treat compliance as an afterthought, RupeeFlow integrates AML screening directly into the transfer initiation flow. Every transaction is scored on-chain before funds enter escrow.

### 3. Modular & Upgradeable
Each concern (routing, escrow, fees, AML) is isolated into its own contract with well-defined interfaces. The `RemittanceRouter` delegates to specialized modules, allowing independent upgrades without disrupting the entire system.

### 4. Gas-Optimized for L2
The contracts are specifically optimized for Base L2's cost structure:
- Calldata-heavy operations are minimized (calldata is the primary L2 cost driver)
- Storage slots are packed efficiently using Solidity struct packing
- Events are used liberally for off-chain indexing (events are cheap on L2)

### 5. Defense in Depth
Multiple overlapping security mechanisms protect against different attack vectors:
- Re-entrancy guards on all state-changing functions
- Rate limiting at wallet and corridor levels
- Emergency circuit breaker (pausable)
- Time-locked refunds prevent griefing
- Multi-sig prevents single-key compromise

---

## Layer Architecture

### Infrastructure Layer — Base L2

**Why Base?**
| Factor | Base L2 | Ethereum L1 | Comparison |
|--------|---------|-------------|------------|
| Avg. Gas Price | ~0.01 gwei | ~30 gwei | **3000x cheaper** |
| Block Time | 2 seconds | 12 seconds | **6x faster** |
| Finality | ~2–10 seconds | ~15 minutes | **~90x faster** |
| CBDC Support | ERC-20 CBDC tokens | Native | Both supported |
| Security | Inherits from ETH L1 | L1 native | Both L1-secured |
| Ecosystem | Coinbase-backed | Largest | Growing rapidly |

Base (built on the Optimism stack) provides:
- **Optimistic rollup security**: Transactions are batched and posted to Ethereum L1, inheriting its security guarantees
- **EVM equivalence**: Identical smart contract deployment and tooling (Foundry, Hardhat, etc.)
- **CBDC Token Support**: ERC-20 compatible CBDC tokens (e-Rupee, e-Dollar, etc.) deployed on Base

### Settlement Layer — CBDCs

We use **Central Bank Digital Currencies (CBDCs)** as the settlement layer, supporting multiple sovereign digital currencies:

1. **Sovereign Backing** — CBDCs are issued by central banks (RBI, Fed, PBoC), providing full government backing
2. **Regulatory Compliance** — CBDCs are inherently compliant as they are issued by regulators themselves
3. **Price Stability** — 1:1 peg to national fiat currency eliminates volatility risk
4. **Multi-Currency Support** — Protocol supports multiple CBDC tokens per corridor (e-Rupee for India, e-Dollar for US, etc.)
5. **ERC-20 Compatible** — CBDCs deployed as ERC-20 tokens on Base L2 for seamless DeFi composability

**Supported CBDCs:**
| CBDC | Issuer | Standard | Corridor Usage |
|------|--------|----------|----------------|
| e-Rupee (e₹) | Reserve Bank of India | ERC-20 | India corridors |
| e-Dollar | Federal Reserve | ERC-20 | US corridors |
| e-Yuan (e-CNY) | People's Bank of China | ERC-20 | China corridors |
| e-Dirham | UAE Central Bank | ERC-20 | UAE corridors |

### Protocol Layer — Smart Contracts

The protocol layer consists of 7 core contracts organized into 3 domains:

```
┌──────────────────────────────────────────────────────────┐
│                    CORE DOMAIN                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │          RemittanceRouter.sol                    │     │
│  │  • Entry point for all transfer operations      │     │
│  │  • Coordinates between escrow, fees, and AML    │     │
│  │  • Manages transfer state machine               │     │
│  └──────────┬──────────────┬──────────────┬────────┘     │
│             │              │              │               │
│  ┌──────────▼────┐  ┌─────▼──────┐  ┌───▼───────────┐   │
│  │ MultiSigEscrow│  │FeeController│  │ (Compliance)  │   │
│  │               │  │             │  │               │   │
│  │ • Fund custody│  │ • Fee calc  │  │               │   │
│  │ • Multi-sig   │  │ • Tiers     │  │               │   │
│  │ • Time locks  │  │ • Discounts │  │               │   │
│  └───────────────┘  └─────────────┘  └───────────────┘   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  COMPLIANCE DOMAIN                       │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  AMLModule.sol  │  │SanctionsList │  │ RateLimiter  │  │
│  │                 │  │              │  │              │  │
│  │ • Risk scoring  │  │ • Blocklist  │  │ • Per-wallet │  │
│  │ • Clustering    │  │ • Oracle     │  │ • Per-corridor│ │
│  │ • Flagging      │  │ • Updates    │  │ • Cooldowns  │  │
│  └────────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  GOVERNANCE DOMAIN                       │
│  ┌──────────────────┐  ┌─────────────────────────────┐   │
│  │ CorridorRegistry │  │    EmergencyGuardian         │   │
│  │                  │  │                             │   │
│  │ • Corridor CRUD  │  │ • Pause / Unpause          │   │
│  │ • Fee overrides  │  │ • Guardian multi-sig       │   │
│  │ • Limit configs  │  │ • Timelock for unpause     │   │
│  └──────────────────┘  └─────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Application Layer — React Frontend

The frontend is a **single-page application** built with:
- **React 18** with concurrent features
- **TypeScript** for type safety
- **Vite** for fast HMR and optimized builds
- **wagmi v2 + viem** for type-safe Web3 interactions
- **TanStack Query** for caching and state management

---

## Transfer Lifecycle

Every remittance follows a deterministic state machine:

```
                  ┌─────────────────┐
                  │    INITIATED     │
                  │  (AML screened,  │
                  │   funds in escrow)│
                  └────────┬────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            │            ▼
    ┌─────────────┐        │    ┌───────────┐
    │  CANCELLED   │        │    │  FLAGGED   │
    │ (by sender   │        │    │ (AML hold) │
    │  before      │        │    └─────┬─────┘
    │  completion) │        │          │
    └──────┬──────┘        │          │ manual review
           │               │          │
           ▼               ▼          ▼
    ┌──────────┐   ┌──────────┐  ┌──────────┐
    │ REFUNDED  │   │ COMPLETED │  │ REJECTED │
    │ (funds    │   │ (funds    │  │ (funds   │
    │  returned)│   │  delivered)│  │  returned)│
    └──────────┘   └──────────┘  └──────────┘
                        │
                        ▼
                 ┌──────────┐
                 │  EXPIRED  │
                 │ (auto-    │
                 │  refund)  │
                 └──────────┘
```

### State Transitions

| From | To | Trigger | Actor |
|------|----|---------|-------|
| — | INITIATED | `initiateTransfer()` | Sender |
| INITIATED | COMPLETED | `completeTransfer()` + multi-sig | Signers |
| INITIATED | CANCELLED | `cancelTransfer()` | Sender |
| INITIATED | FLAGGED | AML score > threshold | AMLModule |
| FLAGGED | COMPLETED | Manual review + `completeTransfer()` | Admin + Signers |
| FLAGGED | REJECTED | Manual review + `rejectTransfer()` | Admin |
| CANCELLED | REFUNDED | `claimRefund()` after timelock | Sender |
| REJECTED | REFUNDED | `claimRefund()` | Sender |
| INITIATED | EXPIRED | Block.timestamp > expiry | Anyone (via `claimRefund()`) |

---

## Multi-Signature Escrow Model

### Design

The escrow uses an **off-chain signature collection** model (similar to Gnosis Safe) rather than an on-chain voting model:

```
┌──────────────────────────────────────────────────────┐
│                  MultiSigEscrow                       │
│                                                       │
│  Configuration:                                       │
│  ┌──────────────────────────────────────────────┐     │
│  │  Signers: [Signer A, Signer B, Signer C]     │     │
│  │  Threshold: 2 of 3                            │     │
│  │  Timelock: 24 hours (refund cooldown)         │     │
│  └──────────────────────────────────────────────┘     │
│                                                       │
│  Per-Transfer Storage:                                │
│  ┌──────────────────────────────────────────────┐     │
│  │  transferId → {                               │     │
│  │    sender: address                            │     │
│  │    recipient: address                         │     │
│  │    amount: uint256                            │     │
│  │    depositedAt: uint256                       │     │
│  │    expiresAt: uint256                         │     │
│  │    status: TransferStatus                     │     │
│  │  }                                            │     │
│  └──────────────────────────────────────────────┘     │
│                                                       │
│  Signature Verification:                              │
│  ┌──────────────────────────────────────────────┐     │
│  │  1. Hash(transferId, action, nonce, chainId)  │     │
│  │  2. ECDSA.recover() each signature            │     │
│  │  3. Verify >= threshold unique valid signers  │     │
│  │  4. Execute action                            │     │
│  └──────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

### Why Off-Chain Signatures?

1. **Gas Efficiency** — Only one on-chain transaction regardless of signer count
2. **Privacy** — Individual signer votes are not visible on-chain until execution
3. **Flexibility** — Signers can be geographically distributed without coordination
4. **Proven Pattern** — Same model used by Gnosis Safe (managing $100B+)

### OpenZeppelin Primitives Used

| Primitive | Usage |
|-----------|-------|
| `ECDSA` | Signature recovery and validation |
| `EIP712` | Typed structured data hashing (EIP-712) |
| `ReentrancyGuard` | Protection against re-entrancy attacks |
| `Pausable` | Emergency stop mechanism |
| `AccessControl` | Role-based permissions (SIGNER_ROLE, ADMIN_ROLE) |
| `SafeERC20` | Safe CBDC token transfer handling |

---

## AML Compliance Engine

### On-Chain Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     AMLModule.sol                         │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Transaction Screening Pipeline                      │  │
│  │                                                      │  │
│  │  1. Sanctions Check ──── SanctionsList.sol            │  │
│  │     └─ Is sender/recipient on blocklist?             │  │
│  │                                                      │  │
│  │  2. Velocity Score ──── Internal                      │  │
│  │     └─ tx count + volume in sliding time window      │  │
│  │     └─ Weighted scoring: recent txs weigh more       │  │
│  │                                                      │  │
│  │  3. Cluster Analysis ──── Internal                    │  │
│  │     └─ Known flagged wallet associations              │  │
│  │     └─ Graph-based cluster membership check           │  │
│  │                                                      │  │
│  │  4. Amount Threshold ──── CorridorRegistry            │  │
│  │     └─ Per-corridor reporting thresholds              │  │
│  │     └─ Structuring detection (split tx patterns)     │  │
│  │                                                      │  │
│  │  OUTPUT: riskScore (0-100) + flagged (bool)          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Wallet Cluster Registry                             │  │
│  │                                                      │  │
│  │  clusterMap: address → clusterId                     │  │
│  │  clusterRisk: clusterId → riskLevel                  │  │
│  │  flaggedClusters: clusterId → bool                   │  │
│  │                                                      │  │
│  │  Functions:                                          │  │
│  │  • flagWalletCluster(address[], reason)              │  │
│  │  • addToCluster(address, clusterId)                  │  │
│  │  • getClusterMembers(clusterId)                      │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Risk Scoring Algorithm

```
Total Risk Score = w1 × SanctionsScore
                 + w2 × VelocityScore
                 + w3 × ClusterScore
                 + w4 × AmountScore

Where:
  w1 = 0.40 (sanctions are highest weight)
  w2 = 0.25 (transaction velocity)
  w3 = 0.25 (cluster association)
  w4 = 0.10 (amount thresholds)

Thresholds:
  Score < 30  → PASS (auto-approve)
  Score 30-70 → REVIEW (manual review required)
  Score > 70  → FLAG (auto-flag, hold funds)
  Sanctioned  → BLOCK (immediate rejection, score = 100)
```

---

## Frontend Architecture

```
src/
├── components/
│   ├── wallet/
│   │   ├── ConnectButton.tsx        # Wallet connection trigger
│   │   ├── AccountInfo.tsx          # Connected wallet display
│   │   └── NetworkSwitcher.tsx      # Base network switching
│   ├── remittance/
│   │   ├── SendForm.tsx             # Transfer initiation form
│   │   ├── AmountInput.tsx          # CBDC amount with fee preview
│   │   ├── RecipientInput.tsx       # ENS / address input
│   │   ├── CorridorSelector.tsx     # Corridor picker
│   │   └── ConfirmDialog.tsx        # Pre-send confirmation modal
│   ├── tracking/
│   │   ├── TransferStatus.tsx       # Real-time status display
│   │   ├── TransferTimeline.tsx     # Visual state timeline
│   │   └── TransactionHistory.tsx   # Past transfers list
│   └── admin/
│       ├── AMLDashboard.tsx         # Flagged transfers overview
│       ├── RiskScorePanel.tsx       # Wallet risk score lookup
│       └── CorridorManager.tsx      # Corridor CRUD interface
├── hooks/
│   ├── useRemittance.ts             # Transfer lifecycle hooks
│   ├── useEscrow.ts                 # Escrow interaction hooks
│   ├── useAML.ts                    # AML query hooks
│   ├── useTransferEvents.ts         # WebSocket event subscriptions
│   └── useFees.ts                   # Fee calculation hooks
├── contracts/
│   ├── abis/                        # Contract ABIs (auto-generated)
│   ├── addresses.ts                 # Deployed contract addresses
│   └── config.ts                    # wagmi contract configs
├── lib/
│   ├── formatting.ts                # Amount / address formatting
│   ├── corridors.ts                 # Corridor metadata
│   └── errors.ts                    # Custom error handling
└── pages/
    ├── Home.tsx                     # Landing + quick send
    ├── Send.tsx                     # Full send flow
    ├── Track.tsx                    # Transfer tracking
    ├── History.tsx                  # Transaction history
    └── Admin.tsx                    # Admin dashboard
```

---

## Data Flow

### Initiate Transfer Flow

```
User clicks "Send"
       │
       ▼
┌─────────────┐     ┌──────────────────┐
│  Frontend    │────>│ CBDC.approve()    │  1. Approve Router to spend CBDC
│  (wagmi)     │     │ (user signs tx)   │
└─────────────┘     └──────────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────────┐
│  Frontend    │────>│ Router            │  2. Call initiateTransfer()
│  (wagmi)     │     │ .initiateTransfer│
└─────────────┘     └──────────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │ AMLModule │  │FeeCtrl   │  3. Screen tx + calculate fees
              │.screenTx()│  │.calcFee()│
              └──────────┘  └──────────┘
                    │             │
                    └──────┬──────┘
                           ▼
                    ┌──────────────┐
                    │  Escrow      │  4. Deposit CBDC (amount - fee) into escrow
                    │ .deposit()   │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Emit Event:  │  5. TransferInitiated event
                    │ TransferInit │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Frontend    │  6. UI updates via event subscription
                    │  (listener)  │
                    └──────────────┘
```

---

## Upgrade Strategy

### Proxy Pattern (Future)

Currently, contracts are deployed as immutable implementations. For future upgradability:

1. **UUPS Proxy** (preferred for gas efficiency on L2)
   - `RemittanceRouter` behind a UUPS proxy
   - Implementation upgrades require multi-sig approval
   - Storage layout preservation via OpenZeppelin's `Initializable`

2. **Module Registry** (current approach for compliance contracts)
   - Router stores references to module addresses
   - Modules can be swapped via `setModule()` (admin-only, timelocked)
   - Example: Upgrade AMLModule without touching the Router

```solidity
// Current module swap pattern
function setAMLModule(address newModule) external onlyRole(ADMIN_ROLE) {
    require(newModule != address(0), "Zero address");
    emit AMLModuleUpdated(address(amlModule), newModule);
    amlModule = IAMLModule(newModule);
}
```

---

## Network Architecture

### RPC & Indexing

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ Frontend  │────>│  Alchemy /   │────>│   Base L2    │
│          │     │  Infura RPC   │     │   Network    │
└──────────┘     └──────────────┘     └──────────────┘
     │
     │  Events (WebSocket)
     ▼
┌──────────────┐
│  Event       │     (Optional: TheGraph subgraph
│  Listener    │      for historical queries)
└──────────────┘
```

### Supported Networks

| Network | Chain ID | Status | Purpose |
|---------|----------|--------|---------|
| Base Mainnet | 8453 | Production | Live remittances |
| Base Sepolia | 84532 | Testnet | Development & testing |
| Anvil (local) | 31337 | Local | Unit testing |
| Base Fork | 8453 | Fork | Fork testing |

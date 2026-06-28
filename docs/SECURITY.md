# Security Model — RupeeFlow

> Comprehensive security documentation covering threat model, mitigations, access control, and audit considerations.

---

## Table of Contents

- [Security Philosophy](#security-philosophy)
- [Threat Model](#threat-model)
- [Access Control Matrix](#access-control-matrix)
- [Attack Surface Analysis](#attack-surface-analysis)
- [Defense Mechanisms](#defense-mechanisms)
- [OpenZeppelin Security Primitives](#openzeppelin-security-primitives)
- [Key Management](#key-management)
- [Incident Response](#incident-response)
- [Audit Preparation](#audit-preparation)
- [Known Limitations](#known-limitations)

---

## Security Philosophy

RupeeFlow follows a **defense-in-depth** approach with multiple overlapping security layers:

1. **Minimize Trust** — No single entity can move funds unilaterally
2. **Fail Closed** — Ambiguous states default to holding funds in escrow
3. **Least Privilege** — Each role has minimal necessary permissions
4. **Transparent by Default** — All operations emit events for auditability
5. **Battle-Tested Foundations** — Built on OpenZeppelin's audited contract library

---

## Threat Model

### Assets Under Protection

| Asset | Description | Priority |
|-------|-------------|----------|
| Escrowed CBDCs | User funds held in MultiSigEscrow | **Critical** |
| Protocol Fees | Accumulated fee revenue | **High** |
| Access Control State | Role assignments and permissions | **High** |
| AML Data | Wallet cluster data and risk scores | **Medium** |
| Corridor Config | Corridor parameters and limits | **Medium** |

### Threat Actors

| Actor | Capability | Motivation |
|-------|-----------|------------|
| External Attacker | Smart contract exploitation | Steal escrowed funds |
| Malicious Signer | 1 of N signing keys compromised | Collude to steal funds |
| Malicious Admin | Admin role compromised | Modify protocol parameters |
| Malicious User | Legitimate protocol user | Grief other users, exploit edge cases |
| Front-Runner | MEV bot / block builder | Extract value from pending transactions |
| Sanctioned Entity | Blocked wallet user | Circumvent AML controls |

---

### Threat Scenarios

#### T1: Escrow Fund Theft
**Threat**: Attacker drains CBDC tokens from escrow contract.
**Mitigations**:
- Multi-sig requires M-of-N valid signatures to release
- `ReentrancyGuard` prevents re-entrancy attacks
- Funds can only be released to the pre-registered beneficiary
- No `delegatecall` or external contract calls during release

#### T2: Signature Forgery
**Threat**: Attacker forges signatures to release escrow without legitimate signers.
**Mitigations**:
- EIP-712 typed structured data with domain separator (chain-specific)
- OpenZeppelin's `ECDSA.recover()` for secure recovery
- Duplicate signer detection prevents replay of same signature
- Nonce tracking prevents signature replay

#### T3: Admin Key Compromise
**Threat**: Admin private key is compromised, attacker modifies protocol.
**Mitigations**:
- Admin operations are timelocked (24-hour delay)
- Critical operations require multi-sig guardian approval
- Admin cannot directly move escrowed funds
- Signer set changes emit events for monitoring

#### T4: Re-Entrancy Attack
**Threat**: Malicious contract re-enters during CBDC transfer.
**Mitigations**:
- `ReentrancyGuard` on all state-changing functions
- Checks-Effects-Interactions pattern throughout
- `SafeERC20` for all token transfers
- CBDC tokens follow standard ERC-20 (non-reentrant)

#### T5: Front-Running / MEV
**Threat**: MEV bot front-runs transfer initiation or completion.
**Mitigations**:
- Transfer initiation uses `msg.sender` as the depositor (can't be spoofed)
- Completion requires valid multi-sig signatures (can't be front-run)
- No price-sensitive operations (CBDCs are pegged to fiat, no swap)
- Low MEV surface due to fixed-value stablecoin transfers

#### T6: AML Bypass
**Threat**: Sanctioned wallet circumvents AML screening.
**Mitigations**:
- AML screening is mandatory — embedded in `initiateTransfer()` flow
- Cannot be bypassed without modifying the Router contract
- Wallet cluster flagging prevents sybil/splitting attacks
- Rate limiting prevents rapid small transfers below thresholds

#### T7: Griefing Attack
**Threat**: Attacker creates transfers and never completes them, locking funds.
**Mitigations**:
- All transfers have a configurable expiry timestamp
- After expiry, sender can claim refund via `claimRefund()`
- Refund timelock prevents instant cancel-and-frontrun
- No gas cost to recipient if transfer is never completed

#### T8: Denial of Service
**Threat**: Attacker spams transactions to exhaust gas or block legitimate users.
**Mitigations**:
- Rate limiting per wallet and per corridor
- Minimum transfer amounts prevent dust spam
- Emergency pause via circuit breaker
- Base L2's low gas costs make DoS expensive for attackers

---

## Access Control Matrix

### Roles

```
DEFAULT_ADMIN_ROLE (0x00)
├── Can grant/revoke all roles
├── Can update protocol parameters
├── Can register/deactivate corridors
└── Should be a multi-sig (Gnosis Safe)

OPERATOR_ROLE
├── Can complete transfers (with multi-sig)
├── Can reject flagged transfers
└── Cannot modify protocol parameters

GUARDIAN_ROLE
├── Can emergency pause the protocol
├── Can unpause (after timelock)
└── Cannot move funds or change config

AML_OFFICER_ROLE
├── Can flag wallet clusters
├── Can update sanctions list
├── Can modify AML thresholds
└── Cannot move funds

ROUTER_ROLE (internal)
├── Held only by RemittanceRouter
├── Can deposit into / refund from escrow
└── Can record transfers in RateLimiter

SIGNER_ROLE (escrow)
├── Can sign release authorizations (off-chain)
├── Cannot directly call release() 
└── Signatures validated on-chain
```

### Permission Matrix

| Action | Admin | Operator | Guardian | AML Officer | Router | User |
|--------|-------|----------|----------|-------------|--------|------|
| Initiate Transfer | — | — | — | — | — | ✅ |
| Complete Transfer | — | ✅ | — | — | — | — |
| Cancel Transfer | — | — | — | — | — | ✅ (own) |
| Claim Refund | — | — | — | — | — | ✅ (own) |
| Reject Transfer | — | ✅ | — | — | — | — |
| Pause Protocol | — | — | ✅ | — | — | — |
| Unpause Protocol | — | — | ✅ | — | — | — |
| Flag Wallet Cluster | — | — | — | ✅ | — | — |
| Update Sanctions | — | — | — | ✅ | — | — |
| Register Corridor | ✅ | — | — | — | — | — |
| Update Fee Config | ✅ | — | — | — | — | — |
| Update Signers | ✅ | — | — | — | — | — |
| Deposit to Escrow | — | — | — | — | ✅ | — |
| Release from Escrow | — | — | — | — | — | — (multi-sig) |
| Grant/Revoke Roles | ✅ | — | — | — | — | — |

---

## Defense Mechanisms

### 1. Multi-Signature Escrow
- **What**: Requires 2-of-3 or 3-of-5 signatures to release funds
- **Why**: Prevents single-key compromise from draining escrow
- **Implementation**: Off-chain EIP-712 signatures validated on-chain

### 2. Re-Entrancy Protection
- **What**: `ReentrancyGuard` modifier on all external state-changing functions
- **Why**: Prevents callback attacks during token transfers
- **Implementation**: OpenZeppelin's `ReentrancyGuard` (mutex lock)

### 3. Emergency Circuit Breaker
- **What**: `Pausable` modifier with guardian-controlled emergency stop
- **Why**: Allows immediate halt if vulnerability is discovered
- **Implementation**: OpenZeppelin's `Pausable` + `EmergencyGuardian` contract

### 4. Rate Limiting
- **What**: Per-wallet and per-corridor transfer limits with sliding windows
- **Why**: Prevents rapid fund extraction and AML threshold splitting
- **Implementation**: Custom `RateLimiter` with time-windowed counters

### 5. Time-Locked Refunds
- **What**: Minimum waiting period before cancelled transfers can be refunded
- **Why**: Prevents cancel-and-frontrun attacks
- **Implementation**: `refundTimelock` check in escrow `refund()` function

### 6. Transfer Expiry
- **What**: Automatic expiry after configurable duration per corridor
- **Why**: Prevents indefinite fund locking in escrow
- **Implementation**: `expiresAt` timestamp checked in `claimRefund()`

### 7. Access Control
- **What**: Role-based permissions with least-privilege principle
- **Why**: Limits blast radius of compromised keys
- **Implementation**: OpenZeppelin's `AccessControl`

### 8. Safe Token Transfers
- **What**: `SafeERC20` wrappers for all CBDC token operations
- **Why**: Handles non-standard ERC-20 return values safely
- **Implementation**: OpenZeppelin's `SafeERC20`

---

## OpenZeppelin Security Primitives

| Primitive | Contract | Usage |
|-----------|----------|-------|
| `ReentrancyGuard` | Router, Escrow | Mutex lock on state-changing functions |
| `Pausable` | Router | Emergency stop mechanism |
| `AccessControl` | All contracts | Role-based access control |
| `ECDSA` | Escrow | Signature recovery and validation |
| `EIP712` | Escrow | Typed structured data hashing |
| `SafeERC20` | Router, Escrow | Safe ERC-20 token operations |
| `Math` | FeeController | Safe arithmetic operations |

All primitives are from **OpenZeppelin Contracts v5.x**, the latest audited release.

---

## Key Management

### Recommended Setup

| Role | Key Storage | Recommendation |
|------|------------|----------------|
| Admin | Hardware wallet + Gnosis Safe | 3-of-5 multi-sig |
| Operator | Hardware wallet | Individual hardware wallets |
| Guardian | Hardware wallet + Gnosis Safe | 2-of-3 multi-sig |
| AML Officer | Hardware wallet | Individual hardware wallets |
| Escrow Signers | Hardware wallet | Geographically distributed |
| Deployer | Hardware wallet | Used only for deployment, role revoked after |

### Key Rotation

1. Admin multi-sig can update signer sets via `updateSigners()`
2. Role rotation via `grantRole()` / `revokeRole()` on AccessControl
3. All key changes emit events for monitoring
4. Recommended rotation cadence: quarterly for signers, annually for admin

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0 - Critical** | Active fund loss | Immediate | Escrow drain exploit |
| **P1 - High** | Potential fund loss | < 1 hour | Vulnerability reported |
| **P2 - Medium** | Protocol degradation | < 24 hours | AML bypass vector |
| **P3 - Low** | Minor issue | < 1 week | UI display bug |

### P0 Response Playbook

```
1. GUARDIAN: Call emergencyPause() on EmergencyGuardian
   └─ This pauses Router (halts all new transfers)

2. TEAM: Assess the vulnerability
   └─ Identify affected transfers and funds at risk

3. ADMIN: If needed, update affected module contracts
   └─ Deploy patched contract
   └─ Call setModule() to swap in new implementation (timelocked)

4. GUARDIAN: Call unpause() after timelock expires
   └─ Resume normal operations

5. POST-MORTEM: Document incident and remediation
```

---

## Audit Preparation

### Pre-Audit Checklist

- [ ] 95%+ test coverage with `forge coverage`
- [ ] All invariant tests passing
- [ ] Mainnet fork tests with real CBDC tokens
- [ ] Slither static analysis — zero high/medium findings
- [ ] Mythril symbolic execution — zero critical findings
- [ ] Gas optimization review
- [ ] Storage layout documented and verified
- [ ] Access control matrix verified
- [ ] All events documented
- [ ] NatSpec documentation on all public/external functions

### Recommended Audit Scope

| Priority | Contracts | Reason |
|----------|-----------|--------|
| **Critical** | MultiSigEscrow.sol | Holds all user funds |
| **Critical** | RemittanceRouter.sol | Orchestrates all operations |
| **High** | AMLModule.sol | Compliance-critical |
| **High** | FeeController.sol | Fee calculation accuracy |
| **Medium** | RateLimiter.sol | DoS prevention |
| **Medium** | CorridorRegistry.sol | Configuration management |
| **Low** | Libraries | Pure utility functions |

---

## Known Limitations

1. **Off-Chain Signer Coordination**: Multi-sig signatures are collected off-chain. If signers are unavailable, funds remain locked in escrow until expiry
2. **Oracle Dependency**: Sanctions list relies on admin updates; real-time oracle integration is planned for v2
3. **L2 Sequencer Risk**: Base L2's sequencer is currently centralized (Coinbase). Sequencer downtime would halt all transfers temporarily
4. **No Formal Verification**: Contracts have extensive test coverage but no formal verification (Certora integration planned)
5. **Gas Price Assumptions**: Gas cost estimates assume stable Base L2 pricing; L1 data availability costs may fluctuate

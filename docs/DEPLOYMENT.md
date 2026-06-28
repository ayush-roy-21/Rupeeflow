# Deployment Guide — RupeeFlow

> Step-by-step guide for deploying RupeeFlow smart contracts to Base Sepolia (testnet) and Base Mainnet.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Order](#deployment-order)
- [Testnet Deployment (Base Sepolia)](#testnet-deployment-base-sepolia)
- [Mainnet Deployment (Base Mainnet)](#mainnet-deployment-base-mainnet)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Contract Verification](#contract-verification)
- [Deployment Checklist](#deployment-checklist)

---

## Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| Foundry | Latest nightly | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| Node.js | >= 18 | [nodejs.org](https://nodejs.org/) |
| Git | >= 2.40 | [git-scm.com](https://git-scm.com/) |

### Required Accounts

- **Base RPC**: [Alchemy](https://alchemy.com/) or [Infura](https://infura.io/) Base endpoint
- **BaseScan API Key**: [basescan.org/apis](https://basescan.org/apis) for contract verification
- **Deployer Wallet**: Funded with ETH on Base for gas (recommend hardware wallet)

---

## Environment Configuration

```bash
# .env file
# ─────────────────────────────────────────────────────────────
# Network RPC URLs
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/<YOUR_KEY>
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/<YOUR_KEY>

# Deployer (NEVER commit this to git)
PRIVATE_KEY=0x<YOUR_DEPLOYER_PRIVATE_KEY>

# Contract Verification
BASESCAN_API_KEY=<YOUR_BASESCAN_API_KEY>

# USDC Addresses
USDC_BASE_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Multi-sig Signers (addresses)
SIGNER_1=0x<ADDRESS>
SIGNER_2=0x<ADDRESS>
SIGNER_3=0x<ADDRESS>

# Configuration
ESCROW_THRESHOLD=2          # 2-of-3 multi-sig
REFUND_TIMELOCK=86400       # 24 hours in seconds
BASE_FEE_RATE=30            # 0.30% in basis points
```

---

## Deployment Order

Contracts must be deployed in dependency order:

```
1. FeeController          (no dependencies)
2. SanctionsList          (no dependencies)
3. AMLModule              (depends on: SanctionsList)
4. RateLimiter            (no dependencies)
5. CorridorRegistry       (no dependencies)
6. MultiSigEscrow         (depends on: USDC address)
7. EmergencyGuardian      (depends on: Router — set after)
8. RemittanceRouter       (depends on: ALL above + USDC)
9. Post-Deploy Config     (grant roles, register corridors)
```

---

## Testnet Deployment (Base Sepolia)

### Step 1: Fund Deployer

Get Base Sepolia ETH from the [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet) or [Alchemy Faucet](https://sepoliafaucet.com/).

```bash
# Check deployer balance
cast balance <DEPLOYER_ADDRESS> --rpc-url $BASE_SEPOLIA_RPC_URL
```

### Step 2: Deploy Contracts

```bash
cd contracts

# Dry-run first (simulation only)
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Deploy for real
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv
```

### Step 3: Configure Corridors

```bash
forge script script/ConfigureCorridor.s.sol:ConfigureCorridorScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Step 4: Verify Deployment

```bash
# Verify all contracts are deployed
cast call <ROUTER_ADDRESS> "escrow()(address)" --rpc-url $BASE_SEPOLIA_RPC_URL
cast call <ROUTER_ADDRESS> "feeController()(address)" --rpc-url $BASE_SEPOLIA_RPC_URL
cast call <ROUTER_ADDRESS> "amlModule()(address)" --rpc-url $BASE_SEPOLIA_RPC_URL

# Test a transfer on testnet
cast send <USDC_SEPOLIA> "approve(address,uint256)" <ROUTER_ADDRESS> 1000000 \
  --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
```

---

## Mainnet Deployment (Base Mainnet)

> ⚠️ **CRITICAL**: Review all deployment parameters carefully. Mainnet deployments are irreversible.

### Pre-Flight Checklist

- [ ] All tests passing (including fork tests)
- [ ] Coverage >= 95%
- [ ] Deployment script tested on Sepolia
- [ ] Multi-sig signer addresses verified
- [ ] Fee parameters reviewed
- [ ] Corridor configurations reviewed
- [ ] Deployer has sufficient ETH on Base Mainnet

### Deploy

```bash
cd contracts

# Dry-run simulation
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --slow

# Production deployment
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  --slow \
  -vvvv
```

The `--slow` flag adds delays between transactions for reliability.

---

## Post-Deployment Configuration

### 1. Grant Roles

```bash
# Grant OPERATOR_ROLE to operations multi-sig
cast send <ROUTER_ADDRESS> \
  "grantRole(bytes32,address)" \
  $(cast keccak "OPERATOR_ROLE") \
  <OPERATOR_MULTISIG> \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY

# Grant GUARDIAN_ROLE to guardian multi-sig
cast send <ROUTER_ADDRESS> \
  "grantRole(bytes32,address)" \
  $(cast keccak "GUARDIAN_ROLE") \
  <GUARDIAN_MULTISIG> \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY

# Grant AML_OFFICER_ROLE
cast send <AML_MODULE_ADDRESS> \
  "grantRole(bytes32,address)" \
  $(cast keccak "AML_OFFICER_ROLE") \
  <AML_OFFICER_ADDRESS> \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY
```

### 2. Register Corridors

```bash
# Register US → India corridor
forge script script/ConfigureCorridor.s.sol:ConfigureCorridorScript \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Example corridor configuration:
# ID: keccak256("US-IN")
# Source: "US"
# Dest: "IN"
# Min Amount: 10 USDC
# Max Amount: 10,000 USDC
# Daily Limit: 50,000 USDC
# Reporting Threshold: 3,000 USDC
# Expiry: 72 hours
```

### 3. Transfer Admin to Multi-sig

```bash
# Transfer DEFAULT_ADMIN_ROLE to multi-sig (CRITICAL)
# This removes deployer's admin access

cast send <ROUTER_ADDRESS> \
  "grantRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  <ADMIN_MULTISIG> \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY

# Revoke deployer's admin role
cast send <ROUTER_ADDRESS> \
  "revokeRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  <DEPLOYER_ADDRESS> \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY
```

---

## Contract Verification

All contracts should be verified on BaseScan for transparency:

```bash
# Verify individual contract (if --verify flag didn't work)
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/core/RemittanceRouter.sol:RemittanceRouter \
  --chain base \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address,address,address,address)" \
    $USDC $ESCROW $FEE_CTRL $AML $CORRIDOR $RATE_LIMITER)
```

---

## Deployment Checklist

### Testnet

- [ ] Deployer funded with Sepolia ETH
- [ ] `.env` configured with Sepolia values
- [ ] Contracts deployed in correct order
- [ ] All contracts verified on BaseScan
- [ ] Roles granted correctly
- [ ] Corridors registered
- [ ] Test transfer completed successfully
- [ ] Frontend connected and working

### Mainnet

- [ ] All testnet checklist items passed
- [ ] Security review completed
- [ ] Fork tests passing against current Base state
- [ ] Multi-sig wallets set up and tested
- [ ] Fee parameters finalized
- [ ] Corridor configurations reviewed by compliance
- [ ] Deployer has sufficient ETH on Base Mainnet
- [ ] Contracts deployed with `--slow` flag
- [ ] All contracts verified on BaseScan
- [ ] Admin role transferred to multi-sig
- [ ] Deployer admin role revoked
- [ ] Monitoring and alerting configured
- [ ] Emergency pause tested
- [ ] Frontend updated with mainnet addresses

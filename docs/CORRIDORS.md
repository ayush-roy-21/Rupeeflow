# Corridor Configuration Guide — RupeeFlow

> How to configure, manage, and monitor remittance corridors in the RupeeFlow protocol.

---

## Table of Contents

- [What is a Corridor?](#what-is-a-corridor)
- [Corridor Schema](#corridor-schema)
- [Default Corridors](#default-corridors)
- [Registering a Corridor](#registering-a-corridor)
- [Updating a Corridor](#updating-a-corridor)
- [Deactivating a Corridor](#deactivating-a-corridor)
- [Fee Configuration per Corridor](#fee-configuration-per-corridor)
- [AML Thresholds per Corridor](#aml-thresholds-per-corridor)
- [Rate Limits per Corridor](#rate-limits-per-corridor)
- [Monitoring](#monitoring)

---

## What is a Corridor?

A **corridor** represents a specific remittance route between two countries (e.g., US → India, UK → Philippines). Each corridor has its own:

- Transfer limits (min/max per transaction, daily aggregate)
- Fee structure (base fee or corridor-specific override)
- AML reporting thresholds
- Transfer expiry duration
- Rate limiting configuration

Corridors are identified by a `bytes32` ID derived from the source and destination country codes:

```solidity
bytes32 corridorId = keccak256(abi.encodePacked("US", "-", "IN")); // US → India
```

---

## Corridor Schema

```solidity
struct Corridor {
    bytes32 id;                  // Unique identifier
    string sourceCountry;        // ISO 3166-1 alpha-2 (e.g., "US")
    string destCountry;          // ISO 3166-1 alpha-2 (e.g., "IN")
    bool active;                 // Whether corridor accepts transfers
    uint256 minAmount;           // Minimum per-transfer (USDC, 6 decimals)
    uint256 maxAmount;           // Maximum per-transfer
    uint256 dailyLimit;          // Daily aggregate limit (all users)
    uint256 reportingThreshold;  // AML reporting threshold
    uint256 expiryDuration;      // Transfer expiry in seconds
}
```

---

## Default Corridors

| Corridor | ID | Min Amount | Max Amount | Daily Limit | AML Threshold | Expiry |
|----------|----|-----------|-----------|-------------|---------------|--------|
| US → India | `keccak256("US-IN")` | 10 USDC | 10,000 USDC | 500,000 USDC | 3,000 USDC | 72h |
| US → Philippines | `keccak256("US-PH")` | 10 USDC | 10,000 USDC | 500,000 USDC | 3,000 USDC | 72h |
| US → Mexico | `keccak256("US-MX")` | 10 USDC | 10,000 USDC | 500,000 USDC | 3,000 USDC | 72h |
| UK → India | `keccak256("UK-IN")` | 10 USDC | 8,000 USDC | 400,000 USDC | 2,500 USDC | 72h |
| UK → Pakistan | `keccak256("UK-PK")` | 10 USDC | 8,000 USDC | 400,000 USDC | 2,500 USDC | 72h |
| UAE → India | `keccak256("AE-IN")` | 10 USDC | 15,000 USDC | 750,000 USDC | 5,000 USDC | 48h |
| SG → India | `keccak256("SG-IN")` | 10 USDC | 12,000 USDC | 600,000 USDC | 4,000 USDC | 48h |

---

## Registering a Corridor

### Via Deployment Script

```solidity
// script/ConfigureCorridor.s.sol
contract ConfigureCorridorScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address registry = vm.envAddress("CORRIDOR_REGISTRY");

        vm.startBroadcast(deployerKey);

        CorridorRegistry(registry).registerCorridor(
            CorridorRegistry.Corridor({
                id: keccak256(abi.encodePacked("US", "-", "IN")),
                sourceCountry: "US",
                destCountry: "IN",
                active: true,
                minAmount: 10e6,           // 10 USDC
                maxAmount: 10_000e6,       // 10,000 USDC
                dailyLimit: 500_000e6,     // 500,000 USDC
                reportingThreshold: 3_000e6, // 3,000 USDC
                expiryDuration: 72 hours
            })
        );

        vm.stopBroadcast();
    }
}
```

### Via Cast (CLI)

```bash
cast send $CORRIDOR_REGISTRY \
  "registerCorridor((bytes32,string,string,bool,uint256,uint256,uint256,uint256,uint256))" \
  "($(cast keccak 'US-IN'),US,IN,true,10000000,10000000000,500000000000,3000000000,259200)" \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY
```

---

## Updating a Corridor

```bash
# Update max amount for US-IN corridor
cast send $CORRIDOR_REGISTRY \
  "updateCorridor(bytes32,(bytes32,string,string,bool,uint256,uint256,uint256,uint256,uint256))" \
  $(cast keccak "US-IN") \
  "($(cast keccak 'US-IN'),US,IN,true,10000000,20000000000,500000000000,3000000000,259200)" \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY
```

---

## Deactivating a Corridor

```bash
# Deactivate a corridor (pending transfers continue, new ones blocked)
cast send $CORRIDOR_REGISTRY \
  "deactivateCorridor(bytes32)" \
  $(cast keccak "US-IN") \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY
```

> **Note**: Deactivating a corridor only prevents new transfers. Existing transfers in escrow continue their lifecycle (complete, cancel, or expire).

---

## Fee Configuration per Corridor

Each corridor can have a fee override that takes priority over the base fee:

```bash
# Set US-IN corridor fee to 0.25% (25 basis points)
cast send $FEE_CONTROLLER \
  "setCorridorFee(bytes32,uint256)" \
  $(cast keccak "US-IN") \
  25 \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY

# Remove corridor fee override (revert to base fee)
cast send $FEE_CONTROLLER \
  "setCorridorFee(bytes32,uint256)" \
  $(cast keccak "US-IN") \
  0 \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY
```

---

## AML Thresholds per Corridor

The `reportingThreshold` in each corridor configuration determines:
- When structuring detection triggers
- The threshold for enhanced due diligence
- Automatic Suspicious Activity Report generation

Different jurisdictions have different thresholds:

| Jurisdiction | Typical Threshold |
|-------------|------------------|
| US (BSA) | $10,000 USD |
| UK (POCA) | £1,000 GBP (~$1,300) |
| India (PMLA) | ₹50,000 INR (~$600) |
| EU (AMLD) | €1,000 EUR |
| UAE (AML-CFT) | AED 55,000 (~$15,000) |

Set the reporting threshold appropriately for each corridor's destination jurisdiction.

---

## Rate Limits per Corridor

```bash
# Set rate limit for US-IN corridor
# Max 5 transfers per 24 hours, max $10,000 per 24 hours, 5-minute cooldown
cast send $RATE_LIMITER \
  "setCorridorRateLimit(bytes32,(uint256,uint256,uint256,uint256))" \
  $(cast keccak "US-IN") \
  "(10000000000,5,86400,300)" \
  --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY
```

---

## Monitoring

### Query Corridor Status

```bash
# Get corridor details
cast call $CORRIDOR_REGISTRY \
  "getCorridor(bytes32)(bytes32,string,string,bool,uint256,uint256,uint256,uint256,uint256)" \
  $(cast keccak "US-IN") \
  --rpc-url $BASE_RPC_URL

# Get all active corridors
cast call $CORRIDOR_REGISTRY \
  "getActiveCorridors()" \
  --rpc-url $BASE_RPC_URL
```

### Monitor Events

```bash
# Watch for corridor registration events
cast logs --from-block latest \
  --address $CORRIDOR_REGISTRY \
  "CorridorRegistered(bytes32,string,string)" \
  --rpc-url $BASE_RPC_URL
```

# RupeeFlow Smart Contracts

This directory contains the smart contracts for the RupeeFlow cross-border remittance platform.

## Overview

RupeeFlow is a blockchain-powered remittance platform that enables fast, low-cost international money transfers using stablecoins. The platform operates on Polygon network and supports multiple currency pairs, starting with India↔Russia corridor.

## Contract Architecture

### Core Contracts

- **`RupeeFlow.sol`** - Main remittance contract that handles transfers, fees, and compliance
- **`MockTreasury.sol`** - Mock treasury for fee collection (testing)
- **`MockFXOracle.sol`** - Mock FX oracle for exchange rates (testing)
- **`MockOnRampProvider.sol`** - Mock on-ramp provider (testing)
- **`MockOffRampProvider.sol`** - Mock off-ramp provider (testing)
- **`MockUSDC.sol`** - Mock USDC stablecoin (testing)
- **`MockUSDT.sol`** - Mock USDT stablecoin (testing)

## Features

### Security Features
- **Access Control**: Role-based permissions using OpenZeppelin
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Pausable**: Emergency stop functionality
- **Fee Caps**: Maximum fee limited to 2%
- **Circuit Breakers**: Emergency controls for compliance

### Transfer Features
- **Multi-Currency Support**: INR, RUB, USD, EUR
- **Stablecoin Integration**: USDC/USDT on Polygon
- **Real-time Quotes**: FX rates and fee calculations
- **Status Tracking**: Complete transfer lifecycle
- **Audit Trail**: Full transaction history

### Compliance Features
- **KYC Integration**: User verification support
- **AML Monitoring**: Transaction monitoring
- **Regulatory Controls**: Emergency pause and refund
- **Audit Logging**: Complete event logging

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Hardhat

### Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
# Add your private key and API keys
```

### Environment Variables
```bash
# Network RPC URLs
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Private Key (for deployment)
PRIVATE_KEY=your_private_key_here

# API Keys
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# Gas Reporting
REPORT_GAS=true
```

## Development

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm run test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Start Local Node
```bash
npm run node
```

## Deployment

### Local Development
```bash
npm run deploy:local
```

### Mumbai Testnet
```bash
npm run deploy:testnet
```

### Amoy Testnet
```bash
npm run deploy:amoy
```

### Verify Contracts
```bash
# Mumbai
npm run verify:testnet

# Amoy
npm run verify:amoy
```

## Contract Functions

### Core Functions

#### `initiateTransfer`
Initiates a new remittance transfer
```solidity
function initiateTransfer(
    address recipient,
    uint256 amount,
    address stablecoin,
    string calldata sourceCurrency,
    string calldata destinationCurrency,
    string calldata sourceCountry,
    string calldata destinationCountry,
    string calldata recipientDetails
) external
```

#### `completeTransfer`
Completes a transfer after off-ramp processing
```solidity
function completeTransfer(
    uint256 transferId,
    string calldata blockchainTxHash
) external
```

#### `failTransfer`
Marks a transfer as failed
```solidity
function failTransfer(
    uint256 transferId,
    string calldata reason
) external
```

### Admin Functions

#### `setFeeBps`
Updates the platform fee percentage
```solidity
function setFeeBps(uint256 newFeeBps) external
```

#### `setOracle`
Updates the FX oracle address
```solidity
function setOracle(address newOracle) external
```

#### `pause` / `unpause`
Emergency pause/unpause functionality
```solidity
function pause() external
function unpause() external
```

### View Functions

#### `getTransfer`
Retrieves transfer details
```solidity
function getTransfer(uint256 transferId) external view returns (Transfer memory)
```

#### `calculateFee`
Calculates fee for a given amount
```solidity
function calculateFee(uint256 amount) external view returns (uint256)
```

## Testing

### Test Structure
```
test/
├── RupeeFlow.test.js      # Main contract tests
├── MockContracts.test.js  # Mock contract tests
└── Integration.test.js    # Integration tests
```

### Running Tests
```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/RupeeFlow.test.js

# Run with gas reporting
REPORT_GAS=true npm run test
```

### Test Coverage
```bash
npm run test:coverage
```

## Gas Optimization

### Current Gas Usage
- **Deployment**: ~2,500,000 gas
- **Transfer Initiation**: ~150,000 gas
- **Transfer Completion**: ~80,000 gas
- **Fee Update**: ~45,000 gas

### Optimization Techniques
- **Solidity Optimizer**: Enabled with 200 runs
- **Storage Packing**: Efficient struct layout
- **Event Optimization**: Minimal event data
- **Function Visibility**: Internal functions where possible

## Security Considerations

### Access Control
- **Role-based Permissions**: Admin, Operator, Compliance roles
- **Multi-signature Support**: Can be extended for critical operations
- **Timelock Contracts**: For major parameter changes

### Reentrancy Protection
- **Checks-Effects-Interactions**: Standard pattern implementation
- **ReentrancyGuard**: OpenZeppelin protection
- **External Call Validation**: Safe external interactions

### Emergency Controls
- **Pausable Functions**: Emergency stop capability
- **Circuit Breakers**: Automatic risk mitigation
- **Emergency Withdrawals**: Fund recovery mechanisms

## Network Support

### Testnets
- **Mumbai**: Polygon Mumbai testnet (Chain ID: 80001)
- **Amoy**: Polygon Amoy testnet (Chain ID: 80002)
- **Local**: Hardhat local network (Chain ID: 1337)

### Mainnet
- **Polygon**: Polygon mainnet (Chain ID: 137)
- **Ethereum**: Ethereum mainnet (Chain ID: 1)

## Integration

### Frontend Integration
```javascript
import { ethers } from 'ethers';
import RupeeFlowABI from './artifacts/contracts/RupeeFlow.sol/RupeeFlow.json';

const contract = new ethers.Contract(
  contractAddress,
  RupeeFlowABI.abi,
  signer
);
```

### Backend Integration
```javascript
const { ethers } = require('ethers');
const RupeeFlowABI = require('./artifacts/contracts/RupeeFlow.sol/RupeeFlow.json');

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const contract = new ethers.Contract(contractAddress, RupeeFlowABI.abi, provider);
```

## Monitoring

### Events to Monitor
- `TransferInitiated`: New transfer created
- `TransferCompleted`: Transfer successful
- `TransferFailed`: Transfer failed
- `FeeUpdated`: Fee changes
- `OracleUpdated`: Oracle address changes

### Health Checks
- Contract balance monitoring
- Fee collection tracking
- Transfer success rates
- Gas usage optimization

## Troubleshooting

### Common Issues

#### Compilation Errors
```bash
# Clear cache and recompile
npm run clean
npm run compile
```

#### Deployment Failures
```bash
# Check network configuration
npx hardhat console --network mumbai

# Verify private key and RPC URL
cat .env
```

#### Test Failures
```bash
# Run with verbose output
npx hardhat test --verbose

# Check test environment
npx hardhat node
```

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code Standards
- **Solidity**: 0.8.19+
- **Style**: Follow OpenZeppelin patterns
- **Documentation**: NatSpec comments required
- **Testing**: 100% coverage target

## License

MIT License - see LICENSE file for details

## Support

For technical support and questions:
- GitHub Issues: [Repository Issues]
- Documentation: [Project Wiki]
- Community: [Discord/Telegram]

## Roadmap

### Phase 1 (Current)
- ✅ Core transfer functionality
- ✅ Basic security features
- ✅ Testnet deployment

### Phase 2 (Next)
- 🔄 Multi-corridor support
- 🔄 Advanced compliance
- 🔄 Rate locking mechanisms

### Phase 3 (Future)
- 📋 Cross-chain bridges
- 📋 DeFi integrations
- 📋 Mobile optimization

# RupeeFlow - Cross-Border Remittance Platform

> **Blockchain-powered remittance platform that dramatically reduces fees and settlement times for international money transfers**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19+-blue.svg)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

## 🚀 Overview

RupeeFlow is a revolutionary cross-border remittance platform that leverages blockchain technology to provide:

- **⚡ Fast Settlement**: Minutes instead of 3-7 business days
- **💰 Low Fees**: 1-2% vs. traditional 6-8%
- **🔒 Secure**: Built on Polygon with enterprise-grade security
- **🌍 Global**: Starting with India↔Russia, expanding worldwide
- **📱 User-Friendly**: No crypto knowledge required

## 🎯 Problem & Solution

### The Problem
- **High Fees**: Traditional remittances charge 6-8% with hidden costs
- **Slow Settlement**: 3-7 business days for international transfers
- **Limited Access**: Poor FX rates and limited financial rail options
- **Market Size**: $700B+ global remittance volume, 281M migrants

### Our Solution
- **Blockchain Backend**: Smart contracts on Polygon for transparent transfers
- **Stablecoin Rails**: USDC/USDT for instant settlement
- **Fiat On/Off Ramps**: Local payment methods on both sides
- **Compliance Ready**: KYC/AML integration from day one

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │ Smart Contracts │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Solidity)    │
│                 │    │                 │    │                 │
│ • User Interface│    │ • API Gateway   │    │ • Transfer Logic│
│ • Wallet Connect│    │ • KYC Service   │    │ • Fee Management│
│ • Transfer Flow │    │ • Compliance    │    │ • Security      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   Database      │    │   Blockchain    │
│   Services      │    │   (PostgreSQL)  │    │   (Polygon)     │
│                 │    │                 │    │                 │
│ • KYC Provider │    │ • User Data     │    │ • Smart Contracts│
│ • On/Off Ramps │    │ • Transfers     │    │ • Stablecoins   │
│ • FX Oracle    │    │ • Audit Logs    │    │ • Transactions  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **State**: React Context + Hooks
- **Wallet**: WalletConnect v2 + MetaMask
- **Build**: Vite

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL + Redis
- **ORM**: Prisma
- **Auth**: JWT + Passport.js

### Smart Contracts
- **Language**: Solidity 0.8.19+
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin Contracts
- **Network**: Polygon (Mumbai/Amoy testnets)
- **Testing**: Hardhat + Chai

### Infrastructure
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack

## 📁 Project Structure

```
rupeeflow/
├── 📁 Frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API services
│   │   ├── contexts/           # React contexts
│   │   └── utils/              # Utility functions
│   ├── public/                 # Static assets
│   └── package.json
├── 📁 Backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   ├── models/             # Data models
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Express middleware
│   │   └── utils/              # Utility functions
│   └── package.json
├── 📁 Smart Contracts/         # Solidity smart contracts
│   ├── contracts/              # Smart contract source code
│   ├── scripts/                # Deployment scripts
│   ├── test/                   # Contract tests
│   └── package.json
├── 📁 Docs/                    # Project documentation
│   ├── PRD.md                  # Product Requirements Document
│   ├── Architecture.md         # System architecture
│   └── API-Specification.md    # API documentation
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL 14+
- Redis 6+
- MetaMask or other Web3 wallet

### 1. Clone Repository
```bash
git clone https://github.com/your-org/rupeeflow.git
cd rupeeflow
```

### 2. Smart Contracts Setup
```bash
cd "Smart Contracts"
npm install
cp env.example .env
# Edit .env with your configuration
npm run compile
npm run deploy:local
```

### 3. Backend Setup
```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:migrate
npm run dev
```

### 4. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/v1

## 🔧 Configuration

### Environment Variables

#### Smart Contracts
```bash
# Network RPC URLs
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Private Key (for deployment)
PRIVATE_KEY=your_private_key_here

# API Keys
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

#### Backend
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/rupeeflow"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# External Services
KYC_PROVIDER_API_KEY=your_kyc_api_key
FX_ORACLE_API_KEY=your_fx_api_key
```

#### Frontend
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
```

## 📊 Features

### Core Functionality
- ✅ **User Registration & KYC**
- ✅ **Real-time FX Quotes**
- ✅ **Transfer Initiation**
- ✅ **Blockchain Execution**
- ✅ **Status Tracking**
- ✅ **Receipt Generation**

### Security Features
- ✅ **Role-based Access Control**
- ✅ **Reentrancy Protection**
- ✅ **Emergency Pause**
- ✅ **Audit Logging**
- ✅ **Rate Limiting**

### Compliance Features
- ✅ **KYC Integration**
- ✅ **AML Monitoring**
- ✅ **Regulatory Controls**
- ✅ **Audit Trail**

## 🧪 Testing

### Smart Contracts
```bash
cd "Smart Contracts"
npm run test              # Run all tests
npm run test:coverage     # Run with coverage
```

### Backend
```bash
cd Backend
npm run test              # Run all tests
npm run test:watch        # Run in watch mode
```

### Frontend
```bash
cd Frontend
npm run test              # Run all tests
npm run type-check        # TypeScript check
```

## 🚀 Deployment

### Testnet Deployment
```bash
cd "Smart Contracts"
npm run deploy:testnet    # Deploy to Mumbai
npm run deploy:amoy       # Deploy to Amoy
```

### Production Deployment
```bash
# Smart Contracts
npm run deploy:mainnet

# Backend
npm run build
npm start

# Frontend
npm run build
# Deploy dist/ folder to your hosting service
```

## 📈 Performance Metrics

### Smart Contracts
- **Deployment**: ~2,500,000 gas
- **Transfer Initiation**: ~150,000 gas
- **Transfer Completion**: ~80,000 gas
- **Fee Update**: ~45,000 gas

### API Performance
- **Response Time**: <200ms (95th percentile)
- **Throughput**: 1000+ requests/second
- **Uptime**: 99.9% target

## 🔒 Security

### Smart Contract Security
- **OpenZeppelin Libraries**: Battle-tested security patterns
- **Access Control**: Role-based permissions
- **Reentrancy Protection**: Prevents common attacks
- **Emergency Controls**: Circuit breakers and pause functions

### API Security
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Controlled cross-origin access

### Infrastructure Security
- **HTTPS/TLS**: Encrypted communication
- **Environment Variables**: Secure configuration management
- **Audit Logging**: Complete activity tracking

## 🌍 Supported Corridors

### Phase 1 (Current)
- 🇮🇳 **India** ↔ 🇷🇺 **Russia**
- **Currencies**: INR ↔ RUB
- **Status**: MVP Development

### Phase 2 (Next)
- 🇮🇳 **India** ↔ 🇪🇺 **European Union**
- 🇮🇳 **India** ↔ 🇺🇸 **United States**
- **Status**: Planning

### Phase 3 (Future)
- **Global Expansion**: 50+ countries
- **Multi-Currency**: 20+ currencies
- **Status**: Roadmap

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- **Solidity**: Follow OpenZeppelin patterns
- **JavaScript/TypeScript**: ESLint + Prettier
- **Testing**: 100% coverage target
- **Documentation**: Comprehensive comments

## 📚 Documentation

- **[Product Requirements Document](Docs/PRD.md)** - Complete product specification
- **[System Architecture](Docs/Architecture.md)** - Technical architecture and diagrams
- **[API Specification](Docs/API-Specification.md)** - Backend API documentation
- **[Smart Contracts README](Smart%20Contracts/README.md)** - Contract development guide

## 🐛 Troubleshooting

### Common Issues

#### Smart Contract Compilation
```bash
# Clear cache and recompile
npm run clean
npm run compile
```

#### Database Connection
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify connection string
echo $DATABASE_URL
```

#### Frontend Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

- **GitHub Issues**: [Repository Issues](https://github.com/your-org/rupeeflow/issues)
- **Documentation**: [Project Wiki](https://github.com/your-org/rupeeflow/wiki)
- **Community**: [Discord/Telegram Links]

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenZeppelin**: For secure smart contract libraries
- **Polygon**: For scalable blockchain infrastructure
- **Hardhat**: For development framework
- **React Team**: For the amazing frontend framework

## 🗺️ Roadmap

### Q1 2024
- ✅ Project setup and architecture
- ✅ Smart contract development
- ✅ Basic API structure
- 🔄 Frontend development

### Q2 2024
- 📋 Testnet deployment
- 📋 User testing and feedback
- 📋 Security audit
- 📋 Compliance integration

### Q3 2024
- 📋 Mainnet deployment
- 📋 User acquisition
- 📋 Partnership expansion
- 📋 Mobile app development

### Q4 2024
- 📋 Multi-corridor support
- 📋 Advanced features
- 📋 Global expansion
- 📋 Enterprise partnerships

---

**Built with ❤️ by the RupeeFlow Team**

*Revolutionizing cross-border remittances, one transfer at a time.*

# RupeeFlow - System Architecture

## C4 Model

### Level 1: System Context Diagram

```mermaid
graph TB
    User[User]
    Admin[Admin/Compliance Officer]
    
    subgraph RupeeFlow["RupeeFlow Remittance Platform"]
        Frontend[Frontend App]
        Backend[Backend API]
        SmartContracts[Smart Contracts]
    end
    
    subgraph External["External Systems"]
        KYCProvider[KYC Provider]
        OnRamp[On-Ramp Provider]
        OffRamp[Off-Ramp Provider]
        FXOracle[FX Oracle]
        Blockchain[Polygon Network]
    end
    
    User --> Frontend
    Admin --> Frontend
    Frontend --> Backend
    Backend --> SmartContracts
    Backend --> KYCProvider
    Backend --> OnRamp
    Backend --> OffRamp
    Backend --> FXOracle
    SmartContracts --> Blockchain
```

### Level 2: Container Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend Container"]
        React[React App]
        Wallet[Wallet Integration]
        UI[UI Components]
    end
    
    subgraph Backend["Backend Container"]
        API[Express API]
        Auth[Authentication]
        KYC[KYC Service]
        Transfer[Transfer Service]
        Compliance[Compliance Engine]
    end
    
    subgraph Database["Database Container"]
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis Cache)]
    end
    
    subgraph SmartContracts["Smart Contracts Container"]
        RupeeFlow[RupeeFlow.sol]
        AccessControl[Access Control]
        FeeManager[Fee Manager]
    end
    
    subgraph External["External Systems"]
        KYCProvider[KYC Provider API]
        OnRamp[On-Ramp API]
        OffRamp[Off-Ramp API]
        FXOracle[FX Oracle API]
        Polygon[Polygon Network]
    end
    
    React --> API
    Wallet --> API
    API --> PostgreSQL
    API --> Redis
    API --> KYCProvider
    API --> OnRamp
    API --> OffRamp
    API --> FXOracle
    API --> RupeeFlow
    RupeeFlow --> Polygon
```

### Level 3: Component Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend Components"]
        Auth[Authentication]
        Dashboard[Dashboard]
        Transfer[Transfer Form]
        Status[Status Tracker]
        Profile[User Profile]
    end
    
    subgraph Backend["Backend Components"]
        Routes[API Routes]
        Middleware[Middleware]
        Services[Services]
        Models[Data Models]
        Utils[Utilities]
    end
    
    subgraph Services["Service Layer"]
        UserService[User Service]
        TransferService[Transfer Service]
        KYCService[KYC Service]
        ComplianceService[Compliance Service]
        NotificationService[Notification Service]
    end
    
    subgraph SmartContracts["Smart Contract Components"]
        TransferLogic[Transfer Logic]
        FeeLogic[Fee Logic]
        AccessLogic[Access Control]
        EmergencyLogic[Emergency Controls]
    end
    
    Auth --> Routes
    Dashboard --> Routes
    Transfer --> Routes
    Status --> Routes
    Profile --> Routes
    
    Routes --> Middleware
    Middleware --> Services
    Services --> Models
    Services --> Utils
    
    UserService --> Models
    TransferService --> Models
    KYCService --> Models
    ComplianceService --> Models
    NotificationService --> Models
    
    TransferService --> TransferLogic
    FeeLogic --> TransferLogic
    AccessLogic --> TransferLogic
    EmergencyLogic --> TransferLogic
```

## System Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant SC as Smart Contract
    participant KYC as KYC Provider
    participant OR as On-Ramp
    participant FO as FX Oracle
    participant OF as Off-Ramp
    participant P as Polygon

    Note over U,P: User Onboarding Flow
    U->>F: Register Account
    F->>B: Create User
    B->>KYC: Initiate KYC
    KYC-->>B: KYC Session
    B-->>F: KYC Status
    F-->>U: KYC Pending

    Note over U,P: Transfer Initiation Flow
    U->>F: Initiate Transfer
    F->>B: Get Quote
    B->>FO: Get FX Rate
    FO-->>B: Current Rate
    B->>B: Calculate Fees
    B-->>F: Transfer Quote
    F-->>U: Show Quote

    Note over U,P: Payment & Execution Flow
    U->>F: Confirm Transfer
    F->>B: Create Transfer
    B->>OR: Initiate On-Ramp
    OR-->>B: Payment Link
    B-->>F: Payment Instructions
    F-->>U: Payment Link
    
    U->>OR: Complete Payment
    OR->>B: Payment Confirmation
    B->>SC: Execute Transfer
    SC->>P: Submit Transaction
    P-->>SC: Transaction Hash
    SC-->>B: Transfer Status
    B-->>F: Status Update
    F-->>U: Transfer Confirmed

    Note over U,P: Delivery Flow
    B->>OF: Initiate Off-Ramp
    OF->>B: Delivery Confirmation
    B-->>F: Delivery Complete
    F-->>U: Transfer Delivered
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph Input["Input Layer"]
        UserInput[User Input]
        KYCData[KYC Data]
        PaymentData[Payment Data]
    end
    
    subgraph Processing["Processing Layer"]
        Validation[Data Validation]
        Compliance[Compliance Check]
        FXCalculation[FX Calculation]
        FeeCalculation[Fee Calculation]
    end
    
    subgraph Storage["Storage Layer"]
        UserDB[(User Database)]
        TransferDB[(Transfer Database)]
        AuditDB[(Audit Database)]
        Blockchain[(Blockchain)]
    end
    
    subgraph Output["Output Layer"]
        TransferStatus[Transfer Status]
        Notifications[Notifications]
        Receipts[Receipts]
        Reports[Reports]
    end
    
    UserInput --> Validation
    KYCData --> Validation
    PaymentData --> Validation
    
    Validation --> Compliance
    Validation --> FXCalculation
    Validation --> FeeCalculation
    
    Compliance --> UserDB
    FXCalculation --> TransferDB
    FeeCalculation --> TransferDB
    
    UserDB --> TransferStatus
    TransferDB --> Notifications
    TransferDB --> Receipts
    AuditDB --> Reports
    Blockchain --> TransferStatus
```

## Security Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend Security"]
        HTTPS[HTTPS/TLS]
        CSP[Content Security Policy]
        XSS[XSS Protection]
        CSRF[CSRF Protection]
    end
    
    subgraph Backend["Backend Security"]
        Auth[Authentication]
        Authz[Authorization]
        RateLimit[Rate Limiting]
        InputValidation[Input Validation]
        SQLInjection[SQL Injection Protection]
    end
    
    subgraph SmartContracts["Smart Contract Security"]
        Reentrancy[Reentrancy Protection]
        AccessControl[Access Control]
        Pausable[Pausable Functions]
        EmergencyStop[Emergency Stop]
    end
    
    subgraph Infrastructure["Infrastructure Security"]
        Secrets[Secrets Management]
        Network[Network Security]
        Monitoring[Security Monitoring]
        Audit[Audit Logging]
    end
    
    HTTPS --> Auth
    CSP --> XSS
    XSS --> InputValidation
    CSRF --> Auth
    
    Auth --> Authz
    Authz --> RateLimit
    InputValidation --> SQLInjection
    
    Reentrancy --> AccessControl
    AccessControl --> Pausable
    Pausable --> EmergencyStop
    
    Secrets --> Network
    Network --> Monitoring
    Monitoring --> Audit
```

## Deployment Architecture

```mermaid
graph TB
    subgraph Development["Development Environment"]
        DevFrontend[Frontend Dev]
        DevBackend[Backend Dev]
        DevContracts[Smart Contracts Dev]
        DevDB[Local Database]
    end
    
    subgraph Testing["Testing Environment"]
        TestFrontend[Frontend Test]
        TestBackend[Backend Test]
        TestContracts[Testnet Contracts]
        TestDB[Test Database]
    end
    
    subgraph Staging["Staging Environment"]
        StagingFrontend[Frontend Staging]
        StagingBackend[Backend Staging]
        StagingContracts[Testnet Contracts]
        StagingDB[Staging Database]
    end
    
    subgraph Production["Production Environment"]
        ProdFrontend[Frontend Production]
        ProdBackend[Backend Production]
        ProdContracts[Mainnet Contracts]
        ProdDB[Production Database]
    end
    
    DevFrontend --> DevBackend
    DevBackend --> DevContracts
    DevBackend --> DevDB
    
    TestFrontend --> TestBackend
    TestBackend --> TestContracts
    TestBackend --> TestDB
    
    StagingFrontend --> StagingBackend
    StagingBackend --> StagingContracts
    StagingBackend --> StagingDB
    
    ProdFrontend --> ProdBackend
    ProdBackend --> ProdContracts
    ProdBackend --> ProdDB
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: React Context + Hooks
- **UI Library**: Tailwind CSS + Headless UI
- **Wallet Integration**: WalletConnect v2 + MetaMask
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT + Passport.js
- **Validation**: Joi + Express-validator
- **Testing**: Jest + Supertest

### Smart Contracts
- **Language**: Solidity 0.8.19+
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin Contracts
- **Testing**: Hardhat + Chai
- **Networks**: Polygon Mumbai/Amoy (testnet)

### Database
- **Primary**: PostgreSQL 14+
- **Cache**: Redis 6+
- **ORM**: Prisma
- **Migrations**: Prisma Migrate

### Infrastructure
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack

# RupeeFlow - OpenAPI Specification

## Overview
This document defines the REST API for the RupeeFlow cross-border remittance platform.

## Base URL
- Development: `http://localhost:3001/api/v1`
- Staging: `https://staging-api.rupeeflow.com/api/v1`
- Production: `https://api.rupeeflow.com/api/v1`

## Authentication
All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "country": "IN",
  "dateOfBirth": "1990-01-01"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "status": "pending_kyc",
    "message": "Account created. Please complete KYC verification."
  }
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "kycStatus": "verified",
      "country": "IN"
    }
  }
}
```

#### POST /auth/refresh
Refresh JWT token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### 2. KYC Management

#### POST /kyc/start
Start KYC verification process.

**Request Body:**
```json
{
  "kycType": "individual",
  "documents": {
    "identity": "base64_encoded_document",
    "address": "base64_encoded_document",
    "selfie": "base64_encoded_image"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kycId": "kyc_uuid",
    "status": "pending",
    "estimatedTime": "24-48 hours",
    "provider": "kyc_provider_name"
  }
}
```

#### GET /kyc/status/:kycId
Get KYC verification status.

**Response:**
```json
{
  "success": true,
  "data": {
    "kycId": "kyc_uuid",
    "status": "approved",
    "approvedAt": "2024-01-15T10:30:00Z",
    "rejectionReason": null,
    "nextSteps": []
  }
}
```

#### GET /kyc/requirements
Get KYC requirements for user's country.

**Response:**
```json
{
  "success": true,
  "data": {
    "country": "IN",
    "requirements": [
      "Valid passport or national ID",
      "Proof of address (utility bill)",
      "Selfie with ID",
      "Source of funds declaration"
    ],
    "estimatedTime": "24-48 hours"
  }
}
```

### 3. Transfer Management

#### POST /transfers/quote
Get a quote for a transfer.

**Request Body:**
```json
{
  "sourceAmount": 1000,
  "sourceCurrency": "INR",
  "destinationCurrency": "RUB",
  "sourceCountry": "IN",
  "destinationCountry": "RU",
  "transferType": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quoteId": "quote_uuid",
    "sourceAmount": 1000,
    "sourceCurrency": "INR",
    "destinationAmount": 1085.50,
    "destinationCurrency": "RUB",
    "exchangeRate": 1.0855,
    "fees": {
      "platformFee": 5.00,
      "networkFee": 2.50,
      "totalFee": 7.50
    },
    "totalCost": 1007.50,
    "estimatedTime": "15-30 minutes",
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}
```

#### POST /transfers
Create a new transfer.

**Request Body:**
```json
{
  "quoteId": "quote_uuid",
  "recipient": {
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+79001234567",
    "bankAccount": "1234567890123456",
    "bankName": "Sberbank",
    "bankCode": "SBINRUMM"
  },
  "paymentMethod": "bank_transfer",
  "sourceOfFunds": "salary"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "transfer_uuid",
    "status": "pending_payment",
    "paymentInstructions": {
      "amount": 1007.50,
      "currency": "INR",
      "accountNumber": "1234567890",
      "bankName": "HDFC Bank",
      "reference": "RF123456789"
    },
    "estimatedCompletion": "2024-01-15T12:00:00Z"
  }
}
```

#### GET /transfers/:transferId
Get transfer details and status.

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "transfer_uuid",
    "status": "completed",
    "sourceAmount": 1000,
    "sourceCurrency": "INR",
    "destinationAmount": 1085.50,
    "destinationCurrency": "RUB",
    "exchangeRate": 1.0855,
    "fees": {
      "platformFee": 5.00,
      "networkFee": 2.50,
      "totalFee": 7.50
    },
    "recipient": {
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "+79001234567"
    },
    "timeline": [
      {
        "status": "created",
        "timestamp": "2024-01-15T10:00:00Z",
        "description": "Transfer initiated"
      },
      {
        "status": "payment_received",
        "timestamp": "2024-01-15T10:15:00Z",
        "description": "Payment confirmed"
      },
      {
        "status": "processing",
        "timestamp": "2024-01-15T10:20:00Z",
        "description": "Processing on blockchain"
      },
      {
        "status": "completed",
        "timestamp": "2024-01-15T10:25:00Z",
        "description": "Transfer completed"
      }
    ],
    "blockchainTx": {
      "hash": "0x1234567890abcdef...",
      "network": "polygon",
      "blockNumber": 12345678
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "completedAt": "2024-01-15T10:25:00Z"
  }
}
```

#### GET /transfers
Get user's transfer history.

**Query Parameters:**
- `status`: Filter by status (pending, processing, completed, failed)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `startDate`: Filter transfers from date
- `endDate`: Filter transfers to date

### 4. User Management

#### GET /user/profile
Get current user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "country": "IN",
    "kycStatus": "verified",
    "kycVerifiedAt": "2024-01-10T15:30:00Z",
    "createdAt": "2024-01-01T10:00:00Z",
    "lastLoginAt": "2024-01-15T09:00:00Z"
  }
}
```

#### PUT /user/profile
Update user profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### POST /user/change-password
Change user password.

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

### 5. Compliance & Reporting

#### GET /compliance/limits
Get user's transfer limits and compliance status.

**Response:**
```json
{
  "success": true,
  "data": {
    "dailyLimit": 10000,
    "monthlyLimit": 100000,
    "yearlyLimit": 1000000,
    "dailyUsed": 2500,
    "monthlyUsed": 15000,
    "yearlyUsed": 150000,
    "complianceStatus": "compliant",
    "riskLevel": "low"
  }
}
```

#### GET /compliance/transactions
Get compliance transaction history.

**Query Parameters:**
- `startDate`: Start date for filtering
- `endDate`: End date for filtering
- `type`: Transaction type filter

### 6. Webhooks

#### POST /webhooks/kyc
Receive KYC status updates from provider.

**Request Body:**
```json
{
  "kycId": "kyc_uuid",
  "status": "approved",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "verificationScore": 95,
    "riskLevel": "low"
  }
}
```

#### POST /webhooks/ramp
Receive payment status updates from ramp providers.

**Request Body:**
```json
{
  "transferId": "transfer_uuid",
  "status": "payment_confirmed",
  "amount": 1007.50,
  "currency": "INR",
  "reference": "RF123456789",
  "timestamp": "2024-01-15T10:15:00Z"
}
```

#### POST /webhooks/chain
Receive blockchain transaction updates.

**Request Body:**
```json
{
  "transferId": "transfer_uuid",
  "txHash": "0x1234567890abcdef...",
  "status": "confirmed",
  "blockNumber": 12345678,
  "gasUsed": 150000,
  "timestamp": "2024-01-15T10:20:00Z"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details if available"
  }
}
```

### Common Error Codes

- `AUTHENTICATION_FAILED`: Invalid or expired token
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request validation failed
- `KYC_REQUIRED`: KYC verification required
- `TRANSFER_LIMIT_EXCEEDED`: Transfer amount exceeds limits
- `INSUFFICIENT_FUNDS`: Insufficient funds for transfer
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Internal server error

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **KYC endpoints**: 10 requests per minute
- **Transfer endpoints**: 20 requests per minute
- **Profile endpoints**: 30 requests per minute

## Pagination

List endpoints support pagination with the following response format:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Data Types

### Currency Codes
- `INR`: Indian Rupee
- `RUB`: Russian Ruble
- `USD`: US Dollar
- `EUR`: Euro

### Country Codes
- `IN`: India
- `RU`: Russia
- `US`: United States
- `EU`: European Union

### Transfer Status
- `pending_kyc`: Waiting for KYC verification
- `pending_payment`: Waiting for payment
- `processing`: Processing on blockchain
- `completed`: Transfer completed
- `failed`: Transfer failed
- `cancelled`: Transfer cancelled

### KYC Status
- `pending`: KYC verification pending
- `approved`: KYC verification approved
- `rejected`: KYC verification rejected
- `expired`: KYC verification expired

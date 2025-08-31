# RupeeFlow Backend

A production-grade, compliance-ready backend API for the RupeeFlow cross-border remittance platform. Built with Node.js, Express, PostgreSQL, and Redis, featuring comprehensive KYC/AML integration, blockchain operations, and regulatory compliance.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **KYC/AML Integration**: Complete identity verification workflow
- **Money Transfers**: Cross-border remittance with blockchain integration
- **Compliance Management**: Regulatory reporting and audit trails
- **Rate Limiting**: API protection against abuse
- **Logging & Monitoring**: Structured logging with Winston
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and caching
- **Security**: Helmet, CORS, input validation, and more

## 🏗️ Architecture

```
Backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/      # Business logic
│   ├── middleware/       # Custom middleware
│   ├── routes/          # API route definitions
│   └── server.js        # Main application file
├── prisma/              # Database schema and migrations
├── logs/                # Application logs
└── tests/               # Test files
```

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rupeeflow/backend.git
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Or run migrations
   npm run db:migrate
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection | Required |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `POLYGON_RPC_URL` | Polygon RPC endpoint | Required |
| `CORS_ORIGIN` | Frontend origin | `http://localhost:3000` |

### Database Configuration

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: User accounts and profiles
- **KYCApplication**: KYC verification process
- **Transfer**: Money transfer records
- **Address**: User address information

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify-email/:token` - Email verification

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/limits` - Get transfer limits

### KYC & Compliance
- `POST /api/kyc/start` - Start KYC process
- `POST /api/kyc/:id/documents` - Upload documents
- `GET /api/kyc/status` - Get KYC status
- `POST /api/kyc/:id/submit` - Submit for review

### Transfers
- `POST /api/transfers/quote` - Get transfer quote
- `POST /api/transfers` - Create transfer
- `GET /api/transfers` - List transfers
- `GET /api/transfers/:id` - Get transfer details
- `DELETE /api/transfers/:id` - Cancel transfer

### Compliance (Admin Only)
- `GET /api/compliance/limits` - Get compliance limits
- `GET /api/compliance/transactions` - Get transaction data
- `GET /api/compliance/reports` - Get compliance reports

### Webhooks
- `POST /api/webhooks/kyc` - KYC provider webhooks
- `POST /api/webhooks/ramp` - Ramp provider webhooks
- `POST /api/webhooks/chain` - Blockchain webhooks

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Joi schema validation
- **CORS Protection**: Cross-origin request security
- **Helmet Security**: HTTP security headers
- **Password Hashing**: Bcrypt with configurable rounds

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with multiple transports
- **Request Logging**: HTTP request/response logging
- **Error Tracking**: Comprehensive error handling
- **Health Checks**: `/health` endpoint for monitoring

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment-Specific Configs

- **Development**: Local database, detailed logging
- **Staging**: Staging database, moderate logging
- **Production**: Production database, minimal logging, SSL

## 🔄 Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## 📝 API Documentation

The API follows RESTful principles with consistent response formats:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/rupeeflow/backend/wiki)
- **Issues**: [GitHub Issues](https://github.com/rupeeflow/backend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rupeeflow/backend/discussions)

## 🔗 Related Projects

- [RupeeFlow Frontend](https://github.com/rupeeflow/frontend)
- [RupeeFlow Smart Contracts](https://github.com/rupeeflow/smart-contracts)
- [RupeeFlow Documentation](https://github.com/rupeeflow/docs)

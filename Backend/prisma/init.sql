-- RupeeFlow Database Initialization Script
-- This script sets up the initial database structure

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types if they don't exist
DO $$ BEGIN
    CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'REQUIRES_ADDITIONAL_INFO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "KYCStep" AS ENUM ('NOT_STARTED', 'DOCUMENT_UPLOAD', 'VERIFICATION_IN_PROGRESS', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DocumentType" AS ENUM ('PASSPORT', 'AADHAAR', 'DRIVING_LICENSE', 'ADDRESS_PROOF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransferPurpose" AS ENUM ('FAMILY_SUPPORT', 'EDUCATION', 'BUSINESS', 'INVESTMENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'COMPLIANCE_OFFICER', 'OPERATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users("kycStatus");
CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers("userId");
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers("createdAt");
CREATE INDEX IF NOT EXISTS idx_kyc_applications_user_id ON "kycApplications"("userId");
CREATE INDEX IF NOT EXISTS idx_kyc_applications_status ON "kycApplications"(status);

-- Insert default admin user (password: admin123)
INSERT INTO users (
    id, 
    email, 
    password, 
    "firstName", 
    "lastName", 
    phone, 
    "dateOfBirth", 
    nationality, 
    "kycStatus", 
    role, 
    "isActive", 
    "isEmailVerified",
    "createdAt",
    "updatedAt"
) VALUES (
    'admin-uuid-here',
    'admin@rupeeflow.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QqHhK2', -- admin123
    'Admin',
    'User',
    '+1234567890',
    '1990-01-01',
    'US',
    'VERIFIED',
    'ADMIN',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert default compliance officer
INSERT INTO users (
    id, 
    email, 
    password, 
    "firstName", 
    "lastName", 
    phone, 
    "dateOfBirth", 
    nationality, 
    "kycStatus", 
    role, 
    "isActive", 
    "isEmailVerified",
    "createdAt",
    "updatedAt"
) VALUES (
    'compliance-uuid-here',
    'compliance@rupeeflow.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QqHhK2', -- admin123
    'Compliance',
    'Officer',
    '+1234567891',
    '1990-01-01',
    'US',
    'VERIFIED',
    'COMPLIANCE_OFFICER',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_applications_updated_at BEFORE UPDATE ON "kycApplications" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rupeeflow;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rupeeflow;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rupeeflow;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'RupeeFlow database initialized successfully!';
    RAISE NOTICE 'Default admin user: admin@rupeeflow.com / admin123';
    RAISE NOTICE 'Default compliance officer: compliance@rupeeflow.com / admin123';
END $$;

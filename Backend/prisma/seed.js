/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', parseInt(process.env.BCRYPT_ROUNDS || '12', 10));

  const users = [
    {
      id: 'admin-uuid-here',
      email: 'admin@rupeeflow.com',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'US',
      kycStatus: 'VERIFIED',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    },
    {
      id: 'compliance-uuid-here',
      email: 'compliance@rupeeflow.com',
      firstName: 'Compliance',
      lastName: 'Officer',
      phone: '+1234567891',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'US',
      kycStatus: 'VERIFIED',
      role: 'COMPLIANCE_OFFICER',
      isActive: true,
      isEmailVerified: true,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        password: passwordHash,
        createdAt: new Date(),
      },
    });
  }

  console.log('✅ Seed completed: default users are present');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



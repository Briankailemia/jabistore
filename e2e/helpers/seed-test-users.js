/**
 * Helper script to create test users for Playwright tests
 * 
 * Run this before running tests:
 * node e2e/helpers/seed-test-users.js
 * 
 * Or integrate into your main seed script
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('Creating test users for Playwright tests...');

  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'admin123',
      name: 'Test Admin',
      role: 'ADMIN',
    },
    {
      email: 'moderator@test.com',
      password: 'moderator123',
      name: 'Test Moderator',
      role: 'MODERATOR',
    },
    {
      email: 'user@test.com',
      password: 'user123',
      name: 'Test User',
      role: 'USER',
    },
  ];

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        // Update existing user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            password: hashedPassword,
            role: userData.role,
            name: userData.name,
          },
        });
        console.log(`✓ Updated test user: ${userData.email} (${userData.role})`);
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
            emailVerified: new Date(),
          },
        });
        console.log(`✓ Created test user: ${userData.email} (${userData.role})`);
      }
    } catch (error) {
      console.error(`✗ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log('\nTest users ready!');
}

createTestUsers()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


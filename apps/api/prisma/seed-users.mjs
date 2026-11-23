import dotenv from 'dotenv';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';

dotenv.config({ path: '../../.env' });

if (process.env.NODE_ENV === 'production') {
  throw new Error('User reset/seed is disabled in production.');
}
if (process.env.RESET_USERS !== 'true') {
  throw new Error('Set RESET_USERS=true to confirm deleting existing users and their cascaded data.');
}

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set in the local .env file.`);
  return value;
};

const debugPassword = required('SEED_DEBUG_ADMIN_PASSWORD');
const dictatorEmail = required('SEED_DICTATOR_EMAIL').toLowerCase();
const dictatorPassword = required('SEED_DICTATOR_PASSWORD');
if (debugPassword.length < 1 || dictatorPassword.length < 1) {
  throw new Error('Seed passwords must not be empty.');
}

const passwordOptions = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 };
const [debugHash, dictatorHash] = await Promise.all([
  argon2.hash(debugPassword, passwordOptions),
  argon2.hash(dictatorPassword, passwordOptions),
]);
const connectionString = required('DATABASE_URL');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  await prisma.$transaction(async (tx) => {
    await tx.user.deleteMany();
    await tx.user.createMany({
      data: [
        { username: 'admin', email: null, passwordHash: debugHash, role: 'ADMIN' },
        { username: 'diktator', email: dictatorEmail, passwordHash: dictatorHash, role: 'ADMIN' },
      ],
    });
  });
  process.stdout.write('Local user reset completed; two administrator accounts are ready.\n');
} finally {
  await prisma.$disconnect();
}

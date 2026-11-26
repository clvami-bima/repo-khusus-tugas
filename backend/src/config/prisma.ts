import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { env } from './env';

// Satu instance PrismaClient dipakai bersama oleh seluruh service.
// Koneksi diambil dari DATABASE_URL (.env) -- jangan hardcode kredensial.
const adapter = new PrismaPg({ connectionString: env.databaseUrl });

export const prisma = new PrismaClient({ adapter });

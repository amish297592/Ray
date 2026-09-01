import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * Serverless Production Database Resolution Handler
 * On Vercel, the main filesystem is read-only.
 * If running on Vercel with SQLite file-based database:
 * Copy the seeded database to writable /tmp/dev.db if not already present.
 */
function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || 'file:./dev.db';

  if (process.env.VERCEL && envUrl.startsWith('file:')) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const possibleSources = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.join(__dirname, '..', 'prisma', 'dev.db'),
        path.join(__dirname, '..', 'dev.db'),
      ];

      for (const sourcePath of possibleSources) {
        if (fs.existsSync(sourcePath)) {
          try {
            fs.copyFileSync(sourcePath, tmpDbPath);
            break;
          } catch (e) {
            console.error(`[Prisma Vercel Init] Failed to copy ${sourcePath} to ${tmpDbPath}:`, e);
          }
        }
      }
    }
    return 'file:/tmp/dev.db';
  }

  return envUrl;
}

const activeDbUrl = resolveDatabaseUrl();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

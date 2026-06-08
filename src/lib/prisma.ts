import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma: PrismaClient;
let pool: Pool | undefined;

if (process.env.NODE_ENV === 'production') {
  const connectionString = process.env.DATABASE_URL;
  pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
    pool?: Pool;
  };

  if (!globalWithPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL || "postgresql://donutuser:donutpassword@localhost:5432/donutmarket?schema=public";
    pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    globalWithPrisma.pool = pool;
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
  pool = globalWithPrisma.pool;
}

export { prisma, pool };
export default prisma;

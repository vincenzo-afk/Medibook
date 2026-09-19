// Prisma client singleton (production path: PostgreSQL via Neon).
// Demo mode runs on the in-memory store so `pnpm dev` works with no DATABASE_URL.
import { PrismaClient } from '@prisma/client'

const globalClient = globalThis as unknown as { __prisma?: PrismaClient }

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null
  if (!globalClient.__prisma) {
    globalClient.__prisma = new PrismaClient()
  }
  return globalClient.__prisma
}

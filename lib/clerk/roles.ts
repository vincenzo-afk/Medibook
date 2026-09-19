import { cookies } from 'next/headers'

import { ForbiddenError, UnauthorizedError } from '@/lib/errors'
import { DEMO_CTX, ROLE_COOKIE, VALID_ROLES, type Ctx } from '@/lib/clerk/types'

function hasClerk(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  )
}

/**
 * Resolve the request context.
 * Production: Clerk session claims (role + hospitalId). See ARCHITECTURE.md §3.
 * Demo (no Clerk keys): role from `mb-role` cookie, defaults to patient.
 */
export async function getCtx(): Promise<Ctx> {
  if (hasClerk()) {
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const session = await auth()
      const userId = session.userId
      const claims = session.sessionClaims as
        | { role?: unknown; hospitalId?: unknown }
        | undefined
      const role = claims?.role
      if (!userId || typeof role !== 'string' || !VALID_ROLES.includes(role as Ctx['role'])) {
        throw new UnauthorizedError()
      }
      const hospitalId =
        typeof claims?.hospitalId === 'string' ? claims.hospitalId : 'hospital-1'
      return { userId, role: role as Ctx['role'], hospitalId }
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err
      // Fall through to demo mode if Clerk misbehaves locally.
    }
  }
  const store = await cookies()
  const cookieRole = store.get(ROLE_COOKIE)?.value
  const role: Ctx['role'] =
    cookieRole === 'doctor' || cookieRole === 'admin' ? cookieRole : 'patient'
  return DEMO_CTX[role]
}

export async function requireRole(role: Ctx['role'] | Ctx['role'][]): Promise<Ctx> {
  const ctx = await getCtx()
  const allowed = Array.isArray(role) ? role : [role]
  if (!allowed.includes(ctx.role)) {
    throw new ForbiddenError(`Requires role: ${allowed.join(' or ')}`)
  }
  return ctx
}

export async function requireUser(): Promise<Ctx> {
  return getCtx()
}

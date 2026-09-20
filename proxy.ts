import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Route-level protection (Next.js 16 `proxy` convention).
 * Production: Clerk middleware verifies the session JWT and enforces
 * role vs. route-group (/patient/*, /doctor/*, /admin/*).
 * Demo (no Clerk keys): permissive pass-through; role guards live in
 * Server Components / Server Actions via requireRole().
 */
export default function proxy(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

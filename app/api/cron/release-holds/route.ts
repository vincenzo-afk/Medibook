import { NextResponse } from 'next/server'

import { DEMO_CTX } from '@/lib/clerk/types'
import { releaseHolds } from '@/lib/db/queries'

/**
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically for cron
 * jobs when CRON_SECRET is set. In production the secret is mandatory —
 * an open cron endpoint would let anyone trigger sweeps.
 */
export function isAuthorizedCron(req: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return process.env.VERCEL !== '1'
  }
  return req.headers.get('authorization') === `Bearer ${expected}`
}

/** Vercel Cron every minute — releases holds past heldUntil. Guarded by CRON_SECRET. */
export async function POST(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const result = await releaseHolds(DEMO_CTX.admin)
  return NextResponse.json({ ok: true, ...result })
}

export async function GET(req: Request) {
  return POST(req)
}

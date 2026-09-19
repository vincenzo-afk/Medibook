import { NextResponse } from 'next/server'

import { DEMO_CTX } from '@/lib/clerk/types'
import { releaseHolds } from '@/lib/db/queries'

/** Vercel Cron every minute — releases holds past heldUntil. Guarded by CRON_SECRET. */
export async function POST(req: Request) {
  const secret = req.headers.get('authorization')
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const result = await releaseHolds(DEMO_CTX.admin)
  return NextResponse.json({ ok: true, ...result })
}

export async function GET(req: Request) {
  return POST(req)
}

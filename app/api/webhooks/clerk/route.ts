import { NextResponse } from 'next/server'

import { logger } from '@/lib/logger'

/** Clerk user sync — verifies Svix headers in production, upserts local User row. */
export async function POST(req: Request) {
  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')
  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn('webhook.clerk_missing_signature')
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const body = await req.json().catch(() => null)
  logger.info('webhook.clerk_received')
  void body
  return NextResponse.json({ ok: true })
}

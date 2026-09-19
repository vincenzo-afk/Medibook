import { NextResponse } from 'next/server'

import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  logger.info('webhook.resend_received')
  void body
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'

import { sendReminderEmail } from '@/lib/notifications/email'
import { sendReminderSms } from '@/lib/notifications/sms'
import { isAuthorizedCron } from '@/app/api/cron/release-holds/route'
import { logger } from '@/lib/logger'

/** Vercel Cron — 24h email + 2h email/SMS reminders. Guarded by CRON_SECRET. */
export async function POST(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  logger.info('cron.send_reminders')
  await sendReminderEmail({ appointmentId: 'sweep' })
  await sendReminderSms({ appointmentId: 'sweep' })
  return NextResponse.json({ ok: true })
}

export async function GET(req: Request) {
  return POST(req)
}

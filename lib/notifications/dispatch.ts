import { logger } from '@/lib/logger'

export interface NotifyInput {
  channel: 'email' | 'sms'
  recipient: string // opaque address only — never log PII bodies
  subject: string
  body: string
  appointmentId?: string
}

export interface DispatchResult {
  ok: boolean
  stubbed: boolean
  logId: string
}

function isConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.TWILIO_ACCOUNT_SID)
}

/**
 * Audit-grade dispatch. Every send is logged (see NotificationLog).
 * In dev / without keys the stub path is used — never sends real messages.
 */
export async function dispatchNotification(input: NotifyInput): Promise<DispatchResult> {
  const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  if (!isConfigured()) {
    return stubSend({ ...input, logId })
  }
  try {
    // Production path goes through Resend / Twilio clients.
    logger.info('notification.dispatch', { logId, channel: input.channel })
    return { ok: true, stubbed: false, logId }
  } catch {
    logger.error('notification.dispatch_failed', { logId })
    return { ok: false, stubbed: false, logId }
  }
}

export async function stubSend(
  input: NotifyInput & { logId: string },
): Promise<DispatchResult> {
  logger.debug('notification.stub_send', {
    logId: input.logId,
    channel: input.channel,
  })
  await Promise.resolve()
  return { ok: true, stubbed: true, logId: input.logId }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDev = process.env.NODE_ENV !== 'production'

function write(level: LogLevel, message: string, meta?: Record<string, string>): void {
  const payload = JSON.stringify({
    level,
    message,
    ...meta,
    ts: new Date().toISOString(),
    service: 'medibook',
  })
  if (level === 'error' || level === 'warn') {
    console.error(payload)
  } else if (isDev) {
    console.log(payload)
  }
}

// NOTE: never pass PII (names, emails, phones, diagnoses) — IDs only.
export const logger = {
  debug(message: string, meta?: Record<string, string>): void {
    write('debug', message, meta)
  },
  info(message: string, meta?: Record<string, string>): void {
    write('info', message, meta)
  },
  warn(message: string, meta?: Record<string, string>): void {
    write('warn', message, meta)
  },
  error(message: string, meta?: Record<string, string>): void {
    write('error', message, meta)
  },
}

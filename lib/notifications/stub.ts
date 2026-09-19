/**
 * Dev stubs — always used when RESEND_API_KEY / TWILIO_* are unset.
 * Never send real emails or SMS in dev.
 */
export async function stubEmailSend(): Promise<{ ok: true; stubbed: true }> {
  await Promise.resolve()
  return { ok: true, stubbed: true }
}

export async function stubSmsSend(): Promise<{ ok: true; stubbed: true }> {
  await Promise.resolve()
  return { ok: true, stubbed: true }
}

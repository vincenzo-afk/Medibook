import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'careflow-booking-app-dug64q1j',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_JnhpC1EldrCmsXynztf_yCH7Fqgsm9_L',
  authRequired: false,
  auth: { mode: 'managed' },
})

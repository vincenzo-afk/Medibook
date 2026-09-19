import { dispatchNotification } from '@/lib/notifications/dispatch'

export async function sendReminderSms(input: { appointmentId: string }): Promise<void> {
  await dispatchNotification({
    channel: 'sms',
    recipient: 'patient-phone',
    subject: 'Appointment reminder',
    body: 'Reminder: your appointment is in 2 hours.',
    appointmentId: input.appointmentId,
  })
}

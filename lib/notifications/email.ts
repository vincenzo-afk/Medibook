import { dispatchNotification } from '@/lib/notifications/dispatch'

export async function sendBookingConfirmationEmail(input: {
  appointmentId: string
}): Promise<void> {
  await dispatchNotification({
    channel: 'email',
    recipient: 'patient',
    subject: 'Appointment confirmed',
    body: 'Your appointment has been confirmed.',
    appointmentId: input.appointmentId,
  })
}

export async function sendReminderEmail(input: { appointmentId: string }): Promise<void> {
  await dispatchNotification({
    channel: 'email',
    recipient: 'patient',
    subject: 'Appointment reminder',
    body: 'Reminder: your appointment is coming up.',
    appointmentId: input.appointmentId,
  })
}

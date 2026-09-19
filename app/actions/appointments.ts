'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@/lib/clerk/roles'
import {
  cancelAppointment,
  createAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
} from '@/lib/db/queries'
import { toSafeErrorMessage } from '@/lib/errors'
import { sendBookingConfirmationEmail } from '@/lib/notifications/email'
import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
} from '@/lib/validations/appointment'

export async function bookAppointmentAction(
  input: unknown,
): Promise<{ ok: boolean; error: string }> {
  try {
    const ctx = await requireRole('patient')
    const data = bookAppointmentSchema.parse(input)
    // Demo patient identity — production resolves from the Patient table.
    const appointment = await createAppointment(ctx, {
      patientId: 'patient-1',
      patientName: 'Adaeze Eze',
      doctorId: data.doctorId,
      slotId: data.slotId,
      reason: data.reason,
    })
    // Notifications never fail the booking.
    try {
      await sendBookingConfirmationEmail({ appointmentId: appointment.id })
    } catch {
      // Logged inside the dispatcher.
    }
    revalidatePath('/patient/appointments')
    revalidatePath('/doctor')
    revalidatePath('/admin')
    return { ok: true, error: '' }
  } catch (err) {
    return { ok: false, error: toSafeErrorMessage(err) }
  }
}

export async function cancelAppointmentAction(
  input: unknown,
): Promise<{ ok: boolean; error: string }> {
  try {
    const ctx = await requireRole(['patient', 'doctor', 'admin'])
    const data = cancelAppointmentSchema.parse(input)
    await cancelAppointment(ctx, data.appointmentId)
    revalidatePath('/patient/appointments')
    revalidatePath('/doctor')
    revalidatePath('/admin')
    return { ok: true, error: '' }
  } catch (err) {
    return { ok: false, error: toSafeErrorMessage(err) }
  }
}

export async function rescheduleAppointmentAction(
  input: unknown,
): Promise<{ ok: boolean; error: string }> {
  try {
    const ctx = await requireRole(['patient', 'admin'])
    const data = rescheduleAppointmentSchema.parse(input)
    await rescheduleAppointment(ctx, data.appointmentId, data.newSlotId)
    revalidatePath('/patient/appointments')
    revalidatePath('/doctor')
    revalidatePath('/admin')
    return { ok: true, error: '' }
  } catch (err) {
    return { ok: false, error: toSafeErrorMessage(err) }
  }
}

export async function updateAppointmentStatusAction(
  input: unknown,
): Promise<{ ok: boolean; error: string }> {
  try {
    const ctx = await requireRole(['doctor', 'admin'])
    const data = updateAppointmentStatusSchema.parse(input)
    await updateAppointmentStatus(ctx, data.appointmentId, data.status)
    revalidatePath('/doctor')
    revalidatePath('/admin')
    return { ok: true, error: '' }
  } catch (err) {
    return { ok: false, error: toSafeErrorMessage(err) }
  }
}

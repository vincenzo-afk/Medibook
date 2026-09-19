import { z } from 'zod'

export const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'doctorId is required'),
  slotId: z.string().min(1, 'slotId is required'),
  reason: z.string().trim().max(500).optional(),
})

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'appointmentId is required'),
  reason: z.string().trim().max(500).optional(),
})

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'appointmentId is required'),
  newSlotId: z.string().min(1, 'newSlotId is required'),
})

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>

export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.string().min(1, 'appointmentId is required'),
  status: z.enum(['confirmed', 'pending', 'cancelled', 'completed']),
})

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>

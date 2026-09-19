import { z } from 'zod'

export const medicationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dosage: z.string().trim().min(1).max(60),
  frequency: z.string().trim().min(1).max(60),
  duration: z.string().trim().min(1).max(60),
  instructions: z.string().trim().max(500).optional(),
})

export const createPrescriptionSchema = z.object({
  appointmentId: z.string().min(1, 'appointmentId is required'),
  patientId: z.string().min(1, 'patientId is required'),
  diagnosis: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).optional(),
  medications: z.array(medicationSchema).min(1).max(12),
})

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>

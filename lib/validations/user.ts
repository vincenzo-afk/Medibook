import { z } from 'zod'

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  role: z.enum(['patient', 'doctor', 'admin']),
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>

export const doctorProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  specialty: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(2000).optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  feeCents: z.number().int().min(0).max(100000),
})

export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>

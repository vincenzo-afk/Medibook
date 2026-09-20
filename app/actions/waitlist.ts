'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/clerk/roles'
import { joinWaitlist, leaveWaitlist } from '@/lib/db/queries'
import { toSafeErrorMessage } from '@/lib/errors'

const joinWaitlistSchema = z.object({
  doctorId: z.string().min(1, 'doctorId is required'),
})

const leaveWaitlistSchema = z.object({
  waitlistId: z.string().min(1, 'waitlistId is required'),
})

export async function joinWaitlistAction(
  input: unknown,
): Promise<{ ok: boolean; error: string }> {
  try {
    const ctx = await requireRole('patient')
    const data = joinWaitlistSchema.parse(input)
    await joinWaitlist(ctx, {
      doctorId: data.doctorId,
      patientId: 'patient-1',
      patientName: 'Adaeze Eze',
    })
    revalidatePath('/patient/appointments')
    return { ok: true, error: '' }
  } catch (err) {
    return { ok: false, error: toSafeErrorMessage(err) }
  }
}

export async function leaveWaitlistAction(
  input: unknown,
): Promise<{ ok: boolean; error: string }> {
  try {
    const ctx = await requireRole('patient')
    const data = leaveWaitlistSchema.parse(input)
    await leaveWaitlist(ctx, data.waitlistId)
    revalidatePath('/patient/appointments')
    return { ok: true, error: '' }
  } catch (err) {
    return { ok: false, error: toSafeErrorMessage(err) }
  }
}

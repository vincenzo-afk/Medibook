'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@/lib/clerk/roles'
import { createSlot, holdSlot } from '@/lib/db/queries'
import { toSafeErrorMessage } from '@/lib/errors'
import { createSlotSchema, holdSlotSchema } from '@/lib/validations/slot'

export async function createSlotAction(input: unknown): Promise<{ ok: boolean; error: string }> {
  try {
    const ctx = await requireRole(['doctor', 'admin'])
    const data = createSlotSchema.parse(input)
    const { validateSlotWindow } = await import('@/lib/validations/slot')
    if (!validateSlotWindow(data.startsAt, data.endsAt)) {
      return { ok: false, error: 'End time must be after start time.' }
    }
    await createSlot(ctx, data)
    revalidatePath('/doctor/schedule')
    return { ok: true, error: '' }
  } catch (err) {
    return { ok: false, error: toSafeErrorMessage(err) }
  }
}

export async function holdSlotAction(input: unknown): Promise<{ ok: boolean; error: string }> {
  try {
    const ctx = await requireRole('patient')
    const data = holdSlotSchema.parse(input)
    await holdSlot(ctx, data.slotId)
    return { ok: true, error: '' }
  } catch (err) {
    return { ok: false, error: toSafeErrorMessage(err) }
  }
}

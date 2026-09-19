import { z } from 'zod'

export const createSlotSchema = z.object({
  doctorId: z.string().min(1, 'doctorId is required'),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
})

export type CreateSlotInput = z.infer<typeof createSlotSchema>

export const holdSlotSchema = z.object({
  slotId: z.string().min(1, 'slotId is required'),
})

export type HoldSlotInput = z.infer<typeof holdSlotSchema>

export function validateSlotWindow(startsAt: string, endsAt: string): boolean {
  return new Date(endsAt).getTime() > new Date(startsAt).getTime()
}

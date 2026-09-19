export const MAX_SLOT_HOLD_MINUTES = 10

export interface HoldableSlot {
  status: 'open' | 'held' | 'booked'
  heldUntil: string | null
}

/** A hold is live only while status is held and heldUntil is in the future. */
export function isHoldActive(slot: HoldableSlot, now: number = Date.now()): boolean {
  if (slot.status !== 'held') return false
  if (!slot.heldUntil) return false
  return new Date(slot.heldUntil).getTime() > now
}

/** Slots past their hold window must be released back to open. */
export function isHoldExpired(slot: HoldableSlot, now: number = Date.now()): boolean {
  if (slot.status !== 'held') return false
  if (!slot.heldUntil) return true
  return new Date(slot.heldUntil).getTime() <= now
}

export function holdExpiresAt(
  from: number = Date.now(),
  minutes: number = MAX_SLOT_HOLD_MINUTES,
): string {
  return new Date(from + minutes * 60_000).toISOString()
}

/** Optimistic-locking guard: only open (or expired-hold) slots can be booked. */
export function canBookSlot(slot: HoldableSlot, now: number = Date.now()): boolean {
  if (slot.status === 'open') return true
  if (slot.status === 'held' && isHoldExpired(slot, now)) return true
  return false
}

/**
 * Finalize guard for the booking transaction: the hold reserves the slot for
 * whoever completes checkout first, so open + held (active or expired) may
 * finalize. Only booked slots reject.
 */
export function canFinalizeBooking(slot: HoldableSlot): boolean {
  return slot.status === 'open' || slot.status === 'held'
}

export function groupSlotsByDay<T extends { startsAt: string }>(slots: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const slot of slots) {
    const day = slot.startsAt.slice(0, 10)
    const list = map.get(day)
    if (list) list.push(slot)
    else map.set(day, [slot])
  }
  for (const list of Array.from(map.values())) {
    list.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  }
  return new Map(Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])))
}

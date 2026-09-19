import { describe, expect, it } from 'vitest'

import {
  canBookSlot,
  canFinalizeBooking,
  groupSlotsByDay,
  holdExpiresAt,
  isHoldActive,
  isHoldExpired,
  MAX_SLOT_HOLD_MINUTES,
} from '@/lib/slots/calc'

describe('slot hold logic', () => {
  const now = Date.now()

  it('treats open slots as bookable', () => {
    expect(canBookSlot({ status: 'open', heldUntil: null }, now)).toBe(true)
  })

  it('rejects booked slots', () => {
    expect(canBookSlot({ status: 'booked', heldUntil: null }, now)).toBe(false)
  })

  it('keeps active holds unbookable', () => {
    const heldUntil = new Date(now + 5 * 60_000).toISOString()
    expect(isHoldActive({ status: 'held', heldUntil }, now)).toBe(true)
    expect(canBookSlot({ status: 'held', heldUntil }, now)).toBe(false)
  })

  it('releases expired holds back to bookable', () => {
    const heldUntil = new Date(now - 60_000).toISOString()
    expect(isHoldExpired({ status: 'held', heldUntil }, now)).toBe(true)
    expect(canBookSlot({ status: 'held', heldUntil }, now)).toBe(true)
  })

  it('lets the holder finalize an active hold, but never a booked slot', () => {
    const heldUntil = new Date(now + 5 * 60_000).toISOString()
    expect(canFinalizeBooking({ status: 'held', heldUntil })).toBe(true)
    expect(canFinalizeBooking({ status: 'open', heldUntil: null })).toBe(true)
    expect(canFinalizeBooking({ status: 'booked', heldUntil: null })).toBe(false)
  })

  it('computes a 10-minute hold window by default', () => {
    expect(MAX_SLOT_HOLD_MINUTES).toBe(10)
    const expires = new Date(holdExpiresAt(now)).getTime()
    expect(expires - now).toBe(10 * 60_000)
  })
})

describe('groupSlotsByDay', () => {
  it('groups and sorts slots by day then time', () => {
    const slots = [
      { startsAt: '2026-09-20T11:00:00.000Z' },
      { startsAt: '2026-09-19T10:00:00.000Z' },
      { startsAt: '2026-09-19T09:00:00.000Z' },
    ]
    const grouped = groupSlotsByDay(slots)
    expect(Array.from(grouped.keys())).toEqual(['2026-09-19', '2026-09-20'])
    expect(grouped.get('2026-09-19')?.map((s) => s.startsAt)).toEqual([
      '2026-09-19T09:00:00.000Z',
      '2026-09-19T10:00:00.000Z',
    ])
  })
})

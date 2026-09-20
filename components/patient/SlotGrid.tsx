'use client'

import { useMemo, useState } from 'react'

import type { Slot } from '@/lib/db/seed-data'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function SlotGrid({
  slots,
  selectedId,
  onSelect,
}: {
  slots: Slot[]
  selectedId: string | null
  onSelect: (slot: Slot) => void
}) {
  const days = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const slot of slots) {
      const day = slot.startsAt.slice(0, 10)
      const list = map.get(day)
      if (list) list.push(slot)
      else map.set(day, [slot])
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(0, 5)
  }, [slots])
  const [day, setDay] = useState<string | null>(days[0]?.[0] ?? null)
  const visible = days.find(([d]) => d === day)?.[1] ?? []

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {days.map(([d, list]) => {
          const open = list.filter((s) => s.status === 'open').length
          const date = new Date(`${d}T12:00:00`)
          const active = d === day
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={cn(
                'flex min-w-20 cursor-pointer flex-col items-center rounded-md border px-3 py-2 transition-colors duration-120',
                active
                  ? 'border-action bg-action/10 text-ink'
                  : 'border-hairline text-muted hover:border-action/50 hover:text-ink',
              )}
            >
              <span className="text-[11px] font-medium uppercase">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-sm font-semibold">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className={cn('text-[11px]', open > 0 ? 'text-success' : 'text-muted')}>
                {open} open
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {visible.map((slot) => {
          const disabled = slot.status !== 'open'
          const selected = slot.id === selectedId
          return (
            <button
              key={slot.id}
              disabled={disabled}
              onClick={() => onSelect(slot)}
              title={disabled ? `Slot ${slot.status}` : `Book ${formatTime(slot.startsAt)}`}
              className={cn(
                'h-9 cursor-pointer rounded-md text-[13px] font-medium tabular-nums',
                selected ? 'slot-selected' : disabled ? 'slot-booked' : 'slot-open',
              )}
            >
              {formatTime(slot.startsAt)}
            </button>
          )
        })}
      </div>
      {visible.length === 0 && (
        <p className="mt-3 text-sm text-muted">No slots for this day.</p>
      )}
    </div>
  )
}

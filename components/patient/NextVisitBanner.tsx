'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock } from 'lucide-react'

import type { Appointment } from '@/lib/db/seed-data'
import type { Doctor } from '@/lib/db/seed-data'
import { formatDateTime } from '@/lib/utils'

function parts(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function NextVisitBanner({
  appointment,
}: {
  appointment: (Appointment & { doctor: Doctor }) | null
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!appointment) return
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [appointment])

  if (!appointment) return null

  return (
    <Link
      href={`/patient/appointments/${appointment.id}`}
      className="enter enter-d1 flex items-center gap-3 rounded-lg border border-action/40 bg-action/10 px-4 py-3 transition-colors duration-150 hover:border-action"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-action text-white">
        <CalendarClock size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {appointment.doctor.name} · {formatDateTime(appointment.startsAt)}
        </p>
        <p className="text-xs text-muted">Tap for visit details, directions and actions</p>
      </div>
      <span className="shrink-0 rounded-md border border-action/40 bg-canvas px-2.5 py-1 text-sm font-semibold text-ink tabular-nums">
        {parts(new Date(appointment.startsAt).getTime() - now)}
      </span>
    </Link>
  )
}

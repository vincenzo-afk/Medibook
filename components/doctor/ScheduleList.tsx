'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

import type { Appointment } from '@/lib/db/seed-data'
import { updateAppointmentStatusAction } from '@/app/actions/appointments'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { formatTime } from '@/lib/utils'

export function ScheduleList({ appointments }: { appointments: Appointment[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function setStatus(id: string, status: 'confirmed' | 'cancelled' | 'completed') {
    setBusy(id)
    await updateAppointmentStatusAction({ appointmentId: id, status })
    setBusy(null)
    router.refresh()
  }

  if (appointments.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted">No appointments scheduled.</p>
  }

  return (
    <div>
      {appointments.map((a) => (
        <div key={a.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
          <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md border border-hairline text-xs font-semibold text-ink">
            {formatTime(a.startsAt)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{a.patientName}</p>
            <p className="truncate text-xs text-muted">{a.reason || 'No reason given'}</p>
          </div>
          <StatusPill status={a.status} />
          <div className="flex gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={busy === a.id}
              onClick={() => setStatus(a.id, 'confirmed')}
              aria-label={`Confirm ${a.id}`}
            >
              <Check size={14} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy === a.id}
              onClick={() => setStatus(a.id, 'cancelled')}
              aria-label={`Decline ${a.id}`}
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

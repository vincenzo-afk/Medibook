'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { cancelAppointmentAction } from '@/app/actions/appointments'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { formatDateTime } from '@/lib/utils'
import type { Appointment } from '@/lib/db/seed-data'
import type { Doctor } from '@/lib/db/seed-data'

export function AppointmentRow({
  appointment,
  doctor,
}: {
  appointment: Appointment
  doctor: Doctor
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const active = appointment.status === 'pending' || appointment.status === 'confirmed'

  async function cancel() {
    if (!confirm('Cancel this appointment?')) return
    setPending(true)
    await cancelAppointmentAction({ appointmentId: appointment.id })
    setPending(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-panel-2 text-xs font-semibold text-ink">
        {doctor.initials}
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={`/patient/appointments/${appointment.id}`}
          className="truncate text-sm font-medium text-ink transition-colors hover:text-white"
        >
          {doctor.name}
        </Link>
        <p className="truncate text-xs text-muted">
          {formatDateTime(appointment.startsAt)} · {doctor.specialty}
        </p>
        {appointment.reason && (
          <p className="truncate text-xs text-muted/70">{appointment.reason}</p>
        )}
      </div>
      <StatusPill status={appointment.status} />
      {active && (
        <div className="flex gap-1.5">
          <Link href={`/patient/appointments/${appointment.id}/reschedule`}>
            <Button variant="secondary" size="sm">
              Reschedule
            </Button>
          </Link>
          <Button variant="secondary" size="sm" disabled={pending} onClick={cancel}>
            {pending ? '…' : 'Cancel'}
          </Button>
        </div>
      )}
    </div>
  )
}

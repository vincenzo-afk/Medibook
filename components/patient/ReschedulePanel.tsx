'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import type { Appointment, Doctor, Slot } from '@/lib/db/seed-data'
import { rescheduleAppointmentAction } from '@/app/actions/appointments'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { SlotGrid } from '@/components/patient/SlotGrid'
import { formatDateTime } from '@/lib/utils'

export function ReschedulePanel({
  appointment,
  doctor,
  slots,
}: {
  appointment: Appointment
  doctor: Doctor
  slots: Slot[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Slot | null>(null)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const open = slots.filter((s) => s.status === 'open' && s.id !== appointment.slotId)

  async function confirm() {
    if (!selected) return
    setPending(true)
    setMessage('')
    const result = await rescheduleAppointmentAction({
      appointmentId: appointment.id,
      newSlotId: selected.id,
    })
    setPending(false)
    if (result.ok) {
      router.push('/patient/appointments')
      router.refresh()
    } else {
      setMessage(result.error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-ink">
          Reschedule with {doctor.name}
        </h2>
        <p className="text-xs text-muted">
          Currently {formatDateTime(appointment.startsAt)} · pick a new open slot
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        <SlotGrid slots={open} selectedId={selected?.id ?? null} onSelect={setSelected} />
        {message && (
          <p className="rounded-md border border-cancelled/30 bg-cancelled/10 px-3 py-2 text-[13px] text-cancelled">
            {message}
          </p>
        )}
        <Button disabled={!selected || pending} onClick={confirm} className="w-full" size="lg">
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? 'Moving…' : 'Confirm new time'}
        </Button>
      </CardBody>
    </Card>
  )
}

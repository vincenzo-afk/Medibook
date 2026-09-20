import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Download, MapPin } from 'lucide-react'

import { getCtx } from '@/lib/clerk/roles'
import { getAppointment, getDoctor, getPrescriptionByAppointment } from '@/lib/db/queries'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import { cn } from '@/lib/utils'

const STEPS = [
  { key: 'requested', label: 'Requested' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'visit', label: 'Visit' },
  { key: 'done', label: 'Complete' },
] as const

function stepIndex(status: string): number {
  switch (status) {
    case 'pending':
      return 1
    case 'confirmed':
      return 2
    case 'completed':
      return 4
    case 'cancelled':
      return -1
    default:
      return 1
  }
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getCtx()
  let appointment
  try {
    appointment = await getAppointment(ctx, id)
  } catch {
    notFound()
  }
  const [doctor, prescription] = await Promise.all([
    getDoctor(ctx, appointment.doctorId),
    getPrescriptionByAppointment(ctx, appointment.id),
  ])
  const active = appointment.status === 'pending' || appointment.status === 'confirmed'
  const current = stepIndex(appointment.status)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="enter">
        <CardBody>
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-panel-2 text-sm font-semibold text-ink">
              {doctor.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold tracking-tight text-ink">{doctor.name}</p>
              <p className="text-[13px] text-muted">
                {doctor.specialty} · {formatDateTime(appointment.startsAt)}
              </p>
            </div>
            <StatusPill status={appointment.status} />
          </div>

          <div className="mt-5 flex items-center">
            {STEPS.map((step, i) => {
              const done = current >= 0 && i < current
              const now = current === i + 1 || (current >= 4 && i === 3)
              return (
                <div key={step.key} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-300',
                        done || now
                          ? 'border-success bg-success/15 text-success'
                          : 'border-hairline text-muted',
                      )}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <span className={cn('text-[11px]', done || now ? 'text-ink' : 'text-muted')}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span className={cn('mx-2 mb-5 h-px flex-1', i + 1 < current ? 'bg-success/60' : 'bg-hairline')} />
                  )}
                </div>
              )
            })}
          </div>
          {appointment.status === 'cancelled' && (
            <p className="mt-2 rounded-md border border-cancelled/30 bg-cancelled/10 px-3 py-2 text-[13px] text-cancelled">
              This visit was cancelled. The slot was released back to {doctor.name}&apos;s calendar.
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="enter enter-d1">
        <CardHeader>
          <h3 className="text-sm font-semibold text-ink">Visit details</h3>
        </CardHeader>
        <CardBody className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted">Reason</span>
            <span className="max-w-60 truncate text-right text-ink">{appointment.reason || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Fee</span>
            <span className="font-semibold text-ink tabular-nums">{formatCurrency(doctor.feeCents)}</span>
          </div>
          <p className="flex items-center gap-2 pt-1 text-muted">
            <MapPin size={14} /> {doctor.hospital} · {doctor.address}
          </p>
          {prescription && (
            <Link
              href={`/patient/prescriptions`}
              className="mt-1 flex items-center justify-between rounded-md border border-hairline px-3 py-2 transition-colors hover:border-action"
            >
              <span className="text-ink">Prescription issued · {prescription.medications.length} medication(s)</span>
              <Download size={14} className="text-muted" />
            </Link>
          )}
        </CardBody>
      </Card>

      {active && (
        <div className="enter enter-d2 flex gap-2">
          <Link href={`/patient/appointments/${appointment.id}/reschedule`} className="flex-1">
            <Button variant="secondary" className="w-full">
              Reschedule <ArrowRight size={14} />
            </Button>
          </Link>
          <Link href="/patient/appointments" className="flex-1">
            <Button variant="ghost" className="w-full">
              Back to list
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

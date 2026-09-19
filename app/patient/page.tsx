import Link from 'next/link'
import { ArrowRight, CalendarDays, FileText } from 'lucide-react'

import { getCtx } from '@/lib/clerk/roles'
import { getAppointmentsForPatient, getDoctors, getPrescriptionsForPatient } from '@/lib/db/queries'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import { DoctorCard } from '@/components/patient/DoctorCard'
import { formatDateTime } from '@/lib/utils'

export default async function PatientOverviewPage() {
  const ctx = await getCtx()
  const [appointments, prescriptions, doctors] = await Promise.all([
    getAppointmentsForPatient(ctx, 'patient-1'),
    getPrescriptionsForPatient(ctx, 'patient-1'),
    getDoctors(ctx),
  ])
  const upcoming = appointments.filter((a) => a.status !== 'cancelled').slice(0, 3)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Upcoming', value: String(upcoming.length), hint: 'confirmed + pending' },
          { label: 'Prescriptions', value: String(prescriptions.length), hint: 'active records' },
          { label: 'Doctors', value: String(doctors.length), hint: 'across 8 specialties' },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-xs font-medium text-muted uppercase">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{s.value}</p>
              <p className="text-xs text-muted">{s.hint}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <CalendarDays size={15} className="text-muted" /> Upcoming appointments
              </h2>
              <Link href="/patient/appointments" className="text-xs font-medium text-action hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <div>
            {upcoming.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted">No upcoming appointments.</p>
            )}
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{a.doctor.name}</p>
                  <p className="text-xs text-muted">{formatDateTime(a.startsAt)}</p>
                </div>
                <StatusPill status={a.status} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FileText size={15} className="text-muted" /> Latest prescriptions
              </h2>
              <Link href="/patient/prescriptions" className="text-xs font-medium text-action hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <div>
            {prescriptions.slice(0, 3).map((rx) => (
              <div key={rx.id} className="border-b border-hairline px-4 py-3 last:border-0">
                <p className="text-sm font-medium text-ink">{rx.diagnosis}</p>
                <p className="text-xs text-muted">
                  {rx.doctor.name} · {rx.medications.length} medication(s)
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Book again</h2>
          <Link href="/patient/doctors">
            <Button variant="secondary" size="sm">
              All doctors <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.slice(0, 4).map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      </div>
    </div>
  )
}

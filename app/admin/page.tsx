import { Activity, CalendarDays, Stethoscope, Wallet } from 'lucide-react'

import { getCtx } from '@/lib/clerk/roles'
import { getAllAppointments, getDoctors, getHospitalMetrics } from '@/lib/db/queries'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'

export default async function AdminOverviewPage() {
  const ctx = await getCtx()
  const [metrics, appointments, doctors] = await Promise.all([
    getHospitalMetrics(ctx),
    getAllAppointments(ctx),
    getDoctors(ctx),
  ])
  const stats = [
    { icon: CalendarDays, label: 'Appointments', value: String(metrics.totalAppointments) },
    { icon: Stethoscope, label: 'Doctors', value: String(metrics.doctorsCount) },
    { icon: Wallet, label: 'Revenue', value: formatCurrency(metrics.revenueCents) },
    { icon: Activity, label: 'Cancel rate', value: `${metrics.noShowRate}%` },
  ]
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase">
                <s.icon size={13} /> {s.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{s.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-ink">Booking status</h2>
          </CardHeader>
          <CardBody className="space-y-2">
            {(
              [
                ['Confirmed', metrics.confirmed, 'bg-success'],
                ['Pending', metrics.pending, 'bg-pending'],
                ['Cancelled', metrics.cancelled, 'bg-cancelled'],
              ] as const
            ).map(([label, value, bar]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-20 text-[13px] text-muted">{label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                  <div
                    className={`h-full rounded-full ${bar}`}
                    style={{ width: `${metrics.totalAppointments === 0 ? 0 : Math.round((value / metrics.totalAppointments) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[13px] font-semibold text-ink">{value}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-ink">Doctors ({doctors.length})</h2>
          </CardHeader>
          <div>
            {doctors.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center gap-3 border-b border-hairline px-4 py-2.5 last:border-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel-2 text-[11px] font-semibold text-ink">
                  {d.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{d.name}</p>
                  <p className="text-xs text-muted">{d.specialty}</p>
                </div>
                <span className="text-xs text-muted">★ {d.rating}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-ink">Recent appointments</h2>
        </CardHeader>
        <div>
          {appointments.slice(0, 8).map((a) => (
            <div key={a.id} className="flex items-center gap-3 border-b border-hairline px-4 py-2.5 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{a.patientName}</p>
                <p className="text-xs text-muted">{formatDateTime(a.startsAt)}</p>
              </div>
              <StatusPill status={a.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

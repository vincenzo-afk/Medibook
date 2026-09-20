import { getCtx } from '@/lib/clerk/roles'
import { getAppointmentsForDoctor, getDoctorEarnings, getWaitlistForDoctor } from '@/lib/db/queries'
import { formatCurrency } from '@/lib/utils'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ScheduleList } from '@/components/doctor/ScheduleList'

export default async function DoctorTodayPage() {
  const ctx = await getCtx()
  const [appointments, earnings, waitlist] = await Promise.all([
    getAppointmentsForDoctor(ctx, 'doctor-1'),
    getDoctorEarnings(ctx, 'doctor-1'),
    getWaitlistForDoctor(ctx, 'doctor-1'),
  ])
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const todays = appointments.filter((a) => a.startsAt.slice(0, 10) <= todayKey).slice(0, 12)
  return (
    <div className="space-y-4">
      <div className="enter enter-d1 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Today's visits", value: String(todays.length) },
          { label: 'Confirmed', value: String(appointments.filter((a) => a.status === 'confirmed').length) },
          { label: 'Earnings', value: formatCurrency(earnings.revenueCents) },
          { label: 'Waitlist', value: String(waitlist.length) },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-ink tabular-nums">{s.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-ink">Today&apos;s schedule — Dr. Amara Okafor</h2>
        </CardHeader>
        <ScheduleList appointments={todays} />
      </Card>
    </div>
  )
}

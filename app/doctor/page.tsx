import { getCtx } from '@/lib/clerk/roles'
import { getAppointmentsForDoctor } from '@/lib/db/queries'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ScheduleList } from '@/components/doctor/ScheduleList'

export default async function DoctorTodayPage() {
  const ctx = await getCtx()
  const appointments = await getAppointmentsForDoctor(ctx, 'doctor-1')
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const todays = appointments.filter((a) => a.startsAt.slice(0, 10) <= todayKey).slice(0, 12)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Today's visits", value: String(todays.length) },
          { label: 'Confirmed', value: String(appointments.filter((a) => a.status === 'confirmed').length) },
          { label: 'Pending', value: String(appointments.filter((a) => a.status === 'pending').length) },
          { label: 'Completed', value: String(appointments.filter((a) => a.status === 'completed').length) },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-xs font-medium text-muted uppercase">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{s.value}</p>
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

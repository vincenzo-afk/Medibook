import { getCtx } from '@/lib/clerk/roles'
import { getAppointmentsForPatient } from '@/lib/db/queries'
import { Card } from '@/components/ui/Card'
import { AppointmentRow } from '@/components/patient/AppointmentRow'

export default async function AppointmentsPage() {
  const ctx = await getCtx()
  const appointments = await getAppointmentsForPatient(ctx, 'patient-1')
  const upcoming = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed')
  const past = appointments.filter((a) => a.status !== 'pending' && a.status !== 'confirmed')
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">My appointments</h2>
        <p className="text-[13px] text-muted">{upcoming.length} upcoming · {past.length} past</p>
      </div>
      <Card>
        <div className="border-b border-hairline px-4 py-2.5 text-xs font-semibold text-muted uppercase">
          Upcoming
        </div>
        {upcoming.length === 0 && <p className="px-4 py-6 text-sm text-muted">Nothing scheduled.</p>}
        {upcoming.map((a) => (
          <AppointmentRow key={a.id} appointment={a} doctor={a.doctor} />
        ))}
      </Card>
      {past.length > 0 && (
        <Card>
          <div className="border-b border-hairline px-4 py-2.5 text-xs font-semibold text-muted uppercase">
            History
          </div>
          {past.map((a) => (
            <AppointmentRow key={a.id} appointment={a} doctor={a.doctor} />
          ))}
        </Card>
      )}
    </div>
  )
}

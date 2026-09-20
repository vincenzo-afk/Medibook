import { ArrowRight } from 'lucide-react'

import { getCtx } from '@/lib/clerk/roles'
import { getAllAppointments, getDoctors } from '@/lib/db/queries'
import { formatDateTime } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'

export default async function AdminAppointmentsPage() {
  const ctx = await getCtx()
  const [appointments, doctors] = await Promise.all([getAllAppointments(ctx), getDoctors(ctx)])
  const nameOf = (id: string) => doctors.find((d) => d.id === id)?.name ?? id
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">All appointments</h2>
        <p className="text-[13px] text-muted">{appointments.length} total · hospital-scoped</p>
      </div>
      <Card>
        {appointments.map((a) => (
          <div key={a.id} className="flex items-center gap-3 border-b border-hairline px-4 py-2.5 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-[13px] font-medium text-ink">
                {a.patientName}
                <ArrowRight size={12} className="shrink-0 text-muted" />
                <span className="truncate">{nameOf(a.doctorId)}</span>
              </p>
              <p className="text-xs text-muted">{formatDateTime(a.startsAt)}</p>
            </div>
            <StatusPill status={a.status} />
          </div>
        ))}
      </Card>
    </div>
  )
}

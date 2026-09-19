import { getCtx } from '@/lib/clerk/roles'
import { getAppointmentsForDoctor, getPatients } from '@/lib/db/queries'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export default async function DoctorPatientsPage() {
  const ctx = await getCtx()
  const [appointments, patients] = await Promise.all([
    getAppointmentsForDoctor(ctx, 'doctor-1'),
    Promise.resolve(getPatients()),
  ])
  const seen = new Map(patients.map((p) => [p.id, { ...p, visits: 0 }]))
  for (const a of appointments) {
    const entry = seen.get(a.patientId)
    if (entry) entry.visits += 1
  }
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Patients</h2>
        <p className="text-[13px] text-muted">{seen.size} patient(s) on record</p>
      </div>
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-ink">Patient list</h3>
        </CardHeader>
        <div>
          {Array.from(seen.values()).map((p) => (
            <div key={p.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-panel-2 text-xs font-semibold text-ink">
                {p.name.split(' ').map((w) => w[0]).join('')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{p.name}</p>
                <p className="text-xs text-muted">{p.id}</p>
              </div>
              <span className="text-xs text-muted">{p.visits} visit(s)</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardBody>
          <p className="text-xs text-muted">
            PHI minimization: intake details are fetched per-patient only. Never log names or
            contact details.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

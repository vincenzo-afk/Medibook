import { getCtx } from '@/lib/clerk/roles'
import { getDoctors } from '@/lib/db/queries'
import { formatCurrency } from '@/lib/utils'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { OnboardDoctorForm } from '@/components/admin/OnboardDoctorForm'

export default async function AdminDoctorsPage() {
  const ctx = await getCtx()
  const doctors = await getDoctors(ctx)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Doctors</h2>
          <p className="text-[13px] text-muted">{doctors.length} onboarded · role promotion via Clerk Backend API</p>
        </div>
      </div>
      <OnboardDoctorForm />
      <div className="grid gap-3 sm:grid-cols-2">
        {doctors.map((d) => (
          <Card key={d.id}>
            <CardBody>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-panel-2 text-xs font-semibold text-ink">
                  {d.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{d.name}</p>
                  <p className="text-xs text-muted">{d.specialty} · {formatCurrency(d.feeCents)} · ★ {d.rating}</p>
                </div>
                <Button variant="secondary" size="sm">Manage</Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

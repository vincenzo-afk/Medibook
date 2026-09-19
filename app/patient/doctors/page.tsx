import { getCtx } from '@/lib/clerk/roles'
import { getDoctors } from '@/lib/db/queries'
import { SPECIALTIES } from '@/lib/db/seed-data'
import { Card, CardBody } from '@/components/ui/Card'
import { DoctorCard } from '@/components/patient/DoctorCard'
import { DoctorSearch } from '@/components/patient/DoctorSearch'

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; q?: string }>
}) {
  const params = await searchParams
  const ctx = await getCtx()
  const doctors = await getDoctors(ctx, {
    specialty: params.specialty,
    query: params.q,
  })
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Find a doctor</h2>
        <p className="text-[13px] text-muted">
          Filter by specialty or search by name · {doctors.length} result(s)
        </p>
      </div>
      <DoctorSearch specialties={SPECIALTIES} />
      {doctors.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-muted">No doctors match your filters.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      )}
    </div>
  )
}

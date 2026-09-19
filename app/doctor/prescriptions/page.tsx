import { getCtx } from '@/lib/clerk/roles'
import { getAppointmentsForDoctor } from '@/lib/db/queries'
import { PrescriptionWriter } from '@/components/doctor/PrescriptionWriter'

export default async function DoctorPrescriptionsPage() {
  const ctx = await getCtx()
  const appointments = await getAppointmentsForDoctor(ctx, 'doctor-1')
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">E-prescriptions</h2>
        <p className="text-[13px] text-muted">Structured scripts · PDFs stream on demand, never stored</p>
      </div>
      <PrescriptionWriter appointments={appointments} />
    </div>
  )
}

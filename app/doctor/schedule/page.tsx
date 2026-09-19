import { getCtx } from '@/lib/clerk/roles'
import { getSlotsForDoctor } from '@/lib/db/queries'
import { SlotManager } from '@/components/doctor/SlotManager'

export default async function DoctorSchedulePage() {
  const ctx = await getCtx()
  const slots = await getSlotsForDoctor(ctx, 'doctor-1')
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Schedule manager</h2>
        <p className="text-[13px] text-muted">Create 30-minute blocks · optimistic locking prevents double-booking</p>
      </div>
      <SlotManager slots={slots} />
    </div>
  )
}

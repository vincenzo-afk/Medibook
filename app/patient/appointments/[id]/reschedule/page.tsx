import { notFound } from 'next/navigation'

import { getCtx } from '@/lib/clerk/roles'
import { getAppointment, getDoctor, getSlotsForDoctor } from '@/lib/db/queries'
import { ReschedulePanel } from '@/components/patient/ReschedulePanel'

export default async function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx()
  let appointment
  try {
    appointment = await getAppointment(ctx, id)
  } catch {
    notFound()
  }
  const doctor = await getDoctor(ctx, appointment.doctorId)
  const slots = await getSlotsForDoctor(ctx, appointment.doctorId)
  return (
    <div className="mx-auto max-w-2xl">
      <ReschedulePanel appointment={appointment} doctor={doctor} slots={slots} />
    </div>
  )
}

import { notFound } from 'next/navigation'
import { Languages, MapPin, Star } from 'lucide-react'

import { getCtx } from '@/lib/clerk/roles'
import { getDoctor, getSlotsForDoctor } from '@/lib/db/queries'
import { formatCurrency } from '@/lib/utils'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { BookingPanel } from '@/components/patient/BookingPanel'
import { JoinWaitlistCard } from '@/components/patient/JoinWaitlistCard'

export default async function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx()
  let doctor
  try {
    doctor = await getDoctor(ctx, id)
  } catch {
    notFound()
  }
  const slots = await getSlotsForDoctor(ctx, id)
  const openCount = slots.filter((s) => s.status === 'open').length
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-panel-2 text-lg font-semibold text-ink">
                {doctor.initials}
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">{doctor.name}</h2>
                <p className="text-sm text-muted">{doctor.specialty}</p>
                <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
                  <Star size={13} className="fill-pending text-pending" />
                  <span className="font-semibold text-ink">{doctor.rating}</span>(
                  {doctor.reviewsCount} reviews) · {doctor.yearsExperience}y experience
                </p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">{doctor.bio}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-ink">Consultation details</h3>
          </CardHeader>
          <CardBody className="space-y-2 text-[13px]">
            <p className="flex items-center gap-2 text-muted">
              <MapPin size={14} /> {doctor.hospital} · {doctor.address}
            </p>
            <p className="flex items-center gap-2 text-muted">
              <Languages size={14} /> {doctor.languages.join(' · ')}
            </p>
            <div className="flex items-center justify-between border-t border-hairline pt-3">
              <span className="text-muted">Consultation fee</span>
              <span className="text-base font-semibold text-ink">
                {formatCurrency(doctor.feeCents)}
              </span>
            </div>
          </CardBody>
        </Card>
      </div>
      <div className="space-y-4 lg:col-span-3">
        {openCount === 0 && <JoinWaitlistCard doctorId={doctor.id} doctorName={doctor.name} />}
        <BookingPanel doctor={doctor} slots={slots} />
      </div>
    </div>
  )
}

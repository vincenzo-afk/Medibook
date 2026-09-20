import Link from 'next/link'
import { Star } from 'lucide-react'

import type { Doctor } from '@/lib/db/seed-data'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Card, CardBody } from '@/components/ui/Card'

export function DoctorCard({ doctor, todayOpen }: { doctor: Doctor; todayOpen?: number }) {
  return (
    <Link href={`/patient/doctors/${doctor.id}`}>
      <Card className="group transition-colors duration-150 hover:border-action/60">
        <CardBody>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-panel-2 text-sm font-semibold text-ink">
              {doctor.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-ink group-hover:text-white">
                {doctor.name}
              </p>
              <p className="text-[13px] text-muted">{doctor.specialty}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <Star size={12} className="fill-pending text-pending" />
                <span className="font-medium text-ink">{doctor.rating}</span>({doctor.reviewsCount}) ·{' '}
                {doctor.yearsExperience}y exp
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
            <span className="text-[13px] text-muted">
              Fee <span className="font-semibold text-ink">{formatCurrency(doctor.feeCents)}</span>
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium',
                todayOpen === 0 ? 'text-muted' : 'text-success',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  todayOpen === 0 ? 'bg-muted' : 'bg-success',
                )}
              />
              {todayOpen === undefined
                ? doctor.nextAvailable
                : todayOpen > 0
                  ? `${todayOpen} today`
                  : 'Join waitlist'}
            </span>
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}

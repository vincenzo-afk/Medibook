'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

import type { WaitlistEntry } from '@/lib/db/store'
import type { Doctor } from '@/lib/db/seed-data'
import { leaveWaitlistAction } from '@/app/actions/waitlist'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function WaitlistSection({
  entries,
}: {
  entries: (WaitlistEntry & { doctor: Doctor })[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  if (entries.length === 0) return null

  async function leave(id: string) {
    setBusy(id)
    await leaveWaitlistAction({ waitlistId: id })
    setBusy(null)
    router.refresh()
  }

  return (
    <Card className="enter enter-d2">
      <div className="border-b border-hairline px-4 py-2.5 text-xs font-semibold tracking-wide text-muted uppercase">
        Waitlist · {entries.length}
      </div>
      {entries.map((w) => (
        <div key={w.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pending/10 text-[11px] font-semibold text-pending">
            {w.doctor.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{w.doctor.name}</p>
            <p className="text-xs text-muted">
              Waiting since {new Date(w.createdAt).toLocaleDateString()} · {w.doctor.specialty}
            </p>
          </div>
          <Button variant="ghost" size="sm" disabled={busy === w.id} onClick={() => leave(w.id)} aria-label={`Leave waitlist for ${w.doctor.name}`}>
            <X size={14} /> Leave
          </Button>
        </div>
      ))}
    </Card>
  )
}

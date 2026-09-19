'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'

import { createSlotAction } from '@/app/actions/slots'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import type { Slot } from '@/lib/db/seed-data'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

function defaultStart(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SlotManager({ slots }: { slots: Slot[] }) {
  const router = useRouter()
  const [start, setStart] = useState(defaultStart)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const open = slots.filter((s) => s.status === 'open').length

  async function create() {
    setPending(true)
    setMessage('')
    const startsAt = new Date(start).toISOString()
    const endsAt = new Date(new Date(start).getTime() + 30 * 60_000).toISOString()
    const result = await createSlotAction({ doctorId: 'doctor-1', startsAt, endsAt })
    setPending(false)
    setMessage(result.ok ? 'Slot created.' : result.error)
    if (result.ok) router.refresh()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-ink">New slot</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <div>
            <Label htmlFor="slot-start">Start (30-min blocks)</Label>
            <Input
              id="slot-start"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <Button onClick={create} disabled={pending} className="w-full">
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {pending ? 'Creating…' : 'Add slot'}
          </Button>
          {message && <p className="text-[13px] text-muted">{message}</p>}
          <p className="text-xs text-muted">
            Holds auto-release after 10 minutes via /api/cron/release-holds.
          </p>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Availability</h2>
            <span className="text-xs text-muted">{open} open · {slots.length} total</span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.slice(0, 30).map((s) => (
              <span
                key={s.id}
                className={cn(
                  'flex h-9 items-center justify-center rounded-md text-xs font-medium',
                  s.status === 'open' && 'border border-success/40 bg-success/10 text-success',
                  s.status === 'held' && 'border border-action/40 bg-action/10 text-ink',
                  s.status === 'booked' && 'slot-booked',
                )}
              >
                {formatTime(s.startsAt)}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

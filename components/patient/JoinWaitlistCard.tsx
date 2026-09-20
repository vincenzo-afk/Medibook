'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellRing, Check, Loader2 } from 'lucide-react'

import { joinWaitlistAction } from '@/app/actions/waitlist'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export function JoinWaitlistCard({ doctorId, doctorName }: { doctorId: string; doctorName: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle')

  async function join() {
    setState('pending')
    const result = await joinWaitlistAction({ doctorId })
    if (result.ok) {
      setState('done')
      router.refresh()
    } else {
      setState('idle')
    }
  }

  return (
    <Card className="enter enter-d2 border-pending/30">
      <CardBody className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pending/10 text-pending">
          <BellRing size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Fully booked this week</p>
          <p className="text-[13px] text-muted">
            Join the waitlist — we&apos;ll hold your place if {doctorName} opens a slot.
          </p>
        </div>
        <Button variant="secondary" size="sm" disabled={state !== 'idle'} onClick={join}>
          {state === 'pending' && <Loader2 size={14} className="animate-spin" />}
          {state === 'done' && <Check size={14} className="text-success" />}
          {state === 'done' ? 'On the list' : 'Notify me'}
        </Button>
      </CardBody>
    </Card>
  )
}

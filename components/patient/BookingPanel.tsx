'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Timer } from 'lucide-react'

import type { Doctor, Slot } from '@/lib/db/seed-data'
import { MAX_SLOT_HOLD_MINUTES } from '@/lib/slots/calc'
import { bookAppointmentAction } from '@/app/actions/appointments'
import { holdSlotAction } from '@/app/actions/slots'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Label, Textarea } from '@/components/ui/Input'
import { SlotGrid } from '@/components/patient/SlotGrid'
import { formatDateTime } from '@/lib/utils'

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function BookingPanel({ doctor, slots }: { doctor: Doctor; slots: Slot[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Slot | null>(null)
  const [holdUntil, setHoldUntil] = useState<number | null>(null)
  const [remaining, setRemaining] = useState('')
  const [reason, setReason] = useState('')
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!holdUntil) return
    const tick = () => {
      const ms = holdUntil - Date.now()
      if (ms <= 0) {
        setSelected(null)
        setHoldUntil(null)
        setRemaining('')
        router.refresh()
        return
      }
      setRemaining(formatRemaining(ms))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [holdUntil, router])

  async function select(slot: Slot) {
    setSelected(slot)
    setState(null)
    // Place a 10-minute hold so nobody else can take the slot mid-checkout.
    const result = await holdSlotAction({ slotId: slot.id })
    if (result.ok) {
      setHoldUntil(Date.now() + MAX_SLOT_HOLD_MINUTES * 60_000)
    }
  }

  async function confirm() {
    if (!selected) return
    setPending(true)
    setState(null)
    const result = await bookAppointmentAction({
      doctorId: doctor.id,
      slotId: selected.id,
      reason,
    })
    setPending(false)
    if (result.ok) {
      setState({ ok: true, message: 'Appointment booked. Redirecting…' })
      router.push('/patient/appointments')
      router.refresh()
    } else {
      setState({ ok: false, message: result.error })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Select a time slot</h2>
          <span className="text-xs text-muted">
            {slots.filter((s) => s.status === 'open').length} slots open
          </span>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <SlotGrid slots={slots} selectedId={selected?.id ?? null} onSelect={select} />
        <div>
          <Label htmlFor="reason">Reason for visit (optional)</Label>
          <Textarea
            id="reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe your symptoms…"
            maxLength={500}
          />
        </div>
        {selected && (
          <div className="rounded-md border border-action/40 bg-action/10 px-3 py-2 text-[13px] text-ink">
            Selected <span className="font-semibold">{formatDateTime(selected.startsAt)}</span> with{' '}
            {doctor.name}
            {remaining && (
              <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <Timer size={13} className="text-pending" />
                Held for you · expires in <span className="font-semibold text-ink">{remaining}</span>
              </span>
            )}
          </div>
        )}
        {state && (
          <div
            className={
              state.ok
                ? 'flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[13px] text-success'
                : 'rounded-md border border-cancelled/30 bg-cancelled/10 px-3 py-2 text-[13px] text-cancelled'
            }
          >
            {state.ok && <CheckCircle2 size={15} />}
            {state.message}
          </div>
        )}
        <Button disabled={!selected || pending} onClick={confirm} className="w-full" size="lg">
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? 'Confirming…' : 'Confirm Appointment'}
        </Button>
        <p className="text-center text-xs text-muted">
          Free cancellation up to 2 hours before · 10-min hold while you decide
        </p>
      </CardBody>
    </Card>
  )
}

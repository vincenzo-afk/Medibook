'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import type { Appointment } from '@/lib/db/seed-data'
import { createPrescriptionAction } from '@/app/actions/prescriptions'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Label, Textarea } from '@/components/ui/Input'

interface Med {
  name: string
  dosage: string
  frequency: string
  duration: string
}

const EMPTY_MED: Med = { name: '', dosage: '', frequency: 'Once daily', duration: '7 days' }

export function PrescriptionWriter({ appointments }: { appointments: Appointment[] }) {
  const router = useRouter()
  const [appointmentId, setAppointmentId] = useState(appointments[0]?.id ?? '')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [meds, setMeds] = useState<Med[]>([{ ...EMPTY_MED }])
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  const selected = appointments.find((a) => a.id === appointmentId)

  function setMed(i: number, patch: Partial<Med>) {
    setMeds((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)))
  }

  async function submit() {
    setPending(true)
    setMessage('')
    const result = await createPrescriptionAction({
      appointmentId,
      patientId: selected?.patientId ?? 'patient-1',
      diagnosis,
      notes,
      medications: meds.map((m) => ({ ...m, instructions: '' })),
    })
    setPending(false)
    if (result.ok) {
      setMessage('Prescription issued.')
      setDiagnosis('')
      setNotes('')
      setMeds([{ ...EMPTY_MED }])
      router.refresh()
    } else {
      setMessage(result.error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-ink">New e-prescription</h2>
      </CardHeader>
      <CardBody className="space-y-3">
        <div>
          <Label htmlFor="rx-appt">Appointment</Label>
          <select
            id="rx-appt"
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
            className="h-9 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink focus:border-action focus:outline-none"
          >
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.patientName} — {new Date(a.startsAt).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="rx-dx">Diagnosis</Label>
          <Input
            id="rx-dx"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Acute bronchitis"
          />
        </div>
        {meds.map((m, i) => (
          <div key={i} className="grid gap-2 rounded-md border border-hairline p-3 sm:grid-cols-4">
            <div>
              <Label>Medication</Label>
              <Input value={m.name} onChange={(e) => setMed(i, { name: e.target.value })} placeholder="Amoxicillin" />
            </div>
            <div>
              <Label>Dosage</Label>
              <Input value={m.dosage} onChange={(e) => setMed(i, { dosage: e.target.value })} placeholder="500mg" />
            </div>
            <div>
              <Label>Frequency</Label>
              <Input value={m.frequency} onChange={(e) => setMed(i, { frequency: e.target.value })} />
            </div>
            <div>
              <Label>Duration</Label>
              <div className="flex gap-1.5">
                <Input value={m.duration} onChange={(e) => setMed(i, { duration: e.target.value })} />
                {meds.length > 1 && (
                  <Button variant="secondary" size="sm" onClick={() => setMeds((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove medication">
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => setMeds((prev) => [...prev, { ...EMPTY_MED }])}>
          <Plus size={14} /> Add medication
        </Button>
        <div>
          <Label htmlFor="rx-notes">Notes (optional)</Label>
          <Textarea id="rx-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Take with food…" />
        </div>
        {message && <p className="text-[13px] text-muted">{message}</p>}
        <Button onClick={submit} disabled={pending || !appointmentId || !diagnosis} className="w-full" size="lg">
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? 'Issuing…' : 'Issue prescription'}
        </Button>
      </CardBody>
    </Card>
  )
}

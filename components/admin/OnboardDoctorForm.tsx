'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'

import { SPECIALTIES } from '@/lib/db/seed-data'
import { createDoctorAction } from '@/app/actions/doctors'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Label, Select, Textarea } from '@/components/ui/Input'

export function OnboardDoctorForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true)
    setMessage('')
    const result = await createDoctorAction({
      name: String(formData.get('name') ?? ''),
      specialty: String(formData.get('specialty') ?? ''),
      bio: String(formData.get('bio') ?? ''),
      languages: String(formData.get('languages') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      feeCents: Math.round(Number(formData.get('fee') ?? 0) * 100),
    })
    setPending(false)
    if (result.ok) {
      setMessage('Doctor onboarded.')
      setOpen(false)
      router.refresh()
    } else {
      setMessage(result.error)
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Onboard doctor
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-ink">Onboard doctor</h3>
      </CardHeader>
      <CardBody>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            void submit(new FormData(e.currentTarget))
          }}
        >
          <div>
            <Label htmlFor="ob-name">Full name</Label>
            <Input id="ob-name" name="name" placeholder="Dr. Jane Doe" required />
          </div>
          <div>
            <Label htmlFor="ob-specialty">Specialty</Label>
            <Select id="ob-specialty" name="specialty">
              {SPECIALTIES.filter((s) => s !== 'All').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ob-fee">Fee (USD)</Label>
            <Input id="ob-fee" name="fee" type="number" min={0} defaultValue={100} required />
          </div>
          <div>
            <Label htmlFor="ob-lang">Languages (comma-separated)</Label>
            <Input id="ob-lang" name="languages" placeholder="English, French" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ob-bio">Bio</Label>
            <Textarea id="ob-bio" name="bio" rows={2} placeholder="Credentials and focus areas…" />
          </div>
          {message && <p className="text-[13px] text-muted sm:col-span-2">{message}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 size={14} className="animate-spin" />}
              {pending ? 'Saving…' : 'Save doctor'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

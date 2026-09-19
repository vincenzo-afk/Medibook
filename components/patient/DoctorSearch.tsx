'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

import { Input, Select } from '@/components/ui/Input'

export function DoctorSearch({ specialties }: { specialties: string[] }) {
  const router = useRouter()
  const params = useSearchParams()

  function update(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v)
      else sp.delete(k)
    }
    router.push(`/patient/doctors?${sp.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-panel p-3 sm:flex-row">
      <div className="relative flex-1">
        <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <Input
          className="pl-9"
          placeholder="Search name, specialty, keyword…  ( ⌘K )"
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => update({ q: e.target.value })}
        />
      </div>
      <Select
        defaultValue={params.get('specialty') ?? 'All'}
        onChange={(e) => update({ specialty: e.target.value === 'All' ? '' : e.target.value })}
        className="sm:w-52"
      >
        {specialties.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </div>
  )
}

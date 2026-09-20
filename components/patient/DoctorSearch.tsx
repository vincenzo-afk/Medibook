'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarCheck2, Search } from 'lucide-react'

import { Input, Select } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export function DoctorSearch({ specialties }: { specialties: string[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const todayOnly = params.get('today') === '1'

  function update(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v)
      else sp.delete(k)
    }
    router.push(`/patient/doctors?${sp.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-panel p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <Input
          className="pl-9"
          placeholder="Search name, specialty, keyword…"
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => update({ q: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <Select
          defaultValue={params.get('specialty') ?? 'All'}
          onChange={(e) => update({ specialty: e.target.value === 'All' ? '' : e.target.value })}
          className="flex-1 sm:w-44 sm:flex-none"
        >
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <button
          onClick={() => update({ today: todayOnly ? '' : '1' })}
          aria-pressed={todayOnly}
          className={cn(
            'flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium transition-colors duration-150',
            todayOnly
              ? 'border-success/50 bg-success/10 text-success'
              : 'border-hairline text-muted hover:border-success/40 hover:text-ink',
          )}
        >
          <CalendarCheck2 size={14} />
          Today
        </button>
      </div>
    </div>
  )
}

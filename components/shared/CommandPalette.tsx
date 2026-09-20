'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import type { Ctx } from '@/lib/clerk/types'

interface DoctorEntry {
  id: string
  name: string
  specialty: string
}

const LINKS: Array<{ href: string; label: string; roles: Ctx['role'][] }> = [
  { href: '/patient/doctors', label: 'Find doctors', roles: ['patient'] },
  { href: '/patient/appointments', label: 'My appointments', roles: ['patient'] },
  { href: '/patient/prescriptions', label: 'My prescriptions', roles: ['patient'] },
  { href: '/doctor', label: "Today's schedule", roles: ['doctor'] },
  { href: '/doctor/schedule', label: 'Manage schedule', roles: ['doctor'] },
  { href: '/doctor/prescriptions', label: 'Write prescription', roles: ['doctor'] },
  { href: '/admin', label: 'Hospital overview', roles: ['admin'] },
  { href: '/admin/appointments', label: 'All appointments', roles: ['admin'] },
  { href: '/admin/analytics', label: 'Analytics', roles: ['admin'] },
]

export function CommandPalette({ role, doctors }: { role: Ctx['role']; doctors: DoctorEntry[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const links = LINKS.filter((l) => l.roles.includes(role)).map((l) => ({
      href: l.href,
      label: l.label,
      hint: 'Go to',
    }))
    const docs = doctors.map((d) => ({
      href: `/patient/doctors/${d.id}`,
      label: `${d.name} — ${d.specialty}`,
      hint: 'Book',
    }))
    const all = [...links, ...docs]
    if (!q) return all.slice(0, 8)
    return all.filter((r) => r.label.toLowerCase().includes(q)).slice(0, 10)
  }, [query, role, doctors])

  function go(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && results[0]) {
      go(results[0].href)
    }
  }

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and navigate"
        className="palette-panel w-full max-w-lg overflow-hidden rounded-lg border border-hairline bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-hairline px-3">
          <Search size={15} className="text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search doctors, pages, actions…"
            className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none"
          />
          <kbd className="rounded border border-hairline px-1.5 py-0.5 text-[10px] text-muted">
            esc
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted">No matches.</p>
          )}
          {results.map((r) => (
            <button
              key={r.href + r.label}
              onClick={() => go(r.href)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-canvas"
            >
              <span className="flex-1 truncate">{r.label}</span>
              <span className="text-[11px] text-muted">{r.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

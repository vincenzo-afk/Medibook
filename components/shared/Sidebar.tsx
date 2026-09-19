'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  CalendarDays,
  FileText,
  LayoutDashboard,
  ScrollText,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Ctx } from '@/lib/clerk/types'

const NAV: Record<Ctx['role'], Array<{ href: string; label: string; icon: typeof Search }>> = {
  patient: [
    { href: '/patient', label: 'Overview', icon: LayoutDashboard },
    { href: '/patient/doctors', label: 'Find doctors', icon: Search },
    { href: '/patient/appointments', label: 'Appointments', icon: CalendarDays },
    { href: '/patient/prescriptions', label: 'Prescriptions', icon: FileText },
    { href: '/patient/privacy', label: 'Privacy', icon: ShieldCheck },
  ],
  doctor: [
    { href: '/doctor', label: 'Today', icon: LayoutDashboard },
    { href: '/doctor/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/doctor/patients', label: 'Patients', icon: Users },
    { href: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
  ],
  admin: [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
    { href: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
    { href: '/admin/analytics', label: 'Analytics', icon: Activity },
    { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
  ],
}

export function Sidebar({ role }: { role: Ctx['role'] }) {
  const pathname = usePathname()
  const items = NAV[role]
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-canvas md:flex">
      <Link href="/" className="flex h-14 items-center gap-2 border-b border-hairline px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-action text-sm font-bold text-white">
          M
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-ink">MediBook</span>
        <span className="ml-auto rounded border border-hairline px-1.5 py-0.5 text-[10px] font-medium text-muted uppercase">
          {role}
        </span>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => {
          const active =
            item.href === `/${role}` ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-9 items-center gap-2.5 rounded-md px-3 text-[13.5px] transition-colors duration-120',
                active
                  ? 'bg-panel text-ink'
                  : 'text-muted hover:bg-panel hover:text-ink',
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-hairline p-3">
        <div className="rounded-md border border-hairline bg-panel px-3 py-2.5">
          <p className="text-xs font-medium text-ink">Night-shift friendly</p>
          <p className="mt-0.5 text-xs text-muted">Deep slate canvas · low eye strain</p>
        </div>
      </div>
    </aside>
  )
}

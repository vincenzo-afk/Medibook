import Link from 'next/link'
import { Bell, Command } from 'lucide-react'

import type { Ctx } from '@/lib/clerk/types'
import { RoleSwitcher } from '@/components/shared/RoleSwitcher'

export function Topbar({ role, title, subtitle }: { role: Ctx['role']; title: string; subtitle?: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-canvas px-4">
      <Link href="/" className="text-[15px] font-semibold text-ink md:hidden">
        MediBook
      </Link>
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-md border border-hairline bg-panel px-2 py-1 text-xs text-muted lg:flex">
          <Command size={12} /> K
        </span>
        <button
          aria-label="Notifications"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-hairline text-muted transition-colors hover:border-action hover:text-ink"
        >
          <Bell size={15} />
        </button>
        <RoleSwitcher role={role} />
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-2 text-xs font-semibold text-ink">
          {role[0]?.toUpperCase()}
        </span>
      </div>
    </header>
  )
}

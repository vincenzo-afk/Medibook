'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV } from '@/components/shared/Sidebar'
import { cn } from '@/lib/utils'
import type { Ctx } from '@/lib/clerk/types'

/** Bottom tab bar for small screens — the sidebar is hidden below md. */
export function MobileNav({ role }: { role: Ctx['role'] }) {
  const pathname = usePathname()
  const items = NAV[role].slice(0, 5)
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className={cn('grid', items.length === 4 ? 'grid-cols-4' : 'grid-cols-5')}>
        {items.map((item) => {
          const active =
            item.href === `/${role}` ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-120',
                active ? 'text-ink' : 'text-muted',
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 2} />
              {item.label.split(' ')[0]}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

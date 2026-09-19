import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ROLE_COOKIE, VALID_ROLES, type Ctx } from '@/lib/clerk/types'

async function switchRole(formData: FormData) {
  'use server'
  const role = String(formData.get('role') ?? 'patient')
  const store = await cookies()
  store.set(ROLE_COOKIE, VALID_ROLES.includes(role as Ctx['role']) ? role : 'patient', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  redirect(`/${role === 'doctor' ? 'doctor' : role === 'admin' ? 'admin' : 'patient'}`)
}

export function RoleSwitcher({ role }: { role: Ctx['role'] }) {
  return (
    <form action={switchRole} className="flex items-center gap-1 rounded-md border border-hairline bg-canvas p-0.5">
      {(VALID_ROLES as Ctx['role'][]).map((r) => (
        <button
          key={r}
          name="role"
          value={r}
          className={
            r === role
              ? 'h-7 rounded bg-action px-2.5 text-xs font-medium text-white'
              : 'h-7 rounded px-2.5 text-xs font-medium text-muted transition-colors hover:text-ink'
          }
        >
          {r[0]?.toUpperCase()}{r.slice(1)}
        </button>
      ))}
    </form>
  )
}

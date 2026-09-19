import Link from 'next/link'

import { getCtx } from '@/lib/clerk/roles'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default async function SignInPage() {
  const ctx = await getCtx()
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-action text-sm font-bold text-white">
              M
            </span>
            <span className="text-[15px] font-semibold text-ink">MediBook</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">Sign in</p>
          <p className="text-[13px] text-muted">
            Production uses Clerk passwordless (magic link · passkey · OAuth).
          </p>
        </CardHeader>
        <CardBody className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink">Email</label>
            <Input type="email" placeholder="you@example.com" defaultValue="demo@medibook.example" />
          </div>
          <Link href="/patient">
            <Button className="w-full" size="lg">
              Continue with demo session ({ctx.role})
            </Button>
          </Link>
          <p className="text-center text-xs text-muted">
            Demo mode — no Clerk keys configured. Pick a role from any dashboard header.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

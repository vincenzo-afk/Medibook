import Link from 'next/link'

import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-4">
      <p className="text-4xl font-semibold tracking-tight text-ink">404</p>
      <p className="text-sm text-muted">This page doesn&apos;t exist or was moved.</p>
      <Link href="/">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </div>
  )
}

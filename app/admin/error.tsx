'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-3 text-center">
          <p className="text-sm font-semibold text-ink">Something went wrong</p>
          <p className="text-[13px] text-muted">
            {error.message || 'An unexpected error occurred. Your data is safe.'}
          </p>
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

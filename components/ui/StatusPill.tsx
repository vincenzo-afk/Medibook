import { cn } from '@/lib/utils'

export type StatusKind = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'held' | 'open'

const STYLES: Record<StatusKind, string> = {
  confirmed: 'pill-confirmed',
  completed: 'pill-confirmed',
  pending: 'pill-pending',
  cancelled: 'pill-cancelled',
  held: 'pill-held',
  open: 'pill-open',
}

export function StatusPill({ status, className }: { status: StatusKind; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium capitalize',
        STYLES[status],
        className,
      )}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

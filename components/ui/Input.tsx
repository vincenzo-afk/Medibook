import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink placeholder:text-muted/60',
        'transition-colors duration-150 hover:border-muted/50 focus:border-action focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted/60',
        'transition-colors duration-150 hover:border-muted/50 focus:border-action focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 rounded-md border border-hairline bg-canvas px-3 text-sm text-ink',
        'transition-colors duration-150 hover:border-muted/50 focus:border-action focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink">
      {children}
    </label>
  )
}

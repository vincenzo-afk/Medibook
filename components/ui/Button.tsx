import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'h-8 px-3 text-[13px]',
        size === 'md' && 'h-9 px-4 text-sm',
        size === 'lg' && 'h-11 px-6 text-[15px]',
        variant === 'primary' && 'bg-action text-white hover:bg-action-hover',
        variant === 'secondary' &&
          'border border-hairline bg-panel text-ink hover:border-action hover:text-white',
        variant === 'ghost' && 'text-muted hover:bg-panel hover:text-ink',
        variant === 'success' && 'bg-success text-[#06281c] hover:brightness-110',
        className,
      )}
      {...props}
    />
  )
}

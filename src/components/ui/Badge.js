'use client'

import { cn } from '@/lib/cn'

export default function Badge({ className, children, variant = 'default', ...props }) {
  const styles = {
    default: 'bg-blue-50 text-blue-700 border border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    outline: 'border border-gray-300 text-gray-700 bg-white',
    glow: 'border border-blue-600/50 text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold tracking-[0.3em] uppercase',
        styles[variant] || styles.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

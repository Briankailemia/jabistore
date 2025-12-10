'use client'

import { cn } from '@/lib/cn'

export default function Badge({ className, children, variant = 'default', ...props }) {
  const styles = {
    default: 'bg-white/10 text-white border border-white/20',
    success: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30',
    warning: 'bg-amber-500/15 text-amber-200 border border-amber-400/30',
    outline: 'border border-stroke-subtle text-slate-200',
    glow: 'border border-brand-sky/40 text-white bg-gradient-to-r from-brand-sky/20 to-brand-indigo/20',
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

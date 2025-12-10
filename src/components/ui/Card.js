'use client'

import { cn } from '@/lib/cn'

const VARIANTS = {
  default: 'bg-[color:var(--surface-primary)] border-[color:var(--border-soft)]',
  muted: 'bg-[color:var(--surface-tertiary)] border-white/10',
  translucent: 'bg-slate-900/60 border-white/15 backdrop-blur-3xl',
  gradient: 'bg-gradient-to-br from-slate-900/95 via-slate-900/70 to-slate-900/40 border-white/10',
  outline: 'bg-[color:var(--surface-secondary)] border-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]',
}

export default function Card({ className, children, padding = 'p-6', variant = 'default', ...props }) {
  return (
    <div
      className={cn(
        'relative rounded-[28px] text-slate-100 shadow-[0_25px_70px_rgba(5,10,25,0.45)] overflow-hidden',
        VARIANTS[variant] || VARIANTS.default,
        padding,
        className,
      )}
      {...props}
    >
      {children}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/5" />
    </div>
  )
}

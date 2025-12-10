'use client'

import { cn } from '@/lib/cn'

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-brand-sky via-brand-azure to-brand-indigo text-slate-950 border border-brand-sky/60 shadow-[0_15px_30px_rgba(15,23,42,0.4)] hover:translate-y-0.5 hover:shadow-blue-900/50',
  secondary:
    'bg-[color:var(--surface-tertiary)] text-slate-100 border border-stroke-subtle hover:border-brand-sky/60 hover:text-white hover:bg-[color:var(--surface-highlight)]/20',
  ghost:
    'text-slate-200 hover:text-white border border-transparent hover:border-stroke-subtle/60',
  outline:
    'border border-stroke-strong text-white hover:border-brand-sky/70 hover:text-white bg-transparent',
}

const SIZES = {
  sm: 'text-sm px-4 py-2',
  md: 'text-base px-5 py-2.5',
  lg: 'text-lg px-6 py-3',
}

export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    'inline-flex items-center justify-center rounded-2xl font-semibold tracking-tight transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-sky/60 focus-visible:ring-offset-[color:var(--surface-secondary)] gap-2',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    'disabled:opacity-60 disabled:cursor-not-allowed',
    className,
  )
}

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <button className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </button>
  )
}

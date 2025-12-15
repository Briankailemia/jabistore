'use client'

import { cn } from '@/lib/cn'

const VARIANTS = {
  primary:
    'bg-blue-900 text-white border border-blue-800 shadow-lg hover:bg-blue-800 hover:shadow-xl active:scale-[0.98] transition-all duration-200',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:border-blue-900 hover:text-blue-900 hover:bg-blue-50 active:scale-[0.98] transition-all duration-200',
  ghost:
    'text-gray-700 hover:text-blue-900 border border-transparent hover:bg-blue-50 active:scale-[0.98] transition-all duration-200',
  outline:
    'border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white active:scale-[0.98] transition-all duration-200',
}

const SIZES = {
  sm: 'text-sm px-4 py-2',
  md: 'text-base px-5 py-2.5',
  lg: 'text-lg px-6 py-3',
}

export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    'inline-flex items-center justify-center rounded-xl font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-900 focus-visible:ring-offset-white gap-2',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
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

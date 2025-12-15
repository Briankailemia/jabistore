'use client'

import { cn } from '@/lib/cn'

const VARIANTS = {
  default: 'bg-white border border-gray-200 text-gray-900',
  muted: 'bg-gray-50 border border-gray-200 text-gray-900',
  translucent: 'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-900',
  gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 text-gray-900',
  outline: 'bg-white border-2 border-gray-300 text-gray-900',
}

export default function Card({ className, children, padding = 'p-6', variant = 'default', ...props }) {
  return (
    <div
      className={cn(
        'relative rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden',
        VARIANTS[variant] || VARIANTS.default,
        padding,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

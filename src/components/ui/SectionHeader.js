'use client'

import { cn } from '@/lib/cn'
import Badge from './Badge'

export default function SectionHeader({
  eyebrow,
  eyebrowVariant = 'outline',
  title,
  description,
  align = 'center',
  className,
}) {
  const alignClass = align === 'center' ? 'text-center max-w-3xl mx-auto' : ''

  return (
    <div className={cn('space-y-3 relative', alignClass, className)}>
      <div className="absolute inset-x-0 -top-4 hidden sm:block">
        <div className="h-px bg-gradient-to-r from-transparent via-brand-sky/40 to-transparent" />
      </div>
      {eyebrow && (
        <Badge variant={eyebrowVariant} className={cn('tracking-[0.3em]', align === 'center' && 'mx-auto')}>
          {eyebrow}
        </Badge>
      )}
      {title && (
        <h2 className={cn('text-3xl md:text-4xl font-semibold text-white leading-tight', align === 'center' && 'mx-auto')}>
          {title}
        </h2>
      )}
      {description && (
        <p className="text-slate-300 text-base md:text-lg leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

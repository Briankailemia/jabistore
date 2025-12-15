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
    <div className={cn('space-y-4 relative', alignClass, className)}>
      <div className="absolute inset-x-0 -top-4 hidden sm:block">
        <div className="h-px bg-gradient-to-r from-transparent via-blue-600/40 to-transparent" />
      </div>
      {eyebrow && (
        <Badge variant={eyebrowVariant} className={cn('tracking-[0.3em] text-xs font-bold', align === 'center' && 'mx-auto')}>
          {eyebrow}
        </Badge>
      )}
      {title && (
        <h2 className={cn('text-3xl md:text-5xl font-black text-gray-900 leading-tight', align === 'center' && 'mx-auto')}>
          {title}
        </h2>
      )}
      {description && (
        <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  )
}

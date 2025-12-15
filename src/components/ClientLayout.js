'use client'

import { Suspense, lazy } from 'react'

import Footer from '@/components/Footer'
import Header from '@/components/Header'
import LoadingSpinner from '@/components/LoadingSpinner'
import WhatsAppChat from '@/components/WhatsAppChat'

const PerformanceMonitor = lazy(() => import('./PerformanceMonitor'))

export default function ClientLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-[color:var(--color-base)] text-[color:var(--color-foreground)]">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="relative z-10 min-h-screen pb-24 pt-12 sm:pt-16">
        <div className="mx-auto max-w-[98vw] px-3 sm:px-6">
          <div className="rounded-2xl bg-[color:var(--surface-primary)] border border-[color:var(--border-soft)] shadow-sm">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading content..." />}>
          {children}
        </Suspense>
          </div>
        </div>
      </main>

      <Footer />

      <WhatsAppChat position="fixed" />

      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <PerformanceMonitor />
        </Suspense>
      )}
    </div>
  )
}

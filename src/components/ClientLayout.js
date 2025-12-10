'use client'

import { Suspense, lazy } from 'react'

import Footer from '@/components/Footer'
import Header from '@/components/Header'
import LoadingSpinner from '@/components/LoadingSpinner'
import WhatsAppChat from '@/components/WhatsAppChat'

const PerformanceMonitor = lazy(() => import('./PerformanceMonitor'))

export default function ClientLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-[color:var(--color-base)] text-slate-100">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-500 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
      >
        Skip to main content
      </a>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-hero-glow opacity-90" />
        <div className="absolute inset-0 bg-grid-slate opacity-50 [background-size:140px_140px]" />
        <div className="absolute inset-0 bg-noise-light opacity-20" />
      </div>

      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      </div>

      <Header />

      <main id="main-content" className="relative z-10 min-h-screen pb-24 pt-12 sm:pt-16">
        <div className="mx-auto max-w-[98vw] px-3 sm:px-6">
          <div className="gradient-outline">
            <div className="rounded-[26px] bg-[color:var(--surface-primary)]/70 backdrop-blur-2xl border border-white/5">
              <Suspense fallback={<LoadingSpinner size="lg" text="Loading content..." />}>
                {children}
              </Suspense>
            </div>
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

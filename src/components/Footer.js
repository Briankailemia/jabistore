'use client'

import Link from 'next/link'
import Image from 'next/image'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const QUICK_LINKS = [
  { label: 'Products', href: '/products' },
  { label: 'Categories', href: '/categories' },
  { label: 'Brands', href: '/brands' },
  { label: 'Search', href: '/search' },
]

const SUPPORT_LINKS = [
  { label: 'Contact', href: '/contact' },
  { label: 'Support Center', href: '/support' },
  { label: 'Orders', href: '/orders' },
  { label: 'Track Packages', href: '/orders/track' },
]

const POLICY_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[color:var(--surface-secondary)]/85 text-slate-300">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:gap-12 lg:px-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="relative w-24 h-8">
              <Image src="/dilitech-logo.svg" fill alt="Dilitech Solutions" sizes="96px" className="object-contain" />
            </div>
            <p className="text-2xl font-semibold text-white">Dilitech Solutions</p>
          </div>
          <p className="text-sm text-slate-400">
            Premium electronics, immersive creator gear, and seamless checkout experiences crafted for teams who ship modern work.
          </p>
          <div className="flex gap-3 text-slate-400">
            {['twitter', 'linkedin', 'instagram'].map((network) => (
              <button
                key={network}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 hover:border-sky-500/60 hover:text-white"
                aria-label={network}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 6.5c0-1 0-1.5.2-1.9a2 2 0 01.4-.6c.3-.3.7-.5 1.2-.6C6.7 3.2 7.2 3.2 8 3.2h8c.8 0 1.3 0 1.7.2.5.1.9.3 1.2.6.2.2.3.4.4.6.2.4.2.9.2 1.9v11c0 1 0 1.5-.2 1.9a2 2 0 01-.4.6 2 2 0 01-1.2.6c-.4.2-.9.2-1.7.2H8c-.8 0-1.3 0-1.7-.2a2 2 0 01-1.2-.6 2 2 0 01-.4-.6c-.2-.4-.2-.9-.2-1.9v-11z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Support</p>
          <ul className="mt-4 space-y-2 text-sm">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Card className="space-y-4 bg-slate-900/70 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Newsletter</p>
          <p className="text-sm text-slate-300">
            Monthly curation of launches, waitlists, and invite-only experiences. No spam.
          </p>
          <form className="space-y-3">
            <input
              type="email"
              placeholder="you@studio.com"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/70 focus:outline-none"
              required
            />
            <Button className="w-full" type="submit">
              Subscribe
            </Button>
          </form>
        </Card>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Dilitech Solutions</p>
          <div className="flex flex-wrap gap-4">
            {POLICY_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

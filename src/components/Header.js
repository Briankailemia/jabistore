'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/lib/apiService'

import Button, { buttonClasses } from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

const NAVIGATION = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/brands', label: 'Brands' },
  { href: '/categories', label: 'Categories' },
  { href: '/support', label: 'Support' },
]

export default function Header() {
  const { data: session } = useSession()
  const { data: cartItems } = useCart()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const cartItemCount = cartItems?.reduce((total, item) => total + (item.quantity || 0), 0) || 0

  return (
    <header className="sticky top-0 z-40 backdrop-blur-2xl border-b border-white/10 bg-[color:var(--surface-primary)]/70">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-[120px] h-[36px]">
            <Image
              src="/dilitech-logo.svg"
              fill
              alt="Dilitech Solutions logo"
              priority
              sizes="120px"
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight text-white">Dilitech Solutions</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
          {NAVIGATION.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'transition-colors hover:text-white',
                pathname === href && 'text-white underline decoration-sky-400 underline-offset-4',
              )}
            >
              {label}
            </Link>
          ))}
          {session && (
            <Link
              href="/orders"
              className={cn(
                'transition-colors hover:text-white',
                pathname?.startsWith('/orders') && 'text-white underline decoration-sky-400 underline-offset-4',
              )}
            >
              Orders
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {session ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[0.65rem] tracking-[0.25em] uppercase">
                {session.user.role || 'User'}
              </Badge>
              <Link
                href="/cart"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 text-slate-200 hover:border-sky-500/60"
                aria-label="Cart"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.5 5m2.5-5l2.5 5m5 0h5m-8 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-white">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                Sign in
              </Link>
              <Link href="/auth/signup" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                Create account
              </Link>
            </div>
          )}
        </div>

        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 text-white lg:hidden"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-full border-l border-white/10 bg-slate-950/95 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <p className="text-lg font-semibold text-white">Navigation</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dilitech Solutions</p>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="rounded-2xl border border-slate-700 p-2 text-slate-300"
                aria-label="Close menu"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="space-y-1 px-6 pb-6">
              {NAVIGATION.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-900/60',
                    pathname === href && 'border-sky-500/50 bg-slate-900/70 text-white',
                  )}
                >
                  <span>{label}</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
              {session && (
                <Link
                  href="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-900/60',
                    pathname?.startsWith('/orders') && 'border-sky-500/50 bg-slate-900/70 text-white',
                  )}
                >
                  <span>Orders</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </nav>

            <div className="px-6 pb-8">
              {session ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Account</p>
                  <p className="text-sm font-semibold text-white">{session.user.name || session.user.email}</p>
                  <div className="flex gap-3">
                    <Link href="/profile" className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'flex-1 text-center' })} onClick={() => setIsMenuOpen(false)}>
                      Profile
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIsMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                    >
                      Sign out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link href="/auth/signin" className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'flex-1 text-center' })} onClick={() => setIsMenuOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/auth/signup" className={buttonClasses({ variant: 'primary', size: 'sm', className: 'flex-1 text-center' })} onClick={() => setIsMenuOpen(false)}>
                    Join
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

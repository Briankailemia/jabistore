'use client'

import { useState, useMemo } from 'react'
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
  
  // Memoize cart count calculation to prevent unnecessary recalculations
  const cartItemCount = useMemo(() => {
    if (!cartItems || !Array.isArray(cartItems)) return 0;
    return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  }, [cartItems])

  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm border-b border-[color:var(--border-soft)] bg-white/95 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
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
            <p className="text-xl font-semibold tracking-tight text-black">Dilitech Solutions</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-700 lg:flex">
          {NAVIGATION.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'transition-colors hover:text-blue-900',
                pathname === href && 'text-blue-900 font-semibold underline decoration-blue-900 underline-offset-4',
              )}
            >
              {label}
            </Link>
          ))}
          {session && (
            <Link
              href="/orders"
              className={cn(
                'transition-colors hover:text-blue-600',
                pathname?.startsWith('/orders') && 'text-blue-600 font-semibold underline decoration-blue-500 underline-offset-4',
              )}
            >
              Orders
            </Link>
          )}
          {session?.user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={cn(
                'transition-colors hover:text-blue-900 font-semibold',
                pathname?.startsWith('/admin') && 'text-blue-900 underline decoration-blue-900 underline-offset-4',
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {session ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[0.65rem] tracking-[0.25em] uppercase border-gray-300 text-gray-700">
                {session.user.role || 'User'}
              </Badge>
              <Link
                href="/cart"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 text-gray-700 hover:border-blue-900 hover:text-blue-900 transition-colors"
                aria-label="Cart"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.5 5m2.5-5l2.5 5m5 0h5m-8 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white shadow-md">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 text-gray-700 hover:border-blue-900 hover:text-blue-900 transition-colors"
                aria-label="Profile"
                title={session.user.name || session.user.email || 'Profile'}
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={44}
                    height={44}
                    className="rounded-xl"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-blue-900 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {session.user.name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors lg:hidden"
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
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-full border-l border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <div>
                <p className="text-lg font-semibold text-black">Navigation</p>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Dilitech Solutions</p>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl border border-gray-300 p-2 text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
                aria-label="Close menu"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="space-y-1 px-6 pb-6 pt-4">
              {NAVIGATION.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-gray-700 hover:border-gray-200 hover:bg-gray-50 transition-colors',
                    pathname === href && 'border-blue-500/50 bg-blue-50 text-blue-600 font-semibold',
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
                    'flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-gray-700 hover:border-gray-200 hover:bg-gray-50 transition-colors',
                    pathname?.startsWith('/orders') && 'border-blue-500/50 bg-blue-50 text-blue-600 font-semibold',
                  )}
                >
                  <span>Orders</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
              {session?.user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-gray-700 hover:border-gray-200 hover:bg-gray-50 transition-colors font-semibold',
                    pathname?.startsWith('/admin') && 'border-blue-500/50 bg-blue-50 text-blue-600',
                  )}
                >
                  <span>Admin Dashboard</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </nav>

            <div className="px-6 pb-8 border-t border-gray-200 pt-6">
              {session ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Account</p>
                  <p className="text-sm font-semibold text-black">{session.user.name || session.user.email}</p>
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

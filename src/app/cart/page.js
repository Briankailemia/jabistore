'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useSession } from 'next-auth/react'

import { buttonClasses } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import Badge from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { OptimizedImage } from '@/components/OptimizedImage'
import { useCart } from '@/lib/apiService'
import { formatKES } from '@/lib/currency'

export default function CartPage() {
  const { data: session, status } = useSession()
  const { data: cartItems, loading, error, updateCartItem, removeFromCart, clearCart } = useCart()

  const totals = useMemo(() => {
    const subtotalValue = (cartItems || []).reduce((sum, item) => {
      const price = Number(item.product?.price || 0)
      return sum + price * Number(item.quantity || 0)
    }, 0)
    const shippingValue = subtotalValue > 75 ? 0 : 12.99
    const taxValue = subtotalValue * 0.085
    return {
      subtotal: subtotalValue,
      shipping: shippingValue,
      tax: taxValue,
      total: subtotalValue + shippingValue + taxValue,
    }
  }, [cartItems])

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(id)
      return
    }
    await updateCartItem(id, newQuantity)
  }

  const removeItem = async (id) => {
    await removeFromCart(id)
  }

  const handleClearCart = async () => {
    await clearCart()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" color="sky" text="Loading your cart" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-lg text-center space-y-4">
          <h2 className="text-2xl font-semibold text-white">Sign in to view your cart</h2>
          <p className="text-slate-400">We keep every item synced to your Dilitech ID.</p>
          <Link href="/auth/signin" className={buttonClasses({ size: 'md', className: 'w-full' })}>
            Sign in
          </Link>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-lg text-center space-y-4">
          <h2 className="text-2xl font-semibold text-white">We could not load your cart</h2>
          <p className="text-slate-400">{error}</p>
        </Card>
      </div>
    )
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-xl text-center space-y-4">
          <Badge variant="outline" className="mx-auto w-fit">Cart</Badge>
          <h2 className="text-3xl font-semibold text-white">Your cart is waiting</h2>
          <p className="text-slate-400">
            Save devices to this space from any page and we will sync them across desktop and mobile.
          </p>
          <Link href="/products" className={buttonClasses({ className: 'w-full sm:w-auto mx-auto' })}>
            Browse products
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      <section className="px-4">
        <SectionHeader
          eyebrow="Cart"
          eyebrowVariant="glow"
          title="Review your picks"
          description="Quantities update in real time and taxes adapt to your shipping address."
          align="left"
        />
      </section>

      <section className="px-4">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)]">
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cart items</p>
                <h2 className="text-2xl font-semibold text-white mt-1">{cartItems.length} device{cartItems.length === 1 ? '' : 's'}</h2>
              </div>
              <button
                onClick={handleClearCart}
                className="text-sm text-slate-400 hover:text-rose-300"
              >
                Clear cart
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {cartItems.map((item) => (
                <article key={item.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                    <OptimizedImage
                      src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                      alt={item.product?.name || 'Product'}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link href={`/products/${item.product?.slug || item.product?.id}`} className="text-lg font-semibold text-white hover:text-sky-300">
                      {item.product?.name}
                    </Link>
                    <p className="text-sm text-slate-400">{item.product?.brand?.name}</p>
                    <p className="text-xs text-slate-500">{item.product?.category?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-lg font-semibold text-white">{formatKES(item.product?.price)}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-9 w-9 rounded-2xl border border-white/10 text-white hover:border-slate-400"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-9 w-9 rounded-2xl border border-white/10 text-white hover:border-slate-400"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-rose-400 hover:text-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </Card>

          <Card className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Order summary</p>
              <h2 className="text-2xl font-semibold text-white mt-2">Ready for checkout</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <Row label="Subtotal" value={formatKES(totals.subtotal)} />
              <Row label="Shipping" value={totals.shipping === 0 ? 'Free' : formatKES(totals.shipping)} />
              <Row label="Tax" value={formatKES(totals.tax)} />
              <div className="border-t border-white/10 pt-3 text-base font-semibold text-white flex justify-between">
                <span>Total</span>
                <span>{formatKES(totals.total)}</span>
              </div>
            </div>
            <Link href="/checkout" className={buttonClasses({ className: 'w-full text-center' })}>
              Go to checkout
            </Link>
            <p className="text-xs text-slate-500">
              Stripe + M-Pesa supported. Taxes recalculate when you confirm your delivery address.
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

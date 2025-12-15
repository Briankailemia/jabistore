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
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-white">
        <LoadingSpinner size="lg" color="blue" text="Loading your cart" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 bg-gradient-to-br from-white via-blue-50 to-white">
        <Card className="max-w-lg text-center space-y-4 bg-white border-2 border-gray-200 shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">Sign in to view your cart</h2>
          <p className="text-gray-600">We keep every item synced to your Dilitech ID.</p>
          <Link href="/auth/signin" className={buttonClasses({ variant: 'primary', size: 'md', className: 'w-full' })}>
            Sign in
          </Link>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 bg-gradient-to-br from-white via-blue-50 to-white">
        <Card className="max-w-lg text-center space-y-4 bg-white border-2 border-gray-200 shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">We could not load your cart</h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    )
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 bg-gradient-to-br from-white via-blue-50 to-white">
        <Card className="max-w-xl text-center space-y-4 bg-white border-2 border-gray-200 shadow-xl">
          <Badge variant="glow" className="mx-auto w-fit bg-blue-50 text-blue-900 border-blue-200">Cart</Badge>
          <h2 className="text-3xl font-black text-gray-900">Your cart is waiting</h2>
          <p className="text-gray-600">
            Save devices to this space from any page and we will sync them across desktop and mobile.
          </p>
          <Link href="/products" className={buttonClasses({ variant: 'primary', className: 'w-full sm:w-auto mx-auto' })}>
            Browse products
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white space-y-10 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[36px] border-2 border-gray-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 px-6 py-16 sm:px-10 shadow-lg mx-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" />
        </div>
        <div className="relative z-10">
          <Badge variant="glow" className="inline-flex text-blue-900 bg-blue-100 border-blue-200 mb-4">
            Cart
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mt-3">Review your picks</h1>
          <p className="text-gray-600 mt-3 text-lg">
            Quantities update in real time and taxes adapt to your shipping address.
          </p>
        </div>
      </section>

      <section className="px-4">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)]">
          <Card className="p-0 bg-white border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between border-b-2 border-gray-100 px-6 py-5 bg-gray-50">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Cart items</p>
                <h2 className="text-2xl font-black text-gray-900 mt-1">{cartItems.length} device{cartItems.length === 1 ? '' : 's'}</h2>
              </div>
              <button
                onClick={handleClearCart}
                className="text-sm text-red-600 hover:text-red-700 font-bold transition-colors"
              >
                Clear cart
              </button>
            </div>

            <div className="divide-y-2 divide-gray-100">
              {cartItems.map((item) => (
                <article key={item.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center hover:bg-gray-50 transition-colors">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-100">
                    <OptimizedImage
                      src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                      alt={item.product?.name || 'Product'}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link href={`/products/${item.product?.slug || item.product?.id}`} className="text-lg font-black text-gray-900 hover:text-blue-900 transition-colors block">
                      {item.product?.name}
                    </Link>
                    <p className="text-sm text-gray-600 font-medium">{item.product?.brand?.name}</p>
                    <p className="text-xs text-gray-500">{item.product?.category?.name}</p>
                    <p className="text-base font-black text-blue-900 mt-2">{formatKES(item.product?.price)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-10 w-10 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-blue-900 hover:text-blue-900 hover:bg-blue-50 font-bold transition-colors"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-gray-900 font-black text-lg">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-10 w-10 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-blue-900 hover:text-blue-900 hover:bg-blue-50 font-bold transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-bold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </Card>

          <Card className="space-y-6 bg-white border-2 border-gray-200 shadow-lg sticky top-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Order summary</p>
              <h2 className="text-2xl font-black text-gray-900 mt-2">Ready for checkout</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <Row label="Subtotal" value={formatKES(totals.subtotal)} />
              <Row label="Shipping" value={totals.shipping === 0 ? 'Free' : formatKES(totals.shipping)} />
              <Row label="Tax" value={formatKES(totals.tax)} />
              <div className="border-t-2 border-gray-200 pt-3 text-base font-black text-gray-900 flex justify-between">
                <span>Total</span>
                <span className="text-blue-900">{formatKES(totals.total)}</span>
              </div>
            </div>
            <Link href="/checkout" className={buttonClasses({ variant: 'primary', className: 'w-full text-center font-bold' })}>
              Go to checkout
            </Link>
            <p className="text-xs text-gray-500">
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
      <span className="text-gray-600 font-medium">{label}</span>
      <span className="font-black text-gray-900">{value}</span>
    </div>
  )
}

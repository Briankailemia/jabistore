'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

import LoadingSpinner from '@/components/LoadingSpinner'
import { formatKES } from '@/lib/currency'
import { normalizeMpesaPhone, validateMpesaPhone, formatPhoneDisplay } from '@/lib/phoneUtils'
import { useToast } from '@/components/ui/Toast'

const STATUS_BADGES = {
  PENDING: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
  PROCESSING: 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30',
  SHIPPED: 'bg-blue-500/20 text-blue-200 border border-blue-400/30',
  DELIVERED: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30',
  CANCELLED: 'bg-rose-500/20 text-rose-200 border border-rose-400/30',
}

const PAYMENT_BADGES = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/30',
  PENDING: 'bg-amber-500/10 text-amber-200 border border-amber-400/30',
  FAILED: 'bg-rose-500/10 text-rose-200 border border-rose-400/30',
}

const formatDate = (value) => (value ? new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

export default function OrderDetailsPage() {
  const params = useParams()
  const orderIdentifier = params?.id
  const { data: session, status: sessionStatus } = useSession()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryingPayment, setRetryingPayment] = useState(false)
  const [retryPhone, setRetryPhone] = useState('')
  const [showRetryForm, setShowRetryForm] = useState(false)
  const [retryError, setRetryError] = useState('')
  const toast = useToast()

  useEffect(() => {
    if (!orderIdentifier || sessionStatus === 'loading') return
    if (!session) {
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/orders/${orderIdentifier}`, { cache: 'no-store' })
        if (!response.ok) {
          if (response.status === 404) throw new Error('Order not found')
          if (response.status === 401) throw new Error('You do not have access to this order')
          throw new Error('Unable to load order details')
        }
        const result = await response.json()
        // Handle API response structure
        const orderData = result.success && result.data ? result.data : result
        setOrder(orderData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderIdentifier, session, sessionStatus])

  // Auto-fill phone from shipping address
  useEffect(() => {
    if (order?.shippingAddress?.phone) {
      setRetryPhone(order.shippingAddress.phone)
    }
  }, [order])

  const handleRetryPayment = async () => {
    if (!retryPhone.trim()) {
      setRetryError('Please enter your M-Pesa phone number')
      return
    }

    const normalizedPhone = normalizeMpesaPhone(retryPhone)
    if (!validateMpesaPhone(normalizedPhone)) {
      setRetryError('Please enter a valid Kenyan phone number (e.g., 254712345678 or 0712345678)')
      return
    }

    setRetryingPayment(true)
    setRetryError('')

    try {
      const response = await fetch('/api/payments/mpesa/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.id,
          phone: normalizedPhone
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Refresh order to get updated status
        const orderResponse = await fetch(`/api/orders/${orderIdentifier}`, { cache: 'no-store' })
        if (orderResponse.ok) {
          const updatedOrder = await orderResponse.json()
          setOrder(updatedOrder)
        }
        setShowRetryForm(false)
        
        // Show success toast with helpful information
        if (result.mock) {
          toast.warning(result.message)
        } else if (result.isSandbox) {
          toast.info(result.message)
        } else {
          toast.success(result.message)
        }
      } else {
        const errorMsg = result.message || 'Failed to retry payment. Please try again.'
        setRetryError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      console.error('Retry payment error:', err)
      setRetryError('Failed to retry payment. Please try again.')
    } finally {
      setRetryingPayment(false)
    }
  }

  const totals = useMemo(() => {
    if (!order) return { subtotal: 0, shipping: 0, tax: 0, discount: 0, total: 0 }
    return {
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
    }
  }, [order])

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <LoadingSpinner size="lg" color="blue" text="Loading order details" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-6">
          <h1 className="text-3xl font-semibold text-white">Sign in to view this order</h1>
          <p className="text-slate-400">Orders are protected for your security. Sign in with the account that placed this purchase.</p>
          <Link
            href="/auth/signin"
            className="inline-flex justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold hover:opacity-90 transition"
          >
            Continue to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <p className="text-xl font-semibold text-white">{error}</p>
          <p className="text-slate-400">If this order should exist, contact support and share the order number {orderIdentifier}.</p>
          <Link href="/orders" className="inline-flex justify-center px-6 py-3 rounded-2xl border border-slate-700 text-white hover:bg-slate-800">
            Back to orders
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <nav className="text-sm text-slate-400 flex items-center gap-2">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>›</span>
          <Link href="/orders" className="hover:text-white">Orders</Link>
          <span>›</span>
          <span className="text-white font-medium">{order.orderNumber}</span>
        </nav>

        <header className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Order</p>
              <h1 className="text-4xl font-semibold mt-2">{order.orderNumber}</h1>
              <p className="text-slate-400 mt-2">Placed {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-xs font-semibold ${STATUS_BADGES[order.status] || 'bg-slate-800 border border-slate-700'}`}>
                {order.status ? order.status.toLowerCase() : 'Unknown'}
              </span>
              <span className={`px-4 py-2 rounded-full text-xs font-semibold ${PAYMENT_BADGES[order.paymentStatus] || 'bg-slate-800 border border-slate-700'}`}>
                payment {order.paymentStatus ? order.paymentStatus.toLowerCase() : 'Unknown'}
              </span>
                 <span className="px-4 py-2 rounded-full border border-slate-700 text-sm font-semibold text-sky-200">
                   {formatKES(order.total)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <div>Payment method: <span className="text-white font-medium">{order.paymentMethod?.toUpperCase() || '—'}</span></div>
            {order.trackingNumber && (
              <div>Tracking: <span className="font-mono text-slate-200">{order.trackingNumber}</span></div>
            )}
            {order.carrier && (
              <div>Carrier: <span className="text-slate-200">{order.carrier}</span></div>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-4">Items</h2>
              <div className="space-y-5">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
                      {item.product?.images?.[0]?.url ? (
                        <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-500">IMG</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white line-clamp-2">{item.product?.name || 'Product removed'}</p>
                      <p className="text-sm text-slate-400">Qty {item.quantity}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-semibold text-white">{formatKES(Number(item.price) * item.quantity)}</p>
                       <p className="text-sm text-slate-400">{formatKES(Number(item.price))} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-4">Timeline</h2>
              <ol className="space-y-4">
                {buildTimeline(order).map((event) => (
                  <li key={event.status} className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${event.completed ? 'bg-sky-400' : 'bg-slate-600'}`}></div>
                    <div>
                      <p className="font-medium text-white">{event.status}</p>
                      <p className="text-sm text-slate-400">{event.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(event.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <dl className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatKES(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{formatKES(totals.shipping)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Tax</dt>
                  <dd>{formatKES(totals.tax)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-rose-300">
                    <dt>Discount</dt>
                    <dd>-{formatKES(totals.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-3 mt-3 border-t border-slate-800 text-base font-semibold text-white">
                  <dt>Total</dt>
                  <dd>{formatKES(totals.total)}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Shipping</h2>
                <address className="not-italic text-slate-300 text-sm">
                  {order.shippingAddress ? (
                    <>
                      <p className="text-white font-medium">
                        {order.shippingAddress?.fullName || `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim() || 'Recipient'}
                      </p>
                      <p>{order.shippingAddress?.street || order.shippingAddress?.address1 || ''}</p>
                      {order.shippingAddress?.address2 && <p>{order.shippingAddress.address2}</p>}
                      <p>
                        {order.shippingAddress?.city || ''}{order.shippingAddress?.city && order.shippingAddress?.state ? ', ' : ''}{order.shippingAddress?.state || ''} {order.shippingAddress?.postalCode || ''}
                      </p>
                      {order.shippingAddress?.country && <p>{order.shippingAddress.country}</p>}
                      {order.shippingAddress?.phone && <p className="mt-2">{order.shippingAddress.phone}</p>}
                    </>
                  ) : (
                    <p className="text-slate-500">No shipping address attached.</p>
                  )}
                </address>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Payment</h2>
                <p className="text-sm text-slate-300">Reference: {order.paymentReference || '—'}</p>
                {order.mpesaReceiptNumber && (
                  <p className="text-sm text-slate-300">M-Pesa receipt: {order.mpesaReceiptNumber}</p>
                )}
                {order.stripePaymentIntentId && (
                  <p className="text-sm text-slate-300">Stripe intent: {order.stripePaymentIntentId}</p>
                )}
                
                {/* Retry Payment Button for Pending/Failed Payments */}
                {order.paymentMethod === 'mpesa' && (order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED') && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    {!showRetryForm ? (
                      <button
                        onClick={() => setShowRetryForm(true)}
                        className="w-full px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold hover:opacity-90 transition"
                      >
                        Retry M-Pesa Payment
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            M-Pesa Phone Number
                          </label>
                          <input
                            type="tel"
                            value={retryPhone}
                            onChange={(e) => {
                              setRetryPhone(e.target.value)
                              setRetryError('')
                            }}
                            onBlur={(e) => {
                              const normalized = normalizeMpesaPhone(e.target.value)
                              setRetryPhone(normalized)
                            }}
                            placeholder="254712345678 or 0712345678"
                            className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                              retryError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-emerald-500 focus:border-emerald-500'
                            }`}
                          />
                          {retryError && (
                            <p className="mt-1 text-xs text-rose-400">{retryError}</p>
                          )}
                          {retryPhone && !retryError && validateMpesaPhone(retryPhone) && (
                            <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {formatPhoneDisplay(retryPhone)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleRetryPayment}
                            disabled={retryingPayment || !retryPhone.trim()}
                            className="flex-1 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {retryingPayment ? (
                              <>
                                <LoadingSpinner size="small" color="white" />
                                Sending...
                              </>
                            ) : (
                              'Send STK Push'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowRetryForm(false)
                              setRetryError('')
                            }}
                            className="px-4 py-2 rounded-2xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {order.trackingNumber && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h2 className="text-xl font-semibold mb-3">Package Tracking</h2>
                <p className="text-sm text-slate-400 mb-4">Track your order in real-time</p>
                <Link
                  href={`/orders/${order.id}/track`}
                  className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Track Package
                </Link>
                {order.carrier && (
                  <p className="text-xs text-slate-500 mt-2">Carrier: {order.carrier}</p>
                )}
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-3">Need help?</h2>
              <p className="text-sm text-slate-400 mb-4">Contact concierge support and reference order {order.orderNumber}.</p>
              <div className="flex flex-col gap-3">
                <a href="mailto:support@dilitechsolutions.com" className="px-4 py-2 rounded-2xl border border-slate-700 text-white hover:bg-slate-800 text-sm">
                  Email support
                </a>
                <a href={`https://wa.me/254700000000?text=Hi%20Dilitech,%20I%20need%20help%20with%20${order.orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm text-center hover:opacity-90">
                  WhatsApp concierge
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function buildTimeline(order) {
  const created = new Date(order.createdAt)
  const shipped = new Date(created.getTime() + 24 * 60 * 60 * 1000)
  const delivered = order.deliveredAt ? new Date(order.deliveredAt) : new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000)

  return [
    {
      status: 'Order placed',
      description: 'We received your order and confirmed payment.',
      timestamp: created,
      completed: true,
    },
    {
      status: 'Processing',
      description: 'Hardware is being prepared in our Nairobi warehouse.',
      timestamp: new Date(created.getTime() + 2 * 60 * 60 * 1000),
      completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
    },
    {
      status: 'Shipped',
      description: order.carrier ? `Dispatched via ${order.carrier}.` : 'On the way to the courier.',
      timestamp: shipped,
      completed: ['SHIPPED', 'DELIVERED'].includes(order.status),
    },
    {
      status: 'Delivered',
      description: 'Handed over to you.',
      timestamp: delivered,
      completed: order.status === 'DELIVERED',
    },
  ]
}

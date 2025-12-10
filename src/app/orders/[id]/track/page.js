'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

import LoadingSpinner from '@/components/LoadingSpinner'

const STATUS_BADGES = {
  ORDER_PLACED: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
  PROCESSING: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30',
  SHIPPED: 'bg-purple-500/20 text-purple-200 border border-purple-500/30',
  IN_TRANSIT: 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30',
  OUT_FOR_DELIVERY: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
  DELIVERED: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
}

const formatDate = (value) => (value ? new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

export default function TrackOrderPage() {
  const params = useParams()
  const { data: session, status: sessionStatus } = useSession()
  const orderId = params?.id
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orderId || sessionStatus === 'loading') return
    if (!session) {
      setLoading(false)
      setError('Please sign in to view tracking details')
      return
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/orders/${orderId}`, { 
          credentials: 'include',
          cache: 'no-store' 
        })
        if (!response.ok) {
          if (response.status === 404) throw new Error('Order not found')
          if (response.status === 401) throw new Error('You do not have access to this order')
          throw new Error('Unable to load tracking details')
        }
        const data = await response.json()
        setOrder(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, session, sessionStatus])

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner size="lg" color="blue" text="Loading tracking details" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <p className="text-xl font-semibold text-white">Sign in to view tracking</p>
          <p className="text-slate-400">Please sign in to access order tracking details.</p>
          <Link href="/auth/signin" className="inline-flex justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold hover:opacity-90 transition">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <p className="text-xl font-semibold text-white">{error || 'Tracking data unavailable.'}</p>
          <p className="text-slate-400">Check the order and try again.</p>
          <Link href="/orders" className="inline-flex justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold hover:opacity-90 transition">
            Back to orders
          </Link>
        </div>
      </div>
    )
  }

  // Build timeline from order status
  const buildTimeline = (order) => {
    const created = new Date(order.createdAt)
    const shipped = order.trackingNumber ? new Date(created.getTime() + 24 * 60 * 60 * 1000) : null
    const delivered = order.deliveredAt ? new Date(order.deliveredAt) : null

    const timeline = [
      {
        status: 'Order placed',
        description: 'We received your order and confirmed payment.',
        timestamp: created,
        completed: true,
      },
      {
        status: 'Processing',
        description: 'Hardware is being prepared in our warehouse.',
        timestamp: new Date(created.getTime() + 2 * 60 * 60 * 1000),
        completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
      },
    ]

    if (shipped) {
      timeline.push({
        status: 'Shipped',
        description: order.carrier ? `Dispatched via ${order.carrier}.` : 'On the way to the courier.',
        timestamp: shipped,
        completed: ['SHIPPED', 'DELIVERED'].includes(order.status),
      })
    }

    if (delivered) {
      timeline.push({
        status: 'Delivered',
        description: 'Handed over to you.',
        timestamp: delivered,
        completed: order.status === 'DELIVERED',
      })
    }

    return timeline
  }

  const timeline = buildTimeline(order)
  const trackingUrl = order.trackingNumber ? `https://track.example.com/${order.trackingNumber}` : null
  const estimatedDelivery = order.trackingNumber 
    ? new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000)
    : null

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <nav className="text-sm text-slate-400 flex items-center gap-2">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>›</span>
          <Link href="/orders" className="hover:text-white">Orders</Link>
          <span>›</span>
          <span className="text-white font-medium">Tracking</span>
        </nav>

        <header className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Order</p>
              <p className="text-xl font-semibold">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tracking</p>
              <p className="font-mono text-sm text-sky-200">{order.trackingNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Carrier</p>
              <p className="text-sm">{order.carrier || 'Dilitech Logistics'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-xs font-semibold ${STATUS_BADGES[order.status] || 'bg-slate-800 border border-slate-700'}`}>
              {order.status.toLowerCase()}
            </span>
            {estimatedDelivery && (
              <span className="text-sm text-slate-300">Estimated delivery {formatDate(estimatedDelivery)}</span>
            )}
            {trackingUrl && (
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-300 hover:text-sky-100">
                View carrier portal →
              </a>
            )}
          </div>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-xl font-semibold mb-6">Tracking history</h2>
          <ol className="space-y-6">
            {timeline.map((event, index) => (
              <li key={event.status} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${event.completed ? 'bg-sky-400' : 'bg-slate-600'}`}></div>
                  {index < timeline.length - 1 && (
                    <div className={`w-px flex-1 ${event.completed ? 'bg-sky-500/40' : 'bg-slate-700'}`}></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${event.completed ? 'text-white' : 'text-slate-500'}`}>{event.status}</p>
                  <p className="text-sm text-slate-400">{event.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(event.timestamp)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-sm text-slate-300">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Destination</p>
            {order.shippingAddress ? (
              <div className="mt-2 space-y-1">
                <p className="text-white font-medium">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            ) : (
              <p className="mt-2">No shipping address on file.</p>
            )}
          </div>
          <div className="flex flex-col gap-2 text-xs text-slate-500">
            <p>Need help? Email <a href="mailto:support@dilitechsolutions.com" className="text-sky-300">support@dilitechsolutions.com</a></p>
            <p>WhatsApp concierge <a
                href={`https://wa.me/254700000000?text=Hi%20Dilitech,%20check%20order%20${order.orderNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-300"
              >+254 700 000 000</a></p>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/orders/${order.id}`}
            className="flex-1 bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 rounded-2xl text-center font-semibold hover:opacity-90"
          >
            View order details
          </Link>
          <Link
            href="/orders"
            className="flex-1 border border-slate-700 text-white py-3 rounded-2xl text-center hover:bg-slate-900"
          >
            Back to orders
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

import LoadingSpinner from '@/components/LoadingSpinner'
import { useOrders } from '@/lib/apiService'
import { formatKES } from '@/lib/currency'

const STATUS_TABS = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const STATUS_THEMES = {
  PENDING: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
  PROCESSING: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30',
  SHIPPED: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
  DELIVERED: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
  CANCELLED: 'bg-rose-500/20 text-rose-200 border border-rose-500/30',
  REFUNDED: 'bg-slate-500/20 text-slate-200 border border-slate-500/30',
  CONFIRMED: 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30',
}

const PAYMENT_THEMES = {
  PENDING: 'bg-amber-500/20 text-amber-100 border border-amber-500/30',
  PROCESSING: 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30',
  FAILED: 'bg-rose-500/20 text-rose-100 border border-rose-500/30',
  REFUNDED: 'bg-slate-500/20 text-slate-100 border border-slate-500/30',
}

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrdersPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const { data: ordersPayload, loading, error } = useOrders({ limit: 50 })

  const orders = useMemo(() => ordersPayload?.orders || [], [ordersPayload])
  const filteredOrders = useMemo(() => {
    if (selectedStatus === 'ALL') return orders
    return orders.filter((order) => order.status === selectedStatus)
  }, [orders, selectedStatus])

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <LoadingSpinner size="lg" color="blue" text="Checking your session" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-6">
          <h1 className="text-3xl font-semibold text-white">Sign in to view orders</h1>
          <p className="text-slate-400">Track laptops, phones, and creator gear you have purchased from Dilitech Solutions.</p>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold text-white mb-8">Your Orders</h1>
          <OrderListSkeleton count={5} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-white">
        <div className="max-w-md text-center space-y-4">
          <p className="text-xl font-semibold">We couldn’t load your orders.</p>
          <p className="text-slate-400">Please refresh or try again shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Order desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mt-3">Manage your purchases</h1>
          <p className="text-slate-400 mt-3">
            Track premium hardware orders, download invoices, and monitor delivery in one place.
          </p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl px-4 sm:px-6 mb-8">
          <div className="flex flex-wrap">
            {STATUS_TABS.map((status) => {
              const active = selectedStatus === status
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium transition border-b-2 ${
                    active
                      ? 'border-sky-500 text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-200'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status.toLowerCase().replace(/^(\w)/, (c) => c.toUpperCase())}
                  <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-200">
                    {status === 'ALL'
                      ? orders.length
                      : orders.filter((order) => order.status === status).length}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-16 text-center">
            <p className="text-xl font-semibold text-white mb-3">No orders in this lane</p>
            <p className="text-slate-400 mb-8">
              {selectedStatus === 'ALL'
                ? 'You haven’t placed any orders yet.'
                : `No orders marked as ${selectedStatus.toLowerCase()}.`}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold hover:opacity-90 transition"
            >
              Browse catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <article key={order.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Order</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <p className="text-xl font-semibold">{order.orderNumber}</p>
                      <span className="text-slate-400 text-sm">Placed {formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_THEMES[order.status] || 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                      {order.status.toLowerCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PAYMENT_THEMES[order.paymentStatus] || 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                      {order.paymentStatus.toLowerCase()}
                    </span>
                        <p className="text-lg font-semibold text-sky-200">{formatKES(order.total)}</p>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sky-300 hover:text-sky-100 text-sm font-medium"
                    >
                      View details →
                    </Link>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden">
                        {item.product?.images?.[0]?.url ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-500">IMG</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium line-clamp-2">{item.product?.name || 'Product removed'}</p>
                        <p className="text-sm text-slate-400">Qty {item.quantity}</p>
                      </div>
                      <div className="text-right">
                            <p className="text-white font-semibold">{formatKES(Number(item.price) * item.quantity)}</p>
                            <p className="text-sm text-slate-400">{formatKES(Number(item.price))} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-5 border-t border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-sm text-slate-400 space-y-1">
                    <p>Payment method: <span className="text-white font-medium">{order.paymentMethod?.toUpperCase() || '—'}</span></p>
                    {order.mpesaReceiptNumber && (
                      <p>M-Pesa Receipt: <span className="font-mono text-emerald-400">{order.mpesaReceiptNumber}</span></p>
                    )}
                    {order.trackingNumber ? (
                      <div className="flex items-center gap-2">
                        <p>Tracking: <span className="font-mono text-white">{order.trackingNumber}</span></p>
                        <Link
                          href={`/orders/${order.id}/track`}
                          className="text-sky-400 hover:text-sky-300 text-xs font-medium underline"
                        >
                          View tracking details →
                        </Link>
                      </div>
                    ) : (
                      <p className="text-slate-500">Tracking number will be available once your order ships</p>
                    )}
                    {order.shippingAddress && (
                      <p>
                        Ship to: <span className="text-white">{order.shippingAddress.address1}, {order.shippingAddress.city}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 rounded-2xl bg-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-700">
                      Download invoice
                    </button>
                    {order.trackingNumber && (
                      <Link
                        href={`/orders/${order.id}/track`}
                        className="px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Track Package
                      </Link>
                    )}
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2 rounded-2xl border border-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

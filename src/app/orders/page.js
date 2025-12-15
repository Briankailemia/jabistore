'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

import LoadingSpinner from '@/components/LoadingSpinner'
import { OrderListSkeleton } from '@/components/SkeletonLoader'
import { OptimizedImage } from '@/components/OptimizedImage'
import { useOrders } from '@/lib/apiService'
import { formatKES } from '@/lib/currency'

const STATUS_TABS = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const STATUS_THEMES = {
  PENDING: 'bg-amber-50 text-amber-900 border-2 border-amber-300',
  PROCESSING: 'bg-blue-50 text-blue-900 border-2 border-blue-300',
  SHIPPED: 'bg-indigo-50 text-indigo-900 border-2 border-indigo-300',
  DELIVERED: 'bg-emerald-50 text-emerald-900 border-2 border-emerald-300',
  CANCELLED: 'bg-red-50 text-red-900 border-2 border-red-300',
  REFUNDED: 'bg-gray-50 text-gray-900 border-2 border-gray-300',
  CONFIRMED: 'bg-cyan-50 text-cyan-900 border-2 border-cyan-300',
}

const PAYMENT_THEMES = {
  PENDING: 'bg-amber-50 text-amber-900 border-2 border-amber-300',
  PROCESSING: 'bg-blue-50 text-blue-900 border-2 border-blue-300',
  COMPLETED: 'bg-emerald-50 text-emerald-900 border-2 border-emerald-300',
  FAILED: 'bg-red-50 text-red-900 border-2 border-red-300',
  REFUNDED: 'bg-gray-50 text-gray-900 border-2 border-gray-300',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-white">
        <LoadingSpinner size="lg" color="blue" text="Checking your session" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white border-2 border-gray-200 rounded-3xl p-10 text-center space-y-6 shadow-xl">
          <h1 className="text-3xl font-black text-gray-900">Sign in to view orders</h1>
          <p className="text-gray-600">Track laptops, phones, and creator gear you have purchased from Dilitech Solutions.</p>
          <Link
            href="/auth/signin"
            className="inline-flex justify-center px-6 py-3 rounded-2xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition shadow-lg hover:shadow-xl"
          >
            Continue to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-gray-900 mb-8">Your Orders</h1>
          <OrderListSkeleton count={5} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-white">
        <div className="max-w-md text-center space-y-4 bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-xl">
          <p className="text-xl font-bold text-gray-900">We couldn't load your orders.</p>
          <p className="text-gray-600">Please refresh or try again shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <header className="relative overflow-hidden rounded-[36px] border-2 border-gray-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 px-6 py-16 sm:px-10 shadow-lg mb-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
            <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" />
          </div>
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.35em] text-blue-700 font-bold mb-2">Order Desk</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mt-3">Manage your purchases</h1>
            <p className="text-gray-600 mt-3 text-lg">
              Track premium hardware orders, download invoices, and monitor delivery in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-xl px-4 py-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total Orders</p>
                <p className="text-2xl font-black text-blue-900">{orders.length}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Status Tabs */}
        <div className="bg-white border-2 border-gray-200 rounded-3xl px-4 sm:px-6 mb-8 shadow-md">
          <div className="flex flex-wrap">
            {STATUS_TABS.map((status) => {
              const active = selectedStatus === status
              const count = status === 'ALL'
                ? orders.length
                : orders.filter((order) => order.status === status).length
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-bold transition border-b-2 ${
                    active
                      ? 'border-blue-900 text-blue-900 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-blue-900 hover:bg-gray-50'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status.toLowerCase().replace(/^(\w)/, (c) => c.toUpperCase())}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    active
                      ? 'bg-blue-900 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center shadow-md">
            <p className="text-xl font-black text-gray-900 mb-3">No orders in this lane</p>
            <p className="text-gray-600 mb-8">
              {selectedStatus === 'ALL'
                ? "You haven't placed any orders yet."
                : `No orders marked as ${selectedStatus.toLowerCase()}.`}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition shadow-lg hover:shadow-xl"
            >
              Browse catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <article key={order.id} className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="px-6 py-5 border-b-2 border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Order</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <p className="text-xl font-black text-gray-900">{order.orderNumber}</p>
                      <span className="text-gray-600 text-sm font-medium">Placed {formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_THEMES[order.status] || 'bg-gray-100 text-gray-900 border-2 border-gray-300'}`}>
                      {order.status.toLowerCase()}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${PAYMENT_THEMES[order.paymentStatus] || 'bg-gray-100 text-gray-900 border-2 border-gray-300'}`}>
                      {order.paymentStatus.toLowerCase()}
                    </span>
                    <p className="text-lg font-black text-blue-900">{formatKES(order.total)}</p>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-blue-900 hover:text-blue-700 text-sm font-bold transition-colors"
                    >
                      View details →
                    </Link>
                  </div>
                </div>

                <div className="p-6 space-y-4 bg-gray-50">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                        {item.product?.images?.[0]?.url ? (
                          <OptimizedImage
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-400 font-semibold">IMG</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-bold line-clamp-2">{item.product?.name || 'Product removed'}</p>
                        <p className="text-sm text-gray-600 font-medium mt-1">Qty {item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-gray-900 font-black">{formatKES(Number(item.price) * item.quantity)}</p>
                        <p className="text-sm text-gray-600 font-medium">{formatKES(Number(item.price))} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-5 border-t-2 border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white">
                  <div className="text-sm text-gray-600 space-y-2">
                    <p className="font-medium">Payment method: <span className="text-gray-900 font-bold">{order.paymentMethod?.toUpperCase() || '—'}</span></p>
                    {order.mpesaReceiptNumber && (
                      <p className="font-medium">M-Pesa Receipt: <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">{order.mpesaReceiptNumber}</span></p>
                    )}
                    {order.trackingNumber ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">Tracking: <span className="font-mono text-gray-900 font-bold bg-blue-50 px-2 py-0.5 rounded">{order.trackingNumber}</span></p>
                        <Link
                          href={`/orders/${order.id}/track`}
                          className="text-blue-900 hover:text-blue-700 text-xs font-bold underline"
                        >
                          View tracking details →
                        </Link>
                      </div>
                    ) : (
                      <p className="text-gray-500">Tracking number will be available once your order ships</p>
                    )}
                    {order.shippingAddress && (
                      <p className="font-medium">
                        Ship to: <span className="text-gray-900 font-bold">{order.shippingAddress.address1}, {order.shippingAddress.city}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        // Open invoice in new window and trigger print dialog
                        const invoiceWindow = window.open(`/orders/${order.id}/invoice?download=true`, '_blank')
                        // Wait a bit for the page to load, then trigger print
                        setTimeout(() => {
                          if (invoiceWindow) {
                            invoiceWindow.focus()
                          }
                        }, 1000)
                      }}
                      className="px-4 py-2 rounded-xl bg-gray-100 text-gray-900 text-sm font-bold hover:bg-gray-200 border-2 border-gray-300 transition-colors inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download invoice
                    </button>
                    {order.trackingNumber && (
                      <Link
                        href={`/orders/${order.id}/track`}
                        className="px-4 py-2 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-800 flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Track Package
                      </Link>
                    )}
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-900 text-sm font-bold hover:border-blue-900 hover:text-blue-900 transition-colors"
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

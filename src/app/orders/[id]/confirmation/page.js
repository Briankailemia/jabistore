'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatKES } from '@/lib/currency'
import { normalizeMpesaPhone, validateMpesaPhone, formatPhoneDisplay } from '@/lib/phoneUtils'
import { useToast } from '@/components/ui/Toast'

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryingPayment, setRetryingPayment] = useState(false)
  const [retryPhone, setRetryPhone] = useState('')
  const [showRetryForm, setShowRetryForm] = useState(false)
  const [retryError, setRetryError] = useState('')
  const toast = useToast()

  useEffect(() => {
    const fetchOrder = async () => {
      if (!params.id) return
      
      try {
        const response = await fetch(`/api/orders/${params.id}`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setOrder(data)
        } else {
          setError('Order not found')
        }
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchOrder()
    }
  }, [params.id, session])

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
        const orderResponse = await fetch(`/api/orders/${order.id}`, {
          credentials: 'include'
        })
        if (orderResponse.ok) {
          const updatedOrder = await orderResponse.json()
          setOrder(updatedOrder)
        }
        setShowRetryForm(false)
        
        // Show appropriate toast message
        if (result.mock) {
          toast.warning(result.message)
        } else if (result.isSandbox) {
          toast.info(result.message)
        } else {
          toast.success(result.message)
        }
        
        // Start polling for payment status
        // The user will see the payment waiting screen if they navigate back
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/orders/${params.id}/confirmation`))
    return null
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-4">Order Not Found</h1>
          <p className="text-slate-300 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <Link
            href="/orders"
            className="inline-block bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-sky-500/25"
          >
            View All Orders
          </Link>
        </div>
      </div>
    )
  }

  const isPaid = order.paymentStatus === 'COMPLETED'
  const isPending = order.paymentStatus === 'PENDING'
  const isFailed = order.paymentStatus === 'FAILED'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          {isPaid ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Order Confirmed!
              </h1>
              <p className="text-xl text-slate-300 mb-2">Thank you for your purchase</p>
              <p className="text-slate-400">Order #{order.orderNumber}</p>
            </>
          ) : isPending ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4">Payment Pending</h1>
              <p className="text-xl text-slate-300 mb-2">Waiting for payment confirmation</p>
              <p className="text-slate-400">Order #{order.orderNumber}</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/50">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4">Payment Failed</h1>
              <p className="text-xl text-slate-300 mb-2">Your payment could not be processed</p>
              <p className="text-slate-400">Order #{order.orderNumber}</p>
            </>
          )}
        </div>

        {/* Order Details Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold mb-6">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Order Number</h3>
              <p className="text-lg font-semibold text-white">{order.orderNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Order Date</h3>
              <p className="text-lg font-semibold text-white">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Payment Status</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                isPaid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                isPending ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {order.paymentStatus}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Order Status</h3>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {order.status}
              </span>
            </div>
          </div>

          {order.mpesaReceiptNumber && (
            <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
              <h3 className="text-sm font-medium text-emerald-300 mb-1">M-Pesa Receipt Number</h3>
              <p className="text-lg font-mono text-emerald-200">{order.mpesaReceiptNumber}</p>
            </div>
          )}

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Items Ordered</h3>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex-shrink-0">
                    {item.product?.images?.[0]?.url && (
                      <img
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{item.product?.name || 'Product'}</h4>
                    <p className="text-sm text-slate-400">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sky-400">{formatKES(Number(item.price) * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-white/10 pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white font-medium">{formatKES(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Discount</span>
                  <span className="text-emerald-400 font-medium">-{formatKES(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Shipping</span>
                <span className="text-white font-medium">{formatKES(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tax</span>
                <span className="text-white font-medium">{formatKES(order.tax)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-white">Total</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                  {formatKES(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold mb-4">Shipping Address</h2>
            <div className="text-slate-300 leading-relaxed">
              <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.address1}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/orders"
            className="px-8 py-3 bg-slate-800/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all border border-slate-600 text-center font-semibold"
          >
            View All Orders
          </Link>
          {isPaid && (
            <Link
              href="/"
              className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-sky-500/25 text-center"
            >
              Continue Shopping
            </Link>
          )}
          {(isPending || isFailed) && (
            <>
              {!showRetryForm ? (
                <button
                  onClick={() => setShowRetryForm(true)}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg shadow-emerald-500/25"
                >
                  Retry Payment
                </button>
              ) : (
                <div className="w-full sm:w-auto">
                  <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
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
                      className={`w-full px-4 py-2 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        retryError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-emerald-500 focus:border-emerald-500'
                      }`}
                    />
                    {retryError && (
                      <p className="mt-2 text-sm text-rose-400">{retryError}</p>
                    )}
                    {retryPhone && !retryError && validateMpesaPhone(retryPhone) && (
                      <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Valid: {formatPhoneDisplay(retryPhone)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetryPayment}
                      disabled={retryingPayment || !retryPhone.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {retryingPayment ? (
                        <>
                          <LoadingSpinner size="small" color="white" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Send STK Push
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowRetryForm(false)
                        setRetryError('')
                      }}
                      className="px-6 py-3 bg-slate-800/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all border border-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


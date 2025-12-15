'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { formatKES } from '@/lib/currency'
import LoadingSpinner from '@/components/LoadingSpinner'

const formatDate = (value) => {
  if (!value) return '—'
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch (error) {
    return '—'
  }
}

export default function InvoicePage() {
  const params = useParams()
  const orderId = params?.id
  const { data: session, status: sessionStatus } = useSession()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orderId || sessionStatus === 'loading') return
    if (!session) {
      setLoading(false)
      setError('Please sign in to view invoice')
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
          if (response.status === 401) throw new Error('You do not have access to this invoice')
          throw new Error('Unable to load invoice')
        }
        const result = await response.json()
        const orderData = result.success && result.data ? result.data : result
        setOrder(orderData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, session, sessionStatus])

  const handleDownloadPDF = () => {
    // Trigger browser's print dialog which allows saving as PDF
    window.print()
  }

  useEffect(() => {
    // Auto-download when page loads (only if opened from download button)
    if (order && !loading && window.location.search.includes('download=true')) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [order, loading])

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" color="blue" text="Loading invoice" />
      </div>
    )
  }

  if (!session || error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md text-center">
          <p className="text-xl font-bold text-gray-900 mb-2">{error || 'Invoice not available'}</p>
          <p className="text-gray-600">Please check the order and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      {/* Download Button - Hidden in print */}
      <div className="no-print max-w-4xl mx-auto mb-6 flex justify-end">
        <button
          onClick={handleDownloadPDF}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download as PDF
        </button>
      </div>
      <div className="max-w-4xl mx-auto">
        {/* Invoice Header */}
        <div className="border-b-2 border-gray-900 pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">INVOICE</h1>
              <p className="text-gray-600">Invoice #{order.orderNumber}</p>
              <p className="text-gray-600">Date: {formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dilitech Solutions</h2>
              <p className="text-sm text-gray-600">600 California St, Suite 420</p>
              <p className="text-sm text-gray-600">San Francisco, CA 94108</p>
              <p className="text-sm text-gray-600 mt-2">support@dilitechsolutions.com</p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Bill To</h3>
            <p className="font-semibold text-gray-900">{order.user?.name || 'Customer'}</p>
            <p className="text-gray-600">{order.user?.email || ''}</p>
            {order.shippingAddress && (
              <div className="mt-2 text-sm text-gray-600">
                <p>{order.shippingAddress.fullName || order.shippingAddress.street}</p>
                {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                <p>
                  {order.shippingAddress.city || ''}
                  {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
                  {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ''}
                </p>
                {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Order Details</h3>
            <p className="text-gray-600"><span className="font-semibold">Order Number:</span> {order.orderNumber}</p>
            <p className="text-gray-600"><span className="font-semibold">Status:</span> {order.status}</p>
            <p className="text-gray-600"><span className="font-semibold">Payment:</span> {order.paymentStatus}</p>
            {order.paymentMethod && (
              <p className="text-gray-600"><span className="font-semibold">Method:</span> {order.paymentMethod}</p>
            )}
            {order.mpesaReceiptNumber && (
              <p className="text-gray-600"><span className="font-semibold">M-Pesa Receipt:</span> {order.mpesaReceiptNumber}</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-3 px-4 font-bold text-gray-900">Item</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">Quantity</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">Unit Price</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-gray-900">{item.product?.name || 'Product removed'}</p>
                    {item.product?.sku && (
                      <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatKES(item.price)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatKES(Number(item.price) * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatKES(order.subtotal || 0)}</span>
              </div>
              {order.shipping > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span className="font-semibold">{formatKES(order.shipping || 0)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax:</span>
                  <span className="font-semibold">{formatKES(order.tax || 0)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-{formatKES(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t-2 border-gray-900">
                <span>Total:</span>
                <span>{formatKES(order.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-6 text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">Thank you for your business!</p>
          <p>For questions about this invoice, please contact support@dilitechsolutions.com</p>
          <p className="mt-2">This is an automated invoice generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}


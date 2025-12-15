'use client'

import { OptimizedImage } from '@/components/OptimizedImage'
import { formatKES } from '@/lib/currency'

export default function OrderSummary({ 
  cartItems, 
  subtotal, 
  shippingCost, 
  tax,
  discount, 
  finalTotal,
  freeShipping,
  couponCode, 
  appliedCoupon, 
  showCouponInput, 
  setCouponCode, 
  setShowCouponInput, 
  validateCoupon,
  removeCoupon,
  couponLoading,
  errors
}) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-6 lg:p-8 shadow-lg sticky top-8">
        <h2 className="text-xl font-black text-gray-900 mb-6">Order Summary</h2>
        
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-200">
                <OptimizedImage
                  src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                  alt={item.product?.name || 'Product'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{item.product?.name}</h3>
                <p className="text-xs text-gray-600 mb-2 font-medium">Qty: {item.quantity}</p>
                <p className="font-black text-blue-900">
                  {formatKES((item.product?.price || 0) * (item.quantity || 0))}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon Section */}
        {!appliedCoupon && !showCouponInput && (
          <button
            type="button"
            onClick={() => setShowCouponInput(true)}
            className="w-full mb-4 text-sm text-blue-900 hover:text-blue-700 transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Have a coupon code?
          </button>
        )}

        {showCouponInput && !appliedCoupon && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
              />
              <button
                onClick={validateCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-bold disabled:opacity-50"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
            {errors?.coupon && <p className="mt-2 text-xs text-red-600 font-medium">{errors.coupon}</p>}
            <button
              onClick={() => {
                setShowCouponInput(false)
                setCouponCode('')
              }}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {appliedCoupon && (
          <div className="mb-4 p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-emerald-900 font-bold">{appliedCoupon.code}</span>
              </div>
              <button
                onClick={removeCoupon}
                className="text-emerald-700 hover:text-emerald-900"
                aria-label="Remove coupon"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {discount > 0 && (
              <p className="text-xs text-emerald-900 mt-1 font-bold">You saved {formatKES(discount)}</p>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="border-t-2 border-gray-200 pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Subtotal</span>
            <span className="text-gray-900 font-black">{formatKES(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Discount</span>
              <span className="text-emerald-700 font-black">-{formatKES(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Shipping</span>
            <span className="text-gray-900 font-black">
              {freeShipping ? (
                <span className="text-emerald-700">Free</span>
              ) : (
                formatKES(shippingCost)
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Tax (16%)</span>
            <span className="text-gray-900 font-black">{formatKES(tax)}</span>
          </div>
          <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-lg font-black text-gray-900">Total</span>
            <span className="text-2xl font-black text-blue-900">
              {formatKES(finalTotal)}
            </span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 pt-6 border-t-2 border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium">Secure checkout with SSL encryption</span>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-emerald-700" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.085"/>
            </svg>
            <span className="text-sm font-black text-emerald-900">Need Help?</span>
          </div>
          <p className="text-xs text-emerald-800 mb-3 font-medium">
            Chat with us on WhatsApp for instant support
          </p>
          <a
            href="https://wa.me/254709000111?text=Hi, I need help with my checkout"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors font-bold"
          >
            Chat Now
          </a>
        </div>
      </div>
    </div>
  )
}


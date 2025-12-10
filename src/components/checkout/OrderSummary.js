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
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8 shadow-2xl sticky top-8">
        <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
        
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-3 bg-slate-800/30 rounded-xl">
              <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                <OptimizedImage
                  src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                  alt={item.product?.name || 'Product'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">{item.product?.name}</h3>
                <p className="text-xs text-slate-400 mb-2">Qty: {item.quantity}</p>
                <p className="font-semibold text-sky-400">
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
            className="w-full mb-4 text-sm text-sky-400 hover:text-sky-300 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Have a coupon code?
          </button>
        )}

        {showCouponInput && !appliedCoupon && (
          <div className="mb-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={validateCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
            {errors?.coupon && <p className="mt-2 text-xs text-rose-400">{errors.coupon}</p>}
            <button
              onClick={() => {
                setShowCouponInput(false)
                setCouponCode('')
              }}
              className="mt-2 text-xs text-slate-400 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
        )}

        {appliedCoupon && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-emerald-300 font-medium">{appliedCoupon.code}</span>
              </div>
              <button
                onClick={removeCoupon}
                className="text-emerald-400 hover:text-emerald-300"
                aria-label="Remove coupon"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {discount > 0 && (
              <p className="text-xs text-emerald-300 mt-1">You saved {formatKES(discount)}</p>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal</span>
            <span className="text-white font-medium">{formatKES(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Discount</span>
              <span className="text-emerald-400 font-medium">-{formatKES(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Shipping</span>
            <span className="text-white font-medium">
              {freeShipping ? (
                <span className="text-emerald-400">Free</span>
              ) : (
                formatKES(shippingCost)
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Tax (16%)</span>
            <span className="text-white font-medium">{formatKES(tax)}</span>
          </div>
          <div className="border-t border-white/10 pt-3 flex justify-between items-center">
            <span className="text-lg font-bold text-white">Total</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
              {formatKES(finalTotal)}
            </span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure checkout with SSL encryption</span>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.085"/>
            </svg>
            <span className="text-sm font-semibold text-emerald-300">Need Help?</span>
          </div>
          <p className="text-xs text-emerald-200/80 mb-3">
            Chat with us on WhatsApp for instant support
          </p>
          <a
            href="https://wa.me/254700000000?text=Hi, I need help with my checkout"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-600 transition-colors font-medium"
          >
            Chat Now
          </a>
        </div>
      </div>
    </div>
  )
}


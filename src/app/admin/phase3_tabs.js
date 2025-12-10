// This file contains the Phase 3 tab implementations to be inserted into admin/page.js

export const CouponsTab = ({ coupons, loading, onCreateCoupon, onDeleteCoupon, formatKES, formatDate }) => (
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Coupon Management</h3>
        <button
          onClick={() => {/* Open create modal */}}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700"
        >
          Create Coupon
        </button>
      </div>
    </div>
    {loading ? (
      <div className="p-12 text-center"><LoadingSpinner /></div>
    ) : coupons.length === 0 ? (
      <div className="p-6 text-center py-12">
        <p className="text-gray-500">No coupons found</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-6 py-4 font-mono text-sm">{coupon.code}</td>
                <td className="px-6 py-4 text-sm">{coupon.name}</td>
                <td className="px-6 py-4 text-sm capitalize">{coupon.type?.toLowerCase().replace('_', ' ')}</td>
                <td className="px-6 py-4 text-sm">
                  {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : formatKES(coupon.value)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {coupon.usageCount || 0} / {coupon.usageLimit || '∞'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    coupon.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    coupon.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {coupon.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onDeleteCoupon(coupon.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)

export const ReviewsTab = ({ reviews, loading, onDeleteReview, formatDate }) => (
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">Review Management</h3>
    </div>
    {loading ? (
      <div className="p-12 text-center"><LoadingSpinner /></div>
    ) : reviews.length === 0 ? (
      <div className="p-6 text-center py-12">
        <p className="text-gray-500">No reviews found</p>
      </div>
    ) : (
      <div className="p-6 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{review.user?.name || 'Anonymous'}</span>
                  <span className="text-sm text-gray-500">on</span>
                  <Link href={`/products/${review.product?.slug || review.productId}`} className="text-sm text-purple-600 hover:underline">
                    {review.product?.name || 'Product'}
                  </Link>
                </div>
                {review.title && <p className="font-medium text-gray-900 mb-1">{review.title}</p>}
                {review.comment && <p className="text-sm text-gray-600 mb-2">{review.comment}</p>}
                <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
              </div>
              <button
                onClick={() => onDeleteReview(review.id)}
                className="text-red-600 hover:text-red-900 text-sm ml-4"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

export const SettingsTab = () => (
  <div className="bg-white rounded-lg shadow-sm border">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">Store Settings</h3>
    </div>
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">General Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="Dilitech Solutions" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Email</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="support@dilitechsolutions.com" />
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Payment Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Enable M-Pesa Payments</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Enable Card Payments</span>
              </label>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Shipping Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Shipping Cost (KES)</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (KES)</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="5000" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  </div>
)


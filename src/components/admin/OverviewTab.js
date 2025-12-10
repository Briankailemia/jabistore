'use client'

import Link from 'next/link'
import { formatKES } from '@/lib/currency'

export default function OverviewTab({ stats, recentOrders, lowStockProducts, statusColors, paymentStatusColors, formatDate }) {
  return (
    <div role="tabpanel" id="admin-tabpanel-overview" aria-labelledby="admin-tab-overview" className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatKES(stats.totalRevenue)}</p>
              <p className="text-sm text-green-600 mt-1">+{stats.revenueGrowth}% from last month</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{(stats.totalOrders || 0).toLocaleString()}</p>
              <p className="text-sm text-yellow-600 mt-1">{stats.pendingOrders} pending</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
              <p className="text-sm text-red-600 mt-1">{stats.lowStockProducts} low stock</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{(stats.totalUsers || 0).toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">+{(stats.newUsersToday || 0)} today</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <button 
                onClick={() => setActiveTab && setActiveTab('orders')}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent orders found</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">{order.orderNumber || `Order #${order.id.slice(-8)}`}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {order.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                        <p>{order.user?.name || 'Unknown Customer'}</p>
                        {order.paymentMethod && (
                          <span className="text-gray-500">• {order.paymentMethod.toUpperCase()}</span>
                        )}
                        {order.mpesaReceiptNumber && (
                          <span className="text-green-600 font-mono text-xs">Receipt: {order.mpesaReceiptNumber}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-purple-600">{formatKES(order.total || 0)}</p>
                      {order.paymentStatus === 'COMPLETED' && (
                        <p className="text-xs text-green-600 mt-1">Paid</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
              <button 
                onClick={() => setActiveTab && setActiveTab('products')}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                Manage Stock →
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">All products are well stocked</p>
                </div>
              ) : (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                      <p className="text-sm text-red-600 font-medium">
                        Stock: {product.stock} (Min: {product.minStock || 5})
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">{formatKES(product.price)}</p>
                      <button className="text-sm text-purple-600 hover:text-purple-800 font-medium mt-1">
                        Restock
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import AddProductModal from '@/components/admin/AddProductModal'
import EditProductModal from '@/components/admin/EditProductModal'
import CreateCouponModal from '@/components/admin/CreateCouponModal'
import EditCouponModal from '@/components/admin/EditCouponModal'
import AdminTabs from '@/components/admin/AdminTabs'
import OverviewTab from '@/components/admin/OverviewTab'
import { useProducts, useCategories, useBrands, useOrders, useUsers, useAdminStats, useCoupons, useAllReviews } from '@/lib/apiService'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { OptimizedImage } from '@/components/OptimizedImage'
import { formatKES } from '@/lib/currency'
import { useToast } from '@/components/ui/Toast'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [isCreateCouponModalOpen, setIsCreateCouponModalOpen] = useState(false)
  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [reviewFilter, setReviewFilter] = useState('all')
  const [reviewSort, setReviewSort] = useState('newest')
  const [selectedReviews, setSelectedReviews] = useState([])
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [couponStatusFilter, setCouponStatusFilter] = useState('')
  const [analyticsDateRange, setAnalyticsDateRange] = useState('30days')

  
  // Search and filter states
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  
  // Fetch real data from API
  const { data: productsData, loading: productsLoading, refetch: refetchProducts } = useProducts({})
  const { data: categoriesData, loading: categoriesLoading } = useCategories()
  const { data: brandsData, loading: brandsLoading } = useBrands()
  const { data: ordersData, loading: ordersLoading, refetch: refetchOrders } = useOrders({})
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useUsers({})
  const { data: adminStats, loading: statsLoading, refetch: refetchStats } = useAdminStats()
  const { data: couponsData, loading: couponsLoading, refetch: refetchCoupons } = useCoupons({})
  const { data: reviewsData, loading: reviewsLoading, refetch: refetchReviews } = useAllReviews({ limit: 100 })
  
  const products = productsData?.products || productsData?.data?.products || []
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || [])
  const brands = Array.isArray(brandsData) ? brandsData : (brandsData?.data || [])
  const orders = ordersData?.orders || ordersData?.data?.orders || []
  const users = usersData?.users || usersData?.data?.users || []
  const coupons = couponsData?.coupons || couponsData?.data?.coupons || []
  const reviews = reviewsData?.reviews || reviewsData?.data?.reviews || []
  
  // Use real stats from API, fallback to calculated values
  const stats = adminStats || {
    totalProducts: products.length,
    totalCategories: categories.length,
    totalBrands: brands.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
    pendingOrders: orders.filter(order => order.status === 'PENDING').length,
    lowStockProducts: products.filter(product => (product.stock || 0) <= 5).length,
    revenueGrowth: 0,
    totalUsers: 0,
    newUsersToday: 0
  }
  
  const recentOrders = orders.slice(0, 5)
  const lowStockProducts = products.filter(product => (product.stock || 0) <= 5).slice(0, 5)
  
  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !orderSearch || 
      (order.orderNumber || order.id).toString().toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(orderSearch.toLowerCase())
    const matchesStatus = !orderStatusFilter || order.status === orderStatusFilter
    return matchesSearch && matchesStatus
  })

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !productSearch || 
      product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.description?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.category?.toLowerCase().includes(productSearch.toLowerCase())
    return matchesSearch
  })

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !userSearch || 
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase())
    const matchesRole = !userRoleFilter || user.role === userRoleFilter
    return matchesSearch && matchesRole
  })
  
  const isLoading = productsLoading || categoriesLoading || brandsLoading || ordersLoading || statsLoading
  const toast = useToast()

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  }

  const paymentStatusColors = {
    PENDING: 'bg-amber-100 text-amber-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleAddProduct = async (newProduct) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      })
      
      if (response.ok) {
        toast.success('Product added successfully')
        refetchProducts()
        refetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add product')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product')
    }
  }

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      
      if (response.ok) {
        toast.success('Order updated successfully')
        refetchOrders()
        refetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }

  const handleUpdateProduct = async (productId, updates) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      
      if (response.ok) {
        toast.success('Product updated successfully')
        refetchProducts()
        refetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (response.ok) {
        toast.success('Product deleted successfully')
        refetchProducts()
        refetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      
      if (response.ok) {
        toast.success('User updated successfully')
        refetchUsers()
        refetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }
  const handleCreateCoupon = async (couponData) => {
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(couponData),
      })
      if (response.ok) {
        toast.success('Coupon created successfully')
        refetchCoupons()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create coupon')
      }
    } catch (error) {
      toast.error('Failed to create coupon')
    }
  }

  const handleDeleteCoupon = async (couponId) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        toast.success('Coupon deleted successfully')
        refetchCoupons()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete coupon')
      }
    } catch (error) {
      toast.error('Failed to delete coupon')
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        toast.success('Review deleted successfully')
        refetchReviews()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete review')
      }
    } catch (error) {
      toast.error('Failed to delete review')
    }
  }

  const handleExportOrders = () => {
    const csv = [
      ['Order Number', 'Customer', 'Email', 'Status', 'Payment Status', 'Total', 'Date'].join(','),
      ...orders.map(order => [
        order.orderNumber || order.id,
        order.user?.name || 'Unknown',
        order.user?.email || '',
        order.status,
        order.paymentStatus,
        order.total || 0,
        formatDate(order.createdAt)
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Orders exported successfully')
  }
  const handleRefund = async (orderId) => {
    if (!confirm('Are you sure you want to process a refund for this order?')) return
    
    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      
      if (response.ok) {
        toast.success('Refund processed successfully')
        refetchOrders()
        refetchStats()
        if (selectedOrder) {
          setSelectedOrder({ ...selectedOrder, paymentStatus: 'REFUNDED' })
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to process refund')
      }
    } catch (error) {
      toast.error('Failed to process refund')
    }
  }
  // Settings handlers
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setSettingsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSaveSettings = async (settingsData) => {
    setSettingsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settingsData),
      })
      if (response.ok) {
        toast.success('Settings saved successfully')
        const data = await response.json()
        setSettings(data.settings)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  // Review handlers
  const handleBulkDeleteReviews = async () => {
    if (selectedReviews.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedReviews.length} review(s)?`)) return
    
    try {
      const promises = selectedReviews.map(id => 
        fetch(`/api/reviews/${id}`, { method: 'DELETE', credentials: 'include' })
      )
      await Promise.all(promises)
      toast.success(`${selectedReviews.length} review(s) deleted successfully`)
      setSelectedReviews([])
      refetchReviews()
    } catch (error) {
      toast.error('Failed to delete reviews')
    }
  }

  // Coupon handlers
  const handleUpdateCoupon = async (couponId, updates) => {
    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        toast.success('Coupon updated successfully')
        refetchCoupons()
        setEditingCoupon(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update coupon')
      }
    } catch (error) {
      toast.error('Failed to update coupon')
    }
  }




  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You need to be signed in as an admin to access this page.</p>
            <Link
              href="/auth/signin"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has admin role
  if (session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You don't have admin privileges to access this page.</p>
            <Link
              href="/"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-semibold text-purple-600">{session.user.name}</span>! 
                    Manage your Dilitech Solutions operations
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleExportOrders}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Export Orders
              </button>
              <button 
                onClick={() => setIsAddProductModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            recentOrders={recentOrders}
            lowStockProducts={lowStockProducts}
            statusColors={statusColors}
            paymentStatusColors={paymentStatusColors}
            formatDate={formatDate}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div role="tabpanel" id="admin-tabpanel-orders" aria-labelledby="admin-tab-orders" className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
                <div className="flex space-x-3">
                  <select 
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{order.orderNumber || `Order #${order.id}`}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{order.user?.name || 'Unknown Customer'}</div>
                          <div className="text-sm text-gray-500">{order.user?.email || 'No email'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatKES(order.total || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-purple-600 hover:text-purple-900">View</button>
                            <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div role="tabpanel" id="admin-tabpanel-products" aria-labelledby="admin-tab-products" className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
                  />
                  <button 
                    onClick={() => setIsAddProductModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                  >
                    Add Product
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    Import CSV
                  </button>
                </div>
              </div>
            </div>
            {products.length === 0 ? (
              <div className="p-6">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Product Management</h3>
                  <p className="text-gray-600 mb-6">Manage your product catalog, inventory, and pricing.</p>
                  <button 
                    onClick={() => setIsAddProductModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                  >
                    Add Your First Product
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <OptimizedImage
                                src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.description?.substring(0, 50)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                                 <span className="font-medium">{formatKES(product.price)}</span>
                            {product.comparePrice && (
                              <span className="text-xs text-gray-500 line-through">
                                   {formatKES(product.comparePrice)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={product.stock || 0}
                              onChange={(e) => {
                                const newStock = parseInt(e.target.value) || 0
                                handleUpdateProduct(product.id, { stock: newStock })
                              }}
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                              min="0"
                            />
                            {(product.stock || 0) <= 5 && (
                              <span className="text-xs text-red-500 font-medium">Low</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === 'active' ? 'bg-green-100 text-green-800' :
                            product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {product.status ? (product.status.charAt(0).toUpperCase() + product.status.slice(1)) : 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => setEditingProduct(product)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Edit
                            </button>
                            <Link 
                              href={`/products/${product.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              target="_blank"
                            >
                              View
                            </Link>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div role="tabpanel" id="admin-tabpanel-users" aria-labelledby="admin-tab-users" className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
                  />
                  <select 
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All Users</option>
                    <option value="USER">Users</option>
                    <option value="ADMIN">Admins</option>
                    <option value="MODERATOR">Moderators</option>
                  </select>
                </div>
              </div>
            </div>
            {usersLoading ? (
              <div className="p-12 text-center">
                <LoadingSpinner />
              </div>
            ) : users.length === 0 ? (
            <div className="p-6">
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">No users match your search criteria.</p>
              </div>
            </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.avatar ? (
                                <OptimizedImage className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name || 'User'} width={40} height={40} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-purple-600 font-medium">
                                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
                              <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="MODERATOR">MODERATOR</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.totalOrders || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatKES(user.totalSpent || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div role="tabpanel" id="admin-tabpanel-analytics" aria-labelledby="admin-tab-analytics" className="space-y-6">
            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
                <div className="flex items-center gap-3">
                  <select
                    value={analyticsDateRange}
                    onChange={(e) => setAnalyticsDateRange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="1year">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                  <button
                    onClick={() => {
                      const csv = [
                        ['Metric', 'Value'].join(','),
                        ['Total Revenue', formatKES(stats.totalRevenue || 0)].join(','),
                        ['Total Orders', stats.totalOrders || 0].join(','),
                        ['Average Order Value', formatKES(stats.totalOrders > 0 ? (stats.totalRevenue || 0) / stats.totalOrders : 0)].join(','),
                        ['Total Customers', stats.totalUsers || 0].join(','),
                      ].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
                      a.click()
                      window.URL.revokeObjectURL(url)
                      toast.success('Analytics exported successfully')
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-purple-700">Total Revenue</p>
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-purple-900">{formatKES(stats.totalRevenue || 0)}</p>
                <p className={`text-sm mt-2 font-medium ${(stats.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.revenueGrowth || 0).toFixed(1)}% from last month
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-700">Total Orders</p>
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-blue-900">{stats.totalOrders || 0}</p>
                <p className="text-sm text-blue-600 mt-2 font-medium">{stats.pendingOrders || 0} pending orders</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-green-700">Avg Order Value</p>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-green-900">
                  {stats.totalOrders > 0 ? formatKES((stats.totalRevenue || 0) / stats.totalOrders) : formatKES(0)}
                </p>
                <p className="text-sm text-green-600 mt-2 font-medium">Per order average</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg shadow-sm border border-pink-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-pink-700">Total Customers</p>
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-pink-900">{stats.totalUsers || 0}</p>
                <p className="text-sm text-pink-600 mt-2 font-medium">+{stats.newUsersToday || 0} new today</p>
              </div>
            </div>

            {/* Order Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Order Status Distribution</h3>
            </div>
            <div className="p-6">
                <div className="space-y-4">
                  {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => {
                    const count = orders.filter(o => o.status === status).length
                    const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{status}</span>
                          <span className="text-sm text-gray-500">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${statusColors[status] || 'bg-gray-400'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Payment Method Breakdown</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {['mpesa', 'card', 'stripe'].map((method) => {
                    const methodOrders = orders.filter(o => o.paymentMethod?.toLowerCase() === method)
                    const count = methodOrders.length
                    const revenue = methodOrders.reduce((sum, o) => sum + (o.total || 0), 0)
                    const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0
                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">{method}</span>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">{count} orders</span>
                            <span className="text-sm font-semibold text-gray-900 ml-3">{formatKES(revenue)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-purple-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
              </div>
              <div className="p-6">
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No order data available</p>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const productSales = {}
                      orders.forEach(order => {
                        order.items?.forEach(item => {
                          const productId = item.productId
                          if (!productSales[productId]) {
                            productSales[productId] = {
                              name: item.product?.name || 'Unknown Product',
                              quantity: 0,
                              revenue: 0
                            }
                          }
                          productSales[productId].quantity += item.quantity
                          productSales[productId].revenue += Number(item.price) * item.quantity
                        })
                      })
                      return Object.values(productSales)
                        .sort((a, b) => b.quantity - a.quantity)
                        .slice(0, 10)
                        .map((product, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                              </div>
                            </div>
                            <p className="font-semibold text-purple-600">{formatKES(product.revenue)}</p>
                          </div>
                        ))
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div role="tabpanel" id="admin-tabpanel-coupons" aria-labelledby="admin-tab-coupons" className="space-y-6">
            {/* Coupon Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <p className="text-sm text-gray-600">Total Coupons</p>
                <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <p className="text-sm text-gray-600">Active Coupons</p>
                <p className="text-2xl font-bold text-green-600">
                  {coupons.filter(c => c.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-purple-600">
                  {coupons.reduce((sum, c) => sum + (c._count?.orders || 0), 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <p className="text-sm text-gray-600">Expired Coupons</p>
                <p className="text-2xl font-bold text-red-600">
                  {coupons.filter(c => c.status === 'EXPIRED').length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Coupon Management</h3>
                    <p className="text-sm text-gray-500 mt-1">Create and manage discount coupons</p>
                  </div>
                  <button
                    onClick={() => setIsCreateCouponModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700"
                  >
                    Create Coupon
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4">
                  <select
                    value={couponStatusFilter}
                    onChange={(e) => setCouponStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>
              {couponsLoading ? (
                <div className="p-12 text-center"><LoadingSpinner /></div>
              ) : (() => {
                const filteredCoupons = couponStatusFilter 
                  ? coupons.filter(c => c.status === couponStatusFilter)
                  : coupons
                
                return filteredCoupons.length === 0 ? (
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCoupons.map((coupon) => {
                          const usageCount = coupon._count?.orders || 0
                          const usageLimit = coupon.usageLimit || Infinity
                          const usagePercent = usageLimit !== Infinity ? (usageCount / usageLimit) * 100 : 0
                          const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date()
                          
                          return (
                            <tr key={coupon.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-mono text-sm font-semibold text-purple-600">{coupon.code}</td>
                              <td className="px-6 py-4 text-sm">{coupon.name}</td>
                              <td className="px-6 py-4 text-sm capitalize">{(coupon.type || '').toLowerCase().replace('_', ' ')}</td>
                              <td className="px-6 py-4 text-sm font-semibold">
                                {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : formatKES(coupon.value || 0)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                    <div
                                      className={`h-2 rounded-full ${
                                        usagePercent >= 100 ? 'bg-red-500' :
                                        usagePercent >= 80 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {usageCount} / {usageLimit === Infinity ? '∞' : usageLimit}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {coupon.validUntil ? formatDate(coupon.validUntil) : 'No expiry'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isExpired || coupon.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                  coupon.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {isExpired ? 'EXPIRED' : coupon.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditingCoupon(coupon)}
                                    className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                                  >
                                    Edit
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div role="tabpanel" id="admin-tabpanel-reviews" aria-labelledby="admin-tab-reviews" className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Review Management</h3>
                  <p className="text-sm text-gray-500 mt-1">{reviews.length} total reviews</p>
                </div>
                {selectedReviews.length > 0 && (
                  <button
                    onClick={handleBulkDeleteReviews}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Delete Selected ({selectedReviews.length})
                  </button>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    onChange={(e) => {
                      const search = e.target.value.toLowerCase()
                      // Filter reviews by search term
                    }}
                  />
                </div>
                <select
                  value={reviewFilter}
                  onChange={(e) => setReviewFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>
            {reviewsLoading ? (
              <div className="p-12 text-center"><LoadingSpinner /></div>
            ) : (() => {
              let filteredReviews = reviews
              
              // Apply rating filter
              if (reviewFilter !== 'all') {
                filteredReviews = filteredReviews.filter(r => r.rating === parseInt(reviewFilter))
              }
              
              // Apply sorting
              filteredReviews = [...filteredReviews].sort((a, b) => {
                switch (reviewSort) {
                  case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt)
                  case 'highest':
                    return b.rating - a.rating
                  case 'lowest':
                    return a.rating - b.rating
                  default: // newest
                    return new Date(b.createdAt) - new Date(a.createdAt)
                }
              })
              
              return filteredReviews.length === 0 ? (
                <div className="p-6 text-center py-12">
                  <p className="text-gray-500">No reviews found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReviews([...selectedReviews, review.id])
                            } else {
                              setSelectedReviews(selectedReviews.filter(id => id !== review.id))
                            }
                          }}
                          className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-5 h-5 ${i < (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                              ))}
              </div>
                            <span className="text-sm font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</span>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                            <span className="text-sm text-gray-400">•</span>
                            <Link href={`/products/${review.product?.slug || review.productId}`} className="text-sm text-purple-600 hover:underline font-medium">
                              {review.product?.name || 'Product'}
                            </Link>
            </div>
                          {review.title && (
                            <p className="font-semibold text-gray-900 mb-2">{review.title}</p>
                          )}
                          {review.comment && (
                            <p className="text-sm text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Review ID: {review.id.slice(0, 8)}</span>
                            {review.user?.email && <span>• {review.user.email}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div role="tabpanel" id="admin-tabpanel-settings" aria-labelledby="admin-tab-settings" className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Store Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Manage your store configuration and preferences</p>
            </div>
            {settingsLoading ? (
              <div className="p-12 text-center"><LoadingSpinner /></div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                const settingsData = {
                  storeName: formData.get('storeName'),
                  storeEmail: formData.get('storeEmail'),
                  storePhone: formData.get('storePhone'),
                  storeAddress: formData.get('storeAddress'),
                  enableMpesa: formData.get('enableMpesa') === 'on',
                  enableCard: formData.get('enableCard') === 'on',
                  defaultShippingCost: parseFloat(formData.get('defaultShippingCost')),
                  freeShippingThreshold: parseFloat(formData.get('freeShippingThreshold')),
                  taxRate: parseFloat(formData.get('taxRate')),
                  currency: formData.get('currency'),
                  timezone: formData.get('timezone'),
                }
                handleSaveSettings(settingsData)
              }} className="p-6">
                <div className="space-y-8">
                  {/* General Settings */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4 pb-2 border-b">General Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                        <input 
                          type="text" 
                          name="storeName"
                          defaultValue={settings?.storeName || 'Dilitech Solutions'}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Email *</label>
                        <input 
                          type="email" 
                          name="storeEmail"
                          defaultValue={settings?.storeEmail || 'support@dilitechsolutions.com'}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Phone</label>
                        <input 
                          type="tel" 
                          name="storePhone"
                          defaultValue={settings?.storePhone || '+254 700 000 000'}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                        <input 
                          type="text" 
                          name="storeAddress"
                          defaultValue={settings?.storeAddress || 'Nairobi, Kenya'}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Settings */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4 pb-2 border-b">Payment Settings</h4>
                    <div className="space-y-4 mt-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="enableMpesa"
                              defaultChecked={settings?.enableMpesa !== false}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">Enable M-Pesa Payments</span>
                          </label>
                          <p className="text-xs text-gray-500 ml-8 mt-1">Allow customers to pay via M-Pesa mobile money</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="enableCard"
                              defaultChecked={settings?.enableCard !== false}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">Enable Card Payments</span>
                          </label>
                          <p className="text-xs text-gray-500 ml-8 mt-1">Allow customers to pay with credit/debit cards</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Settings */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4 pb-2 border-b">Shipping Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Shipping Cost (KES) *</label>
                        <input 
                          type="number" 
                          name="defaultShippingCost"
                          step="0.01"
                          min="0"
                          defaultValue={settings?.defaultShippingCost || 500}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Standard shipping fee for all orders</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (KES)</label>
                        <input 
                          type="number" 
                          name="freeShippingThreshold"
                          step="0.01"
                          min="0"
                          defaultValue={settings?.freeShippingThreshold || 5000}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
                      </div>
                    </div>
                  </div>

                  {/* Tax & Currency Settings */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4 pb-2 border-b">Tax & Currency Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                        <input 
                          type="number" 
                          name="taxRate"
                          step="0.01"
                          min="0"
                          max="100"
                          defaultValue={settings?.taxRate || 0}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select 
                          name="currency"
                          defaultValue={settings?.currency || 'KES'}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="KES">KES - Kenyan Shilling</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <select 
                          name="timezone"
                          defaultValue={settings?.timezone || 'Africa/Nairobi'}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {settingsSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Add Product Modal */}
        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => setIsAddProductModalOpen(false)}
          onAddProduct={handleAddProduct}
        />

        {/* Create Coupon Modal */}        {/* Edit Coupon Modal */}
        <EditCouponModal
          isOpen={!!editingCoupon}
          onClose={() => setEditingCoupon(null)}
          coupon={editingCoupon}
          onUpdateCoupon={handleUpdateCoupon}
        />


        <CreateCouponModal
          isOpen={isCreateCouponModalOpen}
          onClose={() => setIsCreateCouponModalOpen(false)}
          onCreateCoupon={handleCreateCoupon}
        />

        {/* Edit Product Modal */}
        <EditProductModal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          product={editingProduct}
          onUpdateProduct={async (productData) => {
            await handleUpdateProduct(editingProduct.id, productData)
            setEditingProduct(null)
          }}
        />

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedOrder(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Details: {selectedOrder.orderNumber || selectedOrder.id}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        handleUpdateOrder(selectedOrder.id, { status: e.target.value })
                        setSelectedOrder({ ...selectedOrder, status: e.target.value })
                      }}
                      className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <select
                      value={selectedOrder.paymentStatus}
                      onChange={(e) => {
                        handleUpdateOrder(selectedOrder.id, { paymentStatus: e.target.value })
                        setSelectedOrder({ ...selectedOrder, paymentStatus: e.target.value })
                      }}
                      className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="FAILED">FAILED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Tracking Number</p>
                  <input
                    type="text"
                    value={selectedOrder.trackingNumber || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, trackingNumber: e.target.value })}
                    onBlur={() => handleUpdateOrder(selectedOrder.id, { trackingNumber: selectedOrder.trackingNumber })}
                    placeholder="Enter tracking number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Carrier</p>
                  <input
                    type="text"
                    value={selectedOrder.carrier || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, carrier: e.target.value })}
                    onBlur={() => handleUpdateOrder(selectedOrder.id, { carrier: selectedOrder.carrier })}
                    placeholder="Enter carrier name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.product?.name || 'Product removed'}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatKES(item.price)}</p>
                        </div>
                        <p className="font-semibold">{formatKES(Number(item.price) * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subtotal:</span>
                    <span>{formatKES(selectedOrder.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Shipping:</span>
                    <span>{formatKES(selectedOrder.shipping || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tax:</span>
                    <span>{formatKES(selectedOrder.tax || 0)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm mb-1 text-red-600">
                      <span>Discount:</span>
                      <span>-{formatKES(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatKES(selectedOrder.total || 0)}</span>
                  </div>
                </div>
                {selectedOrder.paymentStatus === 'COMPLETED' && (
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => handleRefund(selectedOrder.id)}
                      className="w-full px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Process Refund
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

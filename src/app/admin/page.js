'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import AddProductModal from '@/components/admin/AddProductModal'
import EditProductModal from '@/components/admin/EditProductModal'
import CreateCouponModal from '@/components/admin/CreateCouponModal'
import EditCouponModal from '@/components/admin/EditCouponModal'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal'
import AdminTabs from '@/components/admin/AdminTabs'
import OverviewTab from '@/components/admin/OverviewTab'
import { useProducts, useCategories, useBrands, useOrders, useUsers, useAdminStats, useCoupons, useAllReviews } from '@/lib/apiService'
import apiService from '@/lib/apiService'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { OptimizedImage } from '@/components/OptimizedImage'
import { formatKES } from '@/lib/currency'
import { useToast } from '@/components/ui/Toast'

const ALL_TABS = [
  { id: 'overview', label: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { id: 'products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
  { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'coupons', label: 'Coupons', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
  { id: 'reviews', label: 'Reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
]

export default function AdminDashboard() {
  const { data: session } = useSession()
  const role = session?.user?.role || 'USER'

  const availableTabs = useMemo(() => {
    if (role === 'ADMIN') return ALL_TABS
    if (role === 'MODERATOR') return ALL_TABS.filter((tab) => ['overview', 'orders', 'products', 'reviews'].includes(tab.id))
    return ALL_TABS.filter((tab) => tab.id === 'overview')
  }, [role])

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || 'overview')

  useEffect(() => {
    if (!availableTabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(availableTabs[0]?.id || 'overview')
    }
  }, [availableTabs, activeTab])

  const isAuthorized = role === 'ADMIN' || role === 'MODERATOR'
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedReview, setSelectedReview] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [isCreateCouponModalOpen, setIsCreateCouponModalOpen] = useState(false)
  const [settings, setSettings] = useState({ store: null, smtp: null })
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [reviewFilter, setReviewFilter] = useState('all')
  const [reviewSort, setReviewSort] = useState('newest')
  const [selectedReviews, setSelectedReviews] = useState([])
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [couponStatusFilter, setCouponStatusFilter] = useState('')
  const [analyticsDateRange, setAnalyticsDateRange] = useState('30days')
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, name: null })
  const [isDeleting, setIsDeleting] = useState(false)

  
  // Search and filter states
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [reviewSearch, setReviewSearch] = useState('')
  
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
  // Extract coupons array from API response structure
  // API returns: { success: true, data: { coupons: [...], pagination: {...} } }
  const coupons = useMemo(() => {
    if (!couponsData) return []
    // Handle direct array (shouldn't happen but safe)
    if (Array.isArray(couponsData)) return couponsData
    // Handle nested structure
    if (couponsData.coupons && Array.isArray(couponsData.coupons)) return couponsData.coupons
    if (couponsData.data?.coupons && Array.isArray(couponsData.data.coupons)) return couponsData.data.coupons
    // Fallback to empty array
    return []
  }, [couponsData])
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
    if (!productSearch) return true
    
    try {
      const searchTerm = String(productSearch || '').toLowerCase()
      const name = String(product?.name || '').toLowerCase()
      const description = String(product?.description || '').toLowerCase()
      const categoryName = product?.category 
        ? (typeof product.category === 'string' 
          ? product.category 
          : String(product.category?.name || '')
        ).toLowerCase()
        : ''
      const sku = String(product?.sku || '').toLowerCase()
      
      return name.includes(searchTerm) ||
             description.includes(searchTerm) ||
             categoryName.includes(searchTerm) ||
             sku.includes(searchTerm)
    } catch (error) {
      console.error('Error filtering product:', error, product)
      return true // Include product if filter fails
    }
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
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '—'
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return '—'
    }
  }

  const handleAddProduct = async (newProduct) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newProduct),
      })
      
      let result = null
      let responseText = ''
      
      try {
        responseText = await response.text()
        if (responseText) {
          result = JSON.parse(responseText)
        }
      } catch (parseError) {
        console.error('Failed to parse response:', {
          parseError,
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 500),
        })
        toast.error(`Server error (${response.status}): ${response.statusText || 'Invalid response'}`)
        return
      }
      
      if (response.ok && result?.success) {
        toast.success(result.message || 'Product added successfully')
        apiService.clearCache()
        await refetchProducts()
        await refetchStats()
      } else {
        // Handle validation errors with details
        let errorMessage = 'Failed to add product'
        
        if (result) {
          errorMessage = result.error || result.message || errorMessage
          
          if (result.details) {
            if (Array.isArray(result.details) && result.details.length > 0) {
              // Format validation errors
              const validationErrors = result.details
                .map(detail => {
                  const field = detail.path?.[0] || detail.path || detail.field || 'field'
                  const message = detail.message || 'Invalid value'
                  return `${field}: ${message}`
                })
                .join(', ')
              errorMessage = `Validation failed: ${validationErrors}`
            } else if (typeof result.details === 'string') {
              errorMessage = result.details
            }
          }
        } else {
          errorMessage = `Server error (${response.status}): ${response.statusText || 'Unknown error'}`
        }
        
        toast.error(errorMessage)
        
        // Enhanced error logging with better serialization
        const errorDetails = {
          timestamp: new Date().toISOString(),
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          hasResult: !!result,
          resultType: result ? typeof result : 'null',
          resultKeys: result && typeof result === 'object' ? Object.keys(result) : [],
          resultStringified: result ? JSON.stringify(result, null, 2) : 'null',
          responseTextLength: responseText.length,
          responseTextPreview: responseText.substring(0, 1000),
          productData: {
            name: newProduct?.name || 'missing',
            slug: newProduct?.slug || 'missing',
            sku: newProduct?.sku || 'missing',
            categoryId: newProduct?.categoryId || 'missing',
            brandId: newProduct?.brandId || 'missing',
            price: newProduct?.price || 'missing',
            imagesCount: newProduct?.images?.length || 0,
            hasImages: !!newProduct?.images?.length,
          }
        }
        
        // Log with multiple methods to ensure visibility
        console.error('=== Product Creation Error ===')
        console.error('Status:', response.status, response.statusText)
        console.error('Response URL:', response.url)
        console.error('Result:', result)
        console.error('Result (stringified):', JSON.stringify(result, null, 2))
        console.error('Response Text:', responseText.substring(0, 1000))
        console.error('Product Data:', errorDetails.productData)
        console.error('Full Error Details:', errorDetails)
        console.error('=============================')
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to add product. Please check your connection and try again.'
      console.error('Error adding product:', {
        error: error.message,
        stack: error.stack,
        name: error.name,
        productData: {
          name: newProduct?.name,
          slug: newProduct?.slug,
        }
      })
      toast.error(errorMessage)
    }
  }

  const handleBulkImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      // Expected CSV headers
      const requiredHeaders = ['name', 'sku', 'price', 'category', 'brand', 'stock']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(', ')}`)
        return
      }

      const products = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const product = {}
        
        headers.forEach((header, index) => {
          product[header] = values[index] || ''
        })

        // Find category and brand by name
        // Ensure we have strings for comparison
        const categoryName = String(product.category || '').trim()
        const brandName = String(product.brand || '').trim()
        
        if (!categoryName || !brandName) {
          toast.error(`Row ${i + 1}: Category and brand are required`)
          continue
        }
        
        const category = categories.find(c => String(c?.name || '').toLowerCase() === categoryName.toLowerCase())
        const brand = brands.find(b => String(b?.name || '').toLowerCase() === brandName.toLowerCase())

        if (!category || !brand) {
          toast.error(`Row ${i + 1}: Category or brand not found`)
          continue
        }

        products.push({
          name: product.name,
          slug: (product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
          sku: product.sku,
          description: product.description || product.name,
          shortDescription: product.shortdescription || null,
          price: parseFloat(product.price) || 0,
          originalPrice: product.originalprice ? parseFloat(product.originalprice) : null,
          stock: parseInt(product.stock, 10) || 0,
          weight: product.weight ? parseFloat(product.weight) : null,
          dimensions: product.dimensions || null,
          featured: product.featured === 'true' || product.featured === '1',
          published: product.published !== 'false' && product.published !== '0',
          categoryId: category.id,
          brandId: brand.id,
          images: product.images ? product.images.split('|').map((url, idx) => ({
            url: url.trim(),
            alt: product.name,
            isPrimary: idx === 0
          })) : [],
          features: product.features ? product.features.split('|').filter(f => f.trim()) : [],
          specifications: [],
          seoTitle: product.seotitle || product.name,
          seoDescription: product.seodescription || product.description || product.name,
        })
      }

      if (products.length === 0) {
        toast.error('No valid products found in CSV')
        return
      }

      // Import products one by one
      let successCount = 0
      let errorCount = 0

      // Show info toast
      toast.info(`Importing ${products.length} products...`)

      for (const product of products) {
        try {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(product),
      })
      
      if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      apiService.clearCache()
      await refetchProducts()
      await refetchStats()

      if (errorCount === 0) {
        toast.success(`Successfully imported ${successCount} product${successCount !== 1 ? 's' : ''}`)
      } else {
        toast.warning(`Imported ${successCount} product${successCount !== 1 ? 's' : ''}, ${errorCount} failed`)
      }

      // Reset file input
      e.target.value = ''
    } catch (error) {
      console.error('Bulk import error:', error)
      toast.error('Failed to import products. Please check the CSV format.')
      e.target.value = ''
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
        const result = await response.json()
        toast.success('Order updated successfully')
        // Update the selected order with fresh data
        if (selectedOrder && selectedOrder.id === orderId) {
          fetch(`/api/orders/${orderId}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data) {
                setSelectedOrder(data.data)
              }
            })
        }
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
        const result = await response.json()
        toast.success('User updated successfully')
        // Update the selected user with fresh data
        if (selectedUser && selectedUser.id === userId) {
          const freshUser = await fetch(`/api/users/${userId}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => data.success && data.data ? data.data : null)
            .catch(() => null)
          
          if (freshUser) {
            setSelectedUser(freshUser)
          } else {
            setSelectedUser({ ...selectedUser, ...updates })
          }
        }
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

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        toast.success('User deleted successfully')
        setSelectedUser(null)
        refetchUsers()
        refetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }
  const handleCreateCoupon = async (couponData) => {
    try {
      console.log('=== SENDING COUPON DATA ===')
      console.log('Coupon data:', JSON.stringify(couponData, null, 2))
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(couponData),
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success(result.message || 'Coupon created successfully')
        // Clear cache and refetch coupons
        apiService.clearCache()
        await refetchCoupons()
      } else {
        // Display validation errors if available
        if (result.details && Array.isArray(result.details) && result.details.length > 0) {
          console.error('=== COUPON VALIDATION ERRORS ===')
          console.error('Details array:', JSON.stringify(result.details, null, 2))
          result.details.forEach((detail, index) => {
            console.error(`Error ${index + 1}:`, {
              path: detail.path,
              message: detail.message,
              fullDetail: detail
            })
          })
          
          const errorMessages = result.details.map(detail => {
            const field = detail.path ? `${detail.path}: ` : ''
            return `${field}${detail.message || JSON.stringify(detail)}`
          }).join(', ')
          toast.error(errorMessages || 'Validation failed')
        } else {
          const errorMessage = result.error || result.message || 'Failed to create coupon'
          toast.error(errorMessage)
          console.error('Coupon creation error:', result)
        }
      }
    } catch (error) {
      console.error('Coupon creation error:', error)
      toast.error(error.message || 'Failed to create coupon. Please try again.')
    }
  }

  const handleDeleteCoupon = (couponId) => {
    // Find the coupon to get its name/code for display
    const coupon = coupons?.find(c => c.id === couponId)
    setDeleteConfirm({
      isOpen: true,
      type: 'coupon',
      id: couponId,
      name: coupon ? `${coupon.code} - ${coupon.name}` : null
    })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return

    setIsDeleting(true)
    try {
      console.log('=== DELETING ===')
      console.log('Type:', deleteConfirm.type)
      console.log('ID:', deleteConfirm.id)
      
      let endpoint = ''
      let refetchFunction = null
      
      switch (deleteConfirm.type) {
        case 'coupon':
          endpoint = `/api/coupons/${deleteConfirm.id}`
          refetchFunction = refetchCoupons
          break
        case 'review':
          endpoint = `/api/reviews/${deleteConfirm.id}`
          refetchFunction = refetchReviews
          break
        case 'user':
          endpoint = `/api/users/${deleteConfirm.id}`
          refetchFunction = refetchUsers
          break
        case 'bulk_reviews':
          // Handle bulk delete separately
          await handleBulkDeleteConfirm()
          return
        default:
          throw new Error('Unknown delete type')
      }
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('Delete successful:', result)
        toast.success(`${deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)} deleted successfully`)
        if (refetchFunction) {
          refetchFunction()
        }
        setDeleteConfirm({ isOpen: false, type: null, id: null, name: null })
      } else {
        console.error('=== DELETE ERROR ===')
        console.error('Response status:', response.status)
        console.error('Error result:', result)
        const errorMessage = result.error || result.message || `Failed to delete ${deleteConfirm.type}`
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('=== DELETE EXCEPTION ===')
      console.error('Error:', error)
      toast.error(`Failed to delete ${deleteConfirm.type}. Please try again.`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteReview = (reviewId) => {
    // Find the review to get its title for display
    const review = reviews?.find(r => r.id === reviewId)
    setDeleteConfirm({
      isOpen: true,
      type: 'review',
      id: reviewId,
      name: review ? (review.title || `Review by ${review.user?.name || 'User'}`) : null
    })
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
          const { data } = await response.json()
          setSettings({
            store: data.store || null,
            smtp: data.smtp || null,
          })
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setSettingsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSaveSettings = async (settingsData, type = 'store') => {
    setSettingsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...settingsData, type }),
      })
      if (response.ok) {
        toast.success('Settings saved successfully')
        const { data } = await response.json()
        if (type === 'store') {
          setSettings((prev) => ({ ...prev, store: data.settings }))
        } else if (type === 'smtp') {
          setSettings((prev) => ({ ...prev, smtp: data.settings }))
        }
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
  const handleBulkDeleteReviews = () => {
    if (selectedReviews.length === 0) return
    setDeleteConfirm({
      isOpen: true,
      type: 'bulk_reviews',
      id: null,
      name: `${selectedReviews.length} review(s)`
    })
  }

  const handleBulkDeleteConfirm = async () => {
    if (selectedReviews.length === 0) return
    
    setIsDeleting(true)
    try {
      console.log('=== BULK DELETING REVIEWS ===')
      console.log('Count:', selectedReviews.length)
      console.log('IDs:', selectedReviews)
      
      const promises = selectedReviews.map(id => 
        fetch(`/api/reviews/${id}`, { method: 'DELETE', credentials: 'include' })
      )
      const results = await Promise.allSettled(promises)
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length
      const failed = results.length - successful
      
      if (successful > 0) {
        toast.success(`${successful} review(s) deleted successfully${failed > 0 ? ` (${failed} failed)` : ''}`)
        setSelectedReviews([])
        refetchReviews()
      } else {
        toast.error('Failed to delete reviews')
      }
    } catch (error) {
      console.error('=== BULK DELETE ERROR ===')
      console.error('Error:', error)
      toast.error('Failed to delete reviews. Please try again.')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm({ isOpen: false, type: null, id: null, name: null })
    }
  }

  // Coupon handlers
  const handleUpdateCoupon = async (couponId, updates) => {
    try {
      console.log('=== SENDING COUPON UPDATE DATA ===')
      console.log('Coupon ID:', couponId)
      console.log('Update data:', JSON.stringify(updates, null, 2))
      
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success('Coupon updated successfully')
        refetchCoupons()
        setEditingCoupon(null)
      } else {
        // Display validation errors if available
        if (result.details && Array.isArray(result.details) && result.details.length > 0) {
          console.error('=== COUPON UPDATE VALIDATION ERRORS ===')
          console.error('Details array:', JSON.stringify(result.details, null, 2))
          result.details.forEach((detail, index) => {
            console.error(`Error ${index + 1}:`, {
              path: detail.path,
              message: detail.message,
              fullDetail: detail
            })
          })
          
          const errorMessages = result.details.map(detail => {
            const field = detail.path ? `${detail.path}: ` : ''
            return `${field}${detail.message || JSON.stringify(detail)}`
          }).join(', ')
          toast.error(errorMessages || 'Validation failed')
        } else {
          const errorMessage = result.error || result.message || 'Failed to update coupon'
          toast.error(errorMessage)
          console.error('Coupon update error:', result)
        }
      }
    } catch (error) {
      console.error('Coupon update error:', error)
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

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Access restricted</h1>
          <p className="text-slate-300">You need admin privileges to view the dashboard.</p>
          <Link href="/" className="inline-block mt-6 text-sm font-medium text-sky-300 hover:text-sky-200">
            Go back home →
          </Link>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, <span className="font-semibold text-purple-600">{session.user.name}</span>! 
                  Manage your Dilitech Solutions operations
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={availableTabs} />

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
          <div role="tabpanel" id="admin-tabpanel-orders" aria-labelledby="admin-tab-orders" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Order Management</h3>
                  <p className="text-sm text-gray-500 mt-1">View and manage all customer orders</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select 
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
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
                    className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full sm:w-64 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            {ordersLoading ? (
              <div className="p-12 text-center">
                <LoadingSpinner />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900 mt-4">No orders found</h3>
                <p className="text-gray-500 mt-2">No orders match your search criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Method</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Shipping</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr 
                        key={order.id} 
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                        onClick={() => {
                          // Fetch full order details
                          fetch(`/api/orders/${order.id}`, { credentials: 'include' })
                            .then(res => res.json())
                            .then(data => {
                              if (data.success && data.data) {
                                setSelectedOrder(data.data)
                              } else {
                                setSelectedOrder(order)
                              }
                            })
                            .catch(() => setSelectedOrder(order))
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{order.orderNumber || `#${order.id.slice(-8)}`}</div>
                          {order.trackingNumber && (
                            <div className="text-xs text-blue-600 font-mono mt-0.5">{order.trackingNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{order.user?.name || 'Unknown Customer'}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">{order.user?.email || 'No email'}</div>
                          {order.user?.phone && (
                            <div className="text-xs text-gray-400">{order.user.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</div>
                          {order.deliveredAt && (
                            <div className="text-xs text-green-600 mt-0.5">Delivered {formatDate(order.deliveredAt)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{order.items?.length || 0}</span>
                            <span className="text-xs text-gray-500">items</span>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]" title={order.items.map(i => i.product?.name || 'Product').join(', ')}>
                              {order.items[0]?.product?.name || 'Product'}
                              {order.items.length > 1 && ` +${order.items.length - 1} more`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {order.paymentMethod ? order.paymentMethod.toLowerCase() : '—'}
                          </div>
                          {order.mpesaReceiptNumber && (
                            <div className="text-xs text-emerald-600 font-mono mt-0.5">{order.mpesaReceiptNumber}</div>
                          )}
                          {order.paymentReference && (
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{order.paymentReference}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {order.status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                            {order.paymentStatus || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.shippingAddress ? (
                            <div className="text-xs text-gray-600">
                              <div className="font-medium">{order.shippingAddress.city || '—'}</div>
                              <div className="text-gray-500">{order.shippingAddress.state || ''}</div>
                              {order.carrier && (
                                <div className="text-blue-600 mt-0.5">{order.carrier}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No address</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">{formatKES(order.total || 0)}</div>
                          {order.discount > 0 && (
                            <div className="text-xs text-red-600">-{formatKES(order.discount)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              fetch(`/api/orders/${order.id}`, { credentials: 'include' })
                                .then(res => res.json())
                                .then(data => {
                                  if (data.success && data.data) {
                                    setSelectedOrder(data.data)
                                  } else {
                                    setSelectedOrder(order)
                                  }
                                })
                                .catch(() => setSelectedOrder(order))
                            }}
                            className="text-blue-600 hover:text-blue-900 font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
                          >
                            View Details
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

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div role="tabpanel" id="admin-tabpanel-products" aria-labelledby="admin-tab-products" className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 px-6 py-5 border-b-2 border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Product Management</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage your product catalog, inventory, and pricing</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  />
                  <button 
                    onClick={() => setIsAddProductModalOpen(true)}
                    className="bg-blue-900 text-white px-5 py-2 rounded-xl hover:bg-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    + Add Product
                  </button>
                  <label className="cursor-pointer bg-white border-2 border-gray-200 text-gray-700 px-5 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm hover:shadow-md">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkImport}
                      className="hidden"
                    />
                    📥 Import CSV
                  </label>
                  <button
                    onClick={() => {
                      const csvContent = 'name,sku,price,category,brand,stock,description,originalprice,images,features\nSample Product,SKU-001,1000,Electronics,Sample Brand,10,Product description,1200,https://example.com/image1.jpg|https://example.com/image2.jpg,Feature 1|Feature 2'
                      const blob = new Blob([csvContent], { type: 'text/csv' })
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'product-import-template.csv'
                      a.click()
                      window.URL.revokeObjectURL(url)
                      toast.success('CSV template downloaded')
                    }}
                    className="bg-gray-100 border-2 border-gray-200 text-gray-700 px-5 py-2 rounded-xl hover:bg-gray-200 transition-colors font-medium shadow-sm hover:shadow-md"
                    title="Download CSV template"
                  >
                    📄 Template
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
                            <div className="flex-shrink-0 h-10 w-10 relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300">
                              {product.images?.[0]?.url ? (
                                <OptimizedImage
                                  src={product.images[0].url}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
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
          <div role="tabpanel" id="admin-tabpanel-users" aria-labelledby="admin-tab-users" className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white rounded-t-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-white">User Management</h3>
                  <p className="text-sm text-indigo-100 mt-1">Manage user accounts, roles, and permissions</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="border-2 border-white/20 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder-white/70 focus:border-white focus:ring-2 focus:ring-white/20 focus:outline-none transition-all w-full sm:w-64"
                  />
                  <select 
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="border-2 border-white/20 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:border-white focus:ring-2 focus:ring-white/20 focus:outline-none transition-all"
                  >
                    <option value="" className="text-gray-900">All Users</option>
                    <option value="USER" className="text-gray-900">Users</option>
                    <option value="ADMIN" className="text-gray-900">Admins</option>
                    <option value="MODERATOR" className="text-gray-900">Moderators</option>
                  </select>
                </div>
              </div>
            </div>

            {usersLoading ? (
              <div className="p-12 text-center">
                <LoadingSpinner />
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">No users match your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Spent</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => {
                          fetch(`/api/users/${user.id}`, { credentials: 'include' })
                            .then(res => {
                              if (!res.ok) throw new Error('Failed to fetch user')
                              return res.json()
                            })
                            .then(data => {
                              if (data.success && data.data) {
                                setSelectedUser(data.data)
                              } else if (data.data) {
                                setSelectedUser(data.data)
                              } else {
                                setSelectedUser(user)
                              }
                            })
                            .catch((error) => {
                              console.error('Error fetching user:', error)
                              setSelectedUser(user)
                            })
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.avatar ? (
                                <OptimizedImage className="h-10 w-10 rounded-full border-2 border-gray-200" src={user.avatar} alt={user.name || 'User'} width={40} height={40} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-gray-200">
                                  <span className="text-white font-bold text-sm">
                                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{user.name || 'No name'}</div>
                              <div className="text-xs text-gray-500">{user.phone || 'No phone'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a href={`mailto:${user.email}`} className="text-sm font-medium text-blue-600 hover:text-blue-900">
                            {user.email}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                            className="text-xs border-2 border-gray-200 rounded-lg px-3 py-1.5 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="MODERATOR">MODERATOR</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">{user.totalOrders || 0}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-blue-600">{formatKES(user.totalSpent || 0)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              fetch(`/api/users/${user.id}`, { credentials: 'include' })
                                .then(res => {
                                  if (!res.ok) throw new Error('Failed to fetch user')
                                  return res.json()
                                })
                                .then(data => {
                                  if (data.success && data.data) {
                                    setSelectedUser(data.data)
                                  } else if (data.data) {
                                    setSelectedUser(data.data)
                                  } else {
                                    setSelectedUser(user)
                                  }
                                })
                                .catch((error) => {
                                  console.error('Error fetching user:', error)
                                  setSelectedUser(user)
                                })
                            }}
                            className="text-blue-600 hover:text-blue-900 font-semibold transition-colors"
                          >
                            View
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Analytics Dashboard</h3>
                  <p className="text-sm text-gray-500 mt-1">Track your business performance and insights</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={analyticsDateRange}
                    onChange={(e) => setAnalyticsDateRange(e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
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
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{formatKES(stats.totalRevenue || 0)}</p>
                {stats.revenueGrowth !== undefined && stats.revenueGrowth !== null && (
                  <p className={`text-sm font-medium flex items-center gap-1 ${(stats.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <svg className={`w-4 h-4 ${(stats.revenueGrowth || 0) >= 0 ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {Math.abs(stats.revenueGrowth || 0).toFixed(1)}% from last month
                  </p>
                )}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalOrders || 0}</p>
                {stats.pendingOrders > 0 && (
                  <p className="text-sm text-amber-600 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {stats.pendingOrders} pending orders
                  </p>
                )}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.totalOrders > 0 ? formatKES((stats.totalRevenue || 0) / stats.totalOrders) : formatKES(0)}
                </p>
                <p className="text-sm text-gray-500 font-medium">Per order average</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalUsers || 0}</p>
                {stats.newUsersToday > 0 && (
                  <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    +{stats.newUsersToday} new today
                  </p>
                )}
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="text-lg font-bold text-gray-900">Order Status Distribution</h3>
                <p className="text-xs text-gray-500 mt-0.5">Breakdown of orders by status</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => {
                    const count = orders.filter(o => o.status === status).length
                    const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">{status}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{count} orders</span>
                            <span className="text-sm font-bold text-gray-900">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              status === 'PENDING' ? 'bg-yellow-500' :
                              status === 'CONFIRMED' ? 'bg-blue-500' :
                              status === 'PROCESSING' ? 'bg-purple-500' :
                              status === 'SHIPPED' ? 'bg-indigo-500' :
                              status === 'DELIVERED' ? 'bg-green-500' :
                              status === 'CANCELLED' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <h3 className="text-lg font-bold text-gray-900">Payment Method Breakdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">Revenue by payment method</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {['mpesa', 'card', 'stripe'].map((method) => {
                    const methodOrders = orders.filter(o => o.paymentMethod?.toLowerCase() === method)
                    const count = methodOrders.length
                    const revenue = methodOrders.reduce((sum, o) => sum + (o.total || 0), 0)
                    const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0
                    const methodColors = {
                      mpesa: 'bg-green-500',
                      card: 'bg-blue-500',
                      stripe: 'bg-indigo-500'
                    }
                    return (
                      <div key={method} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700 capitalize">{method.toUpperCase()}</span>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">{count} orders</span>
                            <span className="text-sm font-bold text-gray-900 ml-3">{formatKES(revenue)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${methodColors[method] || 'bg-gray-400'}`}
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <h3 className="text-lg font-bold text-gray-900">Top Selling Products</h3>
                <p className="text-xs text-gray-500 mt-0.5">Best performing products by sales</p>
              </div>
              <div className="p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-gray-500 mt-4 font-medium">No order data available</p>
                    <p className="text-sm text-gray-400 mt-1">Product sales will appear here once orders are placed</p>
                  </div>
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
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200 hover:border-blue-300 transition-all duration-200">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                                #{index + 1}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500 mt-0.5">{product.quantity} units sold</p>
                              </div>
                            </div>
                            <p className="font-bold text-blue-600 text-lg">{formatKES(product.revenue)}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Coupons</p>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{Array.isArray(coupons) ? coupons.length : 0}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Active Coupons</p>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {Array.isArray(coupons) ? coupons.filter(c => c?.status === 'ACTIVE').length : 0}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Usage</p>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-indigo-600">
                  {Array.isArray(coupons) ? coupons.reduce((sum, c) => sum + (c?._count?.orders || 0), 0) : 0}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Expired Coupons</p>
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {Array.isArray(coupons) ? coupons.filter(c => c?.status === 'EXPIRED').length : 0}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Coupon Management</h3>
                    <p className="text-sm text-gray-500 mt-1">Create and manage discount coupons for your store</p>
                  </div>
                  <button
                    onClick={() => setIsCreateCouponModalOpen(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Coupon
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4">
                  <select
                    value={couponStatusFilter}
                    onChange={(e) => setCouponStatusFilter(e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
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
                const safeCoupons = Array.isArray(coupons) ? coupons : []
                const filteredCoupons = couponStatusFilter 
                  ? safeCoupons.filter(c => c?.status === couponStatusFilter)
                  : safeCoupons
                
                if (!Array.isArray(filteredCoupons) || filteredCoupons.length === 0) {
                  return (
                    <div className="p-12 text-center">
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <h3 className="text-lg font-bold text-gray-900 mt-4">No coupons found</h3>
                      <p className="text-gray-500 mt-2">Create your first coupon to get started</p>
                      <button
                        onClick={() => setIsCreateCouponModalOpen(true)}
                        className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                      >
                        Create Coupon
                      </button>
                    </div>
                  )
                }
                
                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Code</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Value</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Usage</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Valid Until</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCoupons.map((coupon) => {
                          const usageCount = coupon._count?.orders || 0
                          const usageLimit = coupon.usageLimit || Infinity
                          const usagePercent = usageLimit !== Infinity ? (usageCount / usageLimit) * 100 : 0
                          const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date()
                          
                          return (
                            <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600">{coupon.code}</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{coupon.name}</td>
                              <td className="px-6 py-4 text-sm capitalize text-gray-700">{(coupon.type || '').toLowerCase().replace('_', ' ')}</td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : formatKES(coupon.value || 0)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2.5 max-w-[120px]">
                                    <div
                                      className={`h-2.5 rounded-full transition-all duration-300 ${
                                        usagePercent >= 100 ? 'bg-red-500' :
                                        usagePercent >= 80 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-600 font-medium">
                                    {usageCount} / {usageLimit === Infinity ? '∞' : usageLimit}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {coupon.validUntil ? formatDate(coupon.validUntil) : <span className="text-gray-400">No expiry</span>}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                  isExpired || coupon.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                  coupon.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {isExpired ? 'EXPIRED' : coupon.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setEditingCoupon(coupon)}
                                    className="text-blue-600 hover:text-blue-900 text-sm font-semibold transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                    className="text-red-600 hover:text-red-900 text-sm font-semibold transition-colors"
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
          <div role="tabpanel" id="admin-tabpanel-reviews" aria-labelledby="admin-tab-reviews" className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 text-white rounded-t-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-white">Review Management</h3>
                  <p className="text-sm text-amber-100 mt-1">
                    {(() => {
                      let filteredCount = reviews.length
                      if (reviewSearch.trim() || reviewFilter !== 'all') {
                        const searchLower = reviewSearch.toLowerCase()
                        filteredCount = reviews.filter(r => {
                          if (reviewFilter !== 'all' && r.rating !== parseInt(reviewFilter)) return false
                          if (reviewSearch.trim()) {
                            const userName = r.user?.name || 'Anonymous'
                            const productName = r.product?.name || ''
                            const title = r.title || ''
                            const comment = r.comment || ''
                            const email = r.user?.email || ''
                            return userName.toLowerCase().includes(searchLower) ||
                                   productName.toLowerCase().includes(searchLower) ||
                                   title.toLowerCase().includes(searchLower) ||
                                   comment.toLowerCase().includes(searchLower) ||
                                   email.toLowerCase().includes(searchLower)
                          }
                          return true
                        }).length
                      }
                      return `${filteredCount} of ${reviews.length} reviews`
                    })()}
                  </p>
                </div>
                {selectedReviews.length > 0 && (
                  <button
                    onClick={handleBulkDeleteReviews}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected ({selectedReviews.length})
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b-2 border-gray-200 bg-gray-50">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search reviews by user, product, title, or comment..."
                    value={reviewSearch}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    onChange={(e) => setReviewSearch(e.target.value)}
                  />
                </div>
                <select
                  value={reviewFilter}
                  onChange={(e) => setReviewFilter(e.target.value)}
                  className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
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
                  className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>
            {reviewsLoading ? (
              <div className="p-12 text-center">
                <LoadingSpinner />
              </div>
            ) : (() => {
              let filteredReviews = reviews
              
              // Apply search filter
              if (reviewSearch.trim()) {
                const searchLower = reviewSearch.toLowerCase()
                filteredReviews = filteredReviews.filter(r => {
                  const userName = r.user?.name || 'Anonymous'
                  const productName = r.product?.name || ''
                  const title = r.title || ''
                  const comment = r.comment || ''
                  const email = r.user?.email || ''
                  
                  return userName.toLowerCase().includes(searchLower) ||
                         productName.toLowerCase().includes(searchLower) ||
                         title.toLowerCase().includes(searchLower) ||
                         comment.toLowerCase().includes(searchLower) ||
                         email.toLowerCase().includes(searchLower)
                })
              }
              
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
                <div className="p-12 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No reviews found</h3>
                  <p className="text-gray-600">No reviews match your search criteria.</p>
                </div>
              ) : (
                <div className="p-6">
                  {/* Select All Header */}
                  {filteredReviews.length > 0 && (
                    <div className="mb-4 flex items-center gap-3 pb-3 border-b border-gray-200">
                      <input
                        type="checkbox"
                        checked={filteredReviews.every(r => selectedReviews.includes(r.id)) && filteredReviews.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const allIds = filteredReviews.map(r => r.id)
                            setSelectedReviews([...new Set([...selectedReviews, ...allIds])])
                          } else {
                            const filteredIds = filteredReviews.map(r => r.id)
                            setSelectedReviews(selectedReviews.filter(id => !filteredIds.includes(id)))
                          }
                        }}
                        className="rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        Select All ({filteredReviews.length} reviews)
                      </span>
                      {selectedReviews.length > 0 && (
                        <span className="text-sm text-gray-500">
                          {selectedReviews.length} selected
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {filteredReviews.map((review) => (
                    <div 
                      key={review.id} 
                      className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedReview(review)
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            if (e.target.checked) {
                              setSelectedReviews([...selectedReviews, review.id])
                            } else {
                              setSelectedReviews(selectedReviews.filter(id => id !== review.id))
                            }
                          }}
                          className="mt-1.5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="ml-1 text-xs font-bold text-gray-700">{review.rating || 0}/5</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{review.user?.name || 'Anonymous'}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 font-medium">{formatDate(review.createdAt)}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <Link 
                              href={`/products/${review.product?.slug || review.productId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-blue-600 hover:text-blue-900 font-semibold truncate"
                            >
                              {review.product?.name || 'Product'}
                            </Link>
                          </div>
                          {review.title && (
                            <p className="font-bold text-base text-gray-900 mb-2">{review.title}</p>
                          )}
                          {review.comment && (
                            <p className="text-sm text-gray-700 mb-3 leading-relaxed line-clamp-3">{review.comment}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-mono font-medium">ID: {review.id.slice(0, 8)}</span>
                            {review.user?.email && (
                              <a 
                                href={`mailto:${review.user.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                {review.user.email}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedReview(review)
                            }}
                            className="px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-2 border-blue-200 hover:border-blue-300"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteReview(review.id)
                            }}
                            className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border-2 border-red-200 hover:border-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
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
                          defaultValue={settings?.store?.storeName || 'Dilitech Solutions'}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Email *</label>
                        <input 
                          type="email" 
                          name="storeEmail"
                          defaultValue={settings?.store?.storeEmail || 'support@dilitechsolutions.com'}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Phone</label>
                        <input 
                          type="tel" 
                          name="storePhone"
                          defaultValue={settings?.store?.storePhone || '+254 700 000 000'}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                        <input 
                          type="text" 
                          name="storeAddress"
                          defaultValue={settings?.store?.storeAddress || 'Nairobi, Kenya'}
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
                              defaultChecked={settings?.store?.enableMpesa !== false}
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
                              defaultChecked={settings?.store?.enableCard !== false}
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
                          defaultValue={settings?.store?.defaultShippingCost || 500}
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
                          defaultValue={settings?.store?.freeShippingThreshold || 5000}
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
                          defaultValue={settings?.store?.taxRate || 0}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select 
                          name="currency"
                          defaultValue={settings?.store?.currency || 'KES'}
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
                          defaultValue={settings?.store?.timezone || 'Africa/Nairobi'}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Email/SMTP Settings */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4 pb-2 border-b">Email/SMTP Settings</h4>
                    <p className="text-sm text-gray-600 mb-4">Configure SMTP settings for sending emails from contact forms and support requests</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host *</label>
                          <input 
                            type="text" 
                            name="smtpHost"
                            defaultValue={settings?.smtp?.host || process.env.NEXT_PUBLIC_SMTP_HOST || 'smtp.gmail.com'}
                            required
                            placeholder="smtp.gmail.com"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port *</label>
                          <input 
                            type="number" 
                            name="smtpPort"
                            defaultValue={settings?.smtp?.port || process.env.NEXT_PUBLIC_SMTP_PORT || 587}
                            required
                            min="1"
                            max="65535"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                          />
                          <p className="text-xs text-gray-500 mt-1">587 for TLS, 465 for SSL</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username/Email *</label>
                          <input 
                            type="email" 
                            name="smtpUser"
                            defaultValue={settings?.smtp?.user || process.env.NEXT_PUBLIC_SMTP_USER || ''}
                            required
                            placeholder="your-email@gmail.com"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                          <input 
                            type="password" 
                            name="smtpPass"
                            placeholder={settings?.smtp?.pass ? '***configured*** (leave blank to keep current)' : 'Enter password'}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                          />
                          <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">From Email Address *</label>
                          <input 
                            type="email" 
                            name="smtpFrom"
                            defaultValue={settings?.smtp?.from || settings?.smtp?.user || process.env.NEXT_PUBLIC_SMTP_FROM || ''}
                            required
                            placeholder="noreply@yourdomain.com"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                          />
                        </div>
                        <div className="flex items-center pt-6">
                          <label className="flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              name="smtpSecure"
                              defaultChecked={settings?.smtp?.secure || settings?.smtp?.port === 465}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">Use SSL/TLS (Secure)</span>
                          </label>
                          <p className="text-xs text-gray-500 ml-4">Enable for port 465 (SSL), disable for port 587 (TLS)</p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            const form = document.getElementById('settings-form')
                            if (!form) return
                            const formData = new FormData(form)
                            const smtpData = {
                              smtpHost: formData.get('smtpHost'),
                              smtpPort: parseInt(formData.get('smtpPort') || '587'),
                              smtpSecure: formData.get('smtpSecure') === 'on',
                              smtpUser: formData.get('smtpUser'),
                              smtpPass: formData.get('smtpPass'),
                              smtpFrom: formData.get('smtpFrom'),
                            }
                            // Only include password if it was changed (not empty)
                            if (!smtpData.smtpPass) {
                              delete smtpData.smtpPass
                            }
                            handleSaveSettings(smtpData, 'smtp')
                          }}
                          disabled={settingsSaving}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {settingsSaving ? 'Saving...' : 'Save SMTP Settings'}
                        </button>
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
                      {settingsSaving ? 'Saving...' : 'Save Store Settings'}
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

        {/* Confirm Delete Modal */}
        <ConfirmDeleteModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, type: null, id: null, name: null })}
          onConfirm={confirmDelete}
          title={deleteConfirm.type === 'coupon' ? 'Delete Coupon' : deleteConfirm.type === 'review' ? 'Delete Review' : deleteConfirm.type === 'bulk_reviews' ? 'Delete Reviews' : 'Confirm Delete'}
          message={deleteConfirm.type === 'coupon' 
            ? 'Are you sure you want to delete this coupon? This action cannot be undone and will affect all future orders.'
            : deleteConfirm.type === 'review'
            ? 'Are you sure you want to delete this review? This action cannot be undone.'
            : deleteConfirm.type === 'bulk_reviews'
            ? `Are you sure you want to delete ${deleteConfirm.name}? This action cannot be undone.`
            : 'Are you sure you want to delete this item? This action cannot be undone.'}
          itemName={deleteConfirm.name}
          isLoading={isDeleting}
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[1000] p-4" onClick={() => setSelectedOrder(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-gray-100" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 text-white flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">Order {selectedOrder.orderNumber || `#${selectedOrder.id.slice(-8)}`}</h2>
                        <p className="text-blue-100 text-sm mt-0.5 font-medium">{formatDate(selectedOrder.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-white/90 hover:text-white transition-all p-2 hover:bg-white/20 rounded-xl backdrop-blur-sm"
                    aria-label="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-br from-gray-50 to-white">
                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Customer */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-xl p-4 border-2 border-blue-300 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Customer</p>
                    </div>
                    <p className="font-black text-sm text-gray-900 truncate mb-1">{selectedOrder.user?.name || 'Unknown'}</p>
                    <a href={`mailto:${selectedOrder.user?.email}`} className="text-xs text-blue-600 hover:text-blue-800 truncate block font-semibold">
                      {selectedOrder.user?.email || 'No email'}
                    </a>
                    {selectedOrder.user?.phone && (
                      <p className="text-xs text-gray-600 mt-1 font-medium">{selectedOrder.user.phone}</p>
                    )}
                  </div>
                  
                  {/* Order Status */}
                  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-xl p-4 border-2 border-purple-300 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Status</p>
                    </div>
                    <select
                      value={selectedOrder.status || 'PENDING'}
                      onChange={(e) => {
                        handleUpdateOrder(selectedOrder.id, { status: e.target.value })
                        setSelectedOrder({ ...selectedOrder, status: e.target.value })
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all bg-white shadow-sm"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-xl p-4 border-2 border-green-300 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Payment</p>
                    </div>
                    <select
                      value={selectedOrder.paymentStatus || 'PENDING'}
                      onChange={(e) => {
                        handleUpdateOrder(selectedOrder.id, { paymentStatus: e.target.value })
                        setSelectedOrder({ ...selectedOrder, paymentStatus: e.target.value })
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all bg-white shadow-sm"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="FAILED">FAILED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-xl p-4 border-2 border-amber-300 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Total</p>
                    </div>
                    <p className="font-black text-xl text-amber-700">{formatKES(selectedOrder.total || 0)}</p>
                    {selectedOrder.discount > 0 && (
                      <p className="text-xs text-red-600 font-bold mt-1">-{formatKES(selectedOrder.discount)}</p>
                    )}
                  </div>
                </div>

                {/* Shipping & Tracking Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shipping Address */}
                  {selectedOrder.shippingAddress && (
                    <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Shipping Address</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm text-gray-900 font-bold">{selectedOrder.shippingAddress.fullName || selectedOrder.shippingAddress.firstName || '—'}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selectedOrder.shippingAddress.street || selectedOrder.shippingAddress.address1 || ''}
                          {selectedOrder.shippingAddress.city ? `, ${selectedOrder.shippingAddress.city}` : ''}
                          {selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ''}
                          {selectedOrder.shippingAddress.postalCode ? ` ${selectedOrder.shippingAddress.postalCode}` : ''}
                        </p>
                        {selectedOrder.shippingAddress.country && (
                          <p className="text-sm text-gray-700 font-semibold">{selectedOrder.shippingAddress.country}</p>
                        )}
                        {selectedOrder.shippingAddress.phone && (
                          <p className="text-sm text-blue-600 font-semibold mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {selectedOrder.shippingAddress.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tracking */}
                  <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Tracking Information</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Tracking Number</label>
                        <input
                          type="text"
                          value={selectedOrder.trackingNumber || ''}
                          onChange={(e) => setSelectedOrder({ ...selectedOrder, trackingNumber: e.target.value })}
                          onBlur={() => handleUpdateOrder(selectedOrder.id, { trackingNumber: selectedOrder.trackingNumber || null })}
                          placeholder="Enter tracking number"
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all bg-white shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Carrier</label>
                        <input
                          type="text"
                          value={selectedOrder.carrier || ''}
                          onChange={(e) => setSelectedOrder({ ...selectedOrder, carrier: e.target.value })}
                          onBlur={() => handleUpdateOrder(selectedOrder.id, { carrier: selectedOrder.carrier || null })}
                          placeholder="Enter carrier name"
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all bg-white shadow-sm"
                        />
                      </div>
                      {selectedOrder.deliveredAt && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-2.5">
                          <p className="text-xs font-semibold text-green-700">Delivered: {formatDate(selectedOrder.deliveredAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Order Items</p>
                    <span className="ml-auto px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                      {selectedOrder.items?.length || 0} {selectedOrder.items?.length === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {selectedOrder.items?.length > 0 ? (
                      selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
                          {item.product?.images?.[0]?.url ? (
                            <div className="flex-shrink-0">
                              <OptimizedImage
                                src={item.product.images[0].url}
                                alt={item.product.name}
                                width={70}
                                height={70}
                                className="rounded-xl object-cover border-2 border-gray-200 shadow-sm"
                              />
                            </div>
                          ) : (
                            <div className="w-[70px] h-[70px] bg-gray-200 rounded-xl border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-base text-gray-900 truncate mb-1">{item.product?.name || 'Product removed'}</p>
                            {item.product?.sku && (
                              <p className="text-xs text-gray-500 font-mono mb-1">SKU: {item.product.sku}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                                Qty: {item.quantity}
                              </span>
                              <span className="text-sm text-gray-600 font-semibold">
                                {formatKES(item.price)} each
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-black text-lg text-blue-600">{formatKES(Number(item.price) * item.quantity)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm text-gray-500 font-medium">No items found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary & Payment Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-300 shadow-sm">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Subtotal</p>
                    <p className="font-black text-lg text-blue-700">{formatKES(selectedOrder.subtotal || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-300 shadow-sm">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Shipping</p>
                    <p className="font-black text-lg text-gray-900">{formatKES(selectedOrder.shipping || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-300 shadow-sm">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Tax</p>
                    <p className="font-black text-lg text-gray-900">{formatKES(selectedOrder.tax || 0)}</p>
                  </div>
                  {selectedOrder.discount > 0 ? (
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-300 shadow-sm">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Discount</p>
                      <p className="font-black text-lg text-red-600">-{formatKES(selectedOrder.discount)}</p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-300 shadow-sm">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Discount</p>
                      <p className="font-black text-lg text-gray-400">—</p>
                    </div>
                  )}
                </div>

                {/* Payment Info & Admin Notes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Payment Info */}
                  {selectedOrder.paymentMethod && (
                    <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Payment Method</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-black text-gray-900 uppercase">{selectedOrder.paymentMethod}</p>
                        {selectedOrder.mpesaReceiptNumber && (
                          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-2.5">
                            <p className="text-xs font-semibold text-green-700 mb-1">M-Pesa Receipt</p>
                            <p className="text-sm font-mono text-green-800 font-bold">{selectedOrder.mpesaReceiptNumber}</p>
                          </div>
                        )}
                        {selectedOrder.paymentReference && (
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-2.5">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Payment Reference</p>
                            <p className="text-sm font-mono text-gray-800 font-bold">{selectedOrder.paymentReference}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Admin Notes</p>
                    </div>
                    <textarea
                      value={selectedOrder.notes || ''}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, notes: e.target.value })}
                      onBlur={() => handleUpdateOrder(selectedOrder.id, { notes: selectedOrder.notes || null })}
                      placeholder="Add internal notes about this order..."
                      rows={5}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all resize-none bg-white shadow-sm"
                    />
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="px-6 py-5 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => {
                      // Open invoice in new window and trigger print dialog
                      const invoiceWindow = window.open(`/orders/${selectedOrder.id}/invoice?download=true`, '_blank')
                      // Wait a bit for the page to load, then trigger print
                      setTimeout(() => {
                        if (invoiceWindow) {
                          invoiceWindow.focus()
                        }
                      }, 1000)
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Invoice
                  </button>
                  {selectedOrder.paymentStatus === 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to process a refund for this order?')) {
                          handleRefund(selectedOrder.id)
                        }
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Process Refund
                    </button>
                  )}
                  {selectedOrder.status === 'SHIPPED' && (
                    <button
                      onClick={() => {
                        const deliveredAt = new Date().toISOString()
                        handleUpdateOrder(selectedOrder.id, { status: 'DELIVERED', deliveredAt })
                        setSelectedOrder({ ...selectedOrder, status: 'DELIVERED', deliveredAt })
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark Delivered
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-sm font-bold shadow-sm hover:shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && selectedUser.id && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={() => setSelectedUser(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">User Details</h2>
                    <p className="text-indigo-100 text-xs mt-0.5">{selectedUser?.email || 'No email'}</p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-white/90 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* User Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <input
                      type="text"
                      value={selectedUser?.name || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                      onBlur={() => selectedUser?.id && handleUpdateUser(selectedUser.id, { name: selectedUser.name || null })}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <input
                      type="email"
                      value={selectedUser?.email || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                      onBlur={() => selectedUser?.id && handleUpdateUser(selectedUser.id, { email: selectedUser.email })}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <input
                      type="tel"
                      value={selectedUser?.phone || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                      onBlur={() => selectedUser?.id && handleUpdateUser(selectedUser.id, { phone: selectedUser.phone || null })}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Role</p>
                    <select
                      value={selectedUser?.role || 'USER'}
                      onChange={(e) => {
                        if (selectedUser?.id) {
                          handleUpdateUser(selectedUser.id, { role: e.target.value })
                          setSelectedUser({ ...selectedUser, role: e.target.value })
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all bg-white"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="MODERATOR">MODERATOR</option>
                    </select>
                  </div>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Total Orders</p>
                    <p className="font-bold text-base text-blue-600">{selectedUser?._count?.orders || selectedUser?.totalOrders || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Total Spent</p>
                    <p className="font-bold text-base text-green-600">{formatKES(selectedUser?.totalSpent || 0)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-xs text-gray-600 mb-1">Reviews</p>
                    <p className="font-bold text-base text-purple-600">{selectedUser?._count?.reviews || 0}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="text-xs text-gray-600 mb-1">Cart Items</p>
                    <p className="font-bold text-base text-orange-600">{selectedUser?._count?.cartItems || 0}</p>
                  </div>
                </div>

                {/* User Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Joined Date</p>
                    <p className="font-medium text-gray-900">{selectedUser.createdAt ? formatDate(selectedUser.createdAt) : '—'}</p>
                  </div>
                  {selectedUser.updatedAt && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedUser.updatedAt)}</p>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                {selectedUser?.avatar && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Avatar</p>
                    <div className="flex items-center gap-3">
                      <OptimizedImage
                        src={selectedUser.avatar}
                        alt={selectedUser?.name || 'User'}
                        width={60}
                        height={60}
                        className="rounded-full border-2 border-gray-200"
                      />
                      <input
                        type="url"
                        value={selectedUser.avatar || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, avatar: e.target.value })}
                        onBlur={() => selectedUser?.id && handleUpdateUser(selectedUser.id, { avatar: selectedUser.avatar || null })}
                        placeholder="Avatar URL"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none transition-all bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                {selectedUser?.id && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                        handleDeleteUser(selectedUser.id)
                      }
                    }}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-semibold flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete User
                  </button>
                )}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Details Modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={() => setSelectedReview(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-4 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Review Details</h2>
                    <p className="text-amber-100 text-xs mt-0.5">Review ID: {selectedReview.id.slice(0, 8)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="text-white/90 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Review Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-5 h-5 ${i < (selectedReview.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm font-bold text-gray-900">{selectedReview.rating || 0} / 5</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedReview.createdAt)}</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">User Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Name</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedReview.user?.name || 'Anonymous'}</p>
                    </div>
                    {selectedReview.user?.email && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <a href={`mailto:${selectedReview.user.email}`} className="text-sm font-medium text-blue-600 hover:text-blue-900">
                          {selectedReview.user.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Product</p>
                  <Link 
                    href={`/products/${selectedReview.product?.slug || selectedReview.productId}`}
                    className="text-sm font-bold text-blue-600 hover:text-blue-900"
                  >
                    {selectedReview.product?.name || 'Product'}
                  </Link>
                  {selectedReview.product?.sku && (
                    <p className="text-xs text-gray-500 mt-1">SKU: {selectedReview.product.sku}</p>
                  )}
                </div>

                {/* Review Content */}
                {selectedReview.title && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Title</p>
                    <p className="text-sm font-bold text-gray-900">{selectedReview.title}</p>
                  </div>
                )}

                {selectedReview.comment && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Comment</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedReview.comment}</p>
                  </div>
                )}

                {/* Review Metadata */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Review ID</p>
                  <p className="text-xs font-mono text-gray-600">{selectedReview.id}</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                <button
                  onClick={() => {
                    if (selectedReview) {
                      handleDeleteReview(selectedReview.id)
                    }
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-semibold flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Review
                </button>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

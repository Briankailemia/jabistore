'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useWishlist, useOrders } from '@/lib/apiService'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { OptimizedImage } from '@/components/OptimizedImage'
import { formatKES } from '@/lib/currency'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const { data: wishlistItems, loading: wishlistLoading, removeFromWishlist } = useWishlist()
  const { data: orders, loading: ordersLoading } = useOrders()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [reservations, setReservations] = useState([])
  const [reservationsLoading, setReservationsLoading] = useState(false)
  const [reservationsError, setReservationsError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    zipCode: ''
  })

  const totalOrders = Array.isArray(orders) ? orders.length : 0
  const totalSpent = Array.isArray(orders)
    ? orders.reduce((sum, order) => {
        if (order.paymentStatus === 'COMPLETED' && typeof order.total === 'number') {
          return sum + order.total
        }

  const handleCancelReservation = async (reservationId) => {
    try {
      setReservationsError('')
      setReservationsLoading(true)

      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        setReservationsError(data?.message || data?.error || 'Failed to cancel reservation')
        return
      }

      const updated = data.data?.reservation
      if (updated) {
        setReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      }
    } catch (error) {
      console.error('Failed to cancel reservation', error)
      setReservationsError('Failed to cancel reservation')
    } finally {
      setReservationsLoading(false)
    }
  }
        return sum
      }, 0)
    : 0
  const wishlistCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) return

      setProfileLoading(true)
      setProfileError('')

      try {
        const res = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include',
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data?.success) {
          setProfileError(data?.message || 'Failed to load profile')
          const nameParts = session.user.name?.split(' ') || []
          setFormData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: session.user.email || '',
            phone: session.user.phone || '',
            address: '',
            city: '',
            country: '',
            zipCode: ''
          })
          setProfileLoading(false)
          return
        }

        const user = data.data?.user || {}
        const nameParts = (user.name || session.user.name || '').split(' ').filter(Boolean)

        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user.email || session.user.email || '',
          phone: user.phone || session.user.phone || '',
          address: '',
          city: '',
          country: '',
          zipCode: ''
        })
      } catch (error) {
        console.error('Failed to load profile', error)
        setProfileError('Failed to load profile')
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [session])

  useEffect(() => {
    if (activeTab !== 'reservations') return
    if (!session?.user) return

    const controller = new AbortController()

    const loadReservations = async () => {
      try {
        setReservationsLoading(true)
        setReservationsError('')

        const res = await fetch('/api/reservations', {
          credentials: 'include',
          signal: controller.signal,
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data?.success) {
          setReservations([])
          setReservationsError(data?.message || data?.error || 'Failed to load reservations')
          return
        }

        setReservations(data.data?.reservations || [])
      } catch (error) {
        if (error.name === 'AbortError') return
        console.error('Failed to load reservations', error)
        setReservationsError('Failed to load reservations')
      } finally {
        setReservationsLoading(false)
      }
    }

    loadReservations()

    return () => controller.abort()
  }, [activeTab, session])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async () => {
    setProfileError('')
    setProfileSuccess('')
    setProfileLoading(true)

    try {
      const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim()

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: fullName || undefined,
          phone: formData.phone || null,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        setProfileError(data?.message || 'Failed to update profile')
        return
      }

      const user = data.data?.user || {}
      const nameParts = (user.name || fullName).split(' ').filter(Boolean)

      setFormData((prev) => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || prev.email,
        phone: user.phone || '',
      }))

      setProfileSuccess('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile', error)
      setProfileError('Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Please sign in</h3>
            <p className="text-gray-600 mb-4">You need to be signed in to view your profile.</p>
            <Link href="/auth/signin" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {formData.firstName?.[0] || session.user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {formData.firstName && formData.lastName 
                  ? `${formData.firstName} ${formData.lastName}` 
                  : session.user.name || session.user.email}
              </h1>
              <p className="text-purple-100 mb-1">{session.user.email}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {session.user.role === 'ADMIN' ? '👑 Admin' : '👤 Customer'}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Member since 2024
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'personal', label: 'Personal Info', icon: '👤' },
                { id: 'orders', label: 'Order History', icon: '📦' },
                { id: 'reservations', label: 'Reservations', icon: '📅' },
                { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
                { id: 'settings', label: 'Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {profileError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {profileError}
              </div>
            )}

            {/* Reservations Tab */}
            {activeTab === 'reservations' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">My Reservations</h2>
                </div>

                {reservationsError && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {reservationsError}
                  </div>
                )}

                {reservationsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : reservations && reservations.length > 0 ? (
                  <div className="space-y-4">
                    {reservations.map((reservation) => {
                      const reservedDate = new Date(reservation.reservedFor)
                      const isPast = reservedDate.getTime() < Date.now()
                      const canCancel = !isPast && reservation.status !== 'CANCELLED' && reservation.status !== 'COMPLETED' && reservation.status !== 'NO_SHOW'

                      return (
                        <div
                          key={reservation.id}
                          className="border rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{reservation.guestName}</span>
                              <span className="text-sm text-gray-600">Party of {reservation.partySize}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {reservedDate.toLocaleString('en-KE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              {reservation.table?.name ? `Table ${reservation.table.name}` : 'No specific table assigned'}
                            </p>
                            {reservation.notes && (
                              <p className="text-xs text-gray-500">Notes: {reservation.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 justify-between md:justify-end">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium
                                ${reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
                                ${reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${reservation.status === 'SEATED' ? 'bg-blue-100 text-blue-800' : ''}
                                ${reservation.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
                                ${reservation.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                                ${reservation.status === 'NO_SHOW' ? 'bg-orange-100 text-orange-800' : ''}
                              `.trim()}
                            >
                              {reservation.status}
                            </span>

                            {canCancel && (
                              <button
                                onClick={() => handleCancelReservation(reservation.id)}
                                className="text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={reservationsLoading}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-4xl">📅</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations yet</h3>
                    <p className="text-gray-600 mb-6">You don&apos;t have any upcoming reservations.</p>
                  </div>
                )}
              </div>
            )}
            {profileSuccess && (
              <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                {profileSuccess}
              </div>
            )}
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total Orders</p>
                        <p className="text-3xl font-bold">
                          {ordersLoading ? '–' : totalOrders}
                        </p>
                      </div>
                      <div className="text-4xl">📦</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Total Spent</p>
                        <p className="text-3xl font-bold">
                          {ordersLoading ? '–' : formatKES(totalSpent)}
                        </p>
                      </div>
                      <div className="text-4xl">💰</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Wishlist Items</p>
                        <p className="text-3xl font-bold">
                          {wishlistLoading ? '–' : wishlistCount}
                        </p>
                      </div>
                      <div className="text-4xl">❤️</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Order #FH-2024-001 delivered successfully</span>
                      <span className="text-xs text-gray-400">2 days ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Added Smart Home Hub to wishlist</span>
                      <span className="text-xs text-gray-400">5 days ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Profile updated</span>
                      <span className="text-xs text-gray-400">1 week ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{formData.firstName || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{formData.lastName || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{formData.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{formData.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{formData.address || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{formData.city || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">{formData.country || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex space-x-4">
                    <button
                      onClick={handleSave}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={profileLoading}
                    >
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                
                <div className="bg-white rounded-lg shadow-sm border p-6">
              
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">Order #{order.id.slice(-8)}</h3>
                          <p className="text-sm text-gray-600">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-600">
                              Payment: {order.paymentMethod === 'mpesa' ? 'M-Pesa' : order.paymentMethod || 'N/A'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              order.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.paymentStatus || 'PENDING'}
                            </span>
                            {order.mpesaReceiptNumber && (
                              <span className="text-xs text-green-600 font-mono">
                                Receipt: {order.mpesaReceiptNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-gray-900">
                            KSh {order.total?.toLocaleString() || '0'}
                          </p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                          <p className="text-sm text-gray-600">
                            {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                            {order.shippingAddress.address}<br />
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                            {order.shippingAddress.country}
                          </p>
                        </div>
                      )}
                      
                      {/* Order Items */}
                      <div className="space-y-3 mb-4">
                        <h4 className="font-medium text-gray-900">Items ({order.items?.length || 0})</h4>
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border">
                              <OptimizedImage
                                src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                                alt={item.product?.name || 'Product'}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {item.product?.name || 'Unknown Product'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.product?.brand?.name} • {item.product?.category?.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity} × KSh {item.price?.toLocaleString() || '0'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                KSh {((item.price || 0) * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className="border-t pt-4">
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">
                              KSh {(order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping</span>
                            <span className="text-gray-900">KSh 500</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax (16%)</span>
                            <span className="text-gray-900">
                              KSh {Math.round((order.total || 0) * 0.16 / 1.16).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold text-lg border-t pt-2">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">KSh {order.total?.toLocaleString() || '0'}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex space-x-3">
                            <Link
                              href={`/orders/${order.id}`}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                            >
                              Track Order
                            </Link>
                            <button className="border border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium">
                              Reorder Items
                            </button>
                          </div>
                          {order.status === 'DELIVERED' && (
                            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                              Leave Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-6">Start shopping to see your order history here</p>
                  <Link
                    href="/products"
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Browse Products
                  </Link>
                </div>
              )}
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2>
                
                {wishlistLoading ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading wishlist...</p>
                  </div>
                ) : wishlistItems && wishlistItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <OptimizedImage
                          src={item.product?.images?.[0]?.url}
                          alt={item.product?.name}
                          width={200}
                          height={200}
                          className="w-full aspect-square object-cover rounded-lg mb-4"
                        />
                        <h3 className="font-semibold text-gray-900 mb-2">{item.product?.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.product?.brand?.name}</p>
                        <div className="flex items-center space-x-2 mb-4">
                          {item.product?.originalPrice && item.product?.originalPrice > item.product?.price ? (
                            <>
                              <span className="text-lg font-bold text-purple-600">{formatKES(item.product?.price)}</span>
                              <span className="text-sm text-gray-500 line-through">{formatKES(item.product?.originalPrice)}</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-purple-600">{formatKES(item.product?.price)}</span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/products/${item.product?.slug}`}
                            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm text-center"
                          >
                            View Product
                          </Link>
                          <button 
                            onClick={() => removeFromWishlist(item.id)}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
                    <p className="mt-2 text-gray-600">Start adding products you love to your wishlist.</p>
                    <Link
                      href="/products"
                      className="mt-6 inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold"
                    >
                      Browse Products
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
                
                <div className="space-y-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-600">Receive order updates and promotions</p>
                        </div>
                        <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">SMS Notifications</p>
                          <p className="text-sm text-gray-600">Receive shipping updates via SMS</p>
                        </div>
                        <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Profile Visibility</p>
                          <p className="text-sm text-gray-600">Make your profile visible to other users</p>
                        </div>
                        <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Data Analytics</p>
                          <p className="text-sm text-gray-600">Help improve our services with usage data</p>
                        </div>
                        <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
                    <div className="space-y-4">
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                        Delete Account
                      </button>
                      <p className="text-sm text-red-600">This action cannot be undone. All your data will be permanently deleted.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

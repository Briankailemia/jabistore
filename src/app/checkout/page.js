'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/apiService'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { CheckoutSkeleton } from '@/components/SkeletonLoader'
import CheckoutSteps from '@/components/checkout/CheckoutSteps'
import OrderSummary from '@/components/checkout/OrderSummary'
import { formatKES } from '@/lib/currency'
import { normalizeMpesaPhone, validateMpesaPhone, formatPhoneDisplay } from '@/lib/phoneUtils'
import { useToast } from '@/components/ui/Toast'

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const { data: cartItems, loading: cartLoading } = useCart()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Kenya',
    paymentMethod: 'mpesa',
    mpesaPhone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [freeShipping, setFreeShipping] = useState(false)
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null) // 'waiting', 'processing', 'success', 'failed'
  const [checkoutRequestId, setCheckoutRequestId] = useState(null)
  const [pollingOrderId, setPollingOrderId] = useState(null)
  const toast = useToast()

  // Poll payment status - MUST be before any conditional returns
  useEffect(() => {
    if (!pollingOrderId || paymentStatus === 'success' || paymentStatus === 'failed') return

    const pollPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/mpesa/status?orderId=${pollingOrderId}`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const status = await response.json()
          
          if (status.isPaid) {
            setPaymentStatus('success')
            // Redirect to confirmation after a short delay
            setTimeout(() => {
              window.location.href = `/orders/${pollingOrderId}/confirmation`
            }, 2000)
          } else if (status.isFailed) {
            setPaymentStatus('failed')
            setErrors(prev => ({ ...prev, submit: 'Payment was cancelled or failed. Please try again.' }))
          }
          // If still pending, continue polling
        }
      } catch (error) {
        console.error('Payment status poll error:', error)
      }
    }

    // Poll every 3 seconds
    const interval = setInterval(pollPaymentStatus, 3000)
    
    // Initial poll
    pollPaymentStatus()

    // Cleanup
    return () => clearInterval(interval)
  }, [pollingOrderId, paymentStatus])

  // Load saved addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!session?.user?.id) return
      
      setLoadingAddresses(true)
      try {
        const response = await fetch('/api/addresses', {
          credentials: 'include'
        })
        if (response.ok) {
          const addresses = await response.json()
          setSavedAddresses(addresses)
          
          // Auto-fill with default address if available
          const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0]
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id)
      setFormData(prev => ({
        ...prev,
              firstName: defaultAddress.firstName,
              lastName: defaultAddress.lastName,
              address: defaultAddress.address1,
              city: defaultAddress.city,
              state: defaultAddress.state,
              postalCode: defaultAddress.postalCode,
              country: defaultAddress.country || 'Kenya',
              phone: defaultAddress.phone || ''
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load addresses:', error)
      } finally {
        setLoadingAddresses(false)
      }
    }

    loadAddresses()
  }, [session])

  useEffect(() => {
    if (session?.user && !selectedAddressId) {
      const nameParts = session.user.name?.split(' ') || []
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || nameParts[0] || '',
        lastName: prev.lastName || nameParts.slice(1).join(' ') || '',
        email: prev.email || session.user.email || ''
      }))
    }
  }, [session, selectedAddressId])

  if (status === 'loading' || cartLoading) {
    return <CheckoutSkeleton />
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-slate-300 mb-6">You need to be signed in to checkout.</p>
          <Link
            href="/auth/signin"
            className="inline-block bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-sky-500/25"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // Ensure cartItems is always an array
  const safeCartItems = Array.isArray(cartItems) ? cartItems : []
  
  if (!safeCartItems || safeCartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-4">Your Cart is Empty</h1>
          <p className="text-slate-300 mb-6">Add some items to your cart before checkout.</p>
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-sky-500/25"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = safeCartItems.reduce((sum, item) => sum + (item.product?.price || 0) * (item.quantity || 0), 0)
  const shippingCost = freeShipping ? 0 : 500
  const tax = subtotal * 0.16
  const finalTotal = subtotal - discount + shippingCost + tax

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let processedValue = value
    
    // Auto-format phone numbers
    if (name === 'phone' || name === 'mpesaPhone') {
      // Allow user to type freely, we'll normalize on blur/validation
      processedValue = value
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    // Clear selected address if user manually edits
    if (selectedAddressId && (name === 'firstName' || name === 'lastName' || name === 'address' || name === 'city' || name === 'state' || name === 'postalCode')) {
      setSelectedAddressId(null)
    }
  }

  const handlePhoneBlur = (e) => {
    const { name, value } = e.target
    if (name === 'phone' || name === 'mpesaPhone') {
      const normalized = normalizeMpesaPhone(value)
      setFormData(prev => ({ ...prev, [name]: normalized }))
    }
  }

  const validateStep = (stepNum) => {
    const newErrors = {}
    
    if (stepNum === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
      if (!formData.email.trim()) newErrors.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
      if (!formData.address.trim()) newErrors.address = 'Address is required'
      if (!formData.city.trim()) newErrors.city = 'City is required'
      if (!formData.state.trim()) newErrors.state = 'State/County is required'
      if (!formData.postalCode.trim()) newErrors.postalCode = 'ZIP code is required'
    } else if (stepNum === 2) {
      if (formData.paymentMethod === 'mpesa') {
        if (!formData.mpesaPhone.trim()) {
          newErrors.mpesaPhone = 'M-Pesa phone number is required'
        } else {
          const normalized = normalizeMpesaPhone(formData.mpesaPhone)
          if (!validateMpesaPhone(normalized)) {
            newErrors.mpesaPhone = 'Please enter a valid M-Pesa number (e.g., 254712345678 or 0712345678)'
          } else {
            // Update with normalized value
            setFormData(prev => ({ ...prev, mpesaPhone: normalized }))
          }
        }
      } else {
        if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required'
        if (!formData.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required'
        if (!formData.cvv.trim()) newErrors.cvv = 'CVV is required'
        if (!formData.cardName.trim()) newErrors.cardName = 'Cardholder name is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    setErrors({})
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return

    setCouponLoading(true)
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          orderAmount: subtotal
        })
      })

      const result = await response.json()
      
      if (result.valid) {
        setAppliedCoupon(result.coupon)
        setDiscount(result.discount)
        setFreeShipping(result.freeShipping || false)
        setCouponCode('')
        setShowCouponInput(false)
      } else {
        setErrors(prev => ({ ...prev, coupon: result.error || 'Invalid coupon code' }))
      }
    } catch (error) {
      console.error('Coupon validation error:', error)
      setErrors(prev => ({ ...prev, coupon: 'Failed to validate coupon' }))
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setDiscount(0)
    setFreeShipping(false)
    setCouponCode('')
    setErrors(prev => ({ ...prev, coupon: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(step)) return

    setIsLoading(true)
    try {
      // Create or get shipping address ID
      let shippingAddressId = selectedAddressId
      
      if (!shippingAddressId) {
        // Create new address and get its ID
        try {
          const addressResponse = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
              postalCode: formData.postalCode,
              country: formData.country,
              phone: formData.phone,
              isDefault: savedAddresses.length === 0 // Set as default if this is the first address
            })
          })
          
          if (addressResponse.ok) {
            const savedAddress = await addressResponse.json()
            shippingAddressId = savedAddress.id
          } else {
            throw new Error('Failed to save address')
          }
        } catch (error) {
          console.error('Failed to save address:', error)
          // Continue without address ID - API will handle it
        }
      }

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: safeCartItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price
          })),
          paymentMethod: formData.paymentMethod,
          total: finalTotal,
          subtotal: subtotal,
          shipping: shippingCost,
          tax: tax,
          discount: discount,
          shippingAddressId: shippingAddressId
        })
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const order = await orderResponse.json()
      if (order.id) {

        if (formData.paymentMethod === 'mpesa') {
          await processMpesaPayment(order.id)
        } else {
          await processCardPayment(order.id)
        }
      } else {
        throw new Error('Failed to create order')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setErrors(prev => ({ ...prev, submit: 'Checkout failed. Please try again.' }))
    } finally {
      setIsLoading(false)
    }
  }

  const processMpesaPayment = async (orderId) => {
    try {
      setPaymentStatus('waiting')
      setPollingOrderId(orderId)
      
      // Normalize phone number before sending
      const normalizedPhone = normalizeMpesaPhone(formData.mpesaPhone)
      
      const response = await fetch('/api/payments/mpesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          phone: normalizedPhone,
          amount: Math.round(finalTotal)
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setCheckoutRequestId(result.checkoutRequestId)
        setPaymentStatus('processing')
        
        // Show appropriate toast message
        if (result.mock) {
          toast.warning(result.message)
        } else if (result.isSandbox) {
          toast.info(result.message)
      } else {
          toast.success(result.message)
        }
        
        // Start polling for payment status
        // The useEffect hook will handle the polling
      } else {
        setPaymentStatus('failed')
        const errorMsg = result.message || 'M-Pesa payment failed. Please try again.'
        setErrors(prev => ({ ...prev, submit: errorMsg }))
        setPollingOrderId(null)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('M-Pesa payment error:', error)
      setPaymentStatus('failed')
      setErrors(prev => ({ ...prev, submit: 'Payment failed. Please try again.' }))
      setPollingOrderId(null)
    }
  }

  const processCardPayment = async (orderId) => {
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: Math.round(finalTotal * 100),
          currency: 'usd'
        })
      })
      
      const result = await response.json()
      if (result.success) {
        window.location.href = `/orders/${orderId}/confirmation`
      } else {
        setErrors(prev => ({ ...prev, submit: 'Payment failed: ' + result.message }))
      }
    } catch (error) {
      console.error('Card payment error:', error)
      setErrors(prev => ({ ...prev, submit: 'Payment failed. Please try again.' }))
    }
  }

  const steps = [
    { number: 1, title: 'Shipping', icon: '🚚' },
    { number: 2, title: 'Payment', icon: '💳' },
    { number: 3, title: 'Review', icon: '✓' }
  ]

  // Payment waiting/processing screen
  if (paymentStatus === 'waiting' || paymentStatus === 'processing') {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
        <div className="max-w-2xl w-full mx-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 lg:p-12 text-center shadow-2xl">
        <div className="mb-8">
              <div className="relative inline-block">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center animate-pulse">
                  <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {paymentStatus === 'waiting' ? 'Sending Payment Request...' : 'Waiting for Payment'}
              </h2>
              <p className="text-slate-300 text-lg mb-2">
                {paymentStatus === 'waiting' 
                  ? 'Initiating M-Pesa STK Push...'
                  : 'Please check your phone and enter your M-Pesa PIN to complete the payment.'}
              </p>
              {paymentStatus === 'processing' && (
                <>
                  <p className="text-slate-400 text-sm mb-6">
                    We're waiting for you to complete the payment on your phone.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sky-400 mb-6">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </>
              )}
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400">Order Total</span>
                <span className="text-2xl font-bold text-white">{formatKES(finalTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Phone Number</span>
                <span className="text-slate-300 font-mono">{formatPhoneDisplay(formData.mpesaPhone)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl text-left">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">What to do:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-300/80">
                      <li>Check your phone for the M-Pesa prompt</li>
                      <li>Enter your M-Pesa PIN when prompted</li>
                      <li>Wait for confirmation - we'll update automatically</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setPaymentStatus(null)
                  setPollingOrderId(null)
                  setCheckoutRequestId(null)
                  setIsLoading(false)
                }}
                className="w-full px-6 py-3 bg-slate-800/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all border border-slate-600"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-slate-400">Complete your purchase in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <CheckoutSteps step={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Shipping */}
              {step === 1 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Shipping Information</h2>
                  </div>

                  {/* Saved Addresses */}
                  {loadingAddresses ? (
                    <div className="mb-6 flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Use Saved Address
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {savedAddresses.map((address) => (
                          <label
                            key={address.id}
                            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedAddressId === address.id
                                ? 'bg-sky-500/20 border-sky-500'
                                : 'bg-slate-800/30 border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <input
                              type="radio"
                              name="savedAddress"
                              checked={selectedAddressId === address.id}
                              onChange={() => {
                                setSelectedAddressId(address.id)
                                setFormData(prev => ({
                                  ...prev,
                                  firstName: address.firstName,
                                  lastName: address.lastName,
                                  address: address.address1,
                                  city: address.city,
                                  state: address.state,
                                  postalCode: address.postalCode,
                                  country: address.country || 'Kenya',
                                  phone: address.phone || ''
                                }))
                              }}
                              className="mt-1 h-4 w-4 text-sky-500 focus:ring-sky-500 border-slate-600"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">
                                  {address.firstName} {address.lastName}
                                </span>
                                {address.isDefault && (
                                  <span className="text-xs bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-400">
                                {address.address1}, {address.city}, {address.state} {address.postalCode}
                              </p>
                              {address.phone && (
                                <p className="text-xs text-slate-500 mt-1">{address.phone}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(null)
                          setFormData(prev => ({
                            ...prev,
                            firstName: '',
                            lastName: '',
                            address: '',
                            city: '',
                            state: '',
                            postalCode: '',
                            phone: ''
                          }))
                        }}
                        aria-label="Use a new address instead of saved address"
                        className="mt-3 text-sm text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Use New Address
                      </button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="checkout-firstName" className="block text-sm font-medium text-slate-300 mb-2">
                        First Name <span className="text-rose-400" aria-label="required">*</span>
                      </label>
                      <input
                        id="checkout-firstName"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="John"
                        aria-required="true"
                        aria-invalid={!!errors.firstName}
                        aria-describedby={errors.firstName ? 'checkout-firstName-error' : undefined}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.firstName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                        }`}
                      />
                      {errors.firstName && <p id="checkout-firstName-error" className="mt-1 text-sm text-rose-400" role="alert">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="checkout-lastName" className="block text-sm font-medium text-slate-300 mb-2">
                        Last Name <span className="text-rose-400" aria-label="required">*</span>
                      </label>
                      <input
                        id="checkout-lastName"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                        aria-required="true"
                        aria-invalid={!!errors.lastName}
                        aria-describedby={errors.lastName ? 'checkout-lastName-error' : undefined}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.lastName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                        }`}
                      />
                      {errors.lastName && <p id="checkout-lastName-error" className="mt-1 text-sm text-rose-400" role="alert">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="checkout-email" className="block text-sm font-medium text-slate-300 mb-2">
                        Email <span className="text-rose-400" aria-label="required">*</span>
                      </label>
                      <input
                        id="checkout-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        aria-required="true"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'checkout-email-error' : undefined}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                        }`}
                      />
                      {errors.email && <p id="checkout-email-error" className="mt-1 text-sm text-rose-400" role="alert">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="checkout-phone" className="block text-sm font-medium text-slate-300 mb-2">
                        Phone <span className="text-rose-400" aria-label="required">*</span>
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={handlePhoneBlur}
                        placeholder="254712345678 or 0712345678"
                        aria-required="true"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'checkout-phone-error checkout-phone-help' : 'checkout-phone-help'}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.phone ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                        }`}
                      />
                      {errors.phone && <p id="checkout-phone-error" className="mt-1 text-sm text-rose-400" role="alert">{errors.phone}</p>}
                      <p id="checkout-phone-help" className="mt-1 text-xs text-slate-500">Accepts: 254XXXXXXXXX, 07XXXXXXXX, or +254XXXXXXXXX</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="checkout-address" className="block text-sm font-medium text-slate-300 mb-2">
                      Address <span className="text-rose-400" aria-label="required">*</span>
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                      aria-required="true"
                      aria-invalid={!!errors.address}
                      aria-describedby={errors.address ? 'checkout-address-error' : undefined}
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.address ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                      }`}
                    />
                    {errors.address && <p id="checkout-address-error" className="mt-1 text-sm text-rose-400" role="alert">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label htmlFor="checkout-city" className="block text-sm font-medium text-slate-300 mb-2">
                        City <span className="text-rose-400" aria-label="required">*</span>
                      </label>
                      <input
                        id="checkout-city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Nairobi"
                        aria-required="true"
                        aria-invalid={!!errors.city}
                        aria-describedby={errors.city ? 'checkout-city-error' : undefined}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.city ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                        }`}
                      />
                      {errors.city && <p id="checkout-city-error" className="mt-1 text-sm text-rose-400" role="alert">{errors.city}</p>}
                    </div>
                    <div>
                      <label htmlFor="checkout-state" className="block text-sm font-medium text-slate-300 mb-2">
                        State/County <span className="text-rose-400" aria-label="required">*</span>
                      </label>
                      <input
                        id="checkout-state"
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="Nairobi County"
                        aria-required="true"
                        aria-invalid={!!errors.state}
                        aria-describedby={errors.state ? 'checkout-state-error' : undefined}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.state ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                        }`}
                      />
                      {errors.state && <p id="checkout-state-error" className="mt-1 text-sm text-rose-400" role="alert">{errors.state}</p>}
                    </div>
                    <div>
                      <label htmlFor="checkout-postalCode" className="block text-sm font-medium text-slate-300 mb-2">
                        ZIP Code <span className="text-rose-400" aria-label="required">*</span>
                      </label>
                      <input
                        id="checkout-postalCode"
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="00100"
                        aria-required="true"
                        aria-invalid={!!errors.postalCode}
                        aria-describedby={errors.postalCode ? 'checkout-postalCode-error' : undefined}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.postalCode ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                        }`}
                      />
                      {errors.postalCode && <p id="checkout-postalCode-error" className="mt-1 text-sm text-rose-400" role="alert">{errors.postalCode}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-sky-500/25 flex items-center gap-2"
                    >
                      Continue to Payment
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Payment Method</h2>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === 'mpesa'
                        ? 'bg-sky-500/20 border-sky-500'
                        : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mpesa"
                        checked={formData.paymentMethod === 'mpesa'}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-sky-500 focus:ring-sky-500 border-slate-600"
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📱</span>
                          <div>
                            <span className="block font-semibold text-white">M-Pesa</span>
                            <span className="text-sm text-slate-400">Pay with your mobile phone</span>
                    </div>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === 'card'
                        ? 'bg-sky-500/20 border-sky-500'
                        : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-sky-500 focus:ring-sky-500 border-slate-600"
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💳</span>
                          <div>
                            <span className="block font-semibold text-white">Credit/Debit Card</span>
                            <span className="text-sm text-slate-400">Visa, Mastercard, or Amex</span>
                    </div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {formData.paymentMethod === 'mpesa' && (
                    <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        M-Pesa Phone Number <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mpesaPhone"
                        value={formData.mpesaPhone}
                        onChange={handleInputChange}
                        onBlur={handlePhoneBlur}
                        placeholder="254712345678 or 0712345678"
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.mpesaPhone ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                        }`}
                      />
                      {errors.mpesaPhone && <p className="mt-1 text-sm text-rose-400">{errors.mpesaPhone}</p>}
                      <p className="mt-2 text-xs text-slate-400">
                        Enter your M-Pesa registered phone number. Accepts: 254XXXXXXXXX, 07XXXXXXXX, or +254XXXXXXXXX
                      </p>
                      {formData.mpesaPhone && validateMpesaPhone(formData.mpesaPhone) && (
                        <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Valid M-Pesa number: {formatPhoneDisplay(formData.mpesaPhone)}
                        </p>
                      )}
                    </div>
                  )}

                  {formData.paymentMethod === 'card' && (
                    <div className="space-y-4 mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Card Number <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                            errors.cardNumber ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                          }`}
                        />
                        {errors.cardNumber && <p className="mt-1 text-sm text-rose-400">{errors.cardNumber}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Expiry Date <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            maxLength="5"
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                              errors.expiryDate ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                            }`}
                          />
                          {errors.expiryDate && <p className="mt-1 text-sm text-rose-400">{errors.expiryDate}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            CVV <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            placeholder="123"
                            maxLength="4"
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                              errors.cvv ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                            }`}
                          />
                          {errors.cvv && <p className="mt-1 text-sm text-rose-400">{errors.cvv}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Cardholder Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="cardName"
                          value={formData.cardName}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                            errors.cardName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-sky-500 focus:border-sky-500'
                          }`}
                        />
                        {errors.cardName && <p className="mt-1 text-sm text-rose-400">{errors.cardName}</p>}
                      </div>
                      <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Your payment information is secure and encrypted</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-6 py-3 bg-slate-800/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all duration-200 border border-slate-600"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-sky-500/25 flex items-center gap-2"
                    >
                      Review Order
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 lg:p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Order Review</h2>
                  </div>
                  
                  <div className="space-y-6 mb-6">
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                      <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Shipping Address
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {formData.firstName} {formData.lastName}<br />
                        {formData.address}<br />
                        {formData.city}, {formData.state} {formData.postalCode}<br />
                        {formData.country}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                      <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Payment Method
                      </h3>
                      <p className="text-slate-300">
                        {formData.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Credit/Debit Card'}
                        {formData.paymentMethod === 'mpesa' && ` (${formData.mpesaPhone})`}
                      </p>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-300">
                      {errors.submit}
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-6 py-3 bg-slate-800/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all duration-200 border border-slate-600"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Place Order
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <OrderSummary
            cartItems={safeCartItems}
            subtotal={subtotal}
            shippingCost={shippingCost}
            tax={tax}
            discount={discount}
            finalTotal={finalTotal}
            freeShipping={freeShipping}
            couponCode={couponCode}
            appliedCoupon={appliedCoupon}
            showCouponInput={showCouponInput}
            setCouponCode={setCouponCode}
            setShowCouponInput={setShowCouponInput}
            validateCoupon={validateCoupon}
            removeCoupon={removeCoupon}
            couponLoading={couponLoading}
            errors={errors}
          />
        </div>
      </div>
    </div>
  )
}

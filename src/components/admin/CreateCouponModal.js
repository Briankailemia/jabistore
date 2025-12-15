'use client'

import { useState } from 'react'

export default function CreateCouponModal({ isOpen, onClose, onCreateCoupon }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    userUsageLimit: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Validate coupon code
    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required'
    } else if (formData.code.trim().length < 3) {
      newErrors.code = 'Coupon code must be at least 3 characters'
    } else if (!/^[A-Z0-9]+$/.test(formData.code.trim().toUpperCase())) {
      newErrors.code = 'Coupon code can only contain letters and numbers'
    }
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Coupon name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Coupon name must be at least 3 characters'
    }
    
    // Validate type
    if (!formData.type) {
      newErrors.type = 'Coupon type is required'
    }
    
    // Validate value
    const value = parseFloat(formData.value)
    if (!formData.value || isNaN(value) || value <= 0) {
      newErrors.value = 'Valid value is required'
    } else if (formData.type === 'PERCENTAGE' && value > 100) {
      newErrors.value = 'Percentage cannot exceed 100%'
    } else if (formData.type === 'FIXED_AMOUNT' && value <= 0) {
      newErrors.value = 'Fixed amount must be greater than 0'
    }
    
    // Validate min order amount if provided
    if (formData.minOrderAmount) {
      const minAmount = parseFloat(formData.minOrderAmount)
      if (isNaN(minAmount) || minAmount < 0) {
        newErrors.minOrderAmount = 'Minimum order amount must be a positive number'
      }
    }
    
    // Validate max discount if provided
    if (formData.maxDiscount) {
      const maxDiscount = parseFloat(formData.maxDiscount)
      if (isNaN(maxDiscount) || maxDiscount < 0) {
        newErrors.maxDiscount = 'Maximum discount must be a positive number'
      }
      if (formData.type === 'PERCENTAGE' && value) {
        const calculatedDiscount = (100 * value) / 100 // Example calculation
        if (maxDiscount < calculatedDiscount) {
          newErrors.maxDiscount = 'Maximum discount should be reasonable for the percentage'
        }
      }
    }
    
    // Validate usage limits if provided
    if (formData.usageLimit) {
      const usageLimit = parseInt(formData.usageLimit, 10)
      if (isNaN(usageLimit) || usageLimit < 1) {
        newErrors.usageLimit = 'Usage limit must be at least 1'
      }
    }
    
    if (formData.userUsageLimit) {
      const userLimit = parseInt(formData.userUsageLimit, 10)
      if (isNaN(userLimit) || userLimit < 1) {
        newErrors.userUsageLimit = 'Per user limit must be at least 1'
      }
    }
    
    // Validate dates
    if (formData.validFrom) {
      const validFrom = new Date(formData.validFrom)
      if (isNaN(validFrom.getTime())) {
        newErrors.validFrom = 'Invalid date'
      }
    }
    
    if (formData.validUntil) {
      const validUntil = new Date(formData.validUntil)
      if (isNaN(validUntil.getTime())) {
        newErrors.validUntil = 'Invalid date'
      } else if (formData.validFrom) {
        const validFrom = new Date(formData.validFrom)
        if (validUntil < validFrom) {
          newErrors.validUntil = 'Valid until date must be after valid from date'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onCreateCoupon({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
        userUsageLimit: formData.userUsageLimit ? parseInt(formData.userUsageLimit, 10) : null,
        validFrom: formData.validFrom || new Date().toISOString().split('T')[0],
        validUntil: formData.validUntil || null,
      })
      // Reset form and close modal on success
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'PERCENTAGE',
        value: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '',
        userUsageLimit: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating coupon:', error)
      // Error is handled by parent component via toast
      // Don't close modal on error so user can fix and retry
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Coupon</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="SAVE20"
              />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="20% Off Sale"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Coupon description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full border rounded-lg px-3 py-2 ${errors.value ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={formData.type === 'PERCENTAGE' ? '20' : '500'}
              />
              {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
              <input
                type="number"
                name="minOrderAmount"
                value={formData.minOrderAmount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full border rounded-lg px-3 py-2 ${errors.minOrderAmount ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0.00"
              />
              {errors.minOrderAmount && <p className="text-red-500 text-xs mt-1">{errors.minOrderAmount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
              <input
                type="number"
                name="maxDiscount"
                value={formData.maxDiscount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full border rounded-lg px-3 py-2 ${errors.maxDiscount ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0.00"
              />
              {errors.maxDiscount && <p className="text-red-500 text-xs mt-1">{errors.maxDiscount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleInputChange}
                min="0"
                className={`w-full border rounded-lg px-3 py-2 ${errors.usageLimit ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Unlimited"
              />
              {errors.usageLimit && <p className="text-red-500 text-xs mt-1">{errors.usageLimit}</p>}
              <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited usage</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
              <input
                type="number"
                name="userUsageLimit"
                value={formData.userUsageLimit}
                onChange={handleInputChange}
                min="0"
                className={`w-full border rounded-lg px-3 py-2 ${errors.userUsageLimit ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="1"
              />
              {errors.userUsageLimit && <p className="text-red-500 text-xs mt-1">{errors.userUsageLimit}</p>}
              <p className="text-xs text-gray-500 mt-1">How many times a single user can use this coupon</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full border rounded-lg px-3 py-2 ${errors.validFrom ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.validFrom && <p className="text-red-500 text-xs mt-1">{errors.validFrom}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleInputChange}
                min={formData.validFrom || new Date().toISOString().split('T')[0]}
                className={`w-full border rounded-lg px-3 py-2 ${errors.validUntil ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.validUntil && <p className="text-red-500 text-xs mt-1">{errors.validUntil}</p>}
              <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


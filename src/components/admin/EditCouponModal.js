'use client'

import { useState, useEffect } from 'react'

export default function EditCouponModal({ isOpen, onClose, coupon, onUpdateCoupon }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    userUsageLimit: '',
    status: 'ACTIVE',
    validFrom: '',
    validUntil: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (coupon) {
      setFormData({
        name: coupon.name || '',
        description: coupon.description || '',
        type: coupon.type || 'PERCENTAGE',
        value: coupon.value || '',
        minOrderAmount: coupon.minOrderAmount || '',
        maxDiscount: coupon.maxDiscount || '',
        usageLimit: coupon.usageLimit || '',
        userUsageLimit: coupon.userUsageLimit || '',
        status: coupon.status || 'ACTIVE',
        validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
        validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
      })
    }
  }, [coupon])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Coupon name is required'
    if (!formData.type) newErrors.type = 'Coupon type is required'
    if (!formData.value || parseFloat(formData.value) <= 0) newErrors.value = 'Valid value is required'
    if (formData.type === 'PERCENTAGE' && parseFloat(formData.value) > 100) {
      newErrors.value = 'Percentage cannot exceed 100%'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onUpdateCoupon(coupon.id, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        userUsageLimit: formData.userUsageLimit ? parseInt(formData.userUsageLimit) : null,
        status: formData.status,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil || null,
      })
      onClose()
    } catch (error) {
      console.error('Error updating coupon:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !coupon) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Coupon: {coupon.code}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
              <input
                type="text"
                value={coupon.code}
                disabled
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Code cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
              <input
                type="number"
                name="userUsageLimit"
                value={formData.userUsageLimit}
                onChange={handleInputChange}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
            <input
              type="date"
              name="validUntil"
              value={formData.validUntil}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
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
              {isSubmitting ? 'Updating...' : 'Update Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


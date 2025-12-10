'use client'

import { useState, useEffect } from 'react'
import { useCategories, useBrands } from '@/lib/apiService'

export default function EditProductModal({ isOpen, onClose, product, onUpdateProduct }) {
  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands()
  
  const categories = categoriesData || []
  const brands = brandsData || []

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    originalPrice: '',
    category: '',
    brand: '',
    stock: '',
    featured: false,
    published: true
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        category: product.categoryId || '',
        brand: product.brandId || '',
        stock: product.stock || 0,
        featured: product.featured || false,
        published: product.published !== false
      })
    }
  }, [product])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.brand) newErrors.brand = 'Brand is required'
    if (formData.stock === '' || parseInt(formData.stock) < 0) newErrors.stock = 'Valid stock quantity is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onUpdateProduct({
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        categoryId: formData.category,
        brandId: formData.brand,
        stock: parseInt(formData.stock),
        featured: formData.featured,
        published: formData.published
      })
      onClose()
    } catch (error) {
      console.error('Error updating product:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full border rounded-lg px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full border rounded-lg px-3 py-2 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter product description"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter SKU"
              />
              {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full border rounded-lg px-3 py-2 ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter stock quantity"
              />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (KES) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full border rounded-lg px-3 py-2 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price (KES)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand *
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 ${errors.brand ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Featured Product</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Published</span>
            </label>
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
              {isSubmitting ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


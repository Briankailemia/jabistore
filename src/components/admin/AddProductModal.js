'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useCategories, useBrands } from '@/lib/apiService'
import { useToast } from '@/components/ui/Toast'
import MediaLibrary from './MediaLibrary'

export default function AddProductModal({ isOpen, onClose, onAddProduct }) {
  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands()
  const toast = useToast()
  
  // Extract arrays from API response structure
  const categories = useMemo(() => {
    if (!categoriesData) return []
    if (Array.isArray(categoriesData)) return categoriesData
    if (categoriesData.categories && Array.isArray(categoriesData.categories)) return categoriesData.categories
    if (categoriesData.data && Array.isArray(categoriesData.data)) return categoriesData.data
    return []
  }, [categoriesData])
  
  const brands = useMemo(() => {
    if (!brandsData) return []
    if (Array.isArray(brandsData)) return brandsData
    if (brandsData.brands && Array.isArray(brandsData.brands)) return brandsData.brands
    if (brandsData.data && Array.isArray(brandsData.data)) return brandsData.data
    return []
  }, [brandsData])

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    sku: '',
    price: '',
    originalPrice: '',
    category: '',
    brand: '',
    stock: '',
    weight: '',
    dimensions: '',
    featured: false,
    status: 'active',
    images: [],
    features: [],
    specifications: [],
    seoTitle: '',
    seoDescription: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newFeature, setNewFeature] = useState('')
  const [newSpecName, setNewSpecName] = useState('')
  const [newSpecValue, setNewSpecValue] = useState('')
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [dragActive, setDragActive] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  const [formTouched, setFormTouched] = useState({})
  const [categorySearch, setCategorySearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)
  
  // Filter categories and brands based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories
    const search = categorySearch.toLowerCase()
    return categories.filter(cat => cat.name?.toLowerCase().includes(search))
  }, [categories, categorySearch])
  
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands
    const search = brandSearch.toLowerCase()
    return brands.filter(brand => brand.name?.toLowerCase().includes(search))
  }, [brands, brandSearch])
  
  // Calculate form completion percentage (only required fields)
  const formCompletion = useMemo(() => {
    const requiredFields = ['name', 'slug', 'sku', 'price', 'stock', 'category', 'brand', 'seoTitle', 'seoDescription']
    
    let completed = 0
    requiredFields.forEach(field => {
      if (formData[field] && formData[field] !== '' && formData[field] !== false) {
        completed++
      }
    })
    
    return Math.round((completed / requiredFields.length) * 100)
  }, [formData])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Mark field as touched
    setFormTouched(prev => ({ ...prev, [name]: true }))
    
    // Auto-generate slug from name
    if (name === 'name' && !formData.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
    
    // Real-time validation for specific fields
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    // Real-time validation
    if (formTouched[name]) {
      validateField(name, type === 'checkbox' ? checked : value)
    }
  }
  
  const validateField = (name, value) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case 'name':
        if (!value || !value.trim()) {
          newErrors.name = 'Product name is required'
        } else {
          delete newErrors.name
        }
        break
      case 'slug':
        if (!value || !value.trim()) {
          newErrors.slug = 'URL slug is required'
        } else if (!/^[a-z0-9-]+$/.test(value)) {
          newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
        } else {
          delete newErrors.slug
        }
        break
      case 'sku':
        if (!value || !value.trim()) {
          newErrors.sku = 'SKU is required'
        } else {
          delete newErrors.sku
        }
        break
      case 'price':
        if (!value || parseFloat(value) <= 0) {
          newErrors.price = 'Valid price is required'
        } else {
          delete newErrors.price
        }
        break
      case 'originalPrice':
        if (value && parseFloat(value) <= parseFloat(formData.price || 0)) {
          newErrors.originalPrice = 'Original price must be greater than sale price'
        } else {
          delete newErrors.originalPrice
        }
        break
      case 'stock':
        if (value === '' || parseInt(value, 10) < 0) {
          newErrors.stock = 'Valid stock quantity is required'
        } else {
          delete newErrors.stock
        }
        break
      case 'category':
        if (!value || value.trim() === '') {
          newErrors.category = 'Category is required'
        } else {
          delete newErrors.category
        }
        break
      case 'brand':
        if (!value || value.trim() === '') {
          newErrors.brand = 'Brand is required'
        } else {
          delete newErrors.brand
        }
        break
      case 'seoDescription':
        if (value && value.length > 160) {
          newErrors.seoDescription = 'SEO description must be 160 characters or less'
        } else {
          delete newErrors.seoDescription
        }
        break
      case 'weight':
        if (value && value.toString().trim() !== '') {
          const weight = parseFloat(value)
          if (isNaN(weight) || weight <= 0) {
            newErrors.weight = 'Weight must be a valid positive number'
          } else {
            delete newErrors.weight
          }
        } else {
          delete newErrors.weight
        }
        break
      case 'dimensions':
        // Dimensions is optional - no validation needed
        delete newErrors.dimensions
        break
    }
    
    setErrors(newErrors)
  }

  const addImage = (imageUrl, altText) => {
    const url = imageUrl || newImageUrl.trim()
    if (url) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, { url, alt: altText || prev.name || 'Product image' }]
      }))
      setNewImageUrl('')
    }
  }

  const handleFileUpload = async (files) => {
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      toast.error('Please select image files')
      return
    }

    setUploading(true)
    const uploadedImages = []
    const progressMap = {}

    try {
      // Initialize progress for all files
      imageFiles.forEach((file, index) => {
        progressMap[file.name] = 0
      })
      setUploadProgress(progressMap)

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 5MB.`)
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 }))
          continue
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if (!validTypes.includes(file.type)) {
          toast.error(`${file.name} is not a supported image format`)
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 }))
          continue
        }

        try {
          const formData = new FormData()
          formData.append('file', file)

          setUploadProgress(prev => ({ ...prev, [file.name]: 25 }))

          const response = await fetch('/api/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          })

          setUploadProgress(prev => ({ ...prev, [file.name]: 75 }))

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              uploadedImages.push({
                url: result.data.url,
                alt: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for alt text
              })
              setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
            } else {
              throw new Error(result.error || 'Upload failed')
            }
          } else {
            const error = await response.json()
            throw new Error(error.error || 'Upload failed')
          }
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError)
          toast.error(`Failed to upload ${file.name}: ${fileError.message || 'Unknown error'}`)
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 }))
        }
      }

      if (uploadedImages.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedImages]
        }))
        toast.success(`Successfully uploaded ${uploadedImages.length} of ${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload images. Please try again.')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress({}), 2000) // Clear progress after 2 seconds
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files)
      e.target.value = '' // Reset input
    }
  }

  const handleSelectFromMediaLibrary = (image) => {
    addImage(image.url, image.alt)
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const setPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isPrimary: i === index }))
    }))
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const addSpecification = () => {
    if (newSpecName.trim() && newSpecValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: [...prev.specifications, { name: newSpecName.trim(), value: newSpecValue.trim() }]
      }))
      setNewSpecName('')
      setNewSpecValue('')
    }
  }

  const removeSpecification = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.slug.trim()) {
      newErrors.slug = 'URL slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }
    // Description is optional - no validation needed
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required'
    
    // Optional fields with conditional validation
    if (formData.originalPrice && formData.originalPrice.trim() !== '') {
      const originalPrice = parseFloat(formData.originalPrice)
      if (isNaN(originalPrice) || originalPrice <= 0) {
        newErrors.originalPrice = 'Original price must be a valid positive number'
      } else if (originalPrice <= parseFloat(formData.price || 0)) {
        newErrors.originalPrice = 'Original price must be greater than sale price'
      }
    }
    
    // Validate category - must be selected (CUID format, not UUID)
    if (!formData.category || formData.category.trim() === '') {
      newErrors.category = 'Category is required'
    }
    
    // Validate brand - must be selected (CUID format, not UUID)
    if (!formData.brand || formData.brand.trim() === '') {
      newErrors.brand = 'Brand is required'
    }
    
    if (formData.stock === '' || parseInt(formData.stock, 10) < 0) newErrors.stock = 'Valid stock quantity is required'
    // Images are optional - no validation needed
    if (!formData.seoTitle || !formData.seoTitle.trim()) newErrors.seoTitle = 'SEO title is required'
    if (!formData.seoDescription || !formData.seoDescription.trim()) {
      newErrors.seoDescription = 'SEO description is required'
    } else if (formData.seoDescription.trim().length > 160) {
      newErrors.seoDescription = 'SEO description must be 160 characters or less'
    }
    
    // Optional numeric fields validation
    if (formData.weight && formData.weight.toString().trim() !== '') {
      const weight = parseFloat(formData.weight)
      if (isNaN(weight) || weight <= 0) {
        newErrors.weight = 'Weight must be a valid positive number'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Mark all fields as touched for validation
    const allFields = Object.keys(formData)
    allFields.forEach(field => {
      setFormTouched(prev => ({ ...prev, [field]: true }))
    })
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.focus()
        }
      }
      toast.error('Please fix the errors in the form before submitting')
      return
    }

    setIsSubmitting(true)
    setSubmitProgress(10)
    
    try {
      // Ensure categoryId and brandId are selected (CUID format)
      const categoryId = formData.category && formData.category.trim() !== '' 
        ? formData.category.trim() 
        : null
      const brandId = formData.brand && formData.brand.trim() !== '' 
        ? formData.brand.trim() 
        : null

      if (!categoryId || !brandId) {
        toast.error('Please select both category and brand')
        setIsSubmitting(false)
        setSubmitProgress(0)
        return
      }

      setSubmitProgress(30)

      // Prepare product data with proper null handling for optional fields
      const productData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        // Optional fields - convert empty strings to null
        description: formData.description?.trim() || null,
        shortDescription: formData.shortDescription?.trim() || null,
        sku: formData.sku.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice && formData.originalPrice.trim() !== '' 
          ? parseFloat(formData.originalPrice) 
          : null,
        categoryId: categoryId,
        brandId: brandId,
        stock: parseInt(formData.stock, 10) || 0,
        weight: formData.weight && formData.weight.toString().trim() !== '' && !isNaN(parseFloat(formData.weight))
          ? parseFloat(formData.weight) 
          : null,
        dimensions: formData.dimensions?.trim() || null,
        featured: formData.featured || false,
        published: formData.status === 'active',
        images: (formData.images && Array.isArray(formData.images) && formData.images.length > 0)
          ? formData.images.map((img, index) => ({
              url: img.url,
              alt: img.alt || formData.name,
              isPrimary: index === 0 || img.isPrimary
            }))
          : [],
        features: formData.features || [],
        specifications: formData.specifications || [],
        seoTitle: formData.seoTitle.trim(),
        seoDescription: formData.seoDescription.trim(),
      }
      
      setSubmitProgress(50)
      
      await onAddProduct(productData)
      
      setSubmitProgress(90)
      
      // Show success message
      toast.success('Product created successfully!')
      
      // Reset form after a brief delay
      setTimeout(() => {
        setFormData({
          name: '',
          slug: '',
          description: '',
          shortDescription: '',
          sku: '',
          price: '',
          originalPrice: '',
          category: '',
          brand: '',
          stock: '',
          weight: '',
          dimensions: '',
          featured: false,
          status: 'active',
          images: [],
          features: [],
          specifications: [],
          seoTitle: '',
          seoDescription: '',
        })
        setErrors({})
        setFormTouched({})
        setNewImageUrl('')
        setNewFeature('')
        setNewSpecName('')
        setNewSpecValue('')
        setSubmitProgress(0)
        onClose()
      }, 500)
      
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error(error.message || 'Failed to add product')
      setSubmitProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-6 py-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black tracking-tight">Add New Product</h2>
                  <p className="text-sm text-blue-200 mt-0.5 font-medium">Create a new product in your catalog</p>
                </div>
                {/* Form Completion Indicator */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <div className="w-24 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-300"
                      style={{ width: `${formCompletion}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-white">{formCompletion}%</span>
                </div>
              </div>
              {/* Progress Bar */}
              {isSubmitting && (
                <div className="mt-3 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-300 ease-out"
                    style={{ width: `${submitProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white/80 hover:text-white transition-all p-2 hover:bg-white/20 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto flex-1 bg-gradient-to-br from-gray-50 to-white">
          {/* Section Navigation */}
          <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 px-6 py-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'basic', label: 'Basic Info', icon: '📝' },
                { id: 'pricing', label: 'Pricing', icon: '💰' },
                { id: 'category', label: 'Category', icon: '🏷️' },
                { id: 'images', label: 'Images', icon: '🖼️' },
                { id: 'features', label: 'Features', icon: '⭐' },
                { id: 'seo', label: 'SEO', icon: '🔍' },
                { id: 'status', label: 'Status', icon: '⚙️' },
              ].map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.id)
                    const element = document.getElementById(`section-${section.id}`)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeSection === section.id
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {section.icon} {section.label}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div id="section-basic" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Basic Information</h3>
                  <p className="text-sm text-gray-500">Essential product details</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={() => setFormTouched(prev => ({ ...prev, name: true }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                    errors.name ? 'border-red-500 bg-red-50' : formTouched.name && !errors.name ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                  placeholder="Enter product name"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.name}
                </p>}
                {formTouched.name && !errors.name && formData.name && (
                  <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Looks good!
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    onBlur={() => setFormTouched(prev => ({ ...prev, slug: true }))}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                      errors.slug ? 'border-red-500 bg-red-50' : formTouched.slug && !errors.slug && formData.slug ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                    placeholder="product-name-slug"
                  />
                  {errors.slug && (
                    <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.slug}
                    </p>
                  )}
                  {formTouched.slug && !errors.slug && formData.slug && (
                    <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Valid slug format
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Auto-generated from name, or customize</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    onBlur={() => setFormTouched(prev => ({ ...prev, sku: true }))}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                      errors.sku ? 'border-red-500 bg-red-50' : formTouched.sku && !errors.sku && formData.sku ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                    placeholder="PROD-001"
                  />
                  {errors.sku && (
                    <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.sku}
                    </p>
                  )}
                  {formTouched.sku && !errors.sku && formData.sku && (
                    <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      SKU is valid
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  placeholder="Brief product summary (optional)"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.shortDescription.length}/160 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={() => setFormTouched(prev => ({ ...prev, description: true }))}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium resize-none ${
                    errors.description ? 'border-red-500 bg-red-50' : formTouched.description && !errors.description && formData.description ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                  placeholder="Enter detailed product description (optional)"
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.description}
                  </p>
                )}
                {formTouched.description && !errors.description && formData.description && (
                  <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Description added
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1.5">Leave empty if you prefer to use only the short description</p>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div id="section-pricing" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Pricing & Inventory</h3>
                  <p className="text-sm text-gray-500">Set prices and stock levels</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (KES) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">KES</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      onBlur={() => setFormTouched(prev => ({ ...prev, price: true }))}
                      step="0.01"
                      min="0"
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                        errors.price ? 'border-red-500 bg-red-50' : formTouched.price && !errors.price && formData.price ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price && (
                    <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.price}
                    </p>
                  )}
                  {formTouched.price && !errors.price && formData.price && (
                    <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Price is valid
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price (KES) <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">KES</span>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleInputChange}
                      onBlur={() => setFormTouched(prev => ({ ...prev, originalPrice: true }))}
                      step="0.01"
                      min="0"
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                        errors.originalPrice ? 'border-red-500 bg-red-50' : formTouched.originalPrice && !errors.originalPrice && formData.originalPrice ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.originalPrice && (
                    <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.originalPrice}
                    </p>
                  )}
                  {formTouched.originalPrice && !errors.originalPrice && formData.originalPrice && (
                    <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Original price set
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1.5">Leave empty if there's no original price (for showing discount)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      onBlur={() => setFormTouched(prev => ({ ...prev, stock: true }))}
                      min="0"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                        errors.stock ? 'border-red-500 bg-red-50' : formTouched.stock && !errors.stock && formData.stock !== '' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                      placeholder="0"
                    />
                    {errors.stock && (
                      <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.stock}
                      </p>
                    )}
                    {formTouched.stock && !errors.stock && formData.stock !== '' && (
                      <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Stock quantity set
                      </p>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg) <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    onBlur={() => setFormTouched(prev => ({ ...prev, weight: true }))}
                    step="0.01"
                    min="0"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                      errors.weight ? 'border-red-500 bg-red-50' : formTouched.weight && !errors.weight && formData.weight ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.weight && (
                    <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.weight}
                    </p>
                  )}
                  {formTouched.weight && !errors.weight && formData.weight && (
                    <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Weight set
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dimensions (L x W x H) <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    onBlur={() => setFormTouched(prev => ({ ...prev, dimensions: true }))}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                      formTouched.dimensions && formData.dimensions ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                    placeholder="e.g., 10 x 5 x 3 cm"
                  />
                  {formTouched.dimensions && formData.dimensions && (
                    <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Dimensions added
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Category & Brand */}
            <div id="section-category" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏷️</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Category & Brand</h3>
                  <p className="text-sm text-gray-500">Organize your product</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      onFocus={() => setCategorySearch('')}
                      placeholder="Search categories..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all mb-2"
                    />
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      onBlur={() => {
                        setFormTouched(prev => ({ ...prev, category: true }))
                        setCategorySearch('')
                      }}
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                        errors.category ? 'border-red-500 bg-red-50' : formTouched.category && !errors.category && formData.category ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select Category</option>
                      {filteredCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.category && (
                    <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.category}
                    </p>
                  )}
                  {formTouched.category && !errors.category && formData.category && (
                    <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Category selected
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      onFocus={() => setBrandSearch('')}
                      placeholder="Search brands..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all mb-2"
                    />
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      onBlur={() => {
                        setFormTouched(prev => ({ ...prev, brand: true }))
                        setBrandSearch('')
                      }}
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                        errors.brand ? 'border-red-500 bg-red-50' : formTouched.brand && !errors.brand && formData.brand ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select Brand</option>
                      {filteredBrands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.brand && (
                    <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.brand}
                    </p>
                  )}
                  {formTouched.brand && !errors.brand && formData.brand && (
                    <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Brand selected
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div id="section-images" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🖼️</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Product Images <span className="text-gray-400 text-xs">(Optional)</span></h3>
                  <p className="text-sm text-gray-500">Upload product photos (optional)</p>
                </div>
              </div>
              
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className={`aspect-square rounded-xl overflow-hidden border-2 ${
                        img.isPrimary ? 'border-blue-900 ring-2 ring-blue-500' : 'border-gray-200'
                      }`}>
                        <img
                          src={img.url}
                          alt={img.alt}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E'
                          }}
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            className="bg-blue-900 text-white p-1.5 rounded-lg text-xs hover:bg-blue-800 shadow-lg"
                            title="Set as primary"
                          >
                            ⭐
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-red-600 text-white p-1.5 rounded-lg text-xs hover:bg-red-700 shadow-lg"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                      {img.isPrimary && (
                        <div className="absolute bottom-2 left-2 bg-blue-900 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all relative ${
                  dragActive
                    ? 'border-blue-900 bg-blue-50 ring-4 ring-blue-200'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                {uploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                      <svg className="animate-spin h-16 w-16 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div className="w-full max-w-xs">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Uploading images...</p>
                      {Object.keys(uploadProgress).length > 0 && (
                        <div className="space-y-1">
                          {Object.entries(uploadProgress).map(([fileName, progress]) => (
                            <div key={fileName} className="text-left">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span className="truncate">{fileName}</span>
                                <span>{progress > 0 ? `${progress}%` : progress === -1 ? 'Failed' : 'Pending'}</span>
                              </div>
                              {progress > 0 && progress < 100 && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-base font-semibold text-gray-700 mb-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-900 hover:text-blue-800 font-bold underline decoration-2"
                      >
                        Click to upload
                      </button>
                      {' '}or drag and drop images here
                    </p>
                    <p className="text-sm text-gray-500">PNG, JPG, WEBP up to 5MB each • Multiple files supported</p>
                    {formData.images.length > 0 && (
                      <p className="text-sm text-green-600 font-semibold mt-2">
                        ✓ {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} added
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsMediaLibraryOpen(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium border border-gray-200"
                >
                  📚 Select from Media Library
                </button>
                <div className="flex-1 flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                    placeholder="Or enter image URL"
                  />
                  <button
                    type="button"
                    onClick={() => addImage()}
                    className="px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors font-medium"
                  >
                    Add URL
                  </button>
                </div>
              </div>
              {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}
              <p className="text-xs text-gray-500">
                Upload images from your computer, select from media library, or add by URL. First image will be set as primary.
              </p>
            </div>

            {/* Features */}
            <div id="section-features" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Product Features</h3>
                  <p className="text-sm text-gray-500">Highlight key features</p>
                </div>
              </div>
              
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 bg-blue-50 text-blue-900 px-3 py-1 rounded-lg border border-blue-200"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  placeholder="Enter feature (e.g., 'Wireless charging')"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Add Feature
                </button>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Specifications</h3>
              
              {formData.specifications.length > 0 && (
                <div className="space-y-2">
                  {formData.specifications.map((spec, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{spec.name}:</span>
                        <span className="text-gray-600 ml-2">{spec.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpecification(index)}
                        className="text-red-600 hover:text-red-800 ml-4"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newSpecName}
                  onChange={(e) => setNewSpecName(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  placeholder="Spec name (e.g., 'Color')"
                />
                <input
                  type="text"
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  placeholder="Spec value (e.g., 'Black')"
                />
                <button
                  type="button"
                  onClick={addSpecification}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Add Spec
                </button>
              </div>
            </div>

            {/* SEO */}
            <div id="section-seo" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">SEO Settings</h3>
                  <p className="text-sm text-gray-500">Optimize for search engines</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Title *
                </label>
                <input
                  type="text"
                  name="seoTitle"
                  value={formData.seoTitle}
                  onChange={handleInputChange}
                  onBlur={() => setFormTouched(prev => ({ ...prev, seoTitle: true }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium ${
                    errors.seoTitle ? 'border-red-500 bg-red-50' : formTouched.seoTitle && !errors.seoTitle && formData.seoTitle ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                  placeholder="SEO-friendly title"
                />
                {errors.seoTitle && (
                  <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.seoTitle}
                  </p>
                )}
                {formTouched.seoTitle && !errors.seoTitle && formData.seoTitle && (
                  <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    SEO title is valid
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Description *
                </label>
                <textarea
                  name="seoDescription"
                  value={formData.seoDescription}
                  onChange={handleInputChange}
                  onBlur={() => setFormTouched(prev => ({ ...prev, seoDescription: true }))}
                  rows={3}
                  maxLength={160}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all font-medium resize-none ${
                    errors.seoDescription ? 'border-red-500 bg-red-50' : formTouched.seoDescription && !errors.seoDescription && formData.seoDescription ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                  placeholder="SEO meta description (160 characters max)"
                />
                {errors.seoDescription && (
                  <p className="text-red-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.seoDescription}
                  </p>
                )}
                {formTouched.seoDescription && !errors.seoDescription && formData.seoDescription && (
                  <p className="text-green-600 text-sm mt-1.5 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    SEO description is valid
                  </p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-gray-500">{formData.seoDescription.length}/160 characters</p>
                  {formData.seoDescription.length >= 120 && formData.seoDescription.length <= 160 && (
                    <p className="text-xs text-green-600 font-medium">✓ Optimal length</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Options */}
            <div id="section-status" className="space-y-4 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Status & Options</h3>
                  <p className="text-sm text-gray-500">Publishing and visibility settings</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft (Unpublished)</option>
                  </select>
                </div>

                <div className="flex items-center pt-8">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 block text-sm text-gray-700">
                    <span className="font-medium">Featured Product</span>
                    <span className="block text-xs text-gray-500">Show on homepage and featured sections</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-6 py-4 -mx-6 -mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Required fields: </span>
                  <span className="text-red-500">*</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || Object.keys(errors).length > 0}
                    className="px-8 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl hover:from-blue-800 hover:to-indigo-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Product...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Create Product
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Media Library Modal */}
        <MediaLibrary
          isOpen={isMediaLibraryOpen}
          onClose={() => setIsMediaLibraryOpen(false)}
          onSelectImage={handleSelectFromMediaLibrary}
          multiple={true}
        />
      </div>
    </div>
  )
}

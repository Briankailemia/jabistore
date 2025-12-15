'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { OptimizedImage } from '@/components/OptimizedImage'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ProductDetailSkeleton } from '@/components/SkeletonLoader'
import SEOHead from '@/components/SEOHead'
import Card from '@/components/ui/Card'
import Button, { buttonClasses } from '@/components/ui/Button'
import { formatKES } from '@/lib/currency'
import { generateProductMeta, generateProductStructuredData } from '@/lib/seo'
import apiService, { useProduct, useCart, useProducts } from '@/lib/apiService'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: sessionStatus, update: updateSession } = useSession()
  const { data: product, loading, error } = useProduct(params.id)
  const { refreshCart } = useCart()

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [cartStatus, setCartStatus] = useState({ state: 'idle', message: '' })
  const [wishlistStatus, setWishlistStatus] = useState({ state: 'idle', message: '' })

  // Fetch related products
  const { data: relatedProductsData } = useProducts({
    category: product?.category?.slug,
    limit: 4,
  })
  const relatedProducts = relatedProductsData?.data?.products || relatedProductsData?.products || []
  const filteredRelated = relatedProducts.filter(p => p.id !== product?.id).slice(0, 4)

  useEffect(() => {
    if (product?.stock > 0) {
      setQuantity(1)
    }
  }, [product?.stock])

  const redirectToSignIn = () => {
    const callbackUrl = encodeURIComponent(`/products/${params.id}`)
    router.push(`/auth/signin?callbackUrl=${callbackUrl}`)
  }

  const handleAddToCart = async () => {
    // If session is loading, wait a bit for it to load
    if (sessionStatus === 'loading') {
      setCartStatus({ state: 'loading', message: 'Checking session…' })
      // Wait for session to load (max 2 seconds)
      let waitCount = 0
      while (sessionStatus === 'loading' && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 100))
        waitCount++
      }
    }

    // Final check - if not authenticated, redirect
    if (!session || sessionStatus === 'unauthenticated') {
      redirectToSignIn()
      return
    }

    try {
      setCartStatus({ state: 'loading', message: 'Adding to cart…' })
      const result = await apiService.addToCart(product.id, quantity)
      
      // Check if the API returned an error in the response
      if (result && !result.success && result.message) {
        throw new Error(result.message);
      }
      
      setCartStatus({ state: 'success', message: `${quantity} item${quantity > 1 ? 's' : ''} added to your cart.` })
      
      // Refresh cart to update count in header (with a small delay to ensure DB is updated)
      setTimeout(() => {
        refreshCart()
      }, 300)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setCartStatus({ state: 'idle', message: '' })
      }, 3000)
    } catch (err) {
      console.error('Add to cart error:', err);
      // Handle unauthorized specifically
      if (err.message === 'UNAUTHORIZED' || err.message.includes('401') || err.message.includes('Unauthorized')) {
        // Try to refresh session once more
        try {
          await updateSession()
          // Wait a moment for session to refresh
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Re-check session after refresh
          if (!session || sessionStatus === 'unauthenticated') {
            setCartStatus({ state: 'error', message: 'Your session expired. Redirecting to sign in...' })
            setTimeout(() => {
              redirectToSignIn()
            }, 1500)
            return
          }
          
          // If session refreshed, retry the operation
          setCartStatus({ state: 'loading', message: 'Retrying...' })
          await apiService.addToCart(product.id, quantity)
          setCartStatus({ state: 'success', message: `${quantity} item${quantity > 1 ? 's' : ''} added to your cart.` })
          await updateSession()
        } catch (retryErr) {
          setCartStatus({ state: 'error', message: 'Your session expired. Please sign in again.' })
          setTimeout(() => {
            redirectToSignIn()
          }, 2000)
        }
      } else {
        setCartStatus({ state: 'error', message: err.message || 'Unable to add to cart.' })
      }
    }
  }

  const handleAddToWishlist = async () => {
    // If session is loading, wait a bit for it to load
    if (sessionStatus === 'loading') {
      setWishlistStatus({ state: 'loading', message: 'Checking session…' })
      // Wait for session to load (max 2 seconds)
      let waitCount = 0
      while (sessionStatus === 'loading' && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 100))
        waitCount++
      }
    }

    // Final check - if not authenticated, redirect
    if (!session || sessionStatus === 'unauthenticated') {
      redirectToSignIn()
      return
    }

    try {
      setWishlistStatus({ state: 'loading', message: '' })
      await apiService.addToWishlist(product.id)
      setWishlistStatus({ state: 'success', message: 'Saved to your wishlist.' })
      
      // Refresh session
      await updateSession()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setWishlistStatus({ state: 'idle', message: '' })
      }, 3000)
    } catch (err) {
      // Handle unauthorized specifically
      if (err.message === 'UNAUTHORIZED' || err.message.includes('401') || err.message.includes('Unauthorized')) {
        // Try to refresh session once more
        try {
          await updateSession()
          // Wait a moment for session to refresh
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Re-check session after refresh
          if (!session || sessionStatus === 'unauthenticated') {
            setWishlistStatus({ state: 'error', message: 'Your session expired. Redirecting to sign in...' })
            setTimeout(() => {
              redirectToSignIn()
            }, 1500)
            return
          }
          
          // If session refreshed, retry the operation
          setWishlistStatus({ state: 'loading', message: 'Retrying...' })
          await apiService.addToWishlist(product.id)
          setWishlistStatus({ state: 'success', message: 'Saved to your wishlist.' })
          await updateSession()
        } catch (retryErr) {
          setWishlistStatus({ state: 'error', message: 'Your session expired. Please sign in again.' })
          setTimeout(() => {
            redirectToSignIn()
          }, 2000)
        }
      } else {
        setWishlistStatus({ state: 'error', message: err.message || 'Unable to save to wishlist.' })
      }
    }
  }

  const quantityIncrement = () => {
    if (!product?.stock) return
    setQuantity((prev) => Math.min(product.stock, prev + 1))
  }

  const quantityDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  if (loading) {
    return <ProductDetailSkeleton />
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
        <Card className="max-w-lg text-center space-y-4 bg-white border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900">{error ? 'Error loading product' : 'Product not found'}</h3>
          <p className="text-gray-600">{error ? error : "The product you're looking for doesn't exist."}</p>
          <Link href="/products" className={buttonClasses({ size: 'md', className: 'w-full justify-center' })}>
            Browse products
          </Link>
        </Card>
      </div>
    )
  }

  // Color variables removed - now using inline styles in JSX

  return (
    <>
    <div className="min-h-screen bg-transparent text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-10">
        <nav className="flex flex-wrap items-center text-sm text-gray-600 gap-2" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-blue-900 transition-colors">Home</Link>
            </li>
            <li>
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <Link href="/products" className="hover:text-blue-900 transition-colors">Products</Link>
            </li>
            <li>
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-semibold">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
          <Card className="p-6 bg-white border-gray-200">
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
                {product.images?.[selectedImage] ? (
                  <OptimizedImage
                    src={product.images[selectedImage].url}
                    alt={product.images[selectedImage].alt || product.name}
                    width={700}
                    height={700}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">Product image</div>
                )}
                {product.featured && (
                  <span className="absolute top-4 left-4 rounded-full bg-blue-900 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                    Featured
                  </span>
                )}
              </div>
              {product.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id || index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                        selectedImage === index 
                          ? 'border-blue-900 ring-2 ring-blue-900/20 shadow-md' 
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                      aria-label={`Select image ${index + 1}`}
                    >
                      <OptimizedImage
                        src={image.url}
                        alt={image.alt || `${product.name} ${index + 1}`}
                        width={150}
                        height={150}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-8 space-y-6 bg-white border-gray-200">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-blue-600 font-bold mb-2">{product.brand?.name || 'Dilitech'}</p>
                <h1 className="text-4xl font-black text-gray-900 leading-tight">{product.name}</h1>
                {product.category && (
                  <Link 
                    href={`/products?category=${product.category.slug}`}
                    className="inline-block mt-3 text-sm text-blue-900 hover:text-blue-700 font-medium transition-colors"
                  >
                    {product.category.name} →
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(product.averageRating || 0) ? 'text-amber-500' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {product.averageRating ? `${product.averageRating.toFixed(1)} · ` : ''}
                  {product.reviewCount || 0} review{product.reviewCount === 1 ? '' : 's'}
                </p>
                {product.reviewCount > 0 && (
                  <Link href="#reviews" className="text-sm text-blue-900 hover:text-blue-700 font-medium transition-colors">
                    View all →
                  </Link>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-4 pb-4 border-b border-gray-200">
                <span className="text-4xl font-black text-gray-900">{formatKES(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-xl text-gray-400 line-through">{formatKES(product.originalPrice)}</span>
                    <span className="rounded-full bg-red-50 border border-red-200 px-4 py-1.5 text-sm font-bold text-red-700">
                      Save {formatKES(product.originalPrice - product.price)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={product.stock > 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                  {product.stock > 0 ? `In stock · ${product.stock} units available` : 'Currently out of stock'}
                </span>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Quantity</p>
                  <div className="flex items-center rounded-xl border-2 border-gray-300 bg-white">
                    <button
                      onClick={quantityDecrement}
                      className="px-4 py-2 text-lg text-gray-700 hover:text-blue-900 hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed rounded-l-lg"
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-6 py-2 text-lg font-bold text-gray-900 border-x-2 border-gray-300 min-w-[60px] text-center">{quantity}</span>
                    <button
                      onClick={quantityIncrement}
                      className="px-4 py-2 text-lg text-gray-700 hover:text-blue-900 hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed rounded-r-lg"
                      disabled={product.stock <= quantity}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || cartStatus.state === 'loading'}
                    className="w-full text-center justify-center py-4 text-base font-bold"
                  >
                    {cartStatus.state === 'loading' ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding…
                      </span>
                    ) : (
                      'Add to cart'
                    )}
                  </Button>
                  <button
                    onClick={handleAddToWishlist}
                    aria-pressed={wishlistStatus.state === 'success'}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-700 hover:border-blue-900 hover:text-blue-900 hover:bg-blue-50 transition-all duration-200 font-semibold"
                  >
                    <svg
                      className={`w-5 h-5 transition-colors ${wishlistStatus.state === 'success' ? 'text-red-500 fill-red-500' : ''}`}
                      viewBox="0 0 24 24"
                      fill={wishlistStatus.state === 'success' ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {wishlistStatus.state === 'success' ? 'Saved' : 'Save to wishlist'}
                  </button>
                </div>

                {(cartStatus.state === 'success' || cartStatus.state === 'error') && (
                  <div className={`text-sm p-4 rounded-xl ${
                    cartStatus.state === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    <p className="font-semibold mb-3">{cartStatus.message}</p>
                    {cartStatus.state === 'success' && (
                      <div className="flex gap-3">
                        <Link href="/cart" className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'flex-1 justify-center' })}>
                          View cart
                        </Link>
                        <Link href="/checkout" className={buttonClasses({ size: 'sm', className: 'flex-1 justify-center' })}>
                          Checkout
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                {(wishlistStatus.state === 'success' || wishlistStatus.state === 'error') && (
                  <p className={`text-sm p-3 rounded-xl font-semibold ${
                    wishlistStatus.state === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {wishlistStatus.message}
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-4 bg-gradient-to-br from-blue-50 to-white border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Benefits</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <span className="font-medium">Free shipping on orders over KSh 7,500</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">60-day returns & instant swaps</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="font-medium">Verified Stripe & M-Pesa billing</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-medium">Concierge onboarding optional</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="mt-10 p-8 space-y-6 bg-white border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" role="tablist">
              {['description', 'features', 'specifications', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm capitalize transition-all duration-200 ${
                    activeTab === tab
                      ? 'border-blue-900 text-blue-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === 'description' && (
              <div className="text-gray-700 leading-relaxed space-y-4 prose prose-lg max-w-none">
                <p className="text-base">{product.description}</p>
              </div>
            )}

            {activeTab === 'features' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
                {product.features?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-start p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium">{feature.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No features listed for this product.</p>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Technical Specifications</h3>
                {product.specifications?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.specifications.map((spec, index) => (
                      <div key={index} className="flex justify-between items-center py-3 px-4 border-b border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                        <span className="font-semibold text-gray-900">{spec.name}</span>
                        <span className="text-gray-600">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No specifications available for this product.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div id="reviews">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Customer Reviews</h3>
                  {product.reviewCount > 0 && (
                    <span className="text-sm text-gray-600 font-medium">
                      {product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                {product.reviews?.length > 0 ? (
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-900 font-bold text-sm">
                                {(review.user?.name || 'A')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 block">{review.user?.name || 'Anonymous'}</span>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? 'text-amber-500' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                        )}
                        {review.content && (
                          <p className="text-gray-700 leading-relaxed">{review.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-600 font-medium mb-2">No reviews yet</p>
                    <p className="text-sm text-gray-500">Be the first to review this product!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Related Products */}
        {filteredRelated.length > 0 && (
          <div className="mt-12">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-2">You might also like</h2>
              <p className="text-gray-600">Similar products you might be interested in</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredRelated.map((relatedProduct) => (
                <Link 
                  key={relatedProduct.id} 
                  href={`/products/${relatedProduct.slug || relatedProduct.id}`}
                  className="group block focus-visible:outline-none cursor-pointer"
                >
                  <Card className="flex flex-col gap-4 border-gray-200 group-hover:border-blue-900 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200 h-full">
                    <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gray-100">
                      {relatedProduct.images?.[0]?.url ? (
                        <OptimizedImage
                          src={relatedProduct.images[0].url}
                          alt={relatedProduct.name}
                          width={300}
                          height={300}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{relatedProduct.brand?.name || 'Dilitech'}</p>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors line-clamp-2">{relatedProduct.name}</h3>
                    </div>
                    <div className="mt-auto pt-2">
                      <p className="text-xl font-bold text-gray-900">{formatKES(relatedProduct.price)}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

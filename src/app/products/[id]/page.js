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
import apiService, { useProduct, useCart } from '@/lib/apiService'

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
      await apiService.addToCart(product.id, quantity)
      setCartStatus({ state: 'success', message: `${quantity} item${quantity > 1 ? 's' : ''} added to your cart.` })
      
      // Refresh cart to update count in header
      refreshCart()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setCartStatus({ state: 'idle', message: '' })
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
        <Card className="max-w-lg text-center space-y-4">
          <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-white">{error ? 'Error loading product' : 'Product not found'}</h3>
          <p className="text-slate-400">{error ? error : "The product you're looking for doesn't exist."}</p>
          <Link href="/products" className={buttonClasses({ size: 'md', className: 'w-full justify-center' })}>
            Browse products
          </Link>
        </Card>
      </div>
    )
  }

  const cartMessageColor =
    cartStatus.state === 'error' ? 'text-rose-300' : cartStatus.state === 'success' ? 'text-emerald-200' : 'text-slate-300'
  const wishlistMessageColor =
    wishlistStatus.state === 'error'
      ? 'text-rose-300'
      : wishlistStatus.state === 'success'
        ? 'text-emerald-200'
        : 'text-slate-300'

  return (
    <>
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-10">
        <nav className="flex flex-wrap items-center text-sm text-slate-400 gap-2" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-white">Home</Link>
            </li>
            <li>
              <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <Link href="/products" className="hover:text-white">Products</Link>
            </li>
            <li>
              <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-white font-medium">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-900">
                {product.images?.[selectedImage] ? (
                  <OptimizedImage
                    src={product.images[selectedImage].url}
                    alt={product.images[selectedImage].alt || product.name}
                    width={700}
                    height={700}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">Product image</div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {product.images?.length ? (
                  product.images.map((image, index) => (
                    <button
                      key={image.id || index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded-2xl border transition ${
                        selectedImage === index ? 'border-brand-sky' : 'border-white/10'
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
                  ))
                ) : (
                  <span className="col-span-4 text-center text-slate-500">No additional images available.</span>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{product.brand?.name}</p>
                <h1 className="text-3xl font-semibold text-white mt-2">{product.name}</h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(product.averageRating || 0) ? 'text-amber-400' : 'text-slate-600'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-slate-400">
                  {product.averageRating ? `${product.averageRating.toFixed(1)} · ` : ''}
                  {product.reviewCount || 0} review{product.reviewCount === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-3">
                <span className="text-3xl font-bold text-white">{formatKES(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-slate-500 line-through">{formatKES(product.originalPrice)}</span>
                    <span className="rounded-full bg-rose-500/20 px-3 py-1 text-sm text-rose-200">
                      Save {formatKES(product.originalPrice - product.price)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className={product.stock > 0 ? 'text-emerald-200' : 'text-rose-300'}>
                  {product.stock > 0 ? `In stock · ${product.stock} units available` : 'Currently out of stock'}
                </span>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">Quantity</p>
                  <div className="flex items-center rounded-2xl border border-white/10">
                    <button
                      onClick={quantityDecrement}
                      className="px-4 py-2 text-lg text-white hover:text-brand-sky transition disabled:opacity-30"
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 text-lg font-semibold text-white border-x border-white/10">{quantity}</span>
                    <button
                      onClick={quantityIncrement}
                      className="px-4 py-2 text-lg text-white hover:text-brand-sky transition disabled:opacity-30"
                      disabled={product.stock <= quantity}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || cartStatus.state === 'loading'}
                    className="flex-1 text-center justify-center"
                  >
                    {cartStatus.state === 'loading' ? 'Adding…' : 'Add to cart'}
                  </Button>
                  <button
                    onClick={handleAddToWishlist}
                    aria-pressed={wishlistStatus.state === 'success'}
                    className="flex items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-white hover:border-brand-sky/60 transition"
                  >
                    <svg
                      className={`w-6 h-6 ${wishlistStatus.state === 'success' ? 'text-rose-400 fill-rose-400' : 'text-white'}`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth={1.2}
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>

                {(cartStatus.state === 'success' || cartStatus.state === 'error') && (
                  <div className={`text-sm ${cartMessageColor}`}>
                    <p>{cartStatus.message}</p>
                    {cartStatus.state === 'success' && (
                      <div className="flex gap-3 mt-2">
                        <Link href="/cart" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                          View cart
                        </Link>
                        <Link href="/checkout" className={buttonClasses({ size: 'sm' })}>
                          Go to checkout
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                {(wishlistStatus.state === 'success' || wishlistStatus.state === 'error') && (
                  <p className={`text-sm ${wishlistMessageColor}`}>{wishlistStatus.message}</p>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="flex items-center text-sm text-slate-300">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Free shipping on orders over KSh 7,500
              </div>
              <div className="flex items-center text-sm text-slate-300">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                60-day returns & instant swaps
              </div>
              <div className="flex items-center text-sm text-slate-300">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Verified Stripe & M-Pesa billing
              </div>
              <div className="flex items-center text-sm text-slate-300">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Concierge onboarding optional
              </div>
            </Card>
          </div>
        </div>

        <Card className="mt-10 p-6 space-y-6">
          <div className="border-b border-white/10">
            <nav className="-mb-px flex space-x-8">
              {['description', 'features', 'specifications', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition ${
                    activeTab === tab
                      ? 'border-brand-sky text-white'
                      : 'border-transparent text-slate-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === 'description' && (
              <div className="text-slate-300 leading-relaxed space-y-4">
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === 'features' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Key Features</h3>
                {product.features?.length > 0 ? (
                  <ul className="space-y-2 text-slate-300">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No features listed for this product.</p>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Technical Specifications</h3>
                {product.specifications?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.specifications.map((spec, index) => (
                      <div key={index} className="flex justify-between py-2 border-b border-white/10 text-sm text-slate-300">
                        <span className="font-medium text-white">{spec.name}</span>
                        <span>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No specifications available for this product.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Customer Reviews</h3>
                {product.reviews?.length > 0 ? (
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="border-b border-white/5 pb-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">{review.user?.name || 'Anonymous'}</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? 'text-amber-400' : 'text-slate-500'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-medium text-white mb-2">{review.title}</h4>
                        )}
                        {review.content && (
                          <p className="text-slate-300">{review.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No reviews yet. Be the first to review this product!</p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
    </>
  )
}

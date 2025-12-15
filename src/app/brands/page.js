'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import LoadingSpinner from '@/components/LoadingSpinner'
import { OptimizedImage } from '@/components/OptimizedImage'
import Card from '@/components/ui/Card'
import { useBrands } from '@/lib/apiService'
import { useDebounce } from '@/lib/useDebounce'

export default function BrandsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const { data: brandsData, loading, error } = useBrands({ limit: 100 })

  // Extract brands array from API response (which has structure { success: true, data: [...] })
  const brands = useMemo(() => {
    if (!brandsData) return []
    // Handle both direct array and wrapped response
    if (Array.isArray(brandsData)) return brandsData
    if (brandsData.data && Array.isArray(brandsData.data)) return brandsData.data
    return []
  }, [brandsData])

  const derivedCategories = useMemo(() => {
    const collection = new Set(brands.map((brand) => brand.primaryCategory).filter(Boolean))
    return ['All', ...Array.from(collection)]
  }, [brands])

  const featuredBrands = useMemo(
    () => brands.filter((brand) => brand.featured),
    [brands],
  )

  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const primaryCategory = brand.primaryCategory || 'Uncategorized'
      const matchesCategory = selectedCategory === 'All' || primaryCategory === selectedCategory
      const normalized = debouncedSearchTerm.trim().toLowerCase()
      const matchesSearch =
        !normalized ||
        brand.name.toLowerCase().includes(normalized) ||
        (brand.description || '').toLowerCase().includes(normalized)
      return matchesCategory && matchesSearch
    })
  }, [brands, debouncedSearchTerm, selectedCategory])

  const totalProducts = useMemo(
    () => brands.reduce((sum, brand) => sum + (brand._count?.products || 0), 0),
    [brands],
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <LoadingSpinner size="lg" color="purple" text="Loading brands..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-gray-900">
        <Card className="text-center max-w-md space-y-4 bg-white border-gray-200">
          <p className="text-lg font-semibold">We couldn't load the brands catalog.</p>
          <p className="text-sm text-gray-600">Please refresh or try again later.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 rounded-3xl p-10 md:p-12 mb-12 text-white overflow-hidden">
          {/* Grid Pattern Background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
          
          {/* Glowing Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-3xl z-10">
            <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Discover Premium Brands
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Explore our curated collection of partners shaping high-end laptops, phones, and creator gear.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full border border-white/20">
                <span className="font-bold text-white">{brands.length}</span> <span className="text-blue-200">Trusted Brands</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full border border-white/20">
                <span className="font-bold text-white">{totalProducts}</span> <span className="text-blue-200">Products Available</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full border border-white/20">
                <span className="font-bold text-white">{Math.max(derivedCategories.length - 1, 0)}</span> <span className="text-blue-200">Categories</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Brands */}
        {featuredBrands.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Featured Partners</h2>
            <p className="text-gray-600 mb-8">Our most trusted brand partners</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.slug}`}
                  className="group block focus-visible:outline-none cursor-pointer"
                >
                  <Card className="text-center p-6 bg-white border-gray-200 group-hover:border-blue-900 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200 h-full">
                    <div className="w-32 h-16 bg-gray-50 rounded-xl mx-auto mb-4 flex items-center justify-center overflow-hidden border border-gray-200 group-hover:border-blue-200 transition-colors">
                      {brand.logo ? (
                        <OptimizedImage
                          src={brand.logo}
                          alt={brand.name}
                          width={128}
                          height={64}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-xs text-gray-400 font-semibold">LOGO</span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">{brand.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{brand.description}</p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                      <span className="font-semibold">{brand._count?.products ?? 0} products</span>
                      <span>•</span>
                      <span>{brand.primaryCategory || 'General'}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <Card className="p-6 mb-8 bg-white border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search brand name or story..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {derivedCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-blue-500 hover:text-blue-900'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Brand Grid */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-black text-gray-900">
                All Brands {selectedCategory !== 'All' && <span className="text-blue-900">· {selectedCategory}</span>}
              </h2>
            </div>
            <p className="text-gray-600 text-sm font-semibold">
              {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {filteredBrands.length === 0 ? (
            <Card className="text-center py-16 bg-white border-gray-200">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-900 font-bold text-lg mb-2">No brands match your filters</p>
              <p className="text-gray-600 text-sm">Try clearing the search or picking another category.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBrands.map((brand) => (
                <div
                  key={brand.id}
                  onClick={() => router.push(`/products?brand=${brand.slug}`)}
                  className="group block focus-visible:outline-none cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(`/products?brand=${brand.slug}`)
                    }
                  }}
                >
                  <Card className="p-6 bg-white border-gray-200 group-hover:border-blue-900 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-24 h-12 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 group-hover:border-blue-200 transition-colors">
                        {brand.logo ? (
                          <OptimizedImage
                            src={brand.logo}
                            alt={brand.name}
                            width={96}
                            height={48}
                            className="h-full w-full object-contain p-1.5"
                          />
                        ) : (
                          <span className="text-xs text-gray-400 font-semibold">LOGO</span>
                        )}
                      </div>
                      {brand.featured && (
                        <span className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-900 border-2 border-blue-200 font-bold">
                          Featured
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">{brand.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">{brand.description}</p>

                    <div className="flex items-center justify-between text-xs pt-4 border-t border-gray-100">
                      <span className="text-gray-700 font-semibold">{brand._count?.products ?? 0} products</span>
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-semibold">
                        {brand.primaryCategory || 'General'}
                      </span>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <Card className="p-10 text-center bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <h3 className="text-3xl font-black text-gray-900 mb-4">Partner with Dilitech Solutions</h3>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
            Showcase premium devices to an audience that obsesses over performance, craft, and elevated
            service. Let's craft the next flagship launch together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl">
              Become a Partner
            </button>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-bold hover:border-blue-900 hover:text-blue-900 transition-colors">
              Learn More
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

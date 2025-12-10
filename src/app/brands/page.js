'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import LoadingSpinner from '@/components/LoadingSpinner'
import { useBrands } from '@/lib/apiService'

export default function BrandsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
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
      const normalized = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !normalized ||
        brand.name.toLowerCase().includes(normalized) ||
        (brand.description || '').toLowerCase().includes(normalized)
      return matchesCategory && matchesSearch
    })
  }, [brands, searchTerm, selectedCategory])

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
      <div className="min-h-screen flex items-center justify-center bg-transparent text-white">
        <div className="text-center max-w-md space-y-4">
          <p className="text-lg font-semibold">We couldn’t load the brands catalog.</p>
          <p className="text-sm text-slate-300">Please refresh or try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-8 mb-12 text-white shadow-2xl shadow-blue-900/20">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Discover Premium Brands</h1>
            <p className="text-lg text-slate-200 mb-6">
              Explore our curated collection of partners shaping high-end laptops, phones, and creator
              gear.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-200">
              <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur">
                <span className="font-semibold">{brands.length}</span> Trusted Brands
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur">
                <span className="font-semibold">{totalProducts}</span> Products Available
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur">
                <span className="font-semibold">{Math.max(derivedCategories.length - 1, 0)}</span>{' '}
                Categories
              </div>
            </div>
          </div>
        </div>

        {/* Featured Brands */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Featured Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBrands.length === 0 && (
              <p className="text-slate-400 col-span-full">
                No featured brands yet—check back after the next release window.
              </p>
            )}
            {featuredBrands.map((brand) => (
              <article
                key={brand.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-blue-900/10 hover:shadow-blue-500/20 transition-shadow"
              >
                <div className="text-center">
                  <div className="w-28 h-12 bg-slate-800 rounded-lg mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="h-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400">LOGO</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{brand.name}</h3>
                  <p className="text-sm text-slate-300 mb-3 line-clamp-3">{brand.description}</p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-slate-400 mb-4">
                    <span>{brand._count?.products ?? 0} products</span>
                    <span>•</span>
                    <span>{brand.primaryCategory || 'General'}</span>
                  </div>
                  <Link
                    href={`/products?brand=${brand.slug}`}
                    className="inline-block bg-gradient-to-r from-sky-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 transition"
                  >
                    View Catalog
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {derivedCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-sky-500/10 text-sky-300 border border-sky-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Brand Grid */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              All Brands {selectedCategory !== 'All' && `· ${selectedCategory}`}
            </h2>
            <p className="text-slate-400 text-sm">
              {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {filteredBrands.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900">
              <p className="text-white font-semibold mb-2">No brands match your filters</p>
              <p className="text-slate-400 text-sm">Try clearing the search or picking another category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBrands.map((brand) => (
                <article
                  key={brand.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-sky-500/40 transition-colors flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-20 h-10 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="h-full object-contain" />
                      ) : (
                        <span className="text-xs text-slate-400">LOGO</span>
                      )}
                    </div>
                    {brand.featured && (
                      <span className="px-2 py-1 text-xs rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                        Featured
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-white mb-2">{brand.name}</h3>
                  <p className="text-sm text-slate-300 mb-4 line-clamp-3 flex-1">{brand.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span>{brand._count?.products ?? 0} products</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">
                      {brand.primaryCategory || 'General'}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/products?brand=${brand.slug}`}
                      className="flex-1 bg-gradient-to-r from-sky-500 to-blue-500 text-white py-2 rounded-lg text-sm font-medium text-center hover:opacity-90 transition"
                    >
                      View Products
                    </Link>
                    {brand.website && (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:border-sky-500/40"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Partner with Dilitech Solutions</h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Showcase premium devices to an audience that obsesses over performance, craft, and elevated
            service. Let’s craft the next flagship launch together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-sky-500 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition">
              Become a Partner
            </button>
            <button className="border border-slate-700 text-slate-200 px-8 py-3 rounded-lg hover:border-sky-500/40 transition">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

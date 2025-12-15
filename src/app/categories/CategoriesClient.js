'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import LoadingSpinner from '@/components/LoadingSpinner'
import { OptimizedImage } from '@/components/OptimizedImage'
import Card from '@/components/ui/Card'
import { useDebounce } from '@/lib/useDebounce'

const GRADIENT_FALLBACK = 'from-slate-800 via-slate-900 to-slate-950'

export default function CategoriesClient({ initialCategories }) {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)

  const categories = useMemo(() => initialCategories || [], [initialCategories])
  const featuredCategories = useMemo(() => categories.filter((category) => category.featured), [categories])

  const totalProducts = useMemo(
    () => categories.reduce((sum, category) => sum + (category._count?.products || 0), 0),
    [categories],
  )

  const filteredCategories = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase()
    return categories.filter((category) => {
      const matchesFeatured = !showFeaturedOnly || category.featured
      const matchesSearch =
        !normalizedSearch ||
        category.name.toLowerCase().includes(normalizedSearch) ||
        (category.description || '').toLowerCase().includes(normalizedSearch)
      return matchesFeatured && matchesSearch
    })
  }, [categories, debouncedSearchTerm, showFeaturedOnly])

  const topCategory = useMemo(() => {
    return categories.reduce((leader, category) => {
      const currentCount = category._count?.products || 0
      if (!leader || currentCount > (leader._count?.products || 0)) {
        return category
      }
      return leader
    }, null)
  }, [categories])

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 rounded-3xl p-10 md:p-12 mb-12 text-white overflow-hidden">
          {/* Grid Pattern Background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
          
          {/* Glowing Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 max-w-3xl space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Product Architecture</p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Shop by expertly curated categories
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Browse laptops, phones, creator gear, and smart home tech organized by real inventory
              data instead of placeholder grids.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full border border-white/20">
                <span className="font-bold text-white">{categories.length}</span> <span className="text-blue-200">categories</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full border border-white/20">
                <span className="font-bold text-white">{totalProducts}</span> <span className="text-blue-200">in-stock SKUs</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full border border-white/20">
                <span className="font-bold text-white">{featuredCategories.length}</span> <span className="text-blue-200">spotlighted</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured categories */}
        {featuredCategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Spotlight Segments</h2>
            <p className="text-gray-600 mb-8">Anchored by high-velocity demand</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group block focus-visible:outline-none cursor-pointer"
                >
                  <Card className="rounded-2xl p-6 bg-white border-2 border-gray-200 shadow-lg group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-blue-900 transition-all duration-200 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-blue-600 font-bold">Featured</div>
                      <span className="bg-blue-50 text-blue-900 border-2 border-blue-200 px-3 py-1 rounded-full text-xs font-bold">{category._count?.products ?? 0} SKUs</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-900 transition-colors">{category.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{category.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <Card className="p-6 mb-10 bg-white border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search category names or descriptions"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                />
              </div>
            </div>
            <label className="flex items-center space-x-3 text-sm text-gray-700 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(event) => setShowFeaturedOnly(event.target.checked)}
                className="w-5 h-5 rounded border-2 border-gray-300 bg-white text-blue-900 focus:ring-blue-900 focus:ring-2 cursor-pointer"
              />
              <span>Featured only</span>
            </label>
            <p className="text-gray-600 text-sm font-semibold">{filteredCategories.length} segment{filteredCategories.length !== 1 ? 's' : ''} visible</p>
          </div>
        </Card>

        {/* Category grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-gray-900">All Categories</h2>
          </div>
          {filteredCategories.length === 0 ? (
            <Card className="text-center py-16 bg-white border-gray-200">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-900 font-bold text-lg mb-2">Nothing matches your filters yet</p>
              <p className="text-gray-600 text-sm">Clear the search or toggle featured mode.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group block focus-visible:outline-none cursor-pointer"
                >
                  <Card className="bg-white border-gray-200 rounded-2xl overflow-hidden group-hover:border-blue-900 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200 h-full">
                    <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {category.image ? (
                        <OptimizedImage
                          src={category.image}
                          alt={category.name}
                          width={400}
                          height={200}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                      <span className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full font-bold">
                        {category._count?.products ?? 0} products
                      </span>
                      {category.featured && (
                        <span className="absolute top-4 right-4 bg-blue-900 text-white text-xs px-4 py-2 rounded-full border-2 border-white font-bold shadow-lg">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">{category.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-3">{category.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Insights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white border-gray-200 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2 font-bold">Momentum</p>
            <h3 className="text-gray-900 text-lg font-bold mb-1">Trending now</h3>
            <p className="text-gray-600 text-sm">
              {topCategory
                ? `${topCategory.name} leads with ${topCategory._count?.products ?? 0} active SKUs.`
                : 'Catalog is warming up.'}
            </p>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2 font-bold">Availability</p>
            <h3 className="text-gray-900 text-lg font-bold mb-1">Inventory health</h3>
            <p className="text-gray-600 text-sm">{totalProducts} devices ready to ship with live stock data.</p>
          </Card>
          <Card className="bg-white border-gray-200 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2 font-bold">Updates</p>
            <h3 className="text-gray-900 text-lg font-bold mb-1">Fresh arrivals</h3>
            <p className="text-gray-600 text-sm">We seed new laptops, phones, and creator gear every sprint.</p>
          </Card>
        </section>

        {/* Newsletter */}
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 rounded-3xl p-10 text-center">
          <h3 className="text-3xl font-black text-gray-900 mb-3">Stay in sync with new drops</h3>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
            Get a curated digest when we add new premium hardware categories, bundles, or launch-week perks.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              type="email"
              required
              placeholder="you@studio.com"
              className="flex-1 px-5 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
            />
            <button
              type="submit"
              className="px-8 py-4 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Notify me
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}

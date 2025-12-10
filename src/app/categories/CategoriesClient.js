'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import LoadingSpinner from '@/components/LoadingSpinner'

const GRADIENT_FALLBACK = 'from-slate-800 via-slate-900 to-slate-950'

export default function CategoriesClient({ initialCategories }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)

  const categories = useMemo(() => initialCategories || [], [initialCategories])
  const featuredCategories = useMemo(() => categories.filter((category) => category.featured), [categories])

  const totalProducts = useMemo(
    () => categories.reduce((sum, category) => sum + (category._count?.products || 0), 0),
    [categories],
  )

  const filteredCategories = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return categories.filter((category) => {
      const matchesFeatured = !showFeaturedOnly || category.featured
      const matchesSearch =
        !normalizedSearch ||
        category.name.toLowerCase().includes(normalizedSearch) ||
        (category.description || '').toLowerCase().includes(normalizedSearch)
      return matchesFeatured && matchesSearch
    })
  }, [categories, searchTerm, showFeaturedOnly])

  const topCategory = useMemo(() => {
    return categories.reduce((leader, category) => {
      const currentCount = category._count?.products || 0
      if (!leader || currentCount > (leader._count?.products || 0)) {
        return category
      }
      return leader
    }, null)
  }, [categories])

  const heroAccent = totalProducts > 0 ? 'to-blue-600 from-slate-900' : 'to-slate-900 from-slate-900'

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <section className={`bg-gradient-to-r ${heroAccent} border border-slate-800 rounded-3xl p-10 mb-12 text-white relative overflow-hidden shadow-2xl shadow-blue-900/30`}>
          <div className="relative z-10 max-w-3xl space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-200/80">Product Architecture</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Shop by expertly curated categories</h1>
            <p className="text-lg text-slate-200">
              Browse laptops, phones, creator gear, and smart home tech organized by real inventory
              data instead of placeholder grids.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-200">
              <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur">{categories.length} categories</div>
              <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur">{totalProducts} in-stock SKUs</div>
              <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur">{featuredCategories.length} spotlighted</div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-900/20 to-slate-900/60" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full" />
        </section>

        {/* Featured categories */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Spotlight segments</h2>
            <p className="text-slate-400 text-sm">Anchored by high-velocity demand</p>
          </div>
          {featuredCategories.length === 0 ? (
            <p className="text-slate-500">No featured categories yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCategories.map((category) => (
                <article
                  key={category.id}
                  className={`rounded-2xl p-6 text-white border border-white/10 bg-gradient-to-br ${category.accentColor || GRADIENT_FALLBACK} shadow-lg shadow-blue-900/20`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/70">Featured</div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs">{category._count?.products ?? 0} SKUs</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-white/80 line-clamp-3">{category.description}</p>
                  <div className="mt-6">
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="inline-flex items-center text-sm font-medium text-white/90 hover:text-white"
                    >
                      View collection
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Filters */}
        <section className="glass-panel border border-white/10 rounded-2xl p-6 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search category names or descriptions"
                  className="w-full pl-10 pr-4 py-3 bg-[color:var(--surface-tertiary)] border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-sky/50"
                />
              </div>
            </div>
            <label className="flex items-center space-x-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(event) => setShowFeaturedOnly(event.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
              />
              <span>Featured only</span>
            </label>
            <p className="text-slate-400 text-sm">{filteredCategories.length} segment{filteredCategories.length !== 1 ? 's' : ''} visible</p>
          </div>
        </section>

        {/* Category grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">All categories</h2>
          </div>
          {filteredCategories.length === 0 ? (
            <div className="border border-dashed border-slate-800 bg-slate-900/50 rounded-2xl p-12 text-center text-slate-400">
              Nothing matches your filters yet. Clear the search or toggle featured mode.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCategories.map((category) => (
                <article
                  key={category.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-sky-500/40 transition"
                >
                  <div className="relative h-48 bg-slate-800 flex items-center justify-center">
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-slate-500">Category visual</span>
                    )}
                    <span className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                      {category._count?.products ?? 0} products
                    </span>
                    {category.featured && (
                      <span className="absolute top-4 right-4 bg-sky-500/20 text-sky-200 text-xs px-3 py-1 rounded-full border border-sky-500/40">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{category.name}</h3>
                      <p className="text-sm text-slate-300 line-clamp-3">{category.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/products?category=${category.slug}`}
                        className="text-sm text-sky-300 hover:text-sky-200 font-medium"
                      >
                        Explore products
                      </Link>
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Insights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Momentum</p>
            <h3 className="text-white text-lg font-semibold mb-1">Trending now</h3>
            <p className="text-slate-300 text-sm">
              {topCategory
                ? `${topCategory.name} leads with ${topCategory._count?.products ?? 0} active SKUs.`
                : 'Catalog is warming up.'}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Availability</p>
            <h3 className="text-white text-lg font-semibold mb-1">Inventory health</h3>
            <p className="text-slate-300 text-sm">{totalProducts} devices ready to ship with live stock data.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Updates</p>
            <h3 className="text-white text-lg font-semibold mb-1">Fresh arrivals</h3>
            <p className="text-slate-300 text-sm">We seed new laptops, phones, and creator gear every sprint.</p>
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-gradient-to-r from-slate-900 to-blue-900 border border-slate-800 rounded-3xl p-10 text-center">
          <h3 className="text-2xl font-semibold text-white mb-3">Stay in sync with new drops</h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Get a curated digest when we add new premium hardware categories, bundles, or launch-week perks.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              type="email"
              required
              placeholder="you@studio.com"
              className="flex-1 px-4 py-3 rounded-2xl bg-[color:var(--surface-tertiary)] border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold hover:opacity-90 transition"
            >
              Notify me
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

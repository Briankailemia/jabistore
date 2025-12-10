'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import apiService, { useBrands, useCategories } from '@/lib/apiService'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatKES } from '@/lib/currency'

const heroSuggestions = {
  trending: ['AeroBook X15', 'Lumina One Pro', 'Creator monitor', 'GaN dock'],
  categories: ['Laptops & Ultrabooks', 'Audio & Entertainment', 'Creator gear'],
  brands: ['AeroBook Labs', 'Lumina Mobile', 'PulseGear Audio'],
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('products')
  const [sortBy, setSortBy] = useState('relevance')
  const [results, setResults] = useState({ products: [], categories: [], brands: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)

  const { data: categoriesData } = useCategories()
  const { data: brandsData } = useBrands()

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery)
      performSearch(urlQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const performSearch = async (term) => {
    if (!term.trim()) return
    try {
      setIsSearching(true)
      setError(null)
      const response = await apiService.search(term.trim(), { limit: 24 })
      const products = response?.products || response?.data?.products || []
      const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || [])
      const brands = Array.isArray(brandsData) ? brandsData : (brandsData?.data || [])
      
      const normalizedCategories = categories.filter((category) => {
        const q = term.toLowerCase()
        return (
          category.name.toLowerCase().includes(q) ||
          (category.description || '').toLowerCase().includes(q)
        )
      })
      const normalizedBrands = brands.filter((brand) => {
        const q = term.toLowerCase()
        return (
          brand.name.toLowerCase().includes(q) ||
          (brand.description || '').toLowerCase().includes(q)
        )
      })

      setResults({ products, categories: normalizedCategories, brands: normalizedBrands })
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `/search?q=${encodeURIComponent(term.trim())}`)
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Something went wrong while searching. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (query.trim()) {
      performSearch(query.trim())
    }
  }

  const sortedProducts = useMemo(() => {
    const list = [...results.products]
    switch (sortBy) {
      case 'price-low':
        return list.sort((a, b) => a.price - b.price)
      case 'price-high':
        return list.sort((a, b) => b.price - a.price)
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return list
    }
  }, [results.products, sortBy])

  const totalResults = results.products.length + results.categories.length + results.brands.length

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="space-y-6">
          <form onSubmit={handleSubmit} className="relative">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search laptops, phones, creator gear..."
              className="w-full bg-slate-900 border border-slate-800 rounded-3xl py-4 pl-12 pr-36 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-2 rounded-2xl font-semibold hover:opacity-90"
            >
              Search
            </button>
          </form>
          {!query && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
              <SuggestionColumn title="Trending" values={heroSuggestions.trending} onSelect={setQuery} />
              <SuggestionColumn title="Categories" values={heroSuggestions.categories} onSelect={setQuery} />
              <SuggestionColumn title="Brands" values={heroSuggestions.brands} onSelect={setQuery} />
            </div>
          )}
        </header>

        {isSearching && (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" color="blue" text="Searching the catalog" />
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 text-rose-200">{error}</div>
        )}

        {!isSearching && query && totalResults === 0 && !error && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <p className="text-xl font-semibold">No matches for “{query}”.</p>
            <p className="text-slate-400">Try another keyword or explore the curated categories below.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold">
                Browse all products
              </Link>
              <Link href="/categories" className="px-6 py-3 rounded-2xl border border-slate-700 text-white hover:bg-slate-900">
                Explore categories
              </Link>
            </div>
          </div>
        )}

        {!isSearching && totalResults > 0 && (
          <section className="space-y-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Results</p>
                <h2 className="text-3xl font-semibold mt-1">“{query}”</h2>
                <p className="text-slate-400">{totalResults} match{totalResults !== 1 ? 'es' : ''}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {['products', 'categories', 'brands'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full border ${
                      activeTab === tab ? 'border-sky-500 text-white bg-sky-500/10' : 'border-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              {results.products.length > 0 && activeTab === 'products' && (
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-sm text-white"
                >
                  <option value="relevance">Relevance</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              )}
            </header>

            {(activeTab === 'products' || activeTab === 'products') && results.products.length > 0 && (
              <ProductsGrid products={sortedProducts} />
            )}

            {activeTab === 'categories' && results.categories.length > 0 && (
              <CategoryGrid categories={results.categories} />
            )}

            {activeTab === 'brands' && results.brands.length > 0 && (
              <BrandGrid brands={results.brands} />
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function ProductsGrid({ products }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.slug || product.id}`} className="group block focus-visible:outline-none">
          <article className="bg-[color:var(--surface-secondary)] border border-white/10 rounded-3xl overflow-hidden transition hover:border-brand-sky/40">
            <div className="h-48 bg-slate-800 flex items-center justify-center overflow-hidden">
              {product.images?.[0]?.url ? (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="text-slate-500">Image coming soon</span>
              )}
            </div>
            <div className="p-5 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {product.brand?.name || 'Dilitech'} · {product.category?.name || 'Catalog'}
              </p>
              <h3 className="text-lg font-semibold line-clamp-2 text-white group-hover:text-brand-sky">{product.name}</h3>
              <p className="text-sm text-slate-400 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xl font-semibold text-sky-200">{formatKES(product.price)}</p>
                {product.averageRating > 0 && (
                  <p className="text-xs text-slate-400">★ {product.averageRating.toFixed(1)}</p>
                )}
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  )
}

function CategoryGrid({ categories }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {categories.map((category) => (
        <Link key={category.id} href={`/products?category=${category.slug}`}>
          <article className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-sky-500/40 transition">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Category</p>
            <h3 className="text-xl font-semibold mt-2">{category.name}</h3>
            <p className="text-slate-400 text-sm mt-2 line-clamp-2">{category.description}</p>
            <p className="text-xs text-slate-500 mt-4">{category._count?.products || 0} products</p>
          </article>
        </Link>
      ))}
    </div>
  )
}

function BrandGrid({ brands }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {brands.map((brand) => (
        <Link key={brand.id} href={`/products?brand=${brand.slug}`}>
          <article className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-sky-500/40 transition">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Brand</p>
            <h3 className="text-xl font-semibold mt-2">{brand.name}</h3>
            <p className="text-slate-400 text-sm mt-2 line-clamp-3">{brand.description}</p>
            <p className="text-xs text-slate-500 mt-4">{brand._count?.products || 0} products</p>
          </article>
        </Link>
      ))}
    </div>
  )
}

function SuggestionColumn({ title, values, onSelect }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className="px-3 py-1 rounded-full border border-slate-700 text-slate-300 hover:border-sky-500/40 hover:text-white text-xs"
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}

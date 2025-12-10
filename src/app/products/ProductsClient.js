"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import Button, { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ProductListSkeleton } from "@/components/SkeletonLoader";
import { OptimizedImage } from "@/components/OptimizedImage";
import { cn } from "@/lib/cn";
import { formatKES } from "@/lib/currency";
import apiService from "@/lib/apiService";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
  { value: "name", label: "Name A → Z" },
  { value: "newest", label: "Newest first" },
  { value: "rating", label: "Highest rated" },
];

export default function ProductsClient({ initialProducts, initialCategories, initialBrands }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(false);

  const categories = ["All", ...(initialCategories?.map((c) => c.name) || [])];
  const brands = ["All", ...(initialBrands?.map((b) => b.name) || [])];

  const activeFiltersCount = [
    selectedCategory !== "All",
    selectedBrand !== "All",
    priceRange.min,
    priceRange.max,
    minRating > 0,
    Boolean(searchTerm),
  ].filter(Boolean).length;

  useEffect(() => {
    const fetchProducts = async () => {
      const apiFilters = {};

      if (selectedCategory !== "All") {
        const category = initialCategories?.find((c) => c.name === selectedCategory);
        if (category?.slug) apiFilters.category = category.slug;
      }

      if (selectedBrand !== "All") {
        const brand = initialBrands?.find((b) => b.name === selectedBrand);
        if (brand?.slug) apiFilters.brand = brand.slug;
      }

      if (searchTerm.trim()) {
        apiFilters.search = searchTerm.trim();
      }

      if (priceRange.min) {
        apiFilters.minPrice = priceRange.min;
      }

      if (priceRange.max) {
        apiFilters.maxPrice = priceRange.max;
      }

      if (minRating > 0) {
        apiFilters.minRating = minRating;
      }

      if (sortBy === "price-low") {
        apiFilters.sortBy = "price";
        apiFilters.sortOrder = "asc";
      } else if (sortBy === "price-high") {
        apiFilters.sortBy = "price";
        apiFilters.sortOrder = "desc";
      } else if (sortBy === "name") {
        apiFilters.sortBy = "name";
        apiFilters.sortOrder = "asc";
      } else if (sortBy === "newest") {
        apiFilters.sortBy = "createdAt";
        apiFilters.sortOrder = "desc";
      } else {
        apiFilters.sortBy = "createdAt";
        apiFilters.sortOrder = "desc";
      }

      setLoading(true);
      try {
        const result = await apiService.getProducts(apiFilters);
        setProducts(result?.products || []);
      } catch (error) {
        // Error will be handled by error boundary
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to load products", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    selectedCategory,
    selectedBrand,
    searchTerm,
    sortBy,
    priceRange.min,
    priceRange.max,
    minRating,
    initialCategories,
    initialBrands,
  ]);

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    if (sortBy !== "rating") return products;
    return [...products].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  }, [products, sortBy]);

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedBrand("All");
    setPriceRange({ min: "", max: "" });
    setMinRating(0);
    setSearchTerm("");
    setSortBy("featured");
  };

  const isLoading = loading;

  return (
    <div className="space-y-10 pb-12">
      <section className="rounded-[32px] border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-12">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Catalog</p>
          <h1 className="text-3xl font-semibold text-white sm:text-5xl">Smart technology marketplace</h1>
          <p className="text-base text-slate-300">
            Filter laptops, phones, creator rigs, and smart home gear by brand, category, and budget. All items ship with
            Dilitech concierge support.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="rounded-full border border-slate-700 px-3 py-1">Live inventory</span>
            <span className="rounded-full border border-slate-700 px-3 py-1">Stripe & M-Pesa ready</span>
            <span className="rounded-full border border-slate-700 px-3 py-1">Warranty verified</span>
          </div>
        </div>
      </section>

      <section className="px-4">
        <Card className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/60 focus:outline-none"
              />
              <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={buttonClasses({ variant: "secondary", size: "sm", className: "justify-center" })}
              >
                Filters {activeFiltersCount > 0 && <span className="ml-2 rounded-full bg-sky-500/20 px-2 py-0.5 text-xs">{activeFiltersCount}</span>}
              </button>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-sky-500/60 focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FilterBlock label="Category">
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-sky-500/60 focus:outline-none"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </FilterBlock>

              <FilterBlock label="Brand">
                <select
                  value={selectedBrand}
                  onChange={(event) => setSelectedBrand(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-sky-500/60 focus:outline-none"
                >
                  {brands.map((brand) => (
                    <option key={brand}>{brand}</option>
                  ))}
                </select>
              </FilterBlock>

              <FilterBlock label="Price range">
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(event) => setPriceRange((prev) => ({ ...prev, min: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/60 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(event) => setPriceRange((eventPrev) => ({ ...eventPrev, max: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/60 focus:outline-none"
                  />
                </div>
              </FilterBlock>

              <FilterBlock label="Minimum rating">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating((current) => (current === rating ? 0 : rating))}
                      className={cn(
                        "rounded-xl border border-slate-700 p-2 text-slate-500 transition-colors",
                        rating <= minRating && "border-amber-400 text-amber-400",
                      )}
                      type="button"
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-slate-400">{minRating > 0 ? `${minRating}+ stars` : "Any rating"}</span>
                </div>
              </FilterBlock>
            </div>
          )}

          {activeFiltersCount > 0 && (
            <div className="flex justify-end">
              <button onClick={clearFilters} className="text-xs uppercase tracking-[0.3em] text-slate-400 hover:text-white">
                Clear filters
              </button>
            </div>
          )}
        </Card>
      </section>

      <section className="px-4">
        <div className="flex flex-col gap-3 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>{isLoading ? "Loading products…" : `${sortedProducts.length} result${sortedProducts.length !== 1 ? "s" : ""}`}</p>
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : sortedProducts.length === 0 ? (
          <Card className="mt-12 text-center text-slate-400">No products match your filters yet.</Card>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sortedProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.slug || product.id}`} className="group block focus-visible:outline-none">
                <Card className="flex flex-col gap-4 border-white/10 transition group-hover:border-brand-sky/40">
                  <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-slate-900">
                    <OptimizedImage
                      src={product.images?.[0]?.url || "/placeholder-product.jpg"}
                      alt={product.name}
                      width={400}
                      height={320}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {product.featured && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{product.brand?.name || "Dilitech"}</p>
                    <p className="text-xl font-semibold text-white group-hover:text-brand-sky">{product.name}</p>
                    <p className="text-sm text-slate-400 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-2xl font-semibold text-white">{formatKES(product.price)}</p>
                      <p className="text-xs text-slate-500">{product.category?.name || "Uncategorized"}</p>
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-brand-sky">Open →</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Stock: {product.stock > 0 ? `${product.stock} units` : "Out of stock"}</span>
                    <span>★ {product.averageRating?.toFixed(1) || "0.0"}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterBlock({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}

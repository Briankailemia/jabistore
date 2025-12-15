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
import { useDebounce } from "@/lib/useDebounce";
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
  
  // Debug: Log initial products
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Initial products count:', initialProducts?.length || 0);
      console.log('Initial products:', initialProducts);
    }
  }, [initialProducts]);

  // Debounce search term and price range to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedMinPrice = useDebounce(priceRange.min, 500);
  const debouncedMaxPrice = useDebounce(priceRange.max, 500);

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
      // Check if we have any filters applied - if not and we have initial products, use them
      const hasFilters = selectedCategory !== "All" || 
                        selectedBrand !== "All" || 
                        debouncedSearchTerm.trim() || 
                        debouncedMinPrice || 
                        debouncedMaxPrice || 
                        minRating > 0 ||
                        sortBy !== "featured";

      // If no filters and we have initial products, use them without API call
      if (!hasFilters && initialProducts?.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Using initial products (no filters):', initialProducts.length);
        }
        setProducts(initialProducts);
        return;
      }

      const apiFilters = {};

      if (selectedCategory !== "All") {
        const category = initialCategories?.find((c) => c.name === selectedCategory);
        if (category?.slug) apiFilters.category = category.slug;
      }

      if (selectedBrand !== "All") {
        const brand = initialBrands?.find((b) => b.name === selectedBrand);
        if (brand?.slug) apiFilters.brand = brand.slug;
      }

      if (debouncedSearchTerm.trim()) {
        apiFilters.search = debouncedSearchTerm.trim();
      }

      if (debouncedMinPrice) {
        apiFilters.minPrice = debouncedMinPrice;
      }

      if (debouncedMaxPrice) {
        apiFilters.maxPrice = debouncedMaxPrice;
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
        // API returns: { success: true, data: { products: [...], pagination: {...} } }
        const productsList = result?.data?.products || result?.products || [];
        
        if (process.env.NODE_ENV === 'development') {
          console.log('API result:', result);
          console.log('Products extracted:', productsList.length);
        }
        
        setProducts(productsList);
      } catch (error) {
        // Error will be handled by error boundary
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to load products", error);
        }
        // On error, keep initial products
        setProducts(initialProducts || []);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    selectedCategory,
    selectedBrand,
    debouncedSearchTerm,
    sortBy,
    debouncedMinPrice,
    debouncedMaxPrice,
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
      <section className="relative overflow-hidden rounded-3xl border border-blue-900/20 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-6 py-12 shadow-2xl">
        {/* Futuristic grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        {/* Glowing orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-10 left-10 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 font-semibold">Catalog</p>
          <h1 className="text-3xl font-black text-white sm:text-5xl leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
              Smart technology marketplace
            </span>
          </h1>
          <p className="text-base text-blue-100 leading-relaxed">
            Filter laptops, phones, creator rigs, and smart home gear by brand, category, and budget. All items ship with
            Dilitech concierge support.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm px-4 py-1.5 text-cyan-300 font-medium">Live inventory</span>
            <span className="rounded-full border border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm px-4 py-1.5 text-cyan-300 font-medium">Stripe & M-Pesa ready</span>
            <span className="rounded-full border border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm px-4 py-1.5 text-cyan-300 font-medium">Warranty verified</span>
          </div>
        </div>
      </section>

      <section className="px-4">
        <Card className="space-y-6 bg-white border-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition-all"
              />
              <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={buttonClasses({ variant: "secondary", size: "sm", className: "justify-center" })}
              >
                Filters {activeFiltersCount > 0 && <span className="ml-2 rounded-full bg-blue-900 text-white px-2 py-0.5 text-xs font-semibold">{activeFiltersCount}</span>}
              </button>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition-all"
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition-all"
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition-all"
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(event) => setPriceRange((eventPrev) => ({ ...eventPrev, max: event.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition-all"
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
                        "rounded-xl border border-gray-300 bg-white p-2 text-gray-400 transition-colors hover:border-blue-900 hover:text-blue-900",
                        rating <= minRating && "border-amber-500 bg-amber-50 text-amber-600",
                      )}
                      type="button"
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-gray-600">{minRating > 0 ? `${minRating}+ stars` : "Any rating"}</span>
                </div>
              </FilterBlock>
            </div>
          )}

          {activeFiltersCount > 0 && (
            <div className="flex justify-end">
              <button onClick={clearFilters} className="text-xs uppercase tracking-[0.3em] text-gray-600 hover:text-blue-900 transition-colors font-semibold">
                Clear filters
              </button>
            </div>
          )}
        </Card>
      </section>

      <section className="px-4">
        <div className="flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p className="font-medium">{isLoading ? "Loading products…" : `${sortedProducts.length} result${sortedProducts.length !== 1 ? "s" : ""}`}</p>
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : sortedProducts.length === 0 ? (
          <Card className="mt-12 text-center text-gray-500 py-12">No products match your filters yet.</Card>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sortedProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.slug || product.id}`} className="group block focus-visible:outline-none cursor-pointer">
                <Card className="flex flex-col gap-4 border-gray-200 group-hover:border-blue-900 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200 h-full">
                  <div className="relative h-52 w-full overflow-hidden rounded-xl bg-gray-100">
                    <OptimizedImage
                      src={product.images?.[0]?.url || "/placeholder-product.jpg"}
                      alt={product.name}
                      width={400}
                      height={320}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {product.featured && (
                      <span className="absolute left-3 top-3 rounded-full bg-blue-900 px-3 py-1 text-xs font-semibold text-white shadow-md">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{product.brand?.name || "Dilitech"}</p>
                    <p className="text-xl font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">{product.name}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="mt-auto pt-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatKES(product.price)}</p>
                      <p className="text-xs text-gray-500 mt-1">{product.category?.name || "Uncategorized"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                    <span className="text-gray-600">Stock: <span className={product.stock > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{product.stock > 0 ? `${product.stock} units` : "Out of stock"}</span></span>
                    <span className="text-gray-600">★ <span className="font-semibold text-gray-900">{product.averageRating?.toFixed(1) || "0.0"}</span></span>
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
      <p className="text-xs uppercase tracking-[0.3em] text-gray-600 font-semibold">{label}</p>
      {children}
    </div>
  );
}

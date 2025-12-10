'use client'

/**
 * Skeleton loading components for better perceived performance
 */

export function ProductCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 animate-pulse">
      <div className="aspect-square bg-slate-800 rounded-2xl mb-4" />
      <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-800 rounded w-1/2 mb-4" />
      <div className="h-6 bg-slate-800 rounded w-1/3" />
    </div>
  )
}

export function ProductListSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-slate-800 rounded w-32" />
        <div className="h-4 bg-slate-800 rounded w-24" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-4 bg-slate-800 rounded w-1/2" />
      </div>
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="h-6 bg-slate-800 rounded w-24" />
      </div>
    </div>
  )
}

export function OrderListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border animate-pulse">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-48" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-10 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-64" />
        
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
          <div className="space-y-4">
            <div className="aspect-square bg-slate-800 rounded-3xl" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-slate-800 rounded-2xl" />
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="h-4 bg-slate-800 rounded w-32" />
              <div className="h-8 bg-slate-800 rounded w-3/4" />
              <div className="h-6 bg-slate-800 rounded w-24" />
              <div className="h-10 bg-slate-800 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-transparent animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-8 bg-slate-800 rounded w-48 mb-8" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div className="h-6 bg-slate-800 rounded w-32 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="h-6 bg-slate-800 rounded w-40 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-slate-800 rounded w-24" />
                  <div className="h-4 bg-slate-800 rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


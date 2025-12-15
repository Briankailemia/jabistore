import Link from 'next/link'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import { OptimizedImage } from '@/components/OptimizedImage'
import { formatKES } from '@/lib/currency'
import { prisma } from '@/lib/prisma'
import { generateWebsiteStructuredData, generateOrganizationStructuredData } from '@/lib/seo'

export const metadata = {
  title: 'Dilitech Solutions — Premium Electronics & Smart Technology',
  description: 'Discover cutting-edge electronics and smart solutions at Dilitech Solutions. Premium quality, innovative technology, and exceptional service.',
  openGraph: {
    title: 'Dilitech Solutions — Premium Electronics & Smart Technology',
    description: 'Discover cutting-edge electronics and smart solutions. Premium quality, innovative technology, and exceptional service.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dilitech Solutions',
    description: 'Premium Electronics & Smart Technology',
  },
}

const stats = [
  { label: 'Happy customers', value: '10k+' },
  { label: 'In-stock SKUs', value: '480+' },
  { label: 'Global partners', value: '24' },
  { label: 'Support uptime', value: '24/7' },
]

export default async function Home() {
  const [featuredProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { published: true, featured: true },
      include: {
        brand: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.category.findMany({
      where: { featured: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
      take: 6,
    }),
  ])

  const websiteStructuredData = generateWebsiteStructuredData()
  const organizationStructuredData = generateOrganizationStructuredData()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />
      <div className="space-y-20 pb-20">
      <section className="relative overflow-hidden rounded-3xl border border-blue-900/20 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-6 py-20 sm:px-10 shadow-2xl">
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
          <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-blue-500/30 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 left-10 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-3xl border-2 border-blue-500/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center space-y-8">
          <BadgeRow />
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-7xl leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
              Hardware for teams
            </span>
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
              who build the future
            </span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Shop laptops, phones, creator displays, and smart home gear curated for ambitious makers.
            Every product ships calibrated, secure, and support-ready.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
            <Link
              href="/products"
              className="group inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/50 transition-all hover:from-blue-500 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900 w-full sm:w-auto"
            >
              <span>Explore products</span>
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center justify-center rounded-xl border-2 border-blue-400/50 bg-blue-900/30 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:border-blue-300 hover:bg-blue-800/40 hover:shadow-xl hover:scale-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900 w-full sm:w-auto"
            >
              Browse categories
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 pt-12 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <p className="text-4xl font-black text-transparent bg-gradient-to-r from-white to-blue-200 bg-clip-text sm:text-5xl">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-blue-300 mt-2 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4">
        <SectionHeader
          eyebrow="Featured"
          title="Flagship drops"
          description="Limited batches of the most requested creator machines and smart living essentials."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.length ? (
            featuredProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug || product.id}`} className="group block focus-visible:outline-none cursor-pointer">
                    <Card className="flex flex-col gap-4 transition-all duration-200 border-gray-200 group-hover:border-blue-900 group-hover:shadow-xl group-hover:-translate-y-1 h-full">
                      <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gray-100">
                        {product.images?.[0]?.url ? (
                          <OptimizedImage
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            width={400}
                            height={320}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">Preview coming soon</div>
                        )}
                        {product.featured && (
                          <span className="absolute left-3 top-3 rounded-full bg-blue-900 px-3 py-1 text-xs font-semibold text-white shadow-md">
                            Launch ready
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm uppercase tracking-[0.3em] text-gray-500">{product.brand?.name || 'Dilitech'}</p>
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">{product.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                      </div>
                      <div className="mt-auto">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{formatKES(product.price)}</p>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <p className="text-xs text-gray-400 line-through">{formatKES(product.originalPrice)}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="col-span-full text-center text-gray-500 py-12">No featured products yet.</Card>
              )}
        </div>
      </section>

      <section className="px-4">
        <SectionHeader
          eyebrow="Navigate"
          title="Shop by category"
          description="Guided collections for mobile storytellers, builders, and smart home architects."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(categories || []).map((category) => (
              <Link key={category.id} href={`/products?category=${category.slug}`} className="group block focus-visible:outline-none cursor-pointer">
                <Card className="flex flex-col gap-4 border-gray-200 group-hover:border-blue-900 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200 h-full">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl border border-gray-200 bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6 text-blue-600 group-hover:text-blue-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">{category.name}</h3>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                        {category._count?.products || 0} SKUs
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{category.description}</p>
                  <div className="pt-2 text-sm">
                    <span className="text-gray-500">Featured • {category.featured ? 'Yes' : 'No'}</span>
                  </div>
                </Card>
              </Link>
            ))}
        </div>
      </section>
    </div>
    </>
  )
}

function BadgeRow() {
  return (
    <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm px-5 py-2.5 text-xs uppercase tracking-[0.3em] text-cyan-300 font-bold shadow-lg shadow-cyan-500/20">
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" /> Launch window open
    </div>
  )
}

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
      <section className="relative overflow-hidden rounded-[36px] border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-16 sm:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-60 w-60 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl text-center space-y-6">
          <BadgeRow />
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Hardware for teams <br className="hidden sm:block" /> who build the future
          </h1>
          <p className="text-lg text-slate-300">
            Shop laptops, phones, creator displays, and smart home gear curated for ambitious makers.
            Every product ships calibrated, secure, and support-ready.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 w-full sm:w-auto"
            >
              Explore products
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-transparent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 w-full sm:w-auto"
            >
              Browse categories
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-10 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-left">
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
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
                  <Link key={product.id} href={`/products/${product.slug || product.id}`} className="group block focus-visible:outline-none">
                    <Card className="flex flex-col gap-4 transition border-white/10 group-hover:border-brand-sky/40 group-hover:bg-[color:var(--surface-tertiary)]/80">
                      <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-slate-900/60">
                        {product.images?.[0]?.url ? (
                          <OptimizedImage
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            width={400}
                            height={320}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-500">Preview coming soon</div>
                        )}
                        {product.featured && (
                          <span className="absolute left-3 top-3 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            Launch ready
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{product.brand?.name || 'Dilitech'}</p>
                        <h3 className="text-xl font-semibold text-white group-hover:text-brand-sky">{product.name}</h3>
                        <p className="text-sm text-slate-400 line-clamp-2">{product.description}</p>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-semibold text-white">{formatKES(product.price)}</p>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <p className="text-xs text-slate-500 line-through">{formatKES(product.originalPrice)}</p>
                          )}
                        </div>
                        <span className="text-sm text-slate-400 group-hover:text-brand-sky">Open →</span>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="col-span-full text-center text-slate-400">No featured products yet.</Card>
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
              <Card key={category.id} className="flex flex-col gap-4 border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl border border-slate-700 bg-slate-900/60" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {category._count?.products || 0} SKUs
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 line-clamp-3">{category.description}</p>
                <div className="flex items-center justify-between pt-2 text-sm text-slate-300">
                  <span>Featured • {category.featured ? 'Yes' : 'No'}</span>
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="text-sky-400 hover:text-sky-200"
                  >
                    Browse →
                  </Link>
                </div>
              </Card>
            ))}
        </div>
      </section>

      <section className="px-4">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="space-y-4 bg-gradient-to-br from-slate-900 to-slate-950">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Creator services</p>
            <h3 className="text-2xl font-semibold text-white">Onboarding built for teams</h3>
            <p className="text-sm text-slate-300">
              Concierge delivery, calibration, and enterprise M-Pesa or Stripe billing handled in one flow. Add upgrade
              protection, on-site training, and inventory alerts to keep launches smooth.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-slate-700 px-3 py-1">24h deploy</span>
              <span className="rounded-full border border-slate-700 px-3 py-1">Asset tagging</span>
              <span className="rounded-full border border-slate-700 px-3 py-1">Priority RMA</span>
            </div>
            <div className="pt-2">
              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Meet the concierge team
              </Link>
            </div>
          </Card>

          <Card className="space-y-4 bg-slate-900/80">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Payments</p>
            <h3 className="text-2xl font-semibold text-white">Stripe & M-Pesa ready</h3>
            <p className="text-sm text-slate-300">
              Split intent checkout, auto-generated invoices, and instant M-Pesa notifications wired into your dashboard.
              Configure webhooks once; we handle retries, reconciliation, and alerts.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <p>• SCA compliant Stripe flows with stored mandates</p>
              <p>• Real-time M-Pesa callbacks and receipt vaulting</p>
              <p>• Role-aware order approvals</p>
            </div>
            <div className="pt-2">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Configure checkout
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
    </>
  )
}

function BadgeRow() {
  return (
    <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white">
      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Launch window open
    </div>
  )
}

import { prisma } from '@/lib/prisma'

export default async function sitemap() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://dilitechsolutions.com'

  // Get all published products
  const products = await prisma.product.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  })

  // Get all categories
  const categories = await prisma.category.findMany({
    select: { slug: true, updatedAt: true },
  })

  // Get all brands
  const brands = await prisma.brand.findMany({
    select: { slug: true, updatedAt: true },
  })

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/brands`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Product pages
  const productPages = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug || product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Category pages
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Brand pages
  const brandPages = brands.map((brand) => ({
    url: `${baseUrl}/brands/${brand.slug}`,
    lastModified: brand.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...categoryPages, ...brandPages]
}


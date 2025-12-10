import { prisma } from '@/lib/prisma'
import ProductsClient from './ProductsClient'

export const metadata = {
  title: 'Products | Dilitech Solutions',
  description: 'Browse our collection of premium electronics, laptops, phones, and smart technology. Quality products with exceptional service.',
  openGraph: {
    title: 'Products | Dilitech Solutions',
    description: 'Browse our collection of premium electronics and smart technology.',
    type: 'website',
  },
}

export default async function ProductsPage() {
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: { published: true },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  const productsWithRatings = products.map((product) => ({
    ...product,
    averageRating:
      product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0,
  }))

  return (
    <ProductsClient
      initialProducts={productsWithRatings}
      initialCategories={categories}
      initialBrands={brands}
    />
  )
}


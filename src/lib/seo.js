/**
 * SEO utilities for generating meta tags and structured data
 */

/**
 * Generate product meta tags
 */
export function generateProductMeta(product) {
  const title = `${product.name} | Dilitech Solutions`
  const description = product.description 
    ? product.description.substring(0, 160)
    : `Buy ${product.name} at Dilitech Solutions. Premium quality electronics and smart technology.`
  
  const image = product.images?.[0]?.url || '/placeholder-product.jpg'
  const price = product.price
  const currency = 'KES'
  const availability = product.stock > 0 ? 'in stock' : 'out of stock'
  const brand = product.brand?.name || 'Dilitech Solutions'
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, alt: product.name }],
      type: 'product',
      siteName: 'Dilitech Solutions',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `/products/${product.slug || product.id}`,
    },
  }
}

/**
 * Generate product structured data (JSON-LD)
 */
export function generateProductStructuredData(product) {
  const image = product.images?.[0]?.url || '/placeholder-product.jpg'
  const brand = product.brand?.name || 'Dilitech Solutions'
  const availability = product.stock > 0 
    ? 'https://schema.org/InStock' 
    : 'https://schema.org/OutOfStock'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map(img => img.url) || [image],
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      url: `/products/${product.slug || product.id}`,
      priceCurrency: 'KES',
      price: product.price,
      availability: availability,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: 'Dilitech Solutions',
      },
    },
    aggregateRating: product.averageRating ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount || 0,
    } : undefined,
    sku: product.sku,
    category: product.category?.name,
  }
}

/**
 * Generate organization structured data
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dilitech Solutions',
    url: process.env.NEXTAUTH_URL || 'https://dilitechsolutions.com',
    logo: `${process.env.NEXTAUTH_URL || 'https://dilitechsolutions.com'}/dilitech-logo.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@dilitechsolutions.com',
    },
    sameAs: [
      // Add social media links here
    ],
  }
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate website structured data
 */
export function generateWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Dilitech Solutions',
    url: process.env.NEXTAUTH_URL || 'https://dilitechsolutions.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXTAUTH_URL || 'https://dilitechsolutions.com'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}


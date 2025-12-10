export default function robots() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://dilitechsolutions.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/checkout/',
          '/orders/',
          '/profile/',
          '/cart/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/auth/',
          '/checkout/',
          '/orders/',
          '/profile/',
          '/cart/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}


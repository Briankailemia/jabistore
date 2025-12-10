'use client'

import { useEffect } from 'react'

/**
 * SEO Head component for client-side pages
 * Updates document head dynamically
 */
export default function SEOHead({ 
  title,
  description,
  image,
  url,
  type = 'website',
  structuredData,
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://dilitechsolutions.com')
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl
  const fullImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}/og-image.jpg`

  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title
    }

    // Update or create meta tags
    const updateMetaTag = (name, content, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`
      let meta = document.querySelector(selector)
      
      if (!meta) {
        meta = document.createElement('meta')
        if (property) {
          meta.setAttribute('property', name)
        } else {
          meta.setAttribute('name', name)
        }
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', fullUrl)

    // Update meta tags
    if (description) {
      updateMetaTag('description', description)
      updateMetaTag('og:description', description, true)
      updateMetaTag('twitter:description', description)
    }

    if (title) {
      updateMetaTag('og:title', title, true)
      updateMetaTag('twitter:title', title)
    }

    updateMetaTag('og:image', fullImage, true)
    updateMetaTag('twitter:image', fullImage)
    updateMetaTag('og:url', fullUrl, true)
    updateMetaTag('og:type', type, true)
    updateMetaTag('og:site_name', 'Dilitech Solutions', true)
    updateMetaTag('twitter:card', 'summary_large_image')

    // Add structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"][data-seo="true"]')
      if (!script) {
        script = document.createElement('script')
        script.setAttribute('type', 'application/ld+json')
        script.setAttribute('data-seo', 'true')
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(structuredData)
    }
  }, [title, description, image, url, type, structuredData, fullUrl, fullImage])

  return null
}


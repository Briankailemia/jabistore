'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

const supportCategories = [
  {
    label: 'General Inquiry',
    value: 'general',
    description: 'Questions about products, services, or general information',
  },
  {
    label: 'Technical Support',
    value: 'technical',
    description: 'Device setup, troubleshooting, or technical issues',
  },
  {
    label: 'Order Support',
    value: 'orders',
    description: 'Order status, shipping, or delivery questions',
  },
  {
    label: 'Billing & Payment',
    value: 'billing',
    description: 'Payment issues, refunds, or billing questions',
  },
  {
    label: 'Returns & Warranty',
    value: 'returns',
    description: 'Return requests, warranty claims, or exchanges',
  },
]

export default function EmailSupportPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    subject: '',
    category: 'general',
    message: '',
    orderNumber: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedAt, setSubmittedAt] = useState(null)
  const [errors, setErrors] = useState({})

  const selectedCategory = supportCategories.find((cat) => cat.value === formData.category)

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required'
    if (!formData.message.trim()) newErrors.message = 'Message is required'
    if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/support/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          category: selectedCategory?.label || formData.category,
          orderNumber: formData.orderNumber || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send email')
      }

      // Show success message
      setSubmittedAt(new Date())
      setTimeout(() => {
        setSubmittedAt(null)
        router.push('/support')
      }, 5000)
    } catch (error) {
      console.error('Error sending support email:', error)
      alert(error.message || 'Failed to send email. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-8 py-12 mb-10">
          {/* Grid Pattern Background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
          
          {/* Glowing Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 space-y-4">
            <Badge variant="glow" className="inline-flex bg-blue-100/20 text-blue-200 border-blue-300/30">
              Email Support
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Send us an Email
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl">
              Fill out the form below and we'll open your email client to send a message to our support team. We typically respond within 4 hours.
            </p>
          </div>
        </section>

        {/* Email Form */}
        <Card className="p-8 bg-white border-gray-200">
          {submittedAt ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Email Sent Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your support request has been sent successfully. We will respond within 4 hours. If you need immediate assistance, please{' '}
                <a href="/contact" className="text-blue-900 font-semibold hover:underline">
                  contact us via WhatsApp
                </a>
                {' '}or call our operations line.
              </p>
              <p className="text-sm text-gray-500">Redirecting back to support page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="email-name" className="block text-sm font-bold text-gray-900 mb-2">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="email-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={cn(
                      'w-full rounded-xl border-2 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all',
                      errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-900'
                    )}
                    placeholder="Your full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email-email" className="block text-sm font-bold text-gray-900 mb-2">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="email-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={cn(
                      'w-full rounded-xl border-2 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all',
                      errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-900'
                    )}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email-category" className="block text-sm font-bold text-gray-900 mb-2">
                  Category <span className="text-red-600">*</span>
                </label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {supportCategories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, category: category.value }))}
                      className={cn(
                        'rounded-xl border-2 px-4 py-3 text-left text-sm transition-all',
                        formData.category === category.value
                          ? 'border-blue-900 bg-blue-900 text-white shadow-lg'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                      )}
                    >
                      <p className="font-bold">{category.label}</p>
                      <p className="text-xs mt-1 opacity-80">{category.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="email-subject" className="block text-sm font-bold text-gray-900 mb-2">
                  Subject <span className="text-red-600">*</span>
                </label>
                <input
                  id="email-subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className={cn(
                    'w-full rounded-xl border-2 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all',
                    errors.subject ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-900'
                  )}
                  placeholder="Brief description of your issue"
                />
                {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
              </div>

              <div>
                <label htmlFor="email-order" className="block text-sm font-bold text-gray-900 mb-2">
                  Order Number <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </label>
                <input
                  id="email-order"
                  type="text"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  placeholder="If your inquiry is about an order"
                />
              </div>

              <div>
                <label htmlFor="email-message" className="block text-sm font-bold text-gray-900 mb-2">
                  Message <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="email-message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={8}
                  className={cn(
                    'w-full rounded-xl border-2 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all resize-none',
                    errors.message ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-900'
                  )}
                  placeholder="Please provide as much detail as possible about your inquiry, issue, or question..."
                />
                {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
                <p className="mt-2 text-xs text-gray-500">
                  {formData.message.length} characters {formData.message.length < 10 && '(minimum 10 required)'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Opening email client...
                    </span>
                  ) : (
                    'Open Email Client'
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Card>

        {/* Help Section */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-700 mb-3">
                If your email client doesn't open automatically, you can send an email directly to{' '}
                <a href="mailto:support@dilitechsolutions.com" className="text-blue-900 font-semibold hover:underline">
                  support@dilitechsolutions.com
                </a>
              </p>
              <p className="text-sm text-gray-600">
                For faster response, you can also{' '}
                <a href="/contact" className="text-blue-900 font-semibold hover:underline">
                  chat with us on WhatsApp
                </a>
                {' '}or call our operations line.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}


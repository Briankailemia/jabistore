'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import Button, { buttonClasses } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'

const contactMethods = [
  {
    label: 'Mission Control',
    value: 'general',
    description: 'Product roadmaps, partnerships, and anything that does not fit in a ticket.',
  },
  {
    label: 'Support Engineering',
    value: 'support',
    description: 'Troubleshooting, device provisioning, deployments, and SLAs.',
  },
  {
    label: 'Commercial and Billing',
    value: 'sales',
    description: 'Quotes, procurement flows, and enterprise contracts.',
  },
  {
    label: 'Ecosystem and APIs',
    value: 'partnership',
    description: 'Integrations, developer relations, and co-build programs.',
  },
]

const quickAnswers = [
  {
    question: 'How fast do you respond?',
    answer: 'Live chat replies in minutes. Inbox replies land within four business hours, around the clock.',
  },
  {
    question: 'Do you offer on-site services?',
    answer: 'Enterprise plans include deployment engineers, device imaging, and white glove handovers.',
  },
  {
    question: 'Which payments do you support?',
    answer: 'Stripe, ACH, wire transfers, and M-Pesa (STK push plus paybill). Ask about custom flows.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Every submission is encrypted in transit and at rest. We align with SOC 2 Type II and ISO 27001.',
  },
]

const officeHighlights = [
  { title: 'San Francisco HQ', detail: '600 California St, Suite 420, San Francisco, CA 94108' },
  { title: 'Nairobi Studio', detail: 'The Promenade, General Mathenge Rd, Nairobi' },
  { title: 'Operations line', detail: '+1 (415) 915-2040 / +254 709 000 111' },
  { title: 'Response window', detail: 'Email and ticketing / 24/7 / under four hour average' },
]

const baseInputClasses =
  'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:outline-none transition-all'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedAt, setSubmittedAt] = useState(null)

  const selectedCategory = useMemo(
    () => contactMethods.find((method) => method.value === formData.category),
    [formData.category],
  )

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
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
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send message')
      }

      setIsSubmitting(false)
      setSubmittedAt(new Date())
      setFormData({ name: '', email: '', subject: '', message: '', category: 'general' })
      setTimeout(() => setSubmittedAt(null), 5000)
    } catch (error) {
      console.error('Error sending contact form:', error)
      setIsSubmitting(false)
      alert(error.message || 'Failed to send message. Please try again later.')
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-8 py-16 sm:px-12">
          {/* Grid Pattern Background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
          
          {/* Glowing Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-xs uppercase tracking-[0.3em] text-white">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Concierge Desk
              </p>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Talk to the humans powering Dilitech Solutions
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Whether you are orchestrating a global rollout or testing a single device, our specialists respond in
                hours, not days.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white">24/7 coverage</span>
                <span className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white">Global rollout teams</span>
                <span className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white">SOC 2 ready</span>
              </div>
              
              {/* WhatsApp Quick Action */}
              <div className="pt-4">
                <a
                  href="https://wa.me/254709000111?text=Hello%2C%20I%20need%20support%20from%20Dilitech%20Solutions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-xl bg-green-600 hover:bg-green-700 text-white px-6 py-4 font-bold transition-colors shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
              </div>
            </div>
            <Card className="relative overflow-hidden p-8 bg-white/10 backdrop-blur-sm border-white/20">
              <div className="grid gap-6 sm:grid-cols-2">
                <HighlightStat label="Avg. first reply" value="4h" caption="Follow the sun" />
                <HighlightStat label="Regions covered" value="42" caption="AMER / EMEA / APAC" />
                <HighlightStat label="CSAT" value="98%" caption="Rolling 90 days" />
                <HighlightStat label="On-site pods" value="12" caption="Embedded teams" />
              </div>
              <div className="mt-8 text-sm text-blue-100">
                <p>Need a live session? Ping the in product chat or call +1 (415) 915-2040.</p>
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="p-8 bg-white border-gray-200">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Message us</p>
              <h2 className="text-2xl font-black text-gray-900">Tell us what you need</h2>
              <p className="text-sm text-gray-600">Our concierge team replies within a single business morning.</p>
            </div>

            {submittedAt ? (
              <div className="mt-10 rounded-3xl border-2 border-green-200 bg-green-50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                  <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl font-black text-gray-900">We received your message</p>
                <p className="text-sm text-gray-700 mt-2">Expect a response within four hours. Keep an eye on your inbox.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="contact-name" required>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={baseInputClasses}
                      placeholder="Amani Njoroge"
                    />
                  </Field>
                  <Field label="Email" htmlFor="contact-email" required>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={baseInputClasses}
                      placeholder="you@company.com"
                    />
                  </Field>
                </div>

                <Field label="Subject" htmlFor="contact-subject" required>
                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className={baseInputClasses}
                    placeholder="How can we help?"
                  />
                </Field>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Routing</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {contactMethods.map((method) => (
                      <ContactMethodButton
                        key={method.value}
                        method={method}
                        active={method.value === formData.category}
                        onSelect={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                      />
                    ))}
                  </div>
                  {selectedCategory && <p className="text-sm text-gray-600">{selectedCategory.description}</p>}
                </div>

                <Field
                  label="Message"
                  htmlFor="contact-message"
                  required
                  helper="Share links, order numbers, or anything useful"
                >
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className={cn(baseInputClasses, 'resize-none leading-relaxed')}
                    placeholder="Give us context so we can route your request faster."
                  />
                </Field>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Sending...' : 'Send message'}
                </Button>
              </form>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Contact options</p>
              <h3 className="mt-3 text-xl font-semibold">Need something faster?</h3>
              <p className="mt-2 text-sm text-slate-400">
                Reach the same concierge team through any channel. Include your order number or workspace ID for the fastest
                routing.
              </p>
              <div className="mt-6 space-y-3">
                <a 
                  href="https://wa.me/254709000111?text=Hello%2C%20I%20need%20support%20from%20Dilitech%20Solutions" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClasses({ variant: 'primary', className: 'w-full text-center flex items-center justify-center gap-2' }), 'bg-green-600 hover:bg-green-700')}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a href="tel:+14159152040" className={buttonClasses({ variant: 'secondary', className: 'flex-1 text-center' })}>
                    Call operations
                  </a>
                  <a
                    href="/support/email"
                    className={buttonClasses({ variant: 'secondary', className: 'flex-1 text-center' })}
                  >
                    Email support
                  </a>
                </div>
              </div>
            </Card>

            <Card className="space-y-4 p-6 bg-white border-gray-200">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Offices and reach</p>
              {officeHighlights.map((item) => (
                <OfficeHighlight key={item.title} {...item} />
              ))}
            </Card>

            <Card className="space-y-6 p-6 bg-white border-gray-200">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Self serve</p>
              <div className="space-y-3 text-sm">
                <Link href="/support" className="flex items-center justify-between text-blue-900 hover:text-blue-700 font-semibold transition-colors">
                  Help center
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/support/shipping"
                  className="flex items-center justify-between text-blue-900 hover:text-blue-700 font-semibold transition-colors"
                >
                  Shipping and logistics
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/support/warranty"
                  className="flex items-center justify-between text-blue-900 hover:text-blue-700 font-semibold transition-colors"
                >
                  Warranty and protection
                  <span aria-hidden="true">→</span>
                </Link>
                <Link href="/support/returns" className="flex items-center justify-between text-blue-900 hover:text-blue-700 font-semibold transition-colors">
                  Returns and RMA desk
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </Card>
          </div>
        </section>

        <section className="space-y-10">
          <SectionHeader
            eyebrow="Knowledge base"
            title="Quick answers before you reach out"
            description="Most teams skim these before writing in. It keeps the conversation lightning fast."
            align="left"
          />
          <div className="grid gap-6 md:grid-cols-2">
            {quickAnswers.map((item) => (
              <QuickAnswer key={item.question} {...item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({ htmlFor, label, required, helper, children }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-xs font-bold uppercase tracking-[0.3em] text-gray-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {helper && <p className="text-xs text-gray-500">{helper}</p>}
      {children}
    </div>
  )
}

function ContactMethodButton({ method, active, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(method.value)}
      className={cn(
        'rounded-xl border-2 px-4 py-3 text-left text-sm transition-all duration-200',
        active
          ? 'border-blue-900 bg-blue-900 text-white shadow-lg'
          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50',
      )}
    >
      <p className="font-bold">{method.label}</p>
      <p className="text-xs mt-1 opacity-80">{method.description}</p>
    </button>
  )
}

function HighlightStat({ label, value, caption }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-blue-200">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="text-xs text-blue-100">{caption}</p>
    </div>
  )
}

function OfficeHighlight({ title, detail }) {
  return (
    <div className="border-b border-gray-200 pb-4 last:border-none last:pb-0">
      <p className="text-sm font-bold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{detail}</p>
    </div>
  )
}

function QuickAnswer({ question, answer }) {
  return (
    <Card className="p-6 bg-white border-gray-200">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">FAQ</p>
      <h3 className="mt-3 text-xl font-bold text-gray-900">{question}</h3>
      <p className="mt-2 text-sm text-gray-600">{answer}</p>
    </Card>
  )
}

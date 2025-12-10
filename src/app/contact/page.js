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
  'w-full rounded-2xl border border-white/10 bg-[color:var(--surface-tertiary)]/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-brand-sky/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sky'

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
    await new Promise((resolve) => setTimeout(resolve, 1600))
    setIsSubmitting(false)
    setSubmittedAt(new Date())
    setFormData({ name: '', email: '', subject: '', message: '', category: 'general' })
    setTimeout(() => setSubmittedAt(null), 3200)
  }

  return (
    <div className="bg-transparent text-white">
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-16 sm:px-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-[30%] h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
            <div className="absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          </div>
          <div className="relative z-10 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Concierge desk
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Talk to the humans powering Dilitech Solutions
              </h1>
              <p className="text-lg text-slate-300">
                Whether you are orchestrating a global rollout or testing a single device, our specialists respond in
                hours, not days.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-slate-700 px-3 py-1">24/7 coverage</span>
                <span className="rounded-full border border-slate-700 px-3 py-1">Global rollout teams</span>
                <span className="rounded-full border border-slate-700 px-3 py-1">SOC 2 ready</span>
              </div>
            </div>
          <Card className="relative overflow-hidden p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <HighlightStat label="Avg. first reply" value="4h" caption="Follow the sun" />
                <HighlightStat label="Regions covered" value="42" caption="AMER / EMEA / APAC" />
                <HighlightStat label="CSAT" value="98%" caption="Rolling 90 days" />
                <HighlightStat label="On-site pods" value="12" caption="Embedded teams" />
              </div>
              <div className="mt-8 text-sm text-slate-300">
                <p>Need a live session? Ping the in product chat or call +1 (415) 915-2040.</p>
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="p-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Message us</p>
              <h2 className="text-2xl font-semibold text-white">Tell us what you need</h2>
              <p className="text-sm text-slate-400">Our concierge team replies within a single business morning.</p>
            </div>

            {submittedAt ? (
              <div className="mt-10 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center text-emerald-100">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/30">
                  <svg className="h-8 w-8 text-emerald-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl font-semibold">We received your message</p>
                <p className="text-sm text-emerald-200">Expect a response within four hours. Keep an eye on your inbox.</p>
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
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Routing</p>
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
                  {selectedCategory && <p className="text-sm text-slate-400">{selectedCategory.description}</p>}
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
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href="tel:+14159152040" className={buttonClasses({ variant: 'secondary', className: 'flex-1 text-center' })}>
                  Call operations
                </a>
                <a
                  href="mailto:support@dilitechsolutions.com"
                  className={buttonClasses({ variant: 'primary', className: 'flex-1 text-center' })}
                >
                  Email support
                </a>
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Offices and reach</p>
              {officeHighlights.map((item) => (
                <OfficeHighlight key={item.title} {...item} />
              ))}
            </Card>

            <Card className="space-y-6 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Self serve</p>
              <div className="space-y-3 text-sm text-slate-300">
                <Link href="/support" className="flex items-center justify-between text-sky-300 hover:text-sky-100">
                  Help center
                  <span aria-hidden="true">{'>'}</span>
                </Link>
                <Link
                  href="/support/shipping"
                  className="flex items-center justify-between text-sky-300 hover:text-sky-100"
                >
                  Shipping and logistics
                  <span aria-hidden="true">{'>'}</span>
                </Link>
                <Link
                  href="/support/warranty"
                  className="flex items-center justify-between text-sky-300 hover:text-sky-100"
                >
                  Warranty and protection
                  <span aria-hidden="true">{'>'}</span>
                </Link>
                <Link href="/support/returns" className="flex items-center justify-between text-sky-300 hover:text-sky-100">
                  Returns and RMA desk
                  <span aria-hidden="true">{'>'}</span>
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
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        {label}
        {required && <span className="text-rose-400"> *</span>}
      </label>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
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
        'rounded-2xl border px-4 py-3 text-left text-sm transition',
        active
          ? 'border-sky-500 bg-sky-500/10 text-white shadow-glow'
          : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-600',
      )}
    >
      <p className="font-semibold">{method.label}</p>
      <p className="text-xs text-slate-400">{method.description}</p>
    </button>
  )
}

function HighlightStat({ label, value, caption }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-400">{caption}</p>
    </div>
  )
}

function OfficeHighlight({ title, detail }) {
  return (
    <div className="border-b border-slate-800 pb-4 last:border-none last:pb-0">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-sm text-slate-400">{detail}</p>
    </div>
  )
}

function QuickAnswer({ question, answer }) {
  return (
    <Card className="p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">FAQ</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{question}</h3>
      <p className="mt-2 text-sm text-slate-300">{answer}</p>
    </Card>
  )
}

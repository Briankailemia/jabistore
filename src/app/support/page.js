'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { useDebounce } from '@/lib/useDebounce'

const categories = [
  { id: 'all', name: 'All topics', icon: '📚' },
  { id: 'orders', name: 'Orders & shipping', icon: '📦' },
  { id: 'products', name: 'Products & setup', icon: '⚙️' },
  { id: 'account', name: 'Account & billing', icon: '👤' },
  { id: 'technical', name: 'Technical support', icon: '🔧' },
  { id: 'returns', name: 'Returns & warranty', icon: '🔄' },
]

const quickActions = [
  {
    title: 'Concierge desk',
    description: 'Chat and WhatsApp support with <4h response.',
    cta: 'Talk to support',
    href: '/contact',
    icon: '💬',
  },
  {
    title: 'Call operations',
    description: '+1 (415) 915-2040 · +254 709 000 111',
    icon: '📞',
    href: null,
  },
  {
    title: 'Email helpdesk',
    description: 'support@dilitechsolutions.com · 24/7 coverage',
    icon: '✉️',
    href: '/support/email',
    cta: 'Send email',
  },
]

const resources = [
  {
    title: 'Video tutorials',
    description: 'Step-by-step setup clips for every flagship device.',
    href: '#',
    icon: '🎬',
  },
  {
    title: 'User manuals',
    description: 'Download full documentation and deployment guides.',
    href: '#',
    icon: '📖',
  },
  {
    title: 'Community forum',
    description: 'Swap workflows with creators and ops teams.',
    href: '#',
    icon: '🌐',
  },
]

const faqs = [
  {
    id: 1,
    category: 'orders',
    question: 'How can I track my order?',
    answer:
      "Log into your account and open Orders. Every shipment also sends a tracking email plus SMS updates if you opt in.",
  },
  {
    id: 2,
    category: 'orders',
    question: 'What are your shipping options and costs?',
    answer:
      'Free delivery above KSh 7,500. Standard (5-7 business days) is KSh 1,800 and express (2-3 business days) is KSh 3,500. Nairobi deliveries include same-day bike dispatch.',
  },
  {
    id: 3,
    category: 'products',
    question: 'How do I set up my smart device?',
    answer:
      'Every kit arrives with a QR onboarding card. Scan it for guided setup, or open the Help Center to watch the matching tutorial.',
  },
  {
    id: 4,
    category: 'products',
    question: 'Are your products compatible with other smart home systems?',
    answer:
      'Yes. We certify against Google Home, Amazon Alexa, Apple HomeKit, and Samsung SmartThings unless noted otherwise in specs.',
  },
  {
    id: 5,
    category: 'account',
    question: 'How do I reset my password?',
    answer:
      'Use the Forgot Password link on the sign-in screen. We send a secure reset link plus device approval reminders.',
  },
  {
    id: 6,
    category: 'account',
    question: 'Can I change my shipping address after placing an order?',
    answer:
      'You have a two hour grace window after checkout. Open the order drawer and select Update Address or contact the concierge desk.',
  },
  {
    id: 7,
    category: 'technical',
    question: "My device won't connect to Wi-Fi. What should I do?",
    answer:
      'Confirm the password, ensure a 2.4GHz network is available, then reboot the hub and router. If it persists, tap Request remote session.',
  },
  {
    id: 8,
    category: 'technical',
    question: 'How do I update my device firmware?',
    answer:
      'Most devices auto update overnight. You can trigger a manual update in the Fleet menu or within the Dilitech mobile app.',
  },
  {
    id: 9,
    category: 'returns',
    question: 'What is your return policy?',
    answer:
      'Sixty day returns on every purchase. Keep original packaging and accessories so we can dispatch a courier label for free.',
  },
  {
    id: 10,
    category: 'returns',
    question: 'How long is the warranty on your products?',
    answer:
      'Two year warranty baseline. Premium creator lines include four year upgrade coverage with accidental protection.',
  },
]

export default function SupportPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const debouncedQuery = useDebounce(searchQuery, 300)

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
      const query = debouncedQuery.trim().toLowerCase()
      const matchesSearch =
        query.length === 0 ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, debouncedQuery])

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
          
          <div className="relative z-10 max-w-4xl space-y-6">
            <Badge variant="glow" className="inline-flex bg-blue-100/20 text-blue-200 border-blue-300/30">
              Support Desk
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Help when you need it, minutes away
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed max-w-2xl">
              Search live documentation, browse categories, or connect directly with the concierge engineering team.
            </p>
            <div className="relative max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search articles, workflows, or troubleshooting topics..."
                className="w-full rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-12 py-4 text-base text-white placeholder:text-blue-200/60 focus:border-blue-400 focus:bg-white/15 focus:outline-none transition-all"
              />
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-blue-200"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Get Help Fast</h2>
            <p className="text-gray-600">Multiple ways to reach our support team</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {quickActions.map((card) => (
              <div
                key={card.title}
                onClick={() => card.href && router.push(card.href)}
                className={`group cursor-pointer ${card.href ? '' : 'cursor-default'}`}
              >
                <Card className={`flex flex-col gap-4 p-6 bg-white border-gray-200 h-full ${card.href ? 'group-hover:border-blue-900 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl">{card.icon}</div>
                    <Badge variant="outline" className="text-xs tracking-[0.2em] bg-green-50 text-green-700 border-green-200">
                      Live
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">{card.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
                  </div>
                  {card.href && (
                    <div className="mt-auto pt-2 flex items-center gap-2 text-blue-900 font-semibold text-sm group-hover:gap-3 transition-all">
                      <span>{card.cta}</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Category Filters */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Browse by Topic</h2>
            <p className="text-gray-600">Find answers organized by category</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const active = activeCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 px-5 py-3 text-sm font-bold transition-all duration-200',
                    active
                      ? 'border-blue-900 bg-blue-900 text-white shadow-lg scale-105'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-900 hover:bg-blue-50',
                  )}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <Card className="p-0 bg-white border-gray-200 overflow-hidden shadow-lg">
            <div className="border-b border-gray-200 bg-gray-50 px-8 py-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold mb-3">Knowledge Base</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black text-gray-900">
                  {activeCategory === 'all'
                    ? 'Frequently Asked Questions'
                    : `${categories.find((c) => c.id === activeCategory)?.name ?? 'Category'} FAQ`}
                </h2>
                <p className="text-sm text-gray-600 font-semibold bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                  {filteredFaqs.length} article{filteredFaqs.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredFaqs.length === 0 ? (
                <div className="p-16 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-900 font-bold text-lg mb-2">No articles match that filter</p>
                  <p className="text-gray-600 text-sm">Try adjusting your search or category filter</p>
                </div>
              ) : (
                filteredFaqs.map((faq) => (
                  <details key={faq.id} className="group">
                    <summary className="flex cursor-pointer items-center justify-between px-8 py-6 text-left hover:bg-gray-50 transition-colors">
                      <span className="text-base font-bold text-gray-900 group-open:text-blue-900 pr-4">{faq.question}</span>
                      <svg
                        className="h-6 w-6 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180 group-open:text-blue-900"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-8 pb-6 text-sm text-gray-700 leading-relaxed bg-gray-50/50">{faq.answer}</div>
                  </details>
                ))
              )}
            </div>
          </Card>
        </section>

        {/* Resources Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">More Ways to Learn</h2>
            <p className="text-gray-600">Download manuals, watch walkthroughs, or connect with the community</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <div
                key={resource.title}
                onClick={() => router.push(resource.href)}
                className="group cursor-pointer"
              >
                <Card className="p-6 bg-white border-gray-200 group-hover:border-blue-900 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200 h-full flex flex-col">
                  <div className="text-3xl mb-4">{resource.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 flex-1 leading-relaxed">{resource.description}</p>
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm group-hover:gap-3 transition-all">
                    <span>Explore</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

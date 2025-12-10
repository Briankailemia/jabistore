'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { buttonClasses } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import SectionHeader from '@/components/ui/SectionHeader'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

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
  },
  {
    title: 'Email helpdesk',
    description: 'support@dilitechsolutions.com · 24/7 coverage',
    icon: '✉️',
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
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        query.length === 0 ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <div className="space-y-12 pb-20">
      <section className="relative overflow-hidden rounded-[36px] border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-16 sm:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl space-y-6">
          <Badge variant="glow" className="inline-flex">
            Support desk
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Help when you need it, minutes away
          </h1>
          <p className="text-lg text-slate-300">
            Search live documentation, browse categories, or connect directly with the concierge engineering team.
          </p>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search articles, workflows, or troubleshooting topics..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-12 py-4 text-base text-white placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none"
            />
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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

      <section className="px-4">
        <div className="grid gap-6 lg:grid-cols-3">
          {quickActions.map((card) => (
            <Card key={card.title} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-2xl">{card.icon}</div>
                <Badge variant="outline" className="text-[0.6rem] tracking-[0.25em]">
                  Live
                </Badge>
              </div>
              <h3 className="text-xl font-semibold text-white">{card.title}</h3>
              <p className="text-sm text-slate-300">{card.description}</p>
              {card.href && (
                <Link href={card.href} className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'mt-auto w-full text-center' })}>
                  {card.cta}
                </Link>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 space-y-8">
        <SectionHeader
          eyebrow="Browse"
          title="Choose a topic"
          description="Ops teams usually start with orders or deployment guides. Pick a lane below."
          align="left"
        />
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const active = activeCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition',
                  active
                    ? 'border-sky-500/60 bg-sky-500/10 text-white'
                    : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500',
                )}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="px-4">
        <Card className="p-0">
          <div className="border-b border-white/5 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Knowledge base</p>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <h2 className="text-2xl font-semibold text-white">
                {activeCategory === 'all'
                  ? 'Frequently asked questions'
                  : `${categories.find((c) => c.id === activeCategory)?.name ?? 'Category'} · FAQ`}
              </h2>
              <p className="text-sm text-slate-400">{filteredFaqs.length} article{filteredFaqs.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredFaqs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No articles match that filter yet.</div>
            ) : (
              filteredFaqs.map((faq) => (
                <details key={faq.id} className="group">
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-left text-white">
                    <span className="text-base font-semibold group-open:text-sky-300">{faq.question}</span>
                    <svg
                      className="h-5 w-5 text-slate-500 transition group-open:rotate-180"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed">{faq.answer}</div>
                </details>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="px-4">
        <SectionHeader
          eyebrow="Resources"
          title="More ways to learn"
          description="Download manuals, watch walkthroughs, or say hi to the community."
          align="left"
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.title} variant="muted" className="space-y-3">
              <div className="text-2xl">{resource.icon}</div>
              <h3 className="text-xl font-semibold text-white">{resource.title}</h3>
              <p className="text-sm text-slate-300">{resource.description}</p>
              <Link href={resource.href} className="text-sky-400 hover:text-sky-200 text-sm font-semibold">
                Explore →
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

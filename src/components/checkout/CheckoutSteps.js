'use client'

export default function CheckoutSteps({ step }) {
  const steps = [
    { number: 1, title: 'Shipping', icon: '🚚' },
    { number: 2, title: 'Payment', icon: '💳' },
    { number: 3, title: 'Review', icon: '✓' }
  ]

  return (
    <div className="mb-8 lg:mb-12">
      <div className="flex items-center justify-between max-w-2xl">
        {steps.map((stepItem, index) => (
          <div key={stepItem.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                step >= stepItem.number
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 border-sky-400 shadow-lg shadow-sky-500/50'
                  : 'bg-slate-800 border-slate-600'
              }`}>
                <span className="text-xl">{stepItem.icon}</span>
                {step > stepItem.number && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <span className={`mt-3 text-sm font-medium transition-colors ${
                step >= stepItem.number ? 'text-sky-400' : 'text-slate-500'
              }`}>
                {stepItem.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                step > stepItem.number ? 'bg-gradient-to-r from-sky-500 to-blue-600' : 'bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


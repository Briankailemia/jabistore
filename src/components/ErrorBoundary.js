'use client'

import { Component } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to error tracking service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // TODO: Send to error tracking service (Sentry, etc.)
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div>
              <h1 className="text-2xl font-semibold text-white mb-2">Something went wrong</h1>
              <p className="text-slate-400">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-slate-950 rounded-lg p-4 text-xs">
                <summary className="cursor-pointer text-slate-400 mb-2">Error Details (Development Only)</summary>
                <pre className="text-rose-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null })
                  window.location.reload()
                }}
                className="w-full sm:w-auto"
              >
                Try Again
              </Button>
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary


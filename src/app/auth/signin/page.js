'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const demoCredentials = {
  client: {
    role: 'Creator',
    email: 'client@dilitechsolutions.com',
    password: 'client123',
  },
  admin: {
    role: 'Admin',
    email: 'admin@dilitechsolutions.com',
    password: 'admin123',
  },
}

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCredentials, setShowCredentials] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession()
        if (session) {
          const callbackUrl = searchParams.get('callbackUrl') || '/'
          router.push(callbackUrl)
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setIsCheckingSession(false)
      }
    }
    checkSession()
  }, [router, searchParams])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      await signIn('google', { callbackUrl })
    } catch (error) {
      console.error('Google sign in error:', error)
      setError('Failed to sign in with Google. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else {
        // Wait a moment for session to be created
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Force session refresh
        const session = await getSession()
        
        // Reload the page to ensure all components get the new session
        const callbackUrl = searchParams.get('callbackUrl') || '/'
        const redirectUrl = session?.user?.role === 'ADMIN' ? '/admin' : callbackUrl
        
        // Use window.location for full page reload to refresh all session-dependent components
        window.location.href = redirectUrl
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An error occurred during sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillCredentials = (type) => {
    const preset = demoCredentials[type]
    if (!preset) return
    setEmail(preset.email)
    setPassword(preset.password)
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-base)]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-sky-400/50 border-t-sky-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm">Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[color:var(--color-base)] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-grid-slate opacity-30" style={{ backgroundSize: '140px 140px' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10 space-y-3">
          <Link href="/" className="inline-block group">
            <h1 className="text-5xl font-black bg-gradient-to-r from-sky-200 via-cyan-200 to-indigo-200 bg-clip-text text-transparent tracking-tight group-hover:from-sky-100 group-hover:via-cyan-100 group-hover:to-indigo-100 transition-all duration-300">
              DILITECH
            </h1>
            <p className="text-sm text-sky-300/80 font-semibold tracking-[0.2em] mt-1 uppercase">Computer Solutions</p>
          </Link>
          <p className="text-slate-400 text-sm mt-4">Welcome back to the future of technology</p>
        </div>

        {/* Sign In Card */}
        <div className="glass-panel p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Sign In</h2>
            <p className="text-sm text-slate-400">Access your account to continue</p>
          </div>
          
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white/95 hover:bg-white text-gray-900 font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-white/20"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[color:var(--surface-primary)] text-slate-500">Or continue with email</span>
            </div>
          </div>

          {/* Test Credentials */}
          <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full flex items-center justify-between text-sky-300 text-sm font-medium hover:text-sky-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Test Credentials
              </span>
              <svg className={`w-4 h-4 transition-transform ${showCredentials ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCredentials && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-white font-medium mb-2 flex items-center gap-2">
                    <span className="text-sky-400">👤</span> Creator Account
                  </p>
                  <p className="text-slate-300 text-xs mb-1">Email: <span className="font-mono text-sky-300">{demoCredentials.client.email}</span></p>
                  <p className="text-slate-300 text-xs mb-2">Password: <span className="font-mono text-sky-300">{demoCredentials.client.password}</span></p>
                  <button
                    type="button"
                    onClick={() => fillCredentials('client')}
                    className="w-full text-xs bg-sky-600/80 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    Autofill Creator
                  </button>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-white font-medium mb-2 flex items-center gap-2">
                    <span className="text-indigo-400">👑</span> Admin Account
                  </p>
                  <p className="text-slate-300 text-xs mb-1">Email: <span className="font-mono text-indigo-300">{demoCredentials.admin.email}</span></p>
                  <p className="text-slate-300 text-xs mb-2">Password: <span className="font-mono text-indigo-300">{demoCredentials.admin.password}</span></p>
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin')}
                    className="w-full text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    Autofill Admin
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-200 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="signin-email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                placeholder="you@example.com"
                required
                aria-required="true"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="signin-password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                placeholder="Enter your password"
                required
                aria-required="true"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800/50 text-sky-500 focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-0 cursor-pointer" 
                />
                <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <Link 
                href="/auth/forgot-password" 
                className="text-sky-400 hover:text-sky-300 transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-sky-500/20"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-center text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

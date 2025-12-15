'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SignUp() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError('')
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      await signIn('google', { callbackUrl })
    } catch (error) {
      console.error('Sign up error:', error)
      setError('Failed to sign up with Google. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required')
      setIsLoading(false)
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account. Please try again.')
        setIsLoading(false)
        return
      }

      setSuccess('Account created successfully! Signing you in...')

      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setError('Account created but sign in failed. Please sign in manually.')
        setIsLoading(false)
        return
      }

      // Wait a moment for session to be created
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Force session refresh
      const session = await getSession()
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      const redirectUrl = session?.user?.role === 'ADMIN' ? '/admin' : callbackUrl
      
      // Use window.location for full page reload to refresh all session-dependent components
      window.location.href = redirectUrl
    } catch (error) {
      console.error('Signup error:', error)
      setError('An error occurred during sign up. Please try again.')
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-sm font-medium">Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-blue-50 to-white relative overflow-hidden py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(13, 110, 253, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(13, 110, 253, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10 space-y-3">
          <Link href="/" className="inline-block group">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 bg-clip-text text-transparent tracking-tight group-hover:from-blue-800 group-hover:via-blue-600 group-hover:to-blue-800 transition-all duration-300">
              DILITECH SOLUTIONS
            </h1>
            <p className="text-sm text-blue-700 font-bold tracking-[0.2em] mt-1 uppercase">Computer Solutions</p>
          </Link>
          <p className="text-gray-600 text-sm mt-4 font-medium">Join the future of technology</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-gray-900">Create Account</h2>
            <p className="text-sm text-gray-600">Start your journey with us today</p>
          </div>
          
          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-blue-300"
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
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or create with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-900 text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-900 text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{success}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="signup-firstName" className="block text-sm font-bold text-gray-900">
                  First name
                </label>
                <input
                  id="signup-firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  placeholder="John"
                  required
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-lastName" className="block text-sm font-bold text-gray-900">
                  Last name
                </label>
                <input
                  id="signup-lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                  placeholder="Doe"
                  required
                  aria-required="true"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="signup-email" className="block text-sm font-bold text-gray-900">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                placeholder="you@example.com"
                required
                aria-required="true"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="signup-password" className="block text-sm font-bold text-gray-900">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                placeholder="Min. 6 characters"
                required
                minLength={6}
                aria-required="true"
                aria-describedby="signup-password-help"
              />
              <p id="signup-password-help" className="text-xs text-gray-500">Must be at least 6 characters long</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="signup-confirmPassword" className="block text-sm font-bold text-gray-900">
                Confirm Password
              </label>
              <input
                id="signup-confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                placeholder="Confirm your password"
                required
                aria-required="true"
              />
            </div>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 bg-white text-blue-900 focus:ring-2 focus:ring-blue-900 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                  required
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-900 hover:text-blue-700 font-bold">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-blue-900 hover:text-blue-700 font-bold">Privacy Policy</Link>
                </span>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm">
              Already have an account?{' '}
              <Link 
                href="/auth/signin" 
                className="text-blue-900 hover:text-blue-700 font-bold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

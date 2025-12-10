import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'

function buildProviders() {
  const providers = [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('Missing credentials')
            return null
          }

          // Normalize email to lowercase for case-insensitive lookup
          const normalizedEmail = credentials.email.toLowerCase().trim()

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          })

          if (!user) {
            console.error(`User not found: ${normalizedEmail}`)
            return null
          }

          if (!user.password) {
            console.error('User has no password (OAuth account)')
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            console.error('Invalid password')
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatar,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      },
    }),
  ]

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      }),
    )
  } else {
    console.warn('Google OAuth not configured: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing')
  }

  return providers
}

export const authOptions = {
  // Only use adapter for OAuth providers, not for credentials
  adapter: PrismaAdapter(prisma),
  providers: buildProviders(),
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all sign-ins
      return true
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role || token.role || 'USER'
        token.avatar = user.image || token.avatar || null
        token.email = user.email
      } 
      // Refresh token data from database if needed
      else if (!token.role && token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.sub } })
          if (dbUser) {
            token.role = dbUser.role
            token.avatar = dbUser.avatar
            token.email = dbUser.email
          }
        } catch (error) {
          console.error('Error fetching user for token:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub
        session.user.role = token.role || 'USER'
        session.user.image = token.avatar ?? session.user.image ?? null
        session.user.email = token.email ?? session.user.email
        
        // Ensure user ID is always present
        if (!session.user.id && token.sub) {
          session.user.id = token.sub
        }
      }

      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'dilitech-dev-secret-key-2024',
  debug: process.env.NODE_ENV === 'development',
}

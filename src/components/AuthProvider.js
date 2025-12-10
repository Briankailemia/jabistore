'use client'

import { SessionProvider } from 'next-auth/react'

export default function AuthProvider({ children, session }) {
  return (
    <SessionProvider 
      session={session}
      refetchInterval={5 * 60} // Refetch session every 5 minutes (reduced from 30s for performance)
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}

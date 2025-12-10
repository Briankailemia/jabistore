'use client';

import { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';

class SessionManager {
  constructor() {
    this.sessionCache = null;
    this.cacheExpiry = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.refreshThreshold = 60 * 60 * 1000; // 1 hour
  }

  // Get session with caching and automatic refresh
  async getSessionSecure() {
    const now = Date.now();
    
    // Return cached session if still valid
    if (this.sessionCache && this.cacheExpiry && now < this.cacheExpiry) {
      return this.sessionCache;
    }

    try {
      const session = await getSession();
      
      if (session) {
        // Cache the session
        this.sessionCache = session;
        this.cacheExpiry = now + this.cacheTimeout;
        
        // Check if session needs refresh
        if (this.shouldRefreshSession(session)) {
          this.scheduleSessionRefresh();
        }
      }
      
      return session;
    } catch (error) {
      console.error('Session retrieval error:', error);
      this.clearSessionCache();
      return null;
    }
  }

  // Check if session should be refreshed
  shouldRefreshSession(session) {
    if (!session?.expires) return false;
    
    const expiryTime = new Date(session.expires).getTime();
    const now = Date.now();
    
    return (expiryTime - now) < this.refreshThreshold;
  }

  // Schedule automatic session refresh
  scheduleSessionRefresh() {
    setTimeout(async () => {
      try {
        await getSession();
        this.clearSessionCache(); // Force fresh fetch next time
      } catch (error) {
        console.error('Session refresh error:', error);
      }
    }, 30000); // Refresh after 30 seconds
  }

  // Clear session cache
  clearSessionCache() {
    this.sessionCache = null;
    this.cacheExpiry = null;
  }

  // Validate session data integrity
  validateSession(session) {
    if (!session) return false;
    
    const requiredFields = ['user'];
    return requiredFields.every(field => session[field]);
  }

  // Get user role with fallback
  getUserRole(session) {
    return session?.user?.role || 'guest';
  }

  // Check if user has specific permission
  hasPermission(session, permission) {
    const role = this.getUserRole(session);
    
    const permissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'view_analytics'],
      user: ['read', 'write_own'],
      guest: ['read']
    };
    
    return permissions[role]?.includes(permission) || false;
  }

  // Secure logout with cleanup
  async logout() {
    try {
      this.clearSessionCache();
      
      // Clear any stored tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_preferences');
        sessionStorage.clear();
      }
      
      // Redirect to sign out
      const { signOut } = await import('next-auth/react');
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;

// Utility hooks for React components
export const useSecureSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      try {
        const sessionData = await sessionManager.getSessionSecure();
        setSession(sessionData);
      } catch (error) {
        console.error('Session fetch error:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  return { session, loading, refetch: () => fetchSession() };
};

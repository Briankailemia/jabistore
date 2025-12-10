/**
 * Rate limiting middleware for API routes
 * Prevents abuse and DDoS attacks
 */

// In-memory store (use Redis in production)
const requestStore = new Map()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestStore.entries()) {
    if (now - value.resetTime > 0) {
      requestStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options

  return async (request) => {
    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'

    const key = `rate_limit:${ip}`
    const now = Date.now()
    const record = requestStore.get(key)

    if (record) {
      if (now < record.resetTime) {
        // Still in the window
        record.count++
        
        if (record.count > max) {
          return {
            success: false,
            error: message,
            retryAfter: Math.ceil((record.resetTime - now) / 1000),
            status: 429,
          }
        }
      } else {
        // Window expired, reset
        record.count = 1
        record.resetTime = now + windowMs
      }
    } else {
      // First request
      requestStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
    }

    return { success: true }
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
})

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
})

export const paymentRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 payment attempts per minute
  message: 'Too many payment attempts, please wait a moment.',
})


/**
 * Standardized API response helpers
 * Ensures consistent response format across all API routes
 */

import { NextResponse } from 'next/server'
import logger from '@/lib/logger'

/**
 * Standard API response format
 */
export class ApiResponse {
  static success(data, message = 'Success', status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
        error: null,
      },
      { status }
    )
  }

  static error(message, status = 400, error = null, details = null) {
    const response = {
      success: false,
      data: null,
      message: String(message || 'An error occurred'),
      error: String(error || message || 'An error occurred'),
    }

    if (details) {
      // Ensure details is serializable
      if (Array.isArray(details)) {
        response.details = details
      } else if (typeof details === 'object' && details !== null) {
        response.details = details
      } else {
        response.details = [details]
      }
    }

    // Log error
    logger.error('API Error', new Error(message), { status, details })

    return NextResponse.json(response, { status })
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 401)
  }

  static forbidden(message = 'Forbidden') {
    return this.error(message, 403)
  }

  static badRequest(message = 'Bad request', details = null) {
    return this.error(message, 400, 'BadRequest', details)
  }

  static notFound(message = 'Resource not found') {
    return this.error(message, 404)
  }

  static validationError(errors, message = 'Validation failed') {
    return this.error(message, 400, 'ValidationError', errors)
  }

  static serverError(message = 'Internal server error', error = null) {
    const errorMessage = error?.message || error?.toString() || 'InternalServerError'
    const errorDetails = error ? {
      name: error.name,
      code: error.code,
      meta: error.meta,
    } : null
    return this.error(message, 500, errorMessage, errorDetails)
  }

  static rateLimitExceeded(retryAfter = null) {
    const response = this.error('Too many requests, please try again later.', 429)
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString())
    }
    return response
  }
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling(handler) {
  return async (request, context) => {
    const startTime = Date.now()
    const method = request.method
    const path = new URL(request.url).pathname

    try {
      const response = await handler(request, context)
      const duration = Date.now() - startTime

      // Log successful request
      logger.apiRequest(method, path, response.status, duration)

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Log error
      logger.apiError(method, path, error)

      // Return appropriate error response
      if (error.name === 'ZodError' && error.errors && Array.isArray(error.errors)) {
        const errorDetails = error.errors
          .filter(err => err != null) // Filter out null/undefined errors
          .map(err => ({
            path: (err.path && Array.isArray(err.path)) ? err.path.join('.') : String(err.path || ''),
            message: err.message || 'Validation error',
          }))
        return ApiResponse.validationError(errorDetails)
      }

      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        return ApiResponse.unauthorized(error.message)
      }

      if (error.message?.includes('Forbidden') || error.message?.includes('403')) {
        return ApiResponse.forbidden(error.message)
      }

      // Log full error details for debugging
      console.error('API Error Details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta,
      })

      return ApiResponse.serverError(
        error.message || 'An unexpected error occurred',
        error
      )
    }
  }
}

/**
 * Wrapper for API route handlers with rate limiting
 */
export function withRateLimit(rateLimiter, handler) {
  return async (request, context) => {
    const rateLimitResult = await rateLimiter(request)

    if (!rateLimitResult.success) {
      return ApiResponse.rateLimitExceeded(rateLimitResult.retryAfter)
    }

    return handler(request, context)
  }
}

/**
 * Wrapper combining rate limiting, validation, and error handling
 */
export function createApiHandler(options = {}) {
  const { rateLimiter, validator, handler } = options

  let wrappedHandler = handler

  // Add validation
  if (validator) {
    const originalHandler = wrappedHandler
    wrappedHandler = async (request, context) => {
      const validationResult = await validator(request)
      if (!validationResult.success) {
        let details = []
        if (validationResult.details) {
          if (Array.isArray(validationResult.details)) {
            details = validationResult.details.filter(d => d != null)
          } else if (typeof validationResult.details === 'object') {
            details = [validationResult.details]
          } else {
            details = [{ path: '', message: String(validationResult.details) }]
          }
        }
        return ApiResponse.validationError(details, validationResult.error || 'Validation failed')
      }
      // Attach validated data to request
      request.validatedData = validationResult.data
      return originalHandler(request, context)
    }
  }

  // Add rate limiting
  if (rateLimiter) {
    wrappedHandler = withRateLimit(rateLimiter, wrappedHandler)
  }

  // Add error handling (always last)
  wrappedHandler = withErrorHandling(wrappedHandler)

  return wrappedHandler
}


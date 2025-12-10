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
      message,
      error: error || message,
    }

    if (details) {
      response.details = details
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

  static notFound(message = 'Resource not found') {
    return this.error(message, 404)
  }

  static validationError(errors, message = 'Validation failed') {
    return this.error(message, 400, 'ValidationError', errors)
  }

  static serverError(message = 'Internal server error', error = null) {
    return this.error(message, 500, error?.message || 'InternalServerError')
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
      if (error.name === 'ZodError') {
        return ApiResponse.validationError(
          error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          }))
        )
      }

      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        return ApiResponse.unauthorized(error.message)
      }

      if (error.message?.includes('Forbidden') || error.message?.includes('403')) {
        return ApiResponse.forbidden(error.message)
      }

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
        return ApiResponse.validationError(validationResult.details)
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


/**
 * Request validation middleware using Zod
 */

import { z } from 'zod'
import logger from '@/lib/logger'

export function validateRequest(schema) {
  return async (request) => {
    try {
      let data

      // Get data based on method
      if (request.method === 'GET') {
        const url = new URL(request.url)
        const params = Object.fromEntries(url.searchParams.entries())
        data = params
      } else {
        const contentType = request.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          data = await request.json()
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          data = Object.fromEntries(formData.entries())
        } else {
          data = {}
        }
      }

      // Validate with Zod schema
      const validated = schema.parse(data)
      
      return {
        success: true,
        data: validated,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error', { errors: error.errors })
        return {
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
          status: 400,
        }
      }

      logger.error('Validation middleware error', error)
      return {
        success: false,
        error: 'Invalid request',
        status: 400,
      }
    }
  }
}

// Common validation schemas
export const schemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),

  // Product
  createProduct: z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
    sku: z.string().min(1).max(100),
    description: z.string().optional(),
    price: z.number().positive(),
    originalPrice: z.number().positive().optional(),
    stock: z.number().int().min(0).default(0),
    featured: z.boolean().default(false),
    published: z.boolean().default(true),
    categoryId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
  }),

  // Order
  createOrder: z.object({
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })).min(1),
    shippingAddress: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(10),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().min(1),
    }),
    paymentMethod: z.enum(['mpesa', 'card', 'stripe']),
    couponCode: z.string().optional(),
  }),

  // M-Pesa Payment
  mpesaPayment: z.object({
    phone: z.string().regex(/^254\d{9}$/, 'Phone must be in format 2547XXXXXXXX'),
    amount: z.number().positive().optional(),
    orderId: z.string().uuid('Order ID is required'),
  }),

  // Review
  createReview: z.object({
    productId: z.string().uuid('Invalid product ID'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    title: z.string().min(1).max(255).optional(),
    comment: z.string().min(1, 'Review comment is required').max(2000, 'Review comment is too long'),
  }),

  // Coupon
  createCoupon: z.object({
    code: z.string()
      .min(3, 'Coupon code must be at least 3 characters')
      .max(50, 'Coupon code is too long')
      .regex(/^[A-Z0-9-_]+$/, 'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores')
      .transform(val => val.toUpperCase()),
    name: z.string().min(1, 'Coupon name is required').max(255, 'Coupon name is too long'),
    description: z.string().max(500, 'Description is too long').optional(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'], {
      errorMap: () => ({ message: 'Invalid coupon type' })
    }),
    value: z.number().positive('Value must be positive'),
    minOrderAmount: z.number().positive('Minimum order amount must be positive').optional().nullable(),
    maxDiscount: z.number().positive('Maximum discount must be positive').optional().nullable(),
    usageLimit: z.number().int().positive('Usage limit must be a positive integer').optional().nullable(),
    userUsageLimit: z.number().int().positive('User usage limit must be a positive integer').optional().nullable(),
    validFrom: z.string().datetime('Invalid date format').optional(),
    validUntil: z.string().datetime('Invalid date format').optional().nullable(),
  }),

  // User update
  updateUser: z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
    role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  }),
}


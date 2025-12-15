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
        logger.warn('Validation error', { 
          errors: error.errors,
          issues: error.issues,
          formErrors: error.formErrors
        })
        
        // Extract detailed error information - ZodError has both 'errors' and 'issues'
        const zodIssues = error.issues || error.errors || []
        const errorDetails = (Array.isArray(zodIssues) && zodIssues.length > 0)
          ? zodIssues.map(issue => {
              const path = (issue.path && Array.isArray(issue.path)) 
                ? issue.path.join('.') 
                : (issue.path ? String(issue.path) : 'root')
              return {
                path: path,
                message: issue.message || 'Validation error',
                code: issue.code,
                expected: issue.expected,
                received: issue.received,
              }
            })
          : [{ 
              path: 'unknown', 
              message: 'Validation failed - no error details available',
            }]
        
        console.error('=== VALIDATOR ERROR DETAILS ===')
        console.error('ZodError object:', error)
        console.error('ZodError.errors:', error.errors)
        console.error('ZodError.issues:', error.issues)
        console.error('Processed error details:', errorDetails)
        
        return {
          success: false,
          error: 'Validation failed',
          details: errorDetails,
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
    name: z.string().min(1, 'Product name is required').max(255),
    slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    sku: z.string().min(1, 'SKU is required').max(100),
    description: z.string().max(5000).optional().nullable().transform(val => val === '' || val === undefined ? null : val),
    shortDescription: z.string().max(160).optional().nullable().transform(val => val === '' || val === undefined ? null : val),
    price: z.coerce.number().positive('Price must be greater than 0'),
    originalPrice: z.preprocess(
      (val) => (val === '' || val === undefined || val === null ? null : val),
      z.coerce.number().positive().nullable().optional()
    ),
    stock: z.coerce.number().int().min(0).default(0),
    weight: z.preprocess(
      (val) => (val === '' || val === undefined || val === null ? null : val),
      z.coerce.number().positive().nullable().optional()
    ),
    dimensions: z.string().max(100).optional().nullable().transform(val => val === '' || val === undefined ? null : val),
    featured: z.boolean().default(false),
    published: z.boolean().default(true),
    categoryId: z.string().min(1, 'Category is required'),
    brandId: z.string().min(1, 'Brand is required'),
    images: z.array(z.object({
      url: z.string().url('Invalid image URL'),
      alt: z.string().optional(),
      isPrimary: z.boolean().optional(),
    })).optional().default([]),
    features: z.array(z.string()).optional().default([]),
    specifications: z.array(z.object({
      name: z.string(),
      value: z.string(),
    })).optional().default([]),
    seoTitle: z.string().min(1, 'SEO title is required').max(255),
    seoDescription: z.string().min(1, 'SEO description is required').max(160, 'SEO description must be 160 characters or less'),
  }),

  // Order
  createOrder: z.object({
    items: z.array(z.object({
      // Product IDs are cuid (not UUID); accept any non-empty string
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().positive(),
      price: z.coerce.number().optional(),
    })).min(1, 'Order must contain at least one item'),

    // Optional inline shipping address (checkout form) OR existing address id
    shippingAddress: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(7),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().optional().nullable(),
      postalCode: z.string().optional().nullable(),
      country: z.string().min(1),
    }).optional(),

    shippingAddressId: z.string().min(1).optional(),

    paymentMethod: z.enum(['mpesa', 'card', 'stripe']),
    couponCode: z.string().optional(),

    // Totals are optional; server will recompute if missing
    total: z.coerce.number().optional(),
    subtotal: z.coerce.number().optional(),
    shipping: z.coerce.number().optional(),
    tax: z.coerce.number().optional(),
    discount: z.coerce.number().optional(),
    notes: z.string().optional().nullable(),
  }).refine((data) => data.shippingAddress || data.shippingAddressId, {
    message: 'Shipping address is required',
    path: ['shippingAddress'],
  }),

  // M-Pesa Payment
  mpesaPayment: z.object({
    phone: z.string().regex(/^254\d{9}$/, 'Phone must be in format 2547XXXXXXXX'),
    amount: z.number().positive().optional(),
    // Order IDs are cuid; accept non-empty string
    orderId: z.string().min(1, 'Order ID is required'),
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
    value: z.coerce.number().positive('Value must be positive'),
    minOrderAmount: z.preprocess(
      (val) => (val === '' || val === undefined || val === null ? null : val),
      z.coerce.number().positive('Minimum order amount must be positive').nullable().optional()
    ),
    maxDiscount: z.preprocess(
      (val) => (val === '' || val === undefined || val === null ? null : val),
      z.coerce.number().positive('Maximum discount must be positive').nullable().optional()
    ),
    usageLimit: z.preprocess(
      (val) => (val === '' || val === undefined || val === null ? null : val),
      z.coerce.number().int().positive('Usage limit must be a positive integer').nullable().optional()
    ),
    userUsageLimit: z.preprocess(
      (val) => (val === '' || val === undefined || val === null ? null : val),
      z.coerce.number().int().positive('User usage limit must be a positive integer').nullable().optional()
    ),
    validFrom: z.preprocess(
      (val) => {
        // Handle empty/undefined values
        if (!val || val === '' || val === undefined || val === null) {
          return undefined;
        }
        return val;
      },
      z.union([
        z.undefined(),
        z.string().datetime(),
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => {
          // Convert YYYY-MM-DD to ISO datetime
          const date = new Date(val + 'T00:00:00.000Z');
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
          }
          return date.toISOString();
        }),
      ]).optional()
    ),
    validUntil: z.union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => {
        // Convert YYYY-MM-DD to ISO datetime
        const date = new Date(val + 'T00:00:00.000Z');
        if (isNaN(date.getTime())) {
          throw new z.ZodError([{
            code: 'custom',
            path: [],
            message: 'Invalid date format'
          }]);
        }
        return date.toISOString();
      }),
      z.null(),
    ]).optional(),
  }),

  // User update
  updateUser: z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
    role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  }),
}


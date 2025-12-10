import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

// GET /api/settings - Get store settings
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    // For now, return default settings. In production, you'd store these in a Settings table
    const settings = {
      storeName: 'Dilitech Solutions',
      storeEmail: 'support@dilitechsolutions.com',
      storePhone: '+254 700 000 000',
      storeAddress: 'Nairobi, Kenya',
      enableMpesa: true,
      enableCard: true,
      defaultShippingCost: 500,
      freeShippingThreshold: 5000,
      taxRate: 0,
      currency: 'KES',
      timezone: 'Africa/Nairobi',
    }

    logger.info('Settings fetched', { userId: session.user.id })

    return ApiResponse.success(settings)
  },
})

// PUT /api/settings - Update store settings
const updateSettingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(255, 'Store name is too long').optional(),
  storeEmail: z.string().email('Invalid email format').optional(),
  storePhone: z.string().min(10, 'Phone number is too short').optional(),
  storeAddress: z.string().max(500, 'Address is too long').optional(),
  enableMpesa: z.boolean().optional(),
  enableCard: z.boolean().optional(),
  defaultShippingCost: z.number()
    .nonnegative('Shipping cost must be non-negative')
    .optional(),
  freeShippingThreshold: z.number()
    .nonnegative('Free shipping threshold must be non-negative')
    .optional(),
  taxRate: z.number()
    .min(0, 'Tax rate must be at least 0')
    .max(100, 'Tax rate cannot exceed 100')
    .optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
  timezone: z.string().min(1, 'Timezone is required').optional(),
})

export const PUT = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateSettingsSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const data = request.validatedData

    // In production, save to Settings table
    // For now, just return success
    const updatedSettings = {
      ...data,
      updatedAt: new Date().toISOString(),
    }

    logger.info('Settings updated', { 
      userId: session.user.id,
      updatedFields: Object.keys(data)
    })

    return ApiResponse.success(
      { settings: updatedSettings },
      'Settings updated successfully'
    )
  },
})


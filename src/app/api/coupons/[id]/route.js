import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { logAudit } from '@/lib/auditLogger'
import { z } from 'zod'

// PUT /api/coupons/[id] - Update coupon (admin only)
const updateCouponSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']).optional(),
  value: z.coerce.number().positive().optional(),
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
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
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
  validUntil: z.preprocess(
    (val) => {
      if (!val || val === '' || val === null || val === undefined) return null;
      return val;
    },
    z.union([
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
    ]).nullable().optional()
  ),
})

export const PUT = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateCouponSchema),
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const { id } = params
    const data = request.validatedData

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id }
    })

    if (!existingCoupon) {
      return ApiResponse.notFound('Coupon not found')
    }

    const updateData = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.value !== undefined) updateData.value = data.value
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit
    if (data.userUsageLimit !== undefined) updateData.userUsageLimit = data.userUsageLimit
    if (data.status !== undefined) updateData.status = data.status
    if (data.validFrom !== undefined) updateData.validFrom = new Date(data.validFrom)
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null

    const startTime = Date.now()
    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    })
    const duration = Date.now() - startTime

    logger.dbQuery('coupon.update', duration)
    logger.info('Coupon updated', { couponId: id, userId: session.user.id })

    await logAudit({
      action: 'COUPON_UPDATE',
      userId: session.user.id,
      entityType: 'coupon',
      entityId: id,
      details: { updatedFields: Object.keys(updateData) },
      request,
    })

    return ApiResponse.success(coupon, 'Coupon updated successfully')
  },
})

// DELETE /api/coupons/[id] - Delete coupon (admin only)
export const DELETE = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const { id } = params

    // Check if coupon exists
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      select: { id: true, code: true }
    })

    if (!coupon) {
      return ApiResponse.notFound('Coupon not found')
    }

    const startTime = Date.now()
    await prisma.coupon.delete({
      where: { id },
    })
    const duration = Date.now() - startTime

    logger.dbQuery('coupon.delete', duration)
    logger.info('Coupon deleted', { couponId: id, code: coupon.code, userId: session.user.id })

    await logAudit({
      action: 'COUPON_DELETE',
      userId: session.user.id,
      entityType: 'coupon',
      entityId: id,
      details: { code: coupon.code },
      request,
    })

    return ApiResponse.success(null, 'Coupon deleted successfully')
  },
})


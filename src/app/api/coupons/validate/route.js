import { prisma } from '@/lib/prisma';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest } from '@/lib/middleware/validator';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

// POST /api/coupons/validate - Validate coupon code
const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  orderAmount: z.number().positive('Order amount must be positive'),
});

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(validateCouponSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    const { code, orderAmount } = request.validatedData;

    // Find coupon by code
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        userCoupons: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!coupon) {
      return ApiResponse.error('Invalid coupon code', 400, { valid: false });
    }

    // Check if coupon is active
    if (coupon.status !== 'ACTIVE') {
      return ApiResponse.error('This coupon is no longer active', 400, { valid: false });
    }

    // Check expiry date
    const now = new Date();
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return ApiResponse.error('This coupon has expired', 400, { valid: false });
    }

    if (new Date(coupon.validFrom) > now) {
      return ApiResponse.error('This coupon is not yet valid', 400, { valid: false });
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return ApiResponse.error('This coupon has reached its usage limit', 400, { valid: false });
    }

    // Check per-user usage limit
    const userUsage = coupon.userCoupons[0];
    if (coupon.userUsageLimit && userUsage && userUsage.usageCount >= coupon.userUsageLimit) {
      return ApiResponse.error('You have reached the usage limit for this coupon', 400, { valid: false });
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return ApiResponse.error(
        `Minimum order amount of KSh ${(coupon.minOrderAmount * 130).toFixed(0)} required`,
        400,
        { valid: false }
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (orderAmount * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discount = coupon.value;
    } else if (coupon.type === 'FREE_SHIPPING') {
      // For free shipping, we'll return a special flag
      return ApiResponse.success({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          freeShipping: true
        },
        discount: 0,
        freeShipping: true
      });
    }

    // Ensure discount doesn't exceed order amount
    if (discount > orderAmount) {
      discount = orderAmount;
    }

    logger.info('Coupon validated', { code: coupon.code, userId: session.user.id })

    return ApiResponse.success({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value
      },
      discount,
      freeShipping: coupon.type === 'FREE_SHIPPING'
    });

  },
});

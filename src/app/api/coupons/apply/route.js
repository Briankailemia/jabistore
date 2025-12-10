import { prisma } from '@/lib/prisma';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest } from '@/lib/middleware/validator';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const applyCouponSchema = z.object({
  couponId: z.string().uuid('Coupon ID is required'),
  orderId: z.string().uuid('Order ID is required'),
});

// POST /api/coupons/apply - Apply coupon to order
export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(applyCouponSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    const { couponId, orderId } = request.validatedData;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order || order.userId !== session.user.id) {
      return ApiResponse.notFound('Order not found');
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    });

    if (!coupon) {
      return ApiResponse.notFound('Coupon not found');
    }

    let discount = 0;
    let freeShipping = false;

    if (coupon.type === 'PERCENTAGE') {
      discount = (order.subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discount = coupon.value;
    } else if (coupon.type === 'FREE_SHIPPING') {
      freeShipping = true;
      discount = 0;
    }

    if (discount > order.subtotal) {
      discount = order.subtotal;
    }

    const startTime = Date.now();
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        couponId: couponId,
        discount: discount,
        shipping: freeShipping ? 0 : order.shipping,
        total: order.subtotal - discount + (freeShipping ? 0 : order.shipping) + order.tax
      }
    });

    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    await prisma.userCoupon.upsert({
      where: {
        userId_couponId: {
          userId: session.user.id,
          couponId: couponId
        }
      },
      update: {
        usageCount: {
          increment: 1
        }
      },
      create: {
        userId: session.user.id,
        couponId: couponId,
        usageCount: 1
      }
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('coupon.apply', duration, { couponId, orderId, userId: session.user.id })
    logger.info('Coupon applied', { couponId, orderId, userId: session.user.id })

    return ApiResponse.success({
      order: updatedOrder,
      discount,
      freeShipping
    }, 'Coupon applied successfully');

  },
});

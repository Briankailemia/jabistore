import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest, schemas } from '@/lib/middleware/validator';
import logger from '@/lib/logger';

// GET /api/coupons - Get all active coupons (admin only)
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ACTIVE';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const startTime = Date.now();
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where: {
          status: status
        },
        include: {
          _count: {
            select: {
              orders: true,
              userCoupons: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.coupon.count({
        where: { status: status }
      })
    ]);
    const duration = Date.now() - startTime;

    logger.dbQuery('coupon.findMany', duration, { status, page, limit });

    return ApiResponse.success({
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  },
});

// POST /api/coupons - Create new coupon (admin only)
export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(schemas.createCoupon),
  handler: async (request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required');
    }

    const data = request.validatedData;
    
    // Validate percentage value
    if (data.type === 'PERCENTAGE' && data.value > 100) {
      return ApiResponse.error('Percentage value cannot exceed 100', 400);
    }

    const code = data.code.toUpperCase();

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existingCoupon) {
      return ApiResponse.error('Coupon code already exists', 409);
    }

    const startTime = Date.now();
    const coupon = await prisma.coupon.create({
      data: {
        code,
        name: data.name,
        description: data.description,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount || null,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        userUsageLimit: data.userUsageLimit || null,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        status: 'ACTIVE'
      }
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('coupon.create', duration);
    logger.info('Coupon created', { 
      couponId: coupon.id, 
      code: coupon.code,
      userId: session.user.id 
    });

    return ApiResponse.success(coupon, 'Coupon created successfully', 201);
  },
});

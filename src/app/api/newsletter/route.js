import { prisma } from '@/lib/prisma';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest } from '@/lib/middleware/validator';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

// POST /api/newsletter - Subscribe to newsletter
const subscribeSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().max(255, 'Name is too long').optional().nullable(),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(subscribeSchema),
  handler: async (request) => {
    const { email, name } = request.validatedData;

    // Check if email already exists
    const existingSubscription = await prisma.newsletterSubscription.findUnique({
      where: { email }
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return ApiResponse.error('Email is already subscribed to our newsletter', 409);
      } else {
        // Reactivate subscription
        const updatedSubscription = await prisma.newsletterSubscription.update({
          where: { email },
          data: {
            isActive: true,
            name: name || existingSubscription.name,
            updatedAt: new Date()
          }
        });

        logger.info('Newsletter subscription reactivated', { email });
        return ApiResponse.success(
          {
            subscription: updatedSubscription
          },
          'Welcome back! Your newsletter subscription has been reactivated.'
        );
      }
    }

    const startTime = Date.now();
    // Create new subscription
    const subscription = await prisma.newsletterSubscription.create({
      data: {
        email,
        name: name || null,
        isActive: true,
        subscribedAt: new Date()
      }
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('newsletterSubscription.create', duration, { email });
    logger.info('Newsletter subscribed', { email });

    return ApiResponse.success(
      {
        subscription
      },
      'Successfully subscribed to our newsletter!',
      201
    );
  },
});

// DELETE /api/newsletter - Unsubscribe from newsletter
export const DELETE = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return ApiResponse.error('Email is required', 400);
    }

    // Find subscription
    const subscription = await prisma.newsletterSubscription.findUnique({
      where: { email }
    });

    if (!subscription) {
      return ApiResponse.notFound('Email not found in our newsletter');
    }

    // Deactivate subscription
    await prisma.newsletterSubscription.update({
      where: { email },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('Newsletter unsubscribed', { email });
    return ApiResponse.success(null, 'Successfully unsubscribed from our newsletter.');
  },
});

// GET /api/newsletter - Get newsletter subscribers (admin only)
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const active = searchParams.get('active') !== 'false';
    const skip = (page - 1) * limit;

    const startTime = Date.now();
    const [subscriptions, total, totalActive, totalInactive, totalSubscriptions] = await Promise.all([
      prisma.newsletterSubscription.findMany({
        where: {
          isActive: active
        },
        orderBy: {
          subscribedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.newsletterSubscription.count({
        where: { isActive: active }
      }),
      prisma.newsletterSubscription.count({ where: { isActive: true } }),
      prisma.newsletterSubscription.count({ where: { isActive: false } }),
      prisma.newsletterSubscription.count(),
    ]);
    const duration = Date.now() - startTime;

    logger.dbQuery('newsletterSubscription.findMany', duration, { page, limit, active });
    logger.info('Newsletter subscriptions fetched', { page, limit, count: subscriptions.length });

    return ApiResponse.success({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalActive,
        totalInactive,
        totalSubscriptions
      }
    });
  },
});

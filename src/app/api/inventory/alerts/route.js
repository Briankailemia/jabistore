import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest } from '@/lib/middleware/validator';
import logger from '@/lib/logger';
import { z } from 'zod';

const listAlertsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20).optional(),
  active: z.coerce.boolean().default(true).optional(),
});

// GET /api/inventory/alerts - Get stock alerts for user or all (admin)
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(listAlertsSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    const { page = 1, limit = 20, active = true } = request.validatedData;
    const skip = (page - 1) * limit;

    const whereClause = {
      isActive: active,
      ...(session.user.role !== 'ADMIN' ? { userId: session.user.id } : {}),
    };

    const startTime = Date.now();
    const [alerts, total] = await Promise.all([
      prisma.stockAlert.findMany({
        where: whereClause,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              stock: true,
              price: true,
              images: {
                take: 1,
                orderBy: { order: 'asc' }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.stockAlert.count({
        where: whereClause
      })
    ]);
    const duration = Date.now() - startTime;

    const triggeredAlerts = alerts.filter(alert => 
      (alert.product?.stock ?? 0) <= alert.threshold && !alert.notified
    );

    logger.dbQuery('stockAlert.findMany', duration, { userId: session.user.id, active, page, limit });
    logger.info('Stock alerts fetched', { userId: session.user.id, count: alerts.length, triggered: triggeredAlerts.length });

    return ApiResponse.success({
      alerts,
      triggeredAlerts: triggeredAlerts.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  },
})

// POST /api/inventory/alerts - Create or update stock alert
const createAlertSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  threshold: z.coerce.number().int().positive().default(5),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(createAlertSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    const { productId, threshold } = request.validatedData;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return ApiResponse.notFound('Product not found');
    }

    const startTime = Date.now();
    // Check if alert already exists for this user and product
    const existingAlert = await prisma.stockAlert.findUnique({
      where: {
        productId_userId: {
          productId,
          userId: session.user.id
        }
      }
    });

    let result;
    if (existingAlert) {
      // Update existing alert
      result = await prisma.stockAlert.update({
        where: {
          productId_userId: {
            productId,
            userId: session.user.id
          }
        },
        data: {
          threshold,
          isActive: true,
          notified: false
        },
        include: {
          product: {
            select: {
              name: true,
              stock: true
            }
          }
        }
      });
    } else {
      // Create new alert
      result = await prisma.stockAlert.create({
        data: {
          productId,
          userId: session.user.id,
          threshold
        },
        include: {
          product: {
            select: {
              name: true,
              stock: true
            }
          }
        }
      });
    }
    const duration = Date.now() - startTime;

    logger.dbQuery(existingAlert ? 'stockAlert.update' : 'stockAlert.create', duration, { productId });
    logger.info('Stock alert saved', { userId: session.user.id, productId, threshold, updated: !!existingAlert });

    return ApiResponse.success(
      { alert: result },
      existingAlert ? 'Stock alert updated successfully' : 'Stock alert created successfully',
      existingAlert ? 200 : 201
    );
  },
})

const deleteAlertSchema = z.object({
  id: z.string().uuid('Invalid alert ID').optional(),
  productId: z.string().uuid('Invalid product ID').optional(),
}).refine(data => data.id || data.productId, {
  message: 'Alert ID or Product ID is required',
})

// DELETE /api/inventory/alerts - Delete stock alert
export const DELETE = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(deleteAlertSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    const { id, productId } = request.validatedData;

    const whereClause = id
      ? { id }
      : {
          productId_userId: {
            productId,
            userId: session.user.id
          }
        };

    // Verify ownership for non-admin users
    if (session.user.role !== 'ADMIN') {
      const alert = await prisma.stockAlert.findFirst({
        where: whereClause
      });

      if (!alert || alert.userId !== session.user.id) {
        return ApiResponse.notFound('Alert not found or access denied');
      }
    }

    const startTime = Date.now();
    await prisma.stockAlert.delete({
      where: id ? { id } : {
        productId_userId: {
          productId,
          userId: session.user.id
        }
      }
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('stockAlert.delete', duration, { id, productId, userId: session.user.id });
    logger.info('Stock alert deleted', { id, productId, userId: session.user.id });

    return ApiResponse.success(null, 'Stock alert deleted successfully');
  },
})

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest } from '@/lib/middleware/validator';
import logger from '@/lib/logger';
import { logAudit } from '@/lib/auditLogger';
import { z } from 'zod';

// GET /api/products/[id] - Fetch single product
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request, { params }) => {
    const { id: identifier } = params;

    const startTime = Date.now();
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier },
        ],
      },
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true, logo: true } },
        images: { orderBy: { order: 'asc' } },
        features: true,
        specifications: true,
        reviews: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    const duration = Date.now() - startTime;

    if (!product) {
      return ApiResponse.notFound('Product not found');
    }

    const averageRating = product.reviews.length > 0 
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    logger.dbQuery('product.findFirst', duration, { id: identifier });
    logger.info('Product fetched', { id: identifier });

    return ApiResponse.success({
      ...product,
      averageRating,
      reviewCount: product.reviews.length,
    });
  },
})

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  weight: z.number().positive().optional().nullable(),
  dimensions: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  brandId: z.string().uuid().optional().nullable(),
})

// PUT /api/products/[id] - Update product (admin only)
export const PUT = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateProductSchema),
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required');
    }

    const { id } = params;
    const data = request.validatedData;

    const startTime = Date.now();
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
      },
      include: {
        category: true,
        brand: true,
        images: true,
        features: true,
        specifications: true,
      },
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('product.update', duration, { productId: id, adminId: session.user.id });
    logger.info('Product updated', { productId: id, adminId: session.user.id });

    await logAudit({
      action: 'PRODUCT_UPDATE',
      userId: session.user.id,
      entityType: 'product',
      entityId: id,
      details: { updatedFields: Object.keys(data || {}) },
      request,
    });

    return ApiResponse.success(product, 'Product updated successfully');
  },
})

// DELETE /api/products/[id] - Delete product (admin only)
export const DELETE = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required');
    }

    const { id } = params;

    const startTime = Date.now();
    await prisma.product.delete({
      where: { id },
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('product.delete', duration, { productId: id, adminId: session.user.id });
    logger.info('Product deleted', { productId: id, adminId: session.user.id });

    await logAudit({
      action: 'PRODUCT_DELETE',
      userId: session.user.id,
      entityType: 'product',
      entityId: id,
      request,
    });

    return ApiResponse.success(null, 'Product deleted successfully');
  },
})

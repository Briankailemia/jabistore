import { prisma } from '@/lib/prisma';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest } from '@/lib/middleware/validator';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import logger from '@/lib/logger';
import { z } from 'zod';

// GET /api/categories - Fetch categories
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';
    const includeProducts = searchParams.get('includeProducts') === 'true';

    const where = featured ? { featured: true } : {};

    const startTime = Date.now();
    const categories = await prisma.category.findMany({
      where,
      include: {
        ...(includeProducts && {
          products: {
            where: { published: true },
            take: 5,
            select: { id: true, name: true, price: true, images: { take: 1 } },
          },
        }),
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('category.findMany', duration, { featured, includeProducts });
    logger.info('Categories fetched', { count: categories.length });

    return ApiResponse.success(categories);
  },
});

// POST /api/categories - Create category (admin only)
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255, 'Category name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(255, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  image: z.string().url('Invalid image URL').optional().nullable(),
  featured: z.boolean().default(false),
  parentId: z.string().uuid('Invalid parent category ID').optional().nullable(),
});

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(createCategorySchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required');
    }

    const data = request.validatedData;

    // Check if category name or slug already exists
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name: data.name },
          { slug: data.slug },
        ],
      },
    });

    if (existing) {
      return ApiResponse.error(
        existing.name === data.name ? 'Category name already exists' : 'Category slug already exists',
        409
      );
    }

    // Validate parent category if provided
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        return ApiResponse.notFound('Parent category not found');
      }
    }

    const startTime = Date.now();
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        image: data.image,
        featured: data.featured,
        parentId: data.parentId,
      },
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('category.create', duration);
    logger.info('Category created', { 
      categoryId: category.id, 
      name: category.name,
      userId: session.user.id 
    });

    return ApiResponse.success(category, 'Category created successfully', 201);
  },
});

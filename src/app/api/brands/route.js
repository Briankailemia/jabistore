import { prisma } from '@/lib/prisma';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest } from '@/lib/middleware/validator';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import logger from '@/lib/logger';
import { z } from 'zod';

// GET /api/brands - Fetch brands
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    const where = featured ? { featured: true } : {};

    const startTime = Date.now();
    const brands = await prisma.brand.findMany({
      where,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('brand.findMany', duration, { featured });
    logger.info('Brands fetched', { count: brands.length });

    return ApiResponse.success(brands);
  },
});

// POST /api/brands - Create brand (admin only)
const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(255, 'Brand name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(255, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  logo: z.string().url('Invalid logo URL').optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  featured: z.boolean().default(false),
});

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(createBrandSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required');
    }

    const data = request.validatedData;

    // Check if brand name or slug already exists
    const existing = await prisma.brand.findFirst({
      where: {
        OR: [
          { name: data.name },
          { slug: data.slug },
        ],
      },
    });

    if (existing) {
      return ApiResponse.error(
        existing.name === data.name ? 'Brand name already exists' : 'Brand slug already exists',
        409
      );
    }

    const startTime = Date.now();
    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        logo: data.logo,
        website: data.website,
        featured: data.featured,
      },
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('brand.create', duration);
    logger.info('Brand created', { 
      brandId: brand.id, 
      name: brand.name,
      userId: session.user.id 
    });

    return ApiResponse.success(brand, 'Brand created successfully', 201);
  },
});

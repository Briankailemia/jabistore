import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest, schemas } from '@/lib/middleware/validator';
import logger from '@/lib/logger';

// GET /api/products - Fetch products with filtering and pagination
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 100);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      published: true,
      ...(category && { category: { slug: category } }),
      ...(brand && { brand: { slug: brand } }),
      ...(featured && { featured: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build orderBy clause
    const orderBy = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const startTime = Date.now();
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
          reviews: { select: { rating: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);
    const duration = Date.now() - startTime;

    logger.dbQuery('product.findMany', duration, { page, limit, category, brand });

    // Calculate average ratings
    const productsWithRatings = products.map(product => ({
      ...product,
      averageRating: product.reviews.length > 0 
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews.length,
    }));

    return ApiResponse.success({
      products: productsWithRatings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
});

// POST /api/products - Create new product (admin only)
export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(schemas.createProduct),
  handler: async (request) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return ApiResponse.unauthorized();
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required');
    }

    const data = request.validatedData;
    
    const startTime = Date.now();
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        sku: data.sku,
        price: data.price,
        originalPrice: data.originalPrice,
        stock: data.stock || 0,
        featured: data.featured || false,
        published: data.published !== false,
        weight: data.weight,
        dimensions: data.dimensions,
        categoryId: data.categoryId,
        brandId: data.brandId,
        images: {
          create: data.images?.map((img, index) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: index === 0,
            order: index,
          })) || [],
        },
        features: {
          create: data.features?.map(feature => ({ name: feature })) || [],
        },
        specifications: {
          create: data.specifications?.map(spec => ({
            name: spec.name,
            value: spec.value,
          })) || [],
        },
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

    logger.dbQuery('product.create', duration);
    logger.info('Product created', { productId: product.id, userId: session.user.id, sku: product.sku });

    return ApiResponse.success(product, 'Product created successfully', 201);
  },
});

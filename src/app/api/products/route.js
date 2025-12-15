import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
    
    // Validate categoryId and brandId exist
    if (!data.categoryId || !data.brandId) {
      return ApiResponse.badRequest('Category and brand are required');
    }

    // Ensure arrays are properly initialized with validation
    let images = [];
    let features = [];
    let specifications = [];
    
    try {
      // Handle images - optional, defaults to empty array
      if (data.images) {
        if (Array.isArray(data.images)) {
          images = data.images.filter(img => img !== null && img !== undefined && img !== '');
        } else if (typeof data.images === 'object' && data.images !== null) {
          // Single image object
          images = [data.images];
        }
      }
      // Ensure images is always an array (can be empty)
      if (!Array.isArray(images)) {
        images = [];
      }
      
      // Handle features - optional, defaults to empty array
      if (data.features) {
        if (Array.isArray(data.features)) {
          features = data.features.filter(f => f !== null && f !== undefined && f !== '');
        } else if (typeof data.features === 'string') {
          features = [data.features];
        }
      }
      // Ensure features is always an array
      if (!Array.isArray(features)) {
        features = [];
      }
      
      // Handle specifications - optional, defaults to empty array
      if (data.specifications) {
        if (Array.isArray(data.specifications)) {
          specifications = data.specifications.filter(s => s !== null && s !== undefined);
        } else if (typeof data.specifications === 'object' && data.specifications !== null) {
          specifications = [data.specifications];
        }
      }
      // Ensure specifications is always an array
      if (!Array.isArray(specifications)) {
        specifications = [];
      }
    } catch (arrayError) {
      logger.error('Error processing product arrays', {
        error: arrayError.message,
        stack: arrayError.stack,
        images: data.images,
        features: data.features,
        specifications: data.specifications,
      });
      return ApiResponse.badRequest('Invalid data format for images, features, or specifications');
    }

    // Verify category and brand exist
    const [category, brand] = await Promise.all([
      prisma.category.findUnique({ where: { id: data.categoryId } }),
      prisma.brand.findUnique({ where: { id: data.brandId } }),
    ]);

    if (!category) {
      return ApiResponse.badRequest('Invalid category selected');
    }

    if (!brand) {
      return ApiResponse.badRequest('Invalid brand selected');
    }

    // Check for duplicate slug or SKU before creating
    const [existingSlug, existingSku] = await Promise.all([
      prisma.product.findUnique({ where: { slug: data.slug } }),
      prisma.product.findUnique({ where: { sku: data.sku } }),
    ]);

    if (existingSlug) {
      return ApiResponse.badRequest(`A product with slug "${data.slug}" already exists. Please use a different slug.`);
    }

    if (existingSku) {
      return ApiResponse.badRequest(`A product with SKU "${data.sku}" already exists. Please use a different SKU.`);
    }

    const startTime = Date.now();
    let product;
    try {
      // Validate and prepare data before creating
      // Images are optional, but if provided, they must be valid
      if (Array.isArray(images) && images.length > 0) {
        if (!images.every(img => img && typeof img === 'object' && img.url)) {
          return ApiResponse.badRequest('All images must have a valid URL');
        }
      }

      // Ensure features and specifications are arrays (defensive check)
      const safeFeatures = (Array.isArray(features) ? features : []) || [];
      const safeSpecifications = (Array.isArray(specifications) ? specifications : []) || [];
      const safeImages = (Array.isArray(images) ? images : []) || [];

      // Prepare filtered features and specifications
      const validFeatures = (safeFeatures || [])
        .filter(feature => {
          if (!feature) return false;
          if (typeof feature === 'string') return feature.trim() !== '';
          if (typeof feature === 'object' && feature.name) return feature.name.trim() !== '';
          return false;
        })
        .map(feature => ({ 
          name: typeof feature === 'string' ? feature.trim() : (feature.name?.trim() || '') 
        }));

      const validSpecifications = (safeSpecifications || [])
        .filter(spec => {
          if (!spec || typeof spec !== 'object') return false;
          return spec.name && spec.value && spec.name.trim() !== '' && spec.value.trim() !== '';
        })
        .map(spec => ({
          name: spec.name.trim(),
          value: spec.value.trim(),
        }));

      // Build the product data object
      const productData = {
        name: data.name,
        // Handle description: use description if provided, otherwise shortDescription, otherwise null
        description: (data.description && data.description.trim()) 
          ? data.description.trim() 
          : (data.shortDescription && data.shortDescription.trim()) 
            ? data.shortDescription.trim() 
            : null,
        slug: data.slug,
        sku: data.sku,
        price: data.price,
        // Convert undefined/empty to null for optional fields
        originalPrice: data.originalPrice ?? null,
        stock: data.stock || 0,
        weight: data.weight ?? null,
        dimensions: (data.dimensions && data.dimensions.trim()) ? data.dimensions.trim() : null,
        featured: data.featured || false,
        published: data.published !== false,
        categoryId: data.categoryId,
        brandId: data.brandId,
      };

      // Only add images if there are valid ones
      if (Array.isArray(safeImages) && safeImages.length > 0) {
        productData.images = {
          create: safeImages.map((img, index) => {
            if (!img || typeof img !== 'object' || !img.url) {
              throw new Error(`Invalid image data at index ${index}: missing URL`);
            }
            return {
              url: img.url,
              alt: img.alt || data.name || 'Product image',
              isPrimary: img.isPrimary !== undefined ? img.isPrimary : (index === 0),
              order: index,
            };
          }),
        };
      }

      // Only add features if there are valid ones
      if (validFeatures.length > 0) {
        productData.features = {
          create: validFeatures,
        };
      }

      // Only add specifications if there are valid ones
      if (validSpecifications.length > 0) {
        productData.specifications = {
          create: validSpecifications,
        };
      }

      product = await prisma.product.create({
        data: productData,
        include: {
          category: true,
          brand: true,
          images: { orderBy: { order: 'asc' } },
          features: true,
          specifications: true,
        },
      });
    } catch (dbError) {
      // Handle Prisma-specific errors
      logger.error('Database error creating product', dbError);
      
      if (dbError.code === 'P2002') {
        // Unique constraint violation
        const target = dbError.meta?.target;
        if (Array.isArray(target)) {
          const field = target[0];
          return ApiResponse.badRequest(`A product with this ${field} already exists. Please use a different ${field}.`);
        }
        return ApiResponse.badRequest('A product with this information already exists. Please check for duplicates.');
      }
      
      if (dbError.code === 'P2003') {
        // Foreign key constraint violation
        return ApiResponse.badRequest('Invalid category or brand selected. Please select valid options.');
      }
      
      // Re-throw to be caught by error handler
      throw dbError;
    }
    const duration = Date.now() - startTime;

    logger.dbQuery('product.create', duration);
    logger.info('Product created', { productId: product.id, userId: session.user.id, sku: product.sku });

    return ApiResponse.success(product, 'Product created successfully', 201);
  },
});

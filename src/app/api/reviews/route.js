import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest, schemas } from '@/lib/middleware/validator'
import logger from '@/lib/logger'

// GET /api/reviews - Get reviews with optional product filter (admin can see all, users see public)
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))

    const where = productId ? { productId } : {}

    const startTime = Date.now()
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
      where,
      include: {
        user: {
          select: { name: true, avatar: true }
        },
        product: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
      }),
      prisma.review.count({ where })
    ])
    const duration = Date.now() - startTime

    logger.dbQuery('review.findMany', duration, { productId, limit, offset })

    return ApiResponse.success({
      reviews,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  },
})

// POST /api/reviews - Create a new review
export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(schemas.createReview),
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const { productId, rating, title, comment } = request.validatedData

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, published: true }
    })

    if (!product) {
      return ApiResponse.notFound('Product not found')
    }

    if (!product.published) {
      return ApiResponse.error('Cannot review unpublished products', 400)
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: productId,
          userId: session.user.id
        }
      }
    })

    if (existingReview) {
      return ApiResponse.error('You have already reviewed this product', 409)
    }

    const startTime = Date.now()
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId: productId,
        rating: rating,
        title: title || null,
        comment: comment || null
      },
      include: {
        user: {
          select: { name: true, avatar: true }
        }
      }
    })
    const duration = Date.now() - startTime

    logger.dbQuery('review.create', duration)
    logger.info('Review created', { 
      reviewId: review.id,
      userId: session.user.id, 
      productId, 
      rating 
    })

    return ApiResponse.success(review, 'Review created successfully', 201)
  },
})

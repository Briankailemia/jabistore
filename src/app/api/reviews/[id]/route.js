import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { z } from 'zod'

const updateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Valid rating (1-5) is required').max(5),
  title: z.string().max(255).optional(),
  comment: z.string().max(2000).optional(),
})

// PUT /api/reviews/[id] - Update a review
export const PUT = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateReviewSchema),
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const { id } = params
    const { rating, title, comment } = request.validatedData

    // Verify review belongs to user
    const existingReview = await prisma.review.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!existingReview) {
      return ApiResponse.notFound('Review not found or unauthorized')
    }

    const startTime = Date.now()
    const updatedReview = await prisma.review.update({
      where: { id: id },
      data: {
        rating: rating,
        title: title || '',
        comment: comment || ''
      },
      include: {
        user: {
          select: { name: true, avatar: true }
        }
      }
    })
    const duration = Date.now() - startTime

    logger.dbQuery('review.update', duration, { reviewId: id, userId: session.user.id })
    logger.info('Review updated', { reviewId: id, userId: session.user.id })

    return ApiResponse.success(updatedReview)
  },
})

// DELETE /api/reviews/[id] - Delete a review (user or admin)
export const DELETE = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const { id } = params

    const existingReview = await prisma.review.findUnique({
      where: { id: id }
    })

    if (!existingReview) {
      return ApiResponse.notFound('Review not found')
    }

    if (existingReview.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Unauthorized')
    }

    const startTime = Date.now()
    await prisma.review.delete({
      where: { id: id }
    })
    const duration = Date.now() - startTime

    logger.dbQuery('review.delete', duration, { reviewId: id, userId: session.user.id })
    logger.info('Review deleted', { reviewId: id, userId: session.user.id })

    return ApiResponse.success(null, 'Review deleted successfully')
  },
})

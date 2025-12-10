import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import logger from '@/lib/logger'

// DELETE /api/wishlist/[id] - Remove item from wishlist
export const DELETE = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const { id } = params

    // Verify wishlist item belongs to user
    const wishlistItem = await prisma.wishlistItem.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!wishlistItem) {
      return ApiResponse.notFound('Wishlist item not found')
    }

    const startTime = Date.now()
    await prisma.wishlistItem.delete({
      where: { id: id }
    })
    const duration = Date.now() - startTime

    logger.dbQuery('wishlistItem.delete', duration)
    logger.info('Wishlist item removed', { userId: session.user.id, wishlistItemId: id })

    return ApiResponse.success(null, 'Item removed from wishlist')
  },
})

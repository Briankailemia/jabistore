import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

// GET /api/wishlist - Get user's wishlist items
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    try {
      const session = await getServerSession(authOptions)
      
      // Return empty array for unauthenticated users (similar to cart)
      if (!session?.user?.id) {
        return ApiResponse.success([])
      }

      const startTime = Date.now()
      const wishlistItems = await prisma.wishlistItem.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          product: {
            include: {
              images: {
                orderBy: { order: 'asc' },
                take: 1
              },
              category: {
                select: { name: true }
              },
              brand: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      const duration = Date.now() - startTime

      logger.dbQuery('wishlistItem.findMany', duration, { userId: session.user.id })
      logger.info('Wishlist fetched', { userId: session.user.id, itemCount: wishlistItems.length })

      return ApiResponse.success(wishlistItems)
    } catch (error) {
      logger.error('Error fetching wishlist:', error)
      // Return empty array on error to prevent UI breakage
      return ApiResponse.success([])
    }
  },
})

// POST /api/wishlist - Add item to wishlist
const addToWishlistSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(addToWishlistSchema),
  handler: async (request) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return ApiResponse.unauthorized()
      }

      const { productId } = request.validatedData

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, published: true }
      })

      if (!product) {
        return ApiResponse.notFound('Product not found')
      }

      if (!product.published) {
        return ApiResponse.error('Cannot add unpublished products to wishlist', 400)
      }

      // Check if item already exists in wishlist
      const existingWishlistItem = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: productId
          }
        }
      })

      if (existingWishlistItem) {
        return ApiResponse.error('Product already in wishlist', 409)
      }

      const startTime = Date.now()
      const wishlistItem = await prisma.wishlistItem.create({
        data: {
          userId: session.user.id,
          productId: productId
        },
        include: {
          product: {
            include: {
              images: {
                orderBy: { order: 'asc' },
                take: 1
              }
            }
          }
        }
      })
      const duration = Date.now() - startTime

      logger.dbQuery('wishlistItem.create', duration)
      logger.info('Item added to wishlist', { 
        userId: session.user.id, 
        productId 
      })

      return ApiResponse.success(wishlistItem, 'Item added to wishlist', 201)
    } catch (error) {
      logger.error('Error adding to wishlist:', error)
      return ApiResponse.error('Failed to add item to wishlist. Please try again.', 500)
    }
  },
})

// DELETE /api/wishlist - Clear entire wishlist
export const DELETE = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const startTime = Date.now()
    const result = await prisma.wishlistItem.deleteMany({
      where: {
        userId: session.user.id
      }
    })
    const duration = Date.now() - startTime

    logger.dbQuery('wishlistItem.deleteMany', duration)
    logger.info('Wishlist cleared', { userId: session.user.id, itemsDeleted: result.count })

    return ApiResponse.success({ count: result.count }, 'Wishlist cleared successfully')
  },
})

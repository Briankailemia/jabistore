import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

// GET /api/cart - Get user's cart items
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    try {
      const session = await getServerSession(authOptions)
      
      // Return empty cart for unauthenticated users instead of 401
      if (!session?.user?.id) {
        return ApiResponse.success([])
      }

      const startTime = Date.now()
      const cartItems = await prisma.cartItem.findMany({
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
        }
      })
      const duration = Date.now() - startTime

      logger.dbQuery('cartItem.findMany', duration, { userId: session.user.id })
      logger.info('Cart fetched', { userId: session.user.id, itemCount: cartItems.length })

      return ApiResponse.success(cartItems)
    } catch (error) {
      logger.error('Error fetching cart:', error)
      // Return empty array on error to prevent UI breakage
      return ApiResponse.success([])
    }
  },
})

// POST /api/cart - Add item to cart
// Product IDs are cuid strings (not UUID). Accept any non-empty string.
const addToCartSchema = z.object({
  productId: z.string().min(1, 'Invalid product ID'),
  quantity: z.number().int().positive().default(1),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(addToCartSchema),
  handler: async (request) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return ApiResponse.unauthorized()
      }

      const { productId, quantity = 1 } = request.validatedData

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, stock: true, published: true }
      })

      if (!product) {
        return ApiResponse.notFound('Product not found')
      }

      if (!product.published) {
        return ApiResponse.error('Product is not available', 400)
      }

      if (product.stock < quantity) {
        return ApiResponse.error(`Only ${product.stock} items available in stock`, 400)
      }

      // Check if item already exists in cart
      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: productId
          }
        }
      })

      let cartItem
      const startTime = Date.now()

      if (existingCartItem) {
        // Update quantity if item exists
        const newQuantity = existingCartItem.quantity + quantity
        if (newQuantity > product.stock) {
          return ApiResponse.error(`Cannot add more items. Only ${product.stock} available in stock`, 400)
        }

        cartItem = await prisma.cartItem.update({
          where: {
            id: existingCartItem.id
          },
          data: {
            quantity: newQuantity
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
      } else {
        // Create new cart item
        cartItem = await prisma.cartItem.create({
          data: {
            userId: session.user.id,
            productId: productId,
            quantity: quantity
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
      }
      const duration = Date.now() - startTime

      logger.dbQuery(existingCartItem ? 'cartItem.update' : 'cartItem.create', duration)
      logger.info('Item added to cart', { 
        userId: session.user.id, 
        productId, 
        quantity: cartItem.quantity 
      })

      return ApiResponse.success(cartItem, 'Item added to cart', 201)
    } catch (error) {
      logger.error('Error adding to cart:', error)
      return ApiResponse.error('Failed to add item to cart. Please try again.', 500)
    }
  },
})

// DELETE /api/cart - Clear entire cart
export const DELETE = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const startTime = Date.now()
    const result = await prisma.cartItem.deleteMany({
      where: {
        userId: session.user.id
      }
    })
    const duration = Date.now() - startTime

    logger.dbQuery('cartItem.deleteMany', duration)
    logger.info('Cart cleared', { userId: session.user.id, itemsDeleted: result.count })

    return ApiResponse.success({ count: result.count }, 'Cart cleared successfully')
  },
})

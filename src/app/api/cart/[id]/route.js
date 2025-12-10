import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

// PUT /api/cart/[id] - Update cart item quantity
const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer'),
})

export const PUT = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateCartItemSchema),
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const { id } = params
    const { quantity } = request.validatedData

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        product: {
          select: { stock: true }
        }
      }
    })

    if (!cartItem) {
      return ApiResponse.notFound('Cart item not found')
    }

    // Check stock availability
    if (quantity > cartItem.product.stock) {
      return ApiResponse.error(`Only ${cartItem.product.stock} items available in stock`, 400)
    }

    const startTime = Date.now()
    const updatedCartItem = await prisma.cartItem.update({
      where: { id: id },
      data: { quantity: quantity },
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

    logger.dbQuery('cartItem.update', duration)
    logger.info('Cart item updated', { 
      userId: session.user.id, 
      cartItemId: id, 
      quantity 
    })

    return ApiResponse.success(updatedCartItem, 'Cart item updated')
  },
})

// DELETE /api/cart/[id] - Remove item from cart
export const DELETE = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const { id } = params

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!cartItem) {
      return ApiResponse.notFound('Cart item not found')
    }

    const startTime = Date.now()
    await prisma.cartItem.delete({
      where: { id: id }
    })
    const duration = Date.now() - startTime

    logger.dbQuery('cartItem.delete', duration)
    logger.info('Cart item removed', { userId: session.user.id, cartItemId: id })

    return ApiResponse.success(null, 'Item removed from cart')
  },
})

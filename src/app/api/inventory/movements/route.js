import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

const listMovementsSchema = z.object({
  productId: z.string().uuid('Invalid product ID').optional(),
})

// GET /api/inventory/movements - List movements (ADMIN or WAREHOUSE)
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(listMovementsSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'WAREHOUSE') {
      return ApiResponse.forbidden('Inventory access required')
    }

    const { productId } = request.validatedData

    const where = {}
    if (productId) where.productId = productId

    const startTime = Date.now()
    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    const duration = Date.now() - startTime

    logger.dbQuery('inventoryMovement.findMany', duration, { userId: session.user.id, productId })
    logger.info('Inventory movements fetched', { userId: session.user.id, count: movements.length })

    return ApiResponse.success({ movements })
  },
})

const createMovementSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().refine((val) => val !== 0, { message: 'Quantity must be non-zero' }),
  reason: z.string().max(255).optional().nullable(),
  reference: z.string().max(255).optional().nullable(),
})

// POST /api/inventory/movements - Create movement & adjust stock (ADMIN or WAREHOUSE)
export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(createMovementSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'WAREHOUSE') {
      return ApiResponse.forbidden('Inventory access required')
    }

    const { productId, quantity, reason, reference } = request.validatedData

    try {
      const startTime = Date.now()
      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { id: true, stock: true },
        })

        if (!product) {
          throw new Error('Product not found')
        }

        const newStock = (product.stock ?? 0) + quantity
        if (newStock < 0) {
          throw new Error('Resulting stock would be negative')
        }

        const movement = await tx.inventoryMovement.create({
          data: {
            productId,
            quantity,
            reason: reason || null,
            reference: reference || null,
            createdById: session.user.id,
          },
        })

        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: { stock: newStock },
          select: { id: true, stock: true },
        })

        return { movement, product: updatedProduct }
      })
      const duration = Date.now() - startTime

      logger.dbQuery('inventoryMovement.create', duration, { productId, quantity })
      logger.info('Inventory adjusted', { productId, quantity, userId: session.user.id })

      return ApiResponse.success(result, 'Inventory adjusted successfully')
    } catch (error) {
      logger.error('Create inventory movement error', error, { productId, quantity, userId: session.user.id })
      const message =
        error?.message === 'Product not found' || error?.message === 'Resulting stock would be negative'
          ? error.message
          : 'Failed to adjust inventory'
      return ApiResponse.error(message, 400)
    }
  },
})

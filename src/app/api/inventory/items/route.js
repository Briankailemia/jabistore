import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

const listInventoryItemsSchema = z.object({
  search: z.string().max(255).optional(),
  lowStock: z.coerce.boolean().default(false).optional(),
})

// GET /api/inventory/items - List inventory items (ADMIN or WAREHOUSE)
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(listInventoryItemsSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'WAREHOUSE') {
      return ApiResponse.forbidden('Inventory access required')
    }

    const { search = '', lowStock = false } = request.validatedData

    const where = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (lowStock) {
      where.stock = { lte: 5 }
    }

    const startTime = Date.now()
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        featured: true,
        published: true,
        price: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    })
    const duration = Date.now() - startTime

    const items = products.map((p) => ({
      ...p,
      lowStock: (p.stock ?? 0) <= 5,
    }))

    logger.dbQuery('product.findMany', duration, { userId: session.user.id, search, lowStock })
    logger.info('Inventory items fetched', { userId: session.user.id, count: items.length })

    return ApiResponse.success({ items })
  },
})

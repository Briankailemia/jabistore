import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

const inventoryReportSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

// GET /api/reports/inventory - Inventory usage and top movers
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(inventoryReportSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'WAREHOUSE') {
      return ApiResponse.forbidden('Inventory report access required')
    }

    const { from, to } = request.validatedData

    let fromDate = from ? new Date(from) : undefined
    let toDate = to ? new Date(to) : undefined
    if (fromDate && isNaN(fromDate.getTime())) fromDate = undefined
    if (toDate && isNaN(toDate.getTime())) toDate = undefined

    if ((from || to) && !fromDate && !toDate) {
      return ApiResponse.error('Invalid date range filters', 400)
    }
    if (fromDate && toDate && fromDate > toDate) {
      const tmp = fromDate
      fromDate = toDate
      toDate = tmp
    }

    const where = {
      order: {
        paymentStatus: 'COMPLETED',
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {}),
              },
            }
          : {}),
      },
    }

    const startTime = Date.now()
    const items = await prisma.orderItem.findMany({
      where,
      select: {
        productId: true,
        quantity: true,
        price: true,
        product: {
          select: {
            name: true,
            sku: true,
            stock: true,
          },
        },
      },
    })
    const duration = Date.now() - startTime

    const byProduct = new Map()

    for (const item of items) {
      const key = item.productId
      const current =
        byProduct.get(key) || {
          productId: key,
          name: item.product?.name || 'Unknown',
          sku: item.product?.sku || '',
          soldQty: 0,
          revenue: 0,
          currentStock: item.product?.stock ?? 0,
        }
      current.soldQty += item.quantity
      current.revenue += Number(item.price) * item.quantity
      byProduct.set(key, current)
    }

    const products = Array.from(byProduct.values()).sort((a, b) => b.soldQty - a.soldQty)

    logger.dbQuery('orderItem.findMany', duration, { from: fromDate, to: toDate })
    logger.info('Inventory report generated', { userId: session.user.id, productCount: products.length })

    return ApiResponse.success({ products })
  },
})

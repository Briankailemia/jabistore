import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

const salesReportSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day').optional(),
})

// GET /api/reports/sales - Sales aggregated over time
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(salesReportSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const { from, to, groupBy: groupByRaw = 'day' } = request.validatedData

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
      paymentStatus: 'COMPLETED',
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    }

    const startTime = Date.now()
    const orders = await prisma.order.findMany({
      where,
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    const duration = Date.now() - startTime

    const buckets = new Map()

    const keyFor = (d) => {
      const dt = new Date(d)
      if (groupByRaw === 'month') {
        return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`
      }
      if (groupByRaw === 'week') {
        // ISO week: approximate by year + week number
        const tmp = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()))
        const dayNum = tmp.getUTCDay() || 7
        tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
        const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
        const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7)
        return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
      }
      // default day
      return dt.toISOString().slice(0, 10)
    }

    for (const o of orders) {
      const key = keyFor(o.createdAt)
      const current = buckets.get(key) || { bucket: key, orders: 0, revenue: 0 }
      current.orders += 1
      current.revenue += o.total || 0
      buckets.set(key, current)
    }

    const points = Array.from(buckets.values()).sort((a, b) => (a.bucket > b.bucket ? 1 : -1))

    logger.dbQuery('order.findMany', duration, { from: fromDate, to: toDate, groupBy: groupByRaw })
    logger.info('Sales report generated', { userId: session.user.id, points: points.length })

    return ApiResponse.success({ points })
  },
})

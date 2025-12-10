import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import logger from '@/lib/logger'

// GET /api/customers - Aggregated customer view (admin only)
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit

    const where = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const startTime = Date.now()
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const userIds = users.map(u => u.id)
    const orderAggregates = userIds.length
      ? await prisma.order.groupBy({
          by: ['userId'],
          where: { userId: { in: userIds }, paymentStatus: 'COMPLETED' },
          _sum: { total: true },
          _max: { createdAt: true },
        })
      : []

    const orderMap = new Map(orderAggregates.map(o => [o.userId, o]))

    const customers = users.map((user) => {
      const agg = orderMap.get(user.id)
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        totalOrders: user._count.orders,
        totalSpent: agg?._sum.total || 0,
        lastOrderAt: agg?._max.createdAt || null,
      }
    })
    const duration = Date.now() - startTime

    logger.dbQuery('user.findMany', duration, { page, limit, search })
    logger.info('Customers fetched', { count: customers.length, total })

    return ApiResponse.success({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  },
})

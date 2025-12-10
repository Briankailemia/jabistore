import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import logger from '@/lib/logger'

// GET /api/users - Get all users (admin only)
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const search = searchParams.get('search')?.trim()
    const role = searchParams.get('role')
    const skip = (page - 1) * limit

    const where = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (role && ['USER', 'ADMIN', 'MODERATOR'].includes(role)) {
      where.role = role
    }

    const startTime = Date.now()
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
              reviews: true,
              cartItems: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    // Calculate total spent for each user (optimized with single query)
    const userIds = users.map(u => u.id)
    const completedOrders = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        paymentStatus: 'COMPLETED',
      },
      _sum: {
        total: true,
      },
    })

    const totalSpentMap = new Map(
      completedOrders.map(o => [o.userId, o._sum.total || 0])
    )

    const usersWithStats = users.map((user) => ({
      ...user,
      totalSpent: totalSpentMap.get(user.id) || 0,
      totalOrders: user._count.orders,
      totalReviews: user._count.reviews,
    }))
    const duration = Date.now() - startTime

    logger.dbQuery('user.findMany', duration, { page, limit, search, role })
    logger.info('Users fetched', { 
      userId: session.user.id, 
      count: users.length,
      total 
    })

    return ApiResponse.success({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  },
})


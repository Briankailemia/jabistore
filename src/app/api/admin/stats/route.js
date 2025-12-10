import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import logger from '@/lib/logger'

// GET /api/admin/stats - Get admin dashboard statistics
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

    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const todayEnd = new Date(now.setHours(23, 59, 59, 999))
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const startTime = Date.now()
    const [
      totalUsers,
      newUsersToday,
      totalProducts,
      totalCategories,
      totalBrands,
      totalOrders,
      pendingOrders,
      allOrders,
      lastMonthOrders,
      thisMonthOrders,
      lowStockCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.product.count(),
      prisma.category.count(),
      prisma.brand.count(),
      prisma.order.count(),
      prisma.order.count({
        where: { status: 'PENDING' },
      }),
      prisma.order.findMany({
        where: {
          paymentStatus: 'COMPLETED',
        },
        select: {
          total: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        select: {
          total: true,
        },
      }),
      prisma.order.findMany({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: thisMonthStart,
          },
        },
        select: {
          total: true,
        },
      }),
      prisma.product.count({
        where: { stock: { lte: 5 } },
      }),
    ])

    const duration = Date.now() - startTime

    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0)

    const revenueGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0

    logger.dbQuery('admin.stats', duration, { adminId: session.user.id })
    logger.info('Admin stats fetched', { adminId: session.user.id })

    return ApiResponse.success({
      totalUsers,
      newUsersToday,
      totalProducts,
      totalCategories,
      totalBrands,
      totalOrders,
      pendingOrders,
      lowStockProducts: lowStockCount,
      totalRevenue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      thisMonthRevenue,
      lastMonthRevenue,
    })
  },
})


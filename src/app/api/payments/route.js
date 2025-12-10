import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

const paymentsQuerySchema = z.object({
  status: z.enum(['PENDING','COMPLETED','FAILED','REFUNDED']).optional(),
  provider: z.enum(['MPESA','CARD','CASH']).optional(),
  method: z.enum(['MPESA','CARD','CASH']).optional(),
  orderId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

// GET /api/payments - List payments (admin only)
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(paymentsQuerySchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const { status, provider, method, orderId, from, to } = request.validatedData

    const where = {}
    if (status) where.status = status
    if (provider) where.provider = provider
    if (method) where.method = method
    if (orderId) where.orderId = orderId

    let fromDate
    let toDate
    if (from) {
      const d = new Date(`${from}T00:00:00.000Z`)
      if (!isNaN(d.getTime())) fromDate = d
    }
    if (to) {
      const d = new Date(`${to}T23:59:59.999Z`)
      if (!isNaN(d.getTime())) toDate = d
    }

    if ((from || to) && !fromDate && !toDate) {
      return ApiResponse.error('Invalid date range filters', 400)
    }

    if (fromDate && toDate && fromDate > toDate) {
      const tmp = fromDate
      fromDate = toDate
      toDate = tmp
    }

    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) where.createdAt.gte = fromDate
      if (toDate) where.createdAt.lte = toDate
    }

    const startTime = Date.now()
    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    const duration = Date.now() - startTime

    logger.dbQuery('payment.findMany', duration, { ...request.validatedData })
    logger.info('Payments fetched', { count: payments.length, adminId: session.user.id })

    return ApiResponse.success({ payments })
  },
})

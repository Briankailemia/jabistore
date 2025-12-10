import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import logger from '@/lib/logger'

// POST /api/orders/[id]/refund - Process refund for an order (admin only)
export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
    })

    if (!order) {
      return ApiResponse.notFound('Order not found')
    }

    if (order.paymentStatus !== 'COMPLETED') {
      return ApiResponse.error('Only completed orders can be refunded', 400)
    }

    const startTime = Date.now()
    // Update order status to refunded
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
        notes: order.notes 
          ? `${order.notes}\n\nRefund processed on ${new Date().toISOString()}`
          : `Refund processed on ${new Date().toISOString()}`,
      },
    })
    const duration = Date.now() - startTime

    logger.dbQuery('order.update', duration, { orderId: params.id, action: 'refund' })
    logger.info('Order refunded', { orderId: params.id, adminId: session.user.id })

    // TODO: Integrate with payment gateway (Stripe/M-Pesa) to process actual refund

    return ApiResponse.success({
      order: updatedOrder,
    }, 'Refund processed successfully')
  },
})


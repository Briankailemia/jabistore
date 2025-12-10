import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

/**
 * Check M-Pesa Payment Status
 * Polls the order status to check if payment has been completed
 */
const mpesaStatusSchema = z.object({
  orderId: z.string().uuid('Order ID is required'),
})

export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(mpesaStatusSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const { orderId } = request.validatedData
    
    const startTime = Date.now()
    // Get order with payment status
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id // Ensure user can only check their own orders
      },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        status: true,
        mpesaReceiptNumber: true,
        paymentReference: true,
        total: true,
        createdAt: true,
        updatedAt: true
      }
    })
    const duration = Date.now() - startTime

    if (!order) {
      return ApiResponse.notFound('Order not found')
    }

    logger.dbQuery('order.findFirst', duration, { orderId, userId: session.user.id })
    logger.info('M-Pesa status fetched', { orderId: order.id, paymentStatus: order.paymentStatus })

    return ApiResponse.success({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      mpesaReceiptNumber: order.mpesaReceiptNumber,
      checkoutRequestId: order.paymentReference,
      isPaid: order.paymentStatus === 'COMPLETED',
      isPending: order.paymentStatus === 'PENDING',
      isFailed: order.paymentStatus === 'FAILED'
    })
  },
})


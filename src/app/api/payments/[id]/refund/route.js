import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

// POST /api/payments/[id]/refund - Mark payment and order as refunded (admin only, idempotent)
const refundPaymentSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(refundPaymentSchema),
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const paymentId = params.id
    const { reason } = request.validatedData

    try {
      const startTime = Date.now()
      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: {
            order: {
              include: {
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        })

        if (!payment) {
          throw new Error('PAYMENT_NOT_FOUND')
        }

        if (payment.status === 'REFUNDED') {
          return payment
        }

        const order = payment.order

        if (order && order.paymentStatus === 'COMPLETED') {
          for (const item of order.items) {
            const product = item.product
            if (!product) {
              throw new Error('PRODUCT_NOT_FOUND')
            }

            const currentStock = product.stock ?? 0
            const newStock = currentStock + item.quantity

            await tx.inventoryMovement.create({
              data: {
                productId: product.id,
                quantity: item.quantity,
                reason: 'REFUND',
                reference: order.orderNumber,
              },
            })

            await tx.product.update({
              where: { id: product.id },
              data: { stock: newStock },
            })
          }
        }

        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'REFUNDED', notes: reason || null },
        })

        if (payment.orderId) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: 'REFUNDED',
              status: 'CANCELLED',
              notes: reason || undefined,
            },
          })
        }

        return updatedPayment
      })
      const duration = Date.now() - startTime

      logger.dbQuery('payment.refund', duration, { paymentId, adminId: session.user.id })
      logger.info('Payment refunded', { paymentId, adminId: session.user.id })

      return ApiResponse.success(result, 'Payment refunded successfully')
    } catch (error) {
      if (error.message === 'PAYMENT_NOT_FOUND') {
        return ApiResponse.notFound('Payment not found')
      }
      if (error.message === 'PRODUCT_NOT_FOUND') {
        return ApiResponse.error('Product not found for an order item', 400)
      }

      logger.error('Refund payment error', error, { paymentId, adminId: session.user.id })
      return ApiResponse.error('Failed to process refund', 500)
    }
  },
})

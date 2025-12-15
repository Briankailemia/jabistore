import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { logAudit } from '@/lib/auditLogger'

/**
 * M-Pesa Callback Handler
 * This endpoint receives webhooks from Safaricom M-Pesa when payment is completed
 */
export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    try {
      const callbackData = await request.json()
      
      logger.info('M-Pesa callback received', { raw: callbackData })
      
      const { Body } = callbackData
      if (!Body || !Body.stkCallback) {
        logger.error('Invalid M-Pesa callback structure')
        return ApiResponse.error('Invalid callback structure', 400)
      }
      
      const { stkCallback } = Body
      const checkoutRequestId = stkCallback.CheckoutRequestID
      const resultCode = stkCallback.ResultCode

      const startTime = Date.now()
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: {
            paymentReference: checkoutRequestId
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            },
            items: {
              include: {
                product: true,
              },
            },
          }
        })

        if (!order) {
          logger.error('Order not found for checkoutRequestId', { checkoutRequestId })
          throw new Error('ORDER_NOT_FOUND')
        }

        if (resultCode === 0) {
          const callbackMetadata = stkCallback.CallbackMetadata
          const metaItems = callbackMetadata?.Item || []

          const mpesaReceiptNumber = metaItems.find(item => item.Name === 'MpesaReceiptNumber')?.Value
          const transactionDate = metaItems.find(item => item.Name === 'TransactionDate')?.Value
          const phoneNumber = metaItems.find(item => item.Name === 'PhoneNumber')?.Value
          const amount = metaItems.find(item => item.Name === 'Amount')?.Value

          if (order.paymentStatus === 'COMPLETED') {
            logger.info('M-Pesa callback duplicate - already completed', { orderId: order.id })
            return { orderId: order.id, mpesaReceiptNumber, alreadyCompleted: true }
          }

          for (const item of order.items) {
            const product = item.product
            if (!product) {
              throw new Error('PRODUCT_NOT_FOUND')
            }

            const currentStock = product.stock ?? 0
            const newStock = currentStock - item.quantity

            if (newStock < 0) {
              logger.error('Insufficient stock on callback', { productId: product.id, currentStock, requested: item.quantity })
              throw new Error('INSUFFICIENT_STOCK')
            }
          }

          for (const item of order.items) {
            const product = item.product
            const currentStock = product.stock ?? 0
            const newStock = currentStock - item.quantity

            await tx.inventoryMovement.create({
              data: {
                productId: product.id,
                quantity: -item.quantity,
                reason: 'SALE',
                reference: order.orderNumber,
              },
            })

            await tx.product.update({
              where: { id: product.id },
              data: { stock: newStock },
            })
          }

          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'COMPLETED',
              status: 'CONFIRMED',
              mpesaReceiptNumber: mpesaReceiptNumber || null,
              paymentReference: checkoutRequestId,
              updatedAt: new Date(),
            },
          })

          logger.info('M-Pesa payment successful', { orderId: updatedOrder.id, receipt: mpesaReceiptNumber })
          await logAudit({
            action: 'MPESA_PAYMENT_SUCCESS',
            userId: order.userId,
            entityType: 'order',
            entityId: order.id,
            details: { mpesaReceiptNumber, amount, phoneNumber },
          })

          return { orderId: updatedOrder.id, mpesaReceiptNumber, transactionDate, phoneNumber, amount, alreadyCompleted: false }
        } else {
          const resultDesc = stkCallback.ResultDesc || 'Payment failed'

          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'FAILED',
              notes: `Payment failed: ${resultDesc}`,
              updatedAt: new Date(),
            },
          })

          logger.warn('M-Pesa payment failed', { orderId: order.id, reason: resultDesc })
          await logAudit({
            action: 'MPESA_PAYMENT_FAILED',
            userId: order.userId,
            entityType: 'order',
            entityId: order.id,
            details: { reason: resultDesc },
          })

          return { orderId: order.id, failed: true, reason: resultDesc }
        }
      })
      const duration = Date.now() - startTime
      logger.dbQuery('mpesa.callback', duration, { checkoutRequestId })

      return ApiResponse.success(result, 'Callback processed successfully')
      
    } catch (error) {
      logger.error('M-Pesa callback error', error)

      if (error.message === 'ORDER_NOT_FOUND') {
        return ApiResponse.notFound('Order not found')
      }

      if (error.message === 'INSUFFICIENT_STOCK') {
        return ApiResponse.error('Insufficient stock to complete order', 409)
      }

      return ApiResponse.error(error.message || 'Failed to process callback', 500)
    }
  },
})

// Also handle GET requests (for testing)
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async () => {
    return ApiResponse.success({
      message: 'M-Pesa callback endpoint is active',
      method: 'POST',
      description: 'This endpoint receives M-Pesa payment callbacks'
    })
  },
})


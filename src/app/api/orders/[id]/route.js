import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { logAudit } from '@/lib/auditLogger'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  trackingNumber: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  deliveredAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET /api/orders/[id] - Get single order details
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    // Admins can view any order, users can only view their own
    const where = session.user.role === 'ADMIN'
      ? { id: params.id }
      : { id: params.id, userId: session.user.id }

    const startTime = Date.now()
    const order = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        },
        shippingAddress: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    const duration = Date.now() - startTime

    if (!order) {
      return ApiResponse.notFound('Order not found')
    }

    logger.dbQuery('order.findFirst', duration, { orderId: params.id, userId: session.user.id, admin: session.user.role === 'ADMIN' })
    logger.info('Order fetched', { orderId: order.id, userId: session.user.id })

    return ApiResponse.success(order, 'Order fetched successfully')
  },
})

// PUT /api/orders/[id] - Update order (admin only)
export const PUT = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateOrderSchema),
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const data = request.validatedData

    const updateData = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus
    if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber
    if (data.carrier !== undefined) updateData.carrier = data.carrier
    if (data.deliveredAt !== undefined) updateData.deliveredAt = data.deliveredAt ? new Date(data.deliveredAt) : null
    if (data.notes !== undefined) updateData.notes = data.notes

    const startTime = Date.now()
    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: { take: 1 },
              },
            },
          },
        },
        shippingAddress: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    const duration = Date.now() - startTime

    logger.dbQuery('order.update', duration, { orderId: params.id, adminId: session.user.id })
    logger.info('Order updated', { orderId: params.id, adminId: session.user.id, fields: Object.keys(updateData) })

    await logAudit({
      action: 'ORDER_UPDATE',
      userId: session.user.id,
      entityType: 'order',
      entityId: params.id,
      details: { updatedFields: Object.keys(updateData), status: data.status, paymentStatus: data.paymentStatus },
      request,
    })

    return ApiResponse.success(order, 'Order updated successfully')
  },
})

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (orderId) {
      const startTime = Date.now()
      // Get shipping details for specific order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          shippingAddress: true,
          items: {
            include: {
              product: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      })

      if (!order) {
        return ApiResponse.notFound('Order not found')
      }

      // Calculate shipping details
      const shippingInfo = {
        orderId: order.id,
        status: order.status,
        trackingNumber: order.trackingNumber,
        shippingMethod: order.shippingMethod || 'Standard Delivery',
        estimatedDelivery: calculateEstimatedDelivery(order.createdAt, order.shippingMethod),
        shippingAddress: order.shippingAddress,
        items: order.items,
        timeline: generateShippingTimeline(order)
      }
      const duration = Date.now() - startTime
      logger.dbQuery('order.findUnique', duration, { orderId })
      logger.info('Shipping info fetched', { orderId, userId: session.user.id })

      return ApiResponse.success(shippingInfo)
    } else {
      // Get available shipping methods
      const shippingMethods = [
        {
          id: 'standard',
          name: 'Standard Delivery',
          description: '5-7 business days',
          price: 500,
          estimatedDays: 7
        },
        {
          id: 'express',
          name: 'Express Delivery',
          description: '2-3 business days',
          price: 1000,
          estimatedDays: 3
        },
        {
          id: 'overnight',
          name: 'Overnight Delivery',
          description: 'Next business day',
          price: 2000,
          estimatedDays: 1
        },
        {
          id: 'pickup',
          name: 'Store Pickup',
          description: 'Pick up from our store',
          price: 0,
          estimatedDays: 0
        }
      ]

      logger.info('Shipping methods fetched', { userId: session.user.id })
      return ApiResponse.success({ shippingMethods })
    }
  },
})

const updateShippingSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  shippingMethod: z.string().min(1, 'Shipping method is required'),
  trackingNumber: z.string().min(1, 'Tracking number is required').optional(),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateShippingSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const { orderId, shippingMethod, trackingNumber } = request.validatedData

    // Update order with shipping information
    const startTime = Date.now()
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingMethod,
        trackingNumber,
        status: 'SHIPPED',
        shippedAt: new Date()
      }
    })
    const duration = Date.now() - startTime

    logger.dbQuery('order.update', duration, { orderId, shippingMethod })
    logger.info('Shipping updated', { orderId, userId: session.user.id })

    return ApiResponse.success(
      { order: updatedOrder },
      'Shipping information updated successfully'
    )
  },
})

function calculateEstimatedDelivery(orderDate, shippingMethod) {
  const days = {
    'Standard Delivery': 7,
    'Express Delivery': 3,
    'Overnight Delivery': 1,
    'Store Pickup': 0
  }

  const deliveryDays = days[shippingMethod] || 7
  const estimatedDate = new Date(orderDate)
  estimatedDate.setDate(estimatedDate.getDate() + deliveryDays)
  
  return estimatedDate.toISOString()
}

function generateShippingTimeline(order) {
  const timeline = [
    {
      status: 'Order Placed',
      date: order.createdAt,
      completed: true,
      description: 'Your order has been received and is being processed'
    }
  ]

  if (order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    timeline.push({
      status: 'Processing',
      date: order.createdAt,
      completed: true,
      description: 'Your order is being prepared for shipment'
    })
  }

  if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    timeline.push({
      status: 'Shipped',
      date: order.shippedAt || new Date(),
      completed: true,
      description: `Your order has been shipped via ${order.shippingMethod || 'Standard Delivery'}`
    })
  }

  if (order.status === 'DELIVERED') {
    timeline.push({
      status: 'Delivered',
      date: order.deliveredAt || new Date(),
      completed: true,
      description: 'Your order has been successfully delivered'
    })
  } else {
    // Add pending delivery step
    const estimatedDelivery = calculateEstimatedDelivery(order.createdAt, order.shippingMethod)
    timeline.push({
      status: 'Out for Delivery',
      date: estimatedDelivery,
      completed: false,
      description: 'Your order is out for delivery'
    })
  }

  return timeline
}

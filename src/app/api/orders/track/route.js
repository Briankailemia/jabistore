import { prisma } from '@/lib/prisma';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest } from '@/lib/middleware/validator';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const trackOrderSchema = z.object({
  orderNumber: z.string().optional(),
  trackingNumber: z.string().optional(),
}).refine((data) => data.orderNumber || data.trackingNumber, {
  message: 'Order number or tracking number is required',
})

// GET /api/orders/track?orderNumber=xxx - Track order by order number
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(trackOrderSchema),
  handler: async (request) => {
    const { orderNumber, trackingNumber } = request.validatedData;

    const whereClause = orderNumber
      ? { orderNumber }
      : { trackingNumber };

    const startTime = Date.now();
    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: {
                  take: 1,
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        },
        shippingAddress: true,
        coupon: {
          select: {
            code: true,
            name: true,
            type: true
          }
        }
      }
    });
    const duration = Date.now() - startTime;

    if (!order) {
      return ApiResponse.notFound('Order not found');
    }

    logger.dbQuery('order.findFirst', duration, { orderNumber, trackingNumber });
    logger.info('Order tracking fetched', { orderId: order.id, orderNumber: order.orderNumber });

    // Generate tracking timeline based on order status
    const timeline = generateTrackingTimeline(order);

    // Calculate estimated delivery date
    const estimatedDelivery = calculateEstimatedDelivery(order);

    return ApiResponse.success({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        discount: order.discount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        deliveredAt: order.deliveredAt,
        items: order.items,
        shippingAddress: order.shippingAddress,
        coupon: order.coupon,
        customer: {
          name: order.user.name,
          email: order.user.email
        }
      },
      timeline,
      estimatedDelivery,
      trackingUrl: order.trackingNumber ? `https://track.example.com/${order.trackingNumber}` : null
    });
  },
})

const updateTrackingSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  status: z.enum(['PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED']),
  trackingNumber: z.string().max(255).optional().nullable(),
  carrier: z.string().max(255).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

// POST /api/orders/track - Update order tracking information (admin only)
export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateTrackingSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return ApiResponse.unauthorized()
    }

    const { orderId, status, trackingNumber, carrier, notes } = request.validatedData;

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber || null;
    if (carrier !== undefined) updateData.carrier = carrier || null;
    if (notes !== undefined) updateData.notes = notes || null;

    // Set delivered date if status is DELIVERED
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const startTime = Date.now();
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    const duration = Date.now() - startTime;

    logger.dbQuery('order.update', duration, { orderId, status });
    logger.info('Order tracking updated', { orderId, status, userId: session.user.id });

    return ApiResponse.success({ order: updatedOrder }, 'Order tracking updated');
  },
})

function generateTrackingTimeline(order) {
  const timeline = [];
  const createdAt = new Date(order.createdAt);
  
  // Order Placed
  timeline.push({
    status: 'Order Placed',
    description: 'Your order has been received and is being processed',
    timestamp: createdAt,
    completed: true,
    icon: 'check'
  });

  // Processing
  timeline.push({
    status: 'Processing',
    description: 'Your order is being prepared for shipment',
    timestamp: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000), // +2 hours
    completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
    icon: 'clock'
  });

  // Shipped
  if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    timeline.push({
      status: 'Shipped',
      description: `Your order has been shipped${order.carrier ? ` via ${order.carrier}` : ''}${order.trackingNumber ? `. Tracking: ${order.trackingNumber}` : ''}`,
      timestamp: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000), // +1 day
      completed: true,
      icon: 'truck'
    });
  }

  // Out for Delivery
  if (order.status === 'DELIVERED') {
    timeline.push({
      status: 'Out for Delivery',
      description: 'Your order is out for delivery',
      timestamp: order.deliveredAt ? new Date(new Date(order.deliveredAt).getTime() - 2 * 60 * 60 * 1000) : new Date(),
      completed: true,
      icon: 'truck'
    });
  }

  // Delivered
  if (order.status === 'DELIVERED' && order.deliveredAt) {
    timeline.push({
      status: 'Delivered',
      description: 'Your order has been successfully delivered',
      timestamp: new Date(order.deliveredAt),
      completed: true,
      icon: 'check-circle'
    });
  }

  return timeline;
}

function calculateEstimatedDelivery(order) {
  const createdAt = new Date(order.createdAt);
  
  if (order.status === 'DELIVERED' && order.deliveredAt) {
    return {
      date: new Date(order.deliveredAt),
      status: 'delivered'
    };
  }

  // Calculate estimated delivery based on shipping method and location
  let deliveryDays = 3; // Default 3 business days
  
  // Adjust based on location (simplified logic)
  if (order.shippingAddress?.city?.toLowerCase().includes('nairobi')) {
    deliveryDays = 1; // Same day or next day for Nairobi
  } else if (order.shippingAddress?.city?.toLowerCase().includes('mombasa')) {
    deliveryDays = 2; // 2 days for Mombasa
  }

  const estimatedDate = new Date(createdAt);
  estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);

  return {
    date: estimatedDate,
    status: 'estimated',
    businessDays: deliveryDays
  };
}

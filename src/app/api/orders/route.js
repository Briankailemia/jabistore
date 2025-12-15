import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { ApiResponse, createApiHandler } from '@/lib/apiResponse';
import { apiRateLimiter } from '@/lib/middleware/rateLimiter';
import { validateRequest, schemas } from '@/lib/middleware/validator';
import logger from '@/lib/logger';

// GET /api/orders - Fetch user orders
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return ApiResponse.unauthorized();
      }

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
      const status = searchParams.get('status');

      const skip = (page - 1) * limit;
      
      // Admins can see all orders, regular users only see their own
      const where = {
        ...(session.user.role !== 'ADMIN' && { userId: session.user.id }),
      };

      if (status) {
        const allowedStatuses = new Set([
          'PENDING',
          'CONFIRMED',
          'PROCESSING',
          'SHIPPED',
          'DELIVERED',
          'CANCELLED',
          'REFUNDED',
        ]);
        if (!allowedStatuses.has(status)) {
          return ApiResponse.validationError([{
            path: 'status',
            message: 'Invalid status filter',
          }]);
        }
        where.status = status;
      }

      const startTime = Date.now();
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: { name: true, images: { take: 1 } },
                },
              },
            },
            shippingAddress: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ]);
      const duration = Date.now() - startTime;

      logger.dbQuery('order.findMany', duration, { page, limit, status, userId: session.user.id });

      return ApiResponse.success({
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching orders:', error);
      return ApiResponse.error('Failed to fetch orders', 500);
    }
  },
});

// POST /api/orders - Create new order
export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(schemas.createOrder),
  handler: async (request) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return ApiResponse.unauthorized();
      }

      const data = request.validatedData;
      
      // Validate items array
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return ApiResponse.error('Order must contain at least one item', 400);
      }
      
      // Generate order number
      const orderNumber = `FH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const startTime = Date.now();
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: data.paymentMethod,
          total: data.total || data.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0),
          subtotal: data.subtotal || data.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0),
          shipping: data.shipping || 0,
          tax: data.tax || 0,
          discount: data.discount || 0,
          shippingAddressId: data.shippingAddressId || null,
          notes: data.notes || null,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity || 1,
              price: item.price || 0,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
        },
      });
      const duration = Date.now() - startTime;

      logger.dbQuery('order.create', duration);
      logger.info('Order created', { 
        orderId: order.id, 
        orderNumber: order.orderNumber,
        userId: session.user.id,
        total: order.total,
      });

      return ApiResponse.success(order, 'Order created successfully', 201);
    } catch (error) {
      logger.error('Error creating order:', error);
      return ApiResponse.error('Failed to create order', 500);
    }
  },
});

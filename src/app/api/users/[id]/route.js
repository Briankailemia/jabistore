import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { logAudit } from '@/lib/auditLogger'
import { z } from 'zod'

// GET /api/users/[id] - Get single user details (admin only)
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const { id } = params

    const startTime = Date.now()
    const [user, completedOrders] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          orders: {
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
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          reviews: {
            include: {
              product: {
                select: {
                  name: true,
                  images: { take: 1 },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
              cartItems: true,
              wishlist: true,
            },
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          userId: id,
          paymentStatus: 'COMPLETED',
        },
        _sum: {
          total: true,
        },
      }),
    ])
    const duration = Date.now() - startTime

    if (!user) {
      return ApiResponse.notFound('User not found')
    }

    logger.dbQuery('user.findUnique', duration, { userId: id })
    logger.info('User fetched', { userId: id, adminId: session.user.id })

    return ApiResponse.success({
      user: {
        ...user,
        totalSpent: completedOrders._sum.total || 0,
      },
    })
  },
})

// PUT /api/users/[id] - Update user (admin only)
const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(10, 'Phone number is too short').optional(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR'], {
    errorMap: () => ({ message: 'Invalid role' })
  }).optional(),
  avatar: z.string().url('Invalid avatar URL').optional().nullable(),
})

export const PUT = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateUserSchema),
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const { id } = params
    const data = request.validatedData

    // Prevent admins from changing their own role
    if (data.role && id === session.user.id) {
      return ApiResponse.error('You cannot change your own role', 400)
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!existingUser) {
      return ApiResponse.notFound('User not found')
    }

    const updateData = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.role !== undefined) updateData.role = data.role
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.avatar !== undefined) updateData.avatar = data.avatar

    const startTime = Date.now()
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      const duration = Date.now() - startTime

      logger.dbQuery('user.update', duration)
      logger.info('User updated', { 
        userId: id, 
        adminId: session.user.id,
        updatedFields: Object.keys(updateData)
      })

      await logAudit({
        action: 'USER_UPDATE',
        userId: session.user.id,
        entityType: 'user',
        entityId: id,
        details: { updatedFields: Object.keys(updateData), roleChanged: data.role },
        request,
      })

      return ApiResponse.success({ user }, 'User updated successfully')
    } catch (error) {
      if (error.code === 'P2002') {
        return ApiResponse.error('Email already exists', 409)
      }
      throw error
    }
  },
})

// DELETE /api/users/[id] - Delete user (admin only)
export const DELETE = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }

    const { id } = params

    // Prevent admins from deleting themselves
    if (id === session.user.id) {
      return ApiResponse.error('You cannot delete your own account', 400)
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true }
    })

    if (!user) {
      return ApiResponse.notFound('User not found')
    }

    const startTime = Date.now()
    await prisma.user.delete({
      where: { id },
    })
    const duration = Date.now() - startTime

    logger.dbQuery('user.delete', duration)
    logger.info('User deleted', { 
      deletedUserId: id, 
      adminId: session.user.id,
      deletedUserEmail: user.email
    })

    await logAudit({
      action: 'USER_DELETE',
      userId: session.user.id,
      entityType: 'user',
      entityId: id,
      details: { email: user.email },
      request,
    })

    return ApiResponse.success(null, 'User deleted successfully')
  },
})


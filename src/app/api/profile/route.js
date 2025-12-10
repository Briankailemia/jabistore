import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

// GET /api/profile - Get current user's profile
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const startTime = Date.now()
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    const duration = Date.now() - startTime

    if (!user) {
      return ApiResponse.notFound('User not found')
    }

    logger.dbQuery('user.findUnique', duration, { userId: session.user.id })
    logger.info('Profile fetched', { userId: session.user.id })

    return ApiResponse.success({ user })
  },
})

// PUT /api/profile - Update current user's profile
const updateProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name is too long')
    .optional(),
  phone: z.string()
    .regex(/^(?:\+254|0)?7\d{8}$/, 'Invalid phone number format. Use Kenyan format (e.g., 0712345678)')
    .optional()
    .nullable(),
  avatar: z.string()
    .url('Invalid avatar URL')
    .max(500, 'Avatar URL is too long')
    .optional()
    .nullable(),
})

export const PUT = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateProfileSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const data = request.validatedData

    if (Object.keys(data).length === 0) {
      return ApiResponse.error('No valid fields provided to update', 400)
    }

    const updateData = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.phone !== undefined) updateData.phone = data.phone ? data.phone.trim() : null
    if (data.avatar !== undefined) updateData.avatar = data.avatar ? data.avatar.trim() : null

    const startTime = Date.now()
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    const duration = Date.now() - startTime

    logger.dbQuery('user.update', duration)
    logger.info('Profile updated', { 
      userId: session.user.id,
      updatedFields: Object.keys(updateData)
    })

    return ApiResponse.success({ user }, 'Profile updated successfully')
  },
})

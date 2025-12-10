import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { authRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest, schemas } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

// Signup validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export const POST = createApiHandler({
  rateLimiter: authRateLimiter,
  validator: validateRequest(signupSchema),
  handler: async (request) => {
    const data = request.validatedData
    const { email, password, name, firstName, lastName } = data

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const startTime = Date.now()
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })
    const duration = Date.now() - startTime

    logger.dbQuery('user.findUnique', duration, { email: normalizedEmail })

    if (existingUser) {
      logger.warn('Signup attempt with existing email', { email: normalizedEmail })
      return ApiResponse.error('An account with this email already exists', 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Build name from firstName/lastName or use provided name
    const fullName = name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || null)

    // Create user
    const createStartTime = Date.now()
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: fullName,
        role: 'USER',
      },
    })
    const createDuration = Date.now() - createStartTime

    logger.dbQuery('user.create', createDuration)
    logger.info('User account created', { userId: user.id, email: normalizedEmail })

    // Return success (don't return password hash)
    return ApiResponse.success(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      'Account created successfully',
      201
    )
  },
})


import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

// GET /api/addresses - Get user's saved addresses
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return ApiResponse.unauthorized()
      }

      const startTime = Date.now()
      const addresses = await prisma.address.findMany({
        where: {
          userId: session.user.id,
          type: 'SHIPPING'
        },
        orderBy: [
          { isDefault: 'desc' },
          { updatedAt: 'desc' }
        ]
      })
      const duration = Date.now() - startTime

      logger.dbQuery('address.findMany', duration, { userId: session.user.id })
      logger.info('Addresses fetched', { userId: session.user.id, count: addresses.length })

      return ApiResponse.success(addresses)
    } catch (error) {
      logger.error('Error fetching addresses:', error)
      return ApiResponse.error('Failed to fetch addresses', 500)
    }
  },
})

// POST /api/addresses - Save a new address
const createAddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  address: z.string().min(1, 'Address is required').max(255, 'Address is too long'),
  city: z.string().min(1, 'City is required').max(100, 'City is too long'),
  state: z.string().min(1, 'State is required').max(100, 'State is too long'),
  postalCode: z.string().min(1, 'Postal code is required').max(20, 'Postal code is too long'),
  country: z.string().min(1, 'Country is required').max(100, 'Country is too long').default('Kenya'),
  phone: z.string()
    .regex(/^(?:\+254|0)?7\d{8}$/, 'Invalid phone number format. Use Kenyan format (e.g., 0712345678)')
    .optional()
    .nullable(),
  isDefault: z.boolean().default(false),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(createAddressSchema),
  handler: async (request) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return ApiResponse.unauthorized()
      }

      const data = request.validatedData

    // If this is set as default, unset other default addresses
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // Check if address already exists (same details)
    const existingAddress = await prisma.address.findFirst({
      where: {
        userId: session.user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        address1: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country
      }
    })

    const startTime = Date.now()
    let address

    if (existingAddress) {
      // Update existing address
      address = await prisma.address.update({
        where: { id: existingAddress.id },
        data: {
          phone: data.phone,
          isDefault: data.isDefault || existingAddress.isDefault,
          updatedAt: new Date()
        }
      })
      logger.info('Address updated', { userId: session.user.id, addressId: address.id })
    } else {
      // Create new address
      address = await prisma.address.create({
        data: {
          userId: session.user.id,
          type: 'SHIPPING',
          firstName: data.firstName,
          lastName: data.lastName,
          address1: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          phone: data.phone,
          isDefault: data.isDefault
        }
      })
      logger.info('Address created', { userId: session.user.id, addressId: address.id })
    }
    const duration = Date.now() - startTime

    logger.dbQuery(existingAddress ? 'address.update' : 'address.create', duration)

    return ApiResponse.success(
      address,
      existingAddress ? 'Address updated successfully' : 'Address created successfully',
      existingAddress ? 200 : 201
    )
    } catch (error) {
      logger.error('Error saving address:', error)
      return ApiResponse.error('Failed to save address', 500)
    }
  },
})


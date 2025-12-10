import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

const updateReservationSchema = z.object({
  status: z.enum(['PENDING','CONFIRMED','SEATED','COMPLETED','CANCELLED','NO_SHOW']).optional(),
  tableId: z.string().uuid('Invalid table ID').nullable().optional(),
  notes: z.string().max(500, 'Notes are too long').optional().nullable(),
})

// PATCH /api/reservations/[id] - Update status/table/notes
export const PATCH = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(updateReservationSchema),
  handler: async (request, { params }) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const role = session.user.role
    const isStaff = role === 'ADMIN' || role === 'CASHIER' || role === 'WAITER'

    const { status, tableId, notes } = request.validatedData

    const existing = await prisma.reservation.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return ApiResponse.notFound('Reservation not found')
    }

    // Non-staff users can only cancel their own reservations
    if (!isStaff) {
      if (existing.userId !== session.user.id) {
        return ApiResponse.forbidden('Forbidden')
      }
      if (status && status !== 'CANCELLED') {
        return ApiResponse.error('You can only cancel your reservation', 400)
      }
    }

    const data = {}
    if (typeof notes === 'string') data.notes = notes

    if (status) {
      data.status = status
    }

    if (tableId !== undefined) {
      data.tableId = tableId || null
    }

    const startTime = Date.now()
    const updated = await prisma.reservation.update({
      where: { id: params.id },
      data,
      include: {
        table: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })
    const duration = Date.now() - startTime

    logger.dbQuery('reservation.update', duration, { reservationId: params.id })
    logger.info('Reservation updated', { reservationId: params.id, userId: session.user.id })

    return ApiResponse.success({ reservation: updated }, 'Reservation updated')
  },
})

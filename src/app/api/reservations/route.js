import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

const listReservationsSchema = z.object({
  status: z.enum(['PENDING','CONFIRMED','SEATED','COMPLETED','CANCELLED','NO_SHOW']).optional(),
  tableId: z.string().uuid('Invalid table ID').optional(),
  search: z.string().max(100).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

// GET /api/reservations - List reservations with filters
export const GET = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(listReservationsSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const role = session.user.role
    const isStaff = role === 'ADMIN' || role === 'CASHIER' || role === 'WAITER'

    const { status, tableId, search = '', from, to } = request.validatedData

    const where = {}

    if (!isStaff) {
      // Normal users only see their own reservations
      where.userId = session.user.id
    }

    if (status) where.status = status
    if (tableId) where.tableId = tableId

    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestPhone: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    let fromDate = from ? new Date(from) : undefined
    let toDate = to ? new Date(to) : undefined
    if (fromDate && isNaN(fromDate.getTime())) fromDate = undefined
    if (toDate && isNaN(toDate.getTime())) toDate = undefined

    if ((from || to) && !fromDate && !toDate) {
      return ApiResponse.error('Invalid date range filters', 400)
    }
    if (fromDate && toDate && fromDate > toDate) {
      const tmp = fromDate
      fromDate = toDate
      toDate = tmp
    }
    if (fromDate || toDate) {
      where.reservedFor = {}
      if (fromDate) where.reservedFor.gte = fromDate
      if (toDate) where.reservedFor.lte = toDate
    }

    const startTime = Date.now()
    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        table: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { reservedFor: 'asc' },
      take: 200,
    })
    const duration = Date.now() - startTime

    logger.dbQuery('reservation.findMany', duration, { userId: session.user.id, isStaff, count: reservations.length })
    logger.info('Reservations fetched', { userId: session.user.id, count: reservations.length })

    return ApiResponse.success({ reservations })
  },
})

// POST /api/reservations - Create a reservation
const createReservationSchema = z.object({
  reservedFor: z.string().datetime('Invalid reservedFor date'),
  durationMins: z.number().int().positive().max(480).default(90),
  partySize: z.number().int().min(1, 'Party size must be at least 1').max(50, 'Party size too large'),
  guestName: z.string().min(1, 'guestName is required').max(100, 'guestName is too long'),
  guestPhone: z.string().regex(/^(?:\+254|0)?7\d{8}$/, 'Invalid guestPhone format').optional().nullable(),
  tableId: z.string().uuid('Invalid table ID').optional().nullable(),
  notes: z.string().max(500, 'Notes are too long').optional().nullable(),
  userId: z.string().uuid('Invalid user ID').optional(),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(createReservationSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const role = session.user.role
    const data = request.validatedData

    const reservedAt = new Date(data.reservedFor)
    if (reservedAt.getTime() < Date.now()) {
      return ApiResponse.error('Reservation time must be in the future', 400)
    }

    let effectiveUserId = null
    if (role === 'USER') {
      effectiveUserId = session.user.id
    } else if (data.userId) {
      effectiveUserId = data.userId
    }

    const code = `RSV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const startTime = Date.now()
    const reservation = await prisma.reservation.create({
      data: {
        code,
        reservedFor: reservedAt,
        durationMins: data.durationMins,
        partySize: data.partySize,
        guestName: data.guestName,
        guestPhone: data.guestPhone || null,
        tableId: data.tableId || null,
        notes: data.notes || null,
        userId: effectiveUserId,
        createdById: session.user.id,
      },
      include: {
        table: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })
    const duration = Date.now() - startTime

    logger.dbQuery('reservation.create', duration)
    logger.info('Reservation created', { reservationId: reservation.id, userId: session.user.id })

    return ApiResponse.success({ reservation }, 'Reservation created', 201)
  },
})

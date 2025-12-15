import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import { sendSupportEmail } from '@/lib/emailService'
import logger from '@/lib/logger'
import { z } from 'zod'

const supportEmailSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  email: z.string().email('Invalid email format'),
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
  category: z.string().optional(),
  orderNumber: z.string().optional(),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(supportEmailSchema),
  handler: async (request) => {
    const data = request.validatedData

    try {
      await sendSupportEmail(data)

      logger.info('Support email sent', {
        email: data.email,
        subject: data.subject,
        category: data.category,
        orderNumber: data.orderNumber,
      })

      return ApiResponse.success(
        { message: 'Your support request has been sent successfully. We will respond within 4 hours.' },
        'Support request sent successfully'
      )
    } catch (error) {
      logger.error('Error sending support email', {
        error: error.message,
        email: data.email,
      })

      return ApiResponse.error(
        'Failed to send support request. Please try again later or contact us directly.',
        500
      )
    }
  },
})


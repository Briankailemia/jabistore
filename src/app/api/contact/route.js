import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import { sendContactEmail } from '@/lib/emailService'
import logger from '@/lib/logger'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  email: z.string().email('Invalid email format'),
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
  category: z.string().optional(),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(contactSchema),
  handler: async (request) => {
    const data = request.validatedData

    try {
      await sendContactEmail(data)

      logger.info('Contact form submitted', {
        email: data.email,
        subject: data.subject,
        category: data.category,
      })

      return ApiResponse.success(
        { message: 'Your message has been sent successfully. We will respond within 4 hours.' },
        'Message sent successfully'
      )
    } catch (error) {
      logger.error('Error sending contact email', {
        error: error.message,
        email: data.email,
      })

      return ApiResponse.error(
        'Failed to send message. Please try again later or contact us directly.',
        500
      )
    }
  },
})


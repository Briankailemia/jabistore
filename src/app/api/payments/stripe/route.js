import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import Stripe from 'stripe'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build')

const stripePaymentSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('usd').optional(),
  paymentMethod: z.string().min(1, 'paymentMethod is required'),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(stripePaymentSchema),
  handler: async (request) => {
    const { amount, currency = 'usd', paymentMethod } = request.validatedData

    try {
      const startTime = Date.now()
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types: ['card'],
        confirmation_method: 'manual',
        confirm: true,
        payment_method: paymentMethod
      })
      const duration = Date.now() - startTime

      logger.info('Stripe payment intent created', { paymentIntentId: paymentIntent.id, amount, currency, status: paymentIntent.status })

      if (paymentIntent.status === 'succeeded') {
        return ApiResponse.success(
          { paymentIntent: paymentIntent.id },
          'Payment successful'
        )
      } else if (paymentIntent.status === 'requires_action') {
        return ApiResponse.success(
          {
            requiresAction: true,
            clientSecret: paymentIntent.client_secret
          },
          'Additional authentication required'
        )
      } else {
        return ApiResponse.error('Payment failed', 400)
      }
    } catch (error) {
      logger.error('Stripe payment error', error, { amount, currency })
      return ApiResponse.error(error.message || 'Payment processing failed', 500)
    }
  },
})

// Webhook handler for Stripe events (keep raw body handling)
export async function PUT(request) {
  try {
    const sig = request.headers.get('stripe-signature')
    const body = await request.text()

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        logger.info('Stripe payment succeeded', { paymentIntentId: paymentIntent.id })
        // TODO: Update order status in database
        break
      }
      
      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object
        logger.warn('Stripe payment failed', { paymentIntentId: failedPayment.id })
        // TODO: Update order status in database
        break
      }

      default:
        logger.info('Stripe webhook unhandled', { eventType: event.type })
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (error) {
    logger.error('Stripe webhook error', error)
    return new Response(JSON.stringify({ error: 'Webhook error' }), { status: 400 })
  }
}

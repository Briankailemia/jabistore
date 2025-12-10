import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { normalizeMpesaPhone, validateMpesaPhone } from '@/lib/phoneUtils'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest } from '@/lib/middleware/validator'
import logger from '@/lib/logger'
import { z } from 'zod'

/**
 * Retry M-Pesa Payment
 * Resends STK Push for an existing order with pending payment
 */
const retryMpesaSchema = z.object({
  orderId: z.string().uuid('Order ID is required'),
  phone: z.string().optional(),
})

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(retryMpesaSchema),
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }

    const { orderId, phone } = request.validatedData

    // Get order and verify ownership
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id // Ensure user owns the order
      },
      include: {
        shippingAddress: true
      }
    })

    if (!order) {
      return ApiResponse.notFound('Order not found')
    }

    // Only allow retry for pending or failed payments
    if (order.paymentStatus === 'COMPLETED') {
      return ApiResponse.error('Payment already completed. Cannot retry.', 400)
    }

    // Get phone number from request or shipping address
    let phoneNumber = phone
    if (!phoneNumber && order.shippingAddress?.phone) {
      phoneNumber = order.shippingAddress.phone
    }

    if (!phoneNumber) {
      return ApiResponse.error('Phone number is required. Please provide a phone number.', 400)
    }

    // Normalize phone number to M-Pesa format
    phoneNumber = normalizeMpesaPhone(phoneNumber)
    
    // Validate phone number format
    if (!validateMpesaPhone(phoneNumber)) {
      return ApiResponse.error('Invalid phone number format. Please use a valid Kenyan phone number (e.g., 254712345678 or 0712345678)', 400)
    }

    // Import M-Pesa payment function logic
    const consumerKey = process.env.MPESA_CONSUMER_KEY
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET
    const shortcode = process.env.MPESA_SHORTCODE
    const passkey = process.env.MPESA_PASSKEY
    const baseUrl = process.env.NEXTAUTH_URL || process.env.MPESA_CALLBACK_URL || 'http://localhost:3000'
    const callbackUrl = process.env.MPESA_CALLBACK_URL || `${baseUrl}/api/payments/mpesa/callback`

    // Check if M-Pesa credentials are configured - REQUIRED for retry
    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      logger.error('M-Pesa credentials not configured for retry payment')
      return ApiResponse.error('M-Pesa payment service is not configured. Please configure MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, and MPESA_PASSKEY in your environment variables to enable payment retry.', 503)
    }

    // Generate access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
    
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      logger.error('M-Pesa token error', { status: tokenResponse.status, errorText })
      return ApiResponse.error('Failed to authenticate with M-Pesa. Please try again later.', 500)
    }

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      logger.error('M-Pesa token response missing access_token', { tokenData })
      return ApiResponse.error(tokenData.error_description || 'Failed to get M-Pesa access token', 500)
    }
    
    const accessToken = tokenData.access_token

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    // STK Push request
    const stkPushData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(order.total),
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: orderId,
      TransactionDesc: `Payment retry for order ${order.orderNumber}`
    }

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushData)
    })

    if (!stkResponse.ok) {
      const errorText = await stkResponse.text()
      logger.error('M-Pesa STK Push error', { status: stkResponse.status, errorText })
      return ApiResponse.error('Failed to initiate M-Pesa payment. Please try again.', 500)
    }

    const stkData = await stkResponse.json()

    if (stkData.ResponseCode === '0') {
      const checkoutRequestId = stkData.CheckoutRequestID
      
      // Update order with new checkoutRequestId and reset payment status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentReference: checkoutRequestId,
          paymentStatus: 'PENDING', // Reset to pending
          updatedAt: new Date()
        }
      })
      
      // Check if we're in sandbox mode and provide helpful message
      const isSandbox = process.env.MPESA_ENV === 'sandbox' || !process.env.MPESA_ENV
      const sandboxMessage = isSandbox 
        ? ' Note: You are using M-Pesa Sandbox. Please use a test phone number (e.g., 254708374149) registered in the Safaricom Developer Portal.'
        : ''
      
      logger.info('M-Pesa retry STK sent', { orderId, checkoutRequestId, phoneNumber })

      return ApiResponse.success({
        checkoutRequestId: checkoutRequestId,
        orderId: orderId,
        isSandbox: isSandbox
      }, `Payment request sent successfully! Please check your phone (${phoneNumber}) and enter your M-Pesa PIN when prompted.${sandboxMessage}`)
    } else {
      logger.error('M-Pesa STK Push failed', { stkData })
      
      // Provide user-friendly error messages
      let errorMessage = 'Payment request failed. Please try again.'
      
      if (stkData.errorMessage) {
        errorMessage = stkData.errorMessage
      } else if (stkData.CustomerMessage) {
        errorMessage = stkData.CustomerMessage
      } else if (stkData.ResponseDescription) {
        errorMessage = stkData.ResponseDescription
      }
      
      // Add helpful context for common errors
      if (errorMessage.toLowerCase().includes('invalid')) {
        errorMessage += ' Please ensure your phone number is registered with M-Pesa and try again.'
      }
      
      return ApiResponse.error(errorMessage, 400, { errorCode: stkData.ResponseCode, errorDetails: stkData })
    }

  }, 
})


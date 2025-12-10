import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { paymentRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest, schemas } from '@/lib/middleware/validator'
import logger from '@/lib/logger'

export const POST = createApiHandler({
  rateLimiter: paymentRateLimiter,
  validator: validateRequest(schemas.mpesaPayment),
  handler: async (request) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiResponse.unauthorized('Please sign in to make a payment')
    }

    const data = request.validatedData
    const { phone, amount, orderId } = data

    // Validate orderId is provided (phone is already validated by schema)
    if (!orderId) {
      return ApiResponse.validationError([{
        path: 'orderId',
        message: 'Order ID is required',
      }])
    }

    // Ensure the order exists and belongs to the current user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      select: {
        id: true,
        total: true,
        paymentStatus: true,
        status: true,
      },
    })

    if (!order) {
      return ApiResponse.notFound('Order not found')
    }

    // If order is already paid, avoid sending another STK push
    if (order.paymentStatus === 'COMPLETED') {
      return ApiResponse.success({
        orderId: order.id,
        paymentStatus: 'COMPLETED',
      }, 'Order is already paid')
    }

    const serverAmount = Math.round(Number(order.total || 0))
    if (!serverAmount || serverAmount <= 0) {
      return ApiResponse.validationError([{
        path: 'order',
        message: 'Invalid order total for payment',
      }])
    }

    // Optionally compare client-provided amount to server total; tolerate tiny differences
    if (typeof amount === 'number') {
      const clientAmount = Math.round(amount)
      if (Math.abs(clientAmount - serverAmount) > 5) {
        return ApiResponse.validationError([{
          path: 'amount',
          message: 'Payment amount mismatch. Please refresh and try again.',
        }])
      }
    }

    // M-Pesa STK Push implementation
    const consumerKey = process.env.MPESA_CONSUMER_KEY
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET
    const shortcode = process.env.MPESA_SHORTCODE
    const passkey = process.env.MPESA_PASSKEY
    // Construct callback URL - M-Pesa will call this when payment is complete
    const baseUrl = process.env.NEXTAUTH_URL || process.env.MPESA_CALLBACK_URL || 'http://localhost:3000'
    const callbackUrl = process.env.MPESA_CALLBACK_URL || `${baseUrl}/api/payments/mpesa/callback`

    // Check if M-Pesa credentials are configured
    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      logger.error('M-Pesa credentials not configured', null, { userId: session.user.id, orderId })
      return ApiResponse.error(
        'M-Pesa payment service is not configured. Please contact support.',
        503
      )
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
      logger.error('M-Pesa token error', new Error(errorText), { 
        status: tokenResponse.status,
        userId: session.user.id,
        orderId 
      })
      return ApiResponse.serverError('Failed to authenticate with M-Pesa. Please try again later.')
    }

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      logger.error('M-Pesa token response missing access_token', null, { 
        tokenData,
        userId: session.user.id,
        orderId 
      })
      return ApiResponse.serverError(
        tokenData.error_description || 'Failed to get M-Pesa access token'
      )
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
      Amount: serverAmount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: orderId,
      TransactionDesc: `Payment for order ${orderId}`
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
      logger.error('M-Pesa STK Push HTTP error', new Error(errorText), {
        status: stkResponse.status,
        userId: session.user.id,
        orderId,
        phone,
      })
      return ApiResponse.serverError('Failed to initiate M-Pesa payment. Please try again.')
    }

    const stkData = await stkResponse.json()

    if (stkData.ResponseCode === '0') {
      const checkoutRequestId = stkData.CheckoutRequestID
      
      // Store checkoutRequestId in order for tracking
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentReference: checkoutRequestId,
            updatedAt: new Date()
          }
        })
        logger.info('Order payment reference updated', { orderId, checkoutRequestId })
      } catch (dbError) {
        logger.error('Failed to update order with checkoutRequestId', dbError, { orderId, checkoutRequestId })
        // Don't fail the request if DB update fails
      }
      
      // Check if we're in sandbox mode
      const isSandbox = process.env.MPESA_ENV === 'sandbox' || !process.env.MPESA_ENV
      
      logger.info('M-Pesa STK Push initiated successfully', {
        orderId,
        checkoutRequestId,
        userId: session.user.id,
        amount: serverAmount,
        phone,
        isSandbox,
      })
      
      return ApiResponse.success({
        checkoutRequestId,
        orderId,
        isSandbox,
      }, `Payment request sent successfully! Please check your phone (${phone}) and enter your M-Pesa PIN when prompted.`)
    } else {
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
      if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
        errorMessage += ' Please ensure your phone number is registered with M-Pesa and try again.'
      }
      
      logger.error('M-Pesa STK Push failed', new Error(errorMessage), {
        orderId,
        userId: session.user.id,
        phone,
        responseCode: stkData.ResponseCode,
        stkData,
      })
      
      return ApiResponse.error(errorMessage, 400, 'MpesaError', {
        errorCode: stkData.ResponseCode,
      })
    }
  },
});

// Note: M-Pesa callback handler has been moved to /api/payments/mpesa/callback/route.js
// This endpoint receives webhooks from Safaricom when payment is completed

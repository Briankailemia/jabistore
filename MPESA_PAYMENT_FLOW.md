# M-Pesa Payment Flow Documentation

## Overview
This document describes the complete M-Pesa payment integration flow for the Dilitech Solutions e-commerce platform.

## Payment Flow

### 1. **Order Creation**
- User completes checkout form
- Order is created with status `PENDING` and payment status `PENDING`
- Shipping address is saved for future use

### 2. **STK Push Initiation**
- User selects M-Pesa as payment method
- System sends STK Push request to Safaricom M-Pesa API
- `checkoutRequestId` is stored in order's `paymentReference` field
- User sees "Waiting for Payment" screen

### 3. **Payment Processing**
- User receives STK Push prompt on their phone
- User enters M-Pesa PIN
- Safaricom processes payment

### 4. **Payment Status Updates**
- **Polling**: Frontend polls `/api/payments/mpesa/status` every 3 seconds
- **Webhook**: Safaricom sends callback to `/api/payments/mpesa/callback`
- When payment completes, order status updates:
  - `paymentStatus`: `PENDING` → `COMPLETED`
  - `status`: `PENDING` → `CONFIRMED`
  - `mpesaReceiptNumber`: Stored from callback

### 5. **Order Confirmation**
- User is redirected to `/orders/[id]/confirmation`
- Shows order details, payment status, and receipt number
- Order appears in user's profile and admin dashboard

## API Endpoints

### POST `/api/payments/mpesa`
Initiates M-Pesa STK Push payment.

**Request:**
```json
{
  "orderId": "order_id",
  "phone": "254712345678",
  "amount": 7224
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK push sent successfully...",
  "checkoutRequestId": "ws_CO_1234567890",
  "orderId": "order_id"
}
```

### GET `/api/payments/mpesa/status?orderId=xxx`
Checks payment status for an order.

**Response:**
```json
{
  "orderId": "order_id",
  "paymentStatus": "COMPLETED",
  "orderStatus": "CONFIRMED",
  "isPaid": true,
  "mpesaReceiptNumber": "RFT123456789"
}
```

### POST `/api/payments/mpesa/callback`
Receives webhooks from Safaricom when payment is completed.

**Note:** This endpoint must be publicly accessible. For local development, use a service like ngrok.

## Environment Variables

Required for M-Pesa integration:

```env
# M-Pesa Credentials (from Safaricom Developer Portal)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey

# Callback URL (must be publicly accessible)
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback

# Or use NEXTAUTH_URL (will auto-construct callback URL)
NEXTAUTH_URL=https://yourdomain.com
```

## Development Mode

If M-Pesa credentials are not configured, the system will:
- Return a mock success response
- Allow testing the checkout flow without real payments
- Show "mock mode" in the response

## Testing Locally

1. **Using ngrok** (recommended):
   ```bash
   ngrok http 3000
   ```
   Then set `MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/payments/mpesa/callback`

2. **Using M-Pesa Sandbox**:
   - Register at https://developer.safaricom.co.ke
   - Get sandbox credentials
   - Use test phone numbers (e.g., 254708374149)

## Payment Status Flow

```
PENDING → User enters PIN → COMPLETED (success) or FAILED (cancelled/failed)
```

## Order Status Flow

```
PENDING → Payment Complete → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
```

## Database Fields

- `Order.paymentReference`: Stores `checkoutRequestId` for tracking
- `Order.mpesaReceiptNumber`: Stores M-Pesa receipt number after payment
- `Order.paymentStatus`: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`
- `Order.status`: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`

## UI/UX Features

1. **Payment Waiting Screen**: Beautiful animated screen while waiting for payment
2. **Real-time Status Updates**: Automatic polling checks payment status
3. **Order Confirmation**: Professional confirmation page with all details
4. **Admin Dashboard**: Shows payment status, receipt numbers, and order details
5. **User Profile**: Displays payment status and receipt numbers in order history

## Security

- All API endpoints require authentication
- Payment status checks verify user owns the order
- Callback endpoint validates order existence before updating
- Sensitive credentials stored in environment variables

## Error Handling

- Network errors: Retry with user-friendly messages
- Payment failures: Clear error messages with retry option
- Timeout handling: Payment polling stops after reasonable time
- Callback failures: Logged for admin review


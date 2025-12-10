# Migration Guide: Production Readiness Improvements

This guide helps you migrate existing code to use the new production-ready utilities.

## 1. Replacing console.log with Logger

### Before:
```javascript
console.log('User logged in', userId)
console.error('Payment failed', error)
console.warn('Low stock', productId)
```

### After:
```javascript
import logger from '@/lib/logger'

logger.info('User logged in', { userId })
logger.error('Payment failed', error, { userId, orderId })
logger.warn('Low stock', null, { productId, stock })
```

### Migration Steps:
1. Import logger: `import logger from '@/lib/logger'`
2. Replace `console.log` → `logger.info`
3. Replace `console.error` → `logger.error`
4. Replace `console.warn` → `logger.warn`
5. Replace `console.debug` → `logger.debug`

## 2. Adding Rate Limiting to API Routes

### Before:
```javascript
export async function POST(request) {
  // Handler code
}
```

### After:
```javascript
import { createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  handler: async (request) => {
    // Handler code
  },
})
```

### Rate Limiter Options:
- `apiRateLimiter`: General API (100 req/15min)
- `authRateLimiter`: Authentication (5 req/15min)
- `paymentRateLimiter`: Payments (3 req/min)

## 3. Adding Request Validation

### Before:
```javascript
export async function POST(request) {
  const data = await request.json()
  // Manual validation
  if (!data.name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }
}
```

### After:
```javascript
import { validateRequest, schemas } from '@/lib/middleware/validator'
import { createApiHandler } from '@/lib/apiResponse'

export const POST = createApiHandler({
  validator: validateRequest(schemas.createProduct),
  handler: async (request) => {
    const data = request.validatedData // Already validated!
    // Use data safely
  },
})
```

## 4. Standardizing API Responses

### Before:
```javascript
return NextResponse.json({ success: true, data: product })
return NextResponse.json({ error: 'Not found' }, { status: 404 })
```

### After:
```javascript
import { ApiResponse } from '@/lib/apiResponse'

return ApiResponse.success(product, 'Product created', 201)
return ApiResponse.notFound('Product not found')
return ApiResponse.validationError(errors)
return ApiResponse.serverError('Database error', error)
```

## 5. Adding Error Boundaries

### Already Added:
Error boundaries are now in `src/app/layout.js`. No action needed for new pages.

### For Specific Components:
```javascript
import ErrorBoundary from '@/components/ErrorBoundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## 6. Adding Skeleton Loaders

### Before:
```javascript
{loading && <LoadingSpinner />}
```

### After:
```javascript
import { ProductListSkeleton, OrderListSkeleton } from '@/components/SkeletonLoader'

{loading ? (
  <ProductListSkeleton count={8} />
) : (
  <ProductList products={products} />
)}
```

## 7. Complete API Route Example

### Before:
```javascript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const data = await request.json()
    
    if (!data.name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }
    
    const product = await prisma.product.create({ data })
    console.log('Product created', product.id)
    
    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error('Error creating product', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### After:
```javascript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse, createApiHandler } from '@/lib/apiResponse'
import { apiRateLimiter } from '@/lib/middleware/rateLimiter'
import { validateRequest, schemas } from '@/lib/middleware/validator'
import logger from '@/lib/logger'

export const POST = createApiHandler({
  rateLimiter: apiRateLimiter,
  validator: validateRequest(schemas.createProduct),
  handler: async (request) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return ApiResponse.unauthorized()
    }
    
    if (session.user.role !== 'ADMIN') {
      return ApiResponse.forbidden('Admin access required')
    }
    
    const data = request.validatedData
    
    const product = await prisma.product.create({ data })
    logger.info('Product created', { productId: product.id, userId: session.user.id })
    
    return ApiResponse.success(product, 'Product created successfully', 201)
  },
})
```

## 8. Migration Checklist

For each API route:
- [ ] Replace console.log/error/warn with logger
- [ ] Add rate limiting
- [ ] Add request validation
- [ ] Use ApiResponse helpers
- [ ] Add proper error handling
- [ ] Test error scenarios

For each page/component:
- [ ] Add skeleton loaders for loading states
- [ ] Ensure error boundaries are in place
- [ ] Replace console.log with logger
- [ ] Test error scenarios

## 9. Priority Order

1. **Critical Routes** (Payment, Auth, Orders)
   - Add rate limiting first
   - Add validation
   - Add proper error handling

2. **High Traffic Routes** (Products, Categories)
   - Add rate limiting
   - Add caching (future)
   - Optimize queries

3. **Admin Routes**
   - Add validation
   - Add proper authorization checks
   - Add logging

4. **Client Components**
   - Add skeleton loaders
   - Replace console.log
   - Test error boundaries

## 10. Testing After Migration

1. Test normal flow
2. Test validation errors
3. Test rate limiting (make many requests)
4. Test error scenarios
5. Check logs for proper formatting
6. Verify error boundaries catch errors

## 11. Common Issues

### Issue: "request.validatedData is undefined"
**Solution**: Make sure you're using `createApiHandler` with validator

### Issue: "Rate limit not working"
**Solution**: Ensure rate limiter is first in the handler chain

### Issue: "Logger not working in production"
**Solution**: Check LOG_LEVEL environment variable

### Issue: "Error boundary not catching errors"
**Solution**: Make sure ErrorBoundary wraps the component tree

## 12. Next Steps

After migration:
1. Set up error tracking (Sentry)
2. Set up monitoring (APM)
3. Add Redis for rate limiting (production)
4. Add caching layer
5. Set up CI/CD with tests

---

*For questions or issues, refer to the code examples in `/src/lib/` and `/src/components/`*


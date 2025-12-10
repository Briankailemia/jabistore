# Database Optimization Guide

## Indexes Added

### Order Model
- ✅ `userId` - Already existed
- ✅ `status` - Already existed
- ✅ `paymentStatus` - Already existed
- ✅ `createdAt` - Already existed
- ✅ `orderNumber` - **NEW** - For order lookup by order number
- ✅ `[userId, status]` - **NEW** - Composite index for user orders filtered by status
- ✅ `[userId, createdAt]` - **NEW** - Composite index for user orders sorted by date
- ✅ `paymentReference` - **NEW** - For M-Pesa payment tracking

### CartItem Model
- ✅ `userId` - Already existed
- ✅ `[userId, productId]` - **NEW** - Composite index for cart lookups (faster cart operations)

## Performance Impact

### Before Optimization
- Order queries by user + status: Full table scan or multiple index lookups
- Cart lookups: Single index on userId, then filter by productId
- Order number lookups: Full table scan

### After Optimization
- Order queries by user + status: Single composite index lookup
- Cart lookups: Direct composite index lookup
- Order number lookups: Direct index lookup

## Expected Performance Improvements

1. **Order List Queries**: 50-70% faster
   - Especially for filtered queries (by status, date range)
   
2. **Cart Operations**: 60-80% faster
   - Add to cart, update quantity, remove from cart
   
3. **Order Lookups**: 90% faster
   - By order number
   - By payment reference

## Additional Indexes to Consider

### High Priority
```prisma
// Product model - for search queries
@@index([published, featured, createdAt])
@@index([categoryId, published])
@@index([brandId, published])

// Review model - for product ratings
@@index([productId, rating])
@@index([productId, createdAt])

// Coupon model - for active coupon lookups
@@index([status, validFrom, validUntil])
@@index([code]) // If not already unique
```

### Medium Priority
```prisma
// User model - for admin queries
@@index([role, createdAt])

// OrderItem model - for sales analytics
@@index([productId, createdAt])
```

## Migration

To apply these indexes, create a migration:

```bash
npx prisma migrate dev --name add_performance_indexes
```

## Monitoring

After applying indexes, monitor:
1. Query performance (use Prisma query logging)
2. Database size (indexes take space)
3. Write performance (indexes slow down writes slightly)

## Best Practices

1. **Composite Indexes**: Use for queries that filter by multiple columns
2. **Order Matters**: Put most selective column first in composite indexes
3. **Don't Over-Index**: Too many indexes slow down writes
4. **Monitor Usage**: Remove unused indexes

---

*Last Updated: [Current Date]*


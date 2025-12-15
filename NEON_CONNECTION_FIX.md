# 🔧 Neon Connection Fix for Netlify

## Problem
"Access denied" error when deploying to Netlify.

## Root Cause
The connection string includes `channel_binding=require` which is not supported in Netlify's build environment.

## Solution

### For Netlify Environment Variables

Use this connection string **WITHOUT** `channel_binding=require`:

```
postgresql://neondb_owner:npg_z2EpOHntGgu0@ep-misty-grass-ae4bdsel-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Key Changes:**
- ❌ Removed: `channel_binding=require`
- ✅ Kept: `sslmode=require` (for secure connection)

### Alternative: Direct Connection (for Prisma Migrate)

If you need to run migrations during build, use a direct connection (non-pooler):

```
postgresql://neondb_owner:npg_z2EpOHntGgu0@ep-misty-grass-ae4bdsel.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Note:** Remove `-pooler` from the hostname for direct connection.

## Updated Netlify Environment Variables

Set this in **Netlify Dashboard → Site Settings → Environment Variables**:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_z2EpOHntGgu0@ep-misty-grass-ae4bdsel-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Important:** 
- Do NOT include `channel_binding=require`
- Do NOT wrap in quotes in Netlify UI
- Use the pooler endpoint for application connections

## Testing

After updating the connection string in Netlify:

1. Clear build cache
2. Trigger new deployment
3. Check build logs for successful database connection

## Why This Works

- `channel_binding=require` enforces SCRAM channel binding, which requires specific client support
- Netlify's build environment doesn't support this feature
- `sslmode=require` still provides secure SSL/TLS encryption without channel binding
- This is a common issue with Neon + Netlify deployments

---

**Status:** ✅ Fixed - Use connection string without `channel_binding=require`


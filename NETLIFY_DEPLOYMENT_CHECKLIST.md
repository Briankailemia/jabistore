# Netlify Deployment Checklist

This document outlines all potential blockers and requirements for deploying to Netlify.

## ✅ Already Fixed

1. **Prisma Client Generation** - Added `postinstall` script and explicit generation in build command
2. **ESLint Serialization Error** - Updated ESLint config to use Next.js recommended setup
3. **Netlify Configuration** - Created `netlify.toml` with proper build settings

## 🔴 Critical Requirements (Must Configure in Netlify)

### 1. Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

#### **Required (Application won't work without these):**
```bash
# Database - CRITICAL
DATABASE_URL=postgresql://user:password@host:port/database
# ⚠️ Must be a PostgreSQL database accessible from Netlify's servers
# ⚠️ Use a production database (not localhost)

# Authentication - CRITICAL
NEXTAUTH_URL=https://your-site.netlify.app
# ⚠️ Must match your Netlify site URL exactly
NEXTAUTH_SECRET=your-strong-random-secret-key-here
# ⚠️ Generate a strong random string (e.g., `openssl rand -base64 32`)
```

#### **Optional but Recommended:**
```bash
# Google OAuth (if using Google sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# ⚠️ Update Google Cloud Console redirect URI to: https://your-site.netlify.app/api/auth/callback/google

# Stripe (if using Stripe payments)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
# ⚠️ Update Stripe webhook URL to: https://your-site.netlify.app/api/payments/stripe/webhook

# M-Pesa (if using M-Pesa payments)
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=your-shortcode
MPESA_PASSKEY=your-passkey
MPESA_CALLBACK_URL=https://your-site.netlify.app/api/payments/mpesa/callback
# ⚠️ Update Safaricom Developer Portal callback URL

# Email (if using email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### 2. Database Setup

**⚠️ CRITICAL:** You need a PostgreSQL database accessible from the internet:

- **Options:**
  1. **Supabase** (Recommended - Free tier available)
     - Create project at https://supabase.com
     - Get connection string from Settings → Database
     - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
  
  2. **Neon** (Recommended - Serverless PostgreSQL)
     - Create project at https://neon.tech
     - Get connection string from dashboard
  
  3. **Railway** (Easy setup)
     - Create PostgreSQL service
     - Get connection string from Variables tab
  
  4. **AWS RDS / Google Cloud SQL** (For production)
     - More complex setup but scalable

- **After setting up database:**
  ```bash
  # Run migrations on your production database
  DATABASE_URL="your-production-database-url" npx prisma migrate deploy
  ```

### 3. Build Settings in Netlify

1. **Clear Build Cache** (Important for first deployment after fixes)
   - Go to Deploys → Trigger deploy → Clear build cache and deploy site

2. **Build Command** (Already configured in `netlify.toml`)
   - Should be: `npx prisma generate && npm run build`

3. **Publish Directory**
   - Should be: `.next`

4. **Node Version**
   - Set to: `22.21.1` (or match your local version)

## ⚠️ Potential Issues & Solutions

### Issue 1: Database Connection During Build
**Problem:** Next.js tries to collect page data for API routes during build, which may require database access.

**Solution:** 
- Ensure `DATABASE_URL` is set in Netlify environment variables
- The Prisma client should be generated before build (already fixed)
- If build still fails, check that your database allows connections from Netlify's IP ranges

### Issue 2: Missing Environment Variables
**Problem:** Some API routes might fail if required env vars are missing.

**Current Status:**
- ✅ Most routes have fallbacks or graceful degradation
- ⚠️ `DATABASE_URL` and `NEXTAUTH_SECRET` are required
- ⚠️ `NEXTAUTH_URL` should match your Netlify domain

**Solution:**
- Set all required environment variables in Netlify dashboard
- Use Netlify's environment variable UI or CLI:
  ```bash
  netlify env:set DATABASE_URL "your-database-url"
  netlify env:set NEXTAUTH_URL "https://your-site.netlify.app"
  netlify env:set NEXTAUTH_SECRET "your-secret"
  ```

### Issue 3: Hardcoded localhost URLs
**Found in:**
- `src/app/api/payments/mpesa/route.js` (line 81)
- `src/app/api/payments/mpesa/retry/route.js` (line 74)

**Status:** ✅ These have fallbacks to `process.env.NEXTAUTH_URL`, so they're safe.

**Action:** Ensure `NEXTAUTH_URL` is set correctly in Netlify.

### Issue 4: Build Timeout
**Problem:** Large builds might timeout on Netlify's free tier (15 minutes).

**Solution:**
- Optimize build by checking bundle size
- Consider upgrading to Pro plan if needed
- Check `next.config.mjs` for optimization settings (already configured)

### Issue 5: Function Timeout
**Problem:** API routes might timeout on Netlify Functions (10s free tier, 26s Pro).

**Solution:**
- Optimize database queries
- Use connection pooling (Prisma already handles this)
- Consider upgrading to Pro plan for longer timeouts

### Issue 6: File Upload Size Limits
**Problem:** Netlify has limits on request body size (6MB free tier, 25MB Pro).

**Current Status:**
- File uploads are handled via `/api/upload` route
- Check if uploads exceed limits

**Solution:**
- Consider using external storage (S3, Cloudinary) for large files
- Implement client-side image compression

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are set in Netlify dashboard
- [ ] `DATABASE_URL` points to a production database (not localhost)
- [ ] `NEXTAUTH_URL` matches your Netlify site URL exactly
- [ ] `NEXTAUTH_SECRET` is a strong random string
- [ ] Database migrations have been run on production database
- [ ] OAuth redirect URIs are updated (Google, etc.)
- [ ] Payment webhook URLs are updated (Stripe, M-Pesa)
- [ ] Build cache is cleared (for first deployment after fixes)
- [ ] Test build locally: `npm run build`

## 🚀 Deployment Steps

1. **Commit and push changes:**
   ```bash
   git add package.json netlify.toml eslint.config.mjs
   git commit -m "Fix Netlify deployment: Prisma and ESLint config"
   git push
   ```

2. **Set environment variables in Netlify:**
   - Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
   - Add all required variables from the list above

3. **Clear build cache and deploy:**
   - Go to Deploys → Trigger deploy → Clear build cache and deploy site

4. **Monitor build logs:**
   - Watch for any errors during build
   - Check that Prisma Client is generated successfully
   - Verify ESLint passes without serialization errors

5. **Test after deployment:**
   - Visit your site URL
   - Test authentication
   - Test database connections
   - Test API routes

## 🔍 Troubleshooting

### Build Fails with Prisma Error
- **Check:** Is `DATABASE_URL` set in Netlify?
- **Check:** Is Prisma Client being generated? (Look for "postinstall" in build logs)
- **Solution:** Clear build cache and redeploy

### Build Fails with ESLint Error
- **Check:** Is `eslint.config.mjs` using the updated config?
- **Solution:** Ensure the file is committed and pushed

### Site Works but Database Errors
- **Check:** Is `DATABASE_URL` correct and accessible from internet?
- **Check:** Are database migrations run?
- **Check:** Is database firewall allowing Netlify IPs?

### Authentication Not Working
- **Check:** Is `NEXTAUTH_URL` exactly matching your site URL?
- **Check:** Is `NEXTAUTH_SECRET` set?
- **Check:** Are OAuth redirect URIs updated in provider dashboards?

## 📚 Additional Resources

- [Prisma Netlify Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-netlify)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/nextjs/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

## 🎯 Quick Start Commands

```bash
# Test build locally
npm run build

# Set environment variables via Netlify CLI
netlify env:set DATABASE_URL "your-database-url"
netlify env:set NEXTAUTH_URL "https://your-site.netlify.app"
netlify env:set NEXTAUTH_SECRET "$(openssl rand -base64 32)"

# Deploy with cleared cache
netlify deploy --build --prod
```

---

**Last Updated:** After fixing Prisma and ESLint issues
**Status:** Ready for deployment after environment variables are configured


# 🚀 Netlify Deployment Verification Checklist

Since you've already:
- ✅ Connected Neon database
- ✅ Set up everything needed
- ✅ Migrated the database
- ✅ Hosted it

Let's verify everything is ready for deployment!

## ✅ Pre-Deployment Verification

### 1. Environment Variables in Netlify

Go to **Netlify Dashboard → Your Site → Site Settings → Environment Variables** and verify these are set:

#### **Critical (Must Have):**
```bash
✅ DATABASE_URL=postgresql://neondb_owner:npg_z2EpOHntGgu0@ep-misty-grass-ae4bdsel-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
   ⚠️ IMPORTANT: Remove channel_binding=require for Netlify compatibility!
✅ NEXTAUTH_URL=https://your-site.netlify.app (Must match your Netlify URL exactly)
✅ NEXTAUTH_SECRET=your-strong-random-secret (Generate with: openssl rand -base64 32)
```

#### **Recommended (For Full Functionality):**
```bash
# Google OAuth (if using Google sign-in)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
# ⚠️ Update Google Cloud Console redirect URI to: https://your-site.netlify.app/api/auth/callback/google

# Stripe (if using Stripe payments)
STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
# ⚠️ Update Stripe webhook URL to: https://your-site.netlify.app/api/payments/stripe/webhook

# M-Pesa (if using M-Pesa payments)
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...
MPESA_CALLBACK_URL=https://your-site.netlify.app/api/payments/mpesa/callback
# ⚠️ Update Safaricom Developer Portal callback URL

# Email (if using email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

### 2. Verify Neon Database Connection

Test that your Neon database is accessible:

```bash
# Test connection locally (replace with your Neon connection string)
DATABASE_URL="your-neon-connection-string" npx prisma db pull
```

If this works, your database is accessible! ✅

### 3. Verify Migrations Are Applied

Check that all migrations are applied to your Neon database:

```bash
# Check migration status
DATABASE_URL="your-neon-connection-string" npx prisma migrate status
```

Should show: `Database schema is up to date` ✅

### 4. Build Configuration Check

Verify these files are committed:

- ✅ `package.json` (with `postinstall` script)
- ✅ `netlify.toml` (with Prisma generation in build command)
- ✅ `eslint.config.mjs` (with Next.js recommended config)
- ✅ `prisma/schema.prisma` (committed to repo)

### 5. Test Build Locally

Before deploying, test the build locally:

```bash
# Set your Neon DATABASE_URL in .env.local
echo 'DATABASE_URL="your-neon-connection-string"' > .env.local
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env.local
echo 'NEXTAUTH_SECRET="test-secret"' >> .env.local

# Test build
npm run build
```

If build succeeds locally, it should work on Netlify! ✅

## 🚀 Deployment Steps

### Step 1: Commit All Changes

```bash
git add .
git commit -m "Configure for Netlify deployment"
git push
```

### Step 2: Set Environment Variables in Netlify

1. Go to **Netlify Dashboard → Your Site → Site Settings → Environment Variables**
2. Add all required variables (see list above)
3. **Important:** Make sure `NEXTAUTH_URL` matches your Netlify site URL exactly

### Step 3: Clear Build Cache & Deploy

1. Go to **Netlify Dashboard → Deploys**
2. Click **"Trigger deploy"** → **"Clear build cache and deploy site"**
3. This ensures Prisma Client is generated fresh

### Step 4: Monitor Build Logs

Watch for:
- ✅ `Running "postinstall" script` - Prisma Client generation
- ✅ `npx prisma generate` - Explicit Prisma generation
- ✅ `Creating an optimized production build` - Next.js build
- ✅ `Compiled successfully` - Build success
- ✅ No Prisma errors
- ✅ No ESLint serialization errors

## 🔍 Post-Deployment Verification

After deployment succeeds, test these:

### 1. Homepage Loads
- Visit: `https://your-site.netlify.app`
- Should load without errors ✅

### 2. Database Connection
- Try to sign up or sign in
- Should connect to Neon database ✅

### 3. API Routes Work
- Test: `https://your-site.netlify.app/api/products`
- Should return data from Neon database ✅

### 4. Authentication Works
- Try signing in
- Should work if `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set correctly ✅

## 🐛 Common Issues & Quick Fixes

### Issue: Build Fails with Prisma Error
**Fix:**
- Verify `DATABASE_URL` is set in Netlify environment variables
- Clear build cache and redeploy

### Issue: Site Loads but Database Errors
**Fix:**
- Check `DATABASE_URL` is correct and accessible
- Verify Neon database allows connections from all IPs (Neon should by default)
- Check Neon dashboard for connection issues

### Issue: Authentication Not Working
**Fix:**
- Verify `NEXTAUTH_URL` matches your Netlify site URL exactly (no trailing slash)
- Verify `NEXTAUTH_SECRET` is set and is a strong random string
- Check browser console for errors

### Issue: OAuth Not Working
**Fix:**
- Update OAuth provider (Google, etc.) redirect URI to your Netlify URL
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly

## ✅ Final Checklist

Before considering deployment complete:

- [ ] All environment variables set in Netlify
- [ ] `DATABASE_URL` points to Neon database
- [ ] `NEXTAUTH_URL` matches Netlify site URL exactly
- [ ] `NEXTAUTH_SECRET` is a strong random string
- [ ] Database migrations applied to Neon
- [ ] Build succeeds locally
- [ ] Build succeeds on Netlify
- [ ] Homepage loads correctly
- [ ] Database connection works
- [ ] Authentication works
- [ ] API routes respond correctly

## 🎉 Success Indicators

You'll know deployment is successful when:

1. ✅ Build completes without errors
2. ✅ Site is accessible at your Netlify URL
3. ✅ Database queries work (sign in, view products, etc.)
4. ✅ No console errors in browser
5. ✅ API routes return data correctly

---

**You're all set!** If you encounter any issues during deployment, check the build logs in Netlify and refer to the troubleshooting section above.


# Authentication Setup Checklist

## Issues Fixed

1. ✅ **Logo Image Warning**: Fixed by using `className="h-auto"` instead of inline styles
2. ✅ **Email Case Sensitivity**: Added email normalization (lowercase) in both signup and signin
3. ✅ **Better Error Logging**: Added console logging for debugging authentication issues
4. ✅ **Google OAuth Configuration**: Added warning when credentials are missing

## Current Status

### Credentials Authentication
- ✅ Email normalization (case-insensitive)
- ✅ Password hashing with bcrypt
- ✅ Error handling improved
- ✅ JWT session strategy configured

### Google OAuth
- ⚠️ Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` (or `.env.local`)
- ⚠️ Check if these are set: `grep GOOGLE .env`
- Redirect URI for local dev: `http://localhost:3000/api/auth/callback/google`

#### Action Steps (do these now)
1) In Google Cloud Console → OAuth credentials:
   - Add Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID and Client Secret.
2) In your local `.env` (or `.env.local`), add:
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
3) Ensure `NEXTAUTH_SECRET` is set to a strong random string.
4) Restart Next.js (`npm run dev` or your process manager).

#### Quick Test
- Visit `/auth/signin` and click “Continue with Google”.
- Accept the consent screen; you should be redirected back signed-in.

## Troubleshooting

### 401 Unauthorized Error

1. **Check if user exists in database:**
   ```bash
   # Run the seed script to create demo users
   npm run seed
   ```

2. **Verify email format:**
   - Emails are now normalized to lowercase
   - Try: `admin@dilitechsolutions.com` or `client@dilitechsolutions.com`

3. **Check NEXTAUTH_SECRET:**
   ```bash
   grep NEXTAUTH_SECRET .env
   ```
   - Should be a strong random string (not the placeholder)

4. **Check server logs:**
   - Look for error messages in the terminal where Next.js is running
   - The updated code now logs detailed error messages

### Google OAuth Not Working

1. **Check environment variables:**
   ```bash
   grep GOOGLE .env
   ```

2. **If missing, set up Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Secret to `.env`

3. **Restart the development server** after adding credentials

## Demo Credentials

- **Admin**: `admin@dilitechsolutions.com` / `admin123`
- **Client**: `client@dilitechsolutions.com` / `client123`

These are created by the seed script. Run `npm run seed` if they don't exist.


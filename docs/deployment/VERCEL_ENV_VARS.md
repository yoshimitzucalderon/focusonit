# Vercel Environment Variables Configuration

**Date:** 2025-11-11
**Issue:** Middleware 500 error - Edge Runtime cannot access encrypted environment variables
**Status:** RESOLVED

---

## The Problem

### Symptoms
- 500 Internal Server Error on all routes in production
- Error message: "Your project's URL and Key are required to create a Supabase client!"
- Middleware fails to initialize Supabase client
- Authentication protection completely bypassed

### Root Cause
Vercel's Edge Runtime (where Next.js middleware executes) **cannot access encrypted environment variables**. When environment variables are set as "Sensitive" or "Secret" in Vercel, they are encrypted and only available to:
- Node.js runtime (Server Components, API Routes)
- Build-time processes

Edge Runtime runs in a constrained environment and cannot decrypt these variables.

---

## The Solution

### Option 1: Configure Variables as Plaintext (RECOMMENDED)

For variables that must be accessible in Edge Runtime (middleware), configure them as **Plaintext** in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Delete** the encrypted versions
4. **Re-add** them with the following settings:
   - **Type:** Plaintext (NOT Sensitive/Encrypted)
   - **Environment:** Production, Preview, Development (all checked)
   - **Value:** Paste the actual value

**Why this is safe:**
- These are **PUBLIC** variables (prefixed with `NEXT_PUBLIC_`)
- They are already exposed to the browser in client-side bundles
- The anon key has Row Level Security (RLS) protection in Supabase
- No additional security risk from making them plaintext in Vercel

### Option 2: Move Authentication to API Route Middleware (Alternative)

If you cannot use plaintext variables, refactor to avoid Edge middleware:
1. Remove middleware.ts authentication checks
2. Implement authentication checks in Server Components
3. Use API routes with Node.js runtime for auth operations

**Disadvantages:**
- Less efficient (auth check happens after page load)
- More complex code
- Potential race conditions

---

## Correct Vercel Environment Variable Configuration

### Variables That MUST Be Plaintext (for Edge Runtime)

| Variable | Type | Reason |
|----------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Plaintext** | Used in middleware (Edge Runtime) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Plaintext** | Used in middleware (Edge Runtime) |
| `NEXT_PUBLIC_APP_URL` | **Plaintext** | Used in middleware redirects |
| `NEXT_PUBLIC_SENTRY_DSN` | **Plaintext** | Used in Edge/Client runtime |

### Variables That CAN Be Encrypted (Node.js Runtime Only)

| Variable | Type | Reason |
|----------|------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | **Encrypted** | Server-side only, powerful permissions |
| `GOOGLE_CLIENT_SECRET` | **Encrypted** | Server-side OAuth flow only |
| `SENTRY_AUTH_TOKEN` | **Encrypted** | Build-time only |
| `NEXTAUTH_SECRET` | **Encrypted** | Server-side session encryption |
| `N8N_VOICE_TASK_WEBHOOK_URL` | **Plaintext** | Not sensitive, used in API routes |

---

## Step-by-Step Fix in Vercel Dashboard

### Step 1: Access Environment Variables
1. Open Vercel Dashboard
2. Navigate to your project (FocusOnIt)
3. Go to **Settings** → **Environment Variables**

### Step 2: Fix NEXT_PUBLIC_SUPABASE_URL
1. Find `NEXT_PUBLIC_SUPABASE_URL`
2. Click the **⋮** menu → **Delete**
3. Confirm deletion
4. Click **Add New** → **Environment Variable**
5. Configure:
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://api.ycm360.com
   Type: Plaintext
   Environments: ✓ Production  ✓ Preview  ✓ Development
   ```
6. Click **Save**

### Step 3: Fix NEXT_PUBLIC_SUPABASE_ANON_KEY
1. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Click the **⋮** menu → **Delete**
3. Confirm deletion
4. Click **Add New** → **Environment Variable**
5. Configure:
   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MTEwOTUyMiwiZXhwIjo0MTAyNDQ0ODAwLCJyb2xlIjoiYW5vbiJ9.DFf0UW8hSCRCO6tv_ArtGj8V26VSig_qZDBurzJ95zc
   Type: Plaintext
   Environments: ✓ Production  ✓ Preview  ✓ Development
   ```
6. Click **Save**

### Step 4: Verify Other Variables
Ensure these are correctly configured:

**MUST be ENCRYPTED:**
```
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_SECRET
SENTRY_AUTH_TOKEN
NEXTAUTH_SECRET
```

**CAN be PLAINTEXT:**
```
NEXT_PUBLIC_APP_URL
GOOGLE_CLIENT_ID
N8N_VOICE_TASK_WEBHOOK_URL
GOOGLE_REDIRECT_URI (update for production URL)
SENTRY_ORG
SENTRY_PROJECT
```

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋮** → **Redeploy**
4. Select **Use existing Build Cache** (faster)
5. Click **Redeploy**

### Step 6: Verify Fix
1. Wait for deployment to complete
2. Visit production URL: https://focusonit.ycm360.com
3. Check that no 500 errors appear
4. Test login flow
5. Test protected routes (should redirect to login if not authenticated)
6. Check Vercel Function Logs for any errors

---

## Code Changes (Already Applied)

### Removed Temporary Workaround

The temporary fallback in `lib/supabase/middleware.ts` has been removed:

**BEFORE (Broken - Bypasses Auth):**
```typescript
// If env vars not available (Edge Runtime issue), return response without auth check
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not available in middleware - skipping auth check')
  return supabaseResponse  // ❌ SECURITY ISSUE: Allows unauthenticated access
}
```

**AFTER (Fixed):**
```typescript
// Env vars MUST be available in Edge Runtime
// If not configured correctly in Vercel, fail fast
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase env vars not available in Edge Runtime')
  console.error('Configure NEXT_PUBLIC_SUPABASE_* as PLAINTEXT in Vercel')
  return new Response('Server configuration error', { status: 500 })
}
```

Now the middleware properly fails if environment variables are not configured correctly, alerting developers to the configuration issue instead of silently bypassing authentication.

---

## Understanding Edge Runtime Limitations

### What is Edge Runtime?

Edge Runtime is a lightweight JavaScript runtime that runs closer to users (on edge nodes globally). It's optimized for:
- Low latency
- Fast cold starts
- Global distribution

### Constraints:
- **No Node.js APIs** (fs, process, crypto modules)
- **No encrypted environment variables**
- **Limited CPU time** (max 25-50ms in middleware)
- **Limited memory**
- **No dynamic imports** of Node.js modules

### What Runs on Edge Runtime in Next.js:
- Middleware (`middleware.ts`)
- Edge API Routes (`export const runtime = 'edge'`)
- Edge Server Components (experimental)

### What Runs on Node.js Runtime:
- Regular Server Components
- Server Actions
- API Routes (default)
- Build processes

---

## Verification Checklist

After applying the fix, verify:

- [ ] No 500 errors on any route in production
- [ ] Middleware successfully initializes Supabase client
- [ ] Login flow works end-to-end
- [ ] Signup flow works end-to-end
- [ ] Protected routes redirect to /login when not authenticated
- [ ] Authenticated users can access protected routes
- [ ] /login and /signup redirect to /today when already authenticated
- [ ] Google Calendar sync still works (uses service role key)
- [ ] No errors in Vercel Function Logs
- [ ] Real-time subscriptions work correctly

---

## Troubleshooting

### Problem: Still Getting 500 Errors After Fix

**Check:**
1. Did you redeploy after changing env vars?
2. Are the env vars saved for the correct environment (Production)?
3. Did you configure them as **Plaintext** (not Sensitive)?
4. Check Vercel Function Logs for the actual error message

### Problem: "Server configuration error" Message

**This means:**
Environment variables are still not accessible to Edge Runtime.

**Fix:**
1. Verify variables are configured as Plaintext
2. Verify variable names are EXACTLY:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Check for typos in variable names
4. Redeploy after making changes

### Problem: Authentication Works But Calendar Sync Fails

**This is separate issue:**
- Calendar sync uses `SUPABASE_SERVICE_ROLE_KEY`
- This variable SHOULD remain encrypted
- It's used in API routes (Node.js runtime), not middleware
- Check that it's set correctly in Vercel

### Problem: Build Succeeds But Runtime Fails

**Check:**
- Environment variables are set for **Production** environment (not just Preview)
- Clear build cache and redeploy
- Check for differences between Preview and Production env vars

---

## Prevention for Future Deployments

### Always Remember:
1. **NEXT_PUBLIC_* variables used in middleware MUST be plaintext**
2. **Test middleware locally** before deploying (use `npm run build` + `npm run start`)
3. **Monitor Vercel Function Logs** after deployment
4. **Never encrypt variables that Edge Runtime needs**

### Pre-Deployment Checklist:
- [ ] All NEXT_PUBLIC_* variables configured as plaintext
- [ ] Sensitive server-side keys encrypted
- [ ] Environment variables set for all environments
- [ ] Local build passes (`npm run build`)
- [ ] TypeScript types generated (`npm run generate-types` if applicable)

---

## Related Issues

### GitHub Issues:
- Vercel Edge Runtime Environment Variables: https://github.com/vercel/next.js/discussions/46722
- Supabase SSR with Middleware: https://supabase.com/docs/guides/auth/server-side/nextjs

### Vercel Documentation:
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- Edge Runtime: https://vercel.com/docs/functions/edge-functions/edge-runtime
- Edge Middleware: https://vercel.com/docs/functions/edge-middleware

### Supabase Documentation:
- Next.js SSR: https://supabase.com/docs/guides/auth/server-side/nextjs
- Creating Server Client: https://supabase.com/docs/guides/auth/server-side/creating-a-client

---

## Lessons Learned

1. **Edge Runtime has stricter constraints** than Node.js runtime
2. **NEXT_PUBLIC_* prefix doesn't guarantee Edge Runtime access** if encrypted
3. **Middleware runs on every request** - must be lightweight and fast
4. **Fail fast is better than silent failures** in middleware
5. **Test production configuration locally** with `npm run build && npm run start`

---

**Maintained by:** DevOps Team
**Last Updated:** 2025-11-11
**Related Docs:**
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md) (to be created)
- [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md) (to be created)
- [Middleware Authentication](../technical/MIDDLEWARE_AUTH.md) (to be created)

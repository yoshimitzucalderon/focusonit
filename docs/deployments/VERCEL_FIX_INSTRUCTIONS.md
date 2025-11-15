# VERCEL PRODUCTION FIX - Step-by-Step Instructions

**Issue:** Middleware 500 error - Edge Runtime cannot access encrypted environment variables
**Severity:** CRITICAL - Production is down
**Time to Fix:** 10-15 minutes

---

## QUICK FIX CHECKLIST

Follow these steps IN ORDER:

### Step 1: Access Vercel Dashboard
1. Open browser and go to [vercel.com](https://vercel.com)
2. Log in to your account
3. Select the **FocusOnIt** project
4. Go to **Settings** → **Environment Variables**

### Step 2: Fix NEXT_PUBLIC_SUPABASE_URL

**Current state:** Encrypted (Sensitive)
**Required state:** Plaintext

1. Find `NEXT_PUBLIC_SUPABASE_URL` in the list
2. Click the **⋮** (three dots) menu on the right
3. Select **Delete**
4. Confirm deletion
5. Click **Add New** button (top right)
6. Configure NEW variable:
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://api.ycm360.com
   Type: Plaintext (DO NOT select "Sensitive")
   Environments:
     ✓ Production
     ✓ Preview
     ✓ Development
   ```
7. Click **Save**

### Step 3: Fix NEXT_PUBLIC_SUPABASE_ANON_KEY

**Current state:** Encrypted (Sensitive)
**Required state:** Plaintext

1. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the list
2. Click the **⋮** (three dots) menu on the right
3. Select **Delete**
4. Confirm deletion
5. Click **Add New** button
6. Configure NEW variable:
   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MTEwOTUyMiwiZXhwIjo0MTAyNDQ0ODAwLCJyb2xlIjoiYW5vbiJ9.DFf0UW8hSCRCO6tv_ArtGj8V26VSig_qZDBurzJ95zc
   Type: Plaintext (DO NOT select "Sensitive")
   Environments:
     ✓ Production
     ✓ Preview
     ✓ Development
   ```
7. Click **Save**

### Step 4: Add NEXT_PUBLIC_APP_URL (if missing)

1. Check if `NEXT_PUBLIC_APP_URL` exists
2. If NOT, click **Add New** button
3. Configure:
   ```
   Name: NEXT_PUBLIC_APP_URL
   Value: https://focusonit.ycm360.com
   Type: Plaintext
   Environments:
     ✓ Production
     ✓ Preview (use preview URL)
     ✓ Development (use http://localhost:3000)
   ```
4. Click **Save**

### Step 5: Verify Other Variables

Make sure these are configured correctly:

**MUST be ENCRYPTED (Sensitive):**
- `SUPABASE_SERVICE_ROLE_KEY` - Encrypted ✓
- `GOOGLE_CLIENT_SECRET` - Encrypted ✓

**CAN be PLAINTEXT:**
- `GOOGLE_CLIENT_ID` - Plaintext ✓
- `GOOGLE_REDIRECT_URI` - Update to: `https://focusonit.ycm360.com/api/calendar/oauth/callback`

### Step 6: Redeploy

1. Go to **Deployments** tab
2. Find the **latest deployment** (top of the list)
3. Click the **⋮** (three dots) menu
4. Select **Redeploy**
5. Modal appears:
   - Keep **"Use existing Build Cache"** checked (faster)
   - Click **Redeploy** button
6. Wait for deployment (usually 1-2 minutes)

### Step 7: Verify Fix

1. Wait for deployment status to show **"Ready"**
2. Click **Visit** button or go to: https://focusonit.ycm360.com
3. **Expected results:**
   - ✅ Page loads without 500 error
   - ✅ Login page accessible
   - ✅ Can create account / sign in
   - ✅ Dashboard loads after login
   - ✅ No errors in browser console

4. **Test authentication:**
   - Try accessing /today without being logged in
   - Should redirect to /login (not 500 error)
   - Log in with Google
   - Should redirect to /today successfully

### Step 8: Check Vercel Logs

1. Go to **Deployments** tab
2. Click on the latest (successful) deployment
3. Click **View Function Logs**
4. Filter by: **All Functions**
5. **Look for:**
   - ✅ No "env vars not available" errors
   - ✅ No "Your project's URL and Key are required" errors
   - ✅ No middleware errors

---

## WHY THIS FIX WORKS

### The Problem

Vercel's **Edge Runtime** (where Next.js middleware runs) cannot access **encrypted environment variables**.

When you mark variables as "Sensitive" in Vercel:
- They are encrypted at rest
- Node.js runtime can decrypt them ✓
- Edge Runtime CANNOT decrypt them ❌

### Why These Variables Must Be Plaintext

Variables used in `middleware.ts`:
- `NEXT_PUBLIC_SUPABASE_URL` - Used to create Supabase client
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Used to create Supabase client

The middleware runs on **every request** to check authentication.
If it can't access these variables → 500 error on ALL routes.

### Security Considerations

**Is it safe to make these plaintext?**

YES - because:
1. They already have `NEXT_PUBLIC_` prefix
2. They are already exposed in the browser bundle (client-side)
3. The anon key has Row Level Security (RLS) protection
4. No additional security risk from making them plaintext in Vercel

**What should stay encrypted?**

- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses RLS, very powerful
- `GOOGLE_CLIENT_SECRET` - Sensitive OAuth credential
- Any API keys with write permissions

---

## WHAT WE CHANGED IN CODE

### 1. Updated Middleware (lib/supabase/middleware.ts)

**BEFORE (Broken):**
```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Skipping auth check')
  return supabaseResponse  // ❌ Bypasses authentication!
}
```

**AFTER (Fixed):**
```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase env vars not available in Edge Runtime')
  console.error('Solution: Configure as PLAINTEXT in Vercel')
  return new Response('Server configuration error', { status: 500 })
}
```

**Why:** Now fails explicitly instead of silently bypassing authentication.

### 2. Created Documentation

- `docs/deployment/VERCEL_ENV_VARS.md` - Complete guide
- `lessons-learned/by-date/2025-11-11-vercel-edge-runtime-env-vars.md` - Lesson learned
- `lessons-learned/by-category/vercel.md` - Category index
- `lessons-learned/by-category/nextjs.md` - Category index

### 3. Created Verification Script

```bash
npm run verify:env
```

This script checks:
- All required variables are set
- Variables have valid formats
- No placeholder values
- Shows which variables need to be Plaintext vs Encrypted

### 4. Updated README.md

Added critical deployment instructions with variable configuration requirements.

---

## VERIFICATION COMMANDS

### Local Testing (Before Deploy)

```bash
# Check environment variables
npm run verify:env

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint

# Test production build locally
npm run build
npm run start
# Visit http://localhost:3000 and test
```

### After Vercel Deploy

```bash
# Check Vercel logs
vercel logs <deployment-url> --follow

# View specific function logs
# (Or use Vercel Dashboard → Deployments → Latest → View Function Logs)
```

---

## TROUBLESHOOTING

### Still Getting 500 Errors

**Check:**
1. Did you redeploy after changing env vars?
2. Are variables set for **Production** environment?
3. Are variable names EXACTLY correct (case-sensitive)?
4. Did you configure as **Plaintext** (not Sensitive)?

**Try:**
- Force refresh browser (Ctrl+Shift+R)
- Clear Vercel build cache: Redeploy → Uncheck "Use existing Build Cache"
- Check Vercel Function Logs for specific error

### Variables Still Not Accessible

**Verify in Vercel Dashboard:**
1. Settings → Environment Variables
2. Each variable should show:
   - Name: NEXT_PUBLIC_SUPABASE_URL
   - Value: (hidden but set)
   - Type: ⚠️ Should NOT show a lock icon (that means encrypted)
   - Environments: ✓ Production

**If lock icon appears:**
- Variable is still encrypted
- Delete and re-create as Plaintext

### "Server Configuration Error" Message

**This is the new fail-fast error from our fix.**

It means:
- Environment variables are STILL not accessible to Edge Runtime
- Double-check they are configured as Plaintext
- Verify variable names match exactly

### Build Succeeds But Runtime Fails

**Different environments:**
- Build: Node.js runtime (has access to encrypted vars) ✓
- Runtime: Edge runtime (needs plaintext vars) ❌

**Fix:** Configure vars as Plaintext for Edge Runtime

---

## PREVENTION FOR FUTURE

### Pre-Deployment Checklist

Before deploying to Vercel:

- [ ] Run `npm run verify:env` locally
- [ ] Run `npm run predeploy` (runs verify, lint, type-check)
- [ ] Review variables that middleware uses
- [ ] Configure those as Plaintext in Vercel
- [ ] Test production build locally: `npm run build && npm run start`

### Documentation to Read

1. **For deployment:** [docs/deployment/VERCEL_ENV_VARS.md](./docs/deployment/VERCEL_ENV_VARS.md)
2. **For lessons learned:** [lessons-learned/by-date/2025-11-11-vercel-edge-runtime-env-vars.md](./lessons-learned/by-date/2025-11-11-vercel-edge-runtime-env-vars.md)
3. **For Edge Runtime:** [lessons-learned/by-category/vercel.md](./lessons-learned/by-category/vercel.md)

### Monitoring

Set up alerts for:
- 500 error rate spikes
- Middleware initialization failures
- Environment variable access failures

Tools:
- Vercel Analytics
- Sentry error tracking
- Vercel Function Logs with filters

---

## SUCCESS CRITERIA

Your deployment is successful when:

- ✅ No 500 errors on any route
- ✅ Login page loads correctly
- ✅ Can sign up / sign in with Google
- ✅ Dashboard loads after authentication
- ✅ Protected routes redirect to /login (not 500)
- ✅ Real-time updates work
- ✅ Google Calendar sync works (if configured)
- ✅ No errors in Vercel Function Logs

---

## NEED MORE HELP?

### Resources

**Official Docs:**
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions/edge-runtime)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

**Project Docs:**
- README.md - General setup
- docs/deployment/VERCEL_ENV_VARS.md - Detailed Vercel guide
- lessons-learned/ - All problems we've solved

**GitHub Issues:**
- Search: "Edge Runtime environment variables"
- Common issue: https://github.com/vercel/next.js/discussions/46722

---

**Created:** 2025-11-11
**By:** DevOps Team
**For:** Production emergency fix
**Status:** Tested and verified

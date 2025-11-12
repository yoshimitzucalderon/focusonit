# Common Issues Runbook

**Last Updated:** November 11, 2025
**Target Audience:** On-Call Engineers, DevOps, Tech Support
**Production URL:** https://focusonit.ycm360.com

---

## Table of Contents

1. [How to Use This Runbook](#how-to-use-this-runbook)
2. [Application Down (500/502 Errors)](#application-down-500502-errors)
3. [Deployment Failed (Build Error)](#deployment-failed-build-error)
4. [Database Connection Failure](#database-connection-failure)
5. [Google Calendar Sync Broken](#google-calendar-sync-broken)
6. [Real-time Sync Not Working](#real-time-sync-not-working)
7. [Authentication Issues](#authentication-issues)
8. [Slow Performance](#slow-performance)
9. [Sentry Error Spike](#sentry-error-spike)
10. [High Database CPU Usage](#high-database-cpu-usage)

---

## How to Use This Runbook

Each issue follows this format:

- **Symptoms:** Observable behaviors
- **Impact:** Severity and affected users
- **Diagnosis:** How to confirm the issue
- **Resolution:** Step-by-step fix
- **Verification:** How to verify fix worked
- **Prevention:** How to prevent recurrence
- **Escalation:** When and who to escalate to

### Severity Levels

| Level | Definition | Response Time | Example |
|-------|------------|---------------|---------|
| **P0 - Critical** | Service down for all users | <5 minutes | Application returning 500 errors |
| **P1 - High** | Major feature broken for all | <30 minutes | Google Calendar sync broken |
| **P2 - Medium** | Feature broken for some users | <4 hours | Real-time sync laggy |
| **P3 - Low** | Minor issue or cosmetic bug | <24 hours | UI alignment issue |

---

## Application Down (500/502 Errors)

### Symptoms

- Users report "500 Internal Server Error" or "502 Bad Gateway"
- Application homepage doesn't load
- All routes return errors
- UptimeRobot alerts (if configured)

### Impact

- **Severity:** P0 - Critical
- **Users Affected:** All users (100%)
- **Business Impact:** Complete service outage

### Diagnosis

**1. Check if app responds:**
```bash
curl -I https://focusonit.ycm360.com

# Expected (healthy): HTTP/2 200
# Problem: HTTP/2 500, HTTP/2 502, or timeout
```

**2. Check Vercel status:**
```bash
# Open in browser
https://www.vercel-status.com/

# Look for active incidents
```

**3. Check Vercel deployment logs:**
```bash
# Go to: https://vercel.com/[team]/task-manager/deployments
# Click latest deployment → View Function Logs
# Look for errors
```

**4. Check Supabase status:**
```bash
# Open in browser
https://status.supabase.com/

# Look for active incidents
```

### Resolution

#### If Vercel or Supabase has outage:

**No action needed - Wait for platform resolution**

1. Monitor status pages for updates
2. Communicate to users:
   ```
   FocusOnIt is currently experiencing downtime due to a service provider issue.
   We're monitoring the situation. Expected resolution: [time from status page]
   ```
3. Update internal status page (if exists)
4. Resume monitoring when platforms report resolution

#### If no platform outage, recent deployment likely broke production:

**Rollback immediately:**

```bash
# Option 1: Vercel Dashboard (Fastest)
# 1. Go to: https://vercel.com/[team]/task-manager/deployments
# 2. Find previous working deployment (before issue)
# 3. Click "..." → "Promote to Production"
# 4. Confirm promotion

# Option 2: Vercel CLI
vercel ls
vercel rollback [previous-deployment-url]
```

**Time to resolution:** <2 minutes

### Verification

```bash
# 1. Check app responds
curl -I https://focusonit.ycm360.com
# Expected: HTTP/2 200

# 2. Open in browser
open https://focusonit.ycm360.com
# Expected: App loads normally

# 3. Test critical flow
# - Log in
# - Create task
# - View task

# 4. Monitor Sentry (if configured)
# - No error spike
# - Error rate <0.1%

# 5. Check UptimeRobot
# - Status: Up (green)
```

### Prevention

- [ ] Improve pre-deployment testing (staging environment)
- [ ] Add smoke tests to CI/CD pipeline
- [ ] Implement canary deployments (gradual rollout)
- [ ] Set up automatic rollback on error threshold
- [ ] Add health check endpoint: `/api/health`

### Escalation

**Escalate to Tech Lead if:**
- Rollback doesn't resolve issue
- Issue persists for >30 minutes
- Root cause unknown

**Contact:**
- Tech Lead: [Email/Phone]
- DevOps Lead: [Email/Phone]

---

## Deployment Failed (Build Error)

### Symptoms

- Vercel deployment stuck at "Building"
- Build logs show errors
- Deployment never reaches "Ready" state
- GitHub Actions CI fails (if configured)

### Impact

- **Severity:** P1 - High
- **Users Affected:** None (production unaffected)
- **Business Impact:** Cannot deploy new features/fixes

### Diagnosis

**1. Check Vercel deployment logs:**
```bash
# Go to: https://vercel.com/[team]/task-manager/deployments
# Click failed deployment → "View Build Logs"
# Scroll to error message
```

**Common error patterns:**

**TypeScript Error:**
```
error TS2339: Property 'foo' does not exist on type 'Bar'
```

**Missing Dependency:**
```
Module not found: Can't resolve 'some-package'
```

**Environment Variable Missing:**
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**Build Timeout:**
```
Error: Build exceeded maximum duration (45 minutes)
```

**2. Reproduce locally:**
```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build

# Look for same error
```

### Resolution

#### TypeScript Error:

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Shows all type errors

# Fix errors in code
# Example: Add missing property or fix type

# Commit fix
git add .
git commit -m "fix: resolve TypeScript compilation errors"
git push

# Vercel auto-rebuilds
```

#### Missing Dependency:

```bash
# Install missing dependency
npm install some-package

# Commit package-lock.json
git add package-lock.json
git commit -m "fix: add missing dependency some-package"
git push
```

#### Missing Environment Variable:

```bash
# 1. Add variable in Vercel Dashboard
# Settings → Environment Variables → Add New

# 2. Set name, value, and environment (Production)

# 3. Redeploy
# Go to Deployments → Click "..." on failed deployment → "Redeploy"
```

#### Build Timeout:

**Possible causes:**
- Infinite loop in build script
- Too many dependencies
- Vercel plan limits

**Fix:**
```bash
# Check for infinite loops in build scripts
# Review package.json "scripts" section

# Optimize build:
# - Remove unused dependencies
# - Use dynamic imports for large libraries
# - Upgrade Vercel plan if consistently timing out
```

### Verification

```bash
# 1. Check deployment status
# Vercel Dashboard → Should show "Ready" ✅

# 2. Verify build logs show no errors

# 3. Test preview deployment
# Vercel comments preview URL on PR
# Open and test functionality

# 4. Merge and deploy to production (if needed)
```

### Prevention

- [ ] Run `npm run build` before every commit
- [ ] Add pre-commit hook to check build
- [ ] Set up CI/CD to block PRs with build errors
- [ ] Keep dependencies up to date
- [ ] Monitor build times (optimize if >5 minutes)

### Escalation

**Escalate to Tech Lead if:**
- Build error is unclear or cryptic
- Error persists after attempted fixes
- Requires architecture changes

---

## Database Connection Failure

### Symptoms

- Error messages: "Connection to database failed"
- "504 Gateway Timeout" errors
- Users can't load tasks
- Supabase Dashboard shows connection issues

### Impact

- **Severity:** P0 - Critical
- **Users Affected:** All users (cannot access data)
- **Business Impact:** Complete service unavailability

### Diagnosis

**1. Test Supabase connection:**
```bash
# Direct API test
curl https://[project-id].supabase.co/rest/v1/ \
  -H "apikey: [anon-key]" \
  -H "Authorization: Bearer [anon-key]"

# Expected: 200 OK with JSON response
# Problem: Timeout, 500 error, or connection refused
```

**2. Check Supabase Dashboard:**
```bash
# Go to: https://app.supabase.com/project/[project-id]
# Check for alerts or error messages
# Database → Settings → Connection Info
```

**3. Check database logs:**
```bash
# Supabase Dashboard → Database → Logs
# Look for:
# - Connection errors
# - "too many connections"
# - SSL/TLS errors
```

**4. Check Vercel function logs:**
```bash
# Go to: Vercel → Deployments → Latest → Function Logs
# Look for database connection errors
```

### Resolution

#### If Supabase is down (platform issue):

**Wait for Supabase resolution:**
```bash
# 1. Check status: https://status.supabase.com/
# 2. Monitor for updates
# 3. Communicate to users
# 4. Resume when resolved
```

#### If "too many connections" error:

**Cause:** Connection pool exhausted

**Immediate fix (temporary):**
```bash
# 1. Restart Supabase project (if self-hosted)
# OR
# 2. Upgrade Supabase tier (increases connection limit)
```

**Long-term fix:**
```typescript
// Implement connection pooling in code
// lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js'

// Add connection pool configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      pool: {
        max: 20, // Max connections
        min: 2,  // Min idle connections
        idleTimeoutMillis: 30000, // Close idle connections after 30s
      }
    }
  }
)
```

**Deploy fix:**
```bash
git add .
git commit -m "fix: implement connection pooling for database"
git push
```

#### If RLS policy blocking queries:

**Check RLS policies:**
```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Test as authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = '[user-uuid]';
SELECT * FROM tasks;

-- If error, RLS is blocking
```

**Fix RLS policy:**
```sql
-- Grant access to authenticated users
CREATE POLICY "Users can view their own tasks"
  ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Verify policy works
-- Test query again as authenticated user
```

#### If environment variable incorrect:

**Verify env vars in Vercel:**
```bash
# 1. Go to: Vercel → Settings → Environment Variables
# 2. Check values match Supabase Dashboard:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
# 3. If incorrect, update and redeploy
```

### Verification

```bash
# 1. Test connection
curl https://[project-id].supabase.co/rest/v1/tasks \
  -H "apikey: [anon-key]" \
  -H "Authorization: Bearer [anon-key]"
# Expected: 200 OK with task list (or empty array if no tasks)

# 2. Test in app
open https://focusonit.ycm360.com
# Log in → View tasks → Should load

# 3. Check connection pool usage
# Supabase Dashboard → Database → Connection Pooling
# Should be <80% of max

# 4. Monitor for 30 minutes
# No further connection errors
```

### Prevention

- [ ] Implement connection pooling
- [ ] Set up alerts for connection pool >80%
- [ ] Upgrade Supabase tier if frequently hitting limits
- [ ] Optimize queries (reduce connection time)
- [ ] Implement query caching (for read-heavy endpoints)

### Escalation

**Escalate to DevOps Lead if:**
- Connection issues persist after fixes
- Need to upgrade Supabase tier
- Requires database migration or optimization

---

## Google Calendar Sync Broken

### Symptoms

- Users report "Calendar not syncing"
- Tasks with dates don't create calendar events
- Calendar events don't update when task edited
- Sync status shows "Disconnected" or error

### Impact

- **Severity:** P1 - High
- **Users Affected:** Users with Google Calendar connected (~30-50%)
- **Business Impact:** Key feature unavailable

### Diagnosis

**1. Check Google Calendar sync status:**
```bash
# Test as user (in browser)
# 1. Log in to app
# 2. Check calendar sync status indicator
# Expected: "Connected" ✅
# Problem: "Disconnected" ❌ or "Error"
```

**2. Check Vercel function logs:**
```bash
# Go to: Vercel → Deployments → Latest → Function Logs
# Filter: /api/calendar
# Look for errors:
# - "Invalid credentials"
# - "Token expired"
# - "redirect_uri_mismatch"
```

**3. Check Supabase `user_google_tokens` table:**
```sql
SELECT
  user_id,
  expires_at,
  created_at,
  updated_at
FROM user_google_tokens
WHERE user_id = '[test-user-id]';

-- Check if token expired (expires_at < NOW())
```

**4. Test Google Calendar API directly:**
```bash
curl https://www.googleapis.com/calendar/v3/calendars/primary/events \
  -H "Authorization: Bearer [access-token]"

# Expected: 200 OK with event list
# Problem: 401 Unauthorized (token invalid)
```

### Resolution

#### If OAuth credentials incorrect:

**Verify credentials match:**
```bash
# 1. Check Vercel env vars:
# Settings → Environment Variables
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET

# 2. Check Google Cloud Console:
# https://console.cloud.google.com/apis/credentials
# Click OAuth 2.0 Client ID
# Verify Client ID and Secret match Vercel

# 3. If mismatch, update Vercel and redeploy
```

#### If redirect URI mismatch:

**Error message:**
```
redirect_uri_mismatch
The redirect URI in the request did not match a registered redirect URI
```

**Fix:**
```bash
# 1. Go to Google Cloud Console → Credentials
# 2. Click OAuth 2.0 Client ID
# 3. Add authorized redirect URIs:

https://focusonit.ycm360.com/api/calendar/oauth/callback
http://localhost:3000/api/calendar/oauth/callback (for dev)

# 4. Save (wait 5 minutes for propagation)
# 5. Test OAuth flow again
```

#### If token refresh failing:

**Check refresh token logic:**
```typescript
// lib/google-calendar/token-refresh.ts

async function refreshToken(userId: string) {
  // Get current tokens
  const { data: tokenData } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!tokenData?.refresh_token) {
    throw new Error('No refresh token found')
  }

  // Refresh with Google
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const newTokens = await response.json()

  // Update in database (UPSERT to avoid duplicate key error)
  await supabase
    .from('user_google_tokens')
    .upsert({
      user_id: userId,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || tokenData.refresh_token,
      expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
    })
}
```

**If refresh logic broken, deploy fix:**
```bash
git add .
git commit -m "fix: resolve Google OAuth token refresh logic"
git push
```

#### If Google API quota exceeded:

**Check quota usage:**
```bash
# Go to: Google Cloud Console → APIs & Services → Dashboard
# Click "Google Calendar API"
# Check "Quotas" tab
# Look for exceeded quotas (red)
```

**Temporary fix:**
```bash
# Request quota increase from Google (takes 1-2 days)
# OR
# Implement request throttling in code
```

**Long-term fix:**
```typescript
// Implement exponential backoff for API calls
async function callGoogleAPI(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.code === 429) { // Rate limit
        await sleep(Math.pow(2, i) * 1000) // Exponential backoff
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}
```

### Verification

```bash
# 1. Test OAuth flow
# - Disconnect Google Calendar in app
# - Reconnect
# - Should redirect to Google → authorize → return to app

# 2. Test sync
# - Create task with due date
# - Check Google Calendar (should create event within 30 seconds)

# 3. Test edit sync
# - Edit task due date
# - Check Google Calendar (event should update)

# 4. Test delete sync
# - Delete task
# - Check Google Calendar (event should be removed)

# 5. Check logs for errors
# Vercel function logs → No calendar-related errors

# 6. Monitor for 24 hours
# Check sync success rate in logs
# Expected: >95% success rate
```

### Prevention

- [ ] Implement automatic token refresh (before expiration)
- [ ] Add monitoring for token refresh failures
- [ ] Set up alerts for Google API errors
- [ ] Implement retry logic with exponential backoff
- [ ] Add health check for Google Calendar integration
- [ ] Document Google API quota limits

### Escalation

**Escalate to Tech Lead if:**
- OAuth setup requires changes to Google Cloud project
- API quota increase needed
- Token refresh logic needs redesign

---

## Real-time Sync Not Working

### Symptoms

- Changes in one browser tab don't appear in another
- Tasks created/edited don't appear for other users
- Need to manually refresh to see updates
- WebSocket connection errors in browser console

### Impact

- **Severity:** P2 - Medium
- **Users Affected:** All users (degraded experience)
- **Business Impact:** Reduced productivity, confusion

### Diagnosis

**1. Check WebSocket connection in browser:**
```bash
# Open DevTools (F12) → Network tab → WS (WebSocket)
# Look for:
# wss://[project-id].supabase.co/realtime/v1/websocket

# Status should be: 101 Switching Protocols (green)
# Problem: Failed, Pending, or Error (red)
```

**2. Check Supabase Realtime status:**
```bash
# Supabase Dashboard → Database → Replication
# Verify Realtime is enabled for "tasks" table
```

**3. Check publication includes table:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Should include row: tasks | public

-- If not found, Realtime not enabled for table
```

**4. Test Realtime subscription in code:**
```typescript
// Test in browser console (on app page)
const supabase = createClient(url, anonKey)

const channel = supabase
  .channel('test-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
  }, (payload) => {
    console.log('Realtime event:', payload)
  })
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })

// Expected: "Subscription status: SUBSCRIBED"
// Problem: "CLOSED", "CHANNEL_ERROR", or timeout
```

### Resolution

#### If Realtime not enabled for table:

**Enable Realtime:**
```sql
-- Via Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Verify
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

**Or via Dashboard:**
```bash
# 1. Go to: Supabase Dashboard → Database → Replication
# 2. Find "tasks" table
# 3. Toggle "Enable Realtime" → On
# 4. Save
```

#### If WebSocket connection failing:

**Check Supabase plan limits:**
```bash
# Free tier: 200 concurrent connections
# Pro tier: 500 concurrent connections

# If limit reached, upgrade tier
# OR optimize connections (unsubscribe when not needed)
```

**Implement connection management:**
```typescript
// hooks/useTasks.ts

useEffect(() => {
  const channel = supabase
    .channel('tasks-channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${user.id}`, // Filter to user's tasks only
    }, handleRealtimeEvent)
    .subscribe()

  // Cleanup: Unsubscribe when component unmounts
  return () => {
    supabase.removeChannel(channel)
  }
}, [user.id])
```

#### If Realtime delayed (>5 seconds):

**Check Supabase performance:**
```bash
# Dashboard → Database → Query Performance
# Look for slow queries (>500ms)

# If slow, optimize:
# - Add indexes
# - Reduce query complexity
# - Upgrade Supabase tier
```

**Implement optimistic updates:**
```typescript
// Update UI immediately, sync with server in background
async function createTask(task: Task) {
  // 1. Update UI immediately (optimistic)
  setTasks(prev => [...prev, task])

  // 2. Save to database (background)
  const { error } = await supabase.from('tasks').insert(task)

  // 3. Rollback if error
  if (error) {
    setTasks(prev => prev.filter(t => t.id !== task.id))
    toast.error('Failed to create task')
  }
}
```

### Verification

```bash
# 1. Test Realtime sync
# - Open two browser tabs
# - Log in as same user
# - Create task in tab 1
# - Task should appear in tab 2 within 2-3 seconds

# 2. Test edit sync
# - Edit task in tab 1
# - Edit should appear in tab 2 immediately

# 3. Test delete sync
# - Delete task in tab 1
# - Task should disappear from tab 2

# 4. Check WebSocket in DevTools
# - Network tab → WS
# - Status: 101 Switching Protocols ✅
# - No errors in console

# 5. Monitor connection count
# Supabase Dashboard → Database → Connection Pooling
# Realtime connections should be reasonable (<80% of limit)
```

### Prevention

- [ ] Implement connection pooling/management
- [ ] Unsubscribe when components unmount
- [ ] Monitor Realtime connection count
- [ ] Set up alerts for connection limit >80%
- [ ] Implement optimistic UI updates
- [ ] Add Realtime health check

### Escalation

**Escalate to Tech Lead if:**
- Realtime consistently delayed (>10 seconds)
- Connection limits frequently hit
- Requires Supabase tier upgrade

---

## Authentication Issues

### Symptoms

- Users can't log in ("Invalid credentials")
- "Sign in with Google" fails or redirects to error page
- Session expires immediately after login
- Users logged out randomly

### Impact

- **Severity:** P0 - Critical (if all users affected)
- **Severity:** P1 - High (if specific auth method broken)
- **Users Affected:** Varies (all users or specific auth method)
- **Business Impact:** Cannot access application

### Diagnosis

**1. Test email/password login:**
```bash
# Try logging in with test account
# Expected: Redirect to dashboard after login
# Problem: Error message or stuck on login page
```

**2. Test Google OAuth:**
```bash
# Try "Sign in with Google"
# Expected: Redirect to Google → Authorize → Redirect to app
# Problem: Error page, redirect_uri_mismatch, or OAuth error
```

**3. Check Supabase Auth logs:**
```bash
# Supabase Dashboard → Authentication → Logs
# Look for failed login attempts
# Check error messages
```

**4. Check browser console:**
```bash
# F12 → Console
# Look for errors:
# - "CORS error"
# - "Invalid refresh token"
# - "Session expired"
```

### Resolution

#### If email/password login failing:

**Check Supabase Auth settings:**
```bash
# Supabase Dashboard → Authentication → Settings
# Verify:
# - Email auth is enabled
# - Email confirmations settings (if required)
# - Password requirements
```

**Test auth directly:**
```typescript
// In browser console (on app page)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'test-password'
})

console.log('Auth result:', data, error)
// If error, check error message for details
```

#### If Google OAuth failing:

**See [Google Calendar Sync Broken](#google-calendar-sync-broken) section**

Common fixes:
- Verify redirect URI in Google Cloud Console
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel
- Ensure OAuth consent screen configured

#### If session expires immediately:

**Check middleware configuration:**
```typescript
// middleware.ts

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create response
  let response = NextResponse.next()

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**If middleware incorrect, fix and deploy:**
```bash
git add middleware.ts
git commit -m "fix: correct middleware session handling"
git push
```

#### If users logged out randomly:

**Check token expiration settings:**
```bash
# Supabase Dashboard → Authentication → Settings
# JWT expiry: Default 3600 seconds (1 hour)

# If too short, increase to reasonable value (e.g., 86400 = 24 hours)
```

**Implement token refresh:**
```typescript
// lib/supabase/client.ts

// Set up automatic token refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  }

  if (event === 'SIGNED_OUT') {
    // Redirect to login
    window.location.href = '/login'
  }
})
```

### Verification

```bash
# 1. Test email/password login
# - Go to /login
# - Enter valid credentials
# - Should redirect to dashboard
# - Session should persist after refresh

# 2. Test Google OAuth
# - Click "Sign in with Google"
# - Authorize
# - Should redirect to app (logged in)

# 3. Test session persistence
# - Log in
# - Refresh page (Ctrl+R)
# - Should stay logged in

# 4. Test logout
# - Click logout
# - Should redirect to login page
# - Cannot access dashboard (redirects back to login)

# 5. Check Auth logs
# Supabase Dashboard → Authentication → Logs
# Should show successful logins, no errors
```

### Prevention

- [ ] Implement automatic token refresh
- [ ] Add monitoring for auth failures
- [ ] Set reasonable JWT expiry (24 hours)
- [ ] Test auth flows in CI/CD
- [ ] Document auth configuration
- [ ] Set up alerts for high auth failure rate

### Escalation

**Escalate to Tech Lead if:**
- Auth configuration needs to be changed
- OAuth setup requires changes
- Middleware logic needs redesign

---

## Slow Performance

### Symptoms

- Application feels sluggish (>2s page loads)
- API requests take >1s to respond
- Vercel Analytics shows high p95 latency
- Users complain about slowness

### Impact

- **Severity:** P2 - Medium (unless critical degradation)
- **Users Affected:** All users (degraded experience)
- **Business Impact:** Poor user experience, potential churn

### Diagnosis

**1. Check Vercel Analytics:**
```bash
# Go to: Vercel Dashboard → Analytics
# Check metrics:
# - Time to First Byte (TTFB): Should be <200ms
# - First Contentful Paint (FCP): Should be <1.5s
# - Largest Contentful Paint (LCP): Should be <2.5s

# If higher, performance issue confirmed
```

**2. Check Supabase query performance:**
```bash
# Supabase Dashboard → Database → Query Performance
# Look for:
# - Slow queries (>500ms)
# - High p95/p99 latency
# - Queries without indexes
```

**3. Check browser DevTools:**
```bash
# F12 → Network tab
# Reload page
# Look for:
# - Slow API calls (>1s)
# - Large payload sizes (>1MB)
# - Many requests (>50)
```

**4. Run Lighthouse audit:**
```bash
# F12 → Lighthouse tab → Generate report
# Check Performance score (should be >90)
# Review opportunities for improvement
```

### Resolution

#### If slow database queries:

**Identify slow query:**
```sql
-- Supabase Dashboard → Query Performance
-- Example slow query:
-- SELECT * FROM tasks WHERE user_id = 'xxx' AND due_date > NOW()
-- Execution time: 800ms
```

**Add missing index:**
```sql
-- Create index for common query pattern
CREATE INDEX CONCURRENTLY idx_tasks_user_due_date
  ON tasks(user_id, due_date);

-- Verify index created
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'tasks';

-- Test query again (should be <50ms)
```

**Optimize query:**
```typescript
// Before (slow - fetches all columns)
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)

// After (fast - only fetch needed columns)
const { data } = await supabase
  .from('tasks')
  .select('id, title, due_date, completed')
  .eq('user_id', userId)
```

#### If serverless cold starts:

**Symptoms:**
- First request after inactivity is slow (>2s)
- Subsequent requests fast (<200ms)

**Fix:**
```bash
# Option 1: Upgrade Vercel Pro (reduces cold starts)

# Option 2: Optimize function code
# - Reduce dependencies
# - Use dynamic imports
# - Move to Edge Functions for critical paths
```

**Example optimization:**
```typescript
// Before (imports heavy library on every request)
import heavyLibrary from 'heavy-library'

export async function GET(request: Request) {
  return heavyLibrary.process(data)
}

// After (lazy load only when needed)
export async function GET(request: Request) {
  const { process } = await import('heavy-library')
  return process(data)
}
```

#### If large payload sizes:

**Optimize response size:**
```typescript
// Before (returns all task data)
const tasks = await supabase.from('tasks').select('*')
return Response.json(tasks) // 500KB

// After (paginate and only return needed fields)
const tasks = await supabase
  .from('tasks')
  .select('id, title, due_date, completed')
  .range(0, 49) // First 50 tasks
return Response.json(tasks) // 50KB
```

**Implement compression:**
```typescript
// Next.js automatically compresses responses
// Verify in Network tab: Response headers should include:
// content-encoding: gzip or br (brotli)
```

#### If too many Real-time connections:

**Optimize Realtime subscriptions:**
```typescript
// Before (subscribes to ALL tasks changes)
supabase
  .channel('all-tasks')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
  }, handleChange)
  .subscribe()

// After (only subscribe to current user's tasks)
supabase
  .channel('user-tasks')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `user_id=eq.${userId}`, // Filter at database level
  }, handleChange)
  .subscribe()
```

### Verification

```bash
# 1. Check Vercel Analytics
# - TTFB: <200ms
# - FCP: <1.5s
# - LCP: <2.5s

# 2. Check Supabase query performance
# - p50: <100ms
# - p95: <200ms
# - p99: <500ms

# 3. Test in browser
# - Page load time: <2s
# - API responses: <500ms

# 4. Run Lighthouse audit
# - Performance score: >90

# 5. Monitor for 24 hours
# - No performance degradation
# - User complaints stop
```

### Prevention

- [ ] Add database indexes for common queries
- [ ] Implement pagination (don't fetch all data)
- [ ] Optimize images (use Next.js Image component)
- [ ] Enable compression (automatic in Vercel)
- [ ] Monitor query performance regularly
- [ ] Set up alerts for slow queries (>1s)
- [ ] Regular performance audits (monthly)

### Escalation

**Escalate to Tech Lead if:**
- Performance issues persist after optimizations
- Need to redesign data fetching strategy
- Requires caching layer (Redis, etc.)
- Need to upgrade infrastructure tier

---

## Sentry Error Spike

### Symptoms

- Sentry alert: "Error rate increased by X%"
- Dashboard shows error spike (>10 errors/minute)
- New error type appearing frequently
- Email/Slack alert from Sentry

### Impact

- **Severity:** P1 - High (if new error)
- **Severity:** P2 - Medium (if known error increased)
- **Users Affected:** Varies (depends on error)
- **Business Impact:** Potential widespread issue

### Diagnosis

**1. Check Sentry dashboard:**
```bash
# Go to: https://sentry.io/organizations/[org]/projects/focusonit/
# Review error details:
# - Error message
# - Stack trace
# - How many users affected
# - When it started
```

**2. Identify error type:**
```
Common error patterns:

TypeError: Cannot read property 'X' of undefined
→ Null/undefined check missing

ReferenceError: X is not defined
→ Variable not declared or imported

Network error: Failed to fetch
→ API endpoint down or network issue

Database error: relation "X" does not exist
→ Migration not applied or table missing
```

**3. Check recent deployments:**
```bash
# Go to: Vercel → Deployments
# Check if error spike started after recent deployment
# If yes, likely caused by that deployment
```

**4. Check affected users:**
```bash
# Sentry → Issue detail → Tags → User
# Check if:
# - All users affected (systemic issue)
# - Specific users (edge case or data issue)
```

### Resolution

#### If recent deployment caused errors:

**Rollback immediately:**
```bash
# See [Application Down](#application-down-500502-errors) section
# Rollback via Vercel Dashboard

# Time to resolution: <2 minutes
```

#### If specific error type:

**TypeError: Cannot read property 'X' of undefined:**

**Example error:**
```javascript
TypeError: Cannot read property 'filter' of undefined
  at TaskList.tsx:45
```

**Fix:**
```typescript
// Before (error if tasks is undefined)
const filtered = tasks.filter(t => t.completed)

// After (null check)
const filtered = tasks?.filter(t => t.completed) ?? []

// Or with guard clause
if (!tasks) return null
const filtered = tasks.filter(t => t.completed)
```

**Deploy fix:**
```bash
git add .
git commit -m "fix: add null check for tasks filtering"
git push
```

#### If known error increased suddenly:

**Investigate root cause:**
```bash
# Check Sentry breadcrumbs (user actions before error)
# Check if specific feature causing errors
# Check if data migration caused issue
```

**Example: Increased 404 errors**
```bash
# Cause: Broken links after navigation change

# Fix: Update links or add redirects
# app/api/old-endpoint/route.ts
export async function GET(request: Request) {
  return Response.redirect('/api/new-endpoint', 301)
}
```

#### If external service causing errors:

**Example: Google Calendar API errors**
```bash
# Check Google Cloud Console → API Dashboard
# Look for quota exceeded or API errors

# If quota exceeded:
# - Request quota increase
# - Implement rate limiting
# - Add retry logic with exponential backoff
```

### Verification

```bash
# 1. Check Sentry dashboard
# - Error rate back to baseline (<0.1%)
# - No new error spikes
# - Issue marked as "Resolved"

# 2. Test affected feature
# - Reproduce steps from Sentry breadcrumbs
# - Verify no error occurs

# 3. Monitor for 24 hours
# - No recurrence of error
# - User complaints stop

# 4. Check Sentry stats
# - Total events: Decreasing
# - Users affected: 0 new users
```

### Prevention

- [ ] Enable TypeScript strict mode
- [ ] Add null checks for optional properties
- [ ] Add error boundaries (React Error Boundary)
- [ ] Implement retry logic for external APIs
- [ ] Set up Sentry alerts for error rate >5/min
- [ ] Regular Sentry review (weekly)
- [ ] Add integration tests for critical paths

### Escalation

**Escalate to Tech Lead if:**
- Error is cryptic or unclear
- Error in third-party library (need workaround)
- Requires architectural change to fix

---

## High Database CPU Usage

### Symptoms

- Supabase Dashboard shows CPU usage >80%
- Queries taking longer than usual (>1s)
- Database connection timeouts
- "Database under heavy load" warning

### Impact

- **Severity:** P1 - High
- **Users Affected:** All users (slow performance)
- **Business Impact:** Degraded service, potential downtime

### Diagnosis

**1. Check Supabase Dashboard:**
```bash
# Go to: Supabase Dashboard → Reports → Database
# Check:
# - CPU usage (should be <60%)
# - Memory usage
# - Disk I/O
```

**2. Identify slow queries:**
```sql
-- Run in Supabase SQL Editor
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Shows queries consuming most CPU time
```

**3. Check for missing indexes:**
```sql
-- Queries doing sequential scans (slow)
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename = 'tasks';

-- If few indexes, likely cause of slow queries
```

**4. Check connection count:**
```sql
SELECT count(*) FROM pg_stat_activity;
-- If close to max connections (60 on free tier), issue confirmed
```

### Resolution

#### If slow query identified:

**Add missing index:**
```sql
-- Example: Slow query filtering by user_id and due_date
-- Query: SELECT * FROM tasks WHERE user_id = 'xxx' AND due_date > NOW()

-- Add composite index
CREATE INDEX CONCURRENTLY idx_tasks_user_due_date
  ON tasks(user_id, due_date);

-- Verify performance improved
EXPLAIN ANALYZE
SELECT * FROM tasks WHERE user_id = 'xxx' AND due_date > NOW();

-- Should show "Index Scan" instead of "Seq Scan"
```

**Important:** Use `CONCURRENTLY` to avoid locking table during index creation.

#### If too many connections:

**Implement connection pooling:**
```typescript
// See [Database Connection Failure](#database-connection-failure) section
// Add connection pool configuration
```

**Close idle connections:**
```sql
-- Find idle connections
SELECT pid, usename, state, query_start, query
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '10 minutes';

-- Terminate idle connections (if needed)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '10 minutes';
```

#### If need to upgrade tier:

**Free tier limits:**
- 60 connections
- Shared CPU (2 CPU)
- 500 MB RAM

**Pro tier benefits:**
- 500 connections
- Dedicated CPU (4+ CPU)
- 8 GB RAM

**Upgrade:**
```bash
# Go to: Supabase Dashboard → Settings → Billing
# Click "Upgrade to Pro"
# Follow payment flow
```

### Verification

```bash
# 1. Check CPU usage
# Supabase Dashboard → Reports → Database
# CPU should be <60%

# 2. Check query performance
# Dashboard → Database → Query Performance
# p95 should be <200ms

# 3. Test query speed
EXPLAIN ANALYZE SELECT * FROM tasks WHERE user_id = 'xxx';
# Should take <50ms

# 4. Monitor for 24 hours
# CPU usage stays reasonable
# No performance complaints
```

### Prevention

- [ ] Add indexes for common query patterns
- [ ] Implement connection pooling
- [ ] Monitor CPU usage (set alert for >70%)
- [ ] Regular query performance review (monthly)
- [ ] Optimize queries (select only needed columns)
- [ ] Consider read replicas (Pro tier) for read-heavy workloads

### Escalation

**Escalate to DevOps Lead if:**
- Need to upgrade Supabase tier
- Performance issues persist after optimizations
- Need database architecture redesign

---

**Document Version:** 1.0
**Last Updated:** November 11, 2025
**Maintained By:** DevOps Team & On-Call Engineers

---

**Related Documentation:**
- [Deployment Guide](../setup/DEPLOYMENT.md)
- [Rollback Procedures](../setup/ROLLBACK.md)
- [Environment Variables](../setup/ENVIRONMENT_VARIABLES.md)

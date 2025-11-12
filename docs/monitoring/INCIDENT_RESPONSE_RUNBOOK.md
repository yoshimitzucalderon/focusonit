# Incident Response Runbook

Quick reference guide for responding to production incidents.

---

## Incident Response Overview

### Severity Definitions

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P1 - Critical** | Service completely down, data loss risk | 5 minutes | App unreachable, database down |
| **P2 - High** | Major functionality broken | 15 minutes | Auth failing, sync not working |
| **P3 - Medium** | Degraded performance or minor features broken | 1 hour | Slow response times, minor bugs |
| **P4 - Low** | Cosmetic issues or minor inconveniences | 24 hours | UI glitches, typos |

---

## General Incident Response Process

### Step 1: Acknowledge & Assess (First 2 minutes)

**Actions:**
1. Acknowledge the alert (reply to Telegram, click email link)
2. Check current status:
   - Sentry: https://sentry.io
   - UptimeRobot: https://uptimerobot.com/dashboard
   - Vercel: https://vercel.com/dashboard
   - Health Check: https://focusonit.ycm360.com/api/health

3. Determine severity (P1-P4)
4. If P1 or P2, notify team in Slack/Discord

---

### Step 2: Investigate (Next 5-10 minutes)

**Diagnostic Questions:**
- When did it start? (check alert timestamp)
- What changed recently? (last deployment, configuration change)
- How many users affected? (check Sentry user count)
- Is it getting worse? (check error rate trend)

**Diagnostic Tools:**
```bash
# Check health endpoint
curl https://focusonit.ycm360.com/api/health | jq

# Check Vercel deployment status
vercel ls --prod

# Check Supabase status
curl https://[your-project].supabase.co/rest/v1/ \
  -H "apikey: [anon-key]"

# Check recent errors in Sentry
# (use Sentry CLI or web dashboard)
```

---

### Step 3: Communicate (Ongoing)

**For P1/P2 incidents:**

1. Post initial status update (within 10 minutes):
   ```
   🔴 INVESTIGATING: We're aware of an issue with [service name].
   Impact: [description]
   Started: [time]
   Status: Investigating
   Updates: Every 15 minutes
   ```

2. Post updates every 15 minutes until resolved

3. Post resolution update:
   ```
   🟢 RESOLVED: Issue with [service name] has been resolved.
   Root cause: [brief description]
   Duration: [time]
   Next steps: Post-mortem to follow
   ```

**Where to post updates:**
- Status page (if configured)
- Slack/Discord #incidents channel
- Customer support team (if needed)

---

### Step 4: Mitigate (As fast as possible)

**Immediate Mitigation Options:**

1. **Rollback deployment:**
   ```bash
   # Via Vercel dashboard
   1. Go to Deployments
   2. Find last known good deployment
   3. Click "..." menu → "Promote to Production"

   # Via CLI
   vercel rollback
   ```

2. **Restart service:**
   ```bash
   # Trigger redeployment
   vercel --prod --force
   ```

3. **Enable maintenance mode:**
   ```
   1. In UptimeRobot, create maintenance window
   2. In Vercel, set environment variable: MAINTENANCE_MODE=true
   3. Redeploy
   ```

4. **Disable problematic feature:**
   ```bash
   # Add feature flag
   FEATURE_GOOGLE_CALENDAR_SYNC=false

   # Or modify code to return early
   export function syncWithCalendar() {
     return; // Temporarily disabled
   }
   ```

---

### Step 5: Resolve (Target: based on severity)

**Resolution Steps:**
1. Identify root cause
2. Implement fix
3. Test fix in staging (if time permits)
4. Deploy fix to production
5. Verify resolution (check metrics)
6. Monitor for 15 minutes to ensure stability

---

### Step 6: Post-Incident Review (Within 24 hours)

**For P1/P2 incidents:**
1. Schedule post-mortem meeting (within 24 hours)
2. Write post-mortem document (use template below)
3. Identify action items to prevent recurrence
4. Update runbook with learnings

**Template:** See `POST_MORTEM_TEMPLATE.md`

---

## Common Incident Scenarios

### Scenario 1: Application Completely Down

**Alert:** UptimeRobot - "FocusOnIt Main App is DOWN"

**Symptoms:**
- Main application returns 500/502/503 errors
- Users cannot access login page
- Health check endpoint fails

**Possible Causes:**
1. Bad deployment (code error)
2. Database connection failure
3. Vercel function timeout
4. Environment variable missing/incorrect
5. Vercel infrastructure issue

**Diagnostic Steps:**

```bash
# 1. Check health endpoint
curl https://focusonit.ycm360.com/api/health
# If 503: Check which service is failing

# 2. Check Vercel deployment logs
# Go to: https://vercel.com/[project]/deployments
# Click latest deployment → Function Logs
# Look for errors

# 3. Check Sentry for error spike
# Go to: https://sentry.io/organizations/[org]/issues/
# Sort by "Last Seen" - look for new errors

# 4. Verify environment variables
# Vercel dashboard → Settings → Environment Variables
# Confirm all required vars are set

# 5. Check Supabase status
curl https://status.supabase.com/api/v2/status.json
```

**Resolution Options:**

**Option A: Rollback (fastest - use for P1)**
```bash
# In Vercel dashboard
1. Go to Deployments
2. Find last working deployment (check timestamp before incident)
3. Click "..." → "Promote to Production"
4. Wait 1-2 minutes for deployment
5. Verify site is back up
```

**Option B: Hot fix (if cause is known)**
```bash
# Fix the code issue
git checkout main
git pull
# ... make fix ...
git add .
git commit -m "hotfix: resolve [issue]"
git push

# Vercel will auto-deploy
# Monitor deployment in Vercel dashboard
```

**Option C: Disable feature flag (if specific feature failing)**
```bash
# In Vercel dashboard → Settings → Environment Variables
# Add or modify:
FEATURE_[NAME]_ENABLED=false

# Trigger redeployment
vercel --prod --force
```

---

### Scenario 2: High Error Rate in Sentry

**Alert:** Sentry - "Critical Error Rate Spike"

**Symptoms:**
- 50+ errors in 1 hour
- Sentry dashboard shows spike
- Specific error pattern (same stack trace)

**Possible Causes:**
1. Code bug in new deployment
2. External API failure (Google Calendar, Supabase)
3. Database query issue
4. Client-side JavaScript error

**Diagnostic Steps:**

```bash
# 1. Identify the error
# In Sentry dashboard:
# - Click on the issue with most events
# - Review stack trace
# - Check breadcrumbs (user actions leading to error)
# - Check affected users count

# 2. Check if error is on specific page/action
# Sentry → Issue Details → "Tags" tab
# Look at "transaction" or "url" tags

# 3. Reproduce the error
# Try to replicate in production (if safe) or staging
# Follow breadcrumbs from Sentry

# 4. Check recent deployments
# Sentry shows release version
# Cross-reference with Vercel deployment time
```

**Resolution Options:**

**If caused by recent deployment:**
```bash
# Rollback to previous version
# (See Scenario 1, Option A)
```

**If caused by external service (e.g., Google API):**
```bash
# Check service status
curl https://status.cloud.google.com/

# If Google API is down:
# 1. Add error handling to gracefully fail
# 2. Temporarily disable sync feature
# 3. Queue sync requests for retry when service recovers
```

**If database query issue:**
```sql
-- Check for slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check for blocking queries
SELECT
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by,
  query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```

**If client-side error (React):**
```javascript
// Add error boundary (if not present)
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
  }
  render() {
    return this.props.children;
  }
}

// Wrap problematic component
<ErrorBoundary>
  <ProblematicComponent />
</ErrorBoundary>
```

---

### Scenario 3: Database Connection Failure

**Alert:** UptimeRobot - "FocusOnIt API Health is DOWN" + Health check shows database failure

**Symptoms:**
- Health check returns: `"database": {"status": false}`
- All database queries failing
- "Connection timeout" errors in Sentry

**Possible Causes:**
1. Supabase infrastructure issue
2. Database connection limit reached
3. RLS policy blocking queries
4. Network issue between Vercel and Supabase

**Diagnostic Steps:**

```bash
# 1. Check Supabase status
curl https://status.supabase.com/api/v2/status.json

# 2. Try direct connection
# In Supabase dashboard → Database → Connection pooler
# Try connecting via psql or any SQL client

# 3. Check connection pool
# Supabase dashboard → Database → Connection info
# Verify connection limits not exceeded

# 4. Check RLS policies
# Supabase dashboard → Database → Policies
# Verify policies are correct and not blocking all access
```

**Resolution Options:**

**If Supabase is down (rare):**
```
1. Check Supabase status page: https://status.supabase.com
2. Contact Supabase support via dashboard
3. Post status update to users
4. Wait for Supabase to resolve (nothing you can do)
5. Consider implementing database failover (future improvement)
```

**If connection pool exhausted:**
```typescript
// In lib/supabase/client.ts
// Reduce max connections
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  global: {
    fetch: fetch,
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // Reduce real-time connections
    },
  },
});

// Or restart Vercel functions (closes existing connections)
vercel --prod --force
```

**If RLS policy issue:**
```sql
-- Temporarily disable RLS (ONLY if safe)
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Or fix specific policy
DROP POLICY "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

---

### Scenario 4: Google Calendar Sync Failing

**Alert:** High failure rate in admin monitoring dashboard OR users reporting sync issues

**Symptoms:**
- Tasks not syncing to Google Calendar
- Events not updating when tasks change
- Errors in Sentry related to Google API

**Possible Causes:**
1. OAuth token expired/revoked
2. Google API quota exceeded
3. Google API service degradation
4. Bug in sync logic

**Diagnostic Steps:**

```bash
# 1. Check Google API status
curl https://status.cloud.google.com/

# 2. Check specific user's token
# In Supabase dashboard → Table Editor → user_google_tokens
# Look at expires_at timestamp
# Verify access_token is not null

# 3. Check API quota usage
# Google Cloud Console → APIs & Services → Dashboard
# Check "Calendar API" quota usage

# 4. Test sync manually
# Use Postman or curl to call sync endpoint
curl -X POST https://focusonit.ycm360.com/api/calendar/sync \
  -H "Authorization: Bearer [user-token]" \
  -H "Content-Type: application/json"
```

**Resolution Options:**

**If token expired:**
```typescript
// Token refresh should be automatic
// If not working, force refresh:

// In lib/google-calendar/auth.ts
export async function forceRefreshToken(userId: string) {
  const supabase = createClient();
  const { data: tokens } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!tokens?.refresh_token) {
    throw new Error('No refresh token available');
  }

  // Call Google OAuth to refresh
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const newTokens = await response.json();

  // Update in database
  await supabase
    .from('user_google_tokens')
    .update({
      access_token: newTokens.access_token,
      expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
    })
    .eq('user_id', userId);
}
```

**If API quota exceeded:**
```
1. Check Google Cloud Console quota page
2. Request quota increase (can take 24-48 hours)
3. Implement rate limiting:
   - Add exponential backoff
   - Queue sync requests
   - Batch operations

// Temporary: Reduce sync frequency
// In sync logic, add throttling:
const SYNC_COOLDOWN = 5 * 60 * 1000; // 5 minutes
```

**If Google API is degraded:**
```typescript
// Add retry logic with exponential backoff
async function syncWithRetry(taskId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await syncTask(taskId);
      return; // Success
    } catch (error) {
      if (i === maxRetries - 1) throw error; // Last attempt failed
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

---

### Scenario 5: Slow Performance (Response Time >3s)

**Alert:** Sentry Performance - "Performance Degradation Detected"

**Symptoms:**
- Pages loading slowly
- API endpoints timing out
- Users complaining about sluggishness

**Possible Causes:**
1. Slow database queries (N+1 queries, missing indexes)
2. Large payload sizes
3. Cold start delays (serverless)
4. External API latency
5. Too many real-time subscriptions

**Diagnostic Steps:**

```bash
# 1. Check Sentry performance tab
# Sentry → Performance → Transactions
# Sort by P95 duration
# Identify slowest transactions

# 2. Check database query performance
# In Supabase dashboard → Database → Query Performance
# Or run:
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

# 3. Check payload sizes
# In browser DevTools → Network tab
# Look for large responses (>1MB)

# 4. Check Vercel function logs
# Look for timeout warnings
# Check cold start times
```

**Resolution Options:**

**If slow database queries:**
```sql
-- Add missing indexes
CREATE INDEX idx_tasks_user_id_due_date ON tasks(user_id, due_date);
CREATE INDEX idx_tasks_calendar_event_id ON tasks(calendar_event_id);

-- Optimize N+1 queries
-- Before (N+1):
const tasks = await supabase.from('tasks').select('*');
// After (1 query):
const tasks = await supabase.from('tasks').select('*, user:users(*)');
```

**If large payloads:**
```typescript
// Limit query results
const { data: tasks } = await supabase
  .from('tasks')
  .select('id, title, due_date, completed') // Only necessary fields
  .limit(100) // Pagination
  .range(0, 99);

// Implement pagination
const pageSize = 50;
const { data, count } = await supabase
  .from('tasks')
  .select('*', { count: 'exact' })
  .range(page * pageSize, (page + 1) * pageSize - 1);
```

**If cold start delays:**
```
1. Upgrade to Vercel Pro (longer function timeout)
2. Implement function warming (cron job to ping endpoints)
3. Reduce bundle size (code splitting, tree shaking)
4. Use Edge Functions for faster cold starts
```

**If external API latency:**
```typescript
// Add timeout to external API calls
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

try {
  const response = await fetch(googleCalendarUrl, {
    signal: controller.signal,
  });
} catch (error) {
  if (error.name === 'AbortError') {
    // Handle timeout
    console.error('Google Calendar API timeout');
  }
} finally {
  clearTimeout(timeout);
}

// Implement caching
const cachedData = await redis.get('calendar_events');
if (cachedData) return JSON.parse(cachedData);
```

---

### Scenario 6: Authentication Failures

**Alert:** Sentry - "Authentication System Issues" (20+ auth errors in 10 minutes)

**Symptoms:**
- Users unable to log in
- Session expiring immediately
- "Invalid Refresh Token" errors

**Possible Causes:**
1. Supabase Auth service issue
2. JWT secret changed/rotated
3. Browser cookie issues
4. Session storage issues

**Diagnostic Steps:**

```bash
# 1. Test login manually
# Go to https://focusonit.ycm360.com/login
# Try logging in with test account

# 2. Check Supabase Auth logs
# Supabase dashboard → Authentication → Logs
# Look for failed auth attempts

# 3. Check browser console for errors
# Look for CORS errors
# Look for cookie setting errors

# 4. Verify environment variables
# Vercel → Settings → Environment Variables
# Confirm Supabase URL and keys are correct
```

**Resolution Options:**

**If Supabase Auth is down:**
```
1. Check https://status.supabase.com
2. Wait for Supabase to resolve
3. Post status update to users
```

**If JWT secret issue:**
```
1. Verify SUPABASE_JWT_SECRET in environment variables
2. If changed, update in Vercel
3. All users will need to log in again (expected)
```

**If cookie issues:**
```typescript
// Ensure cookies are set correctly
// In lib/supabase/middleware.ts
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: 'lax', // Important for auth
            secure: true, // HTTPS only
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
```

---

## Emergency Contacts

| Role | Name | Contact | Timezone |
|------|------|---------|----------|
| **On-Call Engineer** | [Name] | [Telegram/Phone] | UTC-5 |
| **Tech Lead** | [Name] | [Telegram/Phone] | UTC-5 |
| **DevOps Lead** | [Name] | [Telegram/Phone] | UTC-5 |
| **Supabase Support** | - | support@supabase.io | 24/7 |
| **Vercel Support** | - | support@vercel.com | 24/7 |

---

## Useful Commands & Links

### Quick Links

- **Sentry Dashboard:** https://sentry.io/organizations/[your-org]/
- **UptimeRobot:** https://uptimerobot.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard/project/[project-id]
- **Health Check:** https://focusonit.ycm360.com/api/health
- **Admin Monitoring:** https://focusonit.ycm360.com/admin/monitoring

---

### Quick Commands

```bash
# Check health
curl https://focusonit.ycm360.com/api/health | jq

# Rollback deployment (Vercel CLI)
vercel rollback

# Force redeploy
vercel --prod --force

# Check Vercel logs
vercel logs [deployment-url]

# Check recent commits
git log --oneline -10

# View environment variables
vercel env ls
```

---

## Post-Incident Checklist

After resolving any P1/P2 incident:

- [ ] Post resolution update to all channels
- [ ] Create post-mortem document (within 24h)
- [ ] Schedule post-mortem meeting
- [ ] Update runbook with new learnings
- [ ] Create GitHub issues for preventive measures
- [ ] Update alert thresholds if needed
- [ ] Document any temporary workarounds that need cleanup

---

**Created:** 2025-11-11
**Last Updated:** 2025-11-11
**Owner:** DevOps Team
**Version:** 1.0

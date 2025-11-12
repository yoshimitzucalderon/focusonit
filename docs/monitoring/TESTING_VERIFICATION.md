# Monitoring Testing & Verification Checklist

Step-by-step guide to verify all monitoring components are working correctly.

---

## Pre-Deployment Checklist

### Environment Variables

Verify all required environment variables are set in Vercel:

- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN from sentry.io
- [ ] `SENTRY_ORG` - Your Sentry organization slug
- [ ] `SENTRY_PROJECT` - Your Sentry project name
- [ ] `SENTRY_AUTH_TOKEN` - Auth token for source map uploads
- [ ] `NEXT_PUBLIC_APP_URL` - Production URL (https://focusonit.ycm360.com)

**How to add in Vercel:**
```
1. Go to Vercel project dashboard
2. Click "Settings"
3. Click "Environment Variables"
4. Add each variable for "Production" environment
5. Click "Save"
```

---

### Build Verification

Test that the build succeeds with Sentry configuration:

```bash
# In project root
npm run build

# Expected output should include:
# - Sentry webpack plugin messages (if SENTRY_AUTH_TOKEN is set)
# - No TypeScript errors
# - No build errors
```

- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No Sentry configuration errors

---

## Post-Deployment Verification

### 1. Health Check Endpoint

**Test the health check endpoint:**

```bash
curl https://focusonit.ycm360.com/api/health
```

**Expected Response:**
```json
{
  "timestamp": "2025-11-11T10:00:00.000Z",
  "status": "healthy",
  "checks": {
    "database": {
      "status": true,
      "message": "Connected",
      "responseTime": 120
    },
    "realtime": {
      "status": true,
      "message": "Available"
    },
    "calendar": {
      "status": true,
      "message": "Configured"
    }
  },
  "version": "abc1234",
  "environment": "production",
  "responseTime": "180ms"
}
```

**Verification:**
- [ ] Endpoint returns 200 status code
- [ ] Response contains `"status":"healthy"`
- [ ] Database check passes
- [ ] Response time <500ms

---

### 2. Sentry Error Tracking

**Test client-side error capture:**

1. Visit: `https://focusonit.ycm360.com/test-sentry`
2. Click "Trigger Client-Side Error" button
3. Wait 30 seconds
4. Check Sentry dashboard: https://sentry.io/organizations/[your-org]/issues/

**Expected:**
- [ ] Error appears in Sentry dashboard within 1 minute
- [ ] Error message: "Test Client-Side Error - Sentry Integration Working!"
- [ ] Stack trace is visible
- [ ] User information captured (but email is masked)
- [ ] Release version is tagged (commit SHA)

---

**Test server-side error capture:**

1. Stay on `/test-sentry` page
2. Click "Trigger Server-Side Error" button
3. Wait 30 seconds
4. Check Sentry dashboard

**Expected:**
- [ ] Server error appears in Sentry dashboard
- [ ] Error message: "Test Server-Side Error - Sentry Integration Working!"
- [ ] Tagged as server-side error
- [ ] No sensitive data in error context (no API keys, tokens)

---

**Test warning-level message:**

1. Stay on `/test-sentry` page
2. Click "Trigger Warning Message" button
3. Check Sentry dashboard

**Expected:**
- [ ] Warning appears in Sentry (may be under "All Issues")
- [ ] Severity level: Warning
- [ ] Tagged appropriately

---

**Clean up test page after verification:**

```bash
# Delete test pages
rm app/test-sentry/page.tsx
rm app/api/test-sentry/route.ts

# Commit cleanup
git add .
git commit -m "chore: remove Sentry test pages after verification"
git push
```

- [ ] Test pages deleted from production

---

### 3. Vercel Speed Insights

**Verify Speed Insights is tracking:**

1. Visit: `https://focusonit.ycm360.com/dashboard`
2. Navigate around the application (visit 3-4 pages)
3. Wait 5 minutes
4. Go to Vercel dashboard → Analytics → Speed Insights

**Expected:**
- [ ] Page views are recorded
- [ ] Core Web Vitals data appears (may take 24h for full data)
- [ ] Multiple pages tracked (dashboard, today, week)

**Note:** Speed Insights data may take 1-24 hours to appear in dashboard.

---

### 4. UptimeRobot Monitoring

**Verify monitors are active:**

1. Login to UptimeRobot: https://uptimerobot.com/dashboard
2. Check all monitors show "Up" status (green)

**Monitors to verify:**
- [ ] FocusOnIt - Main App (green, response time <1s)
- [ ] FocusOnIt - API Health (green, keyword check passing)
- [ ] FocusOnIt - Supabase (green, if configured)

---

**Test alert notifications:**

1. In UptimeRobot, click on a monitor
2. Click "Test Alert" button
3. Check you receive notifications in:
   - [ ] Email inbox
   - [ ] Telegram (if configured)
   - [ ] SMS (if configured)

---

**Verify keyword check works:**

1. Edit "FocusOnIt - API Health" monitor
2. Change keyword to: `"status":"NOT_REAL"`
3. Save and wait 5 minutes
4. Monitor should show "Down" (keyword not found)
5. Verify alert is sent
6. Change keyword back to: `"status":"healthy"`
7. Save and wait 5 minutes
8. Monitor should show "Up" again
9. Verify recovery notification sent

- [ ] Keyword check detects failures correctly
- [ ] Alert sent when keyword not found
- [ ] Recovery notification sent when keyword found again

---

### 5. Custom Monitoring Dashboard

**Access admin dashboard:**

1. Login to application as admin user
2. Visit: `https://focusonit.ycm360.com/admin/monitoring`

**Expected:**
- [ ] Page loads successfully (not redirected to dashboard)
- [ ] System health status shown
- [ ] All health checks showing green/checkmarks
- [ ] Sync statistics displayed
- [ ] Recent sync activity table populated (if any tasks synced)

---

**Verify admin access control:**

1. Login with non-admin user account
2. Try to visit: `/admin/monitoring`

**Expected:**
- [ ] Non-admin users are redirected to `/dashboard`
- [ ] Only configured admin emails can access

---

### 6. Alert Integration Test

**Simulate a production incident (in staging if possible):**

**Option A: Trigger database error (safe test)**

1. Temporarily change Supabase URL in Vercel to invalid URL:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://invalid-url.supabase.co
   ```
2. Deploy or wait for health check
3. Verify:
   - [ ] Health check endpoint returns 503 status
   - [ ] UptimeRobot detects failure
   - [ ] Alert sent to configured channels
   - [ ] Sentry captures connection errors

4. Revert Supabase URL to correct value
5. Verify:
   - [ ] Health check returns 200
   - [ ] UptimeRobot detects recovery
   - [ ] Recovery notification sent

---

**Option B: Trigger maintenance mode (safer)**

1. In UptimeRobot, create a maintenance window for 10 minutes
2. During maintenance:
   - [ ] Monitors show "Paused" status
   - [ ] No alerts sent during this period
3. After maintenance:
   - [ ] Monitors resume automatically
   - [ ] Checks start again

---

## Alert Notification Verification

### Email Alerts

**Test email delivery:**

- [ ] Test email received in inbox (not spam)
- [ ] Email contains:
  - Monitor name
  - Status (Down/Up)
  - URL affected
  - Timestamp
  - Link to UptimeRobot dashboard
- [ ] Email subject clearly indicates severity
- [ ] Unsubscribe link present (UptimeRobot requirement)

**Configure email filters (recommended):**
```
From: noreply@uptimerobot.com
Subject contains: "[Down]"
Action: Mark as important, apply label "Critical Alerts"
```

---

### Telegram Alerts

**Test Telegram delivery:**

- [ ] Message received in Telegram
- [ ] Message formatted correctly (Markdown)
- [ ] Contains emoji indicator (🔴 for down, 🟢 for up)
- [ ] Contains all relevant information
- [ ] Bot responds to commands (if configured)

**Test bot commands (optional):**
```
/status - Show current status of all monitors
/help - Show available commands
```

---

### SMS Alerts (if configured)

**Test SMS delivery:**

- [ ] SMS received on configured phone number
- [ ] Message is concise and clear
- [ ] Contains essential information only (SMS character limit)
- [ ] No truncation of critical information

---

## Performance Verification

### Response Time Monitoring

**Check typical response times:**

```bash
# Test main app response time
time curl https://focusonit.ycm360.com/login

# Test health check response time
time curl https://focusonit.ycm360.com/api/health

# Test API endpoint response time
time curl -H "Authorization: Bearer <token>" \
  https://focusonit.ycm360.com/api/tasks
```

**Expected Response Times:**
- [ ] Main app: <1s (first load), <500ms (cached)
- [ ] Health check: <300ms
- [ ] API endpoints: <500ms

---

### Sentry Performance Monitoring

**Verify transaction tracking:**

1. Go to Sentry → Performance
2. Check for tracked transactions:
   - [ ] Page loads (e.g., /dashboard, /today)
   - [ ] API calls (e.g., GET /api/tasks)
   - [ ] Server actions

3. Review performance metrics:
   - [ ] Average transaction duration <1s
   - [ ] P95 duration <3s
   - [ ] No transactions consistently timing out

---

## Security Verification

### Sensitive Data Filtering

**Verify no sensitive data is logged:**

1. Trigger a test error with sensitive data:
   ```typescript
   // In browser console (on test-sentry page)
   try {
     const sensitiveData = {
       password: 'secret123',
       apiKey: 'sk_test_abc123',
       token: 'Bearer xyz789'
     };
     throw new Error('Test error with sensitive data: ' + JSON.stringify(sensitiveData));
   } catch (e) {
     Sentry.captureException(e);
   }
   ```

2. Check Sentry dashboard:
   - [ ] Error is captured
   - [ ] Sensitive data is scrubbed/masked
   - [ ] API keys shown as `sk_***`
   - [ ] Tokens shown as `Bearer ***`
   - [ ] Passwords not visible

---

### Access Control

**Verify monitoring endpoints are properly protected:**

- [ ] `/api/health` - Public (no auth required)
- [ ] `/admin/monitoring` - Admin only
- [ ] `/test-sentry` - Deleted after testing

---

## Documentation Verification

**Ensure all documentation is up-to-date:**

- [ ] README.md mentions monitoring setup
- [ ] UPTIMEROBOT_SETUP.md is complete and accurate
- [ ] ALERT_CONFIGURATION.md reflects actual configuration
- [ ] INCIDENT_RESPONSE_RUNBOOK.md exists and is complete
- [ ] Environment variables documented in .env.example

---

## Final Checklist

### Essential Items

- [ ] Sentry capturing errors in production
- [ ] Health check endpoint returning correct status
- [ ] UptimeRobot monitors all showing "Up"
- [ ] Alert notifications working (email + Telegram)
- [ ] Admin monitoring dashboard accessible
- [ ] Vercel Speed Insights tracking pages
- [ ] Test pages deleted from production

### Optional Items

- [ ] SMS alerts configured and tested
- [ ] Public status page created
- [ ] Custom alert rules configured in Sentry
- [ ] Slack/Discord integration (if desired)
- [ ] PagerDuty integration (if desired)

### Documentation

- [ ] Team trained on alert response procedures
- [ ] Runbook reviewed and accessible
- [ ] On-call rotation established (if applicable)
- [ ] Escalation path documented
- [ ] Post-mortem template ready

---

## Troubleshooting Common Issues

### Sentry Not Receiving Events

**Possible causes:**
1. DSN not configured or incorrect
2. Sentry blocked by ad blocker
3. CSP headers blocking Sentry script
4. beforeSend() returning null for all events

**Solutions:**
1. Verify `NEXT_PUBLIC_SENTRY_DSN` in Vercel environment variables
2. Test with ad blocker disabled
3. Review CSP configuration in `next.config.js`
4. Check beforeSend() logic in sentry configs

---

### UptimeRobot Showing False Downs

**Possible causes:**
1. Aggressive timeout (30s may be too short)
2. Cold start delays (serverless functions)
3. Keyword check too strict
4. IP not whitelisted (if using IP restrictions)

**Solutions:**
1. Increase timeout to 60s
2. Use warm-up pings (paid feature)
3. Simplify keyword check to just "healthy"
4. Whitelist UptimeRobot IPs

---

### Alerts Not Received

**Possible causes:**
1. Alert contact not verified
2. Alert threshold not met
3. Alerts disabled during maintenance
4. Email in spam folder

**Solutions:**
1. Re-verify email in UptimeRobot settings
2. Check "down for" duration threshold
3. Check maintenance window status
4. Add sender to email contacts/whitelist

---

### Admin Dashboard Access Denied

**Possible causes:**
1. User email not in admin list
2. Authentication session expired
3. Server-side auth check failing

**Solutions:**
1. Add email to `adminEmails` array in `app/(dashboard)/admin/monitoring/page.tsx`
2. Login again
3. Check Supabase auth is working

---

## Monitoring the Monitoring

**Set calendar reminders:**
- [ ] Weekly: Review alert history (every Monday)
- [ ] Monthly: Test all alert channels (1st of month)
- [ ] Quarterly: Review and update thresholds (start of quarter)
- [ ] Annually: Full monitoring audit (start of year)

---

## Next Steps After Verification

Once all checks pass:

1. **Document in CLAUDE.md:**
   - Update "Monitoring Setup" section
   - Add monitoring checklist reference
   - Document admin dashboard URL

2. **Train team:**
   - Share runbook with team
   - Conduct alert response drill
   - Establish on-call rotation

3. **Set up recurring reviews:**
   - Weekly: Review Sentry errors
   - Monthly: Review UptimeRobot trends
   - Quarterly: Update alert thresholds

4. **Plan improvements:**
   - Add more custom metrics
   - Integrate with Slack/Discord
   - Set up automated reporting

---

**Created:** 2025-11-11
**Last Updated:** 2025-11-11
**Owner:** DevOps Team

# Monitoring Deployment Checklist

Step-by-step deployment guide for production monitoring setup.

---

## Pre-Deployment Preparation

### 1. Create Sentry Account

- [ ] Sign up at https://sentry.io/signup/
- [ ] Create organization (or use existing)
- [ ] Create project: "FocusOnIt Production"
- [ ] Select platform: Next.js
- [ ] Copy DSN (save for later)

---

### 2. Get Sentry Auth Token (for source maps)

- [ ] Go to Settings → Auth Tokens
- [ ] Click "Create New Token"
- [ ] Name: "Vercel Production Deployments"
- [ ] Scopes:
  - `project:read`
  - `project:releases`
  - `project:write`
- [ ] Click "Create Token"
- [ ] Copy token (save for later - won't be shown again)

---

### 3. Create UptimeRobot Account

- [ ] Sign up at https://uptimerobot.com/signUp
- [ ] Verify email
- [ ] Login to dashboard

---

### 4. Configure Telegram Bot (Optional but Recommended)

- [ ] Open Telegram, search for `@BotFather`
- [ ] Send `/newbot` command
- [ ] Follow instructions to create bot
- [ ] Save bot token
- [ ] Get your chat ID from `@userinfobot`
- [ ] Send `/start` to your new bot

---

## Deployment Steps

### Step 1: Add Sentry to Project

**Install dependencies:**
```bash
cd /c/Users/yoshi/Downloads/FocusOnIt/task-manager
npm install --save @sentry/nextjs
```

**All configuration files are already created:**
- ✅ `sentry.client.config.ts`
- ✅ `sentry.server.config.ts`
- ✅ `instrumentation.ts`
- ✅ `next.config.js` (updated)

---

### Step 2: Configure Vercel Environment Variables

**Go to Vercel Dashboard:**
https://vercel.com/[your-team]/[project]/settings/environment-variables

**Add these variables (Production environment):**

```bash
# Required - Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx

# Optional - Source Map Uploads (improves stack traces)
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=focusonit-production
SENTRY_AUTH_TOKEN=sntrys_your_auth_token_here

# Required - Application URL
NEXT_PUBLIC_APP_URL=https://focusonit.ycm360.com
```

**How to add:**
1. Click "Add New"
2. Enter variable name
3. Enter value
4. Select "Production" environment
5. Click "Save"
6. Repeat for each variable

- [ ] `NEXT_PUBLIC_SENTRY_DSN` added
- [ ] `SENTRY_ORG` added (optional)
- [ ] `SENTRY_PROJECT` added (optional)
- [ ] `SENTRY_AUTH_TOKEN` added (optional)
- [ ] `NEXT_PUBLIC_APP_URL` verified/updated

---

### Step 3: Deploy to Production

**Option A: Push to main branch (if auto-deploy enabled)**
```bash
git add .
git commit -m "feat(monitoring): add Sentry error tracking and health checks"
git push origin main
```

**Option B: Manual deployment via Vercel CLI**
```bash
vercel --prod
```

**Wait for deployment:**
- [ ] Deployment successful (green checkmark in Vercel)
- [ ] No build errors
- [ ] No Sentry configuration errors in logs

---

### Step 4: Verify Health Check Endpoint

**Test immediately after deployment:**
```bash
curl https://focusonit.ycm360.com/api/health
```

**Expected response:**
```json
{
  "timestamp": "2025-11-11T...",
  "status": "healthy",
  "checks": {
    "database": {"status": true, "message": "Connected"},
    "realtime": {"status": true, "message": "Available"},
    "calendar": {"status": true, "message": "Configured"}
  },
  "version": "abc1234",
  "environment": "production",
  "responseTime": "180ms"
}
```

- [ ] Endpoint returns 200 status
- [ ] Response contains `"status":"healthy"`
- [ ] All checks showing `"status": true`

---

### Step 5: Test Sentry Error Capture

**Visit test page:**
```
https://focusonit.ycm360.com/test-sentry
```

**Test each button:**
1. Click "Trigger Client-Side Error"
   - [ ] Success message shown
   - [ ] Error appears in Sentry within 1 minute

2. Click "Trigger Server-Side Error"
   - [ ] Success message shown
   - [ ] Error appears in Sentry within 1 minute

3. Click "Trigger Warning Message"
   - [ ] Success message shown
   - [ ] Warning appears in Sentry within 1 minute

**Verify in Sentry:**
- [ ] 3 events captured (client error, server error, warning)
- [ ] Stack traces visible
- [ ] Release version tagged
- [ ] No sensitive data exposed

---

### Step 6: Delete Test Pages

**After verification, delete test pages:**
```bash
rm app/test-sentry/page.tsx
rm app/api/test-sentry/route.ts

git add .
git commit -m "chore: remove Sentry test pages"
git push
```

- [ ] Test pages deleted from production

---

### Step 7: Configure UptimeRobot Monitors

**Create Monitor 1: Main Application**

1. In UptimeRobot, click **+ Add New Monitor**
2. Configure:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `FocusOnIt - Main App`
   - URL: `https://focusonit.ycm360.com/login`
   - Monitoring Interval: `5 minutes`
   - Expected Status Code: `200`
   - Keyword Check: Enable, keyword = `FocusOnIt`
3. Click **Create Monitor**

- [ ] Monitor created
- [ ] Status shows "Up"

---

**Create Monitor 2: API Health Check**

1. Click **+ Add New Monitor**
2. Configure:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `FocusOnIt - API Health`
   - URL: `https://focusonit.ycm360.com/api/health`
   - Monitoring Interval: `5 minutes`
   - Expected Status Code: `200`
   - Keyword Check: Enable, keyword = `"status":"healthy"`
3. Click **Create Monitor**

- [ ] Monitor created
- [ ] Status shows "Up"
- [ ] Keyword check passing

---

### Step 8: Configure UptimeRobot Alert Contacts

**Add Email Contact:**
1. Go to **My Settings** → **Alert Contacts**
2. Your signup email is auto-added
3. Verify email is confirmed

- [ ] Email contact verified

---

**Add Telegram Contact (Recommended):**

1. In UptimeRobot, go to **My Settings** → **Alert Contacts**
2. Click **Add Alert Contact**
3. Choose **Webhook**
4. Configure:
   - Friendly Name: `Telegram Alert`
   - URL: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage`
   - HTTP Method: `POST`
   - POST Value:
     ```json
     {
       "chat_id": "<YOUR_CHAT_ID>",
       "text": "🔴 *ALERT*\n\n*Monitor:* *monitorFriendlyName*\n*Status:* *monitorAlertType*\n*URL:* *monitorURL*\n*Time:* *monitorAlertDateTime*",
       "parse_mode": "Markdown"
     }
     ```
   - Replace `<YOUR_BOT_TOKEN>` and `<YOUR_CHAT_ID>` with your values
5. Click **Create Alert Contact**
6. Click **Test** button to verify

- [ ] Telegram webhook created
- [ ] Test notification received in Telegram

---

**Link Alert Contacts to Monitors:**

1. Edit each monitor (Main App, API Health)
2. Scroll to **Alert Contacts To Notify**
3. Select:
   - ✅ Your email
   - ✅ Telegram webhook
4. Configure thresholds:
   - Alert when down for: `5 minutes` (2 consecutive checks)
   - Alert when up again: `Yes`
5. Save changes

- [ ] Main App monitor has alerts configured
- [ ] API Health monitor has alerts configured

---

### Step 9: Configure Sentry Alert Rules

**Create Alert Rule: Critical Error Rate Spike**

1. Go to Sentry project → **Alerts** → **Create Alert**
2. Configure:
   - Alert name: `Critical Error Rate Spike`
   - Environment: `production`
   - When: `Number of events`
   - Condition: `is more than 50 in 1 hour`
   - Then: `Send a notification to` → Select your email or team
3. Click **Save Rule**

- [ ] Alert rule created
- [ ] Test notification sent (optional)

---

### Step 10: Add Vercel Speed Insights

**Already integrated in layout.tsx:**
- ✅ `@vercel/speed-insights` package installed
- ✅ `<SpeedInsights />` component added

**Verify tracking (may take 24h):**
1. Visit your application and navigate around
2. Go to Vercel Dashboard → **Analytics** → **Speed Insights**
3. Check for page view data (may not appear immediately)

- [ ] Speed Insights component added
- [ ] Tracking verified (or noted to check in 24h)

---

### Step 11: Verify Admin Monitoring Dashboard

**Test admin access:**
```
https://focusonit.ycm360.com/admin/monitoring
```

**Expected:**
- [ ] Page loads successfully
- [ ] System health displayed
- [ ] Database, Real-time, Calendar checks shown
- [ ] Sync statistics displayed

**Update admin email list:**

Edit `app/(dashboard)/admin/monitoring/page.tsx`:
```typescript
const adminEmails = [
  'admin@ycm360.com',
  'your-actual-admin-email@example.com', // Add your email here
];
```

Commit and deploy:
```bash
git add app/(dashboard)/admin/monitoring/page.tsx
git commit -m "chore: update admin email list"
git push
```

- [ ] Admin dashboard accessible
- [ ] Admin email list updated

---

## Post-Deployment Verification

### Immediate Checks (First 30 minutes)

- [ ] Application accessible at production URL
- [ ] Health check endpoint returns healthy status
- [ ] Sentry capturing errors (verified via test page)
- [ ] UptimeRobot monitors showing "Up"
- [ ] No errors in Vercel deployment logs
- [ ] No JavaScript errors in browser console

---

### 24-Hour Checks

- [ ] Sentry has captured real errors (if any occurred)
- [ ] UptimeRobot has completed 288 checks (24h × 12 checks/hour)
- [ ] No false positive alerts
- [ ] Speed Insights showing page view data
- [ ] Admin dashboard showing sync statistics

---

### 1-Week Checks

- [ ] Review Sentry error patterns
- [ ] Review UptimeRobot response time trends
- [ ] Verify alert notifications are actionable
- [ ] Adjust alert thresholds if needed
- [ ] Document any incidents in lessons-learned/

---

## Rollback Plan

If monitoring causes issues:

**Disable Sentry (quick):**
```bash
# In Vercel, remove environment variable
NEXT_PUBLIC_SENTRY_DSN=(delete)

# Or set feature flag
SENTRY_ENABLED=false

# Trigger redeployment
vercel --prod --force
```

**Revert monitoring changes:**
```bash
# Find commit before monitoring changes
git log --oneline -20

# Revert to that commit
git revert <commit-hash>
git push
```

**Pause UptimeRobot monitors:**
1. Go to UptimeRobot dashboard
2. Edit each monitor
3. Click **Pause**

---

## Troubleshooting Common Issues

### Issue: Sentry not receiving events

**Check:**
- [ ] `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel
- [ ] DSN value is correct (no typos)
- [ ] Application has been redeployed after adding DSN
- [ ] Ad blocker is not blocking Sentry

**Fix:**
```bash
# Verify environment variable
vercel env ls

# If missing, add it
vercel env add NEXT_PUBLIC_SENTRY_DSN

# Redeploy
vercel --prod --force
```

---

### Issue: Health check returning 503

**Check:**
- [ ] Supabase is accessible
- [ ] Environment variables are correct
- [ ] Database connection succeeds

**Debug:**
```bash
# Check health check response
curl https://focusonit.ycm360.com/api/health | jq

# Look at specific failing check
# If database.status = false, check Supabase connection
```

---

### Issue: UptimeRobot showing false downs

**Check:**
- [ ] Timeout is sufficient (increase to 60s)
- [ ] Keyword check is correct
- [ ] Cold start delays aren't causing timeouts

**Fix:**
1. Edit monitor in UptimeRobot
2. Increase timeout to 60 seconds
3. Simplify keyword to just `"status"` (without full JSON)
4. Save changes

---

### Issue: Too many alerts (alert fatigue)

**Fix:**
1. Adjust "down for" threshold from 5 minutes to 10 minutes
2. Review Sentry alert rules - increase threshold
3. Implement quiet hours for non-critical alerts
4. Add alert deduplication

---

## Success Criteria

Monitoring setup is successful when:

✅ **Error Tracking:**
- Sentry captures production errors
- Stack traces are readable (source maps working)
- No sensitive data leaking
- Alerts sent for critical errors

✅ **Uptime Monitoring:**
- UptimeRobot checks every 5 minutes
- Alerts sent when down >5 minutes
- Recovery notifications working
- Response times tracked

✅ **Performance Monitoring:**
- Speed Insights tracking Core Web Vitals
- Slow transactions detected in Sentry
- Performance trends visible

✅ **Health Checks:**
- `/api/health` returns accurate status
- All dependencies checked
- Response time <500ms

✅ **Admin Dashboard:**
- Accessible to admin users only
- Shows real-time system health
- Displays sync statistics

---

## Next Steps After Deployment

1. **Train team:**
   - Share runbook: `INCIDENT_RESPONSE_RUNBOOK.md`
   - Review alert response procedures
   - Conduct mock incident drill

2. **Set up recurring tasks:**
   - Weekly: Review Sentry errors
   - Monthly: Test all alert channels
   - Quarterly: Review and adjust thresholds

3. **Document incidents:**
   - Use `lessons-learned/` for major issues
   - Update runbook with new scenarios
   - Conduct post-mortems for P1/P2 incidents

4. **Plan improvements:**
   - Custom metrics for business KPIs
   - Slack/Discord integration
   - Automated weekly reports
   - Enhanced dashboard with charts

---

## Maintenance Schedule

**Weekly:**
- Review error trends in Sentry
- Check UptimeRobot response times
- Verify no missed alerts

**Monthly:**
- Test all alert channels
- Review and close resolved Sentry issues
- Update runbook if needed
- Check monitoring costs (should be $0 on free tiers)

**Quarterly:**
- Full monitoring audit
- Adjust alert thresholds
- Review SLA compliance
- Plan monitoring improvements

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Verified By:** _____________

---

**Created:** 2025-11-11
**Version:** 1.0
**Owner:** DevOps Team

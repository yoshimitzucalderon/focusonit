# Post-Deployment Verification Checklist

**Production URL:** https://focusonit.ycm360.com
**Last Updated:** November 11, 2025
**Purpose:** Comprehensive checklist to verify production deployment succeeded

---

## How to Use This Checklist

**Run this checklist IMMEDIATELY after every production deployment**

**Timeline:**
- **0-15 minutes:** Critical checks (manual smoke tests)
- **15-60 minutes:** Monitoring checks (automated systems)
- **1-24 hours:** Extended monitoring (metrics review)

**Process:**
1. Copy this checklist to a new document/ticket for each deployment
2. Check off items as you complete them
3. If any item fails, follow troubleshooting steps in [Common Issues Runbook](runbooks/COMMON_ISSUES.md)
4. Keep completed checklist for audit trail

---

## Critical Checks (0-15 Minutes)

### Application Accessibility

- [ ] **Production URL responds**
  ```bash
  curl -I https://focusonit.ycm360.com
  # Expected: HTTP/2 200
  # If 500/502: CRITICAL - Rollback immediately
  ```

- [ ] **Homepage loads in browser**
  - Open: https://focusonit.ycm360.com
  - Expected: Login/signup page displays correctly
  - If blank/error: CRITICAL - Rollback immediately

- [ ] **No console errors**
  - Open DevTools (F12) → Console
  - Expected: No errors (warnings OK)
  - If errors: Review and determine severity

- [ ] **Resources load correctly**
  - DevTools → Network tab → Refresh page
  - Expected: All resources 200 OK (green)
  - If 404s: Missing assets, investigate

---

### Authentication Flow

#### Email/Password Authentication

- [ ] **Can navigate to signup page**
  - URL: https://focusonit.ycm360.com/signup
  - Expected: Signup form displays

- [ ] **Can create new account** (use test email)
  - Email: `test+[timestamp]@example.com`
  - Password: `TestPassword123!`
  - Expected: Account created, redirects to dashboard
  - Note: May require email confirmation depending on settings

- [ ] **Can log out**
  - Click logout button
  - Expected: Redirects to login page

- [ ] **Can log in**
  - Email: `test+[timestamp]@example.com`
  - Password: `TestPassword123!`
  - Expected: Redirects to dashboard

- [ ] **Session persists after refresh**
  - Refresh page (Ctrl+R)
  - Expected: Still logged in, dashboard displays

#### Google OAuth (if enabled)

- [ ] **"Sign in with Google" button visible**
  - On login page
  - Expected: Button displays with Google logo

- [ ] **Google OAuth flow works**
  - Click "Sign in with Google"
  - Expected: Redirects to Google consent screen
  - Authorize access
  - Expected: Redirects back to app, logged in

- [ ] **Google account info displays correctly**
  - Check user profile/avatar
  - Expected: Shows Google account name and photo

---

### Core Task Management

Use the test account created above for these checks.

#### Create Task

- [ ] **Can create simple task (no date)**
  - Type task title in input: "Test task 1"
  - Press Enter
  - Expected: Task appears in task list immediately
  - Expected: Success toast notification

- [ ] **Can create task with due date**
  - Click "+" or open task creation modal
  - Title: "Test task with date"
  - Due date: Tomorrow's date
  - Click "Create" or "Save"
  - Expected: Task appears in TODAY view (or WEEK view)
  - Expected: Success toast notification

- [ ] **Task appears in correct view**
  - Navigate to TODAY view: `/today`
  - Expected: Task with tomorrow's date appears in "Tomorrow" section

#### Edit Task

- [ ] **Can edit task inline (title)**
  - Click on task title
  - Expected: Title becomes editable
  - Change title: "Updated task title"
  - Press Enter
  - Expected: Title updates, shows success indicator

- [ ] **Can edit task due date**
  - Hover over task
  - Click calendar icon (date picker)
  - Select new date (2 days from now)
  - Expected: Task moves to correct date section
  - Expected: Success toast notification

- [ ] **Can edit task description** (if feature exists)
  - Click task to open details
  - Edit description field
  - Save
  - Expected: Description updates

#### Complete Task

- [ ] **Can mark task complete**
  - Click checkbox on task
  - Expected: Task gets strikethrough/fade effect
  - Expected: Task moves to completed section (or disappears from view)

- [ ] **Can unmark task (make incomplete)**
  - Navigate to COMPLETED view: `/completed`
  - Click checkbox on completed task
  - Expected: Task becomes incomplete
  - Expected: Task moves back to pending list

#### Delete Task

- [ ] **Can delete task**
  - Hover over task
  - Click trash/delete icon
  - Confirm deletion (if confirmation modal)
  - Expected: Task disappears from list
  - Expected: Success toast notification

---

### Views and Navigation

- [ ] **TODAY view loads**
  - Navigate to: `/today` (or `/` or `/dashboard`)
  - Expected: Page loads with sections:
    - Overdue tasks (if any)
    - Today's tasks
    - Tomorrow's tasks
    - No date tasks

- [ ] **WEEK view loads**
  - Navigate to: `/week`
  - Expected: Page loads with 7 day columns
  - Expected: Tasks organized by day

- [ ] **ALL TASKS view loads**
  - Navigate to: `/all`
  - Expected: All pending tasks display
  - Expected: No date tasks + dated tasks

- [ ] **COMPLETED view loads**
  - Navigate to: `/completed`
  - Expected: Completed tasks display
  - Expected: Shows tasks from last 30 days

- [ ] **Navigation between views works**
  - Click each nav link/button
  - Expected: View changes without full page reload
  - Expected: URL updates correctly

---

### Real-time Sync

- [ ] **Real-time updates work (cross-tab)**
  - Open two browser tabs (both logged in as same user)
  - **Tab 1:** Create new task
  - **Tab 2:** Expected: New task appears within 2-3 seconds (no refresh needed)

- [ ] **Real-time edit sync works**
  - **Tab 1:** Edit task title
  - **Tab 2:** Expected: Title updates within 2-3 seconds

- [ ] **Real-time delete sync works**
  - **Tab 1:** Delete task
  - **Tab 2:** Expected: Task disappears within 2-3 seconds

- [ ] **WebSocket connection healthy**
  - DevTools → Network tab → WS (WebSocket)
  - Expected: Connection to `wss://[project-id].supabase.co/realtime/v1/websocket`
  - Status: 101 Switching Protocols (green)

---

### Google Calendar Integration (if enabled)

Skip this section if Google Calendar feature not enabled.

#### Connection Status

- [ ] **Calendar status indicator visible**
  - Check for "Calendar" status in UI (usually in settings or header)
  - Expected: Shows "Connected" or "Disconnected"

- [ ] **Can connect Google Calendar**
  - If not connected: Click "Connect Google Calendar"
  - Expected: Redirects to Google OAuth consent screen
  - Authorize calendar access
  - Expected: Redirects back to app, status shows "Connected"

#### Sync: Create

- [ ] **Task with date creates calendar event**
  - Create task with due date (use unique title: "Cal Sync Test [timestamp]")
  - Wait 10-30 seconds
  - Open Google Calendar in separate tab
  - Expected: Event appears on correct date with task title

#### Sync: Edit

- [ ] **Edit task updates calendar event**
  - Edit task title: "Cal Sync Test [timestamp] EDITED"
  - Edit due date: Change to different date
  - Wait 10-30 seconds
  - Refresh Google Calendar
  - Expected: Event title updated, moved to new date

#### Sync: Delete

- [ ] **Delete task removes calendar event**
  - Delete the test task
  - Wait 10-30 seconds
  - Refresh Google Calendar
  - Expected: Event removed from calendar

#### Sync: Disconnect

- [ ] **Can disconnect Google Calendar**
  - Click "Disconnect" in calendar settings
  - Expected: Status changes to "Disconnected"
  - Expected: Future tasks don't sync to calendar

---

### UI/UX Checks

#### Responsive Design

- [ ] **Desktop view (1920x1080)**
  - DevTools → Toggle device toolbar (Ctrl+Shift+M)
  - Select "Responsive" → 1920 x 1080
  - Expected: Layout looks good, no overflow, readable

- [ ] **Tablet view (iPad Air)**
  - DevTools → Select "iPad Air" (820x1180)
  - Expected: Layout adapts, sidebar/navigation accessible
  - Expected: Can perform all core actions

- [ ] **Mobile view (iPhone 12 Pro)**
  - DevTools → Select "iPhone 12 Pro" (390x844)
  - Expected: Layout adapts, single column
  - Expected: Hamburger menu or bottom nav visible
  - Expected: Can create and edit tasks

#### Dark Mode (if implemented)

- [ ] **Dark mode toggle exists**
  - Look for sun/moon icon or theme toggle
  - Expected: Toggle visible in UI

- [ ] **Can switch to dark mode**
  - Click dark mode toggle
  - Expected: UI switches to dark theme
  - Expected: All elements readable (good contrast)

- [ ] **Dark mode persists after refresh**
  - Refresh page
  - Expected: Still in dark mode

- [ ] **Can switch back to light mode**
  - Click toggle again
  - Expected: UI switches to light theme

#### Loading States

- [ ] **Loading states display**
  - During initial task load
  - Expected: Skeleton loaders or spinner
  - Expected: No flash of empty state

- [ ] **Loading states not stuck**
  - Expected: Loaders disappear once data loads
  - If stuck: Data fetch error, check console

---

### Pomodoro Timer (if implemented)

Skip this section if Pomodoro feature not implemented.

- [ ] **Timer displays**
  - Expected: Timer UI visible (25:00 default)

- [ ] **Can start timer**
  - Click "Start"
  - Expected: Timer counts down (25:00 → 24:59 → ...)

- [ ] **Can pause timer**
  - Click "Pause"
  - Expected: Timer pauses

- [ ] **Can reset timer**
  - Click "Reset"
  - Expected: Timer resets to 25:00

- [ ] **Timer completion works**
  - (Optional: Set short test timer for faster testing)
  - Let timer reach 00:00
  - Expected: Notification or sound plays
  - Expected: Timer resets or shows completion state

---

## Monitoring Checks (15-60 Minutes)

### Vercel Deployment Status

- [ ] **Deployment shows "Ready"**
  - Go to: https://vercel.com/[team]/task-manager/deployments
  - Latest deployment status: **Ready** ✅
  - If "Error" or "Building" stuck: Investigate

- [ ] **Build logs show no errors**
  - Click deployment → View Build Logs
  - Scroll through logs
  - Expected: No red error messages
  - Expected: Build completed successfully

- [ ] **Function logs show no errors**
  - Click deployment → View Function Logs
  - Filter: Last 15 minutes
  - Expected: No error-level logs
  - Expected: API routes responding (200 status codes)

---

### Error Tracking (Sentry)

Skip this section if Sentry not configured.

- [ ] **Sentry receiving events**
  - Go to: https://sentry.io/organizations/[org]/projects/focusonit/
  - Check: Last event timestamp is recent (within last 15 min)

- [ ] **Error rate normal**
  - Dashboard → Issues
  - Filter: Last 15 minutes
  - Expected: <5 new errors
  - Expected: No critical errors (P0)

- [ ] **No new error types**
  - Check issue list
  - Expected: No new issues with "New" badge
  - If new issues: Review and assess severity

- [ ] **Error rate not spiking**
  - Dashboard → Stats
  - Compare: Current 15 min vs previous 15 min
  - Expected: Similar error count (no 10x increase)

---

### Uptime Monitoring (UptimeRobot)

Skip this section if UptimeRobot not configured.

- [ ] **Monitor shows "Up"**
  - Go to: https://uptimerobot.com/dashboard
  - Monitor: focusonit.ycm360.com
  - Status: **Up** (green)

- [ ] **Response time normal**
  - Expected: <500ms average response time
  - If >1s: Performance issue, investigate

- [ ] **No downtime alerts sent**
  - Check email/Slack
  - Expected: No alerts in last 15 minutes

---

### Database Health (Supabase)

- [ ] **Supabase project active**
  - Go to: https://app.supabase.com/project/[project-id]
  - Status: Active (not paused)

- [ ] **Database connection healthy**
  - Dashboard → Database → Connection Pooling
  - Expected: Active connections <80% of max
  - Free tier max: 60 connections
  - If >80%: Monitor closely, may need optimization

- [ ] **Query performance normal**
  - Dashboard → Database → Query Performance
  - Expected:
    - p50: <100ms
    - p95: <200ms
    - p99: <500ms
  - If higher: Performance degradation, investigate

- [ ] **No slow queries**
  - Query Performance → Sort by "Mean Time"
  - Expected: No queries >1s
  - If slow queries found: Add indexes or optimize

- [ ] **CPU usage reasonable**
  - Dashboard → Reports → Database
  - CPU usage: <60%
  - If >80%: High load, investigate (see [High Database CPU Usage](runbooks/COMMON_ISSUES.md#high-database-cpu-usage))

---

### Health Check Endpoint (if implemented)

- [ ] **Health check responds**
  ```bash
  curl https://focusonit.ycm360.com/api/health
  ```

  Expected response:
  ```json
  {
    "timestamp": "2025-11-11T12:00:00Z",
    "status": "healthy",
    "checks": {
      "database": true,
      "realtime": true,
      "calendar": true
    },
    "version": "abc1234",
    "responseTime": "123ms"
  }
  ```

- [ ] **All health checks pass**
  - `status`: "healthy"
  - `database`: true
  - `realtime`: true
  - `calendar`: true (if feature enabled)

---

## Extended Monitoring (1-24 Hours)

### Performance Metrics

#### Vercel Analytics

- [ ] **Page load times normal** (check after 1 hour)
  - Go to: Vercel Dashboard → Analytics
  - Time to First Byte (TTFB): <200ms
  - First Contentful Paint (FCP): <1.5s
  - Largest Contentful Paint (LCP): <2.5s
  - If higher: Performance regression, investigate

- [ ] **No increase in error rate**
  - Check error rate over last hour
  - Expected: <0.1% error rate
  - Compare to baseline (previous day/week)

#### Supabase Metrics

- [ ] **Query performance stable** (check after 4 hours)
  - Dashboard → Database → Query Performance
  - Compare: Current vs previous period
  - Expected: No significant degradation (>20% increase)

- [ ] **Database load normal**
  - Dashboard → Reports → Database
  - CPU: <60% average
  - Memory: <80% average
  - Connections: <80% of max

#### API Success Rate

- [ ] **API routes responding** (check Vercel function logs)
  - `/api/tasks`: >99% success rate
  - `/api/calendar/*`: >95% success rate (if enabled)
  - `/api/auth/*`: >99% success rate

---

### User Feedback

- [ ] **No user-reported issues** (check after 2 hours)
  - Check support email
  - Check social media mentions (if monitoring)
  - Check internal Slack channels
  - Expected: No complaints about:
    - "App not loading"
    - "Tasks disappeared"
    - "Cannot log in"

- [ ] **In-app feedback reviewed** (if implemented)
  - Check feedback widget submissions
  - Expected: No negative feedback related to deployment

---

### Data Integrity

- [ ] **No data loss reported**
  - Check support channels
  - Expected: No users reporting missing tasks

- [ ] **Task counts stable** (check after 4 hours)
  ```sql
  -- Run in Supabase SQL Editor
  SELECT
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE completed = true) as completed_tasks,
    COUNT(*) FILTER (WHERE completed = false) as pending_tasks
  FROM tasks;

  -- Compare to pre-deployment baseline
  -- Expected: Counts increased or stable (not decreased)
  ```

- [ ] **User count stable**
  ```sql
  SELECT COUNT(*) FROM auth.users;
  -- Expected: Increased or stable (not decreased)
  ```

---

## Checklist Summary

**Deployment Date:** _______________
**Deployment Hash/Version:** _______________
**Completed By:** _______________

### Critical Checks (0-15 min)
- [ ] All critical checks passed
- [ ] Application accessible and functional
- [ ] Core features working (auth, tasks, sync)

### Monitoring Checks (15-60 min)
- [ ] All monitoring checks passed
- [ ] No error spikes in Sentry
- [ ] Performance metrics normal

### Extended Monitoring (1-24 hours)
- [ ] Performance stable over time
- [ ] No user complaints
- [ ] Data integrity confirmed

### Issues Found

_Document any issues found during verification:_

| Issue | Severity | Action Taken | Status |
|-------|----------|--------------|--------|
| | | | |

### Notes

_Any additional notes about this deployment:_

---

### Sign-Off

**Deployment Verified By:** _______________
**Date/Time:** _______________
**Status:** ✅ APPROVED / ❌ ROLLBACK REQUIRED

---

## Troubleshooting

**If any check fails, refer to:**
- [Common Issues Runbook](runbooks/COMMON_ISSUES.md)
- [Rollback Procedures](setup/ROLLBACK.md)
- [Deployment Guide](setup/DEPLOYMENT.md)

**For critical failures (app down, data loss):**
1. **Rollback immediately** (see [Rollback Procedures](setup/ROLLBACK.md))
2. **Notify team** (Slack #focusonit-incidents)
3. **Escalate to Tech Lead**

**For minor issues (cosmetic bugs, non-critical features):**
1. **Document issue** (create GitHub issue)
2. **Schedule fix** (next sprint or hotfix if urgent)
3. **Monitor** (ensure not getting worse)

---

**Document Version:** 1.0
**Last Updated:** November 11, 2025
**Maintained By:** DevOps Team

---

**Related Documentation:**
- [Deployment Guide](setup/DEPLOYMENT.md)
- [Rollback Procedures](setup/ROLLBACK.md)
- [Common Issues Runbook](runbooks/COMMON_ISSUES.md)

# Alert Configuration & Thresholds

Comprehensive alert configuration for FocusOnIt production monitoring.

---

## Alert Severity Levels

### Critical (P1) - Immediate Response Required

**Definition:** Service is down or major functionality broken. Immediate response required (5 minutes or less).

**Examples:**
- Application completely unreachable
- Database connection failure
- Authentication system down
- Data loss risk

**Notification Channels:**
- Email: Yes
- Telegram: Yes
- SMS: Yes (if configured)
- PagerDuty: Yes (if integrated)

**Response SLA:** 5 minutes

---

### High (P2) - Urgent Response Required

**Definition:** Significant degradation affecting users. Response required within 15 minutes.

**Examples:**
- API error rate >10% for 10 minutes
- Response time >3s consistently
- Google Calendar sync failing
- Real-time updates not working

**Notification Channels:**
- Email: Yes
- Telegram: Yes
- SMS: No

**Response SLA:** 15 minutes

---

### Medium (P3) - Response Required During Business Hours

**Definition:** Minor degradation or warning signs. Response required within 1 hour during business hours.

**Examples:**
- Error rate spike (5-10% for 30 minutes)
- Performance degradation (1-3s response times)
- SSL certificate expiring in 7 days
- Disk space >80%

**Notification Channels:**
- Email: Yes
- Telegram: Yes

**Response SLA:** 1 hour (business hours)

---

### Low (P4) - Informational

**Definition:** Informational alerts or minor issues. Review during next standup or weekly review.

**Examples:**
- Service recovered
- New deployment successful
- Scheduled maintenance completed
- Weekly metrics report

**Notification Channels:**
- Email: Yes
- Slack/Discord: Yes (if configured)

**Response SLA:** Next business day

---

## Sentry Alert Rules

### Rule 1: Critical Error Rate Spike

**Trigger Conditions:**
- Number of events: >50 errors in 1 hour
- Severity: error or fatal
- Environment: production

**Actions:**
- Send email to: team@ycm360.com
- Severity: Critical (P1)

**Configuration:**
```
Alert Name: Critical Error Rate Spike
Condition: Number of events in an issue is more than 50 in 1 hour
Environment: production
When:
  - New issue is created
  - Issue becomes ongoing
Send notification to: team@ycm360.com
```

---

### Rule 2: New High-Impact Error

**Trigger Conditions:**
- New issue created
- Affects >10 users in first hour
- Environment: production

**Actions:**
- Send email to: team@ycm360.com
- Severity: High (P2)

**Configuration:**
```
Alert Name: New High-Impact Error
Condition: A new issue is created AND affects more than 10 users in 1h
Environment: production
Send notification to: team@ycm360.com
```

---

### Rule 3: Performance Degradation

**Trigger Conditions:**
- Transaction duration p95 >3 seconds
- For 10 minutes
- Environment: production

**Actions:**
- Send email to: devops@ycm360.com
- Severity: Medium (P3)

**Configuration:**
```
Alert Name: Performance Degradation Detected
Condition: p95 transaction duration > 3000ms for 10 minutes
Environment: production
Transaction: /dashboard
Send notification to: devops@ycm360.com
```

---

### Rule 4: Authentication Failures

**Trigger Conditions:**
- Error message contains: "Auth session missing" OR "Invalid Refresh Token"
- More than 20 events in 10 minutes
- Environment: production

**Actions:**
- Send email to: team@ycm360.com
- Severity: High (P2)

**Configuration:**
```
Alert Name: Authentication System Issues
Condition: Number of events matching filter is more than 20 in 10 minutes
Filter: message contains "Auth session missing" OR "Invalid Refresh Token"
Environment: production
Send notification to: team@ycm360.com
```

---

## UptimeRobot Alert Configuration

### Monitor: FocusOnIt - Main App

**Alert Conditions:**
- Status: Down
- Duration: 5 minutes (2 consecutive failed checks)
- Recovery notification: Yes

**Alert Contacts:**
- Email: team@ycm360.com (Critical)
- Telegram: @focusonit_monitor_bot (Critical)
- SMS: +1234567890 (Critical - optional)

**Alert Message Template:**
```
🔴 CRITICAL ALERT

Service: FocusOnIt Main Application
Status: DOWN
URL: https://focusonit.ycm360.com/login
Time: [timestamp]
Duration: 5+ minutes

Action Required: Investigate immediately
Runbook: https://github.com/your-org/focusonit/docs/INCIDENT_RESPONSE_RUNBOOK.md
```

---

### Monitor: FocusOnIt - API Health

**Alert Conditions:**
- Status: Down OR keyword check fails
- Duration: 5 minutes
- Recovery notification: Yes

**Alert Contacts:**
- Email: team@ycm360.com (Critical)
- Telegram: @focusonit_monitor_bot (Critical)

**Keyword Check:**
- Must contain: `"status":"healthy"`
- Case sensitive: Yes

**Alert Message Template:**
```
🟠 HIGH PRIORITY ALERT

Service: FocusOnIt API Health Check
Status: UNHEALTHY or UNREACHABLE
URL: https://focusonit.ycm360.com/api/health
Time: [timestamp]

Possible Issues:
- Database connection failure
- Supabase unavailable
- Application crashed

Action: Check Sentry for errors, review Vercel logs
```

---

### Monitor: FocusOnIt - Supabase

**Alert Conditions:**
- Status: Down
- Duration: 10 minutes (degraded tolerance)
- Recovery notification: Yes

**Alert Contacts:**
- Email: devops@ycm360.com (Medium)
- Telegram: @focusonit_monitor_bot (Medium)

**Alert Message Template:**
```
⚠️ WARNING

Service: Supabase Database
Status: UNREACHABLE
URL: [supabase-url]
Time: [timestamp]

Action: Verify Supabase status page, contact Supabase support if needed
Status Page: https://status.supabase.com/
```

---

## SSL Certificate Monitoring

**Alert Conditions:**
- Certificate expires in: 7 days
- Check daily: Yes

**Alert Contacts:**
- Email: devops@ycm360.com
- Severity: Medium (P3)

**Alert Message:**
```
⚠️ SSL CERTIFICATE EXPIRING SOON

Domain: focusonit.ycm360.com
Expires: [date]
Days remaining: 7

Note: Vercel auto-renews SSL certificates. This is a backup alert.
Action: Verify certificate auto-renewal is configured.
```

---

## Custom Alert Triggers (Future)

### Database Query Performance

**Trigger:** Query execution time >1s for critical tables

**Implementation:**
```sql
-- Supabase function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_query()
RETURNS trigger AS $$
BEGIN
  IF (EXTRACT(EPOCH FROM (clock_timestamp() - statement_timestamp())) > 1) THEN
    INSERT INTO slow_query_log (query, duration, timestamp)
    VALUES (current_query(), EXTRACT(EPOCH FROM (clock_timestamp() - statement_timestamp())), NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Weekly review of slow queries
SELECT query, AVG(duration), COUNT(*)
FROM slow_query_log
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY query
ORDER BY AVG(duration) DESC;
```

**Alert:** Email weekly report to devops@ycm360.com

---

### Google Calendar Sync Failure Rate

**Trigger:** >30% of sync attempts fail in 1 hour

**Implementation:** (Future - requires sync attempt logging)

```typescript
// In calendar sync function
try {
  // ... sync logic
  await logSyncAttempt({ success: true, taskId, eventId });
} catch (error) {
  await logSyncAttempt({ success: false, taskId, error: error.message });
  throw error;
}

// Query sync health
SELECT
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed,
  ROUND(COUNT(*) FILTER (WHERE success = false) * 100.0 / COUNT(*), 2) as failure_rate
FROM sync_attempts
WHERE timestamp > NOW() - INTERVAL '1 hour';
```

**Alert:** If failure_rate >30%, send alert to team@ycm360.com

---

## Alert Noise Reduction

### Deduplication

**Strategy:**
- Group similar errors together
- Use Sentry's built-in issue grouping
- Set "Alert only once per issue" for recurring problems

**Sentry Configuration:**
```
Issue Grouping:
- Enabled: Yes
- Merge similar stack traces: Yes
- Alert frequency: Once per issue + significant increase
```

---

### Quiet Hours (Optional)

**For non-critical alerts:**
- No SMS alerts: 10 PM - 8 AM
- No Telegram alerts: 10 PM - 8 AM (unless critical)
- Email only: During quiet hours

**Implementation:**
```javascript
// In alert webhook handler
const hour = new Date().getHours();
const isQuietHours = hour < 8 || hour >= 22;
const isCritical = alert.severity === 'critical';

if (isQuietHours && !isCritical) {
  // Only send email
  await sendEmail(alert);
} else {
  // Send all configured notifications
  await sendAllNotifications(alert);
}
```

---

### Alert Throttling

**Prevent alert fatigue:**
- Max 1 alert per issue per hour (unless resolved and re-occurs)
- Max 5 alerts total per hour (across all issues)
- Escalation: If >5 alerts/hour, send summary instead

**Sentry Configuration:**
```
Alert Frequency:
- First time: Immediate
- Ongoing: Every 60 minutes
- Spike: If events increase by 200%
```

---

## Alert Response Workflow

### Step 1: Alert Received

**Immediate Actions:**
1. Acknowledge alert (reply to Telegram bot or click email link)
2. Check Sentry dashboard for error details
3. Check UptimeRobot dashboard for service status
4. Check Vercel dashboard for deployment status

---

### Step 2: Assess Severity

**Questions to ask:**
- How many users affected?
- Is service completely down or degraded?
- Is data at risk?
- Is this a new issue or recurring?

**Severity Reassessment:**
- If more severe than alert indicated → Escalate
- If false positive → Document and adjust alert threshold

---

### Step 3: Investigate

**Diagnostic Steps:**
1. Review Sentry error details (stack trace, breadcrumbs)
2. Check health check endpoint: `/api/health`
3. Review recent deployments (last 2 hours)
4. Check external dependencies (Supabase status, Google API status)

---

### Step 4: Respond

**For Critical Issues:**
1. Post incident update to status page
2. Notify team in Slack/Discord
3. Begin incident response (see INCIDENT_RESPONSE_RUNBOOK.md)
4. Consider rollback if caused by recent deployment

**For Non-Critical Issues:**
1. Create issue in GitHub
2. Add to sprint backlog
3. Document workaround if available

---

### Step 5: Resolve

**Resolution Steps:**
1. Deploy fix or apply workaround
2. Verify issue is resolved (check metrics)
3. Post resolution update to status page
4. Close Sentry issue
5. Document in post-mortem (for critical incidents)

---

### Step 6: Post-Incident Review

**Within 24 hours of critical incident:**
1. Write post-mortem document
2. Identify root cause
3. List action items to prevent recurrence
4. Update runbook with new learnings
5. Adjust alert thresholds if needed

**Template:** See `docs/monitoring/POST_MORTEM_TEMPLATE.md`

---

## Alert Contacts Management

### Primary Contacts

| Role | Name | Email | Telegram | Phone | Timezone |
|------|------|-------|----------|-------|----------|
| Tech Lead | [Name] | tech@ycm360.com | @techleadhandle | +1234567890 | UTC-5 |
| DevOps | [Name] | devops@ycm360.com | @devopshandle | - | UTC-5 |
| On-Call | Rotation | oncall@ycm360.com | @oncallhandle | +1234567890 | Varies |

### Escalation Path

**Level 1:** On-call engineer (first 15 minutes)
**Level 2:** Tech Lead (after 15 minutes if unresolved)
**Level 3:** CTO/Engineering Manager (after 1 hour if unresolved)

---

## Testing Alert Configuration

### Monthly Alert Test

**Checklist:**
- [ ] Trigger test error in Sentry
- [ ] Verify email received
- [ ] Verify Telegram notification received
- [ ] Verify SMS received (if configured)
- [ ] Check alert message formatting
- [ ] Verify links in alert work correctly
- [ ] Test quiet hours configuration
- [ ] Test alert acknowledgement

**Test Script:**
```bash
# Visit test page and trigger errors
curl -X POST https://focusonit.ycm360.com/api/test-sentry

# Verify alerts received
# Check Sentry dashboard
# Check email inbox
# Check Telegram
```

---

## Metrics & SLAs

### Alert Response SLAs

| Severity | Acknowledgement | Initial Response | Resolution |
|----------|----------------|------------------|------------|
| Critical | 5 minutes | 15 minutes | 1 hour |
| High | 15 minutes | 30 minutes | 4 hours |
| Medium | 1 hour | 4 hours | 24 hours |
| Low | 24 hours | 48 hours | 1 week |

### Alert Quality Metrics

**Track monthly:**
- Total alerts sent
- False positive rate (target: <5%)
- Average acknowledgement time
- Average resolution time
- Incidents prevented by alerts

**Review quarterly:**
- Adjust thresholds to reduce noise
- Add new alerts for discovered gaps
- Remove alerts that aren't actionable

---

## Resources

- Sentry Alert Rules: https://sentry.io/alerts/
- UptimeRobot Alerts: https://uptimerobot.com/dashboard
- Incident Response Runbook: `docs/monitoring/INCIDENT_RESPONSE_RUNBOOK.md`
- Post-Mortem Template: `docs/monitoring/POST_MORTEM_TEMPLATE.md`

---

**Created:** 2025-11-11
**Last Updated:** 2025-11-11
**Owner:** DevOps Team

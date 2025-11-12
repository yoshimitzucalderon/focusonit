# Monitoring Quick Reference Card

Fast reference for common monitoring tasks and emergency response.

---

## Emergency Contacts

| Who | When | Contact |
|-----|------|---------|
| On-Call Engineer | P1/P2 incidents | [Telegram/Phone] |
| Tech Lead | Escalation (>15 min) | [Telegram/Phone] |
| Supabase Support | Database issues | support@supabase.io |
| Vercel Support | Deployment issues | support@vercel.com |

---

## Quick Links

```
Health Check:    https://focusonit.ycm360.com/api/health
Admin Dashboard: https://focusonit.ycm360.com/admin/monitoring
Sentry:          https://sentry.io
UptimeRobot:     https://uptimerobot.com/dashboard
Vercel:          https://vercel.com/dashboard
```

---

## Severity Levels

| Level | Response Time | Examples |
|-------|--------------|----------|
| **P1 - Critical** | 5 min | Service down, data loss |
| **P2 - High** | 15 min | Major feature broken |
| **P3 - Medium** | 1 hour | Performance degraded |
| **P4 - Low** | 24 hours | Minor bugs, cosmetic issues |

---

## Incident Response (1-2-3)

### 1. ACKNOWLEDGE (First 2 minutes)
```bash
✓ Reply to alert (Telegram/Email)
✓ Check dashboards (Sentry, UptimeRobot, Vercel)
✓ Determine severity (P1-P4)
✓ Post initial status if P1/P2
```

### 2. INVESTIGATE (Next 5-10 minutes)
```bash
# Quick checks
curl https://focusonit.ycm360.com/api/health | jq
vercel logs --prod
# Check Sentry for errors
# Check when it started
# What changed recently?
```

### 3. MITIGATE (ASAP)
```bash
# Option 1: Rollback (fastest for P1)
vercel rollback

# Option 2: Hot fix
git checkout main && git pull
# ... make fix ...
git push  # Auto-deploys

# Option 3: Disable feature
# In Vercel: Add FEATURE_[NAME]_ENABLED=false
vercel --prod --force
```

---

## Common Scenarios

### Service Down
```bash
# 1. Check health
curl https://focusonit.ycm360.com/api/health

# 2. Check Vercel logs
vercel logs [deployment-url]

# 3. Rollback if recent deploy
# Vercel Dashboard → Deployments → Previous → Promote

# 4. Check Supabase status
curl https://status.supabase.com/api/v2/status.json
```

---

### High Error Rate
```bash
# 1. Check Sentry
# → Issues → Sort by "Last Seen"
# → Click top issue → Review stack trace

# 2. If recent deploy: rollback
vercel rollback

# 3. If external service: check status
# Google: https://status.cloud.google.com/
# Supabase: https://status.supabase.com/
```

---

### Database Connection Failed
```bash
# 1. Check Supabase status
curl https://status.supabase.com/api/v2/status.json

# 2. Check connection in Supabase dashboard
# → Database → Connection pooler

# 3. Restart app (closes old connections)
vercel --prod --force

# 4. Check RLS policies
# Supabase → Database → Policies
```

---

### Google Calendar Sync Failing
```bash
# 1. Check Google API status
curl https://status.cloud.google.com/

# 2. Check tokens in Supabase
# → Table: user_google_tokens
# → Verify expires_at > now()

# 3. Force token refresh
# Call: POST /api/calendar/sync

# 4. Temporary disable if needed
# Vercel: FEATURE_GOOGLE_CALENDAR_SYNC=false
```

---

### Slow Performance
```bash
# 1. Check Sentry Performance tab
# → Sort by P95 duration
# → Identify slowest transactions

# 2. Check database queries
# Supabase → Database → Query Performance

# 3. Add indexes if needed
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_date);

# 4. Implement pagination
# Limit queries to 50-100 results
```

---

## Useful Commands

### Health & Status
```bash
# Check health
curl https://focusonit.ycm360.com/api/health | jq

# Check all services
curl https://focusonit.ycm360.com/api/health | jq '.checks'

# Check specific service
curl https://focusonit.ycm360.com/api/health | jq '.checks.database'
```

---

### Vercel
```bash
# Rollback to previous
vercel rollback

# Force redeploy
vercel --prod --force

# View logs
vercel logs --prod

# List deployments
vercel ls --prod

# Check environment variables
vercel env ls
```

---

### Git
```bash
# Recent commits
git log --oneline -10

# Revert last commit
git revert HEAD
git push

# Rollback to specific commit
git reset --hard <commit-hash>
git push --force  # BE CAREFUL
```

---

### Database (Supabase)
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Alert Thresholds

### UptimeRobot
- **Check interval:** 5 minutes
- **Alert after:** 5 minutes down (2 failed checks)
- **Timeout:** 30 seconds
- **Keyword:** `"status":"healthy"` (API Health)

### Sentry
- **Error spike:** >50 errors in 1 hour
- **Performance:** P95 >3s for 10 minutes
- **Auth errors:** >20 in 10 minutes

---

## Testing Monitoring

### Test Sentry
```bash
# Visit test page (DELETE AFTER USE)
https://focusonit.ycm360.com/test-sentry

# Trigger each error type
# Check Sentry dashboard for events
```

### Test UptimeRobot
```
1. Edit monitor
2. Click "Test" button
3. Verify notification received
```

### Test Health Check
```bash
curl https://focusonit.ycm360.com/api/health

# Should return 200 + "status":"healthy"
```

---

## Communication Templates

### Initial Alert (P1/P2)
```
🔴 INVESTIGATING

Service: [Name]
Impact: [Description]
Started: [Time]
Status: Investigating
ETA: [Estimate or "Unknown"]

Updates every 15 minutes.
```

---

### Update
```
🟠 UPDATE

Service: [Name]
Status: [Progress]
Action taken: [What we did]
Next step: [What's next]

Next update in 15 minutes.
```

---

### Resolution
```
🟢 RESOLVED

Service: [Name]
Status: RESOLVED
Root cause: [Brief description]
Duration: [Time]

Post-mortem: [Link or "To follow"]
```

---

## Post-Incident

### Within 1 hour
- [ ] Post resolution update
- [ ] Verify metrics back to normal
- [ ] Document timeline notes

### Within 24 hours
- [ ] Write post-mortem (if P1/P2)
- [ ] Create GitHub issues for fixes
- [ ] Update runbook if needed

### Within 1 week
- [ ] Implement preventive measures
- [ ] Update alert thresholds
- [ ] Team review meeting

---

## Monitoring Health Check

### Daily
- [ ] No critical alerts in last 24h
- [ ] UptimeRobot all green
- [ ] Sentry error rate <10 errors/hour

### Weekly
- [ ] Review Sentry error trends
- [ ] Check UptimeRobot response times
- [ ] No false positive alerts

### Monthly
- [ ] Test all alert channels
- [ ] Review and adjust thresholds
- [ ] Audit access permissions

---

## Key Metrics

### Target SLAs
- **Uptime:** 99.9% (8.76h downtime/year)
- **Response time:** P95 <1s
- **Error rate:** <0.1% of requests
- **Time to detect:** <5 minutes
- **Time to resolve P1:** <1 hour

### Current Monitoring
- **Error tracking:** Sentry (5k events/month free)
- **Uptime:** UptimeRobot (5-min checks, free)
- **Performance:** Vercel Speed Insights (free)
- **Health:** Custom endpoint (/api/health)

---

## Escalation Path

**Level 1:** On-call engineer (0-15 min)
**Level 2:** Tech Lead (15-30 min)
**Level 3:** Engineering Manager (30+ min)

If no response after 15 minutes, escalate to next level.

---

## Resources

**Full Documentation:**
- Deployment: `docs/monitoring/DEPLOYMENT_CHECKLIST.md`
- Incidents: `docs/monitoring/INCIDENT_RESPONSE_RUNBOOK.md`
- Alerts: `docs/monitoring/ALERT_CONFIGURATION.md`
- Testing: `docs/monitoring/TESTING_VERIFICATION.md`

**External Resources:**
- Sentry Docs: https://docs.sentry.io/
- UptimeRobot Help: https://uptimerobot.com/help
- Vercel Docs: https://vercel.com/docs

---

**Print this page and keep it accessible during incidents.**

**Last Updated:** 2025-11-11
**Version:** 1.0

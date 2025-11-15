# Security Audit Checklist - Quick Reference

**Application:** FocusOnIt Task Manager
**Last Updated:** 2025-11-11

---

## CRITICAL - Fix Before Production Launch

### 1. API Authentication
- [ ] Add authentication to `/api/voice-to-task`
- [ ] Add authentication to `/api/voice-edit-task`
- [ ] Run API auth audit: `npx ts-node scripts/audit-api-auth.ts`
- [ ] Verify all endpoints return 401 without auth

**Test:**
```bash
curl -X POST https://focusonit.ycm360.com/api/voice-to-task \
  -H "Content-Type: application/json" \
  -d '{"transcript":"test"}'
# Expected: 401 Unauthorized
```

---

### 2. Row Level Security (RLS)
- [ ] Enable RLS on `tasks` table
- [ ] Enable RLS on `user_google_tokens` table
- [ ] Enable RLS on `google_calendar_tokens` table
- [ ] Create SELECT policies for all tables
- [ ] Create INSERT policies for all tables
- [ ] Create UPDATE policies for all tables
- [ ] Create DELETE policies for all tables
- [ ] Run RLS test: `npx ts-node scripts/test-rls-policies.ts`

**SQL to check RLS:**
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('tasks', 'user_google_tokens', 'google_calendar_tokens');
```

**Expected:** All tables show `rowsecurity = true`

---

### 3. Security Headers
- [ ] Add headers to `next.config.js`
- [ ] Configure X-Frame-Options: DENY
- [ ] Configure X-Content-Type-Options: nosniff
- [ ] Configure Strict-Transport-Security
- [ ] Configure Content-Security-Policy
- [ ] Hide X-Powered-By header
- [ ] Deploy and test headers

**Test:**
```bash
curl -I https://focusonit.ycm360.com | grep -E "(X-Frame|X-Content|Strict-Transport)"
```

**Expected:** All security headers present

---

### 4. Environment Variable Encryption
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Encrypt `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Encrypt `GOOGLE_CLIENT_SECRET`
- [ ] Encrypt `N8N_WEBHOOK_SECRET`
- [ ] Encrypt `SENTRY_AUTH_TOKEN`
- [ ] Scan code for hardcoded secrets: `grep -r "sk_" . --include="*.ts"`

**Expected:** No hardcoded secrets in code

---

## HIGH PRIORITY - Fix This Week

### 5. Rate Limiting
- [ ] Install Upstash: `npm install @upstash/ratelimit @upstash/redis`
- [ ] Create Upstash Redis account
- [ ] Add env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- [ ] Create `lib/rate-limit.ts`
- [ ] Apply rate limiting to voice API endpoints
- [ ] Apply rate limiting to calendar API endpoints
- [ ] Test rate limiting (20 rapid requests should trigger 429)

**Test:**
```bash
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://focusonit.ycm360.com/api/calendar/status
  sleep 0.1
done
# Expected: 429 Too Many Requests after ~10 requests
```

---

### 6. OAuth Security
- [ ] Verify Google OAuth redirect URIs (only HTTPS production URLs)
- [ ] Remove any localhost URLs from production config
- [ ] Add state parameter validation in OAuth callback
- [ ] Test OAuth flow end-to-end
- [ ] Verify CSRF protection works

**Check Google Cloud Console:**
- Authorized JavaScript origins: `https://focusonit.ycm360.com`
- Authorized redirect URIs: `https://focusonit.ycm360.com/api/calendar/oauth/callback`

---

### 7. Penetration Testing
- [ ] Make penetration test script executable: `chmod +x scripts/security-penetration-test.sh`
- [ ] Run full pen test: `./scripts/security-penetration-test.sh https://focusonit.ycm360.com`
- [ ] Fix any failures
- [ ] Re-run until all tests pass

**Expected:** All tests pass, exit code 0

---

## MEDIUM PRIORITY - Fix Next Sprint

### 8. XSS Protection Audit
- [ ] Search for `dangerouslySetInnerHTML`: `grep -r "dangerouslySetInnerHTML" --include="*.tsx" .`
- [ ] Verify CSP blocks inline scripts
- [ ] Test XSS payloads in task creation
- [ ] Verify React escaping is enabled

**Test XSS:**
1. Create task with title: `<script>alert('XSS')</script>`
2. View task in UI
3. Verify no alert appears
4. Check DOM shows escaped HTML

---

### 9. Service Role Key Audit
- [ ] Verify Service Role Key only in server files
- [ ] Check no client components use Service Role Key
- [ ] Audit webhook endpoints using Service Role
- [ ] Verify legitimate use cases only

**Check client-side usage:**
```bash
grep -r "SERVICE_ROLE_KEY" --include="*.tsx" . | grep "'use client'"
# Expected: No matches
```

---

### 10. Security Logging
- [ ] Enable Sentry in production
- [ ] Monitor failed auth attempts
- [ ] Monitor 403 Forbidden responses
- [ ] Set up alerts for suspicious activity
- [ ] Review logs weekly

**Sentry Events to Monitor:**
- 401 Unauthorized (>100/hour = alert)
- 403 Forbidden (>50/hour = alert)
- 429 Rate Limit (>10/hour = alert)
- 500 Internal Server Error (>5/hour = alert)

---

## LOW PRIORITY - Nice-to-Have

### 11. Advanced Security Features
- [ ] Implement CAPTCHA on login
- [ ] Add two-factor authentication (2FA)
- [ ] Implement IP geolocation restrictions
- [ ] Add security.txt file
- [ ] Implement Content Security Policy reporting

---

## Testing Commands Quick Reference

### RLS Testing
```bash
npx ts-node scripts/test-rls-policies.ts
```

### API Auth Audit
```bash
npx ts-node scripts/audit-api-auth.ts
```

### Penetration Testing
```bash
./scripts/security-penetration-test.sh https://focusonit.ycm360.com
```

### Security Headers Check
```bash
curl -I https://focusonit.ycm360.com
```

### Check for Hardcoded Secrets
```bash
grep -r "sk_" . --include="*.ts" --exclude-dir=node_modules
grep -r "api_key\s*=\s*['\"]" . --include="*.ts" --exclude-dir=node_modules
```

### Rate Limiting Test
```bash
for i in {1..20}; do curl -s -o /dev/null -w "%{http_code}\n" https://focusonit.ycm360.com/api/calendar/status; sleep 0.1; done
```

---

## SQL Queries Quick Reference

### Check RLS Status
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('tasks', 'user_google_tokens', 'google_calendar_tokens');
```

### List RLS Policies
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Enable RLS on Table
```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policy Example
```sql
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Files Created by Security Audit

- `SECURITY_AUDIT_REPORT.md` - Full audit report (58 pages)
- `SECURITY_FINDINGS.md` - Critical vulnerability details
- `SECURITY_CHECKLIST.md` - This quick reference
- `next.config.security.js` - Secure Next.js configuration
- `scripts/test-rls-policies.ts` - RLS testing script
- `scripts/audit-api-auth.ts` - API authentication audit script
- `scripts/security-penetration-test.sh` - Automated pen testing

---

## Timeline

### Week 1 (Days 1-7)
- Day 1-2: Fix API authentication
- Day 3: Configure security headers
- Day 4-5: Verify RLS policies
- Day 6-7: Encrypt env vars, audit OAuth

### Week 2 (Days 8-14)
- Day 8-10: Implement rate limiting
- Day 11-12: OAuth state validation
- Day 13-14: Full penetration testing

**Target Launch Date:** After Week 2 completion

---

## Sign-Off

**Security Audit Status:**

- [ ] All CRITICAL issues resolved
- [ ] All HIGH priority issues resolved
- [ ] RLS test passes (100%)
- [ ] API auth audit passes (100%)
- [ ] Penetration test passes (100%)
- [ ] Security headers verified
- [ ] Environment variables encrypted

**Approval:**

- [ ] Tech Lead: _________________ Date: _______
- [ ] QA Lead: __________________ Date: _______
- [ ] Security Tester: __________ Date: _______

**Production Launch:** ⚠️ NOT APPROVED (pending fixes)

---

**Last Updated:** 2025-11-11
**Next Review:** After remediation (in 14 days)

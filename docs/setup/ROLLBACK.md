# Rollback Procedures

**Last Updated:** November 11, 2025
**Target Audience:** DevOps Lead, Tech Lead, On-Call Engineers
**Production URL:** https://focusonit.ycm360.com

---

## Table of Contents

1. [When to Rollback](#when-to-rollback)
2. [Decision Tree](#decision-tree)
3. [Code Rollback Procedures](#code-rollback-procedures)
4. [Database Rollback Procedures](#database-rollback-procedures)
5. [Combined Rollback](#combined-rollback)
6. [Verification Steps](#verification-steps)
7. [Post-Rollback Actions](#post-rollback-actions)
8. [Rollback Scenarios](#rollback-scenarios)
9. [Post-Mortem Template](#post-mortem-template)

---

## When to Rollback

### Immediate Rollback Required

**Critical situations that require immediate rollback:**

- **Application completely down** (500/502/503 errors)
- **Authentication broken** (users cannot log in)
- **Data loss or corruption** (tasks disappearing, incorrect data)
- **Security vulnerability exposed** (credentials leaked, RLS bypassed)
- **Complete feature failure** (core functionality broken for all users)
- **Database connection failures** (cannot connect to Supabase)
- **Severe performance degradation** (>10s load times, timeouts)

**Response Time:** Within 5 minutes of detection

### Consider Rollback

**Serious issues that warrant rollback consideration:**

- **Partial feature failure** (affects >50% of users)
- **Significant performance issues** (2-5x slower than baseline)
- **Real-time sync broken** (updates not propagating)
- **Integration failures** (Google Calendar sync broken for all)
- **Excessive error rates** (>5% error rate in Sentry)

**Response Time:** Within 15-30 minutes of detection

### Do NOT Rollback (Fix Forward Instead)

**Issues that should be fixed with hotfix, not rollback:**

- **Minor UI bugs** (cosmetic issues, alignment problems)
- **Non-critical feature issues** (affects <10% of users)
- **Single-user issues** (not systemic)
- **Performance optimizations** (unless critical degradation)
- **Minor copy/text changes**
- **Low-severity bugs with workarounds**

**Response:** Create hotfix branch and deploy fix forward

---

## Decision Tree

```
┌─────────────────────────────────────┐
│   Production Issue Detected         │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ Is application DOWN or unusable?    │
│ (500 errors, can't log in, etc.)   │
└─────────────────────────────────────┘
         │                    │
        YES                  NO
         │                    │
         ▼                    ▼
┌──────────────────┐  ┌──────────────────────┐
│ ROLLBACK NOW     │  │ Is data corrupted?   │
│ (code)           │  │ (tasks lost/wrong)   │
└──────────────────┘  └──────────────────────┘
         │                    │
         │            YES ────┴──── NO
         │             │               │
         ▼             ▼               ▼
┌──────────────────┐  ┌────────┐  ┌──────────────────┐
│ Is it fixed?     │  │ROLLBACK│  │ Can users work?  │
└──────────────────┘  │(both)  │  │ (with minor      │
         │            └────────┘  │  inconvenience)  │
    YES──┴──NO                    └──────────────────┘
         │    │                        │
         ▼    │                   YES──┴──NO
┌────────────┐│              │            │
│ Monitor    ││              ▼            ▼
│ & Create   ││      ┌───────────┐  ┌─────────┐
│ Hotfix     ││      │Create     │  │ROLLBACK │
└────────────┘│      │Hotfix     │  └─────────┘
              │      │(forward   │
              │      │ fix)      │
              │      └───────────┘
              ▼
┌──────────────────┐
│ Database issue?  │
└──────────────────┘
         │
    YES──┴──NO
         │    │
         ▼    ▼
┌──────────────────┐  ┌────────────┐
│ Rollback DB      │  │Investigate │
│ (restore/script) │  │Further     │
└──────────────────┘  └────────────┘
```

---

## Code Rollback Procedures

### Method 1: Vercel Dashboard (Fastest - Recommended)

**Time to Complete:** <30 seconds

**Steps:**

1. **Access Vercel Dashboard**
   - Go to: https://vercel.com/[team]/task-manager/deployments
   - Or use direct link if bookmarked

2. **Identify Last Known Good Deployment**
   ```
   Deployments list shows:
   ✓ abc1234 - 5 min ago - "feat: add new feature" (BROKEN)
   ✓ def5678 - 2 hours ago - "fix: update calendar sync" (LAST GOOD)
   ✓ ghi9012 - 5 hours ago - "docs: update readme"
   ```

   **How to identify last good:**
   - Look at timestamp (before issue reported)
   - Check commit message (does it match breaking change?)
   - Look for "Production" badge (current production)
   - Verify git hash if unsure: `git log --oneline -10`

3. **Promote Previous Deployment**
   - Hover over last known good deployment (e.g., `def5678`)
   - Click "..." menu (three dots)
   - Click **"Promote to Production"**
   - Confirm promotion in modal

4. **Verify Rollback**
   ```bash
   # Check production URL responds
   curl -I https://focusonit.ycm360.com

   # Expected: HTTP/2 200

   # Check in browser
   open https://focusonit.ycm360.com

   # Verify issue is resolved
   ```

5. **Monitor for 5 Minutes**
   - Watch for errors in Sentry
   - Check browser console for errors
   - Test critical user flow (login → create task)

**Advantages:**
- Instant rollback (<30 seconds)
- No command line needed
- Visual confirmation
- Can rollback to any previous deployment

**When to Use:**
- Immediate rollback needed
- Clear which deployment broke production
- On-call engineer has dashboard access

---

### Method 2: Vercel CLI

**Time to Complete:** 1-2 minutes

**Prerequisites:**
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login (one-time setup)
vercel login
```

**Steps:**

1. **List Recent Deployments**
   ```bash
   vercel ls task-manager

   # Output:
   # Age  Deployment                        Status    URL
   # 5m   task-manager-abc1234.vercel.app   Ready     focusonit.ycm360.com (current)
   # 2h   task-manager-def5678.vercel.app   Ready     -
   # 5h   task-manager-ghi9012.vercel.app   Ready     -
   ```

2. **Identify Last Good Deployment**
   ```bash
   # Check deployment details
   vercel inspect task-manager-def5678.vercel.app

   # Shows commit hash, timestamp, etc.
   ```

3. **Rollback to Previous Deployment**
   ```bash
   # Rollback to specific deployment
   vercel rollback task-manager-def5678.vercel.app

   # Or rollback to immediately previous
   vercel rollback
   ```

4. **Verify Rollback**
   ```bash
   # Check current production deployment
   vercel ls task-manager

   # Output should show def5678 as current production
   ```

**When to Use:**
- Prefer command line
- Dashboard not accessible
- Scripted rollback procedures

---

### Method 3: Git Revert (Slowest)

**Time to Complete:** 2-5 minutes

**When to Use:**
- Need permanent revert in git history
- Rolling back multiple commits
- Rollback via dashboard not available

**Steps:**

1. **Identify Breaking Commit**
   ```bash
   # View recent commits
   git log --oneline -10

   # Output:
   # abc1234 feat: add new feature (BREAKING)
   # def5678 fix: update calendar sync
   # ghi9012 docs: update readme
   ```

2. **Revert the Commit**
   ```bash
   # Revert single commit
   git revert abc1234

   # Or revert multiple commits
   git revert abc1234 xyz7890

   # Git opens editor for revert commit message
   # Default message: "Revert 'feat: add new feature'"
   # Edit if needed, save and close
   ```

3. **Push Revert to Main**
   ```bash
   # Push to trigger deployment
   git push origin main

   # Vercel detects push and deploys (2-3 minutes)
   ```

4. **Monitor Deployment**
   - Go to Vercel dashboard
   - Watch deployment progress
   - Verify build succeeds

5. **Verify in Production**
   ```bash
   # Check app loads
   curl -I https://focusonit.ycm360.com

   # Test in browser
   open https://focusonit.ycm360.com
   ```

**Advantages:**
- Permanent record in git history
- Can revert multiple commits atomically
- Team can see what was reverted

**Disadvantages:**
- Slower (2-3 minutes for deployment)
- Requires git access
- Creates revert commit in history

---

### Method 4: Reset Main Branch (Nuclear Option)

**DANGER:** Only use if git revert fails or in catastrophic scenarios

**Steps:**

1. **Reset Local Main to Good Commit**
   ```bash
   # Checkout main
   git checkout main

   # Reset to last good commit (DESTRUCTIVE)
   git reset --hard def5678

   # Verify you're at correct commit
   git log --oneline -5
   ```

2. **Force Push to Remote**
   ```bash
   # Force push (overwrites remote)
   git push --force origin main

   # Vercel deploys reset version
   ```

3. **Notify Team**
   - Post in Slack: "Main branch force-pushed to def5678 due to critical rollback"
   - Explain why nuclear option was necessary
   - Team needs to reset their local branches

**When to Use:**
- Multiple bad commits need removal
- Git revert creates conflicts
- Git history is broken

**Consequences:**
- Rewrites git history (team must reset local repos)
- Loses all commits after reset point
- Should be avoided if possible

---

## Database Rollback Procedures

### Method 1: Run Rollback Script (Preferred)

**Time to Complete:** 2-5 minutes

**Prerequisites:**
- Rollback script exists for migration
- Located in: `supabase/rollbacks/YYYYMMDD_migration_name_rollback.sql`

**Steps:**

1. **Locate Rollback Script**
   ```bash
   # Find rollback script for migration
   ls supabase/rollbacks/

   # Example: 20251111120000_add_feature_table_rollback.sql
   ```

2. **Review Rollback Script**
   ```sql
   -- supabase/rollbacks/20251111120000_add_feature_table_rollback.sql

   BEGIN;

   -- Drop table created by migration
   DROP TABLE IF EXISTS feature_table CASCADE;

   -- Remove migration record
   DELETE FROM supabase_migrations
   WHERE version = '20251111120000';

   COMMIT;
   ```

3. **Execute Rollback Script**

   **Via Supabase Dashboard:**
   - Go to: https://app.supabase.com/project/[project-id]/sql/new
   - Copy rollback script contents
   - Paste into SQL Editor
   - Click **"Run"**
   - Wait for completion (green checkmark)

   **Via Supabase CLI:**
   ```bash
   # Execute rollback script
   supabase db execute -f supabase/rollbacks/20251111120000_add_feature_table_rollback.sql \
     --project-ref [production-project-ref]
   ```

4. **Verify Rollback Success**
   ```sql
   -- Check table was dropped
   SELECT * FROM feature_table;
   -- Expected: ERROR: relation "feature_table" does not exist

   -- Check migration record removed
   SELECT * FROM supabase_migrations
   WHERE version = '20251111120000';
   -- Expected: 0 rows

   -- Verify other tables unaffected
   SELECT COUNT(*) FROM tasks;
   -- Expected: Original count
   ```

5. **Test Application**
   ```bash
   # Verify app still works
   open https://focusonit.ycm360.com

   # Test core functionality
   # - Login
   # - Create task
   # - Edit task
   ```

**When to Use:**
- Single migration needs reverting
- Rollback script prepared in advance
- Surgical rollback (only affected tables)

---

### Method 2: Restore from Backup (Nuclear Option)

**DANGER:** Restores ENTIRE database, loses all data after backup timestamp

**Time to Complete:** 5-20 minutes

**Prerequisites:**
- Supabase Pro/Team tier (Free tier has limited backups)
- Backup exists before migration

**Steps:**

1. **Assess Data Loss Impact**
   ```sql
   -- Check how much data would be lost
   SELECT
     COUNT(*) as records_after_backup,
     MAX(created_at) as latest_record
   FROM tasks
   WHERE created_at > '[backup_timestamp]';

   -- Example output:
   -- records_after_backup: 47
   -- latest_record: 2025-11-11 14:30:00

   -- This means 47 tasks created after backup will be lost
   ```

2. **Notify Stakeholders**
   ```
   CRITICAL: About to restore database from backup.
   All data after [backup_timestamp] will be lost.
   Estimated data loss: 47 tasks, 12 users.
   Downtime: 5-10 minutes.
   ```

3. **Take Current Snapshot (Optional)**
   ```bash
   # Take snapshot of current state before restore
   # In case restore fails, can revert to current

   # Via Supabase Dashboard:
   # Database → Backups → Create Backup
   # Name: "pre-restore-snapshot-YYYYMMDD-HHMMSS"
   ```

4. **Restore from Backup**

   **Via Supabase Dashboard:**
   - Go to: https://app.supabase.com/project/[project-id]/database/backups
   - Find backup taken before migration (check timestamp carefully)
   - Click "..." menu → **"Restore"**
   - **CONFIRM** restoration (cannot be undone)
   - Wait 5-20 minutes for restoration

5. **Monitor Restoration Progress**
   - Dashboard shows progress bar
   - Database is **offline** during restoration
   - Application will show connection errors (expected)

6. **Verify Restoration**
   ```sql
   -- Check migration is gone
   SELECT * FROM supabase_migrations
   ORDER BY version DESC LIMIT 10;

   -- Check data integrity
   SELECT COUNT(*) FROM tasks;
   SELECT COUNT(*) FROM users;

   -- Verify timestamps
   SELECT MAX(created_at) FROM tasks;
   -- Should match backup timestamp
   ```

7. **Test Application**
   ```bash
   # App should be back online
   open https://focusonit.ycm360.com

   # Test all critical flows
   ```

8. **Communicate Data Loss**
   ```
   Database restored from [backup_timestamp].
   Data created after this time is lost.
   If you created tasks after this time, please recreate them.
   We apologize for the inconvenience.
   ```

**When to Use:**
- Multiple migrations need reverting
- Rollback scripts don't exist or failed
- Data corruption is widespread
- Database is in inconsistent state

**Consequences:**
- **Data loss** (all data after backup timestamp)
- Downtime (5-20 minutes)
- User impact (need to recreate lost data)
- Should be **last resort**

---

### Method 3: Manual SQL Rollback (Ad-Hoc)

**When to Use:**
- Rollback script doesn't exist
- Need to revert specific changes manually

**Steps:**

1. **Identify Changes Made by Migration**
   ```bash
   # Review migration file
   cat supabase/migrations/20251111120000_add_feature_table.sql
   ```

2. **Write Inverse SQL Statements**
   ```sql
   -- If migration added column:
   -- Migration: ALTER TABLE tasks ADD COLUMN new_field TEXT;
   -- Rollback:
   ALTER TABLE tasks DROP COLUMN new_field;

   -- If migration created table:
   -- Migration: CREATE TABLE feature_table ...;
   -- Rollback:
   DROP TABLE feature_table CASCADE;

   -- If migration added index:
   -- Migration: CREATE INDEX idx_name ON table(column);
   -- Rollback:
   DROP INDEX idx_name;

   -- If migration modified RLS policy:
   -- Migration: CREATE POLICY ... or ALTER POLICY ...
   -- Rollback:
   DROP POLICY policy_name ON table_name;
   ```

3. **Execute Rollback SQL**
   ```sql
   BEGIN;

   -- Execute inverse statements
   -- ...

   -- Remove migration record
   DELETE FROM supabase_migrations
   WHERE version = '20251111120000';

   -- Verify changes
   -- ...

   COMMIT;
   ```

4. **Verify Rollback**
   ```sql
   -- Check objects removed/restored
   -- Test application
   ```

---

## Combined Rollback

**When Needed:**
- Deployment includes both code and database changes
- Both need reverting to restore stability

### Process

**1. Assess Situation**
```
Question: Which component is causing the issue?
- Code only? → Rollback code
- Database only? → Rollback database
- Both? → Rollback both (order matters)
```

**2. Determine Order**

**If migration broke app:**
```
Order: Database FIRST, then Code
Reason: Code depends on database schema
```

**If code broke database operations:**
```
Order: Code FIRST, then Database (if needed)
Reason: Stop bad code from affecting database
```

**3. Execute Rollbacks**

**Example: Rollback both (migration broke app)**

```bash
# Step 1: Rollback database
# Via Supabase SQL Editor:
```

```sql
BEGIN;

-- Rollback migration
DROP TABLE IF EXISTS feature_table CASCADE;

DELETE FROM supabase_migrations
WHERE version = '20251111120000';

COMMIT;
```

```bash
# Step 2: Verify database rolled back
# Test queries in Supabase

# Step 3: Rollback code
# Via Vercel Dashboard:
# Promote previous deployment

# Step 4: Verify code rolled back
curl -I https://focusonit.ycm360.com
```

**4. Verify End-to-End**
```bash
# Test complete user flow
# - Login
# - Create task
# - Edit task
# - Mark complete
# - Delete task
# - Check calendar sync (if applicable)
```

---

## Verification Steps

After ANY rollback, perform these checks:

### 1. Application Accessibility

```bash
# Check app responds
curl -I https://focusonit.ycm360.com

# Expected: HTTP/2 200
```

### 2. Core Functionality Tests

- [ ] **Authentication**
  - Can log in with email/password
  - Can log in with Google OAuth
  - Session persists after refresh

- [ ] **Task Management**
  - Can create task
  - Can edit task inline
  - Can mark task complete
  - Can delete task
  - Tasks appear in correct views

- [ ] **Views Load**
  - TODAY view: `/today`
  - WEEK view: `/week`
  - ALL view: `/all`
  - COMPLETED view: `/completed`

- [ ] **Real-time Sync**
  - Open two browser tabs
  - Create task in tab 1
  - Task appears in tab 2 within 2-3 seconds

- [ ] **Google Calendar Sync** (if applicable)
  - Connection status shows correctly
  - Can create task with date → calendar event created
  - Can edit task → calendar event updated
  - Can delete task → calendar event removed

### 3. Error Monitoring

- [ ] **Sentry** (if configured)
  - Error rate normal (<0.1%)
  - No new error types
  - No spike in errors

- [ ] **Browser Console**
  - No JavaScript errors
  - No 404s in Network tab
  - WebSocket connection healthy (Realtime)

- [ ] **Vercel Function Logs**
  - API routes responding normally
  - No 500 errors
  - Response times <500ms

### 4. Database Health

```sql
-- Check connection
SELECT NOW();

-- Check row counts (should be unchanged)
SELECT
  (SELECT COUNT(*) FROM tasks) as tasks_count,
  (SELECT COUNT(*) FROM auth.users) as users_count;

-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM tasks WHERE user_id = 'test-user-id';

-- Expected: Execution time <50ms
```

### 5. User Impact Assessment

- [ ] Monitor support channels (first 30 minutes)
- [ ] Check for user complaints on social media
- [ ] Review in-app feedback (if exists)
- [ ] Monitor login attempts (spike = issue)

---

## Post-Rollback Actions

### Immediate (0-1 Hour)

**1. Notify Stakeholders**

```
Template:

RESOLVED: Production Rollback Completed

Issue: [Brief description]
Action Taken: Rolled back to deployment [hash/timestamp]
Status: Application stable, monitoring ongoing
Impact: [Number] users affected, [duration] downtime
Next Steps: Root cause analysis, hotfix planning

[Your Name]
[Timestamp]
```

**Send to:**
- Team Slack channel (#focusonit-incidents)
- Tech Lead (direct message)
- Product Manager (if user-facing impact)
- CTO (if critical incident)

**2. Update Status Page** (if exists)
```
Title: Service Restored
Status: Operational
Message: Issue resolved via rollback. Investigating root cause.
```

**3. Monitor Closely**
- Watch Sentry for 30 minutes
- Monitor Vercel function logs
- Check UptimeRobot status
- Review support emails

**4. Document Timeline**
```
Incident Timeline:
- 14:00 - Deployment completed
- 14:05 - Errors detected in Sentry
- 14:07 - Incident declared
- 14:10 - Rollback initiated
- 14:11 - Rollback completed
- 14:15 - Service verified healthy
- 14:30 - Monitoring ongoing, no further issues
```

### Short-Term (1-24 Hours)

**5. Root Cause Analysis**
- Review deployment diff: `git diff [previous-commit] [rolled-back-commit]`
- Identify what broke (code logic, migration, config change)
- Determine why it wasn't caught (testing gap, edge case)

**6. Create Post-Mortem**
- Use template below
- Document what happened, why, and how to prevent
- Share with team for review

**7. Plan Fix**
- Create fix strategy (what needs to change)
- Write tests to prevent regression
- Schedule fix deployment (not rushed)

### Medium-Term (1-7 Days)

**8. Implement Fix Properly**
- Create feature branch
- Implement fix with tests
- Test thoroughly in staging
- Get code review
- Deploy during low-traffic period

**9. Update Procedures**
- Add to runbooks if new failure mode
- Update deployment checklist
- Improve monitoring/alerting if missed
- Document lesson learned

**10. Team Retrospective**
- What went well (quick rollback?)
- What didn't (detection time?)
- Action items to improve
- Update playbooks

---

## Rollback Scenarios

### Scenario 1: New Feature Broke Core Functionality

**Example:** Added task filtering feature, now tasks don't load

**Symptoms:**
- Error in console: `TypeError: Cannot read property 'filter' of undefined`
- Tasks page blank
- Sentry showing 100+ errors

**Decision:** Rollback code immediately

**Steps:**
1. Rollback via Vercel Dashboard (30 seconds)
2. Verify tasks load correctly
3. Monitor for 15 minutes
4. Create hotfix branch to fix filtering logic
5. Deploy fix with tests

**Timeline:** 5 minutes to restore service

---

### Scenario 2: Database Migration Broke Schema

**Example:** Added column with NOT NULL constraint, existing rows fail

**Symptoms:**
- Cannot create new tasks
- Error: `null value in column "new_field" violates not-null constraint`
- Supabase logs showing constraint violations

**Decision:** Rollback database migration

**Steps:**
1. Run rollback script to remove column
2. Verify existing functionality works
3. Create corrected migration with default value
4. Test in staging
5. Re-deploy with proper migration

**Timeline:** 10 minutes to restore service

---

### Scenario 3: Deployment + Migration Both Failed

**Example:** Added new table + code to use it, both broke

**Symptoms:**
- Application errors: `relation "new_table" does not exist`
- Cannot access affected features
- Partial functionality broken

**Decision:** Rollback both (database first, then code)

**Steps:**
1. Rollback database (drop new table)
2. Verify database stable
3. Rollback code deployment
4. Verify application stable
5. Fix both migration and code
6. Re-deploy properly

**Timeline:** 15 minutes to restore service

---

### Scenario 4: Gradual Degradation (Not Immediate)

**Example:** Deployment succeeds, but performance degrades over 2 hours

**Symptoms:**
- Application slow (>5s load times)
- Database CPU at 100%
- Users complaining about slowness

**Decision:** Investigate first, rollback if no quick fix

**Steps:**
1. Check Supabase query performance (5 minutes)
2. Identify slow query (missing index?)
3. If quick fix exists (add index), apply fix forward
4. If no quick fix, rollback deployment
5. Investigate properly offline

**Timeline:** 15-30 minutes (investigation + rollback)

---

### Scenario 5: Data Corruption Detected

**Example:** Tasks showing wrong due dates after deployment

**Symptoms:**
- User reports: "My task says tomorrow but should be today"
- Data inconsistency across users
- Timezone conversion bug

**Decision:** Rollback code + restore data (if backup available)

**Steps:**
1. Stop further damage: Rollback code immediately
2. Assess extent: How many records affected?
3. If <100 records: Manual data fix (SQL UPDATE)
4. If >100 records: Restore from backup (data loss)
5. Communicate data issue to users
6. Fix timezone logic
7. Re-deploy with fix

**Timeline:** 30 minutes - 2 hours (depending on data fix method)

---

## Post-Mortem Template

**Use this template for any rollback incident:**

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Severity:** Critical / High / Medium
**Duration:** X hours Y minutes
**Impact:** [Number of users affected, features broken, data loss]

---

## Executive Summary

[2-3 sentences summarizing what happened, impact, and resolution]

---

## Timeline

| Time (UTC) | Event |
|------------|-------|
| 14:00 | Deployment to production completed (commit abc1234) |
| 14:05 | Error spike detected in Sentry (100+ errors/min) |
| 14:07 | On-call engineer paged, investigation started |
| 14:10 | Rollback decision made |
| 14:11 | Code rolled back via Vercel Dashboard |
| 14:15 | Service verified healthy, errors stopped |
| 14:30 | Monitoring continues, no further issues |
| 15:00 | Incident closed, post-mortem started |

---

## Root Cause

### What Happened

[Technical explanation of what went wrong]

Example:
```
Added a new filtering feature for tasks. The code assumed all tasks
have a 'tags' property, but older tasks in the database don't have
this field. When filtering was applied, accessing task.tags on older
tasks caused "Cannot read property 'filter' of undefined" errors.
```

### Why It Happened

[Why wasn't this caught before production?]

Example:
```
1. Testing only used recently created tasks (which have 'tags' field)
2. Staging database was reset recently, no old data to test with
3. No TypeScript null check for optional field
4. Code review didn't catch the edge case
```

---

## Impact

### Users Affected
- **Total Users:** 500 active users during incident
- **Affected Users:** ~200 users (40%)
- **User Actions Impacted:** Cannot view or filter tasks

### Business Impact
- **Downtime:** 11 minutes (14:00-14:11)
- **Data Loss:** None
- **Revenue Impact:** None (free product)

### Technical Impact
- **Error Count:** 1,247 errors in Sentry
- **API Failures:** 89% error rate during incident
- **Database:** No impact, remained healthy

---

## Resolution

### Actions Taken

1. **Immediate Response (14:07-14:11):**
   - On-call engineer investigated error logs
   - Identified cause: missing 'tags' property on older tasks
   - Decided to rollback (no quick fix available)
   - Rolled back via Vercel Dashboard to commit def5678
   - Verified service restored

2. **Short-Term Fix (14:30-16:00):**
   - Created hotfix branch: `hotfix/tags-filter-null-check`
   - Added null checks: `task.tags?.filter() ?? []`
   - Added TypeScript optional chaining
   - Tested with old and new task data
   - Deployed hotfix, verified fix works

3. **Long-Term Prevention:**
   - Added "old data" to staging database for testing
   - Updated code review checklist: "Test with old data formats"
   - Added TypeScript strict null checks to project
   - Created integration test for filtering edge cases

---

## What Went Well

- [x] Quick detection (5 minutes)
- [x] Fast rollback decision (2 minutes)
- [x] Rollback executed smoothly (1 minute)
- [x] Communication to team immediate
- [x] Hotfix created same day

---

## What Didn't Go Well

- [ ] Testing didn't cover old data formats
- [ ] Code review missed edge case
- [ ] TypeScript didn't catch null access (not strict enough)
- [ ] No alerting for error rate spike (manual detection)

---

## Action Items

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| Enable TypeScript strict null checks | Tech Lead | 2025-11-15 | In Progress |
| Add "old data" fixtures to staging | DevOps | 2025-11-12 | Done |
| Set up Sentry alert for >10 errors/min | DevOps | 2025-11-13 | To Do |
| Update code review checklist | Tech Lead | 2025-11-12 | Done |
| Create integration tests for filtering | Developer | 2025-11-18 | To Do |
| Document common edge cases | Doc Specialist | 2025-11-20 | To Do |

---

## Lessons Learned

### What We Learned

1. **Always test with production-like data** - Staging data should include old formats
2. **TypeScript strict mode is essential** - Prevents null/undefined access
3. **Edge cases matter** - Assumptions about data structure break with old data
4. **Fast rollback is valuable** - Vercel Dashboard rollback saved significant downtime

### How to Prevent This

1. **Testing:** Add "data migration" tests for old formats
2. **Code Quality:** Enable TypeScript strictNullChecks
3. **Code Review:** Updated checklist to include edge case review
4. **Monitoring:** Set up proactive alerts (not reactive manual checking)

---

## Related Issues

- GitHub Issue: #123 - "Tasks page blank for users with old data"
- Lesson Learned: `lessons-learned/by-date/2025-11-11-tags-filter-null-check.md`
- Hotfix PR: #124 - "fix: add null check for tags filtering"

---

## Appendix

### Error Examples

```
TypeError: Cannot read property 'filter' of undefined
  at filterTasks (TaskList.tsx:45)
  at TaskList.render (TaskList.tsx:120)
```

### Code Diff (What Broke)

```diff
// Before (working)
const filteredTasks = tasks.filter(task => task.status === 'pending')

// After (broken)
-const filteredTasks = tasks.filter(task => task.status === 'pending')
+const filteredTasks = tasks
+  .filter(task => task.status === 'pending')
+  .filter(task => task.tags.includes(selectedTag)) // ERROR: task.tags undefined for old tasks
```

### Code Diff (Fix)

```diff
// Fixed with null check
const filteredTasks = tasks
  .filter(task => task.status === 'pending')
-  .filter(task => task.tags.includes(selectedTag))
+  .filter(task => task.tags?.includes(selectedTag) ?? false)
```

---

**Post-Mortem Completed By:** [Your Name]
**Date:** 2025-11-11
**Reviewed By:** Tech Lead, DevOps Lead
**Approved:** [Date]
```

---

**Document Version:** 1.0
**Last Updated:** November 11, 2025
**Maintained By:** DevOps Team
**Next Review:** February 11, 2026

---

**Related Documentation:**
- [Deployment Guide](./DEPLOYMENT.md)
- [Common Issues Runbook](../runbooks/COMMON_ISSUES.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)

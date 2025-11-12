# Production Deployment Guide

**Last Updated:** November 11, 2025
**Target Audience:** DevOps Lead, Tech Lead, Developers
**Production URL:** https://focusonit.ycm360.com

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Standard Deployment](#standard-deployment)
4. [Hotfix Deployment](#hotfix-deployment)
5. [Database Migrations](#database-migrations)
6. [Rollback Procedures](#rollback-procedures)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)
9. [Emergency Contacts](#emergency-contacts)

---

## Pre-Deployment Checklist

Before deploying to production, verify:

### Code Quality

- [ ] All tests passing locally (if tests exist)
- [ ] Build succeeds without errors: `npm run build`
- [ ] ESLint passes without errors: `npm run lint`
- [ ] TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] No console errors in browser (check DevTools)
- [ ] No TypeScript `any` types added unnecessarily

### Dependencies

- [ ] `package-lock.json` committed and up-to-date
- [ ] No vulnerable dependencies: `npm audit` (or acceptable exceptions documented)
- [ ] Dependencies reviewed for updates (check Dependabot PRs if enabled)
- [ ] All new dependencies justified and documented

### Environment Variables

- [ ] All required env vars set in Vercel dashboard
- [ ] Sensitive vars marked as "Encrypted" (see Environment Setup)
- [ ] Production URLs correct (not localhost or staging)
- [ ] `.env.example` updated with new variables (if any added)

### Database

- [ ] Migrations tested in staging environment first
- [ ] Backup taken before major migrations (via Supabase dashboard)
- [ ] RLS policies verified for new tables
- [ ] Rollback script created for migration (if applicable)

### Monitoring

- [ ] Error tracking configured (Sentry DSN if using)
- [ ] UptimeRobot monitors active (if configured)
- [ ] Alert notifications working and reaching correct team
- [ ] Vercel deployment notifications enabled

### Documentation

- [ ] CHANGELOG.md updated with new features/fixes
- [ ] README.md reflects current state of application
- [ ] New features documented in `docs/features/`
- [ ] API changes documented in `docs/api/` (if applicable)
- [ ] Lesson learned created if complex bug resolved

---

## Environment Setup

### Required Environment Variables

**Configure in Vercel Dashboard: Settings → Environment Variables**

| Variable | Environment | Encrypted | Required | Example |
|----------|-------------|-----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production | No | Yes | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | No | Yes | `eyJxxx...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | **Yes** | Yes | `eyJxxx...` |
| `GOOGLE_CLIENT_ID` | Production | No | For Calendar | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Production | **Yes** | For Calendar | `GOCSPX-xxx` |
| `NEXT_PUBLIC_APP_URL` | Production | No | Yes | `https://focusonit.ycm360.com` |
| `N8N_WEBHOOK_URL` | Production | No | For Voice | `https://n8n.ycm360.com/webhook/voice-to-task` |
| `N8N_WEBHOOK_SECRET` | Production | **Yes** | For Voice | `<random-uuid>` |
| `NEXT_PUBLIC_SENTRY_DSN` | Production | No | Optional | `https://xxx@sentry.io/xxx` |

### How to Set Environment Variables in Vercel

**Via Vercel Dashboard:**

1. Navigate to: https://vercel.com/[your-team]/task-manager
2. Click the "Settings" tab
3. Click "Environment Variables" in left sidebar
4. For each variable:
   - **Name:** Enter the variable name exactly (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value:** Paste the value (no quotes needed)
   - **Environments:** Check "Production" (uncheck Preview/Development if not needed)
   - **Encrypted:** Check this box ONLY for sensitive values (see table above)
   - Click "Save"
5. After adding/changing env vars, trigger a new deployment

**Via Vercel CLI:**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link to project (run from project root)
vercel link

# Set environment variable
vercel env add VARIABLE_NAME production

# You'll be prompted to enter the value
# For encrypted vars, they're automatically encrypted

# Pull environment variables to local (for verification)
vercel env pull .env.vercel
```

### Where to Find Values

| Variable | Where to Find |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Same location → Click client ID → View secret |
| `NEXT_PUBLIC_APP_URL` | Your production domain (e.g., `https://focusonit.ycm360.com`) |
| `N8N_WEBHOOK_URL` | n8n Dashboard → Workflow → Webhook node → Production URL |
| `N8N_WEBHOOK_SECRET` | Generate with `node -e "console.log(require('crypto').randomUUID())"` |

---

## Standard Deployment

**Process:** Git push to `main` branch → Vercel auto-deploys → Production live

### Deployment Flow Diagram

```
Local Development → Feature Branch → Pull Request → Code Review →
Merge to Main → Vercel Auto-Deploy → Production (2-3 minutes)
```

### Step-by-Step Process

#### 1. Ensure You're on Main Branch

```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main
```

#### 2. Create Feature Branch

```bash
# Create and switch to feature branch
git checkout -b feature/my-awesome-feature

# Or for bug fix
git checkout -b fix/bug-description
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `chore/` - Build, dependencies, tooling

#### 3. Make Changes and Commit

```bash
# Make your code changes
# Edit files...

# Check what changed
git status
git diff

# Stage changes
git add .

# Commit with descriptive message (Conventional Commits)
git commit -m "feat(calendar): add bidirectional sync for task deletion"
```

**Commit message format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`

**Examples:**
```bash
git commit -m "feat(tasks): add drag and drop reordering"
git commit -m "fix(auth): resolve Google OAuth token refresh error"
git commit -m "docs: update deployment guide with rollback procedures"
```

#### 4. Push Feature Branch to GitHub

```bash
# Push branch to remote
git push -u origin feature/my-awesome-feature

# Output will include a URL to create Pull Request
```

#### 5. Create Pull Request on GitHub

**Via GitHub Web Interface:**

1. Go to: https://github.com/[your-org]/task-manager
2. Click "Compare & pull request" button (appears after push)
3. Fill in PR template:

```markdown
## Summary
Brief description of what this PR does

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tested locally
- [ ] Build passes
- [ ] ESLint passes
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Related Issues
Closes #123
```

4. Request review from team member
5. Click "Create pull request"

**Via GitHub CLI (gh):**

```bash
# Create PR from command line
gh pr create --title "feat(calendar): add bidirectional sync" \
  --body "Implements bidirectional deletion sync for Google Calendar integration"

# Or use interactive mode
gh pr create
```

#### 6. Wait for CI Checks (Automated)

Vercel automatically runs checks on your PR:

```
✅ Build succeeds (vercel build)
✅ No TypeScript errors
✅ Preview deployment created
```

**Preview URL:** Vercel comments on your PR with a preview link:
```
https://task-manager-git-feature-my-awesome-feature-team.vercel.app
```

Test your changes on the preview URL before merging.

#### 7. Code Review

- Team member reviews code
- Address feedback with additional commits
- Push fixes to same branch (PR updates automatically)
- Obtain approval

#### 8. Merge Pull Request

**Options:**

**Squash and Merge (Recommended):**
- All commits squashed into one
- Clean commit history on main
- Click "Squash and merge" button

**Merge Commit:**
- Preserves all commits
- Use for complex features with logical commit progression

**Rebase and Merge:**
- Commits added individually to main
- Use rarely (only for clean, small PRs)

#### 9. Vercel Auto-Deploys (Automatic)

Once merged to `main`:

```
1. Vercel detects push to main branch
2. Starts build process
3. Runs: npm install → npm run build
4. Deploys to production
5. Updates production URL (2-3 minutes total)
```

**Monitor deployment:**
- Go to: https://vercel.com/[team]/task-manager/deployments
- Watch deployment progress in real-time
- View build logs if issues occur

#### 10. Verify Deployment

See [Post-Deployment Verification](#post-deployment-verification) section for detailed checklist.

**Quick verification:**

```bash
# Check production is live
curl -I https://focusonit.ycm360.com

# Expected: HTTP/2 200

# Check app loads in browser
open https://focusonit.ycm360.com
```

**Manual smoke test:**
- Log in with test account
- Create a task
- Edit task
- Mark complete
- Delete task
- Verify Google Calendar sync (if connected)

**Monitor for 15 minutes:**
- Watch Sentry for error spikes (if configured)
- Check UptimeRobot status (if configured)
- Monitor Vercel function logs

---

## Hotfix Deployment

**When to Use:** Critical production bug requires immediate fix (cannot wait for normal PR process)

**Examples:**
- Application completely down (500 errors)
- Authentication broken (users cannot log in)
- Data loss or corruption
- Security vulnerability

**NOT for:**
- Minor UI bugs
- Non-critical feature issues
- Performance optimizations (unless critical)

### Hotfix Process

#### 1. Create Hotfix Branch from Main

```bash
# Ensure main is up-to-date
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/critical-auth-bug

# Branch naming: hotfix/short-description
```

#### 2. Fix the Bug (Minimal Changes)

**Principles:**
- Change ONLY what's necessary to fix the issue
- Avoid adding new features
- Avoid refactoring (unless directly related)
- Keep diff as small as possible

```bash
# Make minimal code changes
# Edit only affected files

# Test fix locally
npm run dev

# Verify bug is fixed
# Test related functionality
```

#### 3. Build and Test Locally

```bash
# Build production version
npm run build

# Run production build
npm start

# Open http://localhost:3000
# Verify fix works in production mode
```

#### 4. Commit and Push

```bash
# Commit with clear message
git add .
git commit -m "fix(auth): resolve Google OAuth token refresh duplicate key error"

# Push to GitHub
git push -u origin hotfix/critical-auth-bug
```

#### 5. Create Pull Request (Fast-Track)

**Mark as HOTFIX in title:**

```
HOTFIX: fix(auth): resolve Google OAuth token refresh error
```

**Add urgency label:**
- Label: `priority: critical` or `hotfix`

**Fast-track review:**
- Skip detailed code review if extremely urgent
- Require CI checks to pass (non-negotiable)
- Get quick approval from Tech Lead or on-call engineer
- Document in PR why this is a hotfix

#### 6. Merge Immediately

```bash
# Merge via GitHub UI
# Click "Squash and merge"

# Vercel deploys automatically (2-3 minutes)
```

#### 7. Monitor Closely

**First 30 minutes are critical:**

- [ ] Watch Vercel deployment logs for errors
- [ ] Check Sentry for new errors (real-time)
- [ ] Monitor UptimeRobot for downtime
- [ ] Verify fix in production: https://focusonit.ycm360.com
- [ ] Test critical user flows (login, create task, etc.)
- [ ] Monitor support channels for user complaints

**If issues detected:**
- Immediately roll back (see [Rollback Procedures](#rollback-procedures))
- Investigate root cause
- Create new hotfix

#### 8. Post-Hotfix Follow-Up

**Within 24 hours:**

- [ ] Create post-mortem document (for critical incidents)
- [ ] Add tests to prevent regression
- [ ] Update runbooks if needed
- [ ] Document lesson learned in `lessons-learned/`
- [ ] Notify team of hotfix and resolution

**Post-mortem template:**

```markdown
# Post-Mortem: [Issue Title]

**Date:** YYYY-MM-DD
**Duration:** X hours/minutes
**Severity:** Critical/High

## Summary
Brief description of what went wrong

## Timeline
- HH:MM - Issue detected
- HH:MM - Hotfix started
- HH:MM - Fix deployed
- HH:MM - Verified resolved

## Root Cause
Technical explanation of what caused the issue

## Impact
- Users affected: X
- Downtime: X minutes
- Data loss: Yes/No

## Resolution
What was done to fix it

## Prevention
How to prevent this in the future

## Action Items
- [ ] Add test for X
- [ ] Update documentation
- [ ] Improve monitoring
```

---

## Database Migrations

**When Needed:**
- Adding/removing tables
- Adding/removing columns
- Modifying column types
- Adding indexes
- Changing constraints
- Creating functions/triggers

### Migration Safety Principles

1. **Test in staging first** - ALWAYS
2. **Create rollback scripts** - Before applying
3. **Take backups** - Before major changes
4. **Use transactions** - Wrap in BEGIN/COMMIT
5. **Apply during low-traffic** - Early morning or late night
6. **Communicate downtime** - If expected
7. **Monitor closely** - After migration

### Safe Migration Process

#### 1. Create Migration Locally

**Using Supabase CLI:**

```bash
# Create new migration file
supabase migration new add_feature_table

# File created: supabase/migrations/20251111120000_add_feature_table.sql
```

**Edit migration file:**

```sql
-- supabase/migrations/20251111120000_add_feature_table.sql

BEGIN;

-- Create new table
CREATE TABLE IF NOT EXISTS feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_feature_table_user_id ON feature_table(user_id);

-- Enable RLS
ALTER TABLE feature_table ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own records
CREATE POLICY "Users can view their own features"
  ON feature_table
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own features"
  ON feature_table
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own features"
  ON feature_table
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own features"
  ON feature_table
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE feature_table IS 'Stores user features with RLS';

COMMIT;
```

#### 2. Create Rollback Script

**ALWAYS create rollback before applying:**

```sql
-- supabase/rollbacks/20251111120000_add_feature_table_rollback.sql

BEGIN;

-- Reverse all changes
DROP TABLE IF EXISTS feature_table CASCADE;

COMMIT;
```

**Store in:** `supabase/rollbacks/` directory

#### 3. Test Migration in Staging

```bash
# Apply to staging Supabase project
supabase db push --project-ref <staging-project-ref>

# Or manually via Supabase Dashboard SQL Editor
# Copy migration SQL and run in staging
```

**Verify in staging:**

```sql
-- Check table exists
SELECT * FROM feature_table LIMIT 1;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'feature_table';

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'feature_table';
```

**Test application with staging database:**

```bash
# Point app to staging Supabase
# Edit .env.local temporarily
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxx.supabase.co

# Test features that use new table
npm run dev
```

#### 4. Take Production Backup

**Via Supabase Dashboard:**

1. Go to: https://app.supabase.com/project/[project-id]
2. Navigate to: Database → Backups
3. Click "Create backup"
4. Wait for backup completion (1-5 minutes)
5. Note backup ID: `backup_20251111_120000`

**Important:** Free tier has limited backups. Upgrade to Pro for more.

**Verify backup exists:**
- Check backups list shows new backup
- Note timestamp for restoration if needed

#### 5. Apply Migration to Production

**Option A: Via Supabase CLI (Recommended)**

```bash
# Apply migration to production
supabase db push --project-ref <production-project-ref>

# Output shows:
# - Which migrations will be applied
# - Success/failure status
```

**Option B: Manual via SQL Editor (For complex migrations)**

```bash
# 1. Copy migration SQL
# 2. Go to Supabase Dashboard → SQL Editor
# 3. Paste SQL
# 4. Review carefully
# 5. Click "Run"
```

**Option C: Via GitHub Actions (Automated - if configured)**

```bash
# 1. Go to GitHub Actions tab
# 2. Select "Production Migration" workflow
# 3. Click "Run workflow"
# 4. Type "migrate-production" to confirm
# 5. Wait for completion
```

#### 6. Verify Migration Success

```sql
-- Check migration was applied
SELECT * FROM supabase_migrations
ORDER BY version DESC
LIMIT 5;

-- Should show new migration in list

-- Verify table exists
SELECT * FROM feature_table LIMIT 1;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'feature_table';

-- Verify RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'feature_table';
```

**Test in production:**

```bash
# Open production app
open https://focusonit.ycm360.com

# Test functionality that uses new table
# Create test record
# Verify it appears
# Verify RLS works (can only see own data)
```

#### 7. Deploy Application Code

**Now deploy code that uses new schema:**

```bash
# Merge feature branch that uses new table
git merge feature/new-feature

# Vercel auto-deploys
# Application now uses new table
```

**Important:** Deploy code AFTER migration succeeds, not before.

### Migration Best Practices

#### DO:

- **Test in staging first** - Always
- **Create rollback scripts** - For every migration
- **Take backups** - Before major changes
- **Use transactions** - Wrap in BEGIN/COMMIT
- **Add indexes concurrently** - No table locks
  ```sql
  CREATE INDEX CONCURRENTLY idx_name ON table(column);
  ```
- **Use IF EXISTS/IF NOT EXISTS** - Idempotent migrations
  ```sql
  CREATE TABLE IF NOT EXISTS ...
  DROP TABLE IF EXISTS ...
  ```
- **Add comments** - Explain purpose
  ```sql
  COMMENT ON TABLE tasks IS 'Stores user tasks';
  ```
- **Communicate downtime** - If expected
- **Apply during low traffic** - Early morning or late night

#### DON'T:

- **Run migrations directly in production** - Without testing
- **Delete columns immediately** - Use deprecation period
- **Rename columns** - Without migration strategy (see Zero-Downtime below)
- **Run long migrations during peak hours** - Causes timeouts
- **Skip rollback scripts** - Always create them
- **Add NOT NULL constraints** - Without default values or backfill
  ```sql
  -- BAD: Will fail if existing rows have NULL
  ALTER TABLE tasks ADD COLUMN new_field TEXT NOT NULL;

  -- GOOD: Add with default first
  ALTER TABLE tasks ADD COLUMN new_field TEXT DEFAULT 'value';
  -- Then remove default if needed
  ALTER TABLE tasks ALTER COLUMN new_field DROP DEFAULT;
  ```
- **Modify RLS policies** - Without verifying access

### Zero-Downtime Migrations (Expand-Contract Pattern)

For breaking changes, use **Expand-Contract** pattern:

#### Phase 1: Expand (Add New, Keep Old)

```sql
-- Migration 1: Add new column alongside old one
BEGIN;

ALTER TABLE tasks ADD COLUMN due_date_new DATE;

-- Backfill data from old column
UPDATE tasks
SET due_date_new = due_date::DATE
WHERE due_date_new IS NULL AND due_date IS NOT NULL;

COMMIT;
```

#### Phase 2: Deploy Code Writing to Both

```typescript
// Code writes to BOTH columns during transition
await supabase.from('tasks').update({
  due_date: value,     // Old column (backward compatibility)
  due_date_new: value, // New column
})
```

Deploy this code. Wait for all users to update (1-2 weeks).

#### Phase 3: Contract (Remove Old)

```sql
-- Migration 2: Remove old column (after transition complete)
BEGIN;

ALTER TABLE tasks DROP COLUMN due_date;

-- Optionally rename new column
ALTER TABLE tasks RENAME COLUMN due_date_new TO due_date;

COMMIT;
```

Deploy code that only uses new column.

### Handling Migration Failures

**If migration fails midway:**

```sql
-- Transaction automatically rolls back (if wrapped in BEGIN/COMMIT)
-- Manual rollback if needed:
ROLLBACK;
```

**If migration succeeds but breaks app:**

1. **Immediate:** Roll back application code (see Rollback Procedures)
2. **Database:** Run rollback script
   ```bash
   # Via Supabase SQL Editor
   # Run rollback script
   ```
3. **Verify:** Test that old code works with rolled-back schema
4. **Investigate:** Determine what went wrong
5. **Fix:** Create corrected migration
6. **Re-test:** In staging before re-applying

---

## Rollback Procedures

**When to Rollback:**
- Deployment causes critical bugs
- Application is down or unusable
- Data corruption detected
- Performance severely degraded

**When NOT to Rollback:**
- Minor UI issues (fix forward instead)
- Non-critical bugs (hotfix instead)
- Specific to one user (not systemic)

### Decision Tree

```
Is production down or severely broken?
├─ YES → Rollback immediately
│         ├─ Issue resolved? → Monitor closely, create hotfix
│         └─ Still broken? → Check if database issue
│                           ├─ YES → Database rollback
│                           └─ NO → Investigate further
└─ NO → Is data corrupted?
          ├─ YES → Database rollback + code rollback
          └─ NO → Can users continue working?
                    ├─ YES → Create hotfix (forward fix)
                    └─ NO → Rollback
```

### Immediate Code Rollback (Via Vercel)

**Option A: Via Vercel Dashboard (Fastest)**

1. Go to: https://vercel.com/[team]/task-manager/deployments
2. Find the previous working deployment (before the issue)
3. Hover over deployment, click "..." menu
4. Click "Promote to Production"
5. Confirm promotion
6. **Rollback complete in <30 seconds**

**Verify:**
```bash
# Check production URL
curl -I https://focusonit.ycm360.com

# Expected: HTTP/2 200

# Test in browser
open https://focusonit.ycm360.com
```

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# List recent deployments
vercel ls

# Output shows:
# focusonit    Production   focusonit.ycm360.com   1h ago
# focusonit    Previous     (git hash)             2h ago

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or rollback to previous
vercel rollback
```

**Option C: Via Git Revert**

```bash
# Find commit that broke production
git log --oneline -10

# Revert the breaking commit
git revert [commit-hash]

# Push to main
git push origin main

# Vercel deploys revert (2-3 minutes)
```

### Database Rollback

**Option 1: Restore from Backup (Supabase Pro/Team)**

**Via Supabase Dashboard:**

1. Go to: https://app.supabase.com/project/[project-id]/database/backups
2. Find backup taken before migration (check timestamp)
3. Click "..." → "Restore"
4. Confirm restoration (**WARNING: Overwrites current database**)
5. Wait 5-15 minutes for restoration
6. Verify data restored correctly

**Important considerations:**
- Restores ENTIRE database (not just one table)
- Loses all data created after backup timestamp
- Communicate to users that recent data may be lost
- Use only for catastrophic failures

**Option 2: Run Rollback Script (Preferred for Single Migration)**

```bash
# 1. Open Supabase Dashboard SQL Editor
# 2. Go to: https://app.supabase.com/project/[project-id]/sql/new

# 3. Run rollback script
```

```sql
-- Example: Rollback "add_feature_table" migration

BEGIN;

-- Drop table and all dependent objects
DROP TABLE IF EXISTS feature_table CASCADE;

-- Verify table is gone
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'feature_table';
-- Should return 0 rows

COMMIT;
```

**Verify rollback:**

```sql
-- Check migration was removed
DELETE FROM supabase_migrations
WHERE version = '20251111120000';

-- Verify table doesn't exist
SELECT * FROM feature_table;
-- Should error: relation "feature_table" does not exist
```

### Combined Rollback (Code + Database)

**When:** Migration + code deployment both need reverting

**Process:**

1. **Database first:**
   ```sql
   -- Run database rollback script
   -- Verify schema reverted
   ```

2. **Code second:**
   ```bash
   # Rollback code in Vercel
   # Verify application works with old schema
   ```

3. **Verify end-to-end:**
   ```bash
   # Test critical flows
   # Ensure no errors
   ```

### Rollback Verification Checklist

After any rollback, verify:

- [ ] Application loads: https://focusonit.ycm360.com
- [ ] Users can log in
- [ ] Core functionality works:
  - [ ] Create task
  - [ ] Edit task
  - [ ] Mark task complete
  - [ ] Delete task
  - [ ] Google Calendar sync (if applicable)
- [ ] No errors in Sentry (if configured)
- [ ] No errors in browser console
- [ ] UptimeRobot monitors green (if configured)
- [ ] Database queries responding normally (check Supabase dashboard)
- [ ] Real-time sync working (test with two browser tabs)

### Post-Rollback Actions

**Immediate (0-1 hour):**

- [ ] Notify team of rollback in Slack/email
- [ ] Update status page (if exists)
- [ ] Monitor for 30 minutes to ensure stability
- [ ] Communicate to users (if widespread impact)

**Within 24 hours:**

- [ ] Create post-mortem document
- [ ] Investigate root cause of failure
- [ ] Create plan to fix issue correctly
- [ ] Update deployment procedures if needed
- [ ] Add tests to prevent recurrence

---

## Post-Deployment Verification

**Timeline:**
- **Immediately (0-15 min):** Manual smoke tests
- **Short-term (15 min - 1 hour):** Automated monitoring
- **Medium-term (1-24 hours):** Metrics review

### Immediate Verification (0-15 Minutes)

#### Manual Smoke Tests

**1. Application Accessibility**

```bash
# Check app responds
curl -I https://focusonit.ycm360.com

# Expected: HTTP/2 200
# If 500/502: Deployment failed, investigate logs
```

**2. Authentication Flow**

- [ ] Navigate to login page: https://focusonit.ycm360.com/login
- [ ] Can sign in with email/password
- [ ] Can sign in with Google OAuth ("Sign in with Google" button)
- [ ] After login, redirects to dashboard
- [ ] Can sign out successfully

**3. Core Task Management**

- [ ] Can create task (simple - just title, no date)
- [ ] Can create task with due date
- [ ] Can edit task inline (click title, type, press Enter)
- [ ] Can mark task complete (checkbox)
- [ ] Can delete task (trash icon)
- [ ] Task appears in correct view (TODAY, WEEK, ALL)

**4. Views and Navigation**

- [ ] TODAY view loads: `/today`
- [ ] WEEK view loads: `/week`
- [ ] ALL TASKS view loads: `/all`
- [ ] COMPLETED view loads: `/completed`
- [ ] Navigation between views works
- [ ] Sidebar responsive (mobile/desktop)

**5. Google Calendar Sync (if feature deployed)**

- [ ] Can connect Google Calendar (OAuth flow)
- [ ] Task with date creates calendar event (check Google Calendar)
- [ ] Edit task updates calendar event
- [ ] Delete task removes calendar event
- [ ] Sync status indicator shows "Connected"
- [ ] Can disconnect Google Calendar

**6. Real-time Sync**

- [ ] Open two browser tabs
- [ ] Create task in tab 1
- [ ] Task appears in tab 2 within 2-3 seconds (no refresh needed)
- [ ] Edit task in tab 1
- [ ] Edit appears in tab 2 immediately

**7. UI/UX Checks**

- [ ] Dark mode toggle works (if implemented)
- [ ] Responsive on mobile (test with DevTools Device Toolbar)
  - [ ] iPhone 12 Pro (390x844)
  - [ ] iPad Air (820x1180)
- [ ] No console errors (open DevTools → Console)
- [ ] No 404s in Network tab
- [ ] Loading states display correctly
- [ ] Animations smooth (no janky transitions)

**8. Pomodoro Timer (if feature deployed)**

- [ ] Timer starts when clicked
- [ ] Timer counts down correctly
- [ ] Timer can be paused
- [ ] Timer can be reset
- [ ] Timer completion triggers notification/sound

### Automated Checks (15 Minutes - 1 Hour)

#### Monitoring Dashboards

**Vercel Deployment:**

1. Go to: https://vercel.com/[team]/task-manager
2. Check deployment status: **"Ready"** (green checkmark)
3. Review build logs:
   - No errors
   - Build time reasonable (<5 minutes)
4. Check function logs:
   - No errors in `/api/*` routes
   - Response times normal (<500ms)

**Sentry Error Tracking (if configured):**

1. Go to: https://sentry.io/organizations/[org]/projects/focusonit/
2. Check last 15 minutes:
   - Error count: **<5 errors expected**
   - No new error types
   - No increase in error rate
3. Review any errors:
   - Known vs new issues
   - Impact (how many users affected)
   - Severity (critical vs minor)

**UptimeRobot (if configured):**

1. Go to: https://uptimerobot.com/dashboard
2. Check monitor status:
   - focusonit.ycm360.com: **Green (Up)**
   - Response time: **<500ms**
   - Uptime: **100%**
3. Verify no downtime alerts sent

#### Health Check Endpoint

**If implemented:**

```bash
curl https://focusonit.ycm360.com/api/health
```

**Expected response:**

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

**If health check fails:**
- Investigate which check failed
- Check corresponding service (Supabase, Google Calendar API)
- Review logs for errors

### Medium-Term Verification (1-24 Hours)

#### Review Metrics

**Vercel Analytics:**

1. Go to: Vercel Dashboard → Analytics
2. Check metrics:
   - **Page load time:** Should be normal (no spike)
   - **Time to First Byte (TTFB):** <200ms
   - **First Contentful Paint (FCP):** <1.5s
   - **Largest Contentful Paint (LCP):** <2.5s

**Supabase Dashboard:**

1. Go to: Supabase Dashboard → Database → Query Performance
2. Check metrics:
   - **p50 query time:** <100ms
   - **p95 query time:** <200ms
   - **p99 query time:** <500ms
   - **Slow queries:** <5 queries >1s
3. Review connection pool:
   - **Connections:** <80% of max
   - **No connection errors**

**Error Rate:**

- **Sentry:** Error rate <0.1%
- **Success rate:** >99.9%

**Google Calendar Sync:**

1. Check sync success rate (if metrics available)
2. Expected: >95% success rate
3. Review failed syncs:
   - Transient errors vs systemic issues
   - Retry mechanisms working

#### User Feedback

- [ ] Check support email for user-reported issues
- [ ] Review in-app feedback (if implemented)
- [ ] Monitor social media mentions (if applicable)
- [ ] Check internal team chat for reports

### What to Do If Issues Found

**Minor issues (UI glitch, cosmetic bug):**
- Create GitHub issue
- Schedule fix in next sprint
- Monitor if complaints increase

**Medium issues (feature broken for some users):**
- Create hotfix branch
- Fix and deploy within 24 hours
- Notify affected users

**Critical issues (feature broken for all users, data loss):**
- Immediately rollback deployment
- Create incident report
- Hotfix and redeploy ASAP

---

## Troubleshooting

### Common Deployment Issues

#### Issue 1: Build Failed (Vercel)

**Symptoms:**
- Vercel deployment stuck at "Building"
- Build logs show error messages
- Deployment never reaches "Ready" state

**Diagnosis:**

```bash
# Reproduce locally
npm run build

# Check for errors in output
```

**Common Causes & Fixes:**

**A. TypeScript Error:**

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Output shows errors like:
# error TS2339: Property 'foo' does not exist on type 'Bar'
```

**Fix:**
```bash
# Fix TypeScript errors in code
# Add missing types
# Remove invalid property accesses

# Commit fix
git add .
git commit -m "fix: resolve TypeScript compilation errors"
git push

# Vercel re-builds automatically
```

**B. Missing Environment Variable:**

**Symptoms in build logs:**
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**Fix:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add missing variable
3. Set value
4. Check "Production" environment
5. Click "Save"
6. Go to Deployments tab
7. Click "..." on failed deployment → "Redeploy"

**C. Dependency Issue:**

**Symptoms:**
```
npm ERR! Could not resolve dependency
npm ERR! peer react@"^17.0.0" from some-package@1.0.0
```

**Fix:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Commit updated package-lock.json
git add package-lock.json
git commit -m "fix: update dependencies to resolve peer dependency conflicts"
git push
```

**D. Build Timeout:**

**Symptoms:**
```
Error: Build exceeded maximum duration (45 minutes)
```

**Fix:**
- Check for infinite loops in build scripts
- Optimize build process
- Upgrade Vercel plan (if consistently timing out)

---

#### Issue 2: Application Running but Features Broken

**Symptoms:**
- Application loads but specific features don't work
- Errors in browser console
- Sentry showing errors

**Diagnosis:**

```bash
# Check browser console (F12 → Console)
# Look for errors

# Check Vercel function logs
# Go to: Vercel Dashboard → Deployments → Functions

# Check Sentry dashboard
# Review error details
```

**Common Causes & Fixes:**

**A. Google Calendar Sync Not Working:**

**Symptoms:**
```
Error: Invalid client credentials
Calendar events not creating
```

**Diagnosis:**
```bash
# Check environment variables in Vercel
# Settings → Environment Variables

# Verify:
# - GOOGLE_CLIENT_ID is set
# - GOOGLE_CLIENT_SECRET is set
# - Values match Google Cloud Console
```

**Fix:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click OAuth 2.0 Client ID
3. Check "Authorized redirect URIs" includes:
   ```
   https://focusonit.ycm360.com/api/calendar/oauth/callback
   ```
4. If not, add it and save
5. If credentials wrong, update in Vercel
6. Redeploy

**B. Real-time Sync Not Working:**

**Symptoms:**
```
Changes in one tab don't appear in another
No real-time updates
```

**Diagnosis:**
```bash
# Check browser Network tab → WS (WebSocket)
# Look for WebSocket connection to Supabase

# Expected: wss://xxx.supabase.co/realtime/v1/...
# Status: 101 Switching Protocols (connected)

# If no WebSocket or error: Issue with Realtime
```

**Fix:**

1. Check Supabase Dashboard → Database → Replication
2. Ensure Real-time is enabled for `tasks` table
3. Verify publication includes table:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   -- Should include 'tasks' table
   ```
4. If not enabled:
   ```sql
   -- Enable Realtime for tasks table
   ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
   ```
5. Test WebSocket connection again

**C. Database Connection Errors:**

**Symptoms:**
```
Error: Connection to database failed
504 Gateway Timeout
```

**Diagnosis:**
```bash
# Check Supabase Dashboard → Settings → Database
# Connection pooling status

# Check logs in Supabase Dashboard
```

**Fix:**

**If connection pool exhausted:**
- Upgrade Supabase tier (free tier: 60 connections)
- Optimize queries (reduce connection time)
- Implement connection pooling in app

**If RLS blocking queries:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Verify policy allows user access
-- Test as specific user:
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = '<user-uuid>';
SELECT * FROM tasks;
```

---

#### Issue 3: Slow Response Times

**Symptoms:**
- Application feels sluggish
- Vercel Analytics shows high p95 latency (>2s)
- Users complaining about slow performance

**Diagnosis:**

```sql
-- Check slow queries in Supabase
-- Dashboard → Database → Query Performance

-- Look for queries taking >500ms
-- Example slow query:
-- SELECT * FROM tasks WHERE user_id = 'xxx' (800ms)
```

**Common Causes & Fixes:**

**A. Missing Database Index:**

**Diagnosis:**
```sql
-- Check existing indexes on tasks table
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'tasks';

-- If no index on (user_id, due_date), queries will be slow
```

**Fix:**
```sql
-- Add index for common query patterns
CREATE INDEX CONCURRENTLY idx_tasks_user_due_date
  ON tasks(user_id, due_date);

-- Verify index created
SELECT * FROM pg_indexes WHERE tablename = 'tasks';
```

**IMPORTANT:** Use `CONCURRENTLY` to avoid locking table during index creation.

**B. Too Many Real-time Connections:**

**Diagnosis:**
- Many users connected simultaneously
- Supabase Real-time limit reached (free tier: 200 connections)

**Fix:**
- Upgrade Supabase tier
- Implement connection pooling
- Optimize Real-time subscriptions (unsubscribe when not needed)

**C. Serverless Cold Starts (Vercel):**

**Symptoms:**
- First request after inactivity is slow (>2s)
- Subsequent requests fast (<200ms)

**Fix:**
- Upgrade to Vercel Pro (reduces cold starts)
- Optimize function code:
  ```typescript
  // Minimize dependencies in API routes
  // Move heavy imports to lazy loading
  import type { NextRequest } from 'next/server'

  export async function GET(request: NextRequest) {
    // Import only when needed
    const { someHeavyFunction } = await import('@/lib/heavy')
    return someHeavyFunction()
  }
  ```
- Consider Edge Functions for critical paths

---

#### Issue 4: Database Migration Failed

**Symptoms:**
- Migration workflow fails in GitHub Actions (if automated)
- Supabase shows migration error
- App breaks after attempted migration

**Diagnosis:**

```sql
-- Check which migrations have been applied
SELECT * FROM supabase_migrations ORDER BY version DESC;

-- Check for SQL syntax errors
-- Review migration file for issues
```

**Common Causes & Fixes:**

**A. Syntax Error in Migration:**

**Symptoms:**
```
ERROR:  syntax error at or near "..."
```

**Fix:**
```sql
-- Review migration file for SQL syntax issues
-- Common errors:
-- - Missing semicolons
-- - Incorrect table/column names
-- - Invalid SQL keywords

-- Test migration in staging first
-- Fix syntax errors
-- Re-run migration
```

**B. Migration Already Applied:**

**Symptoms:**
```
ERROR: relation "feature_table" already exists
```

**Fix:**
```sql
-- Check if migration already applied
SELECT * FROM supabase_migrations
WHERE version = '20251111120000';

-- If applied, skip this migration
-- Or manually mark as applied:
INSERT INTO supabase_migrations (version, name)
VALUES ('20251111120000', 'add_feature_table');
```

**C. Permission Issue:**

**Symptoms:**
```
ERROR: permission denied for table tasks
```

**Fix:**
```sql
-- Grant necessary permissions
-- Should not occur with Supabase (service role has full access)

-- If self-hosting, grant permissions:
GRANT ALL ON TABLE tasks TO authenticated;
GRANT ALL ON TABLE tasks TO service_role;
```

---

### Emergency Procedures

#### Application Completely Down (500/502 Errors)

**Immediate Actions:**

1. **Check Vercel status:**
   - Go to: https://www.vercel-status.com/
   - If Vercel down: Wait for resolution

2. **Check Supabase status:**
   - Go to: https://status.supabase.com/
   - If Supabase down: Wait for resolution

3. **If services are up, rollback deployment:**
   ```bash
   # Rollback via Vercel Dashboard
   # Deployments → Find previous working → Promote
   ```

4. **Monitor recovery:**
   ```bash
   # Check app responds
   curl -I https://focusonit.ycm360.com

   # Should return 200
   ```

5. **Notify stakeholders:**
   - Post in incident channel
   - Update status page
   - Email affected users (if prolonged)

#### Data Loss or Corruption

**Immediate Actions:**

1. **Stop writes to database:**
   ```sql
   -- Revoke INSERT/UPDATE/DELETE temporarily
   -- (Only if absolutely necessary - disrupts service)
   ```

2. **Assess extent of data loss:**
   ```sql
   -- Check recent changes
   SELECT * FROM tasks
   WHERE updated_at > NOW() - INTERVAL '1 hour'
   ORDER BY updated_at DESC;
   ```

3. **Restore from backup (last resort):**
   - See [Database Rollback](#database-rollback)
   - **WARNING:** Loses all data after backup timestamp

4. **Communicate to users:**
   - Explain what happened
   - What data was affected
   - What's being done
   - Expected resolution time

---

## Emergency Contacts

### Critical Issues (Production Down)

**Escalation Path:**

1. **DevOps Lead:** [Name] - [Email] - [Phone]
   - **Response Time:** 15 minutes
   - **Availability:** 24/7 on-call rotation

2. **Tech Lead:** [Name] - [Email] - [Phone]
   - **Response Time:** 30 minutes
   - **Availability:** Monday-Friday 9am-6pm, on-call weekends

3. **CTO:** [Name] - [Email] - [Phone]
   - **Response Time:** 1 hour
   - **Availability:** Escalation only for critical incidents

### Support Channels

- **Slack:** #focusonit-incidents (for production issues)
- **Email:** tech@ycm360.com
- **Phone:** Emergency hotline (if configured)

### External Vendor Support

- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **Google Cloud Support:** https://cloud.google.com/support

---

## Appendix

### Useful Commands

```bash
# Build locally
npm run build

# Run production build locally
npm start

# Check for type errors
npx tsc --noEmit

# Check for linting errors
npm run lint

# Check for security vulnerabilities
npm audit

# Fix auto-fixable vulnerabilities
npm audit fix

# Update dependencies (carefully)
npm update

# Check outdated dependencies
npm outdated

# Clean install (removes node_modules)
rm -rf node_modules package-lock.json && npm install

# Verify Supabase setup
npm run verify
```

### Useful Links

- **Production App:** https://focusonit.ycm360.com
- **Vercel Dashboard:** https://vercel.com/[team]/task-manager
- **Supabase Dashboard:** https://app.supabase.com/project/[project-id]
- **Sentry Dashboard:** https://sentry.io/organizations/[org]/projects/focusonit/
- **GitHub Repository:** https://github.com/[org]/task-manager
- **Documentation:** C:\Users\yoshi\Downloads\FocusOnIt\task-manager\docs\

### Related Documentation

- [Rollback Procedures](./ROLLBACK.md)
- [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)
- [Common Issues Runbook](../runbooks/COMMON_ISSUES.md)
- [Post-Deployment Checklist](../POST_DEPLOYMENT_CHECKLIST.md)
- [Google Calendar Setup](../integrations/google-calendar/SETUP.md)

---

**Document Version:** 1.0
**Last Updated:** November 11, 2025
**Maintained By:** DevOps Team & Documentation Specialist
**Next Review:** February 11, 2026 (quarterly)

---

**Feedback:** If you find errors or areas for improvement in this documentation, please:
1. Create an issue in GitHub
2. Submit a PR with suggested changes
3. Contact the DevOps team in Slack (#focusonit-dev)

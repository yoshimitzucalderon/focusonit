# Environment Variables Reference

**Last Updated:** November 11, 2025
**Target Audience:** DevOps, Backend Developers, Tech Lead

---

## Table of Contents

1. [Overview](#overview)
2. [Required Variables](#required-variables)
3. [Optional Variables](#optional-variables)
4. [Environment-Specific Configuration](#environment-specific-configuration)
5. [How to Set Variables](#how-to-set-variables)
6. [Where to Find Values](#where-to-find-values)
7. [Security Best Practices](#security-best-practices)
8. [Secret Rotation](#secret-rotation)
9. [Troubleshooting](#troubleshooting)

---

## Overview

FocusOnIt Task Manager requires specific environment variables to connect to external services (Supabase, Google APIs, n8n) and configure the application properly.

### Variable Naming Convention

```
NEXT_PUBLIC_*  - Client-side accessible (exposed to browser)
*_SECRET       - Server-side only (encrypted, never exposed)
*_KEY          - API keys (encrypted)
*_URL          - Service endpoints
```

### Environments

Variables must be configured for each environment:

| Environment | Purpose | Vercel Setting |
|-------------|---------|----------------|
| **Production** | Live application at focusonit.ycm360.com | Check "Production" |
| **Preview** | Pull request deployments | Check "Preview" |
| **Development** | Local development (`.env.local`) | Check "Development" or local only |

---

## Required Variables

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`

**Purpose:** Supabase project URL for database and auth connections

**Type:** Public (client + server)

**Format:** `https://[project-id].supabase.co`

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xyzabcd1234.supabase.co
```

**Where to Find:**
1. Go to: https://app.supabase.com/project/[project-id]
2. Navigate to: Settings → API
3. Copy "Project URL"

**Required In:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Validation:**
```bash
# Test connection
curl https://xyzabcd1234.supabase.co/rest/v1/
# Should return: {"message":"Supabase REST API"}
```

---

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Purpose:** Public API key for client-side Supabase operations (respects RLS)

**Type:** Public (client + server)

**Format:** JWT token starting with `eyJ...`

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2QxMjM0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjYyNzQwMDAsImV4cCI6MTk0MTg1MDAwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Where to Find:**
1. Go to: https://app.supabase.com/project/[project-id]
2. Navigate to: Settings → API
3. Copy "Project API keys" → `anon` `public`

**Required In:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Security Notes:**
- Safe to expose publicly (respects Row Level Security)
- Cannot bypass RLS policies
- Used for client-side database queries
- Rotates automatically (managed by Supabase)

---

#### `SUPABASE_SERVICE_ROLE_KEY`

**Purpose:** Service role key for server-side operations (bypasses RLS)

**Type:** **SECRET** (server-side only, NEVER expose to client)

**Format:** JWT token starting with `eyJ...`

**Example:**
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2QxMjM0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYyNjI3NDAwMCwiZXhwIjoxOTQxODUwMDAwfQ.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

**Where to Find:**
1. Go to: https://app.supabase.com/project/[project-id]
2. Navigate to: Settings → API
3. Copy "Project API keys" → `service_role` `secret`
4. **Click "Reveal" to see full key**

**Required In:**
- ✅ Production
- ✅ Preview
- ⚠️ Development (optional, use anon key for most local dev)

**Security Notes:**
- **CRITICAL:** Never commit to git, never expose to client
- **Bypasses all RLS policies** - full database access
- Only use in API routes (`app/api/*`)
- Mark as "Encrypted" in Vercel
- Used for:
  - Webhook handlers (external services creating tasks)
  - Admin operations (bulk updates)
  - Server-side sync operations

**Usage Example:**
```typescript
// ❌ WRONG - Never use in client components
'use client'
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)

// ✅ CORRECT - Only in API routes or Server Components
// app/api/webhook/route.ts
export async function POST(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only
  )
  // ... webhook logic
}
```

---

### Application Configuration

#### `NEXT_PUBLIC_APP_URL`

**Purpose:** Public URL of the application (used for redirects, OAuth callbacks)

**Type:** Public (client + server)

**Format:** `https://[domain]` (no trailing slash)

**Examples:**
```bash
# Production
NEXT_PUBLIC_APP_URL=https://focusonit.ycm360.com

# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Required In:**
- ✅ Production
- ✅ Preview (use Vercel preview URL or generic)
- ✅ Development

**Used For:**
- Google OAuth redirect URI
- Email confirmation links
- Password reset links
- Deep linking
- Social media sharing

**Important:**
- Must match domain exactly (http vs https, www vs non-www)
- No trailing slash
- Update when changing domain

---

## Optional Variables

### Google Calendar Integration

#### `GOOGLE_CLIENT_ID`

**Purpose:** Google OAuth 2.0 client ID for Calendar API access

**Type:** Public (client + server)

**Format:** `[project-id]-[random].apps.googleusercontent.com`

**Example:**
```bash
GOOGLE_CLIENT_ID=123456789012-abcdef1234567890.apps.googleusercontent.com
```

**Where to Find:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project
3. Click OAuth 2.0 Client IDs → Your client name
4. Copy "Client ID"

**Required For:**
- Google Calendar sync feature
- Google Sign-In (if enabled)

**Required In:**
- ✅ Production (if Calendar sync enabled)
- ⚠️ Preview (optional, use separate client ID)
- ⚠️ Development (recommended, use separate client ID)

---

#### `GOOGLE_CLIENT_SECRET`

**Purpose:** Google OAuth 2.0 client secret for token exchange

**Type:** **SECRET** (server-side only)

**Format:** `GOCSPX-[random string]`

**Example:**
```bash
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEf123456_XyZ789
```

**Where to Find:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click OAuth 2.0 Client IDs → Your client name
3. Copy "Client Secret" (or reset if forgotten)

**Required For:**
- Google Calendar sync (token exchange)

**Required In:**
- ✅ Production (if Calendar sync enabled)
- ⚠️ Development (use separate client ID/secret for dev)

**Security Notes:**
- **SECRET** - Mark as "Encrypted" in Vercel
- Never commit to git
- Different secret for each environment
- Can regenerate in Google Console (breaks existing OAuth connections)

---

### Voice-to-Task Integration (n8n)

#### `N8N_WEBHOOK_URL`

**Purpose:** n8n webhook endpoint for voice-to-task workflow

**Type:** Public (server-side, but not secret)

**Format:** `https://[n8n-domain]/webhook/[workflow-path]`

**Example:**
```bash
N8N_WEBHOOK_URL=https://n8n.ycm360.com/webhook/voice-to-task
```

**Where to Find:**
1. Open n8n workflow editor
2. Find Webhook node
3. Copy "Production URL"

**Required For:**
- Voice-to-task feature (n8n integration)
- Telegram bot → task creation

**Required In:**
- ⚠️ Production (if voice feature enabled)
- ⚠️ Development (optional, use test webhook)

---

#### `N8N_WEBHOOK_SECRET`

**Purpose:** Shared secret to verify webhook requests from n8n

**Type:** **SECRET** (server-side only)

**Format:** UUID v4 recommended

**Example:**
```bash
N8N_WEBHOOK_SECRET=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**How to Generate:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomUUID())"

# Using OpenSSL
openssl rand -hex 32

# Using uuidgen (Linux/Mac)
uuidgen
```

**Where to Configure:**
1. **Generate secret** (use command above)
2. **Set in Vercel:** Environment variable for Next.js app
3. **Set in n8n:** Store same secret in n8n credentials/environment

**Required For:**
- Webhook security (verify requests from n8n)

**Required In:**
- ⚠️ Production (if voice feature enabled)
- ⚠️ Development (optional)

**Security Notes:**
- **SECRET** - Mark as "Encrypted" in Vercel
- Must match secret configured in n8n
- Rotate periodically (update both sides)

**Usage Example:**
```typescript
// app/api/webhook/voice-to-task/route.ts
export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret')

  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Process webhook...
}
```

---

### Monitoring & Analytics

#### `NEXT_PUBLIC_SENTRY_DSN`

**Purpose:** Sentry Data Source Name for error tracking

**Type:** Public (client + server)

**Format:** `https://[key]@[org].ingest.sentry.io/[project-id]`

**Example:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/7890123
```

**Where to Find:**
1. Go to: https://sentry.io/settings/[org]/projects/[project]/keys/
2. Copy "Client Keys (DSN)" → "DSN"

**Required For:**
- Error tracking and monitoring
- Performance monitoring
- User feedback

**Required In:**
- ✅ Production (highly recommended)
- ⚠️ Preview (optional, separate project recommended)
- ⚠️ Development (optional, use separate project or disable)

**Notes:**
- Safe to expose publicly (Sentry handles security)
- Different DSN for each environment (separate Sentry projects)
- Can disable in development: Leave empty or omit variable

---

## Environment-Specific Configuration

### Production

**Required Variables:**
```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (production anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (production service role) # ENCRYPTED

# Application (Required)
NEXT_PUBLIC_APP_URL=https://focusonit.ycm360.com

# Google Calendar (Optional - if feature enabled)
GOOGLE_CLIENT_ID=123456789012-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx # ENCRYPTED

# n8n (Optional - if voice feature enabled)
N8N_WEBHOOK_URL=https://n8n.ycm360.com/webhook/voice-to-task
N8N_WEBHOOK_SECRET=uuid-v4-secret # ENCRYPTED

# Monitoring (Recommended)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

**Vercel Configuration:**
- Check "Production" for all variables
- Mark secrets as "Encrypted": `*_SECRET`, `*_KEY` (except NEXT_PUBLIC ones)
- Use production Supabase project
- Use production Google OAuth credentials

---

### Preview (Pull Request Deployments)

**Options:**

**Option A: Share Production Variables (Not Recommended)**
- Uses production Supabase (risky - can affect real data)
- Uses production Google OAuth (callback issues)

**Option B: Use Staging Environment (Recommended)**
```bash
# Supabase - Staging project
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (staging anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (staging service role) # ENCRYPTED

# Application - Vercel preview URL
NEXT_PUBLIC_APP_URL=https://task-manager-git-branch-team.vercel.app

# Google - Separate OAuth client for preview
GOOGLE_CLIENT_ID=123456789012-preview.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-preview-secret # ENCRYPTED

# n8n - Optional, use test webhook
N8N_WEBHOOK_URL=https://n8n-staging.ycm360.com/webhook/voice-to-task-test
N8N_WEBHOOK_SECRET=test-uuid-secret # ENCRYPTED

# Monitoring - Separate Sentry project
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/staging-project
```

**Vercel Configuration:**
- Check "Preview" for all variables
- Separate staging Supabase project (safe testing)
- OAuth redirect URIs must include Vercel preview pattern:
  ```
  https://*.vercel.app/api/auth/callback
  ```

---

### Development (Local)

**File:** `.env.local` (gitignored, not committed)

```bash
# Supabase - Development or shared staging
NEXT_PUBLIC_SUPABASE_URL=https://dev-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (dev anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (dev service role - optional for most development)

# Application - Local
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google - Development OAuth client
GOOGLE_CLIENT_ID=123456789012-dev.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-dev-secret

# n8n - Optional, use test webhook or mock
N8N_WEBHOOK_URL=http://localhost:5678/webhook/voice-to-task-test
N8N_WEBHOOK_SECRET=test-secret-123

# Monitoring - Optional, disable or use dev Sentry
# NEXT_PUBLIC_SENTRY_DSN= (leave empty to disable)
```

**Setup:**
```bash
# Copy example file
cp .env.example .env.local

# Edit with your values
nano .env.local

# Verify setup
npm run verify
```

**Notes:**
- Use separate Supabase project for development (avoid affecting production)
- Google OAuth redirect URI: `http://localhost:3000/api/auth/callback`
- Can disable Sentry in development (faster, less noise)

---

## How to Set Variables

### Local Development (`.env.local`)

```bash
# Create file (if doesn't exist)
touch .env.local

# Add variables (use = without spaces)
echo "NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co" >> .env.local

# Or edit manually
nano .env.local
```

**Important:**
- Never commit `.env.local` to git (gitignored by default)
- Restart dev server after changing: `npm run dev`

---

### Vercel (Production/Preview)

**Method 1: Via Dashboard (Recommended)**

1. Go to: https://vercel.com/[team]/task-manager
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. Click "Add New" button
5. Fill in:
   - **Name:** Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value:** Variable value (paste, no quotes)
   - **Environments:** Check Production, Preview, or Development
   - **Encrypted:** Check for secrets (e.g., `*_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`)
6. Click "Save"
7. Redeploy for changes to take effect

**Method 2: Via CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# Add variable (interactive)
vercel env add VARIABLE_NAME

# You'll be prompted:
# ? What's the value of VARIABLE_NAME? [input]
# ? Add VARIABLE_NAME to which Environments? (select with space)
#   ◯ Production
#   ◯ Preview
#   ◯ Development

# Pull environment variables (verification)
vercel env pull .env.vercel
```

**Method 3: Bulk Import (from `.env` file)**

```bash
# Create file with all variables
cat > .env.production <<EOF
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# ... more variables
EOF

# Import to Vercel (requires vercel CLI)
vercel env pull # Pull existing first (backup)
vercel env push .env.production production

# Clean up (don't commit this file)
rm .env.production
```

---

## Where to Find Values

### Quick Reference Table

| Variable | Service | Location in Dashboard |
|----------|---------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Settings → API → `service_role` `secret` (click Reveal) |
| `GOOGLE_CLIENT_ID` | Google Cloud | APIs & Services → Credentials → OAuth 2.0 Client IDs |
| `GOOGLE_CLIENT_SECRET` | Google Cloud | Same location → Click client → View secret |
| `N8N_WEBHOOK_URL` | n8n | Workflow editor → Webhook node → Production URL |
| `N8N_WEBHOOK_SECRET` | Generated | `node -e "console.log(require('crypto').randomUUID())"` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | Settings → Projects → [project] → Client Keys (DSN) |

---

## Security Best Practices

### DO:

- ✅ **Mark secrets as "Encrypted" in Vercel**
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GOOGLE_CLIENT_SECRET`
  - `N8N_WEBHOOK_SECRET`

- ✅ **Never commit secrets to git**
  - Add `.env.local` to `.gitignore`
  - Use `.env.example` with placeholder values
  - Rotate immediately if accidentally committed

- ✅ **Use different values per environment**
  - Separate Supabase projects (prod, staging, dev)
  - Separate Google OAuth clients (prod, dev)
  - Separate Sentry projects (prod, staging)

- ✅ **Verify `.env.local` is gitignored**
  ```bash
  # Check if file would be committed
  git status --ignored

  # Should show:
  # Ignored files:
  #   .env.local
  ```

- ✅ **Store production secrets securely**
  - Use password manager (1Password, LastPass)
  - Document location in team wiki
  - Limit access (only DevOps, Tech Lead)

- ✅ **Rotate secrets periodically**
  - Quarterly rotation (every 3 months)
  - Immediately if compromised
  - Follow rotation procedure below

### DON'T:

- ❌ **Never use production secrets in development**
  - Use separate dev Supabase project
  - Accidentally breaking production schema
  - Testing webhooks affecting real users

- ❌ **Never expose secrets in client code**
  ```typescript
  // ❌ WRONG - Service role key in client component
  'use client'
  const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)

  // ✅ CORRECT - Only in API routes
  // app/api/webhook/route.ts
  export async function POST(request: Request) {
    const supabase = createServerClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }
  ```

- ❌ **Never hardcode secrets**
  ```typescript
  // ❌ WRONG
  const apiKey = 'sk_live_abc123...'

  // ✅ CORRECT
  const apiKey = process.env.SECRET_API_KEY
  ```

- ❌ **Never log secrets**
  ```typescript
  // ❌ WRONG
  console.log('API Key:', process.env.SECRET_KEY)

  // ✅ CORRECT
  console.log('API Key configured:', !!process.env.SECRET_KEY)
  ```

- ❌ **Never share secrets via insecure channels**
  - No Slack/Email for production secrets
  - Use encrypted sharing (1Password Shared Vault)
  - In-person transfer if necessary

---

## Secret Rotation

### When to Rotate

- **Scheduled:** Every 3 months (quarterly)
- **Compromised:** Immediately if exposed (git commit, log leak, etc.)
- **Team member leaves:** Within 24 hours
- **Security audit recommendation:** As advised

### Rotation Procedure

#### 1. Supabase Service Role Key

**Cannot be rotated** - Managed by Supabase, permanent per project

**If compromised:**
- Migrate to new Supabase project
- Update all environment variables
- Migrate data (if necessary)

**Prevention:** Store securely, mark as encrypted in Vercel

---

#### 2. Google Client Secret

**Steps:**

1. **Generate new secret (Google Cloud Console):**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click OAuth 2.0 Client ID
   - Click "Reset Secret" or "Add Secret"
   - Copy new secret

2. **Update in Vercel (minimal downtime):**
   - Add new secret as `GOOGLE_CLIENT_SECRET_NEW` (temporary)
   - Update code to try both secrets:
     ```typescript
     const secret = process.env.GOOGLE_CLIENT_SECRET_NEW || process.env.GOOGLE_CLIENT_SECRET
     ```
   - Deploy
   - After deployment, update `GOOGLE_CLIENT_SECRET` with new value
   - Remove `GOOGLE_CLIENT_SECRET_NEW`
   - Deploy again

3. **Impact:**
   - Users will need to reconnect Google Calendar (OAuth tokens invalidated)
   - Notify users of re-connection requirement

**Downtime:** <5 minutes (if using temporary dual-secret approach)

---

#### 3. n8n Webhook Secret

**Steps:**

1. **Generate new secret:**
   ```bash
   node -e "console.log(require('crypto').randomUUID())"
   # Output: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

2. **Update in n8n:**
   - Edit n8n workflow
   - Update webhook secret in credentials
   - Save and activate workflow

3. **Update in Vercel:**
   - Update `N8N_WEBHOOK_SECRET` environment variable
   - Redeploy

4. **Verify:**
   - Test webhook with voice-to-task
   - Check logs for successful authentication

**Downtime:** <1 minute (brief webhook unavailability)

---

#### 4. Rotation Checklist

- [ ] Generate new secret/credential
- [ ] Update in source service (Google, n8n, etc.)
- [ ] Update in Vercel environment variables
- [ ] Mark as "Encrypted" if applicable
- [ ] Redeploy application
- [ ] Verify functionality works
- [ ] Update password manager / documentation
- [ ] Revoke old secret (if possible)
- [ ] Notify team of rotation
- [ ] Monitor for 24 hours

---

## Troubleshooting

### Issue: "Environment variable is not defined"

**Symptoms:**
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**Diagnosis:**
```bash
# Check if variable exists in Vercel
# Dashboard → Settings → Environment Variables

# Check local .env.local
cat .env.local | grep NEXT_PUBLIC_SUPABASE_URL
```

**Fix:**
1. Add missing variable in Vercel dashboard
2. Ensure correct environment selected (Production/Preview/Development)
3. Redeploy application
4. For local: Add to `.env.local` and restart dev server

---

### Issue: "Supabase connection failed"

**Symptoms:**
```
Error: Failed to connect to Supabase
```

**Diagnosis:**
```bash
# Test Supabase URL
curl https://[your-project].supabase.co/rest/v1/

# Expected: {"message":"Supabase REST API"}
```

**Fix:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct (no typos)
- Check Supabase project is active (not paused)
- Verify anon key is valid (not expired)

---

### Issue: "Google OAuth redirect_uri mismatch"

**Symptoms:**
```
Error: redirect_uri_mismatch
The redirect URI in the request did not match a registered redirect URI
```

**Diagnosis:**
- Check `NEXT_PUBLIC_APP_URL` matches actual URL
- Check Google OAuth settings

**Fix:**
1. Go to Google Cloud Console → Credentials
2. Click OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   ```
   https://focusonit.ycm360.com/api/calendar/oauth/callback
   http://localhost:3000/api/calendar/oauth/callback (for dev)
   ```
4. Save
5. Wait 5 minutes for changes to propagate
6. Try OAuth flow again

---

### Issue: "n8n webhook returns 401 Unauthorized"

**Symptoms:**
```
Webhook request failed: 401 Unauthorized
```

**Diagnosis:**
- Check `N8N_WEBHOOK_SECRET` matches in both n8n and Vercel

**Fix:**
1. Generate new webhook secret
2. Update in n8n workflow
3. Update in Vercel environment variables
4. Redeploy
5. Test webhook

---

### Issue: "Changes to env vars not taking effect"

**Symptoms:**
- Updated env var in Vercel
- Application still uses old value

**Diagnosis:**
- Vercel caches environment variables per deployment

**Fix:**
1. After updating env var in Vercel
2. Go to Deployments tab
3. Click "Redeploy" on latest deployment (or trigger new deployment)
4. Wait for deployment to complete
5. Verify new value is used

---

**Document Version:** 1.0
**Last Updated:** November 11, 2025
**Maintained By:** DevOps Team & Documentation Specialist

---

**Related Documentation:**
- [Deployment Guide](./DEPLOYMENT.md)
- [Rollback Procedures](./ROLLBACK.md)
- [Google Calendar Setup](../integrations/google-calendar/SETUP.md)

# 🚨 QUICK FIX - Vercel Production Down

**Time to fix:** 10 minutes | **Status:** Code ready, needs Vercel config

---

## THE PROBLEM
Production app shows 500 error on all routes. Middleware can't access environment variables because they're encrypted and Edge Runtime can't decrypt them.

---

## THE FIX (Do This Now)

### 1. Open Vercel Dashboard
Go to: **vercel.com** → **FocusOnIt project** → **Settings** → **Environment Variables**

### 2. Fix Two Variables

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
1. Find it in the list
2. Click ⋮ → Delete
3. Click "Add New"
4. Configure:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://api.ycm360.com`
   - Type: **Plaintext** ⚠️ (NOT "Sensitive")
   - Environments: ✓ All
5. Save

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
1. Find it in the list
2. Click ⋮ → Delete
3. Click "Add New"
4. Configure:
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MTEwOTUyMiwiZXhwIjo0MTAyNDQ0ODAwLCJyb2xlIjoiYW5vbiJ9.DFf0UW8hSCRCO6tv_ArtGj8V26VSig_qZDBurzJ95zc`
   - Type: **Plaintext** ⚠️ (NOT "Sensitive")
   - Environments: ✓ All
5. Save

### 3. Redeploy
1. Go to **Deployments** tab
2. Latest deployment → ⋮ → **Redeploy**
3. Keep "Use existing Build Cache" checked
4. Click **Redeploy**
5. Wait 1-2 minutes

### 4. Verify
Visit: **https://focusonit.ycm360.com**
- Should load (no 500 error)
- Login should work
- Dashboard should load

---

## WHY THIS IS SAFE
- These variables are already public (exposed to browser)
- They're meant to be public (NEXT_PUBLIC_ prefix)
- The anon key has Row Level Security protection
- Service role key stays encrypted (that's the powerful one)

---

## DETAILED DOCS
- **Step-by-step:** [VERCEL_FIX_INSTRUCTIONS.md](./VERCEL_FIX_INSTRUCTIONS.md)
- **Complete guide:** [docs/deployment/VERCEL_ENV_VARS.md](./docs/deployment/VERCEL_ENV_VARS.md)
- **Summary:** [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

---

## TROUBLESHOOTING

**Still 500 errors?**
- Did you redeploy after changing variables?
- Are variables set to **Plaintext** (no lock icon)?
- Variable names exact match (case-sensitive)?

**Check logs:**
Vercel Dashboard → Deployments → Latest → View Function Logs

---

**Priority:** 🔴 CRITICAL
**Time:** ⏱️ 10 minutes
**Code:** ✅ Ready (commit bb8d3b7)
**Vercel:** ⏳ Needs configuration

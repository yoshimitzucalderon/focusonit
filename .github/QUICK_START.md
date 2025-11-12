# CI/CD Quick Start Guide

Guia rapida para implementar el pipeline CI/CD en 30 minutos.

## Prerequisites

- [ ] Proyecto Next.js funcionando localmente
- [ ] Repositorio GitHub creado
- [ ] Proyecto Vercel deployado
- [ ] Acceso admin al repositorio

---

## Fase 1: Workflows (10 minutos)

### Paso 1: Commit Workflows

**Todos los workflows ya estan creados en `.github/workflows/`**

```bash
# Verifica que existan
ls .github/workflows/

# Deberias ver:
# pr-validation.yml
# code-quality.yml
# deployment-notification.yml
# migrate-production.yml
# test.yml.disabled
# dependabot.yml
```

```bash
# Commit workflows a tu repositorio
git add .github/
git commit -m "ci: add GitHub Actions workflows for CI/CD pipeline"
git push origin main
```

**Resultado:** Workflows subidos a GitHub ✅

---

## Fase 2: GitHub Secrets (5 minutos)

### Paso 2: Configurar Secrets Minimos

**Ve a:** `https://github.com/<username>/task-manager/settings/secrets/actions`

**Agrega estos 4 secrets (MINIMO):**

1. **STAGING_SUPABASE_URL**
   - Value: Tu Supabase URL (https://xxxxx.supabase.co)

2. **STAGING_SUPABASE_ANON_KEY**
   - Value: Tu Supabase anon key (eyJhbGc...)

3. **STAGING_GOOGLE_CLIENT_ID**
   - Value: Tu Google OAuth Client ID

4. **STAGING_GOOGLE_CLIENT_SECRET**
   - Value: Tu Google OAuth Client Secret

**Tip:** Puedes usar los mismos valores de produccion para staging.

**Resultado:** CI puede correr builds ✅

---

## Fase 3: Branch Protection (5 minutos)

### Paso 3: Configurar Reglas de Proteccion

**Ve a:** `https://github.com/<username>/task-manager/settings/branches`

**Click "Add branch protection rule"**

**Configuracion rapida:**

1. **Branch name pattern:** `main`

2. **Marca estas checkboxes:**
   - ☑ Require a pull request before merging
     - Require approvals: `1`
     - ☑ Dismiss stale pull request approvals
   - ☑ Require status checks to pass before merging
     - ☑ Require branches to be up to date
     - (Los checks apareceran despues del primer PR)
   - ☑ Require conversation resolution before merging
   - ☑ Do not allow bypassing the above settings
   - ☐ Allow force pushes: **DISABLED**
   - ☐ Allow deletions: **DISABLED**

3. **Click "Create"**

**Resultado:** Main branch protegida ✅

---

## Fase 4: Vercel Configuration (5 minutos)

### Paso 4: Configurar Auto-Deployments

**Ve a:** Vercel Dashboard → Tu proyecto → Settings

**Git:**
- Production Branch: `main` ✅
- Automatically create Preview Deployments: ✅

**Build & Development Settings:**
- Framework: Next.js ✅
- Build Command: `npm run build` ✅
- Output Directory: `.next` ✅
- Install Command: `npm ci` ✅
- Node.js Version: `20.x` ✅

**Environment Variables:**
- Verifica que TODAS tus env vars esten configuradas
- Production + Preview environments

**Resultado:** Vercel auto-deploys configurado ✅

---

## Fase 5: Test (5 minutos)

### Paso 5: Crear PR de Prueba

```bash
# 1. Crear branch
git checkout -b test/ci-pipeline

# 2. Hacer cambio trivial
echo "# CI/CD Pipeline Active - $(date)" >> README.md

# 3. Commit
git add README.md
git commit -m "test: verify CI/CD pipeline"

# 4. Push
git push -u origin test/ci-pipeline
```

**En GitHub:**

1. Abre Pull Request
2. Title: "Test: CI/CD Pipeline"
3. Espera CI checks (~5 min)

**Verifica:**
- ✅ Workflow "PR Validation" running
- ✅ Workflow "Check Code Formatting" running
- ✅ Vercel preview deployment created
- ✅ Ambos workflows pasan (green ✅)

**Si todo esta verde:**

1. Approve PR (self-approve)
2. Merge to main
3. Verifica deployment a produccion en Vercel

**Resultado:** Pipeline funcionando end-to-end ✅

---

## Fase 6: Dependabot (2 minutos)

### Paso 6: Activar Dependabot

**El archivo ya esta creado:** `.github/dependabot.yml`

**Edita una linea:**

```yaml
# Cambia "yoshi" por tu GitHub username
reviewers:
  - "tu-github-username"  # ← EDITAR AQUI
assignees:
  - "tu-github-username"  # ← EDITAR AQUI
```

```bash
# Commit
git add .github/dependabot.yml
git commit -m "ci: configure dependabot for dependency updates"
git push origin main
```

**Resultado:** Dependabot correra cada lunes ✅

---

## Checklist de Completitud

Marca cuando termines cada fase:

- [ ] **Fase 1:** Workflows commiteados
- [ ] **Fase 2:** GitHub Secrets configurados (4 minimos)
- [ ] **Fase 3:** Branch protection configurado
- [ ] **Fase 4:** Vercel auto-deploy configurado
- [ ] **Fase 5:** Test PR exitoso (CI + deployment)
- [ ] **Fase 6:** Dependabot configurado

**Si todos estan marcados: FELICIDADES! Pipeline CI/CD esta ACTIVO!** 🎉

---

## Opcional (Despues)

### Notifications (15 min)

**Setup Telegram notifications:**

Ver guia: `.github/TELEGRAM_NOTIFICATIONS_GUIDE.md`

Pasos resumidos:
1. Crear bot con @BotFather
2. Obtener chat ID con @userinfobot
3. Agregar secrets a GitHub:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

**Resultado:** Notificaciones de deployment en Telegram

---

### Migrations Workflow (10 min)

**Setup production migrations:**

1. Agrega secrets:
   - `PRODUCTION_DB_URL`
   - `PRODUCTION_DB_PASSWORD`

2. Test workflow:
   - GitHub → Actions → "Production Migration"
   - Manual trigger

**Resultado:** Migraciones con 1 click

---

## Proximos Pasos

Ahora que CI/CD esta activo:

1. **Lee documentacion completa:**
   - `docs/CI_CD.md` - Documentacion completa
   - `.github/TESTING_GUIDE.md` - Testing exhaustivo

2. **Comunica a tu equipo:**
   - CI/CD esta activo
   - Todos los cambios via Pull Requests
   - No mas push directo a main

3. **Establece workflows:**
   - Feature branches → PR → Review → Merge
   - Dependabot PRs cada lunes
   - Deployments automaticos

4. **Monitor:**
   - GitHub Actions dashboard
   - Vercel deployments
   - Telegram notifications (si configurado)

---

## Troubleshooting Rapido

### CI Falla: "STAGING_SUPABASE_URL not found"

**Fix:** Agrega el secret en GitHub Settings → Secrets

---

### No Puedo Pushear a Main

**Esto es CORRECTO.** Branch protection funcionando.

**Fix:** Usa Pull Requests (como debe ser)

---

### Preview Deployment No Se Crea

**Fix:** Vercel → Settings → Git → Enable preview deployments

---

### Workflow No Aparece en PR

**Fix:** Workflow debe estar en branch `main` primero

```bash
git checkout main
git pull
# Ahora crea tu feature branch
```

---

## Recursos

**Documentacion completa:**
- `.github/SECRETS_CHECKLIST.md` - Secrets setup
- `.github/BRANCH_PROTECTION_GUIDE.md` - Branch protection
- `.github/VERCEL_CONFIGURATION_GUIDE.md` - Vercel setup
- `.github/TESTING_GUIDE.md` - Testing exhaustivo
- `.github/DEPENDABOT_GUIDE.md` - Dependency updates
- `docs/CI_CD.md` - Documentacion completa

**Support:**
- GitHub Actions Docs: https://docs.github.com/en/actions
- Vercel Docs: https://vercel.com/docs

---

**Tiempo total estimado:** 30 minutos (setup basico)
**Tiempo con opcionales:** 60 minutos (setup completo)

**Fecha de creacion:** 2025-11-11

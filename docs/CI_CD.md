# CI/CD Pipeline Documentation

Documentacion completa del pipeline CI/CD para FocusOnIt Task Manager.

## Overview

Nuestro pipeline CI/CD garantiza:
- ✅ Codigo de calidad (ESLint, TypeScript, Prettier)
- ✅ Builds exitosos antes de merge
- ✅ Deployments automaticos a produccion
- ✅ Notificaciones en tiempo real
- ✅ Actualizaciones de dependencias automatizadas

**Stack:**
- GitHub Actions (CI/CD)
- Vercel (Hosting + Deployments)
- Telegram (Notificaciones)
- Dependabot (Dependency updates)

---

## Workflows

### 1. PR Validation (`.github/workflows/pr-validation.yml`)

**Trigger:** Cada Pull Request a `main`

**Duracion:** ~3-5 minutos

**Pasos:**
1. Checkout codigo
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run ESLint
5. TypeScript type check
6. Build verification

**Proposito:**
- Prevenir merges de codigo que no compila
- Detectar errores de tipos
- Mantener code quality standards

**Status:**
- ✅ Required to merge
- ❌ PR bloqueado si falla

**Variables de entorno requeridas:**
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_GOOGLE_CLIENT_ID`
- `STAGING_GOOGLE_CLIENT_SECRET`

---

### 2. Code Quality (`.github/workflows/code-quality.yml`)

**Trigger:** Cada Pull Request a `main`

**Duracion:** ~2-3 minutos

**Pasos:**
1. Checkout codigo
2. Setup Node.js 20
3. Install dependencies
4. Check Prettier formatting
5. Run ESLint

**Proposito:**
- Mantener codigo formateado consistentemente
- Detectar code style issues

**Status:**
- ✅ Required to merge
- ❌ PR bloqueado si falla

**Como fix:**
```bash
# Auto-fix formatting
npm run format

# Auto-fix ESLint issues
npm run lint -- --fix
```

---

### 3. Production Migration (`.github/workflows/migrate-production.yml`)

**Trigger:** Manual only (workflow_dispatch)

**Duracion:** ~1-2 minutos

**Pasos:**
1. Verify confirmation input
2. Checkout codigo
3. Setup Supabase CLI
4. Apply migrations to production DB
5. Send notification

**Proposito:**
- Aplicar migraciones de base de datos a produccion de manera segura
- Requiere confirmacion manual para prevenir errores

**Como usar:**
1. GitHub → Actions → "Production Migration"
2. Click "Run workflow"
3. Type: `migrate-production`
4. Click "Run workflow"
5. Espera ~1-2 minutos
6. Verifica en Supabase dashboard

**Variables requeridas:**
- `PRODUCTION_DB_URL`
- `PRODUCTION_DB_PASSWORD`

**IMPORTANTE:**
- ⚠️ Correr ANTES de deploy de codigo nuevo
- ⚠️ Backup de BD antes de correr
- ⚠️ Test en staging primero

---

### 4. Deployment Notification (`.github/workflows/deployment-notification.yml`)

**Trigger:** Deployment status change (Vercel webhook)

**Duracion:** <10 segundos

**Pasos:**
1. Detecta deployment success/failure
2. Envia notificacion a Telegram

**Proposito:**
- Notificaciones en tiempo real de deployments
- Alertas inmediatas si deployment falla

**Status:**
- ℹ️ Informational only (no afecta merge)

**Variables opcionales:**
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

**Formato de notificacion:**

**Success:**
```
✅ Deployment successful

Environment: Production
URL: https://focusonit.ycm360.com
Commit: feat: add new feature
Author: yoshi
```

**Failure:**
```
❌ Deployment failed

Environment: Production
Check logs: <vercel-logs-url>
Author: yoshi
```

---

### 5. Test Suite (`.github/workflows/test.yml.disabled`)

**Status:** DISABLED (habilitar cuando implementes tests)

**Trigger:** PRs + push to main

**Duracion:** ~8-12 minutos (estimado)

**Pasos:**
1. Unit & Integration tests
2. E2E tests (Playwright)
3. Upload coverage reports

**Para habilitar:**
1. Implementa tests en proyecto
2. Rename `test.yml.disabled` → `test.yml`
3. Agrega secrets de test environment
4. Update branch protection rules

---

## Branch Strategy

### Main Branch

```
main (production)
  ↑
  └── Protected branch
      - Require PR before merge
      - Require 1 approval
      - Require CI checks passing
      - No force push
      - No delete
```

### Feature Branches

```
feature/nombre-feature  →  PR  →  main
fix/bug-description     →  PR  →  main
docs/documentation      →  PR  →  main
```

**Naming conventions:**
- `feature/` - Nueva funcionalidad
- `fix/` - Bug fix
- `docs/` - Documentacion
- `refactor/` - Refactorizacion
- `chore/` - Build, dependencias, config

---

## Deployment Process

### Standard Deployment (Feature)

```bash
# 1. Crear feature branch
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar feature
# ... hacer cambios ...

# 3. Commit
git add .
git commit -m "feat: add nueva funcionalidad"

# 4. Push
git push -u origin feature/nueva-funcionalidad

# 5. Abrir PR en GitHub
# - CI corre automaticamente
# - Espera checks ✅
# - Solicita review

# 6. Merge PR (cuando aprobado)
# - Squash and merge (recomendado)
# - Delete branch

# 7. Vercel auto-deploy a produccion
# - Build: ~2-3 minutos
# - Deploy a https://focusonit.ycm360.com
# - Notificacion via Telegram
```

**Duracion total:** ~10-15 minutos (desarrollo a produccion)

---

### Hotfix Deployment (Urgente)

```bash
# 1. Crear hotfix branch desde main
git checkout main
git pull
git checkout -b hotfix/bug-critico

# 2. Fix bug (cambios minimos)
# ... fix ...

# 3. Commit y push
git add .
git commit -m "fix: resolve critical bug in production"
git push -u origin hotfix/bug-critico

# 4. Abrir PR
# - CI corre (~3-5 min)
# - Self-approve si eres admin
# - Merge inmediatamente

# 5. Vercel deploys
# - Build + deploy (~2-3 min)
# - Total: ~5-8 minutos desde fix hasta produccion
```

**Duracion total:** ~5-8 minutos (urgente)

---

### Rollback Procedure

**Si deployment causa issues en produccion:**

**Opcion 1: Rollback via Vercel (RAPIDO - Recomendado)**

```
1. Vercel Dashboard → Deployments
2. Busca ultimo deployment estable (anterior al actual)
3. Click "..." → "Promote to Production"
4. ✅ Rollback instantaneo (sin rebuild)
```

**Duracion:** <30 segundos

**Opcion 2: Revert via Git**

```bash
# 1. Revert commit problematico
git revert <commit-hash>

# 2. Push directo a main (emergency)
git push origin main

# 3. Vercel rebuilds y deploys
# Duracion: ~2-3 minutos
```

**Opcion 3: Hotfix Forward**

```bash
# Si bug es simple de fixear
git checkout -b hotfix/fix-deployment-issue
# ... fix ...
git push
# Abrir PR + merge rapido
```

---

## Preview Deployments

**Cada PR crea un preview deployment en Vercel:**

### Como Funciona

1. Abres PR en GitHub
2. Vercel detecta nuevo branch
3. Builds preview deployment
4. Vercel bot comenta en PR:
   ```
   ✅ Preview deployment ready

   https://task-manager-feature-nueva-abc123.vercel.app

   View logs: https://vercel.com/...
   ```
5. Puedes compartir URL para review
6. Preview se actualiza con cada push al branch

### Beneficios

- ✅ Test feature en URL real antes de merge
- ✅ Compartir con stakeholders para feedback
- ✅ Run E2E tests contra preview URL (cuando implementes tests)
- ✅ Verifica que build funciona en produccion-like environment

### Limitaciones

- ⚠️ Preview usa staging/dummy environment variables
- ⚠️ No afecta produccion database
- ⚠️ URLs son temporales (se borran despues de merge)

---

## Environment Variables

### Production (Vercel)

Configuradas en Vercel Dashboard:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | https://focusonit.ycm360.com |

### Staging/CI (GitHub Secrets)

Configuradas en GitHub Secrets:

| Secret | Purpose |
|--------|---------|
| `STAGING_SUPABASE_URL` | Para builds de CI |
| `STAGING_SUPABASE_ANON_KEY` | Para builds de CI |
| `STAGING_GOOGLE_CLIENT_ID` | Para builds de CI |
| `STAGING_GOOGLE_CLIENT_SECRET` | Para builds de CI |
| `PRODUCTION_DB_URL` | Para migraciones |
| `PRODUCTION_DB_PASSWORD` | Para migraciones |
| `TELEGRAM_BOT_TOKEN` | Para notificaciones (opcional) |
| `TELEGRAM_CHAT_ID` | Para notificaciones (opcional) |

**Ver guia completa:** `.github/SECRETS_CHECKLIST.md`

---

## Dependabot (Dependency Updates)

**Configuracion:** `.github/dependabot.yml`

### Como Funciona

**Cada lunes 9 AM:**
1. Dependabot revisa dependencias
2. Detecta actualizaciones disponibles
3. Crea PRs agrupados (max 5)
4. CI corre automaticamente en cada PR
5. Tu revisas y merges

### Grupos de Dependencias

| Grupo | Contenido | Riesgo | Accion |
|-------|-----------|--------|--------|
| `development-dependencies` | ESLint, Prettier, TypeScript | Bajo | Merge rapido |
| `production-dependencies` | Utils generales | Medio | Test en staging |
| `nextjs` | Next.js ecosystem | Alto | Test localmente |
| `react` | React ecosystem | Alto | Test localmente |
| `supabase` | Supabase ecosystem | Alto | Test integracion |
| `github-actions` | CI workflows | Bajo | Merge rapido |

### Security Alerts

**Prioridad MAXIMA:**
- Dependabot abre PRs para vulnerabilidades criticas
- Identificacion: Label "security"
- Accion: Merge ASAP (mismo dia)

**Ejemplo:**
```
🚨 [Security] chore(deps): bump axios from 0.21.1 to 0.21.2

Fixes:
- CVE-2021-12345: Remote Code Execution
- Severity: Critical
```

**Ver guia completa:** `.github/DEPENDABOT_GUIDE.md`

---

## Monitoring

### GitHub Actions Dashboard

**URL:** `https://github.com/<username>/task-manager/actions`

**Que ver:**
- ✅ Workflows exitosos
- ❌ Workflows fallidos
- 🟡 Workflows en progreso
- Tiempo de ejecucion
- Logs detallados

---

### Vercel Deployments

**URL:** `https://vercel.com/<team>/task-manager/deployments`

**Que ver:**
- Status de deployments (success/failed)
- Build logs
- Preview URLs
- Performance metrics
- Rollback options

---

### Telegram Notifications

**Setup:** `.github/TELEGRAM_NOTIFICATIONS_GUIDE.md`

**Notificaciones:**
- ✅ Deployment exitoso
- ❌ Deployment fallido
- ℹ️ Commit author
- ℹ️ URL de deployment

---

## Troubleshooting

### CI Failing: "Build Error"

**Causa:** TypeScript errors o build configuration issue

**Fix:**
```bash
# Reproduce localmente
npm run build

# Fix errors
# Push fix al mismo branch
git add .
git commit -m "fix: resolve build errors"
git push

# CI re-runs automaticamente
```

---

### CI Failing: "ESLint"

**Causa:** Code style violations

**Fix:**
```bash
# Auto-fix
npm run lint -- --fix

# Commit fixes
git add .
git commit -m "style: fix ESLint violations"
git push
```

---

### Deployment Failed on Vercel

**Causas comunes:**
1. Missing environment variables
2. Build error (no detectado en CI)
3. Runtime error

**Fix:**

1. **Check Vercel logs:**
   - Vercel Dashboard → Failed deployment → "View Logs"

2. **Verify env vars:**
   - Vercel → Settings → Environment Variables
   - Verifica que TODAS esten configuradas

3. **Test locally:**
   ```bash
   npm run build
   npm run start
   # Reproduce production environment
   ```

4. **Redeploy:**
   - Fix issue
   - Push to main
   - O redeploy desde Vercel UI

---

### Migration Workflow Failed

**Causas comunes:**
1. Invalid SQL syntax
2. Database connection issue
3. Migration already applied

**Fix:**

1. **Check logs:**
   - GitHub Actions → Failed workflow → View logs

2. **Verify DB connection:**
   - Test `PRODUCTION_DB_URL` secret
   - Verify password correcta

3. **Test migration locally:**
   ```bash
   supabase db push --db-url "<staging-url>"
   # Test en staging primero
   ```

4. **Re-run workflow:**
   - Fix migration SQL
   - Commit changes
   - Re-run from GitHub Actions UI

---

### PR Cannot Merge: "Required checks not passing"

**Causas:**
1. CI workflow failing
2. Branch not up to date with main

**Fix:**

**Opcion 1: Update branch**
```bash
git checkout feature/your-branch
git pull origin main
git push
# CI re-runs
```

**Opcion 2: Fix failing checks**
- Ver logs en GitHub Actions
- Fix errors
- Push fixes

---

## Performance

### CI Performance

**Current metrics:**
- PR Validation: ~3-5 minutos
- Code Quality: ~2-3 minutos
- Total: ~5-8 minutos

**Optimizaciones aplicadas:**
- ✅ npm ci (mas rapido que npm install)
- ✅ Node.js caching
- ✅ Concurrency (cancela runs duplicados)

**Futuras optimizaciones:**
- Turbo cache para builds
- Matrix builds para tests paralelos
- Selective testing (solo cambios afectados)

---

### Deployment Performance

**Current metrics:**
- Vercel build: ~2-3 minutos
- Deploy: instantaneo
- Total: ~2-3 minutos

**Optimizaciones de Next.js:**
- ✅ Automatic code splitting
- ✅ Image optimization
- ✅ Static generation donde posible

---

## Cost

### GitHub Actions

**Plan:** Free tier
- 2,000 minutos/mes
- Uso actual: ~50 minutos/mes
- **Costo:** $0/mes

### Vercel

**Plan:** Hobby/Pro
- Deployments ilimitados
- Preview deployments incluidos
- **Costo:** Incluido en plan

### Dependabot

**Plan:** Free
- Incluido en GitHub
- **Costo:** $0/mes

### Telegram

**Plan:** Free
- **Costo:** $0/mes

**Total CI/CD Cost:** $0/mes (con plan gratuito de GitHub + Vercel Hobby)

---

## Security

### Secrets Management

**NUNCA:**
- ❌ Commit secrets en codigo
- ❌ Loguear secrets en CI
- ❌ Usar production service role key en cliente
- ❌ Compartir secrets via Slack/Discord

**SIEMPRE:**
- ✅ Usar GitHub Secrets
- ✅ Usar Vercel Environment Variables
- ✅ Rotar secrets regularmente
- ✅ Limit secrets scope (production vs staging)

---

### Branch Protection

**Configuracion:** `.github/BRANCH_PROTECTION_GUIDE.md`

**Rules en `main`:**
- ✅ Require PR before merge
- ✅ Require 1 approval
- ✅ Require CI checks passing
- ✅ Require branch up-to-date
- ✅ Require conversation resolution
- ❌ No force push
- ❌ No delete

---

### Dependency Security

**Dependabot:**
- Detecta vulnerabilidades automaticamente
- Abre PRs con patches
- Security alerts via email

**Accion:**
- Merge security patches ASAP
- Review changelog antes de merge
- Test en staging si cambio es major

---

## Best Practices

### Development Workflow

**Do's:**
- ✅ Crear branch para cada feature
- ✅ Commits pequenos y frecuentes
- ✅ Mensajes de commit descriptivos (Conventional Commits)
- ✅ Self-review antes de abrir PR
- ✅ Esperar CI antes de solicitar review
- ✅ Test localmente antes de push

**Don'ts:**
- ❌ Commit directo a main
- ❌ Force push a branches con PR abierto
- ❌ Merge sin approval
- ❌ Ignorar CI failures
- ❌ Deployar sin testing

---

### PR Reviews

**Do's:**
- ✅ Review codigo, no persona
- ✅ Test PR localmente si cambio es grande
- ✅ Pedir aclaraciones si algo no esta claro
- ✅ Aprobar solo si entiendes cambios
- ✅ Sugerir mejoras constructivamente

**Don'ts:**
- ❌ Rubber-stamp approvals (aprobar sin leer)
- ❌ Aprobar PR con CI failing
- ❌ Merge tu propio PR sin segunda review (para cambios criticos)

---

### Deployment

**Do's:**
- ✅ Deploy durante horario laboral (para monitoreo)
- ✅ Monitor produccion despues de deploy
- ✅ Comunicar deployments a equipo
- ✅ Tener rollback plan
- ✅ Test en staging antes de produccion (cambios grandes)

**Don'ts:**
- ❌ Deploy viernes tarde (sin tiempo para fix)
- ❌ Deploy sin backup plan
- ❌ Deploy multiples features juntas (dificil debug)
- ❌ Ignorar errores en produccion

---

## Checklist: Setup Completo

### Fase 1: CI Basico

- [ ] `.github/workflows/pr-validation.yml` creado
- [ ] `.github/workflows/code-quality.yml` creado
- [ ] GitHub Secrets configurados (staging)
- [ ] Branch protection rules configurados
- [ ] Test PR validation (crear PR de prueba)

### Fase 2: Deployments

- [ ] Vercel conectado a GitHub
- [ ] Vercel environment variables configuradas
- [ ] Production domain configurado
- [ ] Preview deployments habilitados
- [ ] Test deployment (push to main)

### Fase 3: Automatizacion

- [ ] `.github/dependabot.yml` configurado
- [ ] Dependabot PRs funcionando
- [ ] Migration workflow creado (opcional)
- [ ] Test migration workflow (staging)

### Fase 4: Notificaciones (Opcional)

- [ ] Telegram bot creado
- [ ] GitHub Secrets (Telegram) configurados
- [ ] Deployment notification workflow creado
- [ ] Test notificacion (deployment real)

### Fase 5: Tests (Futuro)

- [ ] Tests implementados en proyecto
- [ ] Test workflow habilitado
- [ ] Test environment secrets configurados
- [ ] Code coverage configurado

---

## Resources

### Documentation

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Docs](https://vercel.com/docs)
- [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### Project Guides

- `.github/SECRETS_CHECKLIST.md` - Secrets setup
- `.github/BRANCH_PROTECTION_GUIDE.md` - Branch rules
- `.github/VERCEL_CONFIGURATION_GUIDE.md` - Vercel setup
- `.github/TELEGRAM_NOTIFICATIONS_GUIDE.md` - Notifications
- `.github/DEPENDABOT_GUIDE.md` - Dependency updates

---

**Fecha de creacion:** 2025-11-11
**Mantenido por:** DevOps Team
**Ultima revision:** 2025-11-11

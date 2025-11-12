# CI/CD Pipeline Testing Guide

Esta guia te ayudara a verificar que todo el pipeline CI/CD funciona correctamente.

## Pre-requisitos

Antes de empezar, verifica que hayas completado:

- [ ] Workflows creados en `.github/workflows/`
- [ ] GitHub Secrets configurados
- [ ] Branch protection rules configurados
- [ ] Vercel conectado a GitHub
- [ ] Vercel environment variables configuradas

---

## Test 1: PR Validation Workflow

**Objetivo:** Verificar que CI corre en PRs y detecta errores.

### Test 1.1: Happy Path (Todo Correcto)

```bash
# 1. Crear branch de prueba
git checkout -b test/ci-happy-path

# 2. Hacer cambio trivial
echo "# CI Test" >> README.md

# 3. Commit y push
git add README.md
git commit -m "test: verify CI happy path"
git push -u origin test/ci-happy-path
```

**En GitHub:**

1. Abre Pull Request
2. Title: "Test: CI Happy Path"
3. Description: "Testing PR validation workflow"
4. Click "Create pull request"

**Resultado esperado:**

- ✅ Workflow "PR Validation" aparece en checks
- ✅ Workflow "Check Code Formatting" aparece en checks
- ✅ Ambos workflows pasan (green checkmarks)
- ✅ Duracion: ~3-5 minutos total

**Si falla:**
- Click en workflow fallido → "Details"
- Lee logs para ver que paso fallo
- Verifica GitHub Secrets (especialmente STAGING_* vars)

---

### Test 1.2: ESLint Error Detection

**Objetivo:** Verificar que CI detecta errores de ESLint.

```bash
# 1. Crear branch
git checkout main
git pull
git checkout -b test/ci-eslint-error

# 2. Crear archivo con error de ESLint
cat > test-eslint-error.ts << 'EOF'
// Este archivo tiene errores de ESLint a proposito
const unused_variable = "test"  // Variable no usada

function badFunction() {
  console.log("bad")  // Console.log en produccion
}
EOF

# 3. Commit y push
git add test-eslint-error.ts
git commit -m "test: trigger eslint error"
git push -u origin test/ci-eslint-error
```

**En GitHub:**

1. Abre Pull Request
2. Title: "Test: ESLint Error Detection"

**Resultado esperado:**

- ❌ Workflow "Check Code Formatting" FALLA
- ❌ Mensaje: "ESLint found errors"
- ❌ Boton "Merge" esta deshabilitado
- ✅ PR muestra: "Required checks must pass"

**Cleanup:**

```bash
# Fix error
rm test-eslint-error.ts
git add test-eslint-error.ts
git commit -m "test: remove eslint error file"
git push

# Resultado: CI ahora pasa ✅
```

**Si NO detecta error:**
- Verifica que `npm run lint` funcione localmente
- Verifica que workflow use `npm run lint`
- Revisa logs de workflow

---

### Test 1.3: TypeScript Error Detection

**Objetivo:** Verificar que CI detecta errores de tipos.

```bash
# 1. Crear branch
git checkout main
git pull
git checkout -b test/ci-typescript-error

# 2. Crear archivo con error de tipo
cat > test-type-error.ts << 'EOF'
// Error de tipo a proposito
const num: number = "this is a string"  // Type error

export function badTyping(x: number): string {
  return x  // Type error: number no es string
}
EOF

# 3. Commit y push
git add test-type-error.ts
git commit -m "test: trigger typescript error"
git push -u origin test/ci-typescript-error
```

**En GitHub:**

1. Abre Pull Request
2. Title: "Test: TypeScript Error Detection"

**Resultado esperado:**

- ❌ Workflow "PR Validation" FALLA en paso "TypeScript type check"
- ❌ Logs muestran errores de tipo
- ❌ Boton "Merge" deshabilitado

**Cleanup:**

```bash
rm test-type-error.ts
git add test-type-error.ts
git commit -m "test: remove type error file"
git push
```

---

### Test 1.4: Build Error Detection

**Objetivo:** Verificar que CI detecta errores de build.

```bash
# 1. Crear branch
git checkout main
git pull
git checkout -b test/ci-build-error

# 2. Crear componente con error de importacion
mkdir -p components/test
cat > components/test/BrokenComponent.tsx << 'EOF'
import { NonExistentComponent } from '@/components/DoesNotExist'

export default function BrokenComponent() {
  return <NonExistentComponent />  // Import no existe
}
EOF

# 3. Commit y push
git add components/test/BrokenComponent.tsx
git commit -m "test: trigger build error"
git push -u origin test/ci-build-error
```

**Resultado esperado:**

- ❌ Workflow "PR Validation" FALLA en paso "Build verification"
- ❌ Logs: "Module not found" error

**Cleanup:**

```bash
rm -rf components/test
git add components/test
git commit -m "test: remove broken component"
git push
```

---

## Test 2: Branch Protection

**Objetivo:** Verificar que no puedes mergear sin CI passing.

### Test 2.1: Cannot Merge Without Approval

**Usando PR del Test 1.1 (happy path):**

1. Ve al PR (debe tener CI passing ✅)
2. Verifica mensaje: "1 approval required"
3. Intenta hacer merge → Boton "Merge" deshabilitado o solicita approval

**Resultado esperado:**
- ⚠️ No puedes mergear sin approval
- ℹ️ Si eres el unico dev, self-approve

**Para self-approve:**
1. Click "Files changed"
2. Click "Review changes"
3. Selecciona "Approve"
4. Click "Submit review"
5. Ahora puedes mergear

---

### Test 2.2: Cannot Merge With Failing CI

**Usando PR del Test 1.2 (ESLint error):**

1. Ve al PR (debe tener CI failing ❌)
2. Self-approve el PR
3. Intenta hacer merge

**Resultado esperado:**
- ❌ Boton "Merge" deshabilitado
- ℹ️ Mensaje: "Required status checks must pass"
- ✅ Branch protection esta funcionando

---

### Test 2.3: Cannot Push Directly to Main

```bash
# Intenta push directo a main (deberia fallar)
git checkout main
echo "# Direct push test" >> test-direct-push.txt
git add test-direct-push.txt
git commit -m "test: direct push to main"
git push origin main
```

**Resultado esperado:**

```
❌ Error:
! [remote rejected] main -> main (protected branch hook declined)
error: failed to push some refs
```

**Si NO falla:**
- Branch protection NO esta configurada correctamente
- Re-visita `.github/BRANCH_PROTECTION_GUIDE.md`
- Verifica que "Include administrators" este marcado

---

## Test 3: Vercel Deployments

### Test 3.1: Production Deployment

**Objetivo:** Verificar que push a main deploys automaticamente.

```bash
# 1. Cleanup PRs de test anteriores (mergea o cierra)

# 2. Hacer cambio trivial en main
git checkout main
git pull
echo "# Production deploy test - $(date)" >> README.md
git add README.md
git commit -m "test: verify production auto-deploy"
git push origin main
```

**En Vercel Dashboard:**

1. Abre [Vercel Deployments](https://vercel.com)
2. Selecciona proyecto `task-manager`
3. Verifica que nuevo deployment aparezca

**Resultado esperado:**

- ✅ Deployment inicia automaticamente (en segundos)
- ✅ Status: "Building" → "Ready"
- ✅ Duracion: ~2-3 minutos
- ✅ URL: https://focusonit.ycm360.com
- ✅ Cambio visible en produccion

**Verifica en browser:**
```
https://focusonit.ycm360.com
# README.md no es visible en app, pero deployment debe ser exitoso
```

---

### Test 3.2: Preview Deployment

**Objetivo:** Verificar que PRs crean preview deployments.

```bash
# 1. Crear branch con cambio visible
git checkout -b test/preview-deployment

# 2. Crear pagina de prueba
mkdir -p app/test-preview
cat > app/test-preview/page.tsx << 'EOF'
export default function TestPreviewPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Preview Deployment Test</h1>
      <p>This page was created to test preview deployments.</p>
      <p>Date: {new Date().toISOString()}</p>
    </div>
  )
}
EOF

# 3. Commit y push
git add app/test-preview
git commit -m "test: add preview deployment test page"
git push -u origin test/preview-deployment
```

**En GitHub:**

1. Abre Pull Request
2. Title: "Test: Preview Deployment"
3. Espera ~1 minuto

**Resultado esperado:**

- ✅ Vercel bot comenta en PR:
  ```
  ✅ Preview deployment ready

  https://task-manager-test-preview-abc123.vercel.app

  Visit Preview | View Logs
  ```
- ✅ Click en preview URL
- ✅ Navega a `/test-preview`
- ✅ Ves la pagina de prueba

**Si NO funciona:**
- Vercel → Settings → Git → "Automatically create Preview Deployments" debe estar ✅
- Vercel debe tener acceso al repo
- Verifica logs en Vercel

**Cleanup:**
```bash
# Merge PR o cierra (preview se borra automaticamente)
```

---

## Test 4: Notifications (Opcional)

**Solo si configuraste Telegram notifications.**

### Test 4.1: Success Notification

**Usa el Test 3.1 (production deployment):**

**Resultado esperado:**

Despues de deployment exitoso (~2-3 min), recibes mensaje en Telegram:

```
✅ Deployment successful

Environment: Production
URL: https://focusonit.ycm360.com
Commit: test: verify production auto-deploy
Author: yoshi
```

**Si NO recibes notificacion:**

1. **Verifica secrets:**
   - GitHub → Settings → Secrets
   - `TELEGRAM_BOT_TOKEN` existe
   - `TELEGRAM_CHAT_ID` existe

2. **Test manual:**
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
     -d chat_id="<CHAT_ID>" \
     -d text="Manual test"
   ```

3. **Verifica workflow:**
   - GitHub → Actions → "Deployment Notification"
   - Workflow debe haber corrido
   - Revisa logs

---

### Test 4.2: Failure Notification

**Trigger deployment failure:**

```bash
# 1. Crear branch con build error intencional
git checkout -b test/deployment-failure

# 2. Break next.config.js
cat > next.config.js << 'EOF'
// Syntax error intencional
module.exports = {
  invalid syntax here
}
EOF

# 3. Commit y push a main (skip PR para test rapido)
git add next.config.js
git commit -m "test: trigger deployment failure"

# Temporalmente deshabilita branch protection para este test
# O usa Admin override si esta disponible
git push origin test/deployment-failure:main
```

**Resultado esperado:**

- ❌ Vercel deployment falla
- ❌ Recibes notificacion en Telegram:
  ```
  ❌ Deployment failed

  Environment: Production
  Check logs: https://vercel.com/...
  Author: yoshi
  ```

**IMPORTANTE - Rollback inmediato:**

```bash
# Revert broken commit
git revert HEAD
git push origin main

# O rollback via Vercel UI (mas rapido)
```

**Nota:** Este test rompe produccion temporalmente. Hazlo fuera de horas pico o salta este test.

---

## Test 5: Dependabot (Futuro)

**Dependabot corre semanalmente (lunes 9 AM).**

### Test 5.1: Manual Trigger

**GitHub UI:**

1. Repository → Security → Dependabot
2. Click "Check for updates"
3. Espera ~1 minuto

**Resultado esperado:**

- ✅ Si hay actualizaciones disponibles:
  - Dependabot crea PRs
  - Maximo 5 PRs simultaneos
  - PRs agrupados por categoria

- ℹ️ Si no hay actualizaciones:
  - "All dependencies are up to date"

---

### Test 5.2: Review Dependabot PR

**Cuando Dependabot cree PR:**

1. Ve a Pull Requests
2. Filtra: `author:app/dependabot`
3. Abre un PR

**Verifica:**

- ✅ PR title: `chore(deps): bump <group> group`
- ✅ Description lista cambios
- ✅ CI corre automaticamente
- ✅ Labels: "dependencies", "automated"

**Test merge:**

1. Espera CI ✅
2. Review changelog (click en links)
3. Approve PR
4. Merge (si cambios son seguros)

---

## Test 6: Migration Workflow (Opcional)

**Solo si configuraste production migration workflow.**

### Test 6.1: Test en Staging Primero

**NUNCA testees migrations directamente en produccion.**

```bash
# 1. Crea migracion de prueba
mkdir -p supabase/migrations
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_test_migration.sql << 'EOF'
-- Test migration
-- Safe operation: Add comment to existing table
COMMENT ON TABLE tasks IS 'User tasks - CI/CD test migration';
EOF

# 2. Commit
git add supabase/migrations
git commit -m "test: add test migration"
git push origin main
```

**GitHub Actions:**

1. Actions → "Production Migration"
2. Click "Run workflow"
3. Branch: `main`
4. Input: `migrate-production` (o `migrate-staging` si tienes staging)
5. Click "Run workflow"

**Resultado esperado:**

- ✅ Workflow corre
- ✅ Paso "Verify confirmation" pasa
- ✅ Paso "Apply migrations" ejecuta
- ✅ Logs muestran: "Migrations applied successfully"

**Verifica en Supabase:**

1. Supabase Dashboard → Database → Tables
2. Click en tabla `tasks`
3. Verifica que comment se agrego

**Si falla:**
- Verifica secrets: `PRODUCTION_DB_URL`, `PRODUCTION_DB_PASSWORD`
- Verifica SQL syntax
- Revisa logs detallados

---

## Test 7: End-to-End (Feature Completo)

**Test de todo el workflow, desde feature hasta produccion.**

### Escenario: Agregar Footer al Dashboard

```bash
# 1. Crear feature branch
git checkout main
git pull
git checkout -b feature/add-footer

# 2. Agregar footer component
mkdir -p components/layout
cat > components/layout/Footer.tsx << 'EOF'
export function Footer() {
  return (
    <footer style={{
      padding: '1rem',
      textAlign: 'center',
      borderTop: '1px solid #eee',
      marginTop: '2rem'
    }}>
      <p style={{ margin: 0, color: '#666' }}>
        FocusOnIt Task Manager - v0.1.0 - CI/CD Test
      </p>
    </footer>
  )
}
EOF

# 3. Importar footer en layout
# (Edita app/layout.tsx manualmente o usa sed/awk)

# 4. Commit
git add .
git commit -m "feat: add footer to dashboard layout"

# 5. Push
git push -u origin feature/add-footer
```

**Checklist End-to-End:**

- [ ] **1. PR creado en GitHub**
  - Title: "feat: add footer to dashboard layout"
  - Description explica cambio

- [ ] **2. CI corre automaticamente**
  - ✅ PR Validation (3-5 min)
  - ✅ Code Quality (2-3 min)
  - Total: ~5-8 minutos

- [ ] **3. Preview deployment creado**
  - ✅ Vercel bot comenta con URL
  - ✅ Preview URL funciona
  - ✅ Footer visible en preview

- [ ] **4. Review y approval**
  - ✅ Self-review codigo
  - ✅ Approve PR

- [ ] **5. Merge to main**
  - ✅ Click "Squash and merge"
  - ✅ Delete branch despues de merge

- [ ] **6. Production deployment**
  - ✅ Vercel auto-deploys (2-3 min)
  - ✅ Deployment exitoso

- [ ] **7. Notificacion recibida** (si configurado)
  - ✅ Telegram notification
  - ✅ Mensaje: "Deployment successful"

- [ ] **8. Verifica en produccion**
  - ✅ Abre https://focusonit.ycm360.com
  - ✅ Footer visible
  - ✅ Feature funcionando

**Duracion total:** ~10-15 minutos (feature → produccion)

---

## Checklist Final

Marca cada test completado:

### CI/CD Core

- [ ] Test 1.1: Happy path PR validation
- [ ] Test 1.2: ESLint error detection
- [ ] Test 1.3: TypeScript error detection
- [ ] Test 1.4: Build error detection

### Branch Protection

- [ ] Test 2.1: Cannot merge without approval
- [ ] Test 2.2: Cannot merge with failing CI
- [ ] Test 2.3: Cannot push directly to main

### Deployments

- [ ] Test 3.1: Production deployment
- [ ] Test 3.2: Preview deployment

### Notifications (Opcional)

- [ ] Test 4.1: Success notification
- [ ] Test 4.2: Failure notification (skip si riesgoso)

### Dependabot (Futuro)

- [ ] Test 5.1: Manual trigger
- [ ] Test 5.2: Review PR (cuando este disponible)

### Migrations (Opcional)

- [ ] Test 6.1: Migration workflow

### End-to-End

- [ ] Test 7: Feature completo (dev → production)

---

## Troubleshooting

### Workflow No Aparece en PR

**Causa:** Workflow file no esta en branch correcto

**Fix:**
```bash
# Verifica que workflows esten en main
git checkout main
ls .github/workflows/

# Debe mostrar:
# pr-validation.yml
# code-quality.yml
# etc
```

---

### CI Pasa Localmente Pero Falla en GitHub

**Causa:** Diferencia de environment

**Verifica:**
1. Node version (local vs CI)
2. Environment variables
3. Dependencies (`npm ci` vs `npm install`)

**Fix:**
```bash
# Reproduce ambiente de CI localmente
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Preview Deployment No Se Crea

**Verifica:**
1. Vercel → Settings → Git → Preview deployments enabled
2. PR desde branch (no fork)
3. Vercel app instalado en GitHub

---

## Next Steps

Despues de completar testing:

1. ✅ Cleanup test branches
2. ✅ Cleanup test PRs (merge o close)
3. ✅ Documenta issues encontrados
4. ✅ Fix issues antes de usar en produccion real
5. ✅ Comunica a equipo que CI/CD esta listo

---

**Fecha de creacion:** 2025-11-11
**Mantenido por:** DevOps Team

# Dependabot Configuration Guide

Dependabot automatiza actualizaciones de dependencias y parches de seguridad.

## Que Hace Dependabot

**Beneficios:**
- ✅ Detecta vulnerabilidades de seguridad automaticamente
- ✅ Abre PRs para actualizar dependencias
- ✅ Agrupa actualizaciones para reducir ruido
- ✅ Ejecuta tus tests automaticamente (via CI)
- ✅ Gratis en GitHub

**Como funciona:**

1. Cada lunes a las 9 AM, Dependabot revisa dependencias
2. Encuentra actualizaciones disponibles
3. Crea PRs automaticos agrupados
4. CI corre tests en cada PR
5. Tu revisas y merges los PRs

---

## Configuracion Actual

### Archivo: `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"        # Dependencias npm
    schedule:
      interval: "weekly"             # Cada lunes
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 5      # Max 5 PRs abiertos
    groups:
      development-dependencies:      # Agrupa dev deps
      production-dependencies:       # Agrupa prod deps
      nextjs:                        # Next.js separado
      react:                         # React separado
      supabase:                      # Supabase separado

  - package-ecosystem: "github-actions"  # Actualiza workflows
    schedule:
      interval: "monthly"                 # Una vez al mes
```

---

## Grupos de Dependencias

Dependabot agrupa actualizaciones para reducir PRs:

### Development Dependencies

**Que incluye:**
- ESLint, Prettier, TypeScript
- Testing tools (Jest, Playwright)
- Build tools

**Ejemplo PR:**
```
chore(deps-dev): bump development-dependencies group

Updates:
- eslint 8.50.0 → 8.51.0
- prettier 3.0.0 → 3.0.1
- typescript 5.2.0 → 5.2.2
```

**Riesgo:** Bajo (solo afecta desarrollo, no produccion)

---

### Production Dependencies

**Que incluye:**
- Utilidades generales (date-fns, lodash, etc)
- Librerias UI (excluyendo Next.js, React, Supabase)

**Ejemplo PR:**
```
chore(deps): bump production-dependencies group

Updates:
- date-fns 2.30.0 → 2.30.1
- zod 3.22.0 → 3.22.2
```

**Riesgo:** Medio (cambios en produccion, pero minor/patch)

---

### Next.js Ecosystem

**Que incluye:**
- next
- eslint-config-next

**Por que separado:**
- Actualizaciones criticas
- Pueden romper app
- Requieren testing manual

**Ejemplo PR:**
```
chore(deps): bump nextjs group

Updates:
- next 14.0.0 → 14.0.1
- eslint-config-next 14.0.0 → 14.0.1
```

**Riesgo:** Medio-Alto (core framework)

---

### React Ecosystem

**Que incluye:**
- react
- react-dom
- @types/react
- @types/react-dom

**Por que separado:**
- Actualizaciones criticas
- Deben actualizarse juntos
- Incompatibilidades entre versiones

**Ejemplo PR:**
```
chore(deps): bump react group

Updates:
- react 18.2.0 → 18.3.0
- react-dom 18.2.0 → 18.3.0
- @types/react 18.2.0 → 18.3.0
- @types/react-dom 18.2.0 → 18.3.0
```

**Riesgo:** Alto (core UI library)

---

### Supabase Ecosystem

**Que incluye:**
- @supabase/supabase-js
- @supabase/auth-ui-react
- @supabase/ssr

**Por que separado:**
- Dependencias interdependientes
- Cambios en API pueden romper app
- Requieren testing de integracion

**Ejemplo PR:**
```
chore(deps): bump supabase group

Updates:
- @supabase/supabase-js 2.38.0 → 2.38.1
- @supabase/ssr 0.1.0 → 0.1.1
```

**Riesgo:** Alto (backend integration)

---

### GitHub Actions

**Que incluye:**
- actions/checkout
- actions/setup-node
- vercel/actions
- etc

**Por que separado:**
- Actualizaciones mensuales (menos frecuentes)
- No afectan app, solo CI/CD

**Ejemplo PR:**
```
ci(deps): bump github-actions group

Updates:
- actions/checkout v3 → v4
- actions/setup-node v3 → v4
```

**Riesgo:** Bajo (solo CI/CD)

---

## Major Version Updates (Ignorados)

**Configuracion:**
```yaml
ignore:
  - dependency-name: "*"
    update-types: ["version-update:semver-major"]
```

**Por que:**
- Major versions = breaking changes
- Requieren testing manual extensivo
- Pueden romper app
- Mejor actualizar manualmente cuando tengas tiempo

**Ejemplo ignorado:**
- Next.js 14.x → 15.x (major)
- React 18.x → 19.x (major)

**Cuando actualizar major versions:**
1. Lee changelog de la libreria
2. Revisa breaking changes
3. Crea branch dedicado
4. Actualiza y testea localmente
5. Deploy a staging
6. Test exhaustivo
7. Deploy a produccion

---

## Workflow de Dependabot

### Lunes 9 AM (Cada Semana)

**Dependabot:**
1. Revisa package.json
2. Busca actualizaciones
3. Crea PRs agrupados (max 5)

**Ejemplo PRs creados:**
```
1. chore(deps-dev): bump development-dependencies group
2. chore(deps): bump production-dependencies group
3. chore(deps): bump nextjs group
4. chore(deps): bump supabase group
```

### GitHub Actions (Automatico)

**Para cada PR:**
1. CI corre `pr-validation.yml`
   - ESLint
   - TypeScript
   - Build
2. CI corre `code-quality.yml`
   - Prettier
3. Tests (cuando esten implementados)

### Tu Revision (Manual)

**Para cada PR:**

1. **Review automated checks:**
   - ✅ CI passing
   - ✅ No breaking changes mencionados

2. **Review changelog:**
   - Click en "Release notes" en PR description
   - Lee "What's Changed"

3. **Decide:**

   **Low risk (dev deps, minor patches):**
   - ✅ Merge directamente si CI pasa

   **Medium risk (prod deps):**
   - ⚠️ Deploy a staging primero
   - Test manualmente
   - Merge

   **High risk (Next.js, React, Supabase):**
   - ⚠️ Test localmente primero
   - Deploy a staging
   - Test exhaustivo
   - Merge

4. **Merge:**
   - Click "Squash and merge"
   - Vercel auto-deploys a produccion
   - Monitor por errores

---

## Como Manejar PRs de Dependabot

### Escenario 1: Todo Verde, Low Risk

```
PR: chore(deps-dev): bump development-dependencies group
✅ CI passing
✅ Solo dev dependencies
✅ Minor/patch updates
```

**Accion:**
1. Review rapido de changelog
2. Click "Squash and merge"
3. Done

**Tiempo:** 2 minutos

---

### Escenario 2: Todo Verde, High Risk

```
PR: chore(deps): bump nextjs group
✅ CI passing
⚠️ Next.js 14.0.0 → 14.0.3
⚠️ Puede afectar produccion
```

**Accion:**
1. Pull branch localmente:
   ```bash
   gh pr checkout <PR-number>
   npm install
   npm run dev
   ```

2. Test manual:
   - Login
   - Crear tarea
   - Editar tarea
   - Sync con Calendar
   - Pomodoro timer

3. Si todo funciona:
   ```bash
   # Merge via GitHub UI
   ```

4. Monitor produccion despues de deploy

**Tiempo:** 15-30 minutos

---

### Escenario 3: CI Failing

```
PR: chore(deps): bump production-dependencies group
❌ Build failing
❌ TypeScript errors
```

**Accion:**

1. **Investiga error:**
   - Lee logs de CI
   - Identifica que dependencia causa error

2. **Opciones:**

   **Opcion A: Fix compatible**
   ```bash
   # Pull PR
   gh pr checkout <PR-number>

   # Fix codigo para ser compatible
   # (ej: actualizar tipos)

   # Commit fix
   git add .
   git commit -m "fix: update types for new dependency version"
   git push
   ```

   **Opcion B: Postpone update**
   - Close PR
   - Crea issue: "Investigate dependency update failure"
   - Revisa cuando tengas tiempo

   **Opcion C: Pin version**
   ```json
   // package.json
   {
     "dependencies": {
       "problematic-lib": "1.2.3" // Pin to specific version
     }
   }
   ```

**Tiempo:** Varia (15 min - 2 horas)

---

## Security Alerts (Critical)

Dependabot tambien abre PRs para vulnerabilidades de seguridad.

**Identificacion:**
```
🚨 [Security] chore(deps): bump axios from 0.21.1 to 0.21.2

Fixes:
- CVE-2021-12345: Remote Code Execution
- Severity: Critical
```

**Accion INMEDIATA:**

1. **Review alert:**
   - Lee CVE (Common Vulnerabilities and Exposures)
   - Verifica severidad (Critical, High, Medium, Low)

2. **Test localmente:**
   ```bash
   gh pr checkout <PR-number>
   npm install
   npm run build
   npm run dev
   # Test rapido
   ```

3. **Merge ASAP:**
   - Security patches tienen prioridad
   - Merge aunque sea fuera de horario normal

4. **Deploy inmediatamente:**
   - Vercel auto-deploys
   - Monitor produccion

**Tiempo:** 15-30 minutos (alta prioridad)

---

## Configuracion Avanzada

### Cambiar Frecuencia

**Edita `.github/dependabot.yml`:**

```yaml
# Diario (para proyectos muy activos)
schedule:
  interval: "daily"

# Mensual (para proyectos estables)
schedule:
  interval: "monthly"
```

### Cambiar Horario

```yaml
schedule:
  interval: "weekly"
  day: "friday"      # Viernes en vez de lunes
  time: "14:00"      # 2 PM en vez de 9 AM
  timezone: "America/Los_Angeles"
```

### Aumentar Limite de PRs

```yaml
open-pull-requests-limit: 10  # Default: 5
```

**Cuidado:** Muchos PRs simultaneos = dificil de manejar

### Auto-Merge (Avanzado)

**GitHub permite auto-merge de Dependabot PRs:**

```yaml
# .github/workflows/dependabot-auto-merge.yml
name: Dependabot Auto-Merge

on: pull_request

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Enable auto-merge for Dependabot PRs
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Cuando usar:**
- Solo para dev dependencies
- Solo si tienes 100% test coverage
- Solo si confias en CI completamente

**Para FocusOnIt (recomendacion):**
- NO usar auto-merge aun
- Espera hasta tener tests completos
- Review manual es mas seguro

---

## Monitoring de Dependabot

### Ver PRs Activos

**GitHub UI:**
1. Repository → Pull Requests
2. Filter: `is:pr is:open author:app/dependabot`

**GitHub CLI:**
```bash
gh pr list --author app/dependabot
```

### Ver Security Alerts

**GitHub UI:**
1. Repository → Security → Dependabot alerts

**Email:**
- GitHub envia emails para vulnerabilidades criticas

### Ver Historial

**Closed PRs:**
```bash
gh pr list --author app/dependabot --state closed --limit 20
```

---

## Troubleshooting

### Dependabot No Crea PRs

**Causa 1: Primera semana**
- Dependabot puede tomar hasta 1 semana en activarse

**Causa 2: No hay actualizaciones**
- Tus dependencias estan al dia

**Causa 3: Limite de PRs alcanzado**
- Ya tienes 5 PRs abiertos de Dependabot
- Merge algunos para permitir mas

**Solucion:**
- Espera
- O trigger manualmente: Security → Dependabot → "Check for updates"

---

### PR de Dependabot Falla CI

**Causa comun:** Breaking change en dependency

**Solucion:**
1. Review error en CI logs
2. Lee changelog de la dependency
3. Opciones:
   - Fix tu codigo
   - Skip update (close PR)
   - Pin version antigua

---

### Demasiados PRs

**Problema:** 10 PRs de Dependabot cada semana

**Solucion:**

1. **Reduce frecuencia:**
   ```yaml
   schedule:
     interval: "monthly"
   ```

2. **Agrupa mas agresivamente:**
   ```yaml
   groups:
     all-dependencies:
       patterns:
         - "*"
   ```

3. **Ignora packages especificos:**
   ```yaml
   ignore:
     - dependency-name: "eslint"
       update-types: ["version-update:semver-minor"]
   ```

---

## Best Practices

### Do's

- ✅ Review changelogs antes de merge
- ✅ Test high-risk updates localmente
- ✅ Merge security patches inmediatamente
- ✅ Agrupa dependencies relacionadas
- ✅ Mantener dependencias actualizadas regularmente

### Don'ts

- ❌ Auto-merge sin tests completos
- ❌ Ignorar security alerts
- ❌ Dejar PRs abiertos por semanas
- ❌ Merge sin revisar CI status
- ❌ Actualizar todo junto (riesgo alto)

---

## Weekly Checklist

**Cada lunes (despues de Dependabot run):**

- [ ] Review nuevos PRs de Dependabot
- [ ] Prioriza security patches
- [ ] Merge low-risk PRs (dev deps)
- [ ] Test medium-risk PRs localmente
- [ ] Schedule testing para high-risk PRs
- [ ] Close PRs que no quieres mergear (con comentario explicando por que)

**Tiempo estimado:** 30-60 minutos/semana

---

## Checklist de Activacion

- [ ] `.github/dependabot.yml` creado
- [ ] Username actualizado en `reviewers` y `assignees`
- [ ] Commiteado a `main`
- [ ] Pushed a GitHub
- [ ] Esperando primer run (lunes proximo)

---

**Fecha de creacion:** 2025-11-11
**Mantenido por:** DevOps Team

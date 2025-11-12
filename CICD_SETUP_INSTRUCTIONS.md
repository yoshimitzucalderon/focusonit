# CI/CD Pipeline - Setup Instructions

Complete CI/CD pipeline implementado para FocusOnIt Task Manager.

**Status:** ✅ Ready to deploy
**Tiempo estimado de setup:** 30 minutos
**Complejidad:** Media

---

## Que Se Implemento

### GitHub Actions Workflows

**4 workflows activos + 1 para futuro:**

1. **pr-validation.yml** - Validacion de PRs (ESLint, TypeScript, Build)
2. **code-quality.yml** - Verificacion de formato (Prettier)
3. **deployment-notification.yml** - Notificaciones de deployment (Telegram)
4. **migrate-production.yml** - Migraciones de BD a produccion
5. **test.yml.disabled** - Suite de tests (habilitar cuando implementes tests)

### Dependabot

- **dependabot.yml** - Actualizaciones automaticas de dependencias cada lunes

### Documentacion Completa

**9 guias detalladas en `.github/`:**

- `QUICK_START.md` - Setup en 30 minutos
- `SECRETS_CHECKLIST.md` - Lista de secrets necesarios
- `BRANCH_PROTECTION_GUIDE.md` - Configuracion de branch protection
- `VERCEL_CONFIGURATION_GUIDE.md` - Setup de Vercel
- `DEPENDABOT_GUIDE.md` - Como usar Dependabot
- `TELEGRAM_NOTIFICATIONS_GUIDE.md` - Setup de notificaciones
- `TESTING_GUIDE.md` - Como testear el pipeline
- `README.md` - Indice de documentacion
- `../docs/CI_CD.md` - Documentacion tecnica completa

---

## Quick Start (30 minutos)

### Paso 1: Commit Workflows (2 minutos)

```bash
# Ya estan todos los archivos creados
# Solo necesitas commitearlos

git add .github/ docs/CI_CD*.md package.json
git commit -m "ci: implement complete CI/CD pipeline with GitHub Actions

- Add PR validation workflow (ESLint, TypeScript, Build)
- Add code quality workflow (Prettier)
- Add deployment notifications (Telegram)
- Add production migration workflow
- Configure Dependabot for dependency updates
- Add comprehensive documentation (9 guides)
- Update package.json with format scripts"

git push origin main
```

### Paso 2: Configurar GitHub Secrets (5 minutos)

**Ve a:** `https://github.com/<username>/task-manager/settings/secrets/actions`

**Agrega estos 4 secrets (MINIMO):**

1. **STAGING_SUPABASE_URL**
   - Value: Tu Supabase URL

2. **STAGING_SUPABASE_ANON_KEY**
   - Value: Tu Supabase anon key

3. **STAGING_GOOGLE_CLIENT_ID**
   - Value: Tu Google OAuth Client ID

4. **STAGING_GOOGLE_CLIENT_SECRET**
   - Value: Tu Google OAuth Client Secret

**Puedes usar los mismos valores de produccion para estos secrets.**

**Guia detallada:** `.github/SECRETS_CHECKLIST.md`

---

### Paso 3: Branch Protection (5 minutos)

**Ve a:** `https://github.com/<username>/task-manager/settings/branches`

**Click "Add branch protection rule"**

**Configuracion rapida:**

1. Branch name pattern: `main`
2. Marcar:
   - ☑ Require a pull request before merging (1 approval)
   - ☑ Require status checks to pass before merging
   - ☑ Require conversation resolution before merging
   - ☑ Do not allow bypassing the above settings
3. Click "Create"

**Guia detallada:** `.github/BRANCH_PROTECTION_GUIDE.md`

---

### Paso 4: Verificar Vercel (5 minutos)

**Ve a:** Vercel Dashboard → Tu proyecto → Settings

**Verifica:**

- Production branch: `main` ✅
- Preview deployments: Enabled ✅
- Environment variables: Todas configuradas ✅
- Node.js version: 20.x ✅

**Guia detallada:** `.github/VERCEL_CONFIGURATION_GUIDE.md`

---

### Paso 5: Test (10 minutos)

```bash
# 1. Crear branch de prueba
git checkout -b test/ci-pipeline

# 2. Hacer cambio trivial
echo "# CI/CD Pipeline Active" >> README.md

# 3. Commit y push
git add README.md
git commit -m "test: verify CI/CD pipeline"
git push -u origin test/ci-pipeline
```

**En GitHub:**

1. Abre Pull Request
2. Espera CI (~5 min)
3. Verifica checks pasan ✅
4. Approve y merge
5. Verifica deployment a produccion

**Guia detallada:** `.github/TESTING_GUIDE.md`

---

### Paso 6: Actualizar Dependabot (3 minutos)

**Edita `.github/dependabot.yml`:**

```yaml
# Linea 15 y 17 - Cambia "yoshi" por tu GitHub username
reviewers:
  - "tu-github-username"  # ← EDITAR
assignees:
  - "tu-github-username"  # ← EDITAR
```

```bash
git add .github/dependabot.yml
git commit -m "ci: update dependabot reviewers"
git push origin main
```

---

## Checklist de Completitud

- [ ] Workflows commiteados a repositorio
- [ ] GitHub Secrets configurados (4 minimos)
- [ ] Branch protection rules configurados
- [ ] Vercel settings verificados
- [ ] Test PR exitoso
- [ ] Dependabot username actualizado

**Cuando todos esten marcados: CI/CD esta ACTIVO! 🎉**

---

## Opcional (Configurar Despues)

### Notificaciones via Telegram (15 min)

**Por que:** Recibir notificaciones instantaneas de deployments en tu telefono

**Como:** Sigue `.github/TELEGRAM_NOTIFICATIONS_GUIDE.md`

**Pasos resumidos:**
1. Crear bot con @BotFather en Telegram
2. Obtener chat ID con @userinfobot
3. Agregar secrets a GitHub:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
4. Test deployment

---

### Migraciones Automaticas (10 min)

**Por que:** Aplicar migraciones de BD con 1 click

**Como:** Agrega secrets adicionales

**Secrets:**
- `PRODUCTION_DB_URL` - PostgreSQL connection string
- `PRODUCTION_DB_PASSWORD` - Database password

**Uso:**
- GitHub → Actions → "Production Migration"
- Manual trigger con confirmacion

---

## Archivos Creados

### Workflows (`.github/workflows/`)

```
.github/workflows/
├── pr-validation.yml           # PR validation (required)
├── code-quality.yml            # Code formatting (required)
├── deployment-notification.yml # Telegram notifications (optional)
├── migrate-production.yml      # DB migrations (optional)
└── test.yml.disabled           # Tests (future)
```

### Documentacion (`.github/`)

```
.github/
├── README.md                       # Indice de .github/
├── QUICK_START.md                  # Setup rapido (30 min)
├── SECRETS_CHECKLIST.md            # Lista de secrets
├── BRANCH_PROTECTION_GUIDE.md      # Branch protection
├── VERCEL_CONFIGURATION_GUIDE.md   # Vercel setup
├── DEPENDABOT_GUIDE.md             # Dependabot usage
├── TELEGRAM_NOTIFICATIONS_GUIDE.md # Notifications
└── TESTING_GUIDE.md                # Pipeline testing
```

### Documentacion Principal (`docs/`)

```
docs/
├── CI_CD.md                        # Docs tecnicas completas
└── CI_CD_IMPLEMENTATION_SUMMARY.md # Resumen de implementacion
```

### Configuracion

```
.github/dependabot.yml              # Dependabot config
package.json                        # Scripts agregados (format, type-check, ci)
```

---

## Nuevos Scripts de package.json

```bash
# Auto-fix formatting
npm run format

# Check formatting (usado en CI)
npm run format:check

# Type check only
npm run type-check

# Full CI check locally (lint + type-check + build)
npm run ci
```

---

## Como Funciona el Workflow

### Feature Development

```
1. git checkout -b feature/nueva-feature
2. Hacer cambios
3. git push -u origin feature/nueva-feature
4. Abrir PR en GitHub
5. CI corre automaticamente (5-8 min)
   - ESLint
   - TypeScript
   - Prettier
   - Build verification
6. Vercel crea preview deployment
7. Solicitar review
8. Aprobar PR
9. Merge to main
10. Vercel auto-deploys a produccion (2-3 min)
11. Notificacion en Telegram (opcional)

Total: ~10-15 minutos (dev → production)
```

### Dependabot (Semanal)

```
Cada lunes 9 AM:
1. Dependabot revisa dependencias
2. Crea PRs agrupados (max 5)
3. CI corre en cada PR
4. Tu revisas y merges
5. Vercel deploys automaticamente

Total: ~30-60 min/semana
```

---

## Documentacion

### Para Empezar

1. **Setup rapido:** `.github/QUICK_START.md`
2. **Test pipeline:** `.github/TESTING_GUIDE.md`

### Referencias

| Necesitas... | Lee... |
|--------------|--------|
| Configurar secrets | `.github/SECRETS_CHECKLIST.md` |
| Configurar branch protection | `.github/BRANCH_PROTECTION_GUIDE.md` |
| Configurar Vercel | `.github/VERCEL_CONFIGURATION_GUIDE.md` |
| Setup notificaciones | `.github/TELEGRAM_NOTIFICATIONS_GUIDE.md` |
| Usar Dependabot | `.github/DEPENDABOT_GUIDE.md` |
| Documentacion completa | `docs/CI_CD.md` |
| Resumen tecnico | `docs/CI_CD_IMPLEMENTATION_SUMMARY.md` |

### Navegacion

- **Indice de .github/:** `.github/README.md`
- **Docs tecnicas:** `docs/CI_CD.md`
- **Esta guia:** `CICD_SETUP_INSTRUCTIONS.md`

---

## Troubleshooting

### CI falla con "Secret not found"

**Solucion:** Agrega el secret en GitHub Settings → Secrets → Actions

Ver: `.github/SECRETS_CHECKLIST.md`

---

### No puedo pushear a main

**Esto es CORRECTO.** Branch protection funcionando.

**Solucion:** Usa Pull Requests (workflow correcto)

---

### Preview deployment no se crea

**Solucion:**
1. Vercel → Settings → Git → Enable preview deployments
2. Verifica que Vercel tenga acceso al repo

---

### Workflow no aparece en PR

**Causa:** Workflows no estan en branch `main`

**Solucion:** Merge workflows a `main` primero

---

## Support

**Documentacion:**
- GitHub Actions: https://docs.github.com/en/actions
- Vercel: https://vercel.com/docs
- Dependabot: https://docs.github.com/en/code-security/dependabot

**Project docs:**
- `.github/README.md` - Indice
- `docs/CI_CD.md` - Documentacion completa

---

## Next Steps

Despues de setup:

1. ✅ Comunica a tu equipo que CI/CD esta activo
2. ✅ Establece workflow (feature branches → PR → review → merge)
3. ✅ Monitor GitHub Actions dashboard
4. ✅ Review Dependabot PRs cada lunes
5. ✅ Considera agregar notificaciones (Telegram)
6. ✅ Considera agregar tests (cuando esten listos)

---

## Preguntas Frecuentes

### Cuanto cuesta?

**$0/mes** usando planes gratuitos de GitHub Actions (2,000 min/mes) y Vercel.

---

### Puedo usar esto en otros proyectos?

**Si!** Los workflows son genericos. Solo ajusta:
- Nombres de secrets
- Build commands si usas otro framework
- Test commands cuando los implementes

---

### Que pasa si un deployment falla?

**Opciones:**

1. **Rollback via Vercel** (instantaneo)
   - Vercel Dashboard → Deployments → Promote previous
2. **Revert via Git** (2-3 min)
   - `git revert <commit>` y push
3. **Hotfix forward** (5-8 min)
   - Fix bug y mergear rapidamente

---

### Como agrego tests al pipeline?

1. Implementa tests en proyecto (Jest, Playwright)
2. Rename `test.yml.disabled` → `test.yml`
3. Agrega test secrets (ver `.github/SECRETS_CHECKLIST.md`)
4. Update branch protection para require test workflow
5. Done!

---

## Summary

**Implementado:**
- ✅ 4 workflows activos
- ✅ Dependabot configurado
- ✅ 9 guias de documentacion
- ✅ Scripts de package.json
- ✅ Branch protection (a configurar)
- ✅ Notificaciones (opcional)
- ✅ Migraciones (opcional)

**Beneficios:**
- ✅ Calidad de codigo garantizada
- ✅ Deployments automaticos
- ✅ Dependencias actualizadas
- ✅ Cero bugs en produccion por errores de compilacion
- ✅ Workflow profesional

**Tiempo de setup:** 30 minutos

**ROI:** Infinito (previene bugs, ahorra horas de debugging)

---

**Implementado por:** CI/CD Specialist
**Fecha:** 11 de noviembre de 2025
**Version:** 1.0.0

**Ready to deploy!** 🚀

# Vercel Configuration Guide

Esta guia te ayudara a configurar Vercel para deployments automaticos optimizados.

## Prerequisitos

- ✅ Proyecto ya deployado en Vercel (https://focusonit.ycm360.com)
- ✅ Repositorio conectado a Vercel
- ✅ GitHub Actions configurado

---

## 1. Configuracion de Git en Vercel

### Navega a Git Settings

1. Abre [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `task-manager`
3. Click en **Settings** (tab arriba)
4. En menu izquierdo, click en **Git**

---

### Production Branch

**Configuracion recomendada:**

```
Production Branch: main
```

**Que significa:**
- Cada push a `main` → Deploy automatico a produccion
- URL: https://focusonit.ycm360.com

**Verificar:**
- [ ] Production Branch = `main`

---

### Preview Deployments

**Configuracion recomendada:**

```
☑ Automatically create Preview Deployments for:
  ☑ All branches pushed to Git repository
```

**Que significa:**
- Cada PR crea un preview deployment unico
- URL: `https://task-manager-<branch>-<random>.vercel.app`
- Util para testar cambios antes de merge

**Beneficios:**
- ✅ Probar feature en URL real antes de merge
- ✅ Compartir preview con stakeholders
- ✅ CI puede correr tests E2E contra preview URL

**Verificar:**
- [ ] "Automatically create Preview Deployments" = ✅ Enabled

---

### Ignored Build Step

**Configuracion recomendada:**

```
Ignored Build Step: (vacio - build every commit)
```

**Que significa:**
- Vercel corre build para cada commit
- No ignora ningun branch o path

**Cuando usar Ignored Build Step:**
- Si quieres skipear builds para ciertos paths (ej: `docs/`)
- Para proyectos muy grandes donde builds son costosos

**Para FocusOnIt (recomendacion):**
- Dejalo vacio
- Builds son rapidos (~2 min)
- Queremos verificar que TODO compila

**Verificar:**
- [ ] Ignored Build Step = (vacio)

---

## 2. Build & Development Settings

### Navega a Build Settings

1. Settings → **General** (menu izquierdo)
2. Scroll hasta "Build & Development Settings"

---

### Framework Preset

**Configuracion:**
```
Framework Preset: Next.js
```

Vercel detecta automaticamente Next.js. Verifica que diga "Next.js".

**Verificar:**
- [ ] Framework Preset = Next.js

---

### Build Command

**Configuracion:**
```
Build Command: npm run build
```

**Override (opcional):**
Si quieres agregar verificaciones adicionales:
```
npm run lint && npm run build
```

**Recomendacion para FocusOnIt:**
- Dejalo en `npm run build`
- Lint ya se verifica en GitHub Actions

**Verificar:**
- [ ] Build Command = `npm run build` (o custom)

---

### Output Directory

**Configuracion:**
```
Output Directory: .next
```

Next.js usa `.next` por defecto. No cambiar.

**Verificar:**
- [ ] Output Directory = `.next`

---

### Install Command

**Configuracion:**
```
Install Command: npm ci
```

`npm ci` es mas rapido y confiable que `npm install` en CI.

**Verificar:**
- [ ] Install Command = `npm ci` (o yarn install si usas yarn)

---

### Node.js Version

**Configuracion:**
```
Node.js Version: 20.x
```

Debe coincidir con la version en GitHub Actions y tu entorno local.

**Como verificar tu version local:**
```bash
node --version
# Ejemplo output: v20.10.0
```

**Configuracion en Vercel:**
1. Settings → General → Node.js Version
2. Selecciona: `20.x`

**Verificar:**
- [ ] Node.js Version = 20.x

---

## 3. Environment Variables

### Navega a Environment Variables

1. Settings → **Environment Variables**

---

### Variables Requeridas

**Para PRODUCTION (main branch):**

| Variable | Value | Exposed to |
|----------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Production |
| `GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Production |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxx` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://focusonit.ycm360.com` | Production |

**Para PREVIEW (PR deployments):**

| Variable | Value | Exposed to |
|----------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | (Staging URL o mismo que prod) | Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Staging key o mismo que prod) | Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | (Staging key o mismo que prod) | Preview |
| `GOOGLE_CLIENT_ID` | (Staging client o mismo que prod) | Preview |
| `GOOGLE_CLIENT_SECRET` | (Staging secret o mismo que prod) | Preview |
| `NEXT_PUBLIC_APP_URL` | (Se autodetecta en preview) | Preview |

**Nota:**
- Si no tienes ambiente staging separado, puedes usar los mismos valores de produccion
- Considera crear proyecto Supabase separado para staging/preview en futuro

---

### Como Agregar Environment Variables

1. Settings → Environment Variables
2. Click **Add New**
3. Ingresar:
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://xxxxx.supabase.co`
   - **Environments:**
     - ☑ Production
     - ☑ Preview
     - ☐ Development (opcional)
4. Click **Save**
5. Repetir para todas las variables

---

### Variables Sensibles (Secrets)

**IMPORTANTE:**

- ✅ `SUPABASE_SERVICE_ROLE_KEY` → NUNCA exponer en cliente
- ✅ `GOOGLE_CLIENT_SECRET` → NUNCA exponer en cliente
- ❌ Variables con `NEXT_PUBLIC_` → Se exponen en cliente (ok para URLs y anon keys)

**Verificar:**
- [ ] Service role key NO tiene prefijo `NEXT_PUBLIC_`
- [ ] Google client secret NO tiene prefijo `NEXT_PUBLIC_`

---

### Verificar Variables

Despues de agregar variables:

1. Settings → Environment Variables
2. Verifica que TODAS esten configuradas
3. Verifica que esten asignadas a environments correctos

**Checklist:**
- [ ] Todas las variables de produccion configuradas
- [ ] Todas las variables de preview configuradas
- [ ] Secrets no tienen prefijo NEXT_PUBLIC_
- [ ] Public vars tienen prefijo NEXT_PUBLIC_

---

## 4. Domains & HTTPS

### Navega a Domains

1. Settings → **Domains**

---

### Production Domain

**Tu configuracion actual:**
```
focusonit.ycm360.com (Primary)
```

**Verificar:**
- [ ] Domain activo
- [ ] SSL/HTTPS habilitado (candado verde)
- [ ] Redirect www → non-www (o viceversa, segun preferencia)

---

### Preview Domains

Vercel crea automaticamente preview URLs:

```
https://task-manager-<branch>-<team>.vercel.app
https://task-manager-<commit>-<team>.vercel.app
```

**No requiere configuracion**, funcionan automaticamente.

---

## 5. Deployment Protection

### Navega a Deployment Protection

1. Settings → **Deployment Protection**

---

### Vercel Authentication (Opcional)

**Para proyectos privados:**

```
☑ Vercel Authentication
```

Requiere login con Vercel para acceder a preview deployments.

**Para FocusOnIt (recomendacion):**
- ❌ Deshabilitado (app publica)
- Si quieres proteger previews, habilitalo

**Verificar:**
- [ ] Deployment Protection = (configurado segun preferencia)

---

## 6. Notifications

### Navega a Notifications

1. Settings → **Notifications**

---

### Configuracion Recomendada

```
☑ Deployment Notifications
  ☑ Email (tu email)
  ☑ GitHub Commit Status (automatico)
```

**Que recibiras:**

- Email cuando deploy falla
- GitHub status check en commits/PRs (automatico)

**Integraciones adicionales (opcional):**

- Slack webhook (si usas Slack)
- Discord webhook (si usas Discord)

**Para FocusOnIt:**
- Ya configuraste Telegram via GitHub Actions
- Email notifications como backup

**Verificar:**
- [ ] Email notifications habilitado
- [ ] GitHub commit status habilitado

---

## 7. Function Settings (Opcional)

### Navega a Functions

1. Settings → **Functions**

---

### Configuracion

**Para Next.js API Routes:**

```
Region: iad1 (Washington, D.C., USA)
Max Duration: 10s (Hobby plan)
```

**Significado:**
- `iad1`: Donde corren tus funciones serverless (API routes)
- Max Duration: Timeout para funciones (10s en Hobby, 60s en Pro)

**Para FocusOnIt:**
- Dejalo en default (iad1)
- 10s es suficiente para la mayoria de API calls

**Verificar:**
- [ ] Region configurada (default ok)
- [ ] Max Duration = 10s (Hobby) o mas (Pro)

---

## 8. Performance & Monitoring

### Navega a Analytics

1. Proyecto → **Analytics** (tab arriba)

---

### Vercel Analytics (Opcional)

```
☑ Enable Vercel Analytics
```

**Que ofrece:**
- Real User Monitoring (RUM)
- Web Vitals (LCP, FID, CLS)
- Page views y performance

**Costo:**
- Gratis hasta 2,500 page views/mes
- Luego $10/mes

**Para FocusOnIt (recomendacion):**
- Habilitalo (probablemente gratis)
- Util para monitorear performance

**Verificar:**
- [ ] Analytics habilitado (opcional)

---

## 9. Vercel CLI (Opcional)

Para deployments manuales o testing local:

### Instalacion

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy desde CLI

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### Variables de entorno locales

```bash
# Download env vars de Vercel
vercel env pull .env.local
```

**Util para:**
- Sincronizar env vars entre Vercel y local
- Deployments manuales (raro, normalmente usas Git)

---

## 10. Verificacion Final

### Deployment Test

**Test 1: Production deployment**

```bash
# 1. Hacer cambio trivial
echo "# Test" >> README.md

# 2. Commit a main
git add README.md
git commit -m "test: verify vercel auto-deploy"
git push origin main

# 3. Verifica en Vercel dashboard:
# - Deployment inicia automaticamente
# - Build exitoso
# - Deploy a https://focusonit.ycm360.com
```

**Test 2: Preview deployment**

```bash
# 1. Crear branch
git checkout -b test/preview-deployment

# 2. Hacer cambio
echo "# Preview test" >> README.md
git add README.md
git commit -m "test: verify preview deployment"
git push -u origin test/preview-deployment

# 3. Abre PR en GitHub

# 4. Verifica:
# - Vercel bot comenta con preview URL
# - Preview URL funciona
# - Muestra tus cambios
```

---

### Checklist Final

Marca cuando hayas verificado cada item:

**Git Configuration:**
- [ ] Production branch = `main`
- [ ] Preview deployments habilitado
- [ ] Ignored build step = vacio

**Build Settings:**
- [ ] Framework = Next.js
- [ ] Build command = `npm run build`
- [ ] Output directory = `.next`
- [ ] Install command = `npm ci`
- [ ] Node.js version = 20.x

**Environment Variables:**
- [ ] Production vars configuradas
- [ ] Preview vars configuradas
- [ ] Secrets sin prefijo NEXT_PUBLIC_
- [ ] Public vars con prefijo NEXT_PUBLIC_

**Domains:**
- [ ] Production domain activo
- [ ] HTTPS habilitado

**Notifications:**
- [ ] Email notifications habilitado
- [ ] GitHub status checks habilitado

**Testing:**
- [ ] Production deployment funciona
- [ ] Preview deployment funciona

---

## Troubleshooting

### Deployment falla: "Build Error"

**Verifica:**

1. **Logs en Vercel:**
   - Dashboard → Deployments → Click en failed deployment → View logs

2. **Environment variables:**
   - Settings → Environment Variables → Verifica que todas esten configuradas

3. **Build local:**
   ```bash
   npm run build
   # Reproduce el error localmente
   ```

4. **Node version:**
   - Verifica que Vercel use misma version que local

---

### Preview deployment no se crea

**Verifica:**

1. Settings → Git → "Automatically create Preview Deployments" = ✅
2. PR abierto desde branch (no fork)
3. Vercel bot tiene acceso al repo (Settings → Integrations)

---

### Environment variables no funcionan

**Causa comun:**

- Variables agregadas DESPUES de deployment
- Deployment usa cache de env vars

**Solucion:**

1. Settings → Environment Variables → Verifica valores
2. Deployments → Click en deployment → "Redeploy"
3. Variables se cargan fresh

---

## Next Steps

Despues de configurar Vercel:

1. ✅ Test production deployment
2. ✅ Test preview deployment
3. ✅ Verifica que env vars funcionan
4. ✅ Configura notifications (email + Telegram)
5. ✅ Documenta en `docs/CI_CD.md`

---

**Fecha de creacion:** 2025-11-11
**Mantenido por:** DevOps Team

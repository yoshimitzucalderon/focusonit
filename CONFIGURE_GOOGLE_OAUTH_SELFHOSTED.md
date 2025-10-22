# Configuración de Google OAuth - Supabase Self-Hosted

## 🎯 Tu Setup Actual

```
Supabase API: https://api.ycm360.com
Frontend: https://focusonit.ycm360.com
Servidor: /opt/supabase/supabase/docker/
Docker Compose: ✅
```

---

## 🔧 Paso 1: Modificar docker-compose.yml

Edita `/opt/supabase/supabase/docker/docker-compose.yml` en tu servidor.

Busca la sección `auth:` (línea ~77) y **AGREGA** estas variables de entorno:

```yaml
  auth:
    container_name: supabase-auth
    image: supabase/gotrue:v2.177.0
    restart: unless-stopped
    # ... healthcheck y depends_on existentes ...
    environment:
      # ========== CONFIGURACIÓN EXISTENTE (NO MODIFICAR) ==========
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: https://api.ycm360.com
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: "postgres://postgres:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?options=-csearch_path%3Dauth,public,extensions"
      GOTRUE_SITE_URL: https://focusonit.ycm360.com
      GOTRUE_URI_ALLOW_LIST: https://focusonit.ycm360.com,http://localhost:3000
      GOTRUE_DISABLE_SIGNUP: ${DISABLE_SIGNUP}
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: ${JWT_EXPIRY}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: ${ENABLE_EMAIL_SIGNUP}
      GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED: ${ENABLE_ANONYMOUS_USERS}
      GOTRUE_MAILER_AUTOCONFIRM: ${ENABLE_EMAIL_AUTOCONFIRM}
      GOTRUE_MAILER_EXTERNAL_HOSTS: ${MAILER_EXTERNAL_HOSTS:-supabase.ycm360.com}
      GOTRUE_EXTERNAL_PHONE_ENABLED: ${ENABLE_PHONE_SIGNUP}
      GOTRUE_SMS_AUTOCONFIRM: ${ENABLE_PHONE_AUTOCONFIRM}

      # ========== 🆕 GOOGLE OAUTH (AGREGAR ESTAS LÍNEAS) ==========
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: "true"
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: "${GOOGLE_CLIENT_ID}"
      GOTRUE_EXTERNAL_GOOGLE_SECRET: "${GOOGLE_CLIENT_SECRET}"
      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: "https://api.ycm360.com/auth/v1/callback"

      # Opcional: Scopes adicionales para Calendar
      # GOTRUE_EXTERNAL_GOOGLE_SCOPES: "openid,email,profile,https://www.googleapis.com/auth/calendar.events"
```

---

## 📝 Paso 2: Crear/Actualizar archivo .env

Edita el archivo `.env` en `/opt/supabase/supabase/docker/` y **AGREGA** al final:

```bash
# ========== Google OAuth Configuration ==========
GOOGLE_CLIENT_ID=TU-CLIENT-ID-AQUI.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU-CLIENT-SECRET-AQUI
```

**IMPORTANTE**: Reemplaza `TU-CLIENT-ID-AQUI` y `TU-CLIENT-SECRET-AQUI` con tus credenciales de Google Cloud Console.

---

## 🔐 Paso 3: Configurar Google Cloud Console

### A. URIs de Redirección Autorizados

En Google Cloud Console → APIs & Services → Credentials → Tu OAuth Client:

```
JavaScript origins:
  ✅ https://api.ycm360.com
  ✅ https://focusonit.ycm360.com
  ✅ http://localhost:3000 (para desarrollo local)

Authorized redirect URIs:
  ✅ https://api.ycm360.com/auth/v1/callback
  ✅ https://focusonit.ycm360.com/auth/callback
  ✅ http://localhost:3000/auth/callback (para desarrollo)
```

### B. Scopes (Ámbitos)

Asegúrate de que estos scopes estén seleccionados:

```
✅ openid
✅ email
✅ profile
```

Para agregar Calendar más adelante (opcional):
```
✅ https://www.googleapis.com/auth/calendar.events
✅ https://www.googleapis.com/auth/calendar.readonly
```

---

## 🚀 Paso 4: Reiniciar Supabase Auth

En tu servidor, ejecuta:

```bash
# Navegar al directorio de Docker
cd /opt/supabase/supabase/docker

# Reiniciar solo el servicio de auth
docker compose restart auth

# Ver logs para verificar que inició correctamente
docker compose logs -f auth
```

**Espera hasta ver**: `msg="GoTrue API started" port=9999`

---

## ✅ Paso 5: Verificar Configuración

### A. Health Check

```bash
curl https://api.ycm360.com/auth/v1/health
```

**Respuesta esperada**:
```json
{
  "version": "v2.177.0",
  "name": "GoTrue",
  "description": "GoTrue is a user management API"
}
```

### B. Verificar Providers Habilitados

```bash
curl https://api.ycm360.com/auth/v1/settings
```

**Busca en la respuesta**:
```json
{
  "external": {
    "google": true,  // ✅ Debe estar en true
    ...
  }
}
```

### C. Verificar Variables de Entorno

```bash
docker compose exec auth env | grep GOTRUE_EXTERNAL_GOOGLE
```

**Debería mostrar**:
```
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOTRUE_EXTERNAL_GOOGLE_SECRET=xxx
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://api.ycm360.com/auth/v1/callback
```

---

## 💻 Paso 6: Actualizar Frontend (Next.js)

### A. Variables de Entorno (.env.local)

En tu proyecto Next.js local:

```bash
# Supabase Self-Hosted
NEXT_PUBLIC_SUPABASE_URL=https://api.ycm360.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4MjI4ODQzLCJleHAiOjQxMDI0NDQ4MDB9.d5JknOjhScFWEDTQi3LFA0yThHCsZP5FHSZIj4uiQCc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTgyMjg4NDMsImV4cCI6NDEwMjQ0NDgwMH0.msT1BsBQ9-ewpMDFcVvPQn_xltJtxl35mihha2F-Dzs

# N8N
N8N_VOICE_TASK_WEBHOOK_URL=https://n8n.ycm360.com/webhook/voice-task

# Google Calendar OAuth (para sincronización de Calendar después del login)
GOOGLE_CLIENT_ID=TU-CLIENT-ID-AQUI.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU-CLIENT-SECRET-AQUI
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
NEXTAUTH_SECRET=genera-un-secret-aleatorio-aqui

# Producción
# GOOGLE_REDIRECT_URI=https://focusonit.ycm360.com/api/calendar/oauth/callback
```

### B. Instalar Dependencias

```bash
npm install react-icons
```

### C. Crear Página de Login Actualizada

Crea/actualiza `app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Sign in con Google
  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error

      // Redirect automático
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      toast.error('Error al iniciar sesión con Google')
      setLoading(false)
    }
  }

  // Sign in con email/password (mantener para usuarios existentes)
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('¡Bienvenido!')
      router.push('/today')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FocusOnIt
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Organiza tus tareas de forma inteligente
          </p>
        </div>

        {/* Botón de Sign in with Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <FcGoogle className="w-6 h-6" />
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {loading ? 'Conectando...' : 'Continuar con Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
              O inicia sesión con email
            </span>
          </div>
        </div>

        {/* Formulario de email/password */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Link a registro */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes cuenta?{' '}
          <a href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Regístrate gratis
          </a>
        </p>
      </div>
    </div>
  )
}
```

### D. Crear OAuth Callback Handler

Crea `app/auth/callback/route.ts`:

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createServerSupabaseClient()

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to dashboard
  return NextResponse.redirect(`${origin}/today`)
}
```

---

## 🧪 Paso 7: Probar la Integración

### A. Desarrollo Local

1. **Inicia tu app**:
   ```bash
   cd task-manager
   npm run dev
   ```

2. **Abre el navegador**:
   ```
   http://localhost:3000/login
   ```

3. **Haz clic en "Continuar con Google"**

4. **Flujo esperado**:
   ```
   1. Redirect a Google → Seleccionar cuenta
   2. Autorizar permisos
   3. Redirect a https://api.ycm360.com/auth/v1/callback
   4. Supabase valida y redirige a http://localhost:3000/auth/callback
   5. Frontend intercambia código por sesión
   6. Redirect final a http://localhost:3000/today
   ```

### B. Verificar Usuario Creado

En tu servidor Supabase, verifica que el usuario se creó:

```bash
docker compose exec db psql -U postgres -d postgres -c "SELECT id, email, provider FROM auth.users;"
```

**Debería mostrar**:
```
                  id                  |       email        | provider
--------------------------------------+-------------------+----------
 123e4567-e89b-12d3-a456-426614174000 | tu@gmail.com      | google
```

---

## 🐛 Troubleshooting

### Error: "Provider not enabled"

**Causa**: Google OAuth no está habilitado en Supabase.

**Solución**:
```bash
# Verificar variables
docker compose exec auth env | grep GOTRUE_EXTERNAL_GOOGLE_ENABLED

# Debe mostrar: GOTRUE_EXTERNAL_GOOGLE_ENABLED=true

# Si no, revisar .env y docker-compose.yml
# Luego reiniciar:
docker compose restart auth
```

### Error: "redirect_uri_mismatch"

**Causa**: URI de redirección no coincide.

**Solución**:
1. En Google Cloud Console, verifica:
   ```
   ✅ https://api.ycm360.com/auth/v1/callback
   ```
2. En `docker-compose.yml`, verifica:
   ```yaml
   GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: "https://api.ycm360.com/auth/v1/callback"
   ```

### Error: "Invalid redirect URL"

**Causa**: Frontend no está en la allowlist.

**Solución**:
Verifica en `docker-compose.yml`:
```yaml
GOTRUE_URI_ALLOW_LIST: https://focusonit.ycm360.com,http://localhost:3000
```

### Error: "Session not found"

**Causa**: Cookies no se están compartiendo.

**Solución**:
1. Verifica `GOTRUE_SITE_URL`:
   ```yaml
   GOTRUE_SITE_URL: https://focusonit.ycm360.com
   ```
2. Limpia cookies del navegador
3. Intenta de nuevo

### Los logs de auth no muestran nada

```bash
# Ver logs completos
docker compose logs -f auth

# Ver solo errores
docker compose logs auth | grep -i error

# Ver configuración cargada
docker compose exec auth env | grep GOTRUE
```

---

## 📊 Verificación Final

Ejecuta este checklist:

```bash
#!/bin/bash
# verify-google-oauth.sh

echo "🔍 Verificando Google OAuth en Supabase Self-Hosted..."

# 1. Health check
echo -e "\n1️⃣ Health check:"
curl -s https://api.ycm360.com/auth/v1/health | jq .

# 2. Settings (providers)
echo -e "\n2️⃣ Providers habilitados:"
curl -s https://api.ycm360.com/auth/v1/settings | jq '.external.google'

# 3. Variables de entorno
echo -e "\n3️⃣ Variables de entorno:"
docker compose exec auth env | grep GOTRUE_EXTERNAL_GOOGLE

# 4. Logs recientes
echo -e "\n4️⃣ Últimos logs de auth:"
docker compose logs --tail=50 auth

echo -e "\n✅ Verificación completada"
```

Guarda este script y ejecútalo:
```bash
chmod +x verify-google-oauth.sh
./verify-google-oauth.sh
```

---

## 🎯 Resumen de Cambios

### En el Servidor (Supabase)

1. ✅ Editar `docker-compose.yml` → Agregar variables de Google OAuth
2. ✅ Editar `.env` → Agregar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
3. ✅ Reiniciar servicio: `docker compose restart auth`
4. ✅ Verificar logs: `docker compose logs -f auth`

### En Google Cloud Console

1. ✅ Agregar URIs de redirección:
   - `https://api.ycm360.com/auth/v1/callback`
   - `https://focusonit.ycm360.com/auth/callback`
   - `http://localhost:3000/auth/callback`

### En el Frontend (Next.js)

1. ✅ Actualizar `.env.local`
2. ✅ Instalar `react-icons`
3. ✅ Crear/actualizar página de login
4. ✅ Crear callback handler

---

## 🚀 Siguiente Paso

Una vez que **Sign in with Google** funcione, puedes agregar:

1. **Modal de bienvenida** sugiriendo conectar Calendar
2. **Permisos de Calendar** en Settings (flujo separado)
3. **Sincronización automática** de tareas a Calendar

**¿Todo claro? ¿Necesitas ayuda con algún paso?** 🎯

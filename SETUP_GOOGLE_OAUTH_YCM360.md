# Configuración de Google OAuth - YCM360 Self-Hosted

## 🎯 Tu Configuración Actual

```
Servidor: vmi2658765
Path: /opt/supabase/supabase/docker/
Supabase API: https://api.ycm360.com
Supabase Studio: https://supabase.ycm360.com
Frontend: https://focusonit.ycm360.com
```

---

## 📝 PASO 1: Actualizar .env

Conéctate a tu servidor y edita el archivo `.env`:

```bash
ssh root@vmi2658765
cd /opt/supabase/supabase/docker
nano .env
```

**AGREGAR** estas líneas **AL FINAL** del archivo:

```bash
############
# Google OAuth Configuration
############

GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**IMPORTANTE**:
- Reemplaza `your-client-id.apps.googleusercontent.com` con tu Client ID de Google Cloud Console
- Reemplaza `your-client-secret` con tu Client Secret de Google Cloud Console

Guarda el archivo (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## 🔧 PASO 2: Actualizar docker-compose.yml

Edita el archivo `docker-compose.yml`:

```bash
nano docker-compose.yml
```

**BUSCA** la sección `auth:` (aproximadamente línea 77) y **AGREGA** estas líneas en la sección `environment:`:

```yaml
  auth:
    container_name: supabase-auth
    image: supabase/gotrue:v2.177.0
    restart: unless-stopped
    # ... healthcheck y depends_on existentes ...
    environment:
      # ... todas las variables existentes ...

      # 🆕 AGREGAR ESTAS LÍNEAS AL FINAL DE environment:

      # Google OAuth Configuration
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: "true"
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: "${GOOGLE_CLIENT_ID}"
      GOTRUE_EXTERNAL_GOOGLE_SECRET: "${GOOGLE_CLIENT_SECRET}"
      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: "https://api.ycm360.com/auth/v1/callback"
```

**⚠️ IMPORTANTE**: Asegúrate de que la indentación sea correcta (2 espacios para cada nivel).

Guarda el archivo (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## 🚀 PASO 3: Reiniciar Servicios

Reinicia el servicio de autenticación:

```bash
cd /opt/supabase/supabase/docker
docker compose restart auth
```

Espera unos segundos y verifica que esté corriendo:

```bash
docker compose logs -f auth
```

**Busca esta línea** en los logs:
```
msg="GoTrue API started" port=9999
```

Presiona `Ctrl+C` para salir de los logs.

---

## ✅ PASO 4: Verificar Configuración

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

### B. Verificar que Google está habilitado

```bash
curl https://api.ycm360.com/auth/v1/settings | jq '.external.google'
```

**Respuesta esperada**:
```json
true
```

Si no tienes `jq` instalado, instálalo:
```bash
apt-get update && apt-get install -y jq
```

### C. Verificar Variables de Entorno

```bash
docker compose exec auth env | grep GOTRUE_EXTERNAL_GOOGLE
```

**Debería mostrar**:
```
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOTRUE_EXTERNAL_GOOGLE_SECRET=tu-client-secret
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://api.ycm360.com/auth/v1/callback
```

---

## 🔐 PASO 5: Configurar Google Cloud Console

### A. Crear Proyecto (si no existe)

1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto: "FocusOnIt Production"

### B. Habilitar Google Calendar API

1. APIs & Services → Library
2. Busca "Google Calendar API"
3. Haz clic en "Enable"

### C. Configurar Pantalla de Consentimiento OAuth

1. APIs & Services → OAuth consent screen
2. Tipo de usuario: **Externo**
3. Rellena:
   - **Nombre de la app**: FocusOnIt
   - **Email de soporte**: tu-email@example.com
   - **Logo**: (opcional)
   - **Dominio de la aplicación**: `ycm360.com`
   - **Dominios autorizados**: `ycm360.com`
4. Ámbitos (Scopes):
   - `openid`
   - `email`
   - `profile`
   - (Opcional) `https://www.googleapis.com/auth/calendar.events`
5. Usuarios de prueba (si es necesario):
   - Agrega tu email para testing

### D. Crear Credenciales OAuth 2.0

1. APIs & Services → Credentials
2. "Create Credentials" → "OAuth 2.0 Client ID"
3. Tipo de aplicación: **Aplicación web**
4. Nombre: `FocusOnIt Web Client`

5. **JavaScript origins autorizados**:
   ```
   https://api.ycm360.com
   https://focusonit.ycm360.com
   http://localhost:3000
   ```

6. **URIs de redirección autorizados**:
   ```
   https://api.ycm360.com/auth/v1/callback
   https://focusonit.ycm360.com/auth/callback
   http://localhost:3000/auth/callback
   ```

7. Haz clic en "Create"

8. **COPIA** el Client ID y Client Secret que aparecen

---

## 📝 PASO 6: Actualizar .env con Credenciales Reales

Edita de nuevo el `.env`:

```bash
nano .env
```

**REEMPLAZA** las líneas que agregaste antes:

```bash
############
# Google OAuth Configuration
############

GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789
```

(Con tus credenciales reales de Google)

Guarda y reinicia auth:

```bash
docker compose restart auth
```

---

## 🧪 PASO 7: Probar desde el Frontend

### A. Actualizar .env.local en tu proyecto Next.js

En tu máquina local, edita `task-manager/.env.local`:

```bash
# Supabase Self-Hosted
NEXT_PUBLIC_SUPABASE_URL=https://api.ycm360.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4MjI4ODQzLCJleHAiOjQxMDI0NDQ4MDB9.d5JknOjhScFWEDTQi3LFA0yThHCsZP5FHSZIj4uiQCc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTgyMjg4NDMsImV4cCI6NDEwMjQ0NDgwMH0.msT1BsBQ9-ewpMDFcVvPQn_xltJtxl35mihha2F-Dzs

# N8N
N8N_VOICE_TASK_WEBHOOK_URL=https://n8n.ycm360.com/webhook/voice-task

# Google Calendar OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
NEXTAUTH_SECRET=d8afb08f80b5e27f3a51d0cb3faa7cc96e0c230fbc862dab30ac4525edeca352

# Producción (comentado por ahora)
# GOOGLE_REDIRECT_URI=https://focusonit.ycm360.com/api/calendar/oauth/callback
```

**Nota**: Usa el mismo `JWT_SECRET` de tu servidor como `NEXTAUTH_SECRET`.

### B. Instalar Dependencias

```bash
cd task-manager
npm install react-icons
```

### C. Crear Página de Login

Crea el archivo `app/(auth)/login/page.tsx` (si no existe, créalo):

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
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      toast.error('Error al iniciar sesión con Google')
      setLoading(false)
    }
  }

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
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FocusOnIt
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Organiza tus tareas de forma inteligente
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle className="w-6 h-6" />
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {loading ? 'Conectando...' : 'Continuar con Google'}
          </span>
        </button>

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
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

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

### D. Crear Callback Handler

Crea el archivo `app/auth/callback/route.ts`:

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
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/today`)
}
```

### E. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

### F. Probar el Login

1. Abre http://localhost:3000/login
2. Haz clic en "Continuar con Google"
3. Selecciona tu cuenta de Google
4. Autoriza los permisos
5. Deberías ser redirigido a `/today`

---

## 🔍 Verificación en la Base de Datos

Verifica que el usuario se creó:

```bash
# En el servidor
docker compose exec db psql -U postgres -d postgres

# Dentro de psql:
SELECT id, email, provider, created_at FROM auth.users;

# Salir de psql:
\q
```

---

## 🐛 Troubleshooting

### Error: "Provider not enabled"

```bash
# Verificar configuración
docker compose exec auth env | grep GOTRUE_EXTERNAL_GOOGLE

# Ver logs
docker compose logs auth | tail -50

# Reiniciar
docker compose restart auth
```

### Error: "redirect_uri_mismatch"

Verifica que en Google Cloud Console tengas exactamente:
```
https://api.ycm360.com/auth/v1/callback
```

### No redirige después de autorizar

Verifica `GOTRUE_URI_ALLOW_LIST` en docker-compose.yml:
```yaml
GOTRUE_URI_ALLOW_LIST: https://focusonit.ycm360.com,http://localhost:3000
```

### Cookies no funcionan

Verifica `GOTRUE_SITE_URL` en docker-compose.yml:
```yaml
GOTRUE_SITE_URL: https://focusonit.ycm360.com
```

---

## 📊 Script de Verificación Completo

Crea este script en el servidor:

```bash
cat > /root/verify-google-oauth.sh << 'EOF'
#!/bin/bash

echo "🔍 Verificando Google OAuth en Supabase..."

cd /opt/supabase/supabase/docker

echo -e "\n1️⃣ Variables de entorno:"
docker compose exec auth env | grep GOTRUE_EXTERNAL_GOOGLE

echo -e "\n2️⃣ Health check:"
curl -s https://api.ycm360.com/auth/v1/health | jq .

echo -e "\n3️⃣ Google provider status:"
curl -s https://api.ycm360.com/auth/v1/settings | jq '.external.google'

echo -e "\n4️⃣ Últimos logs de auth:"
docker compose logs --tail=20 auth

echo -e "\n✅ Verificación completada"
EOF

chmod +x /root/verify-google-oauth.sh
```

Ejecutar:
```bash
/root/verify-google-oauth.sh
```

---

## ✅ Checklist Final

### En el Servidor (vmi2658765)

- [ ] `.env` actualizado con `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
- [ ] `docker-compose.yml` actualizado con variables `GOTRUE_EXTERNAL_GOOGLE_*`
- [ ] Servicio auth reiniciado: `docker compose restart auth`
- [ ] Verificado que Google está habilitado: `curl https://api.ycm360.com/auth/v1/settings`

### En Google Cloud Console

- [ ] Proyecto creado
- [ ] Google Calendar API habilitada
- [ ] OAuth consent screen configurado
- [ ] Credenciales OAuth 2.0 creadas
- [ ] URIs de redirección agregados:
  - [ ] `https://api.ycm360.com/auth/v1/callback`
  - [ ] `https://focusonit.ycm360.com/auth/callback`
  - [ ] `http://localhost:3000/auth/callback`

### En el Frontend

- [ ] `.env.local` actualizado
- [ ] `react-icons` instalado
- [ ] Página de login creada
- [ ] Callback handler creado
- [ ] Servidor de desarrollo corriendo

### Prueba Final

- [ ] Login con Google funciona
- [ ] Usuario aparece en `auth.users`
- [ ] Sesión persiste al refrescar
- [ ] Logout funciona

---

## 🎯 Siguiente Paso

Una vez que funcione el login con Google, puedes agregar:

1. ✅ **Modal de bienvenida** para nuevos usuarios
2. ✅ **Conectar Google Calendar** (opcional) desde Settings
3. ✅ **Sincronización automática** de tareas

**¿Listo para probarlo?** 🚀

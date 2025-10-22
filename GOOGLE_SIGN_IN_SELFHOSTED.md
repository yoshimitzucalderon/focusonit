# Sign in with Google - Supabase Self-Hosted

## 🎯 Diferencias con Supabase Cloud

Con **Supabase self-hosted** (`https://api.ycm360.com`), la configuración de Google OAuth es **diferente y más manual**:

| Aspecto | Supabase Cloud | Supabase Self-Hosted |
|---------|----------------|----------------------|
| **UI de configuración** | ✅ Dashboard con formulario | ❌ Configuración manual en archivos |
| **Redirect automático** | ✅ Supabase maneja todo | ⚠️ Debes configurar manualmente |
| **Providers** | ✅ Click para habilitar | ⚠️ Configurar en `auth.config` |
| **Complejidad** | Baja 😊 | Media 🤔 |

---

## 🏗️ Arquitectura para Self-Hosted

### Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────┐
│  1. Usuario hace clic en "Sign in with Google"          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  2. Supabase Auth (self-hosted) genera URL de Google    │
│     https://accounts.google.com/o/oauth2/v2/auth...     │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  3. Usuario autoriza en Google                          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  4. Redirect a Supabase self-hosted                     │
│     https://api.ycm360.com/auth/v1/callback             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  5. Supabase valida y crea sesión                       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  6. Redirect final a tu app                             │
│     http://localhost:3000/auth/callback                 │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuración de Supabase Self-Hosted

### Opción 1: Usando Docker Compose (Recomendado)

Si usas `docker-compose.yml` para Supabase, edita el archivo:

```yaml
# docker-compose.yml o supabase/docker-compose.yml

services:
  auth:
    image: supabase/gotrue:latest
    environment:
      # ... otras variables existentes ...

      # Google OAuth Configuration
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: "true"
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: "tu-client-id.apps.googleusercontent.com"
      GOTRUE_EXTERNAL_GOOGLE_SECRET: "tu-client-secret"
      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: "https://api.ycm360.com/auth/v1/callback"

      # Site URL (tu frontend)
      GOTRUE_SITE_URL: "http://localhost:3000"

      # Additional Redirect URLs (separados por coma)
      GOTRUE_URI_ALLOW_LIST: "http://localhost:3000/*,https://api.ycm360.com/*"
```

### Opción 2: Variables de Entorno del Sistema

Si Supabase corre como servicio, configura las variables de entorno:

```bash
# En tu servidor donde corre Supabase
export GOTRUE_EXTERNAL_GOOGLE_ENABLED="true"
export GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
export GOTRUE_EXTERNAL_GOOGLE_SECRET="tu-client-secret"
export GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI="https://api.ycm360.com/auth/v1/callback"
export GOTRUE_SITE_URL="http://localhost:3000"
export GOTRUE_URI_ALLOW_LIST="http://localhost:3000/*,https://api.ycm360.com/*"
```

### Opción 3: Archivo de Configuración

Si usas archivo `config.toml`:

```toml
# supabase/config.toml

[auth]
site_url = "http://localhost:3000"
uri_allow_list = "http://localhost:3000/*,https://api.ycm360.com/*"

[auth.external.google]
enabled = true
client_id = "tu-client-id.apps.googleusercontent.com"
secret = "tu-client-secret"
redirect_uri = "https://api.ycm360.com/auth/v1/callback"
```

---

## 🔧 Configuración de Google Cloud Console

### Paso 1: URIs de Redirección Autorizados

En Google Cloud Console → Credenciales → Tu OAuth Client:

```
URIs de JavaScript autorizados:
  - http://localhost:3000
  - https://api.ycm360.com

URIs de redirección autorizados:
  - https://api.ycm360.com/auth/v1/callback
  - http://localhost:3000/auth/callback
```

**IMPORTANTE**: Para self-hosted, el callback va a `https://api.ycm360.com/auth/v1/callback`, **NO** a tu frontend.

### Paso 2: Ámbitos (Scopes)

```
✅ openid
✅ email
✅ profile
```

Para Calendar (opcional, agregar después):
```
✅ https://www.googleapis.com/auth/calendar.events
✅ https://www.googleapis.com/auth/calendar.readonly
```

---

## 💻 Código para Next.js

### Variables de Entorno (.env.local)

```bash
# Supabase Self-Hosted
NEXT_PUBLIC_SUPABASE_URL=https://api.ycm360.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Calendar OAuth (para sincronización de Calendar)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
NEXTAUTH_SECRET=tu-secret-generado

# N8N (ya existe)
N8N_VOICE_TASK_WEBHOOK_URL=https://n8n.ycm360.com/webhook/voice-task
```

### Página de Login (app/(auth)/login/page.tsx)

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // IMPORTANTE: Para self-hosted, el redirect va al frontend
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error

      // El redirect es automático
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      toast.error('Error al iniciar sesión con Google')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bienvenido a FocusOnIt
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Organiza tus tareas de forma inteligente
          </p>
        </div>

        {/* Botón de Sign in with Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle className="w-6 h-6" />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {loading ? 'Conectando...' : 'Continuar con Google'}
          </span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-800 text-gray-500">
              O inicia sesión con email
            </span>
          </div>
        </div>

        {/* Aquí iría tu formulario de email/password actual */}
      </div>
    </div>
  )
}
```

### Callback Handler (app/auth/callback/route.ts)

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

  // URL to return to after sign in process completes
  return NextResponse.redirect(`${origin}/today`)
}
```

---

## 🔄 Flujo Completo del Usuario

### Paso a Paso

1. **Usuario llega a `/login`**
   ```
   http://localhost:3000/login
   ```

2. **Hace clic en "Continuar con Google"**
   ```
   Frontend → Supabase Client → signInWithOAuth()
   ```

3. **Supabase self-hosted genera URL de Google**
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=tu-client-id&
     redirect_uri=https://api.ycm360.com/auth/v1/callback&
     response_type=code&
     scope=openid email profile
   ```

4. **Usuario autoriza en Google**
   ```
   Ventana de Google → Selecciona cuenta → Acepta permisos
   ```

5. **Google redirige a Supabase**
   ```
   https://api.ycm360.com/auth/v1/callback?code=xxx
   ```

6. **Supabase valida y redirige a frontend**
   ```
   http://localhost:3000/auth/callback?code=xxx
   ```

7. **Frontend intercambia código por sesión**
   ```
   exchangeCodeForSession(code)
   ```

8. **Redirige al dashboard**
   ```
   http://localhost:3000/today
   ```

---

## 🐛 Troubleshooting Específico para Self-Hosted

### Error: "redirect_uri_mismatch"

**Causa**: La URI de redirección no coincide con Google Cloud Console.

**Solución**:
1. En Google Cloud Console, asegúrate de tener:
   ```
   https://api.ycm360.com/auth/v1/callback
   ```
2. NO uses:
   ```
   http://localhost:3000/auth/callback  ❌ (esto es solo para el paso final)
   ```

### Error: "Provider not enabled"

**Causa**: Google OAuth no está habilitado en Supabase self-hosted.

**Solución**:
1. Verifica que `GOTRUE_EXTERNAL_GOOGLE_ENABLED="true"` está configurado
2. Reinicia el servicio de auth:
   ```bash
   docker-compose restart auth
   ```

### Error: "Invalid redirect URL"

**Causa**: El frontend no está en la lista de URLs permitidas.

**Solución**:
1. Configura `GOTRUE_URI_ALLOW_LIST`:
   ```bash
   GOTRUE_URI_ALLOW_LIST="http://localhost:3000/*,https://api.ycm360.com/*"
   ```
2. Reinicia Supabase

### Error: "Session not found"

**Causa**: Las cookies no se están compartiendo correctamente.

**Solución**:
1. Asegúrate de que `GOTRUE_SITE_URL` apunta a tu frontend:
   ```bash
   GOTRUE_SITE_URL="http://localhost:3000"
   ```
2. Verifica que las cookies del navegador no estén bloqueadas

---

## 🔐 Permisos de Calendar (Opcional)

### Opción A: Todo en el Sign In Inicial

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
      // Incluir Calendar desde el inicio
      scope: 'openid email profile https://www.googleapis.com/auth/calendar.events',
    },
  },
})
```

**Ventaja**: Todo de una vez
**Desventaja**: Puede asustar al usuario

### Opción B: Permisos Incrementales (Recomendado)

```typescript
// 1. Sign In: Solo básicos
scope: 'openid email profile'

// 2. Después en Settings: Calendar separado
// Usar el flujo actual de /api/calendar/connect
```

**Ventaja**: Mejor UX
**Desventaja**: Dos pasos

---

## 🚀 Comandos para Self-Hosted

### Reiniciar Supabase Auth

```bash
# Si usas Docker Compose
docker-compose restart auth

# Ver logs de auth
docker-compose logs -f auth

# Verificar configuración
docker-compose exec auth env | grep GOTRUE
```

### Verificar Configuración

```bash
# Endpoint de health check
curl https://api.ycm360.com/auth/v1/health

# Listar providers habilitados
curl https://api.ycm360.com/auth/v1/settings
```

---

## 📊 Comparación: Cloud vs Self-Hosted

| Tarea | Supabase Cloud | Self-Hosted |
|-------|---------------|-------------|
| **Configurar provider** | Dashboard UI | Variables de entorno |
| **Reiniciar después de cambios** | No necesario | Sí, reiniciar servicio |
| **Redirect URI** | Auto-generado | Manual: `api.ycm360.com/auth/v1/callback` |
| **Debugging** | Logs en dashboard | Docker logs |
| **Complejidad** | ⭐ Baja | ⭐⭐⭐ Media |

---

## 🎯 Checklist de Implementación

### Configuración de Servidor

- [ ] Variables de entorno configuradas en Supabase
  - [ ] `GOTRUE_EXTERNAL_GOOGLE_ENABLED=true`
  - [ ] `GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=...`
  - [ ] `GOTRUE_EXTERNAL_GOOGLE_SECRET=...`
  - [ ] `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://api.ycm360.com/auth/v1/callback`
  - [ ] `GOTRUE_SITE_URL=http://localhost:3000`
  - [ ] `GOTRUE_URI_ALLOW_LIST=http://localhost:3000/*,https://api.ycm360.com/*`
- [ ] Servicio de auth reiniciado
- [ ] Verificado con `curl https://api.ycm360.com/auth/v1/health`

### Configuración de Google Cloud Console

- [ ] URIs de redirección configurados:
  - [ ] `https://api.ycm360.com/auth/v1/callback`
  - [ ] `http://localhost:3000/auth/callback`
- [ ] Client ID y Secret copiados
- [ ] Scopes configurados (openid, email, profile)

### Configuración de Frontend

- [ ] Variables de entorno en `.env.local`
- [ ] Página de login actualizada
- [ ] Callback handler creado (`app/auth/callback/route.ts`)
- [ ] Instalado `react-icons` (`npm install react-icons`)

### Pruebas

- [ ] Login con Google funciona
- [ ] Usuario creado en tabla `auth.users`
- [ ] Sesión persistente (refrescar página)
- [ ] Logout funciona
- [ ] Login con email/password sigue funcionando

---

## 📝 Notas Importantes para Self-Hosted

1. **CORS**: Asegúrate de que `api.ycm360.com` permite CORS desde `localhost:3000`

2. **HTTPS en producción**: Google requiere HTTPS para OAuth en producción. `api.ycm360.com` ya usa HTTPS ✅

3. **Certificados SSL**: Verifica que el certificado SSL de `api.ycm360.com` es válido

4. **Firewall**: Asegúrate de que `api.ycm360.com/auth/v1/callback` es accesible desde internet

5. **Logs**: Siempre revisa logs de auth para debugging:
   ```bash
   docker-compose logs -f auth
   ```

---

## 🔧 Script de Verificación

Crea este script para verificar tu configuración:

```bash
#!/bin/bash
# verify-oauth.sh

echo "🔍 Verificando configuración de Google OAuth..."

# 1. Health check
echo "\n1️⃣ Health check de Supabase Auth:"
curl -s https://api.ycm360.com/auth/v1/health | jq .

# 2. Settings (providers habilitados)
echo "\n2️⃣ Providers habilitados:"
curl -s https://api.ycm360.com/auth/v1/settings | jq .external

# 3. Variables de entorno (si tienes acceso al servidor)
echo "\n3️⃣ Variables de entorno:"
docker-compose exec auth env | grep GOTRUE_EXTERNAL_GOOGLE

echo "\n✅ Verificación completada"
```

---

## 🆘 Soporte

Si tienes problemas con self-hosted:

1. **Revisa logs de auth**:
   ```bash
   docker-compose logs -f auth
   ```

2. **Verifica conectividad**:
   ```bash
   curl https://api.ycm360.com/auth/v1/health
   ```

3. **Revisa Google Cloud Console**:
   - URIs de redirección
   - Client ID y Secret
   - Scopes

4. **Problemas comunes**:
   - Ver sección "Troubleshooting" arriba

---

## ✅ Siguiente Paso

¿Quieres que implemente el código ahora mismo?

Puedo:
1. ✅ Actualizar la página de login con botón de Google
2. ✅ Crear el callback handler
3. ✅ Agregar modal de bienvenida
4. ✅ Actualizar documentación

**¿Procedo con la implementación para self-hosted?** 🚀

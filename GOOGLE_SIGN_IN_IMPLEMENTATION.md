# Implementación de "Sign in with Google" para FocusOnIt

## 🎯 Objetivo

Permitir que los usuarios inicien sesión con su cuenta de Google **sin necesidad de configurar Google Cloud Console**. Solo el desarrollador configura las credenciales una vez.

---

## 📊 Comparación: Antes vs Después

### ❌ Antes (Configuración Manual)
```
Usuario → Configurar Google Cloud Console (15 min)
       → Copiar credenciales
       → Pegar en .env.local
       → Reiniciar servidor
       → Conectar Google Calendar
```

### ✅ Después (Sign in with Google)
```
Usuario → Clic en "Sign in with Google"
       → ¡Listo! (5 segundos)
       → (Opcional) Conectar Google Calendar con 1 clic
```

---

## 🏗️ Arquitectura

### Flujo de Autenticación y Sincronización

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO NO REGISTRADO                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Clic en "Sign in with Google"                           │
│     (Botón en página de login)                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Google OAuth Popup                                       │
│     - Seleccionar cuenta                                     │
│     - Aceptar permisos básicos (email, nombre, foto)        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Supabase Auth                                            │
│     - Crear/actualizar usuario automáticamente              │
│     - Generar sesión                                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Usuario autenticado → Dashboard                          │
│     ✅ Puede usar la app inmediatamente                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5. (OPCIONAL) Conectar Google Calendar                     │
│     - Ir a Settings                                          │
│     - Clic en "Conectar Google Calendar"                    │
│     - Aceptar permisos de Calendar                          │
│     - ✅ Sincronización activada                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Configuración (Una Sola Vez - Desarrollador)

### Paso 1: Google Cloud Console

#### A. Crear Proyecto
1. Ve a https://console.cloud.google.com/
2. Crear proyecto "FocusOnIt Production"

#### B. Habilitar APIs
1. Google Calendar API ✅
2. Google OAuth API ✅

#### C. Configurar OAuth Consent Screen
```
Tipo de usuario: Externo
Nombre: FocusOnIt
Email de soporte: tu-email@example.com
Dominios autorizados: focusonit.com (tu dominio)
Ámbitos (scopes):
  - openid
  - email
  - profile
  - https://www.googleapis.com/auth/calendar.events
```

#### D. Crear Credenciales OAuth 2.0
```
Tipo: Aplicación web
Nombre: FocusOnIt Web Client

URIs de JavaScript autorizados:
  - http://localhost:3000 (desarrollo)
  - https://focusonit.com (producción)

URIs de redirección autorizados:
  - http://localhost:3000/auth/callback (desarrollo)
  - https://focusonit.com/auth/callback (producción)
  - http://localhost:3000/api/calendar/oauth/callback (para Calendar)
  - https://focusonit.com/api/calendar/oauth/callback (para Calendar)
```

**IMPORTANTE**: Guarda el Client ID y Client Secret.

---

## ⚙️ Configuración de Supabase

### Paso 1: Habilitar Google Provider

1. Ve a tu proyecto en Supabase
2. Authentication → Providers
3. Habilita "Google"
4. Pega el Client ID y Client Secret de Google Cloud Console
5. Guarda los cambios

### Paso 2: Configurar Redirect URLs

En Supabase Authentication → URL Configuration:

```
Site URL: https://focusonit.com
Redirect URLs:
  - http://localhost:3000/**
  - https://focusonit.com/**
```

---

## 💻 Implementación en el Código

### Paso 1: Variables de Entorno

Actualiza `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Google OAuth (para Calendar sync)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
NEXTAUTH_SECRET=tu-secret-generado

# Producción
# GOOGLE_REDIRECT_URI=https://focusonit.com/api/calendar/oauth/callback
```

### Paso 2: Modificar Página de Login

Actualiza `app/(auth)/login/page.tsx`:

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

  // Sign in con Google (OAuth)
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

      // Redirect automático por Supabase
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      toast.error('Error al iniciar sesión con Google')
      setLoading(false)
    }
  }

  // Sign in tradicional con email/password (opcional, mantener para usuarios existentes)
  const handleEmailSignIn = async (email: string, password: string) => {
    // ... tu implementación actual
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

        {/* Formulario tradicional (opcional) */}
        {/* ... tu formulario actual de email/password ... */}
      </div>
    </div>
  )
}
```

### Paso 3: Crear Callback Handler

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

### Paso 4: Instalar Iconos (si no están instalados)

```bash
npm install react-icons
```

---

## 🎨 Mejora de UX: Conectar Calendar Automáticamente

Opcionalmente, puedes preguntar al usuario si quiere conectar Google Calendar después del primer login:

Crea `components/WelcomeModal.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WelcomeModalProps {
  isNewUser: boolean
}

export function WelcomeModal({ isNewUser }: WelcomeModalProps) {
  const [show, setShow] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Mostrar solo para usuarios nuevos
    if (isNewUser) {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
      if (!hasSeenWelcome) {
        setShow(true)
      }
    }
  }, [isNewUser])

  const handleConnectCalendar = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    router.push('/settings?scroll=calendar')
  }

  const handleSkip = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-4">
          <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          ¡Bienvenido a FocusOnIt!
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          ¿Quieres sincronizar tus tareas con Google Calendar?
          Tus eventos aparecerán automáticamente como tareas.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleConnectCalendar}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Conectar Google Calendar
          </button>

          <button
            onClick={handleSkip}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Tal vez después
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🔄 Flujo Completo con Permisos Granulares

### Opción A: Solicitar Calendar durante Sign In (Todo de una vez)

```typescript
const handleGoogleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        // Solicitar permisos de Calendar desde el inicio
        scope: 'openid email profile https://www.googleapis.com/auth/calendar.events',
      },
    },
  })
}
```

**Ventaja**: Usuario solo autoriza una vez
**Desventaja**: Puede asustar pedir todos los permisos al inicio

### Opción B: Permisos Incrementales (Recomendado) ⭐

```typescript
// 1. Sign In: Solo permisos básicos
const handleGoogleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        // Solo permisos básicos al inicio
        scope: 'openid email profile',
      },
    },
  })
}

// 2. Después, en Settings: Solicitar permisos de Calendar
const handleConnectCalendar = async () => {
  // Usar el flujo OAuth actual para Calendar
  const response = await fetch('/api/calendar/connect')
  const { authUrl } = await response.json()
  window.location.href = authUrl
}
```

**Ventaja**: Mejor UX, usuario entiende por qué necesitas cada permiso
**Desventaja**: Dos pasos (pero es más transparente)

---

## 📊 Comparación de Enfoques

| Aspecto | Manual (Actual) | Sign in with Google | Google One Tap |
|---------|----------------|---------------------|----------------|
| **Tiempo setup usuario** | 15 min | 5 seg | 2 seg |
| **Complejidad técnica** | Alta | Baja | Muy baja |
| **Escalabilidad** | No ❌ | Sí ✅ | Sí ✅ |
| **UX profesional** | No ❌ | Sí ✅ | Sí ✅ |
| **Conversión usuarios** | Baja | Alta | Muy alta |
| **Costo** | $0 | $0 | $0 |

---

## 🚀 Ventajas de "Sign in with Google"

### Para el Usuario:
✅ **Sin configuración técnica**
✅ **Login en 5 segundos**
✅ **No recordar contraseñas**
✅ **Foto de perfil automática**
✅ **Sincronización opcional con 1 clic**

### Para Ti (Desarrollador):
✅ **Escalable a millones de usuarios**
✅ **Configuración una sola vez**
✅ **Menos soporte técnico**
✅ **Mayor conversión**
✅ **UX profesional**

---

## 📈 Métricas Esperadas

### Sin Sign in with Google:
```
100 visitantes
  → 20 completan setup Google Cloud Console (20%)
  → 15 se registran exitosamente (15%)
  → 10 se quedan usando la app (10%)
```

### Con Sign in with Google:
```
100 visitantes
  → 80 hacen clic en "Sign in with Google" (80%)
  → 75 completan autenticación (75%)
  → 60 se quedan usando la app (60%)
```

**6x más conversión** 🚀

---

## 🎯 Recomendación Final

### Para Usuarios No Técnicos:

```
✅ Implementar "Sign in with Google"
✅ Permisos incrementales (básicos → Calendar)
✅ Modal de bienvenida sugeriendo Calendar
✅ Mantener opción de email/password para flexibilidad
```

### Flujo Ideal:

1. **Landing page** → "Comenzar gratis"
2. **Login** → "Continuar con Google" (5 seg)
3. **Dashboard** → Usar app inmediatamente
4. **Modal bienvenida** → "¿Conectar Google Calendar?" (opcional)
5. **Settings** → Conectar Calendar con 1 clic (si lo desea)

---

## 🔧 Implementación Paso a Paso

### Fase 1: Autenticación (1-2 horas)
- [ ] Configurar Google OAuth en Supabase
- [ ] Actualizar página de login
- [ ] Crear callback handler
- [ ] Probar login con Google

### Fase 2: UX Mejorada (1 hora)
- [ ] Agregar modal de bienvenida
- [ ] Mejorar Settings para Calendar
- [ ] Agregar indicadores visuales

### Fase 3: Producción (30 min)
- [ ] Verificar app en Google Cloud Console
- [ ] Configurar dominio de producción
- [ ] Actualizar redirect URIs

**Tiempo total**: ~3-4 horas

---

## ❓ Preguntas Frecuentes

### ¿Necesito cambiar las credenciales existentes?
No, puedes usar las mismas credenciales de Google Cloud Console. Solo necesitas:
1. Configurarlas en Supabase (además de en .env.local)
2. Agregar redirect URIs de Supabase

### ¿Puedo mantener login con email/password?
Sí, totalmente. Muchas apps ofrecen ambas opciones:
- Sign in with Google (rápido, sin registro)
- Email/Password (tradicional, más control)

### ¿Qué pasa con los usuarios existentes?
Pueden seguir usando email/password, o pueden vincular su cuenta de Google después.

### ¿Es seguro?
Sí, más seguro que email/password porque:
- Google maneja la autenticación
- 2FA de Google automático
- Sin contraseñas que almacenar

---

## 📞 Siguiente Paso

¿Quieres que implemente "Sign in with Google" en el código?

Solo dime y puedo:
1. Actualizar la página de login
2. Crear el callback handler
3. Configurar Supabase Auth
4. Agregar el modal de bienvenida
5. Actualizar la documentación

**Todo listo para escalar a usuarios no técnicos** 🚀

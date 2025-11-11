# Setup Detallado - FocusOnIt

Guia completa y detallada para configurar FocusOnIt desde cero.

## Tabla de Contenidos

- [Prerequisites](#prerequisites)
- [Configuracion de Supabase](#configuracion-de-supabase)
- [Configuracion del Proyecto](#configuracion-del-proyecto)
- [Variables de Entorno](#variables-de-entorno)
- [Base de Datos](#base-de-datos)
- [Configuracion de Google OAuth (Opcional)](#configuracion-de-google-oauth-opcional)
- [Configuracion de n8n (Opcional)](#configuracion-de-n8n-opcional)
- [Desarrollo Local](#desarrollo-local)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Software Requerido

- **Node.js**: 18.0.0 o superior
- **npm**: 9.0.0 o superior (incluido con Node.js)
- **Git**: Para clonar el repositorio
- **Editor de codigo**: VS Code recomendado

### Cuentas Necesarias

- **Supabase**: Cuenta gratuita en [supabase.com](https://supabase.com)
- **Google Cloud** (opcional): Para Google Calendar y autenticacion
- **Vercel** (opcional): Para deployment en produccion

### Conocimientos Recomendados

- JavaScript/TypeScript basico
- React/Next.js basico
- SQL basico (para modificar el schema si es necesario)

---

## Configuracion de Supabase

### Paso 1: Crear Proyecto

1. Ve a [supabase.com](https://supabase.com)
2. Click en "New project"
3. Rellena:
   - **Organization**: Crea una nueva o usa existente
   - **Name**: `focusonit` (o el nombre que prefieras)
   - **Database Password**: Genera una contrasena segura y guardala
   - **Region**: Elige la mas cercana a tus usuarios
   - **Pricing Plan**: Free (suficiente para desarrollo y pruebas)
4. Click en "Create new project"
5. **Espera 2-3 minutos** mientras Supabase configura todo

### Paso 2: Obtener Credenciales

Una vez que el proyecto este listo:

1. Ve a **Settings** (icono de engranaje) → **API**
2. Encontraras 3 valores importantes:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** key: Empieza con `eyJhbGc...`
   - **service_role** key: Click en "Reveal" para verla

**IMPORTANTE**: Guarda estos valores, los necesitaras pronto.

### Paso 3: Configurar Autenticacion

1. Ve a **Authentication** → **Settings**
2. Configuracion recomendada para desarrollo:
   - **Enable email confirmations**: OFF (desactivar para testing)
   - **Enable email signup**: ON
   - **Enable phone signup**: OFF
3. Click en "Save"

### Paso 4: (Opcional) Configurar Google OAuth

Si quieres habilitar "Sign in with Google":

1. Ve a **Authentication** → **Providers**
2. Busca "Google" y hazle click
3. Activa el toggle "Enable Sign in with Google"
4. Ingresa tu Google Client ID y Client Secret (ver seccion de Google OAuth abajo)
5. Click en "Save"

---

## Configuracion del Proyecto

### Paso 1: Clonar Repositorio

```bash
# Clona el repositorio
git clone <tu-repositorio-url>
cd task-manager

# Instala dependencias
npm install
```

### Paso 2: Crear Archivo de Entorno

```bash
# Copia el ejemplo
cp .env.example .env.local

# Edita el archivo
code .env.local  # O usa tu editor preferido
```

---

## Variables de Entorno

### Variables Basicas (Obligatorias)

Edita `.env.local` con tus credenciales de Supabase:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Donde encontrar estos valores**:

- Ve a Supabase Dashboard → Settings → API
- Copia los valores exactamente como aparecen

### Variables Opcionales (Google Calendar)

Si quieres sincronizacion con Google Calendar:

```env
# Google Calendar OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
NEXTAUTH_SECRET=genera-un-secret-aleatorio-aqui
```

**Generar NEXTAUTH_SECRET**:

```bash
openssl rand -base64 32
```

### Variables Opcionales (n8n)

Si quieres voice-to-task con n8n:

```env
# n8n Webhook
N8N_VOICE_TASK_WEBHOOK_URL=https://n8n.tudominio.com/webhook/voice-task
```

### Variables para Produccion

En produccion, actualiza:

```env
GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/calendar/oauth/callback
```

---

## Base de Datos

### Ejecutar Script SQL

1. Abre Supabase Dashboard
2. Ve a **SQL Editor** (icono de codigo)
3. Click en "New query"
4. Abre el archivo `setup.sql` del proyecto
5. Copia TODO el contenido
6. Pega en el editor de Supabase
7. Click en "Run" (o presiona F5)
8. Deberias ver: "Success. No rows returned"

### Que hace el script

El script `setup.sql` crea:

```sql
-- Tabla principal de tareas
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Campos para Google Calendar
  google_event_id TEXT,
  synced_with_calendar BOOLEAN DEFAULT false,
  google_calendar_sync BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP
);

-- Indices para performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);

-- Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Politicas RLS
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at automatico
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Migracion de Google Calendar Tokens (Si usas Calendar)

Si planeas usar Google Calendar, ejecuta tambien:

`supabase/migrations/create_google_calendar_tokens.sql`

Este crea la tabla para almacenar tokens OAuth:

```sql
CREATE TABLE google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### Verificar Tablas

1. Ve a **Table Editor** en Supabase Dashboard
2. Deberias ver:
   - `tasks` con todas las columnas
   - `google_calendar_tokens` (si ejecutaste la migracion)

---

## Configuracion de Google OAuth (Opcional)

Si quieres "Sign in with Google" y/o sincronizacion con Calendar:

### Paso 1: Crear Proyecto en Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Click en "New Project"
3. Nombre: `FocusOnIt`
4. Click en "Create"

### Paso 2: Habilitar APIs

1. Ve a "APIs & Services" → "Library"
2. Busca y habilita:
   - Google Calendar API

### Paso 3: Configurar OAuth Consent Screen

1. Ve a "APIs & Services" → "OAuth consent screen"
2. Tipo: **External**
3. Rellena:
   - App name: `FocusOnIt`
   - User support email: Tu email
   - Developer contact: Tu email
4. Scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
   - `.../auth/calendar.events` (opcional, para Calendar)
5. Test users: Agrega tu email
6. Save

### Paso 4: Crear Credenciales OAuth

1. Ve a "APIs & Services" → "Credentials"
2. "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: **Web application**
4. Name: `FocusOnIt Web Client`
5. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://tu-dominio.com (produccion)
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/api/calendar/oauth/callback
   https://tu-dominio.com/auth/callback (produccion)
   https://tu-dominio.com/api/calendar/oauth/callback (produccion)
   ```
7. Click "Create"
8. **GUARDA** Client ID y Client Secret

### Paso 5: Configurar en Supabase (Si usas Supabase Auth para Google)

1. Supabase Dashboard → Authentication → Providers → Google
2. Enable
3. Pega Client ID y Client Secret
4. Save

### Paso 6: Configurar en .env.local

Agrega las credenciales a tu `.env.local`:

```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
```

---

## Configuracion de n8n (Opcional)

Para voice-to-task:

### Opcion 1: n8n Cloud

1. Crea cuenta en [n8n.io](https://n8n.io)
2. Crea nuevo workflow
3. Agrega Webhook node
4. Copia la URL del webhook
5. Agregala a `.env.local`:
   ```env
   N8N_VOICE_TASK_WEBHOOK_URL=https://n8n.app/webhook/xxxxx
   ```

### Opcion 2: n8n Self-Hosted

Si tienes tu propio servidor n8n:

1. Crea workflow con Webhook trigger
2. Usa la URL de tu servidor:
   ```env
   N8N_VOICE_TASK_WEBHOOK_URL=https://n8n.tudominio.com/webhook/voice-task
   ```

---

## Desarrollo Local

### Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La app estara disponible en [http://localhost:3000](http://localhost:3000)

### Primer Uso

1. Ve a [http://localhost:3000/signup](http://localhost:3000/signup)
2. Crea tu cuenta:
   - **Opcion A**: Email y contrasena
   - **Opcion B**: "Sign in with Google" (si lo configuraste)
3. Si usaste email:
   - Si tienes confirmacion desactivada: Acceso inmediato
   - Si tienes confirmacion activada: Revisa tu email
4. Inicia sesion en [http://localhost:3000/login](http://localhost:3000/login)
5. Crea tu primera tarea

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Produccion
npm run build        # Construye para produccion
npm start            # Ejecuta build de produccion

# Linting
npm run lint         # Revisa codigo
```

---

## Deployment

### Opcion 1: Vercel (Recomendado)

1. Sube tu codigo a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. "Import Project" → Selecciona tu repo
4. Configura variables de entorno:
   - Copia todas las variables de `.env.local`
   - Actualiza `GOOGLE_REDIRECT_URI` para produccion
5. Click "Deploy"
6. Espera 2-3 minutos
7. Tu app esta en linea

**Configuracion de dominio custom**:

1. Vercel Dashboard → Settings → Domains
2. Agrega tu dominio
3. Configura DNS segun instrucciones
4. Actualiza URIs en Google Cloud Console

### Opcion 2: Docker

```bash
# Construir imagen
docker build -t focusonit .

# Ejecutar
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=tu-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key \
  -e SUPABASE_SERVICE_ROLE_KEY=tu-service-key \
  focusonit
```

### Opcion 3: Self-Hosted (VPS)

1. Clona repo en tu servidor
2. Instala dependencias: `npm install`
3. Configura `.env.local`
4. Build: `npm run build`
5. Inicia: `npm start`
6. Usa PM2 o similar para mantener corriendo:
   ```bash
   npm install -g pm2
   pm2 start npm --name focusonit -- start
   pm2 save
   pm2 startup
   ```

---

## Troubleshooting

### Error: "Failed to fetch tasks"

**Causa**: Credenciales incorrectas o base de datos no configurada.

**Solucion**:

1. Verifica que las credenciales en `.env.local` sean correctas
2. Confirma que ejecutaste `setup.sql` en Supabase
3. Verifica que RLS este activado
4. Revisa la consola del navegador para errores especificos

### Error: "User not authenticated"

**Causa**: Middleware o sesion no funcionando.

**Solucion**:

1. Limpia cookies del navegador
2. Verifica que `middleware.ts` existe y esta correcto
3. Intenta logout y login de nuevo

### Error: "Email not confirmed"

**Causa**: Confirmacion de email esta activada en Supabase.

**Solucion para desarrollo**:

1. Supabase → Authentication → Settings
2. Desactiva "Enable email confirmations"
3. Intenta registrarte de nuevo

### Real-time no funciona

**Causa**: Realtime no esta habilitado o hay problemas de conexion.

**Solucion**:

1. Supabase → Settings → API
2. Verifica que Realtime este "Enabled"
3. Revisa limites del plan (free tier tiene restricciones)
4. Verifica la consola del navegador para errores de WebSocket

### Build falla en Vercel

**Causa**: Variables de entorno faltantes o errores de TypeScript.

**Solucion**:

1. Verifica que todas las variables de entorno esten configuradas en Vercel
2. Revisa logs de build para errores especificos
3. Ejecuta `npm run build` localmente para reproducir

### Google OAuth no funciona

**Causa**: URIs de redireccion incorrectas o credenciales mal configuradas.

**Solucion**:

1. Verifica que URIs en Google Cloud Console coincidan exactamente
2. Confirma que credenciales esten correctas en `.env.local`
3. Revisa que Google Calendar API este habilitada
4. Verifica logs del servidor

---

## Proximos Pasos

Despues de completar el setup:

1. [Conectar Google Calendar](../integrations/google-calendar/SETUP.md)
2. [Configurar n8n para voice-to-task](../integrations/n8n/README.md) (placeholder)
3. [Deploy a produccion](../deployment/) (placeholder)
4. [Personalizar la app](../customization/) (placeholder)

---

## Recursos Adicionales

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

Para preguntas especificas o problemas, consulta:

- [README.md](../../README.md) - Documentacion general
- [GETTING_STARTED.md](../../GETTING_STARTED.md) - Quick start
- [docs/troubleshooting/](../troubleshooting/) - Problemas comunes (placeholder)
- [lessons-learned/](../../lessons-learned/) - Lecciones aprendidas

---

**Ultima actualizacion**: 2025-11-11

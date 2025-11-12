# FocusOnIt - Task Manager

Aplicacion web de gestion de tareas extremadamente simple y practica, disenada para capturar tareas rapidamente y ver claramente que hacer HOY.

## Que hace FocusOnIt

FocusOnIt es un task manager completo y funcional que combina:

- Gestion de tareas con CRUD completo
- Temporizador Pomodoro integrado
- Entrada por voz (voice-to-task) via n8n
- Sincronizacion bidireccional con Google Calendar
- Actualizaciones en tiempo real con Supabase Realtime
- Autenticacion segura con Sign in with Google

## Por que existe

Creado para mejorar la productividad con una integracion completa entre tareas, temporizador y calendario, eliminando la friccion entre diferentes herramientas.

## Caracteristicas Principales

- Captura rapida de tareas sin friccion
- Vista "HOY" con tareas del dia y atrasadas
- Vista semanal organizada por dias
- Edicion inline de tareas
- Real-time updates con Supabase Realtime
- Autenticacion segura con Supabase Auth y Google OAuth
- Responsive design (PC, tablet, movil)
- Dark mode automatico
- Temporizador Pomodoro
- Voice-to-task con n8n workflows
- Google Calendar sync bidireccional

## Stack Tecnologico

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime)
- **Automatizacion:** n8n (self-hosted)
- **Integraciones:** Google Calendar API
- **Icons:** Lucide React
- **Dates:** date-fns
- **Notifications:** react-hot-toast

## Quick Start

### 1. Clonar repositorio

```bash
git clone <tu-repo>
cd task-manager
```

### 2. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. En el dashboard de Supabase, ve a SQL Editor
3. Copia y pega el contenido de `setup.sql`
4. Ejecuta el script (Run)

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raiz del proyecto:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Google Calendar OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
NEXTAUTH_SECRET=genera-un-secret-aleatorio-aqui

# n8n (opcional)
N8N_VOICE_TASK_WEBHOOK_URL=https://n8n.tudominio.com/webhook/voice-task
```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Documentacion Detallada

### Para Nuevos Desarrolladores
- **[NEXT_SESSION_START_HERE.md](NEXT_SESSION_START_HERE.md)** - Inicio rapido para retomar el proyecto
- **[SESSION_2025-11-11_CLOSURE_AND_NEXT_STEPS.md](SESSION_2025-11-11_CLOSURE_AND_NEXT_STEPS.md)** - Context completo de ultima sesion
- [GETTING_STARTED.md](GETTING_STARTED.md) - Guia de inicio paso a paso
- [CLAUDE.md](CLAUDE.md) - Manual completo para desarrolladores con Claude

### Documentacion Tecnica
- [docs/](docs/) - Documentacion completa organizada por temas
  - [Setup detallado](docs/setup/DETAILED_SETUP.md)
  - [Integracion Google Calendar](docs/integrations/google-calendar/)
  - [Arquitectura tecnica](docs/technical/)
  - [Deployments](docs/deployments/) - Historial de deployments y cambios
- [lessons-learned/](lessons-learned/) - Lecciones aprendidas y problemas resueltos
- [docs/roadmap/](docs/roadmap/) - Roadmap de desarrollo post-deployment

## Estado del Proyecto

**Fase actual:** MVP Funcional + Google Calendar Integration ✅
**Produccion:** https://focusonit.ycm360.com (ESTABLE)
**Ultimo deployment:** 2025-11-11

**Completado:**
- ✅ MVP completo y funcional
- ✅ Autenticacion con Google OAuth
- ✅ Google Calendar sync bidireccional
- ✅ Real-time updates activos
- ✅ Security headers y API protection
- ✅ Produccion estable y monitoreada

**En Progreso:**
- 🔄 Fase 1: Monitoring & Error Tracking (Sentry + Vercel Analytics)
- 📋 Voice-to-task integration (n8n workflows)

**Proximo:** Ver [roadmap completo](docs/roadmap/POST_DEPLOYMENT_ROADMAP.md) para proximas 7 fases

## Estructura del Proyecto

```
task-manager/
├── app/
│   ├── (auth)/              # Login, Signup
│   ├── (dashboard)/         # Vistas principales
│   ├── api/                 # API routes (webhooks, calendar)
│   └── globals.css
├── components/              # Componentes React
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── TaskInput.tsx
│   ├── TaskList.tsx
│   └── TaskItem.tsx
├── lib/
│   ├── supabase/           # Clientes Supabase
│   ├── hooks/              # Custom hooks
│   ├── google-calendar/    # Integracion Google Calendar
│   └── utils/              # Utilidades (timezone, etc)
├── types/                  # TypeScript types
├── docs/                   # Documentacion
├── middleware.ts           # Auth middleware
└── setup.sql              # Script de base de datos
```

## Uso de la Aplicacion

### Crear cuenta y login

1. Ve a `/signup` para crear tu cuenta o usa "Sign in with Google"
2. Inicia sesion en `/login`

### Captura rapida de tareas

- Escribe en el input superior y presiona Enter para crear tarea sin fecha
- Shift + Enter o clic en el icono de calendario para abrir modal con opciones completas

### Gestionar tareas

- **Completar:** Click en el checkbox
- **Editar:** Click en el titulo de la tarea
- **Cambiar fecha:** Hover y click en icono de calendario
- **Eliminar:** Hover y click en icono de papelera

### Vistas disponibles

- **HOY** (`/today`): Tareas de hoy + atrasadas + sin fecha
- **SEMANA** (`/week`): Proximos 7 dias agrupados
- **TODAS** (`/all`): Lista completa de pendientes
- **COMPLETADAS** (`/completed`): Ultimas 30 dias

## Seguridad

- Row Level Security (RLS) activado: usuarios solo ven sus propias tareas
- Middleware protege rutas del dashboard
- Autenticacion manejada completamente por Supabase Auth
- Google OAuth para sign in rapido y seguro

## Deploy a Produccion

### Opcion 1: Vercel (Recomendado)

1. Sube tu codigo a GitHub
2. Importa el proyecto en [vercel.com](https://vercel.com)
3. **IMPORTANTE:** Configura variables de entorno correctamente:
   - `NEXT_PUBLIC_SUPABASE_URL` → **Type: Plaintext** (NO Encrypted)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **Type: Plaintext** (NO Encrypted)
   - `SUPABASE_SERVICE_ROLE_KEY` → **Type: Encrypted**
   - `GOOGLE_CLIENT_SECRET` → **Type: Encrypted**

   **Por que:** El middleware ejecuta en Edge Runtime y no puede acceder a variables encriptadas. Ver [docs/deployment/VERCEL_ENV_VARS.md](./docs/deployment/VERCEL_ENV_VARS.md) para detalles completos.

4. Deploy automatico

**Variables requeridas para produccion:**
```bash
# Edge Runtime (MUST be Plaintext)
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Node.js Runtime (Should be Encrypted)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/oauth/callback
```

### Opcion 2: Docker Self-Hosted

```bash
# Construir imagen
docker build -t focusonit .

# Ejecutar
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=tu-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key \
  focusonit
```

## Troubleshooting

### Error: "Failed to fetch tasks"

- Verifica que las variables de entorno esten correctas
- Confirma que ejecutaste `setup.sql` en Supabase
- Revisa que RLS este activado y las politicas creadas

### Error: "User not authenticated"

- Asegurate de haber confirmado tu email (si esta activado en Supabase)
- Verifica que el middleware este funcionando

### Real-time no funciona

- Verifica que Realtime este activado en Supabase (Settings → API)
- Confirma que estas en el plan correcto (free tier tiene limites)

Para mas soluciones, consulta la seccion de troubleshooting en [docs/troubleshooting/](docs/troubleshooting/) o revisa [lessons-learned/](lessons-learned/).

## Licencia

MIT

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Soporte

Si encuentras algun problema o tienes preguntas:

- Abre un issue en GitHub
- Revisa la documentacion de [Next.js](https://nextjs.org/docs) y [Supabase](https://supabase.com/docs)
- Consulta la documentacion en [docs/](docs/)

---

Hecho con dedicacion para mejorar tu productividad

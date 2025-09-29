# FocusOnIt - Task Manager

Aplicación web de gestión de tareas extremadamente simple y práctica, diseñada para capturar tareas rápidamente y ver claramente qué hacer HOY.

## 🎯 Características Principales

- ✅ **Captura rápida de tareas** sin fricción
- 📅 **Vista "HOY"** con tareas del día y atrasadas
- 📊 **Vista semanal** organizada por días
- 📝 **Edición inline** de tareas
- ✨ **Real-time updates** con Supabase Realtime
- 🔒 **Autenticación segura** con Supabase Auth
- 📱 **Responsive design** (PC, tablet, móvil)
- 🌙 **Dark mode** automático

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime)
- **Icons:** Lucide React
- **Dates:** date-fns
- **Notifications:** react-hot-toast

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase (gratuita o self-hosted)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd task-manager
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

#### Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. Espera a que el proyecto esté listo (2-3 minutos)

#### Ejecutar el script SQL

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Crea una nueva query
3. Copia y pega el contenido de `setup.sql`
4. Ejecuta el script (Run)

Esto creará:
- Tabla `tasks` con todos los campos necesarios
- Políticas de Row Level Security (RLS)
- Índices para optimizar performance
- Trigger para `updated_at` automático

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

**¿Dónde encontrar las keys?**
1. Dashboard de Supabase → **Settings** → **API**
2. Copia `URL`, `anon public` key y `service_role` key

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📱 Uso de la Aplicación

### Crear cuenta y login

1. Ve a `/signup` para crear tu cuenta
2. Verifica tu email (si lo configuraste en Supabase)
3. Inicia sesión en `/login`

### Captura rápida de tareas

- Escribe en el input superior y presiona **Enter** → crea tarea sin fecha
- **Shift + Enter** o clic en el ícono de calendario → abre modal con opciones completas

### Gestionar tareas

- **Completar:** Click en el checkbox ✓
- **Editar:** Click en el título de la tarea
- **Cambiar fecha:** Hover y click en ícono de calendario
- **Eliminar:** Hover y click en ícono de papelera

### Vistas disponibles

- **HOY** (`/today`): Tareas de hoy + atrasadas + sin fecha
- **SEMANA** (`/week`): Próximos 7 días agrupados
- **TODAS** (`/all`): Lista completa de pendientes
- **COMPLETADAS** (`/completed`): Últimas 30 días

## 🏗️ Estructura del Proyecto

```
task-manager/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Página de login
│   │   └── signup/page.tsx         # Página de registro
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Layout con sidebar
│   │   ├── today/page.tsx          # Vista HOY
│   │   ├── week/page.tsx           # Vista SEMANA
│   │   ├── all/page.tsx            # Todas las tareas
│   │   └── completed/page.tsx      # Tareas completadas
│   ├── globals.css                 # Estilos globales
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Redirect a /today
├── components/
│   ├── Navbar.tsx                  # Header con logout
│   ├── Sidebar.tsx                 # Navegación lateral
│   ├── TaskInput.tsx               # Input de captura rápida
│   ├── TaskList.tsx                # Lista de tareas
│   └── TaskItem.tsx                # Componente individual de tarea
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Cliente browser
│   │   ├── server.ts               # Cliente servidor
│   │   └── middleware.ts           # Auth middleware
│   └── hooks/
│       ├── useAuth.ts              # Hook de autenticación
│       └── useTasks.ts             # Hook con real-time
├── types/
│   └── database.types.ts           # Tipos de Supabase
├── middleware.ts                   # Protección de rutas
├── setup.sql                       # Script de base de datos
└── README.md
```

## 🔐 Seguridad

- **Row Level Security (RLS)** activado: usuarios solo ven sus propias tareas
- **Middleware** protege rutas del dashboard
- **Autenticación** manejada completamente por Supabase Auth

## 🚀 Deploy a Producción

### Opción 1: Vercel (Recomendado)

1. Sube tu código a GitHub
2. Importa el proyecto en [vercel.com](https://vercel.com)
3. Agrega las variables de entorno en **Settings → Environment Variables**
4. Deploy automático ✅

### Opción 2: Docker Self-Hosted

```bash
# Construir imagen
docker build -t focusonit .

# Ejecutar
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=tu-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key \
  focusonit
```

## 🔮 Roadmap (Próximas Fases)

### Fase 2: Webhooks para n8n
- Endpoint `/api/webhooks/task-completed`
- Automatizaciones con n8n (emails, notificaciones, etc.)

### Fase 3: Integración con Google Calendar
- Sync bidireccional de tareas con Google Calendar
- Campo `google_event_id` ya está en el schema

### Fase 4: Features adicionales
- Entrada con lenguaje natural ("mañana a las 3pm")
- Etiquetas/categorías
- Subtareas
- Modo offline (PWA)
- Gestos táctiles (swipe para completar/eliminar)

## 🐛 Troubleshooting

### Error: "Failed to fetch tasks"
- Verifica que las variables de entorno estén correctas
- Confirma que ejecutaste `setup.sql` en Supabase
- Revisa que RLS esté activado y las políticas creadas

### Error: "User not authenticated"
- Asegúrate de haber confirmado tu email (si está activado en Supabase)
- Verifica que el middleware esté funcionando

### Real-time no funciona
- Verifica que Realtime esté activado en Supabase (Settings → API)
- Confirma que estás en el plan correcto (free tier tiene límites)

## 📄 Licencia

MIT

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:
1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 💬 Soporte

Si encuentras algún problema o tienes preguntas:
- Abre un issue en GitHub
- Revisa la documentación de [Next.js](https://nextjs.org/docs) y [Supabase](https://supabase.com/docs)

---

Hecho con ❤️ para mejorar tu productividad
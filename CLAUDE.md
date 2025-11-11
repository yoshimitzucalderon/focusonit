# CLAUDE.md - Manual de Instrucciones del Proyecto

**Proyecto:** FocusOnIt Task Manager
**Version:** MVP v0.1.0 + Google Calendar Integration
**Ultima actualizacion:** 11 de noviembre de 2025
**Proposito:** Manual de referencia para Claude, desarrolladores y mantenedores del proyecto

---

## TABLA DE CONTENIDOS

1. [Overview del Proyecto](#1-overview-del-proyecto)
2. [Reglas de Organizacion](#2-reglas-de-organizacion)
3. [Reglas de Documentacion](#3-reglas-de-documentacion)
4. [Stack Tecnico y Decisiones](#4-stack-tecnico-y-decisiones)
5. [Workflow de Desarrollo](#5-workflow-de-desarrollo)
6. [Problemas Conocidos y Soluciones](#6-problemas-conocidos-y-soluciones)
7. [Integraciones](#7-integraciones)
8. [Reglas para Claude](#8-reglas-para-claude)

---

## 1. OVERVIEW DEL PROYECTO

### Que es FocusOnIt

FocusOnIt es una aplicacion web de gestion de tareas extremadamente simple y practica, disenada para capturar tareas rapidamente y ver claramente que hacer HOY. Se enfoca en la simplicidad y la captura rapida sin friccion, eliminando la complejidad innecesaria de otras herramientas de productividad.

La filosofia del proyecto es: **"Si no es facil de usar, no se usara"**.

### Fase Actual del Desarrollo

**Estado:** MVP COMPLETO Y FUNCIONAL + Google Calendar Integration

**Fase 1 (MVP):** COMPLETADO
- Autenticacion de usuarios (Supabase Auth + Google Sign-In)
- CRUD de tareas con edicion inline
- Vista HOY (tareas del dia + atrasadas)
- Vista SEMANAL organizada por dias
- Real-time sync entre dispositivos
- Timer Pomodoro integrado
- Dark mode automatico
- Responsive design (PC, tablet, movil)

**Fase 2 (Google Calendar Integration):** COMPLETADO
- Autenticacion OAuth con Google
- Sincronizacion bidireccional de tareas con Google Calendar
- Importacion masiva de eventos existentes
- Manejo de creacion, edicion y eliminacion en ambas direcciones
- Token refresh automatico
- Manejo de errores y reintento de sincronizacion

**Fase 3 (Integracion n8n - Voice to Task):** EN DESARROLLO
- Workflow n8n para convertir notas de voz a tareas
- API endpoints para recibir transcripciones
- Parsing inteligente de fechas y descripciones

### Objetivos Principales

1. **Captura ultra-rapida:** Minimo 2 segundos desde idea hasta tarea guardada
2. **Claridad visual:** Ver todo lo importante en 1 pantalla (HOY)
3. **Confiabilidad:** Nunca perder datos, sincronizacion en tiempo real
4. **Simplicidad:** Cero configuracion, cero curva de aprendizaje
5. **Escalabilidad:** Base solida para features avanzadas futuras

---

## 2. REGLAS DE ORGANIZACION

### Estructura de Carpetas (Propuesta en Implementacion)

```
task-manager/
├── README.md                    # Documentacion tecnica principal
├── GETTING_STARTED.md           # Guia de inicio rapido (futuro)
├── CLAUDE.md                    # Este archivo
├── CHANGELOG.md                 # Historial de cambios (futuro)
│
├── docs/                        # Toda la documentacion (nueva estructura)
│   ├── README.md                # Indice maestro
│   ├── setup/                   # Guias de configuracion
│   ├── features/                # Documentacion de features
│   ├── integrations/            # Integraciones externas
│   │   ├── google-calendar/     # Google Calendar sync
│   │   ├── google-oauth/        # Google OAuth setup
│   │   └── n8n/                 # n8n workflows
│   ├── api/                     # Documentacion de API endpoints
│   ├── technical/               # Arquitectura y documentacion tecnica
│   ├── troubleshooting/         # Solucion de problemas
│   └── guides/                  # Guias de desarrollo
│
├── lessons-learned/             # Sistema de lecciones aprendidas (nuevo)
│   ├── README.md                # Introduccion al sistema
│   ├── TEMPLATE.md              # Template para nuevas lecciones
│   ├── INDEX.md                 # Indice maestro
│   ├── by-category/             # Organizadas por tecnologia
│   └── by-date/                 # Organizadas cronologicamente
│
├── scripts/                     # Scripts utiles (futuro)
│   ├── verify-setup.js          # Verificacion de configuracion
│   └── utils/                   # Utilidades varias
│
├── app/                         # Next.js app (App Router)
│   ├── (auth)/                  # Rutas de autenticacion
│   ├── (dashboard)/             # Dashboard principal
│   ├── api/                     # API routes
│   └── layout.tsx               # Layout principal
│
├── components/                  # React components
│   ├── auth/                    # Componentes de autenticacion
│   ├── tasks/                   # Componentes de tareas
│   ├── calendar/                # Componentes de calendario
│   ├── ui/                      # Componentes UI reutilizables
│   └── pomodoro/                # Timer Pomodoro
│
├── lib/                         # Utilidades y funciones
│   ├── supabase/                # Clientes Supabase
│   ├── google-calendar/         # API de Google Calendar
│   └── utils/                   # Funciones utiles
│
├── hooks/                       # Custom React hooks
├── context/                     # React Context providers
├── types/                       # TypeScript types
├── public/                      # Assets estaticos
└── supabase/                    # Configuracion Supabase
    └── migrations/              # Migraciones de BD
```

### Convenciones de Nombres

**Archivos y Carpetas:**
- Componentes React: `PascalCase.tsx` (TaskItem.tsx, PomodoroTimer.tsx)
- Utilidades: `camelCase.ts` (dateUtils.ts, taskHelpers.ts)
- API routes: `kebab-case/route.ts` (voice-to-task/route.ts)
- Markdown: `SCREAMING_SNAKE_CASE.md` (README.md, GETTING_STARTED.md)
- Carpetas: `kebab-case/` (google-calendar/, lessons-learned/)

**Variables y Funciones:**
- Variables: `camelCase` (taskList, currentUser)
- Funciones: `camelCase` (fetchTasks, handleSubmit)
- Constantes: `SCREAMING_SNAKE_CASE` (API_BASE_URL, MAX_RETRIES)
- Tipos/Interfaces: `PascalCase` (Task, UserProfile, CalendarEvent)

**Base de Datos:**
- Tablas: `snake_case` plural (tasks, user_google_tokens)
- Columnas: `snake_case` (due_date, google_calendar_sync, calendar_event_id)
- Funciones/Triggers: `snake_case` (update_updated_at_column)

### Donde Documentar Nuevas Features

| Tipo de Contenido | Ubicacion | Ejemplo |
|-------------------|-----------|---------|
| **Feature nueva** | `docs/features/FEATURE_NAME.md` | Timer Pomodoro → `docs/features/POMODORO_TIMER.md` |
| **API endpoint nuevo** | `docs/api/ENDPOINT_NAME.md` | POST /api/voice-to-task → `docs/api/VOICE_TO_TASK.md` |
| **Integracion externa** | `docs/integrations/nombre/` | Google Calendar → `docs/integrations/google-calendar/` |
| **Configuracion/Setup** | `docs/setup/TOPIC.md` | Deployment → `docs/setup/DEPLOYMENT.md` |
| **Problema resuelto** | `lessons-learned/by-date/YYYY-MM-DD-titulo.md` | Bug timezone → `lessons-learned/by-date/2025-10-05-timezone-bug.md` |
| **Guia de desarrollo** | `docs/guides/TOPIC.md` | Testing → `docs/guides/TESTING.md` |

**Regla de oro:** Si una feature requiere mas de 5 minutos de explicacion, merece su propio documento.

### Nueva Estructura Propuesta (En Transicion)

Ver documento `PLAN_REORGANIZACION_PROYECTO.md` para detalles completos de la reorganizacion en curso. La estructura actual esta en transicion hacia una organizacion mas escalable con carpetas tematicas.

**Referencias:**
- Auditoria completa: `AUDITORIA_DOCUMENTACION.md`
- Plan de reorganizacion: `PLAN_REORGANIZACION_PROYECTO.md`
- Matriz de contenido: `MATRIZ_CONTENIDO_DOCS.md`

---

## 3. REGLAS DE DOCUMENTACION

### Sistema de Lecciones Aprendidas

**Proposito:** Documentar problemas complejos y sus soluciones para evitar repetir errores y acelerar onboarding.

**Estructura:**
```
lessons-learned/
├── TEMPLATE.md              # Template para nuevas lecciones
├── by-category/             # Organizadas por tecnologia
│   ├── supabase.md          # Lecciones de Supabase
│   ├── google-calendar.md   # Lecciones de Google Calendar
│   ├── nextjs.md            # Lecciones de Next.js
│   └── ...
└── by-date/                 # Organizadas cronologicamente
    ├── 2025-10-05-timezone-bug.md
    ├── 2025-10-21-oauth-token-refresh.md
    └── 2025-11-11-calendar-sync-deletion.md
```

### Cuando Documentar en lessons-learned/

Documenta cuando:
- ✅ Problema tomo mas de 1 hora resolver
- ✅ Bug en produccion o staging
- ✅ Configuracion compleja que costo entender
- ✅ Solucion no obvia o contra-intuitiva
- ✅ Algo que puede beneficiar al resto del equipo
- ✅ Error que podria repetirse en el futuro

NO documentes cuando:
- ❌ Error tipografico o typo simple
- ❌ Problema resuelto en menos de 15 minutos
- ❌ Issue especifico de entorno local
- ❌ Problema ya documentado en lecciones existentes

### Como Documentar una Leccion Aprendida

1. **Durante la resolucion:** Tomar notas de pasos, hipotesis, intentos
2. **Al resolver:** Copiar `lessons-learned/TEMPLATE.md`
3. **Completar todas las secciones** del template
4. **Guardar en by-date/** con formato `YYYY-MM-DD-titulo-corto.md`
5. **Actualizar by-category/** agregando referencia
6. **Commit:** `docs: add lesson learned - [titulo corto]`

### Formato Estandar para Bugs Resueltos

Usar el template de `lessons-learned/TEMPLATE.md` que incluye:

**Estructura:**
- Resumen ejecutivo (2-3 lineas)
- Contexto (que estabamos haciendo, ambiente)
- El problema (sintomas, como lo detectamos)
- Causa raiz (explicacion tecnica)
- La solucion (pasos, codigo, archivos modificados)
- Prevencion futura (como evitar que vuelva a pasar)
- Aprendizajes clave (3-5 lecciones)
- Recursos relacionados (links)

### Catalogacion por Keywords

Al documentar en `lessons-learned/`, SIEMPRE incluir keywords en:

**Categorias disponibles:**
- `supabase` - Base de datos, RLS, migraciones, auth
- `google-calendar` - Sincronizacion, OAuth, eventos
- `docker` - Contenedores, compose, networking
- `kong` - API Gateway, routing, plugins
- `n8n` - Workflows, automatizaciones, webhooks
- `nextjs` - SSR, routing, API routes, middleware
- `typescript` - Tipos, interfaces, errores de compilacion

**En el archivo:** Agregar campo `Categoria:` en metadata del documento.

**Ejemplo:**
```markdown
# Bug de Fechas: Timezone del Pacifico Causa Desfase de Dias

**Fecha:** 2025-10-05
**Categoria:** nextjs, typescript, supabase
**Severidad:** Alta
```

### Template de Lessons Learned

Ver archivo completo en `lessons-learned/TEMPLATE.md`. Usar SIEMPRE este template para mantener consistencia.

---

## 4. STACK TECNICO Y DECISIONES

### Tecnologias Principales

#### Next.js 14 (App Router)
**Por que:**
- App Router ofrece mejor organizacion con Server Components
- Rutas de API integradas (`app/api/`)
- Middleware para proteccion de rutas
- Optimizaciones automaticas (imagenes, fonts, code splitting)

**Decisiones clave:**
- Usar Server Components por defecto, Client Components solo cuando sea necesario
- Server Actions para mutaciones de datos (`app/actions.ts`)
- API Routes para webhooks externos (`app/api/voice-to-task/route.ts`)

#### TypeScript
**Por que:**
- Type safety previene bugs en compilacion
- IntelliSense mejora productividad
- Mejor mantenibilidad a largo plazo

**Decisiones clave:**
- Tipos estrictos habilitados (`strict: true`)
- Interfaces para modelos de datos (`types/database.ts`)
- Generacion automatica de tipos de Supabase

#### Supabase (Backend as a Service)
**Por que:**
- PostgreSQL completo (relacional, confiable, escalable)
- Auth incluida (email/password + OAuth providers)
- Real-time subscriptions out-of-the-box
- Row Level Security para seguridad granular
- Self-hosting disponible para produccion

**Decisiones clave:**
- RLS para TODAS las tablas (nunca confiar solo en frontend)
- Service Role Key SOLO en server-side code
- Real-time channels para sync instantaneo
- Migraciones versionadas en `supabase/migrations/`

#### Tailwind CSS
**Por que:**
- Utility-first permite prototipado rapido
- Purge CSS elimina estilos no usados (bundle pequeno)
- Dark mode integrado
- Responsive design simplificado

**Decisiones clave:**
- Configuracion custom en `tailwind.config.ts`
- Colores consistentes en todo el proyecto
- Componentes reutilizables en `components/ui/`

#### Google Calendar API
**Por que:**
- Sincronizacion bidireccional de tareas con calendario
- OAuth 2.0 para autenticacion segura
- API robusta y bien documentada

**Decisiones clave:**
- Token refresh automatico con Supabase
- Sincronizacion incremental (solo cambios recientes)
- Manejo de conflictos: Last write wins
- Tabla `user_google_tokens` para almacenar credenciales

#### n8n (Workflow Automation)
**Por que:**
- Visual workflow builder (facil de mantener)
- Conectores pre-construidos (Telegram, OpenAI, webhooks)
- Self-hosted (control total de datos)
- Comunidad activa

**Decisiones clave:**
- n8n para voice-to-task workflow
- API endpoints en Next.js reciben datos procesados
- Parsing de fechas naturales ("manana", "proximo lunes")

### Patrones de Arquitectura

#### Server Components por Defecto
```typescript
// app/(dashboard)/page.tsx - Server Component
export default async function DashboardPage() {
  // Fetch data en servidor
  const supabase = createServerClient()
  const { data: tasks } = await supabase.from('tasks').select('*')

  return <TaskList tasks={tasks} />
}
```

#### Client Components Solo Cuando Necesario
```typescript
// components/TaskInput.tsx - Client Component (usa hooks)
'use client'

export function TaskInput() {
  const [value, setValue] = useState('')
  // ... interactividad
}
```

#### Server Actions para Mutaciones
```typescript
// app/actions.ts
'use server'

export async function createTask(formData: FormData) {
  const supabase = createServerClient()
  // ... logica de creacion
  revalidatePath('/dashboard')
}
```

#### Custom Hooks para Logica Reutilizable
```typescript
// hooks/useTasks.ts
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  // ... logica de fetch y subscribe
  return { tasks, loading, error }
}
```

#### Context para Estado Global
```typescript
// context/CalendarContext.tsx
export const CalendarContext = createContext<CalendarContextType>(null)

export function CalendarProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)
  // ... estado de sincronizacion
  return (
    <CalendarContext.Provider value={{ isConnected, ... }}>
      {children}
    </CalendarContext.Provider>
  )
}
```

### Convenciones de Codigo

**Imports:**
```typescript
// 1. Librerias externas
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// 2. Componentes internos
import { TaskItem } from '@/components/tasks/TaskItem'
import { Button } from '@/components/ui/Button'

// 3. Utilidades
import { formatDate } from '@/lib/utils/dates'

// 4. Tipos
import type { Task } from '@/types/database'

// 5. Estilos (si aplica)
import styles from './Component.module.css'
```

**Funciones:**
- Usar arrow functions para funciones puras
- Usar function declarations para componentes React
- Async/await en lugar de .then()

**Nomenclatura:**
- Boolean props: `isLoading`, `hasError`, `canEdit`
- Event handlers: `handleClick`, `handleSubmit`, `handleChange`
- Fetchers: `fetchTasks`, `getTasks`, `loadUser`

**Comentarios:**
- JSDoc para funciones complejas
- Comentarios en linea para logica no obvia
- TODO/FIXME con contexto

```typescript
/**
 * Parsea una fecha en formato string (YYYY-MM-DD) a Date object
 * sin conversiones de timezone
 *
 * @param dateStr - Fecha en formato YYYY-MM-DD
 * @returns Date object en timezone local
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}
```

---

## 5. WORKFLOW DE DESARROLLO

### Como Trabajar con Este Proyecto

#### Setup Inicial (Primera Vez)

1. **Clonar repositorio:**
   ```bash
   git clone <repo-url>
   cd task-manager
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar Supabase:**
   - Crear proyecto en supabase.com o self-hosted
   - Ejecutar `setup.sql` en SQL Editor
   - Copiar credenciales

4. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env.local
   # Editar .env.local con credenciales
   ```

5. **Verificar setup:**
   ```bash
   npm run verify
   ```

6. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

#### Comandos Importantes

| Comando | Descripcion | Cuando Usar |
|---------|-------------|-------------|
| `npm run dev` | Inicia servidor de desarrollo | Siempre que trabajes localmente |
| `npm run build` | Build de produccion | Antes de deploy, verificar errores |
| `npm run start` | Ejecuta build de produccion | Probar version de produccion localmente |
| `npm run lint` | ESLint para encontrar errores | Antes de commit |
| `npm run verify` | Verifica configuracion de Supabase | Despues de cambios en BD o .env |

#### Desarrollo de Nueva Feature

1. **Crear rama:**
   ```bash
   git checkout -b feature/nombre-feature
   ```

2. **Desarrollar feature:**
   - Escribir codigo
   - Probar localmente
   - Agregar tipos TypeScript
   - Actualizar documentacion

3. **Documentar:**
   - Si es feature nueva: crear `docs/features/FEATURE.md`
   - Si es API endpoint: crear `docs/api/ENDPOINT.md`
   - Si resuelve bug complejo: crear leccion aprendida

4. **Commit:**
   ```bash
   git add .
   git commit -m "feat: descripcion clara de la feature"
   ```

5. **Push y PR:**
   ```bash
   git push -u origin feature/nombre-feature
   # Crear Pull Request en GitHub
   ```

#### Fix de Bug

1. **Crear rama:**
   ```bash
   git checkout -b fix/descripcion-bug
   ```

2. **Reproducir bug:**
   - Documentar pasos para reproducir
   - Identificar causa raiz

3. **Implementar fix:**
   - Resolver bug
   - Agregar test si es posible
   - Verificar que no rompe nada mas

4. **Documentar (si es complejo):**
   - Crear leccion aprendida en `lessons-learned/by-date/`
   - Actualizar `lessons-learned/by-category/[tech].md`

5. **Commit:**
   ```bash
   git commit -m "fix: descripcion del bug resuelto"
   ```

### Donde Buscar Informacion

| Necesitas... | Busca en... |
|--------------|-------------|
| **Empezar el proyecto** | README.md → Instalacion |
| **Configurar Google Calendar** | GOOGLE_CALENDAR_SETUP.md |
| **Configurar Google OAuth** | GOOGLE_SIGN_IN_IMPLEMENTATION.md o SELFHOSTED |
| **Arquitectura del sistema** | PROJECT_SUMMARY.md |
| **Problema de fechas/timezone** | FIX-FECHAS-DEFINITIVO.md |
| **Setup Pomodoro** | docs/POMODORO_SETUP.md |
| **Problema conocido** | lessons-learned/by-category/ |
| **Commits recientes** | `git log --oneline -20` |
| **Issues en GitHub** | Repositorio GitHub (si existe) |

**Orden recomendado para nuevo desarrollador:**
1. README.md (overview)
2. START_HERE.md o WELCOME.md (setup rapido)
3. PROJECT_SUMMARY.md (detalles tecnicos)
4. lessons-learned/README.md (conocimiento del equipo)

### Git Workflow

#### Conventional Commits

Usar formato: `<tipo>(<scope>): <descripcion>`

**Tipos:**
- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Solo documentacion
- `refactor`: Refactorizacion sin cambio de funcionalidad
- `style`: Cambios de formato (espacios, comas, etc)
- `test`: Agregar tests
- `chore`: Cambios en build, CI, dependencias

**Ejemplos:**
```bash
git commit -m "feat(calendar): add bidirectional sync for task deletion"
git commit -m "fix(auth): resolve Google OAuth token refresh duplicate key error"
git commit -m "docs: add lesson learned for timezone bug"
git commit -m "refactor(tasks): extract task filtering logic to custom hook"
```

#### Branching Strategy

**Main branch:** `main` (siempre estable, deployable)

**Feature branches:**
- `feature/nombre-feature` - Nueva funcionalidad
- `fix/descripcion-bug` - Bug fix
- `docs/tema` - Documentacion
- `refactor/componente` - Refactorizacion

**Ejemplo:**
```bash
# Feature
git checkout -b feature/voice-to-task
# ... trabajo ...
git push -u origin feature/voice-to-task

# Fix
git checkout -b fix/calendar-sync-deletion
# ... trabajo ...
git push -u origin fix/calendar-sync-deletion
```

#### Pull Requests

**Titulo:** Similar a commit message
```
feat(calendar): add bidirectional sync for task deletion
```

**Descripcion:** Incluir
- Que cambia
- Por que cambia
- Como probar
- Screenshots si aplica

---

## 6. PROBLEMAS CONOCIDOS Y SOLUCIONES

### Sistema de Lecciones Aprendidas

Ver directorio `lessons-learned/` para catalogo completo de problemas resueltos, organizados por:
- **Categoria tecnologica:** `lessons-learned/by-category/[tech].md`
- **Orden cronologico:** `lessons-learned/by-date/YYYY-MM-DD-titulo.md`

### Issues Comunes (Basados en Commits Recientes)

#### 1. Deletion Sync and UI Update Issues

**Commits relacionados:**
- `7ebb9a6` - fix: resolve deletion sync and UI update issues
- `c735816` - feat: implement bidirectional deletion for Google Calendar sync

**Problema:**
Eliminar tarea en la app no eliminaba evento en Google Calendar, o viceversa. UI no se actualizaba correctamente despues de eliminacion.

**Solucion:**
- Implementar eliminacion bidireccional con webhook
- Usar service role client para operaciones de BD desde webhook
- Actualizar UI con revalidatePath() o Real-time subscription

**Referencia:** Ver `lessons-learned/by-date/2025-11-11-calendar-sync-deletion.md` (cuando se cree)

#### 2. Google Calendar Token Refresh Duplicate Key Error

**Commit relacionado:**
- `bdd30db` - fix: resolve Google Calendar token refresh duplicate key error

**Problema:**
Al refrescar tokens de Google, error de duplicate key violates unique constraint.

**Causa:**
Intentar hacer INSERT cuando ya existe un registro para ese user_id.

**Solucion:**
Usar UPSERT con `ON CONFLICT (user_id) DO UPDATE`:

```sql
INSERT INTO user_google_tokens (user_id, access_token, refresh_token, expires_at)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id)
DO UPDATE SET
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW()
```

**Leccion:** Siempre usar UPSERT cuando el registro puede existir.

**Referencia:** `lessons-learned/by-category/supabase.md`

#### 3. Google Calendar Sync Configuration

**Commits relacionados:**
- `55e2e7b` - fix: set google_calendar_sync=true when creating tasks with dates
- `3d75aaf` - debug: add detailed sync logging

**Problema:**
Tareas creadas desde la app no se sincronizaban con Google Calendar automaticamente.

**Causa:**
Campo `google_calendar_sync` no se configuraba en `true` al crear tareas con fechas.

**Solucion:**
```typescript
// Al crear tarea con due_date
const task = {
  title: 'Nueva tarea',
  due_date: '2025-11-15',
  google_calendar_sync: true, // ← Crucial
  // ...
}
```

**Leccion:** Si una tarea tiene fecha, probablemente debe sincronizarse con calendario.

#### 4. Timezone Bug (Historico - Resuelto)

**Problema:**
Fechas aparecian un dia antes debido a conversion de timezone.

**Solucion:**
Usar date-only strings (YYYY-MM-DD) sin timestamps.

**Utilidades creadas:**
```typescript
// lib/utils/dates.ts
export function parseDateString(dateStr: string): Date
export function toDateOnlyString(date: Date): string
```

**Referencia completa:** `FIX-FECHAS-DEFINITIVO.md` y `TIMEZONE-IMPLEMENTATION.md`

**Leccion aprendida:** Ver `lessons-learned/by-date/2025-10-05-timezone-bug.md` (cuando se migre)

### Troubleshooting Rapido

| Problema | Solucion Rapida |
|----------|-----------------|
| **Error: Supabase URL no configurada** | Verificar `.env.local` con credenciales correctas |
| **Error: Cannot connect to Supabase** | Verificar que proyecto Supabase esta activo |
| **Tareas no aparecen** | Verificar RLS policies en Supabase, verificar autenticacion |
| **Real-time no funciona** | Verificar que Realtime esta habilitado en Supabase |
| **Google Calendar no sincroniza** | Verificar tokens en `user_google_tokens`, refrescar OAuth |
| **Fechas desfasadas** | Usar `parseDateString()` y `toDateOnlyString()` |
| **Build falla** | Ejecutar `npm run lint` y corregir errores TypeScript |
| **Puerto 3000 ocupado** | Matar proceso (`lsof -ti:3000 | xargs kill`) o usar otro puerto |

---

## 7. INTEGRACIONES

### Google Calendar Sync (Bidireccional)

**Estado:** IMPLEMENTADO Y FUNCIONAL

**Funcionalidad:**
- Autenticacion OAuth 2.0 con Google
- Sincronizacion bidireccional (app ↔ Google Calendar)
- Creacion automatica de eventos al agregar tarea con fecha
- Actualizacion de eventos al editar tarea
- Eliminacion de eventos al eliminar tarea
- Importacion masiva de eventos existentes
- Token refresh automatico

**Arquitectura:**

```
App (Next.js) ←→ Supabase ←→ Google Calendar API
                     ↓
               Real-time Sync
                     ↓
            Otros dispositivos
```

**Componentes principales:**
- `components/calendar/CalendarStatus.tsx` - UI de estado de sincronizacion
- `lib/google-calendar/sync.ts` - Logica de sincronizacion
- `app/api/calendar/` - Endpoints de OAuth y sync
- `hooks/useCalendarSync.ts` - Hook para estado de sincronizacion

**Tablas Supabase:**
- `tasks` - Campo `google_calendar_sync: boolean`, `calendar_event_id: string`
- `user_google_tokens` - Tokens OAuth (access, refresh, expires_at)

**Configuracion:**
Ver documentos:
- Setup paso a paso: `GOOGLE_CALENDAR_SETUP.md`
- Documentacion tecnica: `GOOGLE_CALENDAR_INTEGRATION.md`

**Endpoints API:**
```typescript
GET  /api/calendar/connect      // Iniciar OAuth flow
GET  /api/calendar/oauth/callback // Callback de OAuth
POST /api/calendar/disconnect   // Desconectar cuenta
GET  /api/calendar/status       // Estado de conexion
POST /api/calendar/sync         // Sincronizar cambios
POST /api/calendar/import       // Importar eventos existentes
POST /api/calendar/delete-event // Eliminar evento especifico
```

### Google OAuth (Cloud + Self-hosted)

**Estado:** IMPLEMENTADO

**Proposito:**
- "Sign in with Google" para usuarios finales
- Permisos de Google Calendar API

**Configuracion:**

**Supabase Cloud:**
Ver `GOOGLE_SIGN_IN_IMPLEMENTATION.md`

**Supabase Self-hosted:**
Ver:
- `GOOGLE_SIGN_IN_SELFHOSTED.md`
- `CONFIGURE_GOOGLE_OAUTH_SELFHOSTED.md`
- `SETUP_GOOGLE_OAUTH_YCM360.md` (servidor especifico)

**Flujo:**
1. Usuario hace clic en "Sign in with Google"
2. Redirect a Google OAuth consent screen
3. Usuario autoriza permisos
4. Callback a `/api/auth/callback`
5. Supabase crea usuario y sesion
6. Redirect a dashboard

**Scopes solicitados:**
- `openid` - Identificacion basica
- `email` - Email del usuario
- `profile` - Nombre y foto
- `https://www.googleapis.com/auth/calendar.events` - Acceso a Calendar

### n8n Workflows (Voice-to-Task)

**Estado:** EN DESARROLLO

**Proposito:**
Convertir notas de voz (Telegram, WhatsApp) en tareas automaticamente.

**Arquitectura propuesta:**
```
Usuario → Telegram/WhatsApp → n8n Workflow → OpenAI/Claude → API Next.js → Supabase
```

**Workflow:**
1. Usuario envia nota de voz a bot de Telegram
2. n8n transcribe audio (Whisper API o similar)
3. n8n procesa texto con LLM para extraer:
   - Titulo de tarea
   - Descripcion
   - Fecha (parsing natural: "manana", "proximo lunes")
   - Prioridad
4. n8n envia POST a `/api/voice-to-task`
5. Next.js crea tarea en Supabase
6. Real-time sync actualiza UI

**Archivos n8n:**
- `n8n-workflow-voice-to-task.json` - Workflow JSON
- `n8n-code-bulletproof.js` - Parser robusto de fechas
- `n8n-parse-json-improved.js` - Parser JSON mejorado

**Endpoints API (a implementar):**
```typescript
POST /api/voice-to-task
Body: {
  user_id: string
  title: string
  description?: string
  due_date?: string (YYYY-MM-DD)
  priority?: 'low' | 'medium' | 'high'
}

POST /api/voice-edit-task
Body: {
  task_id: string
  updates: Partial<Task>
}
```

**Documentacion:**
- Futuro: `docs/integrations/n8n/SETUP.md`
- Futuro: `docs/integrations/n8n/VOICE_WORKFLOW.md`

---

## 8. REGLAS PARA CLAUDE

### Que Hacer Cuando Encuentras un Bug

1. **Reproducir el bug:**
   - Intentar reproducir en entorno de desarrollo
   - Documentar pasos exactos
   - Identificar condiciones necesarias

2. **Investigar causa raiz:**
   - Revisar logs, errores en consola
   - Revisar codigo relacionado
   - Revisar commits recientes (`git log`)
   - Buscar en lecciones aprendidas si ya se resolvio antes

3. **Implementar fix:**
   - Escribir fix minimal (menos cambios posibles)
   - Verificar que resuelve el problema
   - Verificar que no rompe nada mas
   - Agregar tipos TypeScript si faltan

4. **Documentar (si es complejo):**
   - Si tomo mas de 1 hora: crear leccion aprendida
   - Usar template de `lessons-learned/TEMPLATE.md`
   - Guardar en `lessons-learned/by-date/YYYY-MM-DD-titulo.md`
   - Actualizar `lessons-learned/by-category/[tech].md`

5. **Commit con mensaje descriptivo:**
   ```bash
   git commit -m "fix(scope): descripcion clara del bug resuelto

   - Detalle 1
   - Detalle 2

   Refs: #issue-number (si aplica)"
   ```

### Como Documentar Cambios Importantes

**Feature nueva:**
1. Crear `docs/features/FEATURE_NAME.md` con:
   - Que hace
   - Como usarla
   - Configuracion necesaria
   - Ejemplos de uso
   - Troubleshooting

2. Actualizar README.md con nueva feature en lista

3. Si tiene API endpoint, crear `docs/api/ENDPOINT.md`

**Cambio de arquitectura:**
1. Actualizar `PROJECT_SUMMARY.md` o `docs/technical/ARCHITECTURE.md`
2. Documentar razon del cambio
3. Documentar impacto en otros componentes
4. Actualizar diagramas si existen

**Cambio de configuracion:**
1. Actualizar `.env.example`
2. Documentar en README.md o `docs/setup/ENVIRONMENT_VARIABLES.md`
3. Actualizar `verify-setup.js` si aplica

### Cuando Actualizar Lecciones Aprendidas

**Actualizar leccion existente cuando:**
- Se descubre informacion adicional sobre problema ya documentado
- Se encuentra mejor solucion
- Se agrega test para prevenir regresion

**Crear nueva leccion cuando:**
- Problema nuevo que tomo >1 hora
- Solucion no obvia
- Puede ayudar a otros desarrolladores

**NO crear leccion cuando:**
- Problema trivial o typo
- Ya existe leccion para problema similar
- Issue especifico de entorno local

### Formato de Commits

**Usar Conventional Commits:**

```
<tipo>(<scope>): <descripcion corta>

[Descripcion larga opcional]

[Footer opcional: Breaking changes, issues, etc]
```

**Tipos:**
- `feat` - Nueva feature
- `fix` - Bug fix
- `docs` - Documentacion
- `refactor` - Refactorizacion
- `style` - Formato
- `test` - Tests
- `chore` - Build, CI, dependencias

**Ejemplos:**

```bash
# Feature
git commit -m "feat(calendar): add bidirectional deletion sync

Implement deletion webhooks to sync task deletions with Google Calendar.
Tasks deleted in app now remove corresponding calendar events and vice versa.

Refs: #123"

# Bug fix
git commit -m "fix(auth): resolve OAuth token refresh duplicate key error

Use UPSERT instead of INSERT to avoid duplicate key constraint violations
when refreshing Google OAuth tokens.

Closes: #124"

# Documentacion
git commit -m "docs: add lesson learned for timezone bug

Document the date-only string solution for timezone issues.
Includes cause, solution, and prevention measures."

# Breaking change
git commit -m "refactor(api): change voice-to-task endpoint response format

BREAKING CHANGE: Response now returns full task object instead of just ID.
Update clients to handle new response structure.

Before: { id: string }
After: { task: Task }
"
```

### Reglas de Oro para Claude

1. **SIEMPRE leer documentacion existente** antes de hacer cambios
2. **NUNCA eliminar lecciones aprendidas** sin consultar
3. **DOCUMENTAR problemas complejos** inmediatamente despues de resolver
4. **MANTENER consistencia** con convenciones del proyecto
5. **VERIFICAR que no rompes nada** antes de commit
6. **USAR tipos TypeScript** siempre (no `any` sin razon)
7. **SEGUIR principios de seguridad:** RLS, validacion, sanitizacion
8. **PREFERIR claridad sobre cleverness:** codigo legible > codigo "inteligente"
9. **TESTEAR localmente** antes de sugerir cambios
10. **EXPLICAR el por que**, no solo el que

### Checklist Pre-Commit para Claude

Antes de cada commit, verificar:

- [ ] Codigo compila sin errores (`npm run build`)
- [ ] ESLint pasa sin errores (`npm run lint`)
- [ ] Tipos TypeScript correctos (no `any` innecesarios)
- [ ] Documentacion actualizada si aplica
- [ ] Leccion aprendida creada si problema fue complejo (>1 hora)
- [ ] Commit message sigue Conventional Commits
- [ ] Cambios probados localmente
- [ ] No se commitean archivos sensibles (.env, secrets)
- [ ] Referencias a issues/PRs si aplica

---

## APENDICE A: REFERENCIAS RAPIDAS

### Variables de Entorno Criticas

```bash
# Supabase (obligatorio)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Solo server-side

# Google OAuth (opcional - para Calendar sync)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000 # o URL de produccion
```

### Comandos Git Utiles

```bash
# Ver ultimos commits
git log --oneline -20

# Ver cambios en archivo especifico
git log -p -- path/to/file.ts

# Buscar commit que introdujo bug
git bisect start
git bisect bad  # commit actual (con bug)
git bisect good <commit-hash>  # ultimo commit bueno

# Ver archivos modificados en commit
git show --name-only <commit-hash>

# Ver diff de archivo en dos commits
git diff <commit1> <commit2> -- path/to/file.ts
```

### Estructura de Carpetas Quick Reference

```
task-manager/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, signup
│   ├── (dashboard)/       # Dashboard, today, week
│   └── api/               # API routes
├── components/            # React components
│   ├── tasks/            # TaskItem, TaskList, TaskInput
│   ├── calendar/         # CalendarStatus, CalendarSync
│   └── ui/               # Button, Modal, Toast
├── lib/                   # Utilidades
│   ├── supabase/         # Clientes Supabase
│   ├── google-calendar/  # Google Calendar API
│   └── utils/            # Funciones utiles
├── hooks/                 # Custom hooks
├── context/               # Context providers
├── types/                 # TypeScript types
├── docs/                  # Documentacion (nuevo)
├── lessons-learned/       # Lecciones aprendidas (nuevo)
└── supabase/              # Configuracion Supabase
```

### Links a Documentos Clave

| Documento | Proposito |
|-----------|-----------|
| [README.md](README.md) | Documentacion principal |
| [AUDITORIA_DOCUMENTACION.md](AUDITORIA_DOCUMENTACION.md) | Auditoria completa de docs |
| [PLAN_REORGANIZACION_PROYECTO.md](PLAN_REORGANIZACION_PROYECTO.md) | Plan de reorganizacion |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Resumen tecnico del MVP |
| [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md) | Setup de Google Calendar |
| [FIX-FECHAS-DEFINITIVO.md](FIX-FECHAS-DEFINITIVO.md) | Solucion bug de fechas |

---

## APENDICE B: GLOSARIO

| Termino | Definicion |
|---------|-----------|
| **RLS** | Row Level Security - Politicas de seguridad a nivel de fila en PostgreSQL |
| **Server Component** | Componente React que se ejecuta solo en servidor (Next.js 14) |
| **Client Component** | Componente React que se ejecuta en navegador |
| **Server Action** | Funcion server-side que puede llamarse desde cliente (Next.js) |
| **UPSERT** | INSERT + UPDATE - Insertar o actualizar si existe |
| **OAuth** | Open Authorization - Protocolo de autorizacion |
| **Real-time** | Actualizacion instantanea via WebSockets (Supabase) |
| **Service Role Key** | Key de Supabase que bypasea RLS (solo server-side) |
| **Anon Key** | Key publica de Supabase (respeta RLS) |
| **Webhook** | Endpoint HTTP que recibe notificaciones de eventos |
| **Middleware** | Codigo que se ejecuta antes de cada request (Next.js) |

---

## CHANGELOG DE ESTE DOCUMENTO

| Fecha | Version | Cambios |
|-------|---------|---------|
| 2025-11-11 | 1.0.0 | Creacion inicial del documento CLAUDE.md |

---

**Mantenido por:** Documentation Specialist
**Ultima revision:** 11 de noviembre de 2025
**Feedback:** Sugerir mejoras via issue o PR

---

**NOTA IMPORTANTE:** Este documento esta en constante evolucion. Si encuentras informacion desactualizada o faltante, por favor actualizala o crea un issue.

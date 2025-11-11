# Bienvenido a FocusOnIt

FocusOnIt es un task manager completo y funcional construido con las mejores tecnologias:

- Next.js 14 - Framework React de ultima generacion
- Tailwind CSS - Estilos modernos y responsive
- Supabase - Backend completo con real-time
- Auth integrada - Login/Signup listo para usar
- Mobile-first - Funciona en cualquier dispositivo
- Dark mode - Automatico segun tu sistema

## Quick Start (5 minutos)

### Paso 1: Configurar Supabase (2 minutos)

#### Crear proyecto

1. Ve a [supabase.com](https://supabase.com)
2. Click en "New project"
3. Elige nombre y contrasena
4. Espera 2-3 minutos a que este listo

#### Ejecutar SQL

1. En el dashboard, ve a **SQL Editor** (icono de codigo)
2. Click en "New query"
3. Copia y pega TODO el contenido del archivo `setup.sql`
4. Click en "Run" (o F5)
5. Deberias ver: "Success. No rows returned"

#### Obtener credenciales

1. Ve a **Settings** → **API**
2. Copia estos 3 valores:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click en "Reveal" primero)

### Paso 2: Configurar la App (1 minuto)

#### Crear archivo de entorno

```bash
cp .env.example .env.local
```

#### Pegar tus credenciales

Abre `.env.local` y reemplaza:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### Paso 3: Ejecutar (30 segundos)

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Paso 4: Crear tu cuenta

1. Ve a `/signup`
2. Ingresa tu email y contrasena o usa "Sign in with Google"
3. **IMPORTANTE:** Por defecto Supabase requiere confirmar email
   - Opcion A: Revisa tu bandeja de entrada
   - Opcion B: Desactiva confirmacion (ver abajo)

#### Desactivar confirmacion de email (desarrollo)

En Supabase:

1. **Authentication** → **Settings**
2. Busca "Enable email confirmations"
3. Desactivalo (toggle OFF)
4. Ahora puedes hacer signup sin confirmar email

## Listo

Ahora puedes:

- Crear tareas rapidamente (Enter)
- Ver tus tareas del dia
- Marcar como completadas
- Ver actualizaciones en tiempo real

## Estructura del Proyecto

```
task-manager/
├── app/
│   ├── (auth)/              # Login, Signup
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/         # Vistas principales
│   │   ├── layout.tsx
│   │   ├── today/page.tsx   # Vista HOY
│   │   ├── week/page.tsx    # Vista SEMANA
│   │   ├── all/page.tsx     # Todas las tareas
│   │   └── completed/page.tsx
│   ├── api/                 # API routes (webhooks, calendar)
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── Navbar.tsx           # Header con logout
│   ├── Sidebar.tsx          # Navegacion desktop
│   ├── TaskInput.tsx        # Captura rapida
│   ├── TaskList.tsx         # Lista con empty state
│   └── TaskItem.tsx         # Item con todas las acciones
├── lib/
│   ├── supabase/           # Clientes Supabase
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useTasks.ts     # Con real-time
│   └── utils/              # Utilidades
├── types/
│   └── database.types.ts
├── docs/                   # Documentacion
├── middleware.ts           # Proteccion de rutas
└── setup.sql              # Script de DB completo
```

## Proximos Pasos

### Configuracion Opcional

- [Configurar Google Calendar](docs/integrations/google-calendar/SETUP.md) - Sincronizacion bidireccional
- [Setup detallado](docs/setup/DETAILED_SETUP.md) - Configuracion avanzada
- [Integrar n8n](docs/integrations/n8n/README.md) - Automatizaciones

### Personalizacion

- Personaliza estilos en `app/globals.css`
- Ajusta tema en `tailwind.config.ts`
- Modifica vistas en `app/(dashboard)/`

### Deployment

- [Deploy a Vercel](docs/deployment/vercel.md) - Recomendado, gratis
- [Deploy con Docker](docs/deployment/docker.md) - Self-hosted

## Atajos de Teclado

- `Enter` - Crear tarea rapida
- `Shift + Enter` - Abrir modal con opciones
- `Click en titulo` - Editar inline
- `Esc` - Cancelar edicion

## Problemas Comunes

### "Failed to fetch"

- Las credenciales en `.env.local` estan mal
- Copialas nuevamente de Supabase → Settings → API

### "Not authorized"

- No ejecutaste `setup.sql`
- Ejecuta el script completo en SQL Editor

### "Email not confirmed"

- Confirmacion esta activada
- Desactivala en Authentication → Settings (solo desarrollo)

### Cambios no se reflejan

- Cache del navegador
- Abre en incognito o presiona Ctrl+Shift+R

## Documentacion Adicional

- [README.md](README.md) - Documentacion completa
- [docs/](docs/) - Documentacion organizada por temas
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Integraciones con Google Calendar y n8n

## Ayuda

Si tienes problemas:

1. Revisa esta guia completamente
2. Consulta [docs/troubleshooting/](docs/troubleshooting/)
3. Revisa [lessons-learned/](lessons-learned/) para problemas conocidos
4. Abre un issue en GitHub

---

Todo listo? Empieza a crear tu primera tarea y a ser mas productivo

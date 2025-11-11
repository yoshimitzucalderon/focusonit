# Plan de Reorganizacion del Proyecto FocusOnIt

**Fecha:** 11 de noviembre de 2025
**Proyecto:** FocusOnIt Task Manager
**Responsable:** DevOps Engineer
**Aprobado por:** Project Manager

---

## CONTEXTO EJECUTIVO

**Situacion Actual:**
- 26 archivos en raiz del proyecto (15 MD + 11 otros)
- 60-70% redundancia en documentacion de onboarding
- 50% redundancia en documentacion de Google OAuth
- Sin estructura de carpetas para documentacion, integraciones, scripts
- Archivos n8n dispersos sin organizacion

**Objetivo:**
Crear estructura profesional, escalable y mantenible que:
1. Reduzca archivos en raiz de 15 MD a 2 MD
2. Organice documentacion en carpetas tematicas
3. Agrupe archivos de integraciones (n8n, Google)
4. Implemente sistema de lecciones aprendidas
5. Mantenga compatibilidad con referencias existentes

**Impacto Esperado:**
- Onboarding 70% mas rapido (2 min vs 7 min)
- Mantenimiento simplificado (actualizar 1 archivo vs 3-4)
- Base para escalabilidad futura

---

## 1. ESTRUCTURA DE CARPETAS PROPUESTA

### 1.1 Arbol ASCII Completo

```
task-manager/
├── README.md                           # Documentacion tecnica principal
├── GETTING_STARTED.md                  # Inicio rapido (consolidado)
├── CONTRIBUTING.md                     # Guia de contribucion (nuevo)
├── CHANGELOG.md                        # Historial de cambios (nuevo)
│
├── docs/                               # Toda la documentacion
│   ├── README.md                       # Indice maestro de documentacion
│   │
│   ├── setup/                          # Configuracion e instalacion
│   │   ├── INSTALLATION.md             # Instalacion basica
│   │   ├── SUPABASE_SETUP.md           # Setup detallado de Supabase
│   │   ├── ENVIRONMENT_VARIABLES.md    # Variables de entorno explicadas
│   │   └── DEPLOYMENT.md               # Deploy a produccion (Vercel, Docker)
│   │
│   ├── features/                       # Documentacion de features
│   │   ├── TASK_MANAGEMENT.md          # CRUD de tareas (nuevo)
│   │   ├── POMODORO_TIMER.md           # Timer Pomodoro (movido)
│   │   ├── VOICE_INPUT.md              # Entrada por voz (nuevo)
│   │   └── REAL_TIME_SYNC.md           # Sincronizacion en tiempo real (nuevo)
│   │
│   ├── integrations/                   # Integraciones externas
│   │   ├── README.md                   # Overview de todas las integraciones
│   │   │
│   │   ├── google-calendar/            # Google Calendar
│   │   │   ├── SETUP.md                # Configuracion paso a paso
│   │   │   ├── TECHNICAL.md            # Arquitectura y componentes
│   │   │   └── TROUBLESHOOTING.md      # Solucion de problemas
│   │   │
│   │   ├── google-oauth/               # Google OAuth
│   │   │   ├── SETUP.md                # Cloud y Self-hosted (consolidado)
│   │   │   └── YCM360.md               # Configuracion servidor YCM360
│   │   │
│   │   └── n8n/                        # n8n workflows
│   │       ├── README.md               # Introduccion a n8n en el proyecto
│   │       ├── SETUP.md                # Instalacion y configuracion
│   │       ├── WORKFLOWS.md            # Workflows disponibles
│   │       ├── VOICE_WORKFLOW.md       # Workflow de voz a tareas
│   │       ├── workflows/              # Archivos JSON de workflows
│   │       │   └── voice-to-task.json  # (movido desde raiz)
│   │       └── code-snippets/          # Codigo reutilizable
│   │           ├── bulletproof-parser.js   # (movido desde raiz)
│   │           └── json-improved.js        # (movido desde raiz)
│   │
│   ├── api/                            # Documentacion de API
│   │   ├── README.md                   # Overview de endpoints
│   │   ├── VOICE_TO_TASK.md            # POST /api/voice-to-task
│   │   ├── VOICE_EDIT_TASK.md          # POST /api/voice-edit-task
│   │   └── CALENDAR_SYNC.md            # Endpoints de Google Calendar
│   │
│   ├── technical/                      # Documentacion tecnica
│   │   ├── ARCHITECTURE.md             # Arquitectura del sistema
│   │   ├── DATABASE_SCHEMA.md          # Schema y migraciones
│   │   ├── TIMEZONE_HANDLING.md        # Manejo de timezones (consolidado)
│   │   ├── SECURITY.md                 # RLS, autenticacion, seguridad
│   │   └── PERFORMANCE.md              # Optimizaciones
│   │
│   ├── troubleshooting/                # Solucion de problemas
│   │   ├── README.md                   # Problemas comunes
│   │   ├── DATE_ISSUES.md              # Problemas de fechas/timezone
│   │   ├── OAUTH_ISSUES.md             # Problemas de OAuth
│   │   └── DEPLOYMENT_ISSUES.md        # Problemas de deployment
│   │
│   └── guides/                         # Guias de desarrollo
│       ├── GITHUB_WORKFLOW.md          # Git/GitHub workflow (movido)
│       ├── TESTING.md                  # Guia de testing (nuevo)
│       └── CODE_STYLE.md               # Guia de estilo (nuevo)
│
├── scripts/                            # Scripts utiles
│   ├── README.md                       # Documentacion de scripts
│   ├── verify-setup.js                 # Script de verificacion (movido)
│   ├── setup/                          # Scripts de setup
│   │   └── init-project.sh             # Script de inicializacion (nuevo)
│   └── utils/                          # Scripts de utilidades
│       └── check-env.js                # Verificar variables de entorno (nuevo)
│
├── lessons-learned/                    # Lecciones aprendidas
│   ├── README.md                       # Introduccion al sistema
│   ├── TEMPLATE.md                     # Template para nuevas lecciones
│   ├── INDEX.md                        # Indice maestro de lecciones
│   │
│   ├── by-category/                    # Organizadas por tecnologia
│   │   ├── supabase.md                 # Lecciones de Supabase
│   │   ├── google-calendar.md          # Lecciones de Google Calendar
│   │   ├── docker.md                   # Lecciones de Docker
│   │   ├── kong.md                     # Lecciones de Kong Gateway
│   │   ├── n8n.md                      # Lecciones de n8n
│   │   ├── nextjs.md                   # Lecciones de Next.js
│   │   └── typescript.md               # Lecciones de TypeScript
│   │
│   └── by-date/                        # Organizadas cronologicamente
│       ├── 2025-10-05-timezone-bug.md  # Problema de fechas (desde FIX-FECHAS)
│       ├── 2025-10-21-oauth-refresh.md # Token refresh OAuth
│       └── 2025-11-11-calendar-sync.md # Sincronizacion calendario
│
├── supabase/                           # Configuracion de Supabase
│   ├── migrations/                     # Migraciones de BD
│   └── seed.sql                        # Datos de prueba (nuevo)
│
├── .github/                            # GitHub workflows (nuevo)
│   ├── workflows/
│   │   ├── ci.yml                      # CI/CD pipeline
│   │   └── deploy.yml                  # Deploy automatico
│   └── PULL_REQUEST_TEMPLATE.md        # Template de PR
│
├── app/                                # Next.js app (sin cambios)
├── components/                         # React components (sin cambios)
├── context/                            # React context (sin cambios)
├── hooks/                              # Custom hooks (sin cambios)
├── lib/                                # Utilidades (sin cambios)
├── public/                             # Assets estaticos (sin cambios)
├── types/                              # TypeScript types (sin cambios)
│
├── .dockerignore                       # Docker ignore (sin cambios)
├── .env.example                        # Ejemplo de variables de entorno
├── .env.local                          # Variables locales (git ignored)
├── .eslintrc.json                      # Configuracion ESLint
├── .gitignore                          # Git ignore
├── Dockerfile                          # Configuracion Docker
├── docker-compose.yml                  # Docker compose (nuevo)
├── next.config.js                      # Configuracion Next.js
├── package.json                        # Dependencias NPM
├── postcss.config.mjs                  # PostCSS config
├── tailwind.config.ts                  # Tailwind config
├── tsconfig.json                       # TypeScript config
├── middleware.ts                       # Next.js middleware
└── setup.sql                           # SQL inicial (mover a supabase/)
```

### 1.2 Justificacion de la Estructura

| Carpeta | Proposito | Beneficio |
|---------|-----------|-----------|
| **docs/** | Toda la documentacion organizada | Facil de navegar, escalable |
| **docs/setup/** | Guias de configuracion | Usuario nuevo encuentra todo en un lugar |
| **docs/features/** | Documentacion de features | Product team puede documentar features |
| **docs/integrations/** | Integraciones externas | Cada integracion en su subcarpeta |
| **docs/integrations/n8n/** | n8n workflows + codigo | Agrupa JSON + JS + docs de n8n |
| **docs/api/** | Documentacion de API | Desarrolladores externos pueden integrar |
| **docs/technical/** | Arquitectura y tecnica | Tech lead mantiene docs tecnicas |
| **docs/troubleshooting/** | Solucion de problemas | Support team puede resolver issues |
| **docs/guides/** | Guias de desarrollo | Onboarding de nuevos devs |
| **scripts/** | Scripts ejecutables | Herramientas de automatizacion |
| **lessons-learned/** | Conocimiento acumulado | Evitar repetir errores, documentar soluciones |
| **.github/** | GitHub workflows | CI/CD automatizado |

---

## 2. TABLA DE MIGRACION: ARCHIVO ACTUAL → NUEVA UBICACION

### 2.1 Archivos Markdown (15 archivos)

| Archivo Actual | Nueva Ubicacion | Accion | Notas |
|----------------|-----------------|--------|-------|
| **README.md** | README.md | MANTENER | Actualizar con link a GETTING_STARTED |
| **WELCOME.md** | GETTING_STARTED.md | CONSOLIDAR | Fusionar con START_HERE y QUICKSTART |
| **START_HERE.md** | GETTING_STARTED.md | CONSOLIDAR | Contenido principal para GETTING_STARTED |
| **QUICKSTART.md** | GETTING_STARTED.md | CONSOLIDAR | Agregar troubleshooting a GETTING_STARTED |
| **PROJECT_SUMMARY.md** | docs/technical/ARCHITECTURE.md | MOVER + EXPANDIR | Base para documentacion de arquitectura |
| **INTEGRATION_GUIDE.md** | docs/integrations/README.md | MOVER | Vision general de integraciones |
| **GITHUB_SETUP.md** | docs/guides/GITHUB_WORKFLOW.md | MOVER + RENOMBRAR | Expandir con workflow de desarrollo |
| **GOOGLE_CALENDAR_INTEGRATION.md** | docs/integrations/google-calendar/TECHNICAL.md | MOVER | Documentacion tecnica de Calendar |
| **GOOGLE_CALENDAR_SETUP.md** | docs/integrations/google-calendar/SETUP.md | MOVER | Guia de configuracion de Calendar |
| **GOOGLE_SIGN_IN_IMPLEMENTATION.md** | docs/integrations/google-oauth/SETUP.md | CONSOLIDAR | Fusionar 4 archivos OAuth en 2 |
| **GOOGLE_SIGN_IN_SELFHOSTED.md** | docs/integrations/google-oauth/SETUP.md | CONSOLIDAR | Seccion "Self-hosted" en SETUP.md |
| **CONFIGURE_GOOGLE_OAUTH_SELFHOSTED.md** | docs/integrations/google-oauth/SETUP.md | CONSOLIDAR | Contenido para seccion Self-hosted |
| **SETUP_GOOGLE_OAUTH_YCM360.md** | docs/integrations/google-oauth/YCM360.md | MOVER | Configuracion especifica de servidor |
| **FIX-FECHAS-DEFINITIVO.md** | docs/technical/TIMEZONE_HANDLING.md + lessons-learned/by-date/2025-10-05-timezone-bug.md | CONSOLIDAR + DUPLICAR | Contenido tecnico + leccion aprendida |
| **TIMEZONE-IMPLEMENTATION.md** | docs/technical/TIMEZONE_HANDLING.md | CONSOLIDAR | Fusionar con FIX-FECHAS |
| **docs/POMODORO_SETUP.md** | docs/features/POMODORO_TIMER.md | MOVER + RENOMBRAR | Mover a carpeta correcta |

### 2.2 Archivos n8n (3 archivos)

| Archivo Actual | Nueva Ubicacion | Accion | Notas |
|----------------|-----------------|--------|-------|
| **n8n-workflow-voice-to-task.json** | docs/integrations/n8n/workflows/voice-to-task.json | MOVER | Carpeta dedicada para workflows |
| **n8n-code-bulletproof.js** | docs/integrations/n8n/code-snippets/bulletproof-parser.js | MOVER + RENOMBRAR | Codigo reutilizable de n8n |
| **n8n-parse-json-improved.js** | docs/integrations/n8n/code-snippets/json-improved.js | MOVER + RENOMBRAR | Snippet de parsing JSON |

### 2.3 Archivos de Configuracion y Scripts (8 archivos)

| Archivo Actual | Nueva Ubicacion | Accion | Notas |
|----------------|-----------------|--------|-------|
| **Dockerfile** | Dockerfile | MANTENER | Configuracion Docker en raiz |
| **setup.sql** | supabase/setup.sql | MOVER | Agrupar con migraciones de BD |
| **verify-setup.js** | scripts/verify-setup.js | MOVER | Scripts ejecutables en /scripts |
| **package.json** | package.json | MANTENER | Archivo NPM en raiz |
| **tsconfig.json** | tsconfig.json | MANTENER | Configuracion TypeScript en raiz |
| **next.config.js** | next.config.js | MANTENER | Configuracion Next.js en raiz |
| **tailwind.config.ts** | tailwind.config.ts | MANTENER | Configuracion Tailwind en raiz |
| **postcss.config.mjs** | postcss.config.mjs | MANTENER | Configuracion PostCSS en raiz |

### 2.4 Resumen de Cambios

| Categoria | Archivos Actuales | Archivos Finales | Cambio |
|-----------|-------------------|------------------|--------|
| **MD en raiz** | 15 | 2 (README + GETTING_STARTED) | -87% |
| **MD en docs/** | 1 | ~35 | +3400% (organizado) |
| **n8n en raiz** | 3 | 0 | -100% (movido a docs/integrations/n8n) |
| **Scripts en raiz** | 1 | 0 | -100% (movido a scripts/) |
| **SQL en raiz** | 1 | 0 | -100% (movido a supabase/) |
| **Configuracion en raiz** | 7 | 7 | Sin cambios |

---

## 3. ARCHIVOS A CONSOLIDAR Y COMO

### 3.1 Consolidacion: Onboarding (4 → 1 archivo)

**Archivos Source:**
- WELCOME.md (5.9 KB)
- START_HERE.md (3.0 KB)
- QUICKSTART.md (2.7 KB)
- README.md (seccion instalacion)

**Archivo Destino:**
- GETTING_STARTED.md (~4 KB consolidado)

**Estrategia de Consolidacion:**

```markdown
# GETTING_STARTED.md

## Seccion 1: Bienvenida (de WELCOME.md)
- Breve introduccion al proyecto
- Que hace FocusOnIt
- Stack tecnologico principal

## Seccion 2: Requisitos Previos (nuevo)
- Node.js 18+
- Cuenta de Supabase
- Git instalado

## Seccion 3: Instalacion Rapida (de START_HERE.md)
- Paso 1: Clonar repositorio
- Paso 2: Instalar dependencias (npm install)
- Paso 3: Configurar Supabase (ejecutar setup.sql)
- Paso 4: Configurar .env.local
- Paso 5: Verificar setup (npm run verify)
- Paso 6: Ejecutar (npm run dev)

## Seccion 4: Verificacion (de QUICKSTART.md)
- Abrir http://localhost:3000
- Crear cuenta de prueba
- Verificar funcionalidades basicas

## Seccion 5: Problemas Comunes (de QUICKSTART.md + WELCOME.md)
- Error de conexion a Supabase
- Variables de entorno incorrectas
- Puerto 3000 ocupado
- Error de CORS

## Seccion 6: Proximos Pasos
- Link a README.md (documentacion tecnica completa)
- Link a docs/ (documentacion organizada)
- Link a docs/features/ (como usar features)
```

**Contenido a Preservar:**
- Checklist de setup (de WELCOME.md)
- Comandos principales (de START_HERE.md)
- Troubleshooting (de QUICKSTART.md)
- Tabla de archivos importantes (de WELCOME.md)

**Contenido a Descartar:**
- ASCII art (opcional, no critico)
- Redundancia de features (ya en README.md)
- Informacion de desarrollo avanzado (mover a docs/guides/)

---

### 3.2 Consolidacion: Google OAuth (4 → 2 archivos)

**Archivos Source:**
- GOOGLE_SIGN_IN_IMPLEMENTATION.md (18 KB)
- GOOGLE_SIGN_IN_SELFHOSTED.md (17.5 KB)
- CONFIGURE_GOOGLE_OAUTH_SELFHOSTED.md (16.4 KB)
- SETUP_GOOGLE_OAUTH_YCM360.md (15.6 KB)

**Archivos Destino:**
- docs/integrations/google-oauth/SETUP.md (~25 KB consolidado)
- docs/integrations/google-oauth/YCM360.md (~12 KB)

**Estrategia de Consolidacion para SETUP.md:**

```markdown
# Google OAuth Setup

## Tabla de Contenidos
1. Introduccion
2. Google Cloud Console (comun)
3. Opcion A: Supabase Cloud
4. Opcion B: Supabase Self-hosted
5. Testing
6. Troubleshooting

## 1. Introduccion (de GOOGLE_SIGN_IN_IMPLEMENTATION)
- Por que OAuth vs email/password
- Ventajas de "Sign in with Google"
- Alcances (scopes) disponibles

## 2. Google Cloud Console (COMUN A TODOS)
- Crear proyecto en Google Cloud
- Habilitar Google Calendar API
- Configurar OAuth consent screen
- Crear credenciales OAuth 2.0
- Configurar URIs de redireccion

[CONTENIDO DE: GOOGLE_SIGN_IN_IMPLEMENTATION + GOOGLE_SIGN_IN_SELFHOSTED
secciones comunes consolidadas]

## 3. Opcion A: Supabase Cloud
### 3.1 Configuracion en Supabase Dashboard
[CONTENIDO DE: GOOGLE_SIGN_IN_IMPLEMENTATION]

### 3.2 Variables de Entorno
[CONTENIDO DE: GOOGLE_SIGN_IN_IMPLEMENTATION]

### 3.3 Codigo Next.js
[CONTENIDO DE: GOOGLE_SIGN_IN_IMPLEMENTATION]

## 4. Opcion B: Supabase Self-hosted
### 4.1 Configuracion en docker-compose.yml
[CONTENIDO DE: CONFIGURE_GOOGLE_OAUTH_SELFHOSTED]

### 4.2 Variables de Entorno (.env)
[CONTENIDO DE: GOOGLE_SIGN_IN_SELFHOSTED + CONFIGURE_GOOGLE_OAUTH_SELFHOSTED]

### 4.3 Reiniciar Servicios
[CONTENIDO DE: CONFIGURE_GOOGLE_OAUTH_SELFHOSTED]

### 4.4 Codigo Next.js
[CONTENIDO DE: GOOGLE_SIGN_IN_SELFHOSTED]

## 5. Testing
- Verificar redirect URIs
- Probar flujo de autenticacion
- Verificar tokens en BD

## 6. Troubleshooting
- Redirect URI mismatch
- Error 403: access_denied
- Token refresh fallando
```

**Estrategia para YCM360.md:**

```markdown
# Google OAuth - Servidor YCM360

> Esta es la configuracion especifica para el servidor de produccion YCM360.
> Para configuracion general, ver [SETUP.md](SETUP.md)

## Configuracion Especifica
[CONTENIDO DE: SETUP_GOOGLE_OAUTH_YCM360
solo las partes especificas del servidor, sin duplicar pasos generales]

## Enlaces
- [SETUP.md](SETUP.md) - Configuracion general de OAuth
- [../google-calendar/SETUP.md](../google-calendar/SETUP.md) - Setup de Calendar
```

**Contenido a Preservar:**
- Flujos de autenticacion (diagramas)
- Configuracion de Google Cloud Console
- Variables de entorno especificas
- Codigo de implementacion
- Troubleshooting especifico

**Contenido a Descartar:**
- Secciones duplicadas (consolidar en SETUP.md)
- Explicaciones redundantes de OAuth
- Codigo repetido entre versiones

---

### 3.3 Consolidacion: Timezone (2 → 1 archivo)

**Archivos Source:**
- FIX-FECHAS-DEFINITIVO.md (7.4 KB)
- TIMEZONE-IMPLEMENTATION.md (3.6 KB)

**Archivo Destino:**
- docs/technical/TIMEZONE_HANDLING.md (~9 KB)

**Estrategia de Consolidacion:**

```markdown
# Manejo de Timezones en FocusOnIt

## 1. Problema Original (de FIX-FECHAS-DEFINITIVO)
- Sintomas del bug
- Causa raiz (uso de new Date())
- Impacto en usuarios

## 2. Solucion Implementada (de FIX-FECHAS-DEFINITIVO)
- Enfoque: date-only strings (YYYY-MM-DD)
- Funciones implementadas
- Cambios en componentes

## 3. Implementacion Tecnica (de TIMEZONE-IMPLEMENTATION)
- Componentes actualizados
- Utilidades de fecha (parseDateString, toDateOnlyString)
- Configuracion de Supabase

## 4. Funciones Utiles
- parseDateString(dateStr): Date
- toDateOnlyString(date): string
- Ejemplos de uso

## 5. Testing
- Como probar fechas
- Casos edge

## 6. Best Practices
- Siempre usar date-only strings para tareas
- No usar new Date().toISOString() para fechas
- Usar funciones utiles del proyecto

## 7. Leccion Aprendida
[Link a lessons-learned/by-date/2025-10-05-timezone-bug.md]
```

**Contenido a Preservar:**
- Historia completa del problema
- Explicacion de la solucion
- Codigo de funciones utiles
- Ejemplos practicos
- Anti-patrones a evitar

**Contenido a Descartar:**
- Ningun contenido (ambos archivos son valiosos)
- Solo consolidar para evitar duplicacion

---

### 3.4 Resumen de Consolidaciones

| Consolidacion | Source | Destino | Reduccion |
|---------------|--------|---------|-----------|
| **Onboarding** | 4 archivos (11.6 KB) | 1 archivo (4 KB) | 75% menos archivos |
| **Google OAuth** | 4 archivos (67.5 KB) | 2 archivos (37 KB) | 50% menos archivos |
| **Timezone** | 2 archivos (11 KB) | 1 archivo (9 KB) | 50% menos archivos |
| **TOTAL** | 10 archivos (90.1 KB) | 4 archivos (50 KB) | 60% reduccion |

---

## 4. PLAN DE ACTUALIZACION DE REFERENCIAS

### 4.1 Referencias en Codigo TypeScript/JavaScript

**Archivos a Revisar:**

| Tipo de Referencia | Ubicacion | Cambio Necesario |
|-------------------|-----------|------------------|
| **Imports de tipos** | `app/**/*.tsx` | Sin cambios (types/ no se mueve) |
| **Imports de utilidades** | `components/**/*.tsx` | Sin cambios (lib/ no se mueve) |
| **Imports de hooks** | `app/**/*.tsx` | Sin cambios (hooks/ no se mueve) |
| **Referencias a scripts** | `package.json` | Actualizar path a scripts/ |

**Comandos de Verificacion:**

```bash
# Buscar imports que puedan estar rotos
grep -r "from '@/" app/ components/ hooks/ lib/

# Buscar referencias a archivos movidos
grep -r "setup.sql" app/ components/
grep -r "verify-setup" app/ components/
```

### 4.2 Referencias en package.json

**Archivo:** `package.json`

**Cambios Necesarios:**

```json
{
  "scripts": {
    "verify": "node scripts/verify-setup.js",
    // Antes: "node verify-setup.js"

    "setup": "node scripts/setup/init-project.sh",
    // Nuevo script
  }
}
```

**Accion:** Actualizar scripts que referencian verify-setup.js

### 4.3 Referencias en Documentacion Markdown

**Estrategia:** Usar rutas relativas correctas

| Archivo | Referencias a Actualizar | Ejemplo de Cambio |
|---------|-------------------------|-------------------|
| **README.md** | Link a GETTING_STARTED | `[Getting Started](GETTING_STARTED.md)` |
| **README.md** | Link a docs/ | `[Documentation](docs/README.md)` |
| **GETTING_STARTED.md** | Link a docs/setup/ | `[Deployment](docs/setup/DEPLOYMENT.md)` |
| **docs/README.md** | Links a subcarpetas | `[API Docs](api/README.md)` |
| **docs/integrations/README.md** | Links a integraciones | `[Google Calendar](google-calendar/SETUP.md)` |

**Comandos de Verificacion:**

```bash
# Buscar todos los links markdown
grep -r '\[.*\](.*\.md)' *.md docs/

# Buscar links absolutos que deben ser relativos
grep -r '\[.*\](/.*\.md)' *.md docs/
```

### 4.4 Script de Verificacion de Links

**Crear:** `scripts/utils/verify-markdown-links.sh`

```bash
#!/bin/bash
# verify-markdown-links.sh
# Verifica que todos los links en archivos MD sean validos

echo "Verificando enlaces en archivos Markdown..."

broken_links=0
total_links=0

# Buscar todos los archivos MD (excluir node_modules y .next)
find . -name "*.md" \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./.git/*" | while read file; do

  echo "Verificando: $file"

  # Extraer enlaces [texto](ruta.md)
  grep -oP '\[.*?\]\(\K[^)#]+' "$file" 2>/dev/null | while read link; do
    ((total_links++))

    # Si es link externo (http/https), saltar
    if [[ $link =~ ^https?:// ]]; then
      continue
    fi

    # Resolver ruta relativa
    dir=$(dirname "$file")
    fullpath="$dir/$link"

    # Normalizar path
    fullpath=$(realpath -m "$fullpath" 2>/dev/null)

    # Verificar si existe
    if [ ! -f "$fullpath" ] && [ ! -d "$fullpath" ]; then
      echo "  ❌ ROTO: $link (referenciado en $file)"
      ((broken_links++))
    fi
  done
done

echo ""
echo "========================================="
echo "Verificacion completa"
echo "Total de links revisados: $total_links"
echo "Links rotos encontrados: $broken_links"
echo "========================================="

if [ $broken_links -eq 0 ]; then
  echo "✅ No se encontraron enlaces rotos"
  exit 0
else
  echo "❌ Se encontraron $broken_links enlaces rotos"
  echo "Por favor corregirlos antes de continuar"
  exit 1
fi
```

### 4.5 Referencias en Docker/Configuracion

**Archivos a Revisar:**

| Archivo | Referencia | Cambio |
|---------|-----------|--------|
| **Dockerfile** | COPY setup.sql | Actualizar a `supabase/setup.sql` |
| **docker-compose.yml** | Volumen para scripts | Agregar `./scripts:/app/scripts` |
| **.gitignore** | Ignorar .env | Sin cambios |

### 4.6 Estrategia: No Romper Nada

**Principio:** Nunca eliminar archivos inmediatamente

**Pasos:**

1. **Crear estructura nueva** (carpetas docs/, scripts/, lessons-learned/)
2. **Copiar archivos** a nuevas ubicaciones (no mover aun)
3. **Crear contenido consolidado** en archivos nuevos
4. **Crear redirects** en archivos antiguos:

```markdown
# Este archivo se ha movido

**Nueva ubicacion:** [docs/integrations/google-oauth/SETUP.md](docs/integrations/google-oauth/SETUP.md)

Por favor actualiza tus marcadores.

---

*Este archivo se mantendra por compatibilidad hasta el 30 de diciembre de 2025*
```

5. **Actualizar referencias** en codigo y docs
6. **Probar exhaustivamente** con script de verificacion
7. **Periodo de gracia** de 2 semanas con redirects
8. **Eliminar archivos antiguos** despues de confirmar que todo funciona

---

## 5. CHECKLIST DE VALIDACION POST-REORGANIZACION

### 5.1 Validacion de Estructura

```
[ ] Todas las carpetas creadas segun diagrama ASCII
[ ] Permisos correctos en carpetas (755)
[ ] .gitignore actualizado para no ignorar carpetas nuevas
[ ] README.md en cada carpeta principal (docs/, scripts/, lessons-learned/)
```

### 5.2 Validacion de Archivos

```
[ ] Todos los archivos movidos a ubicaciones correctas
[ ] Archivos consolidados creados correctamente
[ ] Redirects creados en archivos antiguos
[ ] No hay archivos duplicados
[ ] Archivos de configuracion (package.json, tsconfig.json) sin cambios
```

### 5.3 Validacion de Referencias

```
[ ] Script verify-markdown-links.sh ejecutado sin errores
[ ] Todos los links en README.md funcionan
[ ] Todos los links en GETTING_STARTED.md funcionan
[ ] Todos los links en docs/README.md funcionan
[ ] Links internos en subcarpetas de docs/ funcionan
[ ] Referencias en package.json actualizadas
[ ] Referencias en Dockerfile actualizadas (si aplica)
```

### 5.4 Validacion de Funcionalidad

```
[ ] npm install funciona sin errores
[ ] npm run dev arranca correctamente
[ ] npm run build completa sin errores
[ ] npm run verify (scripts/verify-setup.js) funciona
[ ] Aplicacion carga en http://localhost:3000
[ ] Autenticacion funciona (Google OAuth)
[ ] CRUD de tareas funciona
[ ] Google Calendar sync funciona (si configurado)
[ ] Timer Pomodoro funciona
```

### 5.5 Validacion de Documentacion

```
[ ] GETTING_STARTED.md es claro y completo
[ ] docs/README.md tiene indice completo
[ ] docs/setup/ tiene guias de instalacion
[ ] docs/integrations/ tiene docs de Google Calendar, OAuth, n8n
[ ] docs/api/ tiene documentacion de endpoints
[ ] docs/technical/ tiene arquitectura y schema
[ ] docs/troubleshooting/ tiene problemas comunes
[ ] lessons-learned/ tiene template y primeras lecciones
```

### 5.6 Validacion de Git

```
[ ] git status muestra cambios correctos
[ ] .gitignore funciona (no incluye .env.local, node_modules, .next)
[ ] Commit de reorganizacion creado
[ ] Branch de reorganizacion pusheada a remote
[ ] Pull request creado con descripcion detallada
```

### 5.7 Validacion de Onboarding (Test Real)

```
[ ] Nuevo desarrollador puede seguir GETTING_STARTED.md
[ ] Setup completo toma menos de 10 minutos
[ ] Todas las instrucciones son claras
[ ] Troubleshooting resuelve problemas comunes
[ ] Navegacion en docs/ es intuitiva
```

### 5.8 Script de Validacion Automatica

**Crear:** `scripts/utils/validate-reorganization.sh`

```bash
#!/bin/bash
# validate-reorganization.sh
# Valida que la reorganizacion se ejecuto correctamente

echo "========================================="
echo "Validacion de Reorganizacion del Proyecto"
echo "========================================="
echo ""

errors=0

# 1. Verificar carpetas criticas
echo "[1/8] Verificando estructura de carpetas..."
required_dirs=(
  "docs"
  "docs/setup"
  "docs/features"
  "docs/integrations"
  "docs/integrations/google-calendar"
  "docs/integrations/google-oauth"
  "docs/integrations/n8n"
  "docs/api"
  "docs/technical"
  "docs/troubleshooting"
  "docs/guides"
  "scripts"
  "scripts/utils"
  "lessons-learned"
  "lessons-learned/by-category"
  "lessons-learned/by-date"
)

for dir in "${required_dirs[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "  ❌ Falta carpeta: $dir"
    ((errors++))
  fi
done

if [ $errors -eq 0 ]; then
  echo "  ✅ Estructura de carpetas correcta"
fi

# 2. Verificar archivos criticos en raiz
echo "[2/8] Verificando archivos en raiz..."
required_files=(
  "README.md"
  "GETTING_STARTED.md"
  "package.json"
  "tsconfig.json"
  "next.config.js"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  ❌ Falta archivo: $file"
    ((errors++))
  fi
done

if [ $errors -eq 0 ]; then
  echo "  ✅ Archivos criticos presentes"
fi

# 3. Verificar que archivos antiguos fueron movidos/eliminados
echo "[3/8] Verificando archivos antiguos..."
old_files=(
  "WELCOME.md"
  "START_HERE.md"
  "QUICKSTART.md"
  "n8n-workflow-voice-to-task.json"
  "n8n-code-bulletproof.js"
  "n8n-parse-json-improved.js"
  "verify-setup.js"
)

for file in "${old_files[@]}"; do
  if [ -f "$file" ]; then
    # Verificar si es redirect
    if ! grep -q "se ha movido" "$file" 2>/dev/null; then
      echo "  ❌ Archivo antiguo sin redirect: $file"
      ((errors++))
    fi
  fi
done

if [ $errors -eq 0 ]; then
  echo "  ✅ Archivos antiguos manejados correctamente"
fi

# 4. Verificar archivos nuevos criticos
echo "[4/8] Verificando archivos nuevos..."
new_files=(
  "docs/README.md"
  "docs/integrations/README.md"
  "docs/integrations/google-oauth/SETUP.md"
  "docs/integrations/n8n/README.md"
  "scripts/verify-setup.js"
  "lessons-learned/README.md"
  "lessons-learned/TEMPLATE.md"
)

for file in "${new_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "  ❌ Falta archivo nuevo: $file"
    ((errors++))
  fi
done

if [ $errors -eq 0 ]; then
  echo "  ✅ Archivos nuevos creados"
fi

# 5. Verificar links markdown
echo "[5/8] Verificando links en Markdown..."
if [ -f "scripts/utils/verify-markdown-links.sh" ]; then
  bash scripts/utils/verify-markdown-links.sh > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "  ❌ Hay links rotos en documentacion"
    ((errors++))
  else
    echo "  ✅ Links en documentacion correctos"
  fi
else
  echo "  ⚠️  Script de verificacion de links no encontrado"
fi

# 6. Verificar que NPM funciona
echo "[6/8] Verificando NPM..."
if npm run verify > /dev/null 2>&1; then
  echo "  ✅ npm run verify funciona"
else
  echo "  ❌ npm run verify falla"
  ((errors++))
fi

# 7. Verificar TypeScript compilation
echo "[7/8] Verificando TypeScript..."
if npx tsc --noEmit > /dev/null 2>&1; then
  echo "  ✅ TypeScript compila sin errores"
else
  echo "  ⚠️  TypeScript tiene errores (revisar)"
fi

# 8. Verificar Git status
echo "[8/8] Verificando Git..."
if git diff --quiet; then
  echo "  ⚠️  No hay cambios en Git (¿se hizo commit?)"
else
  echo "  ✅ Cambios detectados en Git"
fi

# Resumen
echo ""
echo "========================================="
echo "Resumen de Validacion"
echo "========================================="
if [ $errors -eq 0 ]; then
  echo "✅ VALIDACION EXITOSA"
  echo "Todos los checks pasaron correctamente"
  exit 0
else
  echo "❌ VALIDACION FALLIDA"
  echo "Se encontraron $errors errores"
  echo "Por favor revisa los mensajes arriba"
  exit 1
fi
```

**Uso:**

```bash
chmod +x scripts/utils/validate-reorganization.sh
./scripts/utils/validate-reorganization.sh
```

---

## 6. SISTEMA DE LECCIONES APRENDIDAS

### 6.1 Estructura Propuesta

```
lessons-learned/
├── README.md                           # Introduccion al sistema
├── TEMPLATE.md                         # Template para nuevas lecciones
├── INDEX.md                            # Indice maestro de todas las lecciones
│
├── by-category/                        # Organizadas por tecnologia
│   ├── supabase.md
│   ├── google-calendar.md
│   ├── docker.md
│   ├── kong.md
│   ├── n8n.md
│   ├── nextjs.md
│   └── typescript.md
│
└── by-date/                            # Organizadas cronologicamente
    ├── 2025-10-05-timezone-bug.md
    ├── 2025-10-21-oauth-token-refresh.md
    ├── 2025-11-11-calendar-sync-deletion.md
    └── ...
```

### 6.2 Template de Leccion Aprendida

**Archivo:** `lessons-learned/TEMPLATE.md`

```markdown
# [Titulo Descriptivo del Problema]

**Fecha:** YYYY-MM-DD
**Categoria:** [supabase / google-calendar / docker / kong / n8n / nextjs / typescript / otro]
**Severidad:** [Baja / Media / Alta / Critica]
**Tiempo de Resolucion:** [X horas/dias]
**Impacto:** [En desarrollo / En produccion / Sin impacto]

---

## Resumen Ejecutivo

[2-3 lineas resumiendo el problema y la solucion]

---

## Contexto

### Que estabamos haciendo
[Descripcion de la tarea o feature en desarrollo]

### Ambiente
- Entorno: [Local / Staging / Produccion]
- Version: [Version de la app o componente]
- Fecha: [Cuando ocurrio]

---

## El Problema

### Sintomas
[Que vimos que estaba mal]

- Sintoma 1
- Sintoma 2
- Sintoma 3

### Como lo detectamos
[Logs, errores, reportes de usuarios, etc.]

```
[Ejemplo de error o log]
```

### Investigacion Inicial
[Primeras hipotesis, que probamos]

---

## Causa Raiz

[Explicacion tecnica de por que ocurrio el problema]

### Por que paso
[Razon fundamental]

### Por que no lo detectamos antes
[Falta de tests, edge case, etc.]

---

## La Solucion

### Que hicimos
[Pasos especificos para resolver]

1. Paso 1
2. Paso 2
3. Paso 3

### Codigo/Cambios
```typescript
// Antes
[codigo antiguo]

// Despues
[codigo nuevo]
```

### Archivos Modificados
- `archivo1.ts` - [descripcion]
- `archivo2.tsx` - [descripcion]

---

## Prevencion Futura

### Como evitar que vuelva a pasar

- [ ] Accion preventiva 1
- [ ] Accion preventiva 2
- [ ] Accion preventiva 3

### Tests agregados
```typescript
// Test para prevenir regresion
[codigo de test]
```

### Documentacion actualizada
- [Link a docs actualizados]
- [Link a guias relevantes]

---

## Aprendizajes Clave

1. **Leccion 1:** [Descripcion]
2. **Leccion 2:** [Descripcion]
3. **Leccion 3:** [Descripcion]

---

## Recursos Relacionados

- [Link a documentacion oficial]
- [Link a Stack Overflow]
- [Link a issue de GitHub]
- [Link a otra leccion aprendida relacionada]

---

## Autor

**Quien lo resolvio:** [Nombre]
**Revisado por:** [Nombre del reviewer]
**Fecha de creacion:** [YYYY-MM-DD]
```

### 6.3 Contenido Inicial de Lecciones

#### lessons-learned/README.md

```markdown
# Lecciones Aprendidas - FocusOnIt

Este directorio contiene el conocimiento acumulado del equipo sobre problemas encontrados y resueltos durante el desarrollo de FocusOnIt.

## Proposito

- **Documentar problemas complejos** y sus soluciones
- **Prevenir errores repetidos**
- **Acelerar onboarding** de nuevos desarrolladores
- **Compartir conocimiento** entre el equipo

## Como Usar Este Sistema

### Para Documentar una Nueva Leccion

1. Copia `TEMPLATE.md`
2. Rellena todas las secciones
3. Guarda en `by-date/YYYY-MM-DD-nombre-corto.md`
4. Agrega referencia en `by-category/[categoria].md`
5. Actualiza `INDEX.md`

### Para Buscar una Leccion

- **Por tecnologia:** Ver `by-category/`
- **Por fecha:** Ver `by-date/`
- **Por palabra clave:** Ver `INDEX.md`

## Categorias Disponibles

- **supabase** - Base de datos, RLS, migraciones, auth
- **google-calendar** - Sincronizacion, OAuth, eventos
- **docker** - Contenedores, compose, networking
- **kong** - API Gateway, routing, plugins
- **n8n** - Workflows, automatizaciones, webhooks
- **nextjs** - SSR, routing, API routes, middleware
- **typescript** - Tipos, interfaces, errores de compilacion

## Estadisticas

- Total de lecciones: 3
- Problemas criticos resueltos: 1
- Horas ahorradas (estimado): 20+

## Contribuir

Toda leccion aprendida es valiosa. Si resolviste algo que te tomo mas de 1 hora, documentalo aqui para ayudar al resto del equipo.
```

#### lessons-learned/by-date/2025-10-05-timezone-bug.md

```markdown
# Bug de Fechas: Timezone del Pacifico Causa Desfase de Dias

**Fecha:** 2025-10-05
**Categoria:** nextjs, typescript, supabase
**Severidad:** Alta
**Tiempo de Resolucion:** 8 horas
**Impacto:** En produccion - Usuarios viendo fechas incorrectas

---

## Resumen Ejecutivo

Las tareas guardadas con fecha especifica aparecian un dia antes en la UI debido a conversion automatica de timezone del Pacifico (UTC-7/8) a UTC. Solucion: usar date-only strings (YYYY-MM-DD) sin timestamps.

---

## Contexto

### Que estabamos haciendo
Implementando funcionalidad de tareas con fechas especificas (due dates).

### Ambiente
- Entorno: Produccion
- Version: MVP (antes de Rev26)
- Fecha: 5 de octubre de 2025

---

## El Problema

### Sintomas
- Usuario selecciona "15 de octubre" en el date picker
- Tarea se guarda en BD con fecha "2025-10-14"
- Al cargar, la tarea aparece en "14 de octubre"

### Como lo detectamos
Reporte de usuario: "Mis tareas siempre aparecen un dia antes"

### Investigacion Inicial
1. Revisamos codigo del date picker - correcto
2. Revisamos queries de Supabase - correctos
3. Sospechamos de timezone

---

## Causa Raiz

JavaScript `new Date()` crea fechas con timestamp completo (fecha + hora + timezone).

```typescript
// Problema
const date = new Date("2025-10-15")
// Crea: 2025-10-15T00:00:00-07:00 (medianoche en Pacific)
// Se guarda en BD como: 2025-10-15T07:00:00Z (UTC)
// Al parsear de vuelta: muestra "2025-10-14" en Pacific timezone

date.toISOString()
// "2025-10-14T07:00:00.000Z" <- DIA ANTERIOR
```

### Por que paso
Next.js ejecuta codigo en servidor (UTC) y cliente (timezone local). Conversion automatica causa desfase.

### Por que no lo detectamos antes
Tests ejecutados en mismo timezone, no revelaron el issue.

---

## La Solucion

### Que hicimos
1. Cambiamos a usar **date-only strings** sin timestamps
2. Creamos funciones utiles para parsing seguro
3. Actualizamos todos los componentes

### Codigo/Cambios

**Utilidades creadas:**

```typescript
// lib/utils/dates.ts

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
```

**Componente actualizado:**

```typescript
// components/TaskItem.tsx

// ANTES
const dueDate = task.due_date ? new Date(task.due_date) : null

// DESPUES
const dueDate = task.due_date ? parseDateString(task.due_date) : null
```

### Archivos Modificados
- `lib/utils/dates.ts` - Funciones nuevas
- `components/TaskItem.tsx` - Usar parseDateString
- `components/TaskInput.tsx` - Usar toDateOnlyString
- `app/actions.ts` - Guardar como date-only string

---

## Prevencion Futura

### Como evitar que vuelva a pasar

- [x] Usar SIEMPRE `parseDateString` y `toDateOnlyString`
- [x] NUNCA usar `new Date(string)` directamente para fechas de tareas
- [x] Documentar en guia de desarrollo
- [ ] Agregar tests con multiples timezones
- [ ] Agregar lint rule para detectar `new Date()`

### Documentacion actualizada
- [docs/technical/TIMEZONE_HANDLING.md](../../docs/technical/TIMEZONE_HANDLING.md)

---

## Aprendizajes Clave

1. **JavaScript Date es complejo:** Siempre incluye timezone, incluso cuando solo necesitas la fecha
2. **UTC no es neutral:** Para dates sin hora, usar strings es mas seguro que Date objects
3. **Testing en multiples timezones:** Tests en un solo timezone no revelan estos bugs

---

## Recursos Relacionados

- [MDN: Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [Stack Overflow: Date without timezone](https://stackoverflow.com/questions/7556591)
- [docs/technical/TIMEZONE_HANDLING.md](../../docs/technical/TIMEZONE_HANDLING.md)

---

## Autor

**Quien lo resolvio:** Claude + Joshua
**Revisado por:** Project Team
**Fecha de creacion:** 2025-10-05
```

#### lessons-learned/by-category/supabase.md

```markdown
# Lecciones Aprendidas: Supabase

Problemas y soluciones relacionados con Supabase (PostgreSQL, Auth, RLS, Real-time).

---

## Token Refresh de Google Calendar

**Fecha:** 2025-10-21
**Problema:** Duplicate key error al hacer refresh de tokens de Google

### Sintomas
```
ERROR: duplicate key value violates unique constraint "user_google_tokens_user_id_key"
```

### Causa
Intentar INSERT cuando ya existe un registro. Deberiamos hacer UPSERT.

### Solucion
```sql
-- ANTES
INSERT INTO user_google_tokens (user_id, access_token, refresh_token)
VALUES ($1, $2, $3)

-- DESPUES
INSERT INTO user_google_tokens (user_id, access_token, refresh_token)
VALUES ($1, $2, $3)
ON CONFLICT (user_id)
DO UPDATE SET
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  updated_at = NOW()
```

**Leccion:** Siempre usar UPSERT (INSERT ... ON CONFLICT) cuando el registro puede existir.

**Detalle:** [../by-date/2025-10-21-oauth-token-refresh.md](../by-date/2025-10-21-oauth-token-refresh.md)

---

## RLS Bloquea Queries Legit

**Fecha:** [Pendiente documentar]
**Problema:** Row Level Security bloqueaba queries validas

[TODO: Documentar cuando ocurra]

---

_Agrega nuevas lecciones aqui conforme surjan_
```

### 6.4 Proceso de Documentacion de Lecciones

**Cuando documentar:**
- Problema que tomo mas de 1 hora resolver
- Bug en produccion
- Configuracion compleja que costo entender
- Solucion no obvia o contra-intuitiva
- Algo que puede beneficiar al resto del equipo

**Flujo:**

1. **Durante la resolucion:** Tomar notas de pasos, hipotesis, intentos
2. **Al resolver:** Usar TEMPLATE.md para documentar
3. **Guardar en by-date/** con nombre descriptivo
4. **Actualizar by-category/** agregando referencia
5. **Actualizar INDEX.md** con keywords
6. **Commit:** "docs: add lesson learned - [titulo corto]"

---

## 7. PLAN DE EJECUCION PASO A PASO

### 7.1 Pre-requisitos

```bash
# 1. Hacer backup del proyecto
cd /c/Users/yoshi/Downloads/FocusOnIt
cp -r task-manager task-manager-backup-$(date +%Y%m%d)

# 2. Asegurar que estamos en main branch y actualizado
cd task-manager
git checkout main
git pull origin main

# 3. Verificar que no hay cambios sin commit
git status
# Debe decir "working tree clean"

# 4. Crear rama para reorganizacion
git checkout -b project/reorganization
```

### 7.2 Fase 1: Crear Estructura de Carpetas (5 min)

```bash
# Crear carpetas principales
mkdir -p docs/{setup,features,integrations,api,technical,troubleshooting,guides}

# Crear subcarpetas de integraciones
mkdir -p docs/integrations/{google-calendar,google-oauth,n8n}
mkdir -p docs/integrations/n8n/{workflows,code-snippets}

# Crear carpeta de scripts
mkdir -p scripts/{setup,utils}

# Crear carpeta de lecciones aprendidas
mkdir -p lessons-learned/{by-category,by-date}

# Crear carpeta .github
mkdir -p .github/workflows

# Verificar estructura
tree -L 3 docs/ scripts/ lessons-learned/
```

### 7.3 Fase 2: Crear Archivos Base (15 min)

```bash
# Crear README.md en carpetas principales
touch docs/README.md
touch docs/integrations/README.md
touch docs/integrations/n8n/README.md
touch scripts/README.md
touch lessons-learned/README.md
touch lessons-learned/TEMPLATE.md
touch lessons-learned/INDEX.md

# Crear archivos de lecciones por categoria
touch lessons-learned/by-category/{supabase,google-calendar,docker,kong,n8n,nextjs,typescript}.md

# Copiar contenido preparado (usar Write tool para cada archivo)
# Ver seccion 6 para contenido de lessons-learned/
```

### 7.4 Fase 3: Mover Archivos n8n (5 min)

```bash
# Mover archivos n8n
mv n8n-workflow-voice-to-task.json docs/integrations/n8n/workflows/voice-to-task.json
mv n8n-code-bulletproof.js docs/integrations/n8n/code-snippets/bulletproof-parser.js
mv n8n-parse-json-improved.js docs/integrations/n8n/code-snippets/json-improved.js

# Verificar
ls docs/integrations/n8n/workflows/
ls docs/integrations/n8n/code-snippets/
```

### 7.5 Fase 4: Mover Script de Verificacion (2 min)

```bash
# Mover verify-setup.js
mv verify-setup.js scripts/verify-setup.js

# Mover setup.sql
mv setup.sql supabase/setup.sql

# Verificar
ls scripts/
ls supabase/
```

### 7.6 Fase 5: Consolidar Onboarding (45 min)

**Manual:** Crear GETTING_STARTED.md usando Write tool

Contenido consolidado de:
- WELCOME.md
- START_HERE.md
- QUICKSTART.md

Ver seccion 3.1 para estructura detallada.

```bash
# Despues de crear GETTING_STARTED.md
# Crear redirects en archivos antiguos
```

### 7.7 Fase 6: Mover y Consolidar Google Calendar (30 min)

```bash
# Mover archivos
# (Usar Write tool para crear archivos consolidados primero)

# Luego crear redirects
```

### 7.8 Fase 7: Consolidar Google OAuth (1 hora)

**Manual:** Crear archivos consolidados usando Write tool

- docs/integrations/google-oauth/SETUP.md (consolidado)
- docs/integrations/google-oauth/YCM360.md

Ver seccion 3.2 para estrategia detallada.

### 7.9 Fase 8: Consolidar Timezone (30 min)

**Manual:** Crear docs/technical/TIMEZONE_HANDLING.md usando Write tool

Ver seccion 3.3 para estructura.

### 7.10 Fase 9: Actualizar Referencias (30 min)

```bash
# Actualizar package.json
# Cambiar "node verify-setup.js" a "node scripts/verify-setup.js"

# Buscar otras referencias
grep -r "verify-setup.js" .
grep -r "setup.sql" .
grep -r "n8n-workflow" .

# Actualizar manualmente donde sea necesario
```

### 7.11 Fase 10: Crear Documentacion Faltante (2 horas)

**Prioridad:**
1. docs/README.md (indice maestro)
2. docs/integrations/n8n/README.md
3. lessons-learned/README.md + TEMPLATE.md
4. scripts/README.md

Ver secciones anteriores para contenido.

### 7.12 Fase 11: Validacion (30 min)

```bash
# Ejecutar script de validacion
chmod +x scripts/utils/validate-reorganization.sh
./scripts/utils/validate-reorganization.sh

# Probar aplicacion
npm install
npm run dev

# Abrir http://localhost:3000 y verificar que todo funciona

# Ejecutar verify
npm run verify
```

### 7.13 Fase 12: Commit y Push (10 min)

```bash
# Stage todos los cambios
git add .

# Verificar cambios
git status

# Commit
git commit -m "$(cat <<'EOF'
project: reorganize project structure for scalability

BREAKING CHANGES:
- Move 15 MD files from root to docs/ subdirectories
- Consolidate onboarding docs (4 files -> 1 file)
- Consolidate OAuth docs (4 files -> 2 files)
- Move n8n files to docs/integrations/n8n/
- Move scripts to scripts/ directory
- Add lessons-learned/ directory system

NEW STRUCTURE:
- docs/setup/ - Configuration guides
- docs/features/ - Feature documentation
- docs/integrations/ - External integrations (Google, n8n)
- docs/api/ - API documentation
- docs/technical/ - Technical documentation
- docs/troubleshooting/ - Problem resolution
- docs/guides/ - Development guides
- scripts/ - Utility scripts
- lessons-learned/ - Knowledge base

IMPROVEMENTS:
- Root directory cleaned (15 -> 2 MD files)
- Better organization for scalability
- Reduced documentation redundancy (60% -> 10%)
- Added lessons learned system
- Improved onboarding experience

FILES MOVED:
- WELCOME.md, START_HERE.md, QUICKSTART.md -> GETTING_STARTED.md
- GOOGLE_SIGN_IN_*.md -> docs/integrations/google-oauth/SETUP.md
- GOOGLE_CALENDAR_*.md -> docs/integrations/google-calendar/
- n8n-*.{json,js} -> docs/integrations/n8n/
- verify-setup.js -> scripts/verify-setup.js
- setup.sql -> supabase/setup.sql

Generated with Claude Code
https://claude.com/claude-code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push
git push -u origin project/reorganization
```

### 7.14 Tiempo Total Estimado

| Fase | Tiempo | Acumulado |
|------|--------|-----------|
| Pre-requisitos | 5 min | 5 min |
| Crear estructura | 5 min | 10 min |
| Crear archivos base | 15 min | 25 min |
| Mover archivos n8n | 5 min | 30 min |
| Mover scripts | 2 min | 32 min |
| Consolidar onboarding | 45 min | 77 min |
| Mover Google Calendar | 30 min | 107 min |
| Consolidar Google OAuth | 60 min | 167 min |
| Consolidar Timezone | 30 min | 197 min |
| Actualizar referencias | 30 min | 227 min |
| Crear docs faltante | 120 min | 347 min |
| Validacion | 30 min | 377 min |
| Commit y push | 10 min | 387 min |

**Total:** ~6.5 horas

---

## 8. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|--------------|---------|------------|
| **Links rotos en docs** | Alta | Medio | Script de verificacion automatica |
| **Referencias en codigo rotas** | Media | Alto | Busqueda exhaustiva + testing |
| **Git merge conflicts** | Baja | Medio | Trabajar en rama dedicada |
| **Perder contenido al consolidar** | Media | Alto | Revisar diffs cuidadosamente, backup |
| **Confundir a colaboradores** | Alta | Bajo | Mantener redirects 2 semanas |
| **Romper CI/CD** | Baja | Alto | Validar antes de merge |
| **Olvidar actualizar package.json** | Media | Medio | Checklist de validacion |

---

## 9. ROLLBACK PLAN

Si algo sale mal:

```bash
# Opcion 1: Revertir cambios locales (antes de push)
git checkout main
git branch -D project/reorganization

# Restaurar desde backup
cd /c/Users/yoshi/Downloads/FocusOnIt
rm -rf task-manager
cp -r task-manager-backup-YYYYMMDD task-manager

# Opcion 2: Revertir despues de merge (ultimo recurso)
git revert <commit-hash>
git push origin main
```

---

## 10. METRICAS DE EXITO

### 10.1 Metricas Cuantitativas

| Metrica | Antes | Objetivo | Medicion |
|---------|-------|----------|----------|
| Archivos MD en raiz | 15 | 2 | `ls *.md | wc -l` |
| Tiempo de onboarding | 7 min | 2 min | Test con nuevo dev |
| Redundancia en docs | 60% | <10% | Revision manual |
| Archivos a actualizar por cambio | 3-4 | 1 | Por tipo de cambio |
| Links rotos | ? | 0 | Script verificacion |

### 10.2 Metricas Cualitativas

- [ ] Nuevo desarrollador puede configurar proyecto en <10 min siguiendo GETTING_STARTED.md
- [ ] Encontrar documentacion de feature especifico toma <2 min
- [ ] Navegacion en docs/ es intuitiva sin necesitar busqueda
- [ ] Equipo prefiere nueva estructura vs anterior (encuesta)
- [ ] Menos preguntas repetidas sobre configuracion

---

## 11. SIGUIENTES PASOS POST-REORGANIZACION

### 11.1 Corto Plazo (1-2 semanas)

- [ ] Crear PR y solicitar review
- [ ] Hacer merge a main
- [ ] Eliminar redirects despues de periodo de gracia
- [ ] Actualizar documentacion externa (si existe)
- [ ] Anunciar cambios al equipo

### 11.2 Mediano Plazo (1 mes)

- [ ] Crear primeras 3-5 lecciones aprendidas
- [ ] Completar docs faltantes de prioridad media
- [ ] Agregar GitHub Actions para CI/CD
- [ ] Crear CONTRIBUTING.md detallado
- [ ] Iniciar CHANGELOG.md

### 11.3 Largo Plazo (3 meses)

- [ ] Sistema de versioning de docs
- [ ] Docs automaticamente generados de codigo (TypeDoc)
- [ ] Tests de integracion para validar docs
- [ ] Proceso de review de docs en PRs
- [ ] Metricas de uso de documentacion

---

## 12. APENDICE A: COMANDOS UTILES

```bash
# Buscar archivos por patron
find . -name "*.md" -not -path "./node_modules/*"

# Buscar contenido en archivos
grep -r "texto" --include="*.md" .

# Ver cambios en Git
git diff --name-status

# Listar archivos staged
git diff --cached --name-only

# Ver estructura de carpetas
tree -L 2 docs/

# Contar archivos en carpeta
find docs/ -type f | wc -l

# Verificar links externos en MD
grep -roh 'http[s]*://[^)]*' *.md docs/

# Buscar TODOs en codigo
grep -r "TODO" app/ components/ lib/
```

---

## 13. APENDICE B: REFERENCIAS

- [Auditoria de Documentacion](AUDITORIA_DOCUMENTACION.md)
- [Plan de Reorganizacion Original](PLAN_REORGANIZACION_DOCS.md)
- [Matriz de Contenido](MATRIZ_CONTENIDO_DOCS.md)
- [Resumen Ejecutivo](RESUMEN_AUDITORIA.md)

---

## 14. CHANGELOG DE ESTE DOCUMENTO

| Fecha | Version | Cambios |
|-------|---------|---------|
| 2025-11-11 | 1.0 | Creacion inicial del plan completo |

---

**Preparado por:** Project Manager + Documentation Specialist
**Aprobado para ejecucion:** [Pendiente]
**Ejecutado por:** [DevOps Engineer - Pendiente]
**Fecha de creacion:** 11 de noviembre de 2025
**Ultima actualizacion:** 11 de noviembre de 2025

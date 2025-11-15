# Reglas de Organización del Proyecto FocusOnIt

**Versión:** 1.0.0
**Fecha:** 2025-11-15
**Propósito:** Definir reglas claras y específicas sobre dónde ubicar cada tipo de archivo
**Aplicable a:** Todos los desarrolladores, documentadores y Claude

---

## PRINCIPIOS FUNDAMENTALES

### 🎯 Alcance de Organización

**IMPORTANTE:** Este proyecto tiene **DOS carpetas principales** que deben mantenerse organizadas:

1. **`FocusOnIt/`** - Carpeta padre del proyecto
   - Contiene `task-manager/` + documentación de gestión
   - Contiene historial de workflows n8n
   - Debe mantenerse organizada y limpia

2. **`task-manager/`** - Proyecto principal (repositorio Git)
   - Aplicación Next.js
   - Toda la documentación técnica
   - Sistema de lecciones aprendidas

**Ambas carpetas forman parte de las reglas de organización del proyecto.**

---

### 1. Minimalismo en la Raíz
**Aplica a:** `task-manager/` y `FocusOnIt/`

La raíz de ambas carpetas debe ser **limpia, predecible y profesional**.

**Regla de oro:** Si no es absolutamente esencial verlo al abrir el proyecto, NO va en la raíz.

### 2. Todo Tiene su Lugar
Cada tipo de contenido tiene una ubicación específica. Nunca crear archivos "temporales" en ninguna de las dos raíces.

### 3. Nombres Descriptivos y Consistentes
- Usar convenciones de nombres estrictas
- Los nombres deben ser autoexplicativos
- Evitar abreviaciones ambiguas

---

## ESTRUCTURA DE CARPETAS PRINCIPALES

### FocusOnIt/ - Carpeta Padre

**Estructura permitida:**

```
FocusOnIt/
├── ESTRUCTURA_PROYECTO.md          ← Documentación de estructura (ÚNICO .md permitido)
├── task-manager/                   ← Proyecto principal (repositorio Git)
├── n8n-workflows-history/          ← Historial de workflows n8n
├── project-docs/                   ← Documentación de gestión del proyecto
│   ├── summaries/                  ← Resúmenes de entregas
│   ├── incidents/                  ← Incidentes de seguridad
│   └── fixes/                      ← Fixes importantes
└── package.json                    ← Configuración npm (si aplica)
```

**Reglas:**
- ✅ Solo 1 archivo `.md` permitido en raíz: `ESTRUCTURA_PROYECTO.md`
- ✅ Solo carpetas organizacionales: `task-manager/`, `n8n-workflows-history/`, `project-docs/`
- ❌ NUNCA crear archivos temporales en la raíz
- ❌ NUNCA crear archivos de sesiones de trabajo aquí (van en `task-manager/docs/sessions/`)

---

## ESTRUCTURA DE task-manager/

### Archivos Markdown Permitidos (SOLO 3)

```
task-manager/
├── README.md                    ← Documentación principal del proyecto
├── GETTING_STARTED.md           ← Guía de inicio rápido
└── CLAUDE.md                    ← Manual para Claude y desarrolladores
```

**PROHIBIDO:** Cualquier otro archivo `.md` en la raíz

### Archivos de Configuración Permitidos

```
task-manager/
├── package.json                 ← Dependencias npm
├── package-lock.json            ← Lock file de npm
├── tsconfig.json                ← Configuración TypeScript
├── next.config.js               ← Configuración Next.js
├── next.config.security.js      ← Configuración de seguridad
├── tailwind.config.ts           ← Configuración Tailwind CSS
├── postcss.config.mjs           ← Configuración PostCSS
├── .eslintrc.json               ← Configuración ESLint
├── .gitignore                   ← Archivos ignorados por git
├── .dockerignore                ← Archivos ignorados por Docker
├── .env.example                 ← Template de variables de entorno
├── middleware.ts                ← Middleware de Next.js
├── instrumentation.ts           ← Instrumentación (monitoring)
├── Dockerfile                   ← Configuración Docker
└── setup.sql                    ← Script inicial de base de datos
```

### Archivos Ejecutables Permitidos

```
task-manager/
└── verify-setup.js              ← Script de verificación de setup
```

### Carpetas Permitidas en la Raíz

```
task-manager/
├── .git/                        ← Control de versiones
├── .github/                     ← GitHub Actions, templates
├── .next/                       ← Build de Next.js (generado)
├── node_modules/                ← Dependencias (generado)
├── app/                         ← Next.js App Router
├── components/                  ← Componentes React
├── context/                     ← Context providers
├── hooks/                       ← Custom React hooks
├── lib/                         ← Utilidades y funciones
├── types/                       ← TypeScript types
├── public/                      ← Assets estáticos
├── supabase/                    ← Configuración Supabase
├── docs/                        ← 📚 TODA LA DOCUMENTACIÓN
├── lessons-learned/             ← 📖 Lecciones aprendidas
└── scripts/                     ← Scripts de automatización
```

---

## ESTRUCTURA DE DOCUMENTACIÓN (docs/)

### Principio
**TODO lo que sea documentación técnica va en `docs/`**

### Estructura Completa

```
docs/
├── README.md                    ← Índice maestro de documentación
├── ORGANIZATION_RULES.md        ← Este documento
│
├── setup/                       ← Guías de configuración
│   ├── DETAILED_SETUP.md        ← Setup completo paso a paso
│   └── ENVIRONMENT_VARIABLES.md ← Variables de entorno
│
├── integrations/                ← Integraciones externas
│   ├── README.md                ← Índice de integraciones
│   ├── google-calendar/
│   │   ├── README.md
│   │   ├── SETUP.md
│   │   ├── IMPLEMENTATION.md
│   │   └── YCM360.md
│   └── n8n/
│       ├── README.md
│       ├── n8n-workflow-voice-to-task.json
│       ├── n8n-code-bulletproof.js
│       └── n8n-parse-json-improved.js
│
├── technical/                   ← Arquitectura y docs técnicas
│   ├── ARCHITECTURE.md
│   ├── TIMEZONE_HANDLING.md
│   └── DATABASE_SCHEMA.md
│
├── features/                    ← Documentación de features
│   ├── POMODORO_TIMER.md
│   └── REAL_TIME_SYNC.md
│
├── api/                         ← Documentación de API endpoints
│   ├── VOICE_TO_TASK.md
│   └── CALENDAR_SYNC.md
│
├── security/                    ← Auditorías y checklists de seguridad
│   ├── SECURITY_AUDIT_REPORT.md
│   ├── SECURITY_CHECKLIST.md
│   ├── SECURITY_FINDINGS.md
│   └── SECURITY_FIXES_APPLIED.md
│
├── deployments/                 ← Documentación de deployment
│   ├── VERCEL_DEPLOYMENT.md
│   ├── VERCEL_FIX_INSTRUCTIONS.md
│   ├── CICD_SETUP_INSTRUCTIONS.md
│   ├── DEPLOYMENT_SUMMARY.md
│   ├── QUICK_FIX.md
│   └── 2025-11-11-emergency-security-fixes.md
│
├── sessions/                    ← Sesiones de trabajo y deliverables
│   ├── DELIVERABLES_2025-11-11.md
│   ├── SESSION_2025-11-11_CLOSURE_AND_NEXT_STEPS.md
│   └── NEXT_SESSION_START_HERE.md
│
├── guides/                      ← Guías de desarrollo
│   ├── GITHUB_SETUP.md
│   ├── TESTING.md
│   └── CONTRIBUTING.md
│
└── meta/                        ← Docs sobre la documentación
    ├── AUDITORIA_DOCUMENTACION.md
    ├── MATRIZ_CONTENIDO_DOCS.md
    ├── PLAN_REORGANIZACION_DOCS.md
    ├── PLAN_REORGANIZACION_PROYECTO.md
    ├── RESUMEN_AUDITORIA.md
    └── REFACTOR_SUMMARY.md
```

---

## REGLAS DE UBICACIÓN POR TIPO

### 📝 Documentación Técnica

| Tipo de Documento | Ubicación | Ejemplo |
|-------------------|-----------|---------|
| **Feature nueva** | `docs/features/FEATURE_NAME.md` | Timer Pomodoro → `docs/features/POMODORO_TIMER.md` |
| **API endpoint** | `docs/api/ENDPOINT_NAME.md` | Voice to Task → `docs/api/VOICE_TO_TASK.md` |
| **Integración externa** | `docs/integrations/nombre/` | Google Calendar → `docs/integrations/google-calendar/` |
| **Configuración/Setup** | `docs/setup/TOPIC.md` | Deployment → `docs/setup/DEPLOYMENT.md` |
| **Arquitectura/Técnico** | `docs/technical/TOPIC.md` | Schema BD → `docs/technical/DATABASE_SCHEMA.md` |
| **Guía de desarrollo** | `docs/guides/TOPIC.md` | Testing → `docs/guides/TESTING.md` |

### 🔒 Documentación de Seguridad

| Tipo de Documento | Ubicación | Ejemplo |
|-------------------|-----------|---------|
| **Auditoría de seguridad** | `docs/security/SECURITY_AUDIT_*.md` | Auditoría Nov 2025 → `docs/security/SECURITY_AUDIT_REPORT.md` |
| **Checklist de seguridad** | `docs/security/SECURITY_CHECKLIST.md` | Checklist general |
| **Vulnerabilidades encontradas** | `docs/security/SECURITY_FINDINGS.md` | Findings detallados |
| **Fixes aplicados** | `docs/security/SECURITY_FIXES_APPLIED.md` | Resumen de fixes |

### 🚀 Documentación de Deployment

| Tipo de Documento | Ubicación | Ejemplo |
|-------------------|-----------|---------|
| **Guía de deployment** | `docs/deployments/PLATFORM_*.md` | Vercel → `docs/deployments/VERCEL_DEPLOYMENT.md` |
| **Instrucciones CI/CD** | `docs/deployments/CICD_*.md` | GitHub Actions → `docs/deployments/CICD_SETUP_INSTRUCTIONS.md` |
| **Quick fixes de deployment** | `docs/deployments/QUICK_FIX.md` | Fixes rápidos |
| **Resumen de deployment** | `docs/deployments/DEPLOYMENT_SUMMARY.md` | Resumen general |
| **Deployment emergencia** | `docs/deployments/YYYY-MM-DD-emergency-*.md` | 2025-11-11 → `docs/deployments/2025-11-11-emergency-security-fixes.md` |

### 📅 Documentación de Sesiones

| Tipo de Documento | Ubicación | Ejemplo |
|-------------------|-----------|---------|
| **Deliverables de sesión** | `docs/sessions/DELIVERABLES_YYYY-MM-DD.md` | Deliverables → `docs/sessions/DELIVERABLES_2025-11-11.md` |
| **Resumen de sesión** | `docs/sessions/SESSION_YYYY-MM-DD_*.md` | Sesión Nov → `docs/sessions/SESSION_2025-11-11_CLOSURE_AND_NEXT_STEPS.md` |
| **Start here** | `docs/sessions/NEXT_SESSION_START_HERE.md` | Punto de inicio próxima sesión |

### 📖 Lecciones Aprendidas

**Sistema completo documentado en:** `lessons-learned/README.md`

```
lessons-learned/
├── README.md                    ← Introducción al sistema
├── TEMPLATE.md                  ← Template para nuevas lecciones
├── index.md                     ← Índice maestro con tabla
├── IMPLEMENTACION_COMPLETADA.md ← Documentación del sistema
│
├── by-category/                 ← Organizadas por tecnología
│   ├── supabase.md              ← Lecciones de Supabase
│   ├── google-calendar.md       ← Lecciones de Google Calendar
│   ├── nextjs.md                ← Lecciones de Next.js
│   ├── docker.md
│   ├── kong.md
│   ├── n8n.md
│   └── security.md
│
└── by-date/                     ← Organizadas cronológicamente
    ├── 2025-10-22-calendar-sync-config-debugging.md
    ├── 2025-10-22-token-refresh-duplicate-key.md
    ├── 2025-10-23-deletion-sync-ui-update.md
    ├── 2025-11-11-csp-supabase-blocking.md
    ├── 2025-11-11-edge-runtime-environment-variables.md
    └── 2025-11-11-security-vulnerabilities-auth.md
```

**Formato de nombres:** `YYYY-MM-DD-titulo-descriptivo-corto.md`

### 🛠️ Scripts

```
scripts/
├── README.md                    ← Documentación de scripts
├── add-lesson.js                ← Script para agregar lecciones
└── utils/                       ← Utilidades compartidas
```

---

## CONVENCIONES DE NOMBRES

### Archivos Markdown

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| **Raíz (3 únicos)** | `SCREAMING_SNAKE_CASE.md` | `README.md`, `CLAUDE.md` |
| **Docs generales** | `SCREAMING_SNAKE_CASE.md` | `ARCHITECTURE.md`, `DATABASE_SCHEMA.md` |
| **Lecciones aprendidas** | `YYYY-MM-DD-titulo-corto.md` | `2025-11-11-csp-supabase-blocking.md` |
| **Sesiones** | `DELIVERABLES_YYYY-MM-DD.md` o `SESSION_YYYY-MM-DD_*.md` | `DELIVERABLES_2025-11-11.md` |

### Carpetas

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| **Documentación** | `kebab-case` | `google-calendar/`, `lessons-learned/` |
| **Categorías** | `singular` cuando categoría, `plural` cuando contenedor | `by-date/`, `by-category/` |

### Código Fuente

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| **Componentes React** | `PascalCase.tsx` | `TaskItem.tsx`, `PomodoroTimer.tsx` |
| **Utilidades** | `camelCase.ts` | `dateUtils.ts`, `taskHelpers.ts` |
| **API routes** | `kebab-case/route.ts` | `voice-to-task/route.ts` |
| **Carpetas código** | `kebab-case/` | `google-calendar/`, `ui/` |

---

## REGLAS ESPECÍFICAS

### Cuándo Documentar en `lessons-learned/`

✅ **SÍ documentar cuando:**
- Problema tomó más de 1 hora resolver
- Bug en producción o staging
- Configuración compleja que costó entender
- Solución no obvia o contra-intuitiva
- Algo que puede beneficiar al resto del equipo
- Error que podría repetirse en el futuro

❌ **NO documentar cuando:**
- Error tipográfico o typo simple
- Problema resuelto en menos de 15 minutos
- Issue específico de entorno local
- Problema ya documentado en lecciones existentes

### Cuándo Crear Archivo en `docs/security/`

✅ **SÍ crear cuando:**
- Auditoría de seguridad completa
- Checklist de seguridad para CI/CD
- Vulnerabilidades encontradas (incluso si ya están resueltas)
- Documentación de fixes de seguridad aplicados

### Cuándo Crear Archivo en `docs/deployments/`

✅ **SÍ crear cuando:**
- Guía de deployment para nueva plataforma
- Configuración de CI/CD
- Troubleshooting de deployment
- Emergency fixes de producción
- Resumen de deployment importante

### Cuándo Crear Archivo en `docs/sessions/`

✅ **SÍ crear cuando:**
- Sesión de trabajo con deliverables específicos
- Documentar próximos pasos para siguiente sesión
- Resumen de sprint o milestone importante

---

## PROCESO DE ORGANIZACIÓN

### Al Crear Nuevo Documento

1. **Identificar CARPETA PRINCIPAL primero**
   - ¿Va en `FocusOnIt/` o en `task-manager/`?
   - **FocusOnIt/**: Solo docs de gestión de alto nivel
   - **task-manager/**: Todo lo demás (técnico, features, sesiones, etc.)

2. **Identificar tipo de contenido**
   - ¿Es documentación técnica?
   - ¿Es lección aprendida?
   - ¿Es sesión de trabajo?
   - ¿Es deployment/seguridad?
   - ¿Es doc de gestión del proyecto?

3. **Ubicar en carpeta correcta**
   - Usar tabla de "Reglas de Ubicación por Tipo"
   - NUNCA crear en raíz de `task-manager/`
   - NUNCA crear archivos técnicos en raíz de `FocusOnIt/`

4. **Nombrar correctamente**
   - Usar convención apropiada
   - Nombre descriptivo y claro

5. **Actualizar índices**
   - Agregar a `docs/README.md` si es doc técnica
   - Agregar a `lessons-learned/index.md` si es lección
   - Agregar a índice de categoría correspondiente
   - Actualizar `ESTRUCTURA_PROYECTO.md` si afecta estructura general

### Al Encontrar Archivo Fuera de Lugar

1. **Identificar ubicación correcta**
2. **Mover con `git mv`** (para mantener historial)
   ```bash
   git mv ARCHIVO.md docs/categoria/ARCHIVO.md
   ```
3. **Actualizar referencias**
   - Buscar links rotos
   - Actualizar índices

### Al Limpiar el Proyecto

1. **Verificar raíz**
   ```bash
   # Debe mostrar SOLO 3 archivos .md
   find . -maxdepth 1 -name "*.md" -type f
   ```

2. **Si hay más de 3, mover a ubicación correcta**

3. **Commit con mensaje descriptivo**
   ```bash
   git commit -m "docs: reorganize documentation structure"
   ```

---

## CHECKLIST DE ORGANIZACIÓN

### Pre-Commit Checklist

**FocusOnIt/ (carpeta padre):**
- [ ] ¿Hay más de 1 archivo `.md` en la raíz de FocusOnIt/?
- [ ] ¿ESTRUCTURA_PROYECTO.md está actualizado?
- [ ] ¿No hay archivos temporales en FocusOnIt/?

**task-manager/ (proyecto principal):**
- [ ] ¿Hay más de 3 archivos `.md` en la raíz de task-manager/?
- [ ] ¿Los archivos nuevos están en la ubicación correcta?
- [ ] ¿Los nombres siguen las convenciones?
- [ ] ¿Se actualizaron los índices correspondientes?
- [ ] ¿No hay archivos "temporales" o "WIP" en el repo?
- [ ] ¿El build pasa correctamente? (`npm run build`)

### Weekly Cleanup Checklist

**FocusOnIt/ (carpeta padre):**
- [ ] Revisar raíz de FocusOnIt/
- [ ] Verificar que solo existe ESTRUCTURA_PROYECTO.md
- [ ] Revisar `project-docs/` para organización
- [ ] Revisar `n8n-workflows-history/` para archivos obsoletos

**task-manager/ (proyecto principal):**
- [ ] Revisar raíz de task-manager/
- [ ] Mover cualquier archivo mal ubicado
- [ ] Actualizar `docs/README.md` con nuevos docs
- [ ] Actualizar `lessons-learned/index.md` con nuevas lecciones
- [ ] Eliminar archivos obsoletos o duplicados
- [ ] Verificar que carpetas `docs/` están organizadas

---

## EXCEPCIONES

### Casos Especiales Permitidos

1. **NEXT_SESSION_START_HERE.md podría estar en raíz**
   - Solo si es crítico verlo inmediatamente
   - Pero preferir: `docs/sessions/NEXT_SESSION_START_HERE.md`

2. **Archivos temporales durante debugging activo**
   - Permitido durante sesión activa
   - DEBE moverse o eliminarse al final de la sesión
   - NUNCA commitear archivos temporales

3. **Archivos generados automáticamente**
   - `.next/`, `node_modules/`, `tsconfig.tsbuildinfo`
   - Ya están en `.gitignore`

---

## REFERENCIAS

### Documentos Relacionados

- [CLAUDE.md](../CLAUDE.md) - Manual completo para Claude
- [README.md](../README.md) - Documentación principal del proyecto
- [lessons-learned/README.md](../lessons-learned/README.md) - Sistema de lecciones aprendidas
- [docs/README.md](README.md) - Índice maestro de documentación

### Historial de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-11-15 | 1.0.0 | Creación inicial del documento |

---

**Mantenido por:** Documentation Specialist
**Última revisión:** 2025-11-15
**Feedback:** Reportar inconsistencias vía issue o PR

---

## RESUMEN VISUAL

### FocusOnIt/ (Carpeta Padre)

```
✅ RAÍZ LIMPIA (Solo 1 MD + carpetas organizacionales)
FocusOnIt/
├── ESTRUCTURA_PROYECTO.md          ← ÚNICO .md permitido
├── task-manager/                   ← Proyecto principal
├── n8n-workflows-history/          ← Historial workflows
├── project-docs/                   ← Docs de gestión
│   ├── summaries/
│   ├── incidents/
│   └── fixes/
└── package.json

❌ NUNCA EN RAÍZ DE FocusOnIt/
- Archivos de sesiones de trabajo
- Documentos técnicos
- Archivos temporales
- Múltiples archivos .md
```

### task-manager/ (Proyecto Principal)

```
✅ RAÍZ LIMPIA (Solo 3 MD)
task-manager/
├── README.md
├── GETTING_STARTED.md
├── CLAUDE.md
└── docs/
    ├── ORGANIZATION_RULES.md  → Este documento
    ├── security/              → Auditorías, checklists
    ├── deployments/           → Deployment docs, CI/CD
    ├── sessions/              → Deliverables, resúmenes
    ├── features/              → Documentación de features
    ├── api/                   → API endpoints
    ├── technical/             → Arquitectura, BD
    ├── integrations/          → Google Calendar, n8n
    ├── setup/                 → Guías de setup
    ├── guides/                → Guías de desarrollo
    └── meta/                  → Docs sobre docs

❌ NUNCA EN RAÍZ DE task-manager/
- DEPLOYMENT_SUMMARY.md
- SECURITY_AUDIT_REPORT.md
- SESSION_2025-11-11.md
- QUICK_FIX.md
- etc.
```

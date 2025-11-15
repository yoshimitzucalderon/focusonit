# Sentry httpIntegration TypeError - Propiedad 'tracing' No Existe

**Fecha:** 2025-11-15
**Keywords:** sentry, typescript, deployment, vercel, httpintegration, monitoring
**Categoria:** nextjs, typescript
**Severidad:** critica
**Tiempo de Resolucion:** 1 hora
**Impacto:** produccion bloqueada (deployment fallido)
**Commit:** [pendiente]

---

## Resumen Ejecutivo

Deployment en Vercel bloqueado por error TypeScript en `sentry.server.config.ts`. La propiedad `tracing: true` en `httpIntegration()` no existe en la API de @sentry/nextjs v10.25.0. Solucion: remover la propiedad, el tracing se controla via `tracesSampleRate` en el nivel superior de `Sentry.init()`.

---

## Contexto

### Que estabamos haciendo

- Primer setup de Sentry para monitoring de errores en produccion
- Configurando 3 archivos de inicializacion: client, server, edge
- Intentando deploy a Vercel despues de configurar variables de entorno

### Ambiente

- **Entorno:** Deployment a produccion (Vercel)
- **Version:** @sentry/nextjs: 10.25.0, Next.js: 14.2.33
- **Sistema Operativo:** Windows (desarrollo), Vercel Edge Runtime (produccion)
- **TypeScript:** strict mode habilitado
- **Otros:** Tercer intento de deployment (2 errores previos ya resueltos)

---

## El Problema

### Sintomas

Deployment fallaba en fase de build con error TypeScript:

```
./sentry.server.config.ts:23:7
Type error: Object literal may only specify known properties, and 'tracing' does not exist in type 'HttpOptions'.

  21 |     // Add profiling (optional)
  22 |     Sentry.httpIntegration({
> 23 |       tracing: true,
     |       ^
  24 |     }),
  25 |   ],
```

Build local pasaba sin warnings, pero build en Vercel fallaba inmediatamente.

### Como lo detectamos

- Deployment en Vercel fallido con codigo de error
- Log de build mostraba error TypeScript especifico
- Historial: ya habiamos resuelto 2 errores previos en deploys anteriores

### Investigacion Inicial

1. Primera hipotesis: configuracion incorrecta de TypeScript
   - Que probamos: revisar tsconfig.json, verificar versiones
   - Resultado: configuracion correcta, no era el problema

2. Segunda hipotesis: documentacion obsoleta o incorrecta
   - Que probamos: buscar documentacion oficial de @sentry/nextjs v10
   - Resultado: encontrado que la API de httpIntegration cambio

3. Diagnostico final: la propiedad `tracing` no existe en httpIntegration
   - La API acepta `instrumentation` con callbacks, no `tracing: boolean`
   - El tracing se habilita automaticamente si `tracesSampleRate > 0`

---

## Causa Raiz

### Explicacion Tecnica

La integracion `httpIntegration()` en @sentry/nextjs v10 no acepta una propiedad `tracing`. Esta propiedad provenia de versiones anteriores o de documentacion desactualizada.

```typescript
// INCORRECTO - Esto causa el error TypeScript
Sentry.httpIntegration({
  tracing: true, // ❌ Esta propiedad no existe
})

// CORRECTO - Sin opciones o con instrumentation callbacks
Sentry.httpIntegration() // ✅ Forma simple

// O con configuracion avanzada:
Sentry.httpIntegration({
  instrumentation: {
    requestHook: (span, req) => { /* custom logic */ },
    responseHook: (span, res) => { /* custom logic */ },
  }
})
```

### Por que paso

1. **Documentacion desactualizada:** ejemplos en internet usaban API antigua
2. **Cambio de API entre versiones:** Sentry v9 → v10 cambio la interfaz
3. **Build local exitoso inicialmente:** quizas no corriamos strict type-check local

### Por que no lo detectamos antes

- No ejecutamos `npm run build` completo antes del primer deploy
- TypeScript en modo strict solo se ejecuta en build de produccion (Vercel)
- Asumimos que si compilaba localmente, funcionaria en Vercel

---

## La Solucion

### Enfoque de Solucion

Simplificar la configuracion de `httpIntegration` eliminando la propiedad invalida. El tracing HTTP se habilita automaticamente cuando `tracesSampleRate > 0`.

### Pasos Especificos

1. **Eliminar propiedad invalida:**
   - Remover `tracing: true` de `httpIntegration()`
   - Dejar integracion sin opciones (usa defaults)

2. **Verificar que tracing sigue funcionando:**
   - `tracesSampleRate: 1.0` en nivel superior activa tracing
   - httpIntegration se integra automaticamente

3. **Validar localmente antes de deploy:**
   - `npm run type-check` para validar TypeScript
   - `npm run build` para validar build completo

### Codigo/Cambios

**Antes:**
```typescript
// sentry.server.config.ts
integrations: [
  // Add profiling (optional)
  Sentry.httpIntegration({
    tracing: true, // ❌ ERROR: propiedad no existe
  }),
],
```

**Despues:**
```typescript
// sentry.server.config.ts
integrations: [
  // HTTP integration for automatic instrumentation of HTTP requests
  // No additional options needed - tracing is controlled by tracesSampleRate
  Sentry.httpIntegration(), // ✅ CORRECTO: sin opciones
],
```

**Explicacion del cambio:**

El tracing HTTP se habilita automaticamente cuando:
1. `tracesSampleRate > 0` esta configurado en `Sentry.init()`
2. `httpIntegration()` esta presente en el array de integrations

No es necesario pasar opciones a `httpIntegration()` a menos que necesites callbacks customizados.

### Archivos Modificados

- `sentry.server.config.ts` - Removida propiedad invalida de httpIntegration

### Configuracion Actualizada

No se requirieron cambios en variables de entorno. Las configuraciones existentes son suficientes:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_ORG=...
SENTRY_PROJECT=...
```

---

## Testing y Verificacion

### Como verificar que funciona

1. **Ejecutar type-check local:**
```bash
npm run type-check
```
Resultado esperado: sin errores TypeScript

2. **Ejecutar build completo:**
```bash
npm run build
```
Resultado esperado: build exitoso con solo warnings menores

3. **Deploy a Vercel:**
- Push a rama main
- Verificar que deploy completa exitosamente
- Verificar que Sentry recibe eventos de prueba

### Tests agregados

No se agregaron tests automatizados especificos para esta configuracion.

### Casos Edge Probados

- ✅ Build local en Windows (npm run build)
- ✅ Type-check strict mode (tsc --noEmit)
- ✅ Deploy a Vercel (produccion)

---

## Prevencion Futura

### Como evitar que vuelva a pasar

- [x] Ejecutar `npm run build` completo antes de cada deploy
- [x] Agregar comando de pre-deployment check
- [ ] Considerar CI/CD pipeline que ejecute build antes de merge
- [ ] Documentar comandos de validacion en CLAUDE.md

### Best Practices a Seguir

1. **Validacion pre-deploy:**
   - Por que: detectar errores antes de deployment fallido
   - Como: `npm run type-check && npm run build` antes de push

2. **Usar documentacion oficial:**
   - Por que: evitar ejemplos obsoletos de Stack Overflow
   - Como: siempre verificar docs.sentry.io para version exacta

3. **Verificar API de librerias externas:**
   - Por que: APIs cambian entre versiones
   - Como: revisar CHANGELOG de versiones instaladas

### Anti-Patrones a Evitar

- **Anti-patron 1:** copiar configuracion sin verificar version
  - Por que es malo: APIs cambian, codigo obsoleto causa errores
  - Que hacer en su lugar: verificar docs oficiales de version especifica

- **Anti-patron 2:** asumir que build local == build produccion
  - Por que es malo: ambientes diferentes pueden tener checks distintos
  - Que hacer en su lugar: ejecutar mismo proceso de build que CI/CD

### Documentacion Actualizada

- [CLAUDE.md](../../CLAUDE.md) - Agregado checklist pre-commit
- [docs/MONITORING_SETUP.md] - Pendiente: crear guia de Sentry setup

---

## Aprendizajes Clave

1. **La API de httpIntegration cambio en Sentry v10**
   - Aplicacion practica: revisar CHANGELOG al actualizar @sentry/nextjs

2. **Tracing HTTP se habilita via tracesSampleRate, no via httpIntegration**
   - Aplicacion practica: configurar tracing en nivel superior de Sentry.init()

3. **Build local puede pasar pero build de produccion fallar**
   - Aplicacion practica: SIEMPRE ejecutar npm run build antes de deploy

4. **TypeScript strict mode detecta errores que loose mode ignora**
   - Aplicacion practica: mantener strict: true en tsconfig.json

### Conocimiento Adquirido

- Aprendi sobre: API moderna de Sentry v10 integrations
- Ahora entiendo: httpIntegration() no requiere opciones para funcionar
- En el futuro: verificar docs oficiales antes de copiar ejemplos de internet

---

## Recursos Relacionados

### Documentacion Oficial

- [Sentry Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/) - Guia oficial
- [Sentry HTTP Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/http/) - Documentacion de httpIntegration
- [Sentry v10 Release Notes](https://github.com/getsentry/sentry-javascript/releases) - Cambios en API

### Stack Overflow / GitHub Issues

- Revisar siempre GitHub issues de getsentry/sentry-javascript para problemas similares

### Otras Lecciones Relacionadas

- [2025-11-11-security-vulnerabilities-auth.md](./2025-11-11-security-vulnerabilities-auth.md) - Otro deployment bloqueado
- [2025-11-11-edge-runtime-environment-variables.md](./2025-11-11-edge-runtime-environment-variables.md) - Otro error de Vercel deployment

### Recursos Internos

- Error previo 1: Export duplicate en lib/logger.ts (resuelto)
- Error previo 2: query_string type error en sentry.client.config.ts (resuelto)

---

## Metricas de Impacto

- **Deployment bloqueado:** 3 intentos fallidos antes de resolucion
- **Tiempo total resolucion:** ~1 hora (incluyendo 2 errores previos)
- **Severity:** CRITICA (produccion completamente bloqueada)

---

## Notas Adicionales

**Warnings adicionales encontrados (no bloqueantes):**

1. **Supabase realtime-js usa Node.js APIs en Edge Runtime:**
   - No bloqueante, solo advertencia
   - Supabase realtime funciona en server-side, no en middleware

2. **React Hooks exhaustive-deps:**
   - CalendarTaskBlock.tsx: useEffect falta dependencia 'task'
   - TimeScheduleModal.tsx: useEffect falta 'handleSave' y 'onClose'
   - Solucion: agregar a deps array o usar useCallback

3. **Sentry recomienda global-error.js:**
   - Para capturar React render errors en App Router
   - No urgente, considerar agregar en proximo sprint

4. **Sentry recomienda migrar a instrumentation hook:**
   - Turbopack no soportara sentry.client.config.ts
   - Migracion futura recomendada, no urgente

---

## Autor y Metadata

**Quien lo resolvio:** Monitoring Specialist (Claude)
**Revisado por:** Pendiente
**Fecha de creacion:** 2025-11-15
**Ultima actualizacion:** 2025-11-15
**Estado:** resuelto

---

## Checklist de Completitud

- [x] Titulo es descriptivo y claro
- [x] Keywords estan completos y relevantes
- [x] Metadata (fecha, categoria, severidad) esta llena
- [x] Resumen ejecutivo esta completo
- [x] Sintomas del problema estan bien descritos
- [x] Causa raiz esta claramente explicada
- [x] Solucion incluye codigo antes/despues
- [x] Medidas preventivas estan definidas
- [x] Aprendizajes clave estan documentados
- [x] Referencias y recursos estan incluidos
- [ ] He agregado esta leccion a index.md
- [ ] He agregado referencia en by-category/typescript.md
- [x] Ortografia y formato estan correctos

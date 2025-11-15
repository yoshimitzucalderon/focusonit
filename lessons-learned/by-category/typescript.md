# Lecciones Aprendidas: TypeScript

Coleccion de problemas y soluciones relacionados con TypeScript en el proyecto FocusOnIt Task Manager.

---

## Indice de Lecciones

### 2025-11-15: Sentry httpIntegration TypeError - Propiedad 'tracing' No Existe

**Severidad:** Critica
**Tiempo de resolucion:** 1 hora
**Link:** [2025-11-15-sentry-httpintegration-typescript-error.md](../by-date/2025-11-15-sentry-httpintegration-typescript-error.md)

**Resumen:**
Deployment bloqueado por error TypeScript en configuracion de Sentry. La propiedad `tracing: true` en `httpIntegration()` no existe en @sentry/nextjs v10.25.0.

**Causa:**
API de httpIntegration cambio entre versiones. La propiedad `tracing` fue removida, el tracing se controla via `tracesSampleRate` en nivel superior.

**Solucion:**
```typescript
// ❌ INCORRECTO
Sentry.httpIntegration({ tracing: true })

// ✅ CORRECTO
Sentry.httpIntegration() // sin opciones
```

**Lecciones clave:**
- Verificar documentacion oficial para version especifica de libreria
- Ejecutar `npm run build` completo antes de deploy
- TypeScript strict mode detecta errores que loose mode ignora
- Build local exitoso no garantiza build de produccion exitoso

---

## Patrones Comunes

### Errores de Tipos con Librerias Externas

**Problema recurrente:**
APIs de librerias cambian entre versiones mayores, causando errores TypeScript en codigo que antes funcionaba.

**Solucion general:**
1. Verificar version exacta instalada en package.json
2. Buscar documentacion oficial para esa version especifica
3. Revisar CHANGELOG de la libreria para breaking changes
4. Usar TypeScript type-checking antes de deploy

**Comandos utiles:**
```bash
# Ver version exacta instalada
npm list @sentry/nextjs

# Type-check sin compilar
npm run type-check

# Build completo (incluye type-check)
npm run build
```

---

## Best Practices

### Pre-Deployment Checks

Siempre ejecutar antes de hacer push/deploy:

```bash
# 1. Type-check
npm run type-check

# 2. Lint
npm run lint

# 3. Build completo
npm run build
```

### TypeScript Configuration

Mantener configuracion strict en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Por que:** detecta errores en desarrollo, no en produccion.

---

## Anti-Patrones a Evitar

### 1. Usar `any` Para Silenciar Errores

```typescript
// ❌ MALO
const data: any = fetchData()

// ✅ BUENO
interface DataType {
  id: string
  value: number
}
const data: DataType = fetchData()
```

### 2. Ignorrar Errores TypeScript con @ts-ignore

```typescript
// ❌ MALO
// @ts-ignore
const result = problematicCode()

// ✅ BUENO - Entender y corregir el problema
const result = fixedCode()
```

### 3. No Ejecutar Type-Check Antes de Deploy

```typescript
// ❌ MALO
git commit -m "fix"
git push

// ✅ BUENO
npm run type-check && npm run build
git commit -m "fix"
git push
```

---

## Recursos Utiles

### Documentacion

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Next.js TypeScript Docs](https://nextjs.org/docs/app/building-your-application/configuring/typescript)
- [Sentry TypeScript Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

### Herramientas

- `tsc --noEmit` - Type-check sin compilar
- `tsc --traceResolution` - Debug module resolution
- VS Code TypeScript IntelliSense

---

**Ultima actualizacion:** 2025-11-15
**Total de lecciones:** 1

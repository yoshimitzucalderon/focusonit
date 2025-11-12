# Vercel - Lessons Learned

Lecciones aprendidas relacionadas con deployment en Vercel, Edge Runtime, y configuracion de la plataforma.

---

## Indice de Lecciones

### 2025-11-11: Edge Runtime Cannot Access Encrypted Environment Variables

**Archivo:** [2025-11-11-vercel-edge-runtime-env-vars.md](../by-date/2025-11-11-vercel-edge-runtime-env-vars.md)

**Problema:** Produccion caida con 500 errors. Middleware no podia acceder a variables de entorno porque estaban encriptadas en Vercel. Edge Runtime no puede desencriptar variables.

**Solucion:** Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` como Plaintext (no Encrypted) en Vercel Dashboard.

**Keywords:** edge-runtime, middleware, environment-variables, deployment, production-issue

**Severidad:** CRITICAL

**Aprendizaje clave:** Variables usadas en Edge Runtime (middleware) deben configurarse como Plaintext en Vercel, incluso si tienen el prefijo NEXT_PUBLIC_. Edge Runtime no puede acceder a variables encriptadas.

---

## Conceptos Importantes

### Edge Runtime Constraints

El Edge Runtime de Vercel es un entorno JavaScript ligero que corre en edge nodes globalmente. Tiene restricciones importantes:

- ❌ No puede acceder a variables de entorno encriptadas
- ❌ No tiene acceso a Node.js APIs (fs, crypto, process completo)
- ❌ No puede usar dynamic imports de modulos Node.js
- ✅ Arranque rapido (cold starts)
- ✅ Baja latencia global
- ✅ Ideal para middleware y edge functions

### Environment Variables en Vercel

**Tipos de variables:**
1. **Plaintext:** Accesibles en Edge Runtime, Node.js Runtime, Build Time
2. **Sensitive/Encrypted:** Solo accesibles en Node.js Runtime y Build Time

**Donde corre cada cosa:**
- **Middleware:** Edge Runtime (needs plaintext vars)
- **Server Components:** Node.js Runtime (can use encrypted vars)
- **API Routes:** Node.js Runtime por defecto (can use encrypted vars)
- **Edge API Routes:** Edge Runtime (needs plaintext vars)
- **Build Process:** Node.js Runtime (can use encrypted vars)

### Best Practices

1. **Para Middleware:**
   - Usar solo variables plaintext
   - No usar service role keys (demasiado poderosas)
   - Usar anon keys con RLS protection

2. **Para Variables Sensibles:**
   - Service role keys: ENCRYPTED, solo en API routes
   - Client secrets: ENCRYPTED, solo en server-side
   - API tokens: ENCRYPTED, solo en server-side

3. **Para Variables Publicas:**
   - NEXT_PUBLIC_*: Plaintext (ya expuestas al browser)
   - App URLs: Plaintext
   - Public API endpoints: Plaintext

---

## Quick Reference

### Variables That MUST Be Plaintext

```bash
# Used in middleware (Edge Runtime)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SENTRY_DSN
```

### Variables That SHOULD Be Encrypted

```bash
# Server-side only
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET
SENTRY_AUTH_TOKEN
```

### Troubleshooting Commands

```bash
# Check if variables are accessible in Edge Runtime
# (Add temporary console.log in middleware)
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING')
console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING')

# View Vercel Function Logs
vercel logs [deployment-url] --follow

# Redeploy with existing cache
vercel redeploy [deployment-url]
```

---

## Related Documentation

- [Vercel Environment Variables Guide](../../docs/deployment/VERCEL_ENV_VARS.md)
- [Vercel Official Docs - Edge Runtime](https://vercel.com/docs/functions/edge-functions/edge-runtime)
- [Vercel Official Docs - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Maintained by:** DevOps Team
**Last Updated:** 2025-11-11

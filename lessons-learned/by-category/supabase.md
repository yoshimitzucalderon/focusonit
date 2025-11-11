# Lecciones Aprendidas: Supabase

Problemas y soluciones relacionados con Supabase (PostgreSQL, Auth, RLS, Real-time, Storage).

## Descripcion de la Categoria

Esta categoria cubre lecciones aprendidas relacionadas con:

- **PostgreSQL / Base de Datos:** Queries, migraciones, schema, indices, performance
- **Supabase Auth:** Autenticacion, sesiones, OAuth providers, JWT
- **Row Level Security (RLS):** Politicas, permisos, acceso a datos
- **Real-time:** Subscripciones, broadcasts, presence
- **Storage:** Manejo de archivos, buckets, politicas de acceso
- **Edge Functions:** Funciones serverless de Supabase
- **Supabase CLI:** Comandos, migraciones, deploy

---

## Keywords Comunes

supabase, postgresql, postgres, rls, row-level-security, auth, authentication, realtime, storage, edge-functions, migrations, database, sql, queries, performance, indexes

---

## Lecciones Documentadas

### Total: 1

### [Deletion sync and UI update issues](../by-date/2025-10-23-deletion-sync-ui-update.md)

**Fecha:** 2025-10-23
**Severidad:** high
**Keywords:** supabase, real-time, sync, deletion, UI, race-condition, optimistic-update

**Problema:** Race condition al eliminar tareas sincronizadas con Google Calendar y falta de actualizacion de UI al completar tareas.

**Solucion:** Verificar existencia de tarea antes de actualizacion y forzar revalidacion de UI con router.refresh().

**Aprendizaje clave:** Las actualizaciones optimistas requieren manejo cuidadoso de race conditions y revalidacion explicita de UI en Next.js.

---

---

## Como Agregar una Leccion Aqui

Cuando documentes un problema relacionado con Supabase:

1. Crea el archivo completo en `../by-date/YYYY-MM-DD-titulo.md` usando el [TEMPLATE.md](../TEMPLATE.md)
2. Agrega una entrada aqui siguiendo este formato:

```markdown
### [Titulo del Problema](../by-date/YYYY-MM-DD-titulo.md)

**Fecha:** YYYY-MM-DD
**Severidad:** [critica/alta/media/baja]
**Keywords:** supabase, keyword2, keyword3

**Problema:** Breve descripcion del problema (1-2 lineas)

**Solucion:** Breve descripcion de la solucion (1-2 lineas)

**Aprendizaje clave:** Principal leccion aprendida (1 linea)

---
```

3. Actualiza el contador "Total" arriba
4. Ordena las lecciones por fecha (mas recientes primero)

---

## Problemas Comunes de Supabase

Basado en las lecciones aprendidas, estos son patrones comunes (actualizar conforme se documenten):

### RLS (Row Level Security)

- *Por documentar: problemas con politicas RLS*

### Autenticacion

- *Por documentar: problemas de auth y OAuth*

### Performance

- *Por documentar: problemas de queries lentos*

### Migraciones

- *Por documentar: problemas con migraciones de schema*

### Real-time

- *Por documentar: problemas con subscripciones*

---

## Recursos Utiles

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Supabase Discord](https://discord.supabase.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [docs/technical/DATABASE_SCHEMA.md](../../docs/technical/DATABASE_SCHEMA.md) (cuando exista)

---

## Patrones Exitosos

Conforme documentemos lecciones, extraeremos patrones exitosos aqui:

- *Por determinar*

---

**Ultima actualizacion:** 2025-11-11
**Lecciones documentadas:** 1
**Proxima revision:** 2025-12-11

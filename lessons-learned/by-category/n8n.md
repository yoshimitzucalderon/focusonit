# Lecciones Aprendidas: n8n Workflows

Problemas y soluciones relacionados con n8n workflow automation.

## Descripcion de la Categoria

Esta categoria cubre lecciones aprendidas relacionadas con:

- **n8n Core:** Instalacion, configuracion, deployment de n8n
- **Workflows:** Diseno, implementacion, optimizacion de workflows
- **Nodes:** Configuracion de nodes (HTTP Request, Function, IF, etc.)
- **Webhooks:** Configuracion de webhook endpoints, triggers
- **Error Handling:** Manejo de errores en workflows, retry logic, fallbacks
- **Data Transformation:** Parsing JSON, transformacion de datos, expressions
- **Scheduled Workflows:** Cron jobs, scheduled triggers, recurring tasks
- **API Integrations:** Conexion con APIs externas (Supabase, Google, etc.)
- **Credentials Management:** Manejo seguro de credenciales y secrets
- **Debugging:** Troubleshooting de workflows, logging, testing
- **Performance:** Optimizacion de ejecuciones, reduccion de API calls

---

## Keywords Comunes

n8n, workflow, workflows, automation, webhook, webhooks, node, nodes, trigger, scheduled, cron, http-request, function-node, error-handling, retry, api-integration, credentials, json-parsing, data-transformation

---

## Lecciones Documentadas

### Total: 0

_Aun no hay lecciones documentadas en esta categoria_

---

## Como Agregar una Leccion Aqui

Cuando documentes un problema relacionado con n8n:

1. Crea el archivo completo en `../by-date/YYYY-MM-DD-titulo.md` usando el [TEMPLATE.md](../TEMPLATE.md)
2. Agrega una entrada aqui siguiendo este formato:

```markdown
### [Titulo del Problema](../by-date/YYYY-MM-DD-titulo.md)

**Fecha:** YYYY-MM-DD
**Severidad:** [critica/alta/media/baja]
**Keywords:** n8n, keyword2, keyword3

**Problema:** Breve descripcion del problema (1-2 lineas)

**Solucion:** Breve descripcion de la solucion (1-2 lineas)

**Aprendizaje clave:** Principal leccion aprendida (1 linea)

---
```

3. Actualiza el contador "Total" arriba
4. Ordena las lecciones por fecha (mas recientes primero)

---

## Problemas Comunes de n8n

Basado en las lecciones aprendidas, estos son patrones comunes (actualizar conforme se documenten):

### Workflow Design

- *Por documentar: problemas de diseno de workflows*
- *Por documentar: optimizacion de flujos*
- *Por documentar: error handling patterns*

### Webhooks

- *Por documentar: problemas de webhook configuration*
- *Por documentar: testing webhooks locally*
- *Por documentar: payload parsing issues*

### Data Transformation

- *Por documentar: problemas de parsing JSON*
- *Por documentar: expressions y data transformation*
- *Por documentar: manejo de arrays y objetos*

### Error Handling

- *Por documentar: retry strategies*
- *Por documentar: fallback mechanisms*
- *Por documentar: error notifications*

### Integration Issues

- *Por documentar: problemas con API externas*
- *Por documentar: authentication issues*
- *Por documentar: rate limiting*

---

## Workflows del Proyecto

Workflows de n8n implementados en FocusOnIt:

### Voice to Task
**Ubicacion:** [docs/integrations/n8n/workflows/voice-to-task.json](../../docs/integrations/n8n/workflows/voice-to-task.json) (cuando se mueva)

**Descripcion:** Workflow que convierte audio a texto y crea tareas en Supabase.

**Lecciones relacionadas:**
- *Por documentar*

---

## Code Snippets Utiles

Snippets de codigo reutilizable para workflows:

### Bulletproof JSON Parser
**Ubicacion:** [docs/integrations/n8n/code-snippets/bulletproof-parser.js](../../docs/integrations/n8n/code-snippets/bulletproof-parser.js) (cuando se mueva)

**Descripcion:** Parser robusto de JSON que maneja errores gracefully.

### Improved JSON Parser
**Ubicacion:** [docs/integrations/n8n/code-snippets/json-improved.js](../../docs/integrations/n8n/code-snippets/json-improved.js) (cuando se mueva)

**Descripcion:** Version mejorada del parser JSON.

---

## Recursos Utiles

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community Forum](https://community.n8n.io/)
- [n8n GitHub](https://github.com/n8n-io/n8n)
- [n8n Workflow Examples](https://n8n.io/workflows)
- [n8n Node Reference](https://docs.n8n.io/integrations/builtin/core-nodes/)
- [docs/integrations/n8n/](../../docs/integrations/n8n/) (cuando exista)

---

## Patrones Exitosos

Conforme documentemos lecciones, extraeremos patrones exitosos aqui:

### Error Handling Patterns
- *Por determinar*

### Data Transformation Patterns
- *Por determinar*

### Webhook Configuration
- *Por determinar*

### API Integration Best Practices
- *Por determinar*

---

## Anti-Patrones Identificados

Cosas que NO se deben hacer (actualizar conforme se documenten):

### Workflow Design
- *Por determinar*

### Error Handling
- *Por determinar*

### Performance
- *Por determinar*

---

## Debugging Tips

Tips utiles para debugging de workflows n8n:

- **Usar el Execute Node button:** Ejecuta un solo node para ver el output
- **Revisar execution logs:** Menu > Executions para ver historial
- **Usar Function nodes para logging:** Agregar console.log en Function nodes
- **Probar con data minima:** Usar menos datos para debugging rapido
- **Validar JSON:** Siempre validar estructura de JSON antes de parsear

---

**Ultima actualizacion:** 2025-11-11
**Lecciones documentadas:** 0
**Proxima revision:** 2025-12-11

# [Titulo Descriptivo del Problema]

**Fecha:** YYYY-MM-DD
**Keywords:** keyword1, keyword2, keyword3, keyword4
**Categoria:** [supabase / google-calendar / docker / kong / n8n / nextjs / typescript]
**Severidad:** [baja / media / alta / critica]
**Tiempo de Resolucion:** [X horas/dias]
**Impacto:** [desarrollo / staging / produccion / sin-impacto]
**Commit:** [hash del commit que lo resolvio, si aplica]

---

## Resumen Ejecutivo

[2-3 lineas resumiendo el problema y la solucion para lectura rapida]

Ejemplo: "Las tareas con fechas aparecian un dia antes debido a conversion automatica de timezone. Solucion: usar date-only strings sin timestamps."

---

## Contexto

### Que estabamos haciendo

[Descripcion de la tarea o feature que estabas desarrollando cuando encontraste el problema]

Ejemplo:
- Implementando funcionalidad de tareas con fechas especificas
- Probando integracion con Google Calendar
- Configurando deployment en servidor YCM360

### Ambiente

- **Entorno:** [local / staging / produccion]
- **Version:** [version de la app o hash de commit]
- **Sistema Operativo:** [Windows / Linux / macOS]
- **Navegador:** [Chrome / Firefox / Safari, si aplica]
- **Otros:** [informacion relevante del ambiente]

---

## El Problema

### Sintomas

[Que vimos que estaba mal - se lo mas especifico posible]

Lista de sintomas observados:
- Sintoma 1: [descripcion]
- Sintoma 2: [descripcion]
- Sintoma 3: [descripcion]

### Como lo detectamos

[Como nos dimos cuenta del problema]

- Reporte de usuario
- Error en logs
- Test fallando
- Comportamiento inesperado en UI
- Alerta de monitoreo

```
[Ejemplo de error o log - copia el mensaje de error exacto si lo tienes]
ERROR: duplicate key value violates unique constraint "..."
```

### Investigacion Inicial

[Que hicimos primero para diagnosticar]

1. Primera hipotesis: [que pensamos que era]
   - Que probamos: [comandos, queries, tests]
   - Resultado: [funciono / no funciono]

2. Segunda hipotesis: [siguiente teoria]
   - Que probamos: [acciones tomadas]
   - Resultado: [funciono / no funciono]

3. Diagnostico final: [como llegamos a la causa raiz]

---

## Causa Raiz

[Explicacion tecnica detallada de POR QUE ocurrio el problema]

### Explicacion Tecnica

[Descripcion profunda del problema a nivel tecnico]

```typescript
// Ejemplo de codigo que causaba el problema
const problematicCode = () => {
  // Explicacion de por que esto es problematico
}
```

### Por que paso

[Razon fundamental - configuracion incorrecta, bug en libreria, malentendido de API, etc.]

- Razon 1: [explicacion]
- Razon 2: [explicacion]

### Por que no lo detectamos antes

[Falta de tests, caso edge no considerado, documentacion poco clara, etc.]

---

## La Solucion

### Enfoque de Solucion

[Estrategia general para resolver el problema]

Ejemplo:
- Cambiar de Date objects a date-only strings
- Implementar funciones utiles para parsing seguro
- Actualizar todos los componentes afectados

### Pasos Especificos

[Lista ordenada de acciones tomadas para resolver]

1. **Paso 1:** [descripcion]
   - Detalle: [informacion adicional]

2. **Paso 2:** [descripcion]
   - Detalle: [informacion adicional]

3. **Paso 3:** [descripcion]
   - Detalle: [informacion adicional]

### Codigo/Cambios

[Muestra el codigo antes y despues - esto es muy valioso]

**Antes:**
```typescript
// Codigo antiguo que causaba el problema
const oldApproach = () => {
  // Implementacion problematica
}
```

**Despues:**
```typescript
// Nueva implementacion que resuelve el problema
const newApproach = () => {
  // Implementacion corregida
}
```

**Explicacion del cambio:**
[Por que este cambio soluciona el problema]

### Archivos Modificados

Lista de archivos que fueron modificados:

- `app/api/example/route.ts` - [que se cambio aqui]
- `components/ExampleComponent.tsx` - [que se cambio aqui]
- `lib/utils/helpers.ts` - [funciones agregadas o modificadas]
- `types/example.ts` - [tipos actualizados]

### Configuracion Actualizada

[Si se modificaron archivos de configuracion]

**.env.local:**
```bash
# Nueva variable agregada
NEW_CONFIG_VAR=value
```

**docker-compose.yml:**
```yaml
# Cambios en servicios
services:
  example:
    environment:
      - NEW_VAR=value
```

---

## Testing y Verificacion

### Como verificar que funciona

[Pasos para probar que la solucion funciona correctamente]

1. Paso de verificacion 1
2. Paso de verificacion 2
3. Resultado esperado: [que deberia pasar]

### Tests agregados

[Si agregaste tests automatizados para prevenir regresion]

```typescript
// test/example.test.ts
describe('Feature que se corrigio', () => {
  it('should work correctly after fix', () => {
    // Test implementation
    expect(result).toBe(expected)
  })
})
```

### Casos Edge Probados

- Caso 1: [descripcion]
- Caso 2: [descripcion]
- Caso 3: [descripcion]

---

## Prevencion Futura

### Como evitar que vuelva a pasar

[Medidas concretas para prevenir el problema en el futuro]

- [ ] Agregar test unitario/integracion
- [ ] Actualizar documentacion
- [ ] Agregar validacion en codigo
- [ ] Actualizar checklist de deployment
- [ ] Configurar alerta de monitoreo
- [ ] Agregar comentario en codigo critico

### Best Practices a Seguir

[Reglas o practicas que debemos adoptar]

1. **Practica 1:** [descripcion]
   - Por que: [razon]
   - Como: [implementacion]

2. **Practica 2:** [descripcion]
   - Por que: [razon]
   - Como: [implementacion]

### Anti-Patrones a Evitar

[Que NO hacer - esto es muy valioso]

- **Anti-patron 1:** [que no hacer]
  - Por que es malo: [explicacion]
  - Que hacer en su lugar: [alternativa]

- **Anti-patron 2:** [que no hacer]
  - Por que es malo: [explicacion]
  - Que hacer en su lugar: [alternativa]

### Documentacion Actualizada

[Links a documentacion que actualizaste o creaste]

- [docs/technical/EXAMPLE.md](../docs/technical/EXAMPLE.md) - Documentacion tecnica actualizada
- [docs/troubleshooting/EXAMPLE.md](../docs/troubleshooting/EXAMPLE.md) - Agregado a troubleshooting
- [README.md](../README.md) - Seccion actualizada

---

## Aprendizajes Clave

[Las lecciones mas importantes de esta experiencia - se conciso]

1. **Leccion 1:** [descripcion]
   - Aplicacion practica: [cuando aplicar esta leccion]

2. **Leccion 2:** [descripcion]
   - Aplicacion practica: [cuando aplicar esta leccion]

3. **Leccion 3:** [descripcion]
   - Aplicacion practica: [cuando aplicar esta leccion]

### Conocimiento Adquirido

[Nuevas skills o conocimiento tecnico obtenido]

- Aprendi sobre: [concepto o tecnologia]
- Ahora entiendo: [explicacion]
- En el futuro: [como aplicar este conocimiento]

---

## Recursos Relacionados

### Documentacion Oficial

[Links a docs oficiales que fueron utiles]

- [Nombre de la doc](https://ejemplo.com) - [descripcion breve]
- [Otra doc util](https://ejemplo.com) - [descripcion breve]

### Stack Overflow / GitHub Issues

[Links a discusiones relevantes]

- [Stack Overflow: Titulo](https://stackoverflow.com/...) - [descripcion]
- [GitHub Issue: Titulo](https://github.com/...) - [descripcion]

### Otras Lecciones Relacionadas

[Links a otras lecciones aprendidas de este proyecto]

- [YYYY-MM-DD-otra-leccion.md](./YYYY-MM-DD-otra-leccion.md) - Problema relacionado
- [../by-category/categoria.md](../by-category/categoria.md) - Ver todas las lecciones de esta categoria

### Recursos Internos

- [Link a PR relevante](https://github.com/...) - [descripcion]
- [Link a issue](https://github.com/...) - [descripcion]
- [Link a conversacion en Slack/Discord](enlace) - [descripcion]

---

## Metricas de Impacto

[Opcional: si tienes datos de impacto]

- **Tiempo ahorrado:** [X horas por desarrollador]
- **Usuarios afectados:** [numero, si aplica]
- **Downtime:** [duracion, si aplica]
- **Performance improvement:** [metricas antes/despues]

---

## Notas Adicionales

[Cualquier informacion adicional que no encaje en las secciones anteriores]

- Nota 1
- Nota 2
- Consideraciones especiales

---

## Autor y Metadata

**Quien lo resolvio:** [Nombre del desarrollador]
**Revisado por:** [Nombre del reviewer, si aplica]
**Fecha de creacion:** YYYY-MM-DD
**Ultima actualizacion:** YYYY-MM-DD
**Estado:** [resuelto / en-progreso / parcialmente-resuelto]

---

## Checklist de Completitud

Antes de hacer commit, verifica:

- [ ] Titulo es descriptivo y claro
- [ ] Keywords estan completos y relevantes
- [ ] Metadata (fecha, categoria, severidad) esta llena
- [ ] Resumen ejecutivo esta completo
- [ ] Sintomas del problema estan bien descritos
- [ ] Causa raiz esta claramente explicada
- [ ] Solucion incluye codigo antes/despues
- [ ] Medidas preventivas estan definidas
- [ ] Aprendizajes clave estan documentados
- [ ] Referencias y recursos estan incluidos
- [ ] He agregado esta leccion a index.md
- [ ] He agregado referencia en by-category/[categoria].md
- [ ] Ortografia y formato estan correctos

---

**Nota:** Este template es una guia. No todas las secciones son obligatorias para todos los problemas. Adapta segun la complejidad del problema, pero procura ser lo mas completo posible para maximizar el valor de la documentacion.

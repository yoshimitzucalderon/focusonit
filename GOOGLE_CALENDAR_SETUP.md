# Guía de Configuración - Integración con Google Calendar

Esta guía te ayudará a configurar la integración bidireccional de FocusOnIt con Google Calendar.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Configuración en Google Cloud Console](#configuración-en-google-cloud-console)
- [Configuración de la Aplicación](#configuración-de-la-aplicación)
- [Configuración de la Base de Datos](#configuración-de-la-base-de-datos)
- [Uso de la Integración](#uso-de-la-integración)
- [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Requisitos Previos

- Cuenta de Google
- Acceso a [Google Cloud Console](https://console.cloud.google.com/)
- Aplicación FocusOnIt desplegada y funcionando
- Acceso a la base de datos Supabase

---

## ☁️ Configuración en Google Cloud Console

### Paso 1: Crear un Proyecto

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en el selector de proyectos en la parte superior
3. Haz clic en **"Nuevo Proyecto"**
4. Nombre del proyecto: `FocusOnIt` (o el nombre que prefieras)
5. Haz clic en **"Crear"**

### Paso 2: Habilitar Google Calendar API

1. En el menú de navegación, ve a **"APIs y Servicios"** > **"Biblioteca"**
2. Busca **"Google Calendar API"**
3. Haz clic en la API de Google Calendar
4. Haz clic en **"Habilitar"**

### Paso 3: Configurar Pantalla de Consentimiento OAuth

1. Ve a **"APIs y Servicios"** > **"Pantalla de consentimiento de OAuth"**
2. Selecciona **"Externos"** como tipo de usuario
3. Haz clic en **"Crear"**
4. Completa la información:
   - **Nombre de la aplicación**: `FocusOnIt`
   - **Correo electrónico de asistencia al usuario**: Tu correo
   - **Logo de la aplicación**: (Opcional)
   - **Dominios autorizados**: Tu dominio de producción (ej: `focusonit.com`)
   - **Información de contacto del desarrollador**: Tu correo
5. Haz clic en **"Guardar y continuar"**

### Paso 4: Configurar Ámbitos (Scopes)

1. En la sección **"Ámbitos"**, haz clic en **"Añadir o quitar ámbitos"**
2. Busca y selecciona los siguientes ámbitos:
   - `https://www.googleapis.com/auth/calendar.events` - Ver y editar eventos en todos tus calendarios
   - `https://www.googleapis.com/auth/calendar.readonly` - Ver eventos en todos tus calendarios
3. Haz clic en **"Actualizar"**
4. Haz clic en **"Guardar y continuar"**

### Paso 5: Añadir Usuarios de Prueba (Modo de Desarrollo)

Si tu aplicación está en modo de desarrollo:

1. En la sección **"Usuarios de prueba"**, haz clic en **"Añadir usuarios"**
2. Añade las direcciones de correo que usarás para probar
3. Haz clic en **"Guardar y continuar"**

**Nota**: Para producción, necesitarás verificar tu aplicación con Google.

### Paso 6: Crear Credenciales OAuth 2.0

1. Ve a **"APIs y Servicios"** > **"Credenciales"**
2. Haz clic en **"Crear credenciales"** > **"ID de cliente de OAuth"**
3. Tipo de aplicación: **"Aplicación web"**
4. Nombre: `FocusOnIt Web Client`
5. **URIs de redireccionamiento autorizados**:
   - Desarrollo: `http://localhost:3000/api/calendar/oauth/callback`
   - Producción: `https://tu-dominio.com/api/calendar/oauth/callback`
6. Haz clic en **"Crear"**
7. **¡IMPORTANTE!** Guarda el **Client ID** y **Client Secret** que se muestran

---

## ⚙️ Configuración de la Aplicación

### Paso 1: Configurar Variables de Entorno

Abre el archivo `.env.local` en la raíz del proyecto `task-manager/` y actualiza las siguientes variables:

```bash
# Google Calendar OAuth Configuration
GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret-aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback  # Cambiar en producción
NEXTAUTH_SECRET=genera-un-secret-aleatorio-seguro-aqui
```

**Para generar NEXTAUTH_SECRET**, ejecuta en tu terminal:

```bash
openssl rand -base64 32
```

### Paso 2: Variables de Entorno para Producción

En producción, actualiza `GOOGLE_REDIRECT_URI` a tu dominio:

```bash
GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/calendar/oauth/callback
```

---

## 🗄️ Configuración de la Base de Datos

### Paso 1: Ejecutar la Migración

Ejecuta el script SQL en tu base de datos Supabase:

```bash
# Navega al directorio de migraciones
cd task-manager/supabase/migrations

# Ejecuta el script en Supabase SQL Editor
# O usa el Supabase CLI:
supabase db push
```

El archivo de migración `create_google_calendar_tokens.sql` creará:
- Tabla `google_calendar_tokens` para almacenar tokens OAuth
- Índices para búsquedas rápidas
- Políticas de seguridad (Row Level Security)
- Trigger para actualizar automáticamente `updated_at`

### Paso 2: Verificar la Tabla

En el Supabase Dashboard:

1. Ve a **"Table Editor"**
2. Verifica que existe la tabla `google_calendar_tokens` con las siguientes columnas:
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key a auth.users)
   - `access_token` (text)
   - `refresh_token` (text)
   - `token_expiry` (timestamptz)
   - `scope` (text)
   - `calendar_id` (text)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

### Paso 3: Verificar Campos en Tabla Tasks

La tabla `tasks` debe tener los siguientes campos (ya deberían existir):
- `google_event_id` (text, nullable)
- `synced_with_calendar` (boolean, default: false)
- `google_calendar_sync` (boolean, default: false)
- `last_synced_at` (timestamptz, nullable)

---

## 🚀 Uso de la Integración

### Conectar Google Calendar

1. Inicia sesión en FocusOnIt
2. Ve a **Configuración** (Settings)
3. Busca la sección **"Integración con Google Calendar"**
4. Haz clic en **"Conectar con Google"**
5. Autoriza el acceso a tu Google Calendar
6. Serás redirigido de vuelta a la aplicación

### Sincronización Automática

Una vez conectado:

- **Crear tarea**: Se crea automáticamente un evento en Google Calendar
- **Editar tarea**: El evento en Google Calendar se actualiza
- **Eliminar tarea**: El evento se elimina de Google Calendar
- **Completar tarea**: El evento se marca como cancelado

### Importar Eventos Existentes

1. En la sección de integración, haz clic en **"Importar eventos"**
2. Se importarán los eventos de los próximos 30 días
3. Los eventos se convertirán en tareas en FocusOnIt

### Habilitar/Deshabilitar Sincronización por Tarea

En cada tarea, puedes controlar si se sincroniza con Google Calendar:
- El campo `google_calendar_sync` controla si la tarea se sincroniza
- Por defecto, todas las tareas nuevas se sincronizan si tienes Google Calendar conectado

### Desconectar Google Calendar

1. Ve a **Configuración**
2. En la sección de Google Calendar, haz clic en **"Desconectar"**
3. Confirma la acción
4. Las tareas existentes no se eliminarán, pero dejarán de sincronizarse

---

## 🐛 Solución de Problemas

### Error: "Unauthorized" al conectar

**Problema**: No se puede conectar a Google Calendar.

**Solución**:
- Verifica que las credenciales en `.env.local` sean correctas
- Asegúrate de que la URI de redirección coincida exactamente con la configurada en Google Cloud Console
- Verifica que la Google Calendar API esté habilitada

### Error: "Invalid state"

**Problema**: Error de seguridad en el flujo OAuth.

**Solución**:
- Este error ocurre si el `state` parameter no coincide
- Asegúrate de estar usando la misma sesión del navegador
- Intenta cerrar sesión y volver a conectar

### Eventos no se sincronizan

**Problema**: Las tareas no aparecen en Google Calendar.

**Solución**:
- Verifica que `google_calendar_sync` esté en `true` para la tarea
- Revisa los logs del servidor para errores de API
- Verifica que el token no haya expirado (se renueva automáticamente)
- Comprueba que la tarea tenga fecha asignada

### Error: "Token expired"

**Problema**: El token de acceso ha expirado.

**Solución**:
- La aplicación debería renovar automáticamente el token usando el refresh token
- Si persiste, desconecta y vuelve a conectar Google Calendar
- Verifica que el `refresh_token` esté guardado en la base de datos

### No puedo ver la integración en Settings

**Problema**: El componente de Google Calendar no aparece.

**Solución**:
- Asegúrate de que el componente `GoogleCalendarIntegration` esté importado en `settings/page.tsx`
- Verifica que no haya errores de compilación
- Reinicia el servidor de desarrollo

### Eventos duplicados

**Problema**: Los eventos aparecen duplicados en Google Calendar.

**Solución**:
- No ejecutes la importación múltiples veces
- Verifica que `google_event_id` se esté guardando correctamente
- Si hay duplicados, elimínalos manualmente de Google Calendar

---

## 📊 Estructura de la Sincronización

### Flujo de Creación de Tarea

```
1. Usuario crea tarea en FocusOnIt
2. Tarea se guarda en Supabase
3. Si google_calendar_sync = true:
   a. Se llama a POST /api/calendar/sync
   b. Se crea evento en Google Calendar
   c. Se guarda google_event_id en la tarea
   d. Se marca synced_with_calendar = true
```

### Flujo de Actualización de Tarea

```
1. Usuario edita tarea en FocusOnIt
2. Tarea se actualiza en Supabase
3. Si google_event_id existe:
   a. Se llama a POST /api/calendar/sync
   b. Se actualiza evento en Google Calendar
   c. Se actualiza last_synced_at
```

### Flujo de Eliminación de Tarea

```
1. Usuario elimina tarea en FocusOnIt
2. Si google_event_id existe:
   a. Se llama a POST /api/calendar/delete-event
   b. Se elimina evento de Google Calendar
3. Tarea se elimina de Supabase
```

---

## 🔐 Seguridad

- Los tokens OAuth se almacenan encriptados en Supabase
- Row Level Security (RLS) garantiza que cada usuario solo acceda a sus propios tokens
- Los tokens se renuevan automáticamente antes de expirar
- Los refresh tokens se usan para mantener acceso a largo plazo
- Nunca se exponen las credenciales al cliente

---

## 📚 API Endpoints

### Autenticación

- `GET /api/calendar/connect` - Generar URL de OAuth
- `GET /api/calendar/oauth/callback` - Callback de OAuth
- `POST /api/calendar/disconnect` - Desconectar Google Calendar
- `GET /api/calendar/status` - Ver estado de conexión

### Sincronización

- `POST /api/calendar/sync` - Sincronizar tarea(s)
- `POST /api/calendar/import` - Importar eventos
- `POST /api/calendar/delete-event` - Eliminar evento

---

## 🎨 Componentes UI

### GoogleCalendarIntegration

Componente principal para gestionar la conexión en Settings.

**Props**:
- `userId: string` - ID del usuario actual

**Ubicación**: `components/settings/GoogleCalendarIntegration.tsx`

### CalendarSyncIndicator

Indicador visual del estado de sincronización en cada tarea.

**Props**:
- `googleEventId?: string | null`
- `syncedWithCalendar?: boolean`
- `googleCalendarSync?: boolean`
- `size?: 'sm' | 'md' | 'lg'`
- `showLabel?: boolean`

**Ubicación**: `components/CalendarSyncIndicator.tsx`

---

## 🔄 Hooks y Utilidades

### useGoogleCalendarSync

Hook para sincronización en componentes React.

```typescript
const { syncing, syncTask, deleteTask, batchSync, importEvents } = useGoogleCalendarSync()
```

### Utilidades de Sincronización

```typescript
import { syncTaskToCalendar, deleteTaskFromCalendar } from '@/lib/utils/calendarSync'

// Sincronizar después de crear/actualizar
await syncTaskToCalendar(task)

// Eliminar después de borrar
await deleteTaskFromCalendar(task)
```

---

## 📝 Notas Adicionales

### Límites de la API

Google Calendar API tiene límites de uso:
- 1,000,000 de consultas por día
- 100 consultas por usuario por segundo

Para la mayoría de usuarios, estos límites son más que suficientes.

### Verificación de la Aplicación

Para publicar la aplicación:
1. Completa el proceso de verificación de Google
2. Envía tu aplicación para revisión
3. Espera la aprobación (puede tardar varias semanas)

Mientras tanto, puedes usar la aplicación en modo de desarrollo con usuarios de prueba.

### Sincronización Bidireccional Completa

Actualmente, la sincronización es **unidireccional** (FocusOnIt → Google Calendar).

Para implementar sincronización bidireccional completa (Google Calendar → FocusOnIt):
1. Configura Google Calendar Push Notifications
2. Implementa un webhook endpoint
3. Actualiza tareas cuando cambien eventos en Google Calendar

Esta funcionalidad puede implementarse en el futuro.

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google Calendar API habilitada
- [ ] Pantalla de consentimiento OAuth configurada
- [ ] Credenciales OAuth creadas
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Migración de base de datos ejecutada
- [ ] Tabla `google_calendar_tokens` creada
- [ ] Aplicación reiniciada con nuevas variables
- [ ] Conexión probada desde Settings
- [ ] Importación de eventos probada
- [ ] Creación de tarea sincronizada probada

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa esta guía completamente
2. Verifica los logs del servidor (`console.log` y errores)
3. Verifica los logs de Supabase
4. Revisa la consola de Google Cloud para errores de API
5. Abre un issue en el repositorio del proyecto

---

## 📄 Licencia

Esta integración es parte de FocusOnIt y está sujeta a la misma licencia del proyecto principal.

---

**¡Listo!** Ahora tienes una integración completa y bidireccional con Google Calendar. 🎉

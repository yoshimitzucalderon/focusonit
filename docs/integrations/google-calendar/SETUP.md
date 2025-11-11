# Configuracion de Google Calendar - Guia Completa

Esta guia te ayudara a configurar la integracion bidireccional de FocusOnIt con Google Calendar.

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Configuracion en Google Cloud Console](#configuracion-en-google-cloud-console)
- [Configuracion para Cloud (Supabase Cloud)](#configuracion-para-cloud-supabase-cloud)
- [Configuracion para Self-Hosted (Supabase Self-Hosted)](#configuracion-para-self-hosted-supabase-self-hosted)
- [Configuracion de la Aplicacion](#configuracion-de-la-aplicacion)
- [Configuracion de la Base de Datos](#configuracion-de-la-base-de-datos)
- [Uso de la Integracion](#uso-de-la-integracion)
- [Solucion de Problemas](#solucion-de-problemas)

---

## Requisitos Previos

- Cuenta de Google
- Acceso a [Google Cloud Console](https://console.cloud.google.com/)
- Aplicacion FocusOnIt desplegada y funcionando
- Acceso a la base de datos Supabase

---

## Configuracion en Google Cloud Console

### Paso 1: Crear un Proyecto

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en el selector de proyectos en la parte superior
3. Haz clic en "Nuevo Proyecto"
4. Nombre del proyecto: `FocusOnIt` (o el nombre que prefieras)
5. Haz clic en "Crear"

### Paso 2: Habilitar Google Calendar API

1. En el menu de navegacion, ve a "APIs y Servicios" → "Biblioteca"
2. Busca "Google Calendar API"
3. Haz clic en la API de Google Calendar
4. Haz clic en "Habilitar"

### Paso 3: Configurar Pantalla de Consentimiento OAuth

1. Ve a "APIs y Servicios" → "Pantalla de consentimiento de OAuth"
2. Selecciona "Externos" como tipo de usuario
3. Haz clic en "Crear"
4. Completa la informacion:
   - **Nombre de la aplicacion**: `FocusOnIt`
   - **Correo electronico de asistencia al usuario**: Tu correo
   - **Logo de la aplicacion**: (Opcional)
   - **Dominios autorizados**: Tu dominio de produccion (ej: `focusonit.com`)
   - **Informacion de contacto del desarrollador**: Tu correo
5. Haz clic en "Guardar y continuar"

### Paso 4: Configurar Ambitos (Scopes)

1. En la seccion "Ambitos", haz clic en "Anadir o quitar ambitos"
2. Busca y selecciona los siguientes ambitos:
   - `https://www.googleapis.com/auth/calendar.events` - Ver y editar eventos en todos tus calendarios
   - `https://www.googleapis.com/auth/calendar.readonly` - Ver eventos en todos tus calendarios
   - `openid` - Informacion basica del perfil
   - `email` - Ver correo electronico
   - `profile` - Ver informacion de perfil
3. Haz clic en "Actualizar"
4. Haz clic en "Guardar y continuar"

### Paso 5: Anadir Usuarios de Prueba (Modo de Desarrollo)

Si tu aplicacion esta en modo de desarrollo:

1. En la seccion "Usuarios de prueba", haz clic en "Anadir usuarios"
2. Anade las direcciones de correo que usaras para probar
3. Haz clic en "Guardar y continuar"

**Nota**: Para produccion, necesitaras verificar tu aplicacion con Google.

### Paso 6: Crear Credenciales OAuth 2.0

1. Ve a "APIs y Servicios" → "Credenciales"
2. Haz clic en "Crear credenciales" → "ID de cliente de OAuth"
3. Tipo de aplicacion: **Aplicacion web**
4. Nombre: `FocusOnIt Web Client`

---

## Configuracion para Cloud (Supabase Cloud)

### URIs de redireccionamiento autorizados

Para Supabase Cloud:

```
Desarrollo:
  - http://localhost:3000/api/calendar/oauth/callback

Produccion:
  - https://tu-dominio.com/api/calendar/oauth/callback
```

### Variables de Entorno

```env
# Google Calendar OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
NEXTAUTH_SECRET=genera-un-secret-aleatorio-aqui
```

**Para generar NEXTAUTH_SECRET**, ejecuta en tu terminal:

```bash
openssl rand -base64 32
```

---

## Configuracion para Self-Hosted (Supabase Self-Hosted)

### Diferencias Clave

| Aspecto | Supabase Cloud | Supabase Self-Hosted |
|---------|----------------|----------------------|
| **UI de configuracion** | Dashboard con formulario | Configuracion manual en archivos |
| **Redirect automatico** | Supabase maneja todo | Debes configurar manualmente |
| **Providers** | Click para habilitar | Configurar en docker-compose.yml |

### Paso 1: Modificar docker-compose.yml

Edita `/opt/supabase/supabase/docker/docker-compose.yml` en tu servidor.

Busca la seccion `auth:` y **AGREGA** estas variables de entorno:

```yaml
  auth:
    container_name: supabase-auth
    image: supabase/gotrue:v2.177.0
    restart: unless-stopped
    environment:
      # ... configuracion existente ...

      # Google OAuth Configuration
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: "true"
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: "${GOOGLE_CLIENT_ID}"
      GOTRUE_EXTERNAL_GOOGLE_SECRET: "${GOOGLE_CLIENT_SECRET}"
      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: "https://api.ycm360.com/auth/v1/callback"
```

### Paso 2: Actualizar archivo .env

Edita el archivo `.env` en `/opt/supabase/supabase/docker/` y **AGREGA**:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

### Paso 3: URIs de Redireccion para Self-Hosted

En Google Cloud Console, configura:

```
JavaScript origins:
  - https://api.ycm360.com
  - https://focusonit.ycm360.com
  - http://localhost:3000

Authorized redirect URIs:
  - https://api.ycm360.com/auth/v1/callback
  - https://focusonit.ycm360.com/auth/callback
  - http://localhost:3000/auth/callback
```

### Paso 4: Reiniciar Supabase Auth

En tu servidor, ejecuta:

```bash
cd /opt/supabase/supabase/docker
docker compose restart auth

# Ver logs para verificar
docker compose logs -f auth
```

**Espera hasta ver**: `msg="GoTrue API started" port=9999`

### Paso 5: Verificar Configuracion Self-Hosted

```bash
# Health check
curl https://api.ycm360.com/auth/v1/health

# Verificar que Google esta habilitado
curl https://api.ycm360.com/auth/v1/settings | jq '.external.google'

# Verificar variables de entorno
docker compose exec auth env | grep GOTRUE_EXTERNAL_GOOGLE
```

---

## Configuracion de la Aplicacion

### Variables de Entorno (.env.local)

Abre el archivo `.env.local` en la raiz del proyecto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Google Calendar OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
NEXTAUTH_SECRET=genera-un-secret-aleatorio-aqui

# N8N (opcional)
N8N_VOICE_TASK_WEBHOOK_URL=https://n8n.tudominio.com/webhook/voice-task
```

### Variables de Entorno para Produccion

En produccion, actualiza `GOOGLE_REDIRECT_URI`:

```bash
GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/calendar/oauth/callback
```

---

## Configuracion de la Base de Datos

### Paso 1: Ejecutar la Migracion

El archivo de migracion `supabase/migrations/create_google_calendar_tokens.sql` creara:

- Tabla `google_calendar_tokens` para almacenar tokens OAuth
- Indices para busquedas rapidas
- Politicas de seguridad (Row Level Security)
- Trigger para actualizar automaticamente `updated_at`

Ejecuta el script en tu base de datos Supabase:

1. Ve a **SQL Editor** en Supabase Dashboard
2. Copia y pega el contenido de la migracion
3. Ejecuta el script

### Paso 2: Verificar la Tabla

En el Supabase Dashboard:

1. Ve a "Table Editor"
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

La tabla `tasks` debe tener los siguientes campos:

- `google_event_id` (text, nullable)
- `synced_with_calendar` (boolean, default: false)
- `google_calendar_sync` (boolean, default: false)
- `last_synced_at` (timestamptz, nullable)

---

## Uso de la Integracion

### Conectar Google Calendar

1. Inicia sesion en FocusOnIt
2. Ve a **Configuracion** (Settings)
3. Busca la seccion "Integracion con Google Calendar"
4. Haz clic en "Conectar con Google"
5. Autoriza el acceso a tu Google Calendar
6. Seras redirigido de vuelta a la aplicacion

### Sincronizacion Automatica

Una vez conectado:

- **Crear tarea**: Se crea automaticamente un evento en Google Calendar
- **Editar tarea**: El evento en Google Calendar se actualiza
- **Eliminar tarea**: El evento se elimina de Google Calendar
- **Completar tarea**: El evento se marca como cancelado

### Importar Eventos Existentes

1. En la seccion de integracion, haz clic en "Importar eventos"
2. Se importaran los eventos de los proximos 30 dias
3. Los eventos se convertiran en tareas en FocusOnIt

### Habilitar/Deshabilitar Sincronizacion por Tarea

En cada tarea, puedes controlar si se sincroniza con Google Calendar:

- El campo `google_calendar_sync` controla si la tarea se sincroniza
- Por defecto, todas las tareas nuevas se sincronizan si tienes Google Calendar conectado

### Desconectar Google Calendar

1. Ve a **Configuracion**
2. En la seccion de Google Calendar, haz clic en "Desconectar"
3. Confirma la accion
4. Las tareas existentes no se eliminaran, pero dejaran de sincronizarse

---

## Solucion de Problemas

### Error: "Unauthorized" al conectar

**Problema**: No se puede conectar a Google Calendar.

**Solucion**:

- Verifica que las credenciales en `.env.local` sean correctas
- Asegurate de que la URI de redireccion coincida exactamente con la configurada en Google Cloud Console
- Verifica que la Google Calendar API este habilitada

### Error: "Invalid state"

**Problema**: Error de seguridad en el flujo OAuth.

**Solucion**:

- Este error ocurre si el `state` parameter no coincide
- Asegurate de estar usando la misma sesion del navegador
- Intenta cerrar sesion y volver a conectar

### Eventos no se sincronizan

**Problema**: Las tareas no aparecen en Google Calendar.

**Solucion**:

- Verifica que `google_calendar_sync` este en `true` para la tarea
- Revisa los logs del servidor para errores de API
- Verifica que el token no haya expirado (se renueva automaticamente)
- Comprueba que la tarea tenga fecha asignada

### Error: "Token expired"

**Problema**: El token de acceso ha expirado.

**Solucion**:

- La aplicacion deberia renovar automaticamente el token usando el refresh token
- Si persiste, desconecta y vuelve a conectar Google Calendar
- Verifica que el `refresh_token` este guardado en la base de datos

### Error: "redirect_uri_mismatch" (Self-Hosted)

**Problema**: URI de redireccion no coincide.

**Solucion**:

1. En Google Cloud Console, verifica que tengas exactamente:
   ```
   https://api.ycm360.com/auth/v1/callback
   ```
2. En `docker-compose.yml`, verifica:
   ```yaml
   GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: "https://api.ycm360.com/auth/v1/callback"
   ```

### Error: "Provider not enabled" (Self-Hosted)

**Problema**: Google OAuth no esta habilitado en Supabase.

**Solucion**:

```bash
# Verificar configuracion
docker compose exec auth env | grep GOTRUE_EXTERNAL_GOOGLE

# Ver logs
docker compose logs auth | tail -50

# Reiniciar
docker compose restart auth
```

---

## Checklist de Configuracion

### En Google Cloud Console

- [ ] Proyecto creado
- [ ] Google Calendar API habilitada
- [ ] OAuth consent screen configurado
- [ ] Credenciales OAuth 2.0 creadas
- [ ] URIs de redireccion agregados correctamente

### En la Aplicacion

- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Migracion de base de datos ejecutada
- [ ] Tabla `google_calendar_tokens` creada
- [ ] Aplicacion reiniciada con nuevas variables

### Para Self-Hosted Adicional

- [ ] `.env` actualizado con credenciales de Google
- [ ] `docker-compose.yml` actualizado con variables `GOTRUE_EXTERNAL_GOOGLE_*`
- [ ] Servicio auth reiniciado
- [ ] Verificado que Google esta habilitado via API

### Pruebas

- [ ] Conexion probada desde Settings
- [ ] Importacion de eventos probada
- [ ] Creacion de tarea sincronizada probada
- [ ] Actualizacion de tarea sincronizada probada
- [ ] Eliminacion de tarea sincronizada probada

---

## Seguridad

- Los tokens OAuth se almacenan encriptados en Supabase
- Row Level Security (RLS) garantiza que cada usuario solo acceda a sus propios tokens
- Los tokens se renuevan automaticamente antes de expirar
- Los refresh tokens se usan para mantener acceso a largo plazo
- Nunca se exponen las credenciales al cliente

---

## Soporte

Si tienes problemas:

1. Revisa esta guia completamente
2. Verifica los logs del servidor
3. Verifica los logs de Supabase
4. Revisa la consola de Google Cloud para errores de API
5. Consulta [IMPLEMENTATION.md](IMPLEMENTATION.md) para detalles tecnicos
6. Abre un issue en el repositorio del proyecto

---

Para detalles tecnicos de implementacion, consulta [IMPLEMENTATION.md](IMPLEMENTATION.md).

Para configuracion especifica de produccion YCM360, consulta [YCM360.md](YCM360.md).

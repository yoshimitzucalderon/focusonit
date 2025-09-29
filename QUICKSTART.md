# 🚀 Inicio Rápido - FocusOnIt

Sigue estos pasos para tener tu app funcionando en **5 minutos**.

## 1️⃣ Configurar Supabase

### Crear proyecto
1. Ve a [supabase.com](https://supabase.com)
2. Click en **"New project"**
3. Elige nombre y contraseña
4. Espera 2-3 minutos a que esté listo

### Ejecutar SQL
1. En el dashboard, ve a **SQL Editor** (icono de código)
2. Click en **"New query"**
3. Copia y pega TODO el contenido del archivo `setup.sql`
4. Click en **"Run"** (o F5)
5. ✅ Deberías ver: "Success. No rows returned"

### Obtener credenciales
1. Ve a **Settings** → **API**
2. Copia estos 3 valores:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click en "Reveal" primero)

## 2️⃣ Configurar la App

### Crear archivo de entorno
```bash
cp .env.example .env.local
```

### Pegar tus credenciales
Abre `.env.local` y reemplaza:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

## 3️⃣ Ejecutar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 4️⃣ Crear tu cuenta

1. Ve a `/signup`
2. Ingresa tu email y contraseña
3. **IMPORTANTE:** Por defecto Supabase requiere confirmar email
   - Opción A: Revisa tu bandeja de entrada
   - Opción B: Desactiva confirmación (ver abajo)

### Desactivar confirmación de email (desarrollo)

En Supabase:
1. **Authentication** → **Settings**
2. Busca **"Enable email confirmations"**
3. Desactívalo (toggle OFF)
4. Ahora puedes hacer signup sin confirmar email

## ✅ ¡Listo!

Ahora puedes:
- Crear tareas rápidamente (Enter)
- Ver tus tareas del día
- Marcar como completadas
- Ver actualizaciones en tiempo real

## 🆘 Problemas Comunes

### "Failed to fetch"
❌ Las credenciales en `.env.local` están mal
✅ Cópialas nuevamente de Supabase → Settings → API

### "Not authorized"
❌ No ejecutaste `setup.sql`
✅ Ejecuta el script completo en SQL Editor

### "Email not confirmed"
❌ Confirmación está activada
✅ Desactívala en Authentication → Settings (solo desarrollo)

### Cambios no se reflejan
❌ Cache del navegador
✅ Abre en incógnito o presiona Ctrl+Shift+R

## 📝 Próximos Pasos

- Lee `README.md` para documentación completa
- Lee `INTEGRATION_GUIDE.md` para integraciones con Google Calendar y n8n
- Personaliza estilos en `app/globals.css`
- Agrega features del roadmap

## 🎯 Atajos de Teclado

- `Enter` → Crear tarea rápida
- `Shift + Enter` → Abrir modal con opciones
- `Click en título` → Editar inline
- `Esc` → Cancelar edición

---

**¿Todo funcionando?** 🎉 ¡Ahora a ser productivo!
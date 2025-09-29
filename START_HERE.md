# 👋 START HERE

## ¡Tu aplicación está lista! Sigue estos 3 pasos:

### ✅ Paso 1: Configurar Supabase (2 minutos)

1. Ve a https://supabase.com y crea una cuenta gratuita
2. Crea un nuevo proyecto (elige un nombre, contraseña y región)
3. Espera 2-3 minutos a que se cree
4. Ve a **SQL Editor** en el menú lateral
5. Copia y pega TODO el contenido del archivo `setup.sql`
6. Click en **"Run"** o presiona F5
7. Deberías ver: ✅ "Success. No rows returned"

### ✅ Paso 2: Configurar credenciales (1 minuto)

1. En Supabase, ve a **Settings** → **API**
2. Copia estos 3 valores:
   - **Project URL**
   - **anon public** key
   - **service_role** key
3. Abre el archivo `.env.local` en este proyecto
4. Reemplaza los valores de ejemplo con tus credenciales reales

**Antes:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-supabase-url.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

**Después:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ✅ Paso 3: Ejecutar (30 segundos)

```bash
# Verificar que todo está configurado correctamente
npm run verify

# Si todo está OK, iniciar el servidor
npm run dev
```

Abre http://localhost:3000 en tu navegador.

---

## 🎉 ¡Eso es todo!

Ahora puedes:
1. Ir a `/signup` para crear tu cuenta
2. Hacer login
3. Empezar a crear tareas

---

## 📚 Documentación Completa

| Archivo | Para qué sirve |
|---------|----------------|
| **WELCOME.md** | Bienvenida y overview general |
| **QUICKSTART.md** | Guía paso a paso detallada |
| **README.md** | Documentación técnica completa |
| **PROJECT_SUMMARY.md** | Resumen del proyecto y arquitectura |
| **INTEGRATION_GUIDE.md** | Integraciones futuras (Google Calendar, n8n) |

---

## ⚡ Comandos Rápidos

```bash
npm run verify    # Verificar configuración
npm run dev       # Desarrollo
npm run build     # Producción
npm start         # Ejecutar build de producción
```

---

## 🐛 ¿Problemas?

**Error: "Failed to fetch"**
- Revisa que las credenciales en `.env.local` estén correctas
- Verifica que ejecutaste `setup.sql` en Supabase

**Error: "Email not confirmed"**
- Ve a **Authentication** → **Settings** en Supabase
- Desactiva "Enable email confirmations" (solo para desarrollo)

**Otros problemas**
- Lee `QUICKSTART.md` → sección "Problemas Comunes"
- O lee `README.md` → sección "Troubleshooting"

---

## 🚀 Deploy a Producción

### Opción 1: Vercel (Recomendado, gratis)
1. Push tu código a GitHub
2. Ve a https://vercel.com
3. Import repository
4. Agrega las env vars
5. Deploy ✅

### Opción 2: Docker
```bash
docker build -t focusonit .
docker run -p 3000:3000 focusonit
```

---

**¿Listo para empezar?** 🎯
1. Configura Supabase (paso 1)
2. Copia credenciales (paso 2)
3. Ejecuta `npm run dev` (paso 3)
4. ¡Abre http://localhost:3000!

---

*Si tienes dudas, lee QUICKSTART.md para una guía más detallada*
# 🎉 ¡Bienvenido a FocusOnIt!

```
███████╗ ██████╗  ██████╗██╗   ██╗███████╗ ██████╗ ███╗   ██╗██╗████████╗
██╔════╝██╔═══██╗██╔════╝██║   ██║██╔════╝██╔═══██╗████╗  ██║██║╚══██╔══╝
█████╗  ██║   ██║██║     ██║   ██║███████╗██║   ██║██╔██╗ ██║██║   ██║
██╔══╝  ██║   ██║██║     ██║   ██║╚════██║██║   ██║██║╚██╗██║██║   ██║
██║     ╚██████╔╝╚██████╗╚██████╔╝███████║╚██████╔╝██║ ╚████║██║   ██║
╚═╝      ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝   ╚═╝

            Tu gestor de tareas simple y sin fricción
```

## 🚀 ¿Qué acabas de recibir?

Un **task manager completo y funcional** construido con las mejores tecnologías:

- ⚡ **Next.js 14** - Framework React de última generación
- 🎨 **Tailwind CSS** - Estilos modernos y responsive
- 🔥 **Supabase** - Backend completo con real-time
- 🔐 **Auth integrada** - Login/Signup listo para usar
- 📱 **Mobile-first** - Funciona en cualquier dispositivo
- 🌙 **Dark mode** - Automático según tu sistema

## 📋 Checklist de Setup (5 minutos)

```
[ ] 1. Leer este archivo (¡ya lo estás haciendo!)
[ ] 2. Crear proyecto en Supabase (supabase.com)
[ ] 3. Ejecutar setup.sql en SQL Editor
[ ] 4. Copiar credenciales a .env.local
[ ] 5. Ejecutar: npm run dev
[ ] 6. ¡Crear tu primera tarea!
```

## 📖 Archivos Importantes

| Archivo | Para qué sirve |
|---------|----------------|
| **QUICKSTART.md** | Guía rápida de inicio (lee esto primero) |
| **README.md** | Documentación completa |
| **INTEGRATION_GUIDE.md** | Cómo integrar con Google Calendar y n8n |
| **PROJECT_SUMMARY.md** | Resumen técnico del proyecto |
| **setup.sql** | Script para configurar la base de datos |

## 🎯 ¿Por dónde empiezo?

### Si eres nuevo:
1. Lee **QUICKSTART.md** (5 min)
2. Sigue los pasos
3. ¡Empieza a usar la app!

### Si tienes experiencia:
1. Configura Supabase
2. Copia credenciales a `.env.local`
3. `npm run verify` para verificar todo
4. `npm run dev` para iniciar
5. Ve a `http://localhost:3000`

## 🛠️ Comandos Útiles

```bash
# Verificar que todo está configurado
npm run verify

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start

# Linter
npm run lint
```

## 🎨 Features del MVP

✅ **Captura rápida**: Enter para crear tareas instantáneas
✅ **Vista HOY**: Enfócate en lo importante
✅ **Vista SEMANA**: Planifica los próximos 7 días
✅ **Real-time sync**: Actualización automática entre dispositivos
✅ **Edición inline**: Click para editar, sin modales molestos
✅ **Dark mode**: Automático según tu sistema operativo
✅ **Mobile friendly**: Barra de navegación inferior en móviles

## 🔮 ¿Qué puedes hacer después?

El proyecto está preparado para crecer:

### Fase 2: Automatizaciones con n8n
- Enviar emails cuando completes tareas
- Crear tareas desde Telegram/Slack
- Resumen semanal automático

### Fase 3: Google Calendar
- Sincronización bidireccional
- Eventos automáticos desde tareas
- Ver tareas en tu calendario

### Fase 4: Features avanzadas
- Lenguaje natural ("mañana 3pm")
- Etiquetas y categorías
- Subtareas
- Modo offline (PWA)

## 💡 Tips para Desarrollo

### Estructura de rutas
```
/                    → Redirect a /today
/login              → Autenticación
/signup             → Registro
/today              → Vista principal
/week               → Vista semanal
/all                → Todas las tareas
/completed          → Historial
```

### Componentes principales
```
TaskInput    → Captura rápida always visible
TaskItem     → Componente individual con todas las acciones
TaskList     → Lista con empty states
Navbar       → Header con logout
Sidebar      → Navegación desktop
```

### Hooks personalizados
```typescript
useAuth()    → { user, loading, supabase }
useTasks()   → { tasks, loading, setTasks } // Con real-time!
```

## 🐛 Troubleshooting Rápido

**Error: "Failed to fetch"**
- Revisa credenciales en `.env.local`
- Ejecutaste `setup.sql`?

**Error: "Not authorized"**
- RLS está activado?
- Políticas creadas correctamente?

**No veo cambios en tiempo real**
- Realtime activado en Supabase?
- Free tier tiene límites

**Email not confirmed**
- Desactiva confirmación en Auth Settings (solo desarrollo)

## 🎓 Aprende Más

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [React Hooks](https://react.dev/reference/react/hooks)

## 💬 Necesitas Ayuda?

1. Revisa **QUICKSTART.md**
2. Busca en **README.md**
3. Lee **PROJECT_SUMMARY.md** para detalles técnicos
4. Consulta los issues de las librerías usadas

## 🎉 ¡Comienza Ahora!

```bash
# Paso 1: Verificar configuración
npm run verify

# Paso 2: Si todo está OK, iniciar
npm run dev

# Paso 3: Abrir en el navegador
# http://localhost:3000
```

---

**¿Todo listo?**
👉 Abre **QUICKSTART.md** y sigue los pasos

**¿Ya configuraste Supabase?**
👉 Ejecuta `npm run dev` y visita `http://localhost:3000`

**¿Quieres entender el código?**
👉 Lee **PROJECT_SUMMARY.md**

---

Hecho con ❤️ para mejorar tu productividad

*Versión 1.0.0 - MVP*
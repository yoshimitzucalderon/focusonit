# 📤 Subir a GitHub - Instrucciones

## ✅ Git ya está configurado localmente

Tu código ya está listo para subir. Ahora necesitas crear el repositorio en GitHub.

---

## 🚀 Opción 1: Con GitHub CLI (Si lo tienes instalado)

```bash
# Autenticarse (solo primera vez)
gh auth login

# Crear repo y subir
gh repo create focusonit-task-manager --private --source=. --push
```

---

## 🌐 Opción 2: Manualmente (Método tradicional)

### Paso 1: Crear repositorio en GitHub

1. Ve a https://github.com/new
2. **Repository name:** `focusonit-task-manager` (o el nombre que prefieras)
3. **Description:** "Simple task manager with real-time sync - Next.js 14 + Supabase"
4. **Visibility:** Elige Private o Public
5. **NO marques** ninguna opción de inicialización (README, .gitignore, license)
6. Click en **"Create repository"**

### Paso 2: Conectar y subir

GitHub te mostrará una página con comandos. Copia la URL de tu repo y ejecuta:

```bash
cd C:/Users/yoshi/Downloads/FocusOnIt/task-manager

# Conectar con GitHub (reemplaza USERNAME y REPO)
git remote add origin https://github.com/USERNAME/focusonit-task-manager.git

# Renombrar rama a main (opcional, si prefieres main en lugar de master)
git branch -M main

# Subir código
git push -u origin main
```

**Ejemplo real:**
```bash
# Si tu usuario es "johndoe" y el repo es "focusonit-task-manager"
git remote add origin https://github.com/johndoe/focusonit-task-manager.git
git branch -M main
git push -u origin main
```

---

## 🔐 Autenticación

GitHub puede pedirte credenciales:

### Opción A: Con Personal Access Token (Recomendado)
1. Ve a https://github.com/settings/tokens
2. Click en **"Generate new token (classic)"**
3. Selecciona: `repo` (full control)
4. Genera el token y cópialo
5. Cuando Git pida contraseña, usa el **token** (no tu contraseña)

### Opción B: Con SSH (Avanzado)
```bash
# Generar clave SSH
ssh-keygen -t ed25519 -C "tu-email@example.com"

# Copiar clave pública
cat ~/.ssh/id_ed25519.pub

# Agregar en GitHub: Settings → SSH and GPG keys → New SSH key

# Usar URL SSH en lugar de HTTPS
git remote set-url origin git@github.com:USERNAME/focusonit-task-manager.git
```

---

## ✅ Verificar que funcionó

Después de hacer push, verifica:

```bash
# Ver remotes configurados
git remote -v

# Debería mostrar:
# origin  https://github.com/USERNAME/focusonit-task-manager.git (fetch)
# origin  https://github.com/USERNAME/focusonit-task-manager.git (push)
```

Ve a tu repositorio en GitHub y deberías ver todos los archivos.

---

## 📝 Agregar un README bonito en GitHub

GitHub usa el `README.md` del proyecto como página principal. Ya lo tienes, pero puedes mejorar la visualización:

### Opcional: Agregar badges

Edita `README.md` y agrega al inicio:

```markdown
# FocusOnIt - Task Manager

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

> Gestión de tareas simple y práctica con real-time sync

[Demo Live](https://tu-deploy.vercel.app) · [Report Bug](https://github.com/USERNAME/REPO/issues)
```

---

## 🎯 Próximo Paso: Deploy a Vercel

Una vez en GitHub:

1. Ve a https://vercel.com
2. Click en **"Import Project"**
3. Selecciona tu repo de GitHub
4. Agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click en **"Deploy"**
6. ¡Listo! Tu app está en producción

---

## 🔄 Workflow de desarrollo

Después del setup inicial:

```bash
# Hacer cambios en el código

# Ver cambios
git status

# Agregar cambios
git add .

# Commit
git commit -m "Add new feature"

# Subir a GitHub
git push

# Si tienes Vercel conectado, se desplegará automáticamente
```

---

## 🆘 Problemas Comunes

**Error: "remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/REPO.git
```

**Error: "Permission denied"**
- Verifica tus credenciales de GitHub
- Usa Personal Access Token en lugar de contraseña

**Error: "Updates were rejected"**
```bash
git pull origin main --rebase
git push
```

---

## 📚 Recursos

- [GitHub Docs](https://docs.github.com)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [Vercel Deploy](https://vercel.com/docs)

---

**¿Todo listo?** 🎉
Ahora puedes compartir tu repo con otros o desplegarlo en Vercel!
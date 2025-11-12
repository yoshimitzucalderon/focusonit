# Telegram Notifications Setup Guide

Esta guia te ayudara a configurar notificaciones de deployment via Telegram.

## Por Que Telegram

**Ventajas:**
- ✅ Notificaciones instantaneas en tu telefono
- ✅ Gratis (no requiere plan pago)
- ✅ Facil de configurar (5 minutos)
- ✅ Persistente (historial de deployments)

**Vs otras opciones:**
- Email: Lento, puede ir a spam
- Slack: Requiere workspace, mas complejo
- Discord: Similar a Telegram pero menos mobile-friendly

---

## Paso 1: Crear Bot de Telegram

### 1.1 Abre Telegram

- Desktop: https://web.telegram.org/
- Mobile: App de Telegram

### 1.2 Busca BotFather

1. En la barra de busqueda, escribe: `@BotFather`
2. Abre el chat con **BotFather** (verificado, foto de robot)

### 1.3 Crea Nuevo Bot

1. Envia mensaje: `/newbot`

2. BotFather responde:
   ```
   Alright, a new bot. How are we going to call it?
   Please choose a name for your bot.
   ```

3. Envia el nombre de tu bot (puede contener espacios):
   ```
   FocusOnIt Deployment Bot
   ```

4. BotFather pregunta por username (sin espacios, debe terminar en "bot"):
   ```
   Good. Now let's choose a username for your bot.
   It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.
   ```

5. Envia username:
   ```
   focusonit_deploy_bot
   ```

6. BotFather responde con tu token:
   ```
   Done! Congratulations on your new bot.

   Use this token to access the HTTP API:
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz

   Keep your token secure and store it safely,
   it can be used by anyone to control your bot.
   ```

### 1.4 Guarda el Token

**IMPORTANTE:** Copia el token y guardalo en lugar seguro.

**Formato del token:**
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Este es tu `TELEGRAM_BOT_TOKEN`**

---

## Paso 2: Obtener Tu Chat ID

### 2.1 Busca userinfobot

1. En Telegram, busca: `@userinfobot`
2. Abre el chat con **userinfobot**

### 2.2 Inicia Conversacion

1. Envia mensaje: `/start`

2. Bot responde con tu informacion:
   ```
   Your user ID: 123456789
   First name: Tu Nombre
   Username: @tu_username
   ```

### 2.3 Guarda tu Chat ID

**Copia el numero despues de "Your user ID:"**

Ejemplo: `123456789`

**Este es tu `TELEGRAM_CHAT_ID`**

---

## Paso 3: Agregar Secrets a GitHub

### 3.1 Navega a Secrets

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Click **New repository secret**

### 3.2 Agrega TELEGRAM_BOT_TOKEN

1. Name: `TELEGRAM_BOT_TOKEN`
2. Value: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` (tu token)
3. Click **Add secret**

### 3.3 Agrega TELEGRAM_CHAT_ID

1. Click **New repository secret**
2. Name: `TELEGRAM_CHAT_ID`
3. Value: `123456789` (tu chat ID)
4. Click **Add secret**

---

## Paso 4: Test de Notificaciones

### 4.1 Test Manual con cURL

Antes de activar el workflow, prueba manualmente:

```bash
# Reemplaza <TOKEN> y <CHAT_ID> con tus valores
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d chat_id="<CHAT_ID>" \
  -d text="🧪 Test notification from FocusOnIt CI/CD"
```

**Ejemplo:**
```bash
curl -X POST "https://api.telegram.org/bot123456789:ABCdefGHI/sendMessage" \
  -d chat_id="123456789" \
  -d text="🧪 Test notification from FocusOnIt CI/CD"
```

**Resultado esperado:**
- ✅ Recibes mensaje en Telegram
- ✅ Respuesta JSON: `{"ok":true,...}`

**Si falla:**
- ❌ Verifica que el token sea correcto
- ❌ Verifica que el chat ID sea correcto
- ❌ Verifica que no haya espacios extra

---

### 4.2 Test desde PowerShell (Windows)

Si estas en Windows, usa PowerShell:

```powershell
$TOKEN = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
$CHAT_ID = "123456789"
$TEXT = "🧪 Test notification from FocusOnIt CI/CD"

Invoke-WebRequest -Uri "https://api.telegram.org/bot$TOKEN/sendMessage" -Method Post -Body @{
    chat_id = $CHAT_ID
    text = $TEXT
}
```

---

## Paso 5: Activar Workflow

El workflow `deployment-notification.yml` ya esta creado.

**Verifica que exista:**
```
.github/workflows/deployment-notification.yml
```

**Como funciona:**

1. Vercel deploys tu app
2. GitHub recibe webhook de Vercel
3. Workflow `deployment-notification.yml` se ejecuta
4. Envia notificacion a Telegram

**Eventos que activan notificacion:**

- ✅ Deployment exitoso → "✅ Deployment successful"
- ❌ Deployment fallido → "❌ Deployment failed"

---

## Paso 6: Test End-to-End

### 6.1 Trigger un Deployment

```bash
# 1. Hacer cambio trivial
echo "# Test notification" >> README.md

# 2. Commit y push a main
git add README.md
git commit -m "test: trigger telegram notification"
git push origin main

# 3. Espera deployment en Vercel (2-3 minutos)

# 4. Verifica Telegram
# Deberias recibir:
# ✅ Deployment successful
# Environment: Production
# URL: https://focusonit.ycm360.com
# Commit: test: trigger telegram notification
# Author: tu_username
```

---

## Formato de Notificaciones

### Deployment Exitoso

```
✅ Deployment successful

Environment: Production
URL: https://focusonit.ycm360.com
Commit: feat: add new feature
Author: yoshi
```

### Deployment Fallido

```
❌ Deployment failed

Environment: Production
Check logs: https://vercel.com/.../logs
Author: yoshi
```

---

## Personalizacion Avanzada

### Cambiar Mensaje de Notificacion

Edita `.github/workflows/deployment-notification.yml`:

```yaml
- name: Send success notification
  if: github.event.deployment_status.state == 'success' && secrets.TELEGRAM_BOT_TOKEN != ''
  run: |
    # Personaliza este mensaje
    MESSAGE="🎉 Deploy exitoso!

    🌍 Entorno: ${{ github.event.deployment.environment }}
    🔗 URL: ${{ github.event.deployment_status.target_url }}
    📝 Commit: ${COMMIT_MSG}
    👤 Autor: ${{ github.actor }}
    ⏰ Hora: $(date +'%Y-%m-%d %H:%M:%S')"

    curl -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
      -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
      -d text="${MESSAGE}"
```

### Agregar Emojis Personalizados

```yaml
# Deployment exitoso
MESSAGE="🚀✅ Nueva version en produccion!"

# Deployment fallido
MESSAGE="🔥❌ Algo salio mal - URGENTE"
```

### Notificar Solo Produccion (No Preview)

```yaml
jobs:
  notify:
    name: Send Deployment Notification
    runs-on: ubuntu-latest
    # Solo notificar deployments de produccion
    if: |
      (github.event.deployment_status.state == 'success' ||
       github.event.deployment_status.state == 'failure') &&
      github.event.deployment.environment == 'Production'
```

---

## Notificaciones a Grupo de Telegram

### Paso 1: Crear Grupo

1. Telegram → New Group
2. Nombre: "FocusOnIt Deployments"
3. Agrega miembros del equipo

### Paso 2: Agregar Bot al Grupo

1. En el grupo, click en nombre del grupo → Add members
2. Busca tu bot: `@focusonit_deploy_bot`
3. Agrega el bot al grupo

### Paso 3: Obtener Chat ID del Grupo

**Metodo 1: Via Bot API**

1. Envia un mensaje en el grupo: `/start`

2. Abre en navegador:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```

3. Busca en el JSON:
   ```json
   "chat": {
     "id": -123456789,  // ← Este es el chat ID del grupo
     "title": "FocusOnIt Deployments",
     "type": "group"
   }
   ```

4. Copia el `id` (numero negativo)

**Metodo 2: Via userinfobot**

1. Agrega `@userinfobot` al grupo
2. Bot responde con Chat ID del grupo

### Paso 4: Actualizar Secret

1. GitHub → Settings → Secrets → Actions
2. Edita `TELEGRAM_CHAT_ID`
3. Cambia a: `-123456789` (chat ID del grupo)
4. Save

**Ahora todo el equipo recibe notificaciones!**

---

## Troubleshooting

### No Recibo Notificaciones

**Verifica:**

1. **Secrets configurados:**
   - GitHub → Settings → Secrets → Actions
   - `TELEGRAM_BOT_TOKEN` existe
   - `TELEGRAM_CHAT_ID` existe

2. **Workflow corre:**
   - GitHub → Actions → Busca workflow "Deployment Notification"
   - Verifica que corra despues de deployment

3. **Test manual:**
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
     -d chat_id="<CHAT_ID>" \
     -d text="Test"
   ```

4. **Bot bloqueado:**
   - Abre chat con tu bot en Telegram
   - Click "Start" (si aparece)

---

### Notificacion dice "failed" pero deployment fue exitoso

**Causa:** Timing del webhook de Vercel.

**Solucion:**

1. Verifica logs en Vercel (debe mostrar success)
2. Webhook puede reportar status incorrecto temporalmente
3. Espera 1-2 minutos y verifica deployment en browser

---

### Recibo notificacion duplicada

**Causa:** Multiples webhooks de Vercel.

**Solucion:**

Agrega dedupe en workflow:

```yaml
jobs:
  notify:
    name: Send Deployment Notification
    runs-on: ubuntu-latest
    # Solo correr una vez por deployment
    if: |
      github.event.deployment_status.state == 'success' &&
      github.event.action == 'created'
```

---

## Alternativas a Telegram

Si prefieres otro servicio:

### Slack

```yaml
- name: Send Slack notification
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{
        "text": "✅ Deployment successful: ${{ github.event.deployment_status.target_url }}"
      }'
```

**Setup:** https://api.slack.com/messaging/webhooks

---

### Discord

```yaml
- name: Send Discord notification
  run: |
    curl -X POST ${{ secrets.DISCORD_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{
        "content": "✅ Deployment successful: ${{ github.event.deployment_status.target_url }}"
      }'
```

**Setup:** Server Settings → Integrations → Webhooks → New Webhook

---

### Email (GitHub nativo)

1. GitHub → Settings (personal) → Notifications
2. ✅ "Email notification preferences"
3. ✅ "Actions" → "Send notifications for failed workflows"

**Limitacion:** Solo fallas, no success.

---

## Checklist Final

Marca cuando completes:

- [ ] Bot de Telegram creado
- [ ] Bot token obtenido
- [ ] Chat ID obtenido
- [ ] Secrets agregados a GitHub
- [ ] Test manual con cURL exitoso
- [ ] Workflow activado
- [ ] Test end-to-end exitoso (deployment real)
- [ ] Notificaciones recibidas correctamente

---

**Fecha de creacion:** 2025-11-11
**Mantenido por:** DevOps Team

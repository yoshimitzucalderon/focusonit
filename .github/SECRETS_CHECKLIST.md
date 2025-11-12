# GitHub Secrets Checklist

Esta lista contiene todos los secrets necesarios para el pipeline CI/CD.

## Como Agregar Secrets

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (arriba derecha)
3. En el menu izquierdo: **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Ingresa el nombre y valor del secret
6. Click **Add secret**

---

## Secrets Requeridos (Minimos para PR Validation)

### Staging/Build Secrets

- [ ] **STAGING_SUPABASE_URL**
  - Descripcion: URL de Supabase para builds de CI
  - Donde obtenerlo: Supabase Dashboard → Settings → API
  - Ejemplo: `https://xxxxxxxxxxxxx.supabase.co`

- [ ] **STAGING_SUPABASE_ANON_KEY**
  - Descripcion: Anon key de Supabase para builds de CI
  - Donde obtenerlo: Supabase Dashboard → Settings → API
  - Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

- [ ] **STAGING_GOOGLE_CLIENT_ID**
  - Descripcion: Google OAuth Client ID para staging
  - Donde obtenerlo: Google Cloud Console → APIs & Services → Credentials
  - Ejemplo: `123456789-abc123.apps.googleusercontent.com`

- [ ] **STAGING_GOOGLE_CLIENT_SECRET**
  - Descripcion: Google OAuth Client Secret para staging
  - Donde obtenerlo: Google Cloud Console → APIs & Services → Credentials
  - Ejemplo: `GOCSPX-xxxxxxxxxxxxx`

**Nota:** Puedes usar los mismos valores de produccion para staging si no tienes un ambiente separado.

---

## Secrets Opcionales (Recomendados)

### Production Database Migrations

- [ ] **PRODUCTION_DB_URL**
  - Descripcion: PostgreSQL connection string completo
  - Donde obtenerlo: Supabase Dashboard → Settings → Database → Connection String (URI)
  - Ejemplo: `postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres`
  - **Cuando agregarlo:** Solo si planeas usar migraciones automaticas

- [ ] **PRODUCTION_DB_PASSWORD**
  - Descripcion: Password de la base de datos de produccion
  - Donde obtenerlo: Supabase Dashboard → Settings → Database
  - Ejemplo: `tu_password_seguro_aqui`
  - **Cuando agregarlo:** Solo si planeas usar migraciones automaticas

### Notificaciones (Telegram)

- [ ] **TELEGRAM_BOT_TOKEN**
  - Descripcion: Token del bot de Telegram para notificaciones
  - Como obtenerlo:
    1. Abre Telegram
    2. Busca @BotFather
    3. Envia `/newbot`
    4. Sigue instrucciones
    5. Copia el token que te da
  - Ejemplo: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
  - **Cuando agregarlo:** Solo si quieres notificaciones de deployment

- [ ] **TELEGRAM_CHAT_ID**
  - Descripcion: ID de tu chat de Telegram
  - Como obtenerlo:
    1. Busca @userinfobot en Telegram
    2. Envia `/start`
    3. Copia tu ID
  - Ejemplo: `123456789`
  - **Cuando agregarlo:** Solo si quieres notificaciones de deployment

---

## Secrets para Tests Automatizados (Futuro)

**No agregues estos aun - solo cuando implementes tests**

### Test Environment

- [ ] **TEST_SUPABASE_URL**
  - Descripcion: URL de Supabase para tests automatizados
  - Recomendacion: Usar proyecto separado de Supabase para tests

- [ ] **TEST_SUPABASE_ANON_KEY**
  - Descripcion: Anon key para tests

- [ ] **TEST_SERVICE_ROLE_KEY**
  - Descripcion: Service role key para tests (bypass RLS)
  - **IMPORTANTE:** Solo para tests, nunca en cliente

- [ ] **TEST_USER_EMAIL**
  - Descripcion: Email de usuario de prueba
  - Ejemplo: `test@example.com`

- [ ] **TEST_USER_PASSWORD**
  - Descripcion: Password de usuario de prueba
  - Ejemplo: `test_password_123`

- [ ] **STAGING_URL**
  - Descripcion: URL del ambiente de staging
  - Ejemplo: `https://staging.focusonit.ycm360.com`

### Code Coverage (Opcional)

- [ ] **CODECOV_TOKEN**
  - Descripcion: Token para subir reportes de coverage
  - Donde obtenerlo: https://codecov.io/
  - **Cuando agregarlo:** Solo si quieres tracking de code coverage

---

## Testing de Secrets

Despues de agregar secrets, verifica que esten disponibles:

```bash
# 1. Crea un PR de prueba
git checkout -b test/verify-secrets
git commit --allow-empty -m "test: verify CI secrets"
git push -u origin test/verify-secrets

# 2. Abre PR en GitHub

# 3. Verifica que el workflow corra sin errores de "secret not found"

# 4. Si falla por secrets faltantes, revisa esta checklist
```

---

## Seguridad de Secrets

**IMPORTANTE:**

- ✅ Secrets estan encriptados en GitHub
- ✅ No aparecen en logs (GitHub los oculta automaticamente)
- ✅ Solo disponibles en workflows aprobados
- ❌ NUNCA hagas echo de secrets en logs
- ❌ NUNCA commitas secrets en codigo
- ❌ NUNCA uses production service role key en CI (solo staging/test)

---

## Orden Recomendado de Configuracion

### Fase 1: Minimo para PR Validation
1. STAGING_SUPABASE_URL
2. STAGING_SUPABASE_ANON_KEY
3. STAGING_GOOGLE_CLIENT_ID
4. STAGING_GOOGLE_CLIENT_SECRET

**Resultado:** PR validation funcionando

### Fase 2: Notificaciones (Opcional)
5. TELEGRAM_BOT_TOKEN
6. TELEGRAM_CHAT_ID

**Resultado:** Notificaciones de deployment

### Fase 3: Migraciones Automaticas (Opcional)
7. PRODUCTION_DB_URL
8. PRODUCTION_DB_PASSWORD

**Resultado:** Migraciones con 1 click

### Fase 4: Tests Automatizados (Futuro)
9. TEST_SUPABASE_URL
10. TEST_SUPABASE_ANON_KEY
11. TEST_SERVICE_ROLE_KEY
12. TEST_USER_EMAIL
13. TEST_USER_PASSWORD
14. STAGING_URL

**Resultado:** CI completo con tests

---

## Verificacion Final

Marca cuando hayas completado cada fase:

- [ ] Fase 1 completada (PR validation funciona)
- [ ] Fase 2 completada (notificaciones funcionan)
- [ ] Fase 3 completada (migraciones funcionan)
- [ ] Fase 4 completada (tests funcionan)

**Fecha de ultima actualizacion:** 2025-11-11

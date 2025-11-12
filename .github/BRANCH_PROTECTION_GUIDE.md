# Branch Protection Configuration Guide

Esta guia te ayudara a configurar las reglas de proteccion para la rama `main`.

## Por Que Branch Protection

Branch protection previene:
- ❌ Commits directos a `main` (sin review)
- ❌ Merge de codigo que falla tests
- ❌ Deploy de codigo con errores de compilacion
- ❌ Force push que borra historial

## Paso a Paso: Configuracion

### 1. Navega a Branch Settings

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (tab arriba)
3. En el menu izquierdo, click en **Branches**
4. En "Branch protection rules", click **Add branch protection rule**

**URL directa:** `https://github.com/<tu-username>/task-manager/settings/branches`

---

### 2. Configurar Branch Name Pattern

En "Branch name pattern", ingresa:
```
main
```

Esta regla aplicara solo a la rama `main`.

---

### 3. Require a Pull Request Before Merging

**Marca esta checkbox:** ✅

Luego configura sub-opciones:

- ✅ **Require approvals**
  - Number of required approvals: `1`
  - Significado: Al menos 1 persona debe aprobar el PR antes de merge

- ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - Significado: Si el autor pushea nuevos commits, se invalidan aprobaciones anteriores
  - Esto previene que se apruebe version A y se mergee version B

- ❌ **Require review from Code Owners**
  - Dejar sin marcar (a menos que tengas archivo CODEOWNERS)

- ✅ **Require approval of the most recent reviewable push**
  - Significado: Solo se puede mergear la ultima version revisada

---

### 4. Require Status Checks to Pass Before Merging

**Marca esta checkbox:** ✅

Luego configura:

- ✅ **Require branches to be up to date before merging**
  - Significado: La rama debe estar actualizada con `main` antes de merge
  - Previene problemas de integracion

**En "Status checks that are required":**

Busca y selecciona los siguientes checks (apareceran despues del primer PR):

1. `Validate PR` (workflow: pr-validation.yml)
2. `Check Code Formatting` (workflow: code-quality.yml)

**Nota:** Estos checks apareceran en la lista DESPUES de que corran por primera vez. Si no los ves aun:
1. Crea un PR de prueba
2. Los workflows correran
3. Luego podras seleccionarlos aqui

---

### 5. Require Conversation Resolution Before Merging

**Marca esta checkbox:** ✅

Significado: Todos los comentarios en el PR deben marcarse como "Resolved" antes de merge.

---

### 6. Require Signed Commits

**Marca esta checkbox:** ❌ (Opcional)

Solo si tu equipo usa GPG signing. Para MVP, no es necesario.

---

### 7. Require Linear History

**Marca esta checkbox:** ❌ (Opcional)

Esto fuerza squash merges o rebase. Para MVP, dejalo sin marcar (permite merge commits normales).

---

### 8. Include Administrators

**Marca esta checkbox:** ✅ **Do not allow bypassing the above settings**

Significado: Ni siquiera administradores pueden saltarse estas reglas.

**Recomendacion:** Marcalo. Fuerza buenas practicas para todos.

**Alternativa:** Si eres el unico desarrollador y quieres flexibilidad para hotfixes urgentes, dejalo sin marcar.

---

### 9. Allow Force Pushes

**Marca esta checkbox:** ❌ **DESHABILITADO**

Significado: Nadie puede hacer `git push --force` a `main`.

**Importante:** Dejalo SIEMPRE deshabilitado. Force push borra historial.

---

### 10. Allow Deletions

**Marca esta checkbox:** ❌ **DESHABILITADO**

Significado: Nadie puede borrar la rama `main`.

**Importante:** Dejalo SIEMPRE deshabilitado.

---

### 11. Save Configuration

Scroll hasta abajo y click en **Create** (o **Save changes** si estas editando).

---

## Screenshot de Configuracion Final

Tu configuracion deberia verse asi:

```
Branch name pattern: main

☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed
  ☐ Require review from Code Owners
  ☑ Require approval of the most recent reviewable push

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Status checks:
    ☑ Validate PR
    ☑ Check Code Formatting

☑ Require conversation resolution before merging

☐ Require signed commits (opcional)

☐ Require linear history (opcional)

☑ Do not allow bypassing the above settings

☐ Allow force pushes: DISABLED

☐ Allow deletions: DISABLED
```

---

## Verificacion Post-Configuracion

Despues de guardar, verifica:

### Test 1: No Puedes Pushear Directamente a Main

```bash
# Intenta pushear directamente (deberia fallar)
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "test: direct push"
git push

# Resultado esperado:
# ❌ Error: Cannot push to protected branch 'main'
```

### Test 2: PR Requiere Checks Pasando

1. Crea branch: `git checkout -b test/branch-protection`
2. Haz un cambio que falle ESLint:
   ```typescript
   // Agrega esto a algun archivo .ts
   const unused_variable = "test"  // ESLint error
   ```
3. Commit y push
4. Abre PR
5. Verifica que:
   - ❌ Check "Check Code Formatting" falla
   - ❌ Boton "Merge" esta deshabilitado
   - ✅ Mensaje: "Required status checks must pass"

### Test 3: PR Requiere Approval

1. Crea PR valido (codigo correcto)
2. Verifica que checks pasen: ✅
3. Verifica que boton "Merge" diga: "1 approval required"
4. Si tienes segundo usuario, aprueba el PR
5. Ahora boton "Merge" deberia estar habilitado

---

## Troubleshooting

### Problema: "Status checks not found"

**Causa:** Los workflows no han corrido aun.

**Solucion:**
1. Crea un PR de prueba
2. Espera que workflows corran
3. Vuelve a Branch Protection settings
4. Ahora los checks apareceran en la lista

---

### Problema: "I'm the only developer, do I need approvals?"

**Respuesta:** Tecnicamente no, pero es buena practica.

**Opcion 1 (Recomendada):** Mantener approval required
- Self-review tus PRs
- Ventaja: Te fuerza a revisar codigo antes de merge

**Opcion 2:** Deshabilitar approval requirement
- Solo para proyectos personales
- Riesgo: Merges impulsivos sin review

---

### Problema: "I need to do an emergency hotfix"

**Con branch protection:**
1. Crea branch: `hotfix/critical-bug`
2. Fix el bug (minimal changes)
3. Push y abre PR
4. CI corre (2-3 minutos)
5. Self-approve
6. Merge

**Total time:** ~5 minutos (aceptable para emergencias)

**Alternativa:** Temporalmente deshabilitar branch protection
1. Settings → Branches → Edit rule
2. Desmarca "Do not allow bypassing"
3. Haz hotfix
4. Re-habilita proteccion

---

## Next Steps

Despues de configurar branch protection:

1. ✅ Verifica que no puedes pushear directo a `main`
2. ✅ Crea PR de prueba y verifica que CI corre
3. ✅ Verifica que no puedes mergear sin approval
4. ✅ Documenta en `docs/CI_CD.md` (proxima seccion)

---

## Configuracion Avanzada (Opcional)

### Code Owners

Si quieres que ciertas personas deban aprobar cambios en archivos especificos:

1. Crea archivo `.github/CODEOWNERS`:
   ```
   # Database migrations require backend lead approval
   /supabase/migrations/ @backend-lead-username

   # CI/CD changes require devops approval
   /.github/workflows/ @devops-username

   # Everything else requires any team member
   * @team-member-1 @team-member-2
   ```

2. En Branch Protection, marca:
   - ✅ Require review from Code Owners

### Status Checks Adicionales

Cuando implementes tests, agrega estos checks:

- `Unit & Integration Tests`
- `E2E Tests (Playwright)`

Cuando implementes Lighthouse CI:

- `Lighthouse CI`

---

**Fecha de creacion:** 2025-11-11
**Mantenido por:** DevOps Team

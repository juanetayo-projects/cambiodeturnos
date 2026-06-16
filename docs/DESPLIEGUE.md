# Guía de Despliegue

## 1. Frontend — GitHub Pages (automático)
El flujo `.github/workflows/deploy.yml` construye y publica en cada `push` a `main`.

**Activar GitHub Pages (una sola vez):**
1. Repo → **Settings → Pages**.
2. En **Build and deployment → Source**, elige **GitHub Actions**.
3. El primer push dispara el workflow; la app queda en:
   `https://juanetayo-projects.github.io/cambiodeturnos/`

> Si cambias de cuenta/organización, ajusta `base` en `vite.config.ts` y las URLs en `src/lib/config.ts`.

## 2. Base de datos — Supabase
- Proyecto: **cambiodeturnos** (`ref rykondrasrvnuurolqqk`, región us-east-1).
- Migraciones en `supabase/migrations/` (ya aplicadas). Para reaplicar en otro proyecto:
  ```bash
  supabase link --project-ref <REF>
  supabase db push
  ```
- Importar histórico: `node scripts/importar_historico.mjs` (usa el CSV en `docs/data/`).

## 3. Correo — Resend (Edge Function `notificar`)
La función ya está desplegada. Falta configurar los **secretos**:

| Secreto | Valor |
|---|---|
| `RESEND_API_KEY` | La API key creada en Resend (**`notificacionturnos`**). |
| `RESEND_FROM` | Remitente verificado, p.ej. `Cambios de Turnos <notificaciones@cacsantabarbara.co>`. |
| `APP_URL` | `https://juanetayo-projects.github.io/cambiodeturnos/` |

**Cómo configurarlos:**
- **Dashboard:** Supabase → Project → Edge Functions → `notificar` → *Secrets* → añade las variables.
- **CLI:**
  ```bash
  supabase secrets set RESEND_API_KEY=re_xxx RESEND_FROM="Cambios de Turnos <notificaciones@tudominio.co>" APP_URL="https://juanetayo-projects.github.io/cambiodeturnos/" --project-ref rykondrasrvnuurolqqk
  ```

> **Dominio del remitente:** Resend exige verificar el dominio para enviar a cualquier destinatario.
> Mientras no se verifique, usa `onboarding@resend.dev` (solo envía al correo dueño de la cuenta) para pruebas.

## 4. Verificación post-despliegue
1. Ingresar con el usuario administrador.
2. Crear una solicitud de prueba → revisar correos de confirmación y aviso al coordinador.
3. Aprobar/negar → revisar correo de resultado.
4. Probar exportación Excel/PDF (deben incluir logo y encabezado).

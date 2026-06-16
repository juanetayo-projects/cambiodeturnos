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

## 3. Correo — Resend (Edge Function `notificar`)  ✅ CONFIGURADO
La función está desplegada y **funcionando**. Las credenciales se guardan **cifradas en Supabase Vault**
(no en el repo) y la función las lee mediante `public.get_secret()`:

| Secreto (Vault) | Valor actual |
|---|---|
| `RESEND_API_KEY` | API key de Resend `notificacionturnos`. |
| `RESEND_FROM` | `Cambios de Turnos <notificaciones@cacsantabarbara.co>` |

- **Dominio:** `cacsantabarbara.co` está **verificado** en Resend → se puede enviar a cualquier destinatario.
- `APP_URL` se toma del valor por defecto en el código (URL de GitHub Pages).

**Rotar la API key** (si la regeneras en Resend):
```sql
select vault.update_secret(
  (select id from vault.secrets where name='RESEND_API_KEY'),
  're_NUEVA_KEY'
);
```
Cambiar el remitente: igual, sobre `RESEND_FROM`. No requiere redesplegar la función.

## 4. Verificación post-despliegue
1. Ingresar con el usuario administrador.
2. Crear una solicitud de prueba → revisar correos de confirmación y aviso al coordinador.
3. Aprobar/negar → revisar correo de resultado.
4. Probar exportación Excel/PDF (deben incluir logo y encabezado).

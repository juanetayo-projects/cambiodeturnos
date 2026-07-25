<div align="center">
  <img src="public/logo.png" alt="Clínica Santa Bárbara" height="70"/>

  # Cambios de Turnos
  ### Clínica de Alta Complejidad Santa Bárbara

  Aplicación web para la gestión de solicitudes de cambio de turno del personal asistencial,
  con flujo de aprobación por coordinadores, panel de métricas, reportes y notificaciones por correo.
</div>

---

## 🌐 Enlaces

| Recurso | URL |
|---|---|
| **App (producción)** | https://juanetayo-projects.github.io/cambiodeturnos/ |
| **Repositorio** | https://github.com/juanetayo-projects/cambiodeturnos |
| **Supabase (proyecto)** | `cambiodeturnos` · ref `rykondrasrvnuurolqqk` |

## 🎨 Identidad
- Azul principal `#0D2D6B` · Azul contraste `#16468E`
- Logos en `public/logo.png` y `public/logo-blanco.png`

## 🔄 Flujo de aprobación

```
1. El colaborador crea la solicitud        →  estado ESPERA COMPAÑERO
2. El compañero responde desde el correo   →  ACEPTO  → estado ESPERA VoBo.
   (botones ACEPTO / NO ACEPTO)               NO ACEPTO → estado NO ACEPTADA (cierra)
3. El coordinador da el visto bueno        →  APROBADA / NEGADA
```

La respuesta del compañero se registra en la solicitud (`respuesta_acepta`,
`fecha_respuesta_acepta`, `obser_acepta`) desde la página pública `#/responder?token=…`,
sin necesidad de iniciar sesión. El coordinador solo es notificado cuando el compañero acepta.

## ✅ Reglas de negocio
| Regla | Detalle | Dónde se aplica |
|---|---|---|
| **Misma semana** | Los dos turnos deben estar dentro de la misma semana, de **lunes a domingo**. | Modal en el formulario + trigger `validar_solicitud` |
| **24 horas** | La solicitud debe crearse y aprobarse con al menos **24 h** de anticipación al turno más próximo. | Modal en el formulario y en la gestión + triggers |
| **Máximo 3 por mes** | Cada colaborador puede presentar hasta **3 solicitudes por mes** (no se cuentan las que el compañero rechazó). | Modal en el formulario + trigger `validar_solicitud` |
| **Estudiantes** | Los perfiles con `es_estudiante = true` tienen solicitudes **ilimitadas**. | Se marca en el registro o desde *Usuarios* (admin) |

## 👥 Roles
| Rol | Permisos |
|---|---|
| **Asistencial** | Crea solicitudes de cambio de turno y consulta las propias. |
| **Coordinador** | Visualiza y aprueba/niega las solicitudes de su(s) área(s); dashboard y reportes. |
| **Administrador** | Acceso total: CRUD de solicitudes, usuarios y catálogos. |

**Usuario administrador inicial:** `juan.etayo@cacsantabarbara.co` / `admin123*`

## 🧱 Stack
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Recharts + lucide-react
- **Backend:** Supabase (PostgreSQL 17, Auth, RLS, Edge Functions)
- **Correo:** Resend (vía Edge Function `notificar`)
- **Exportación:** SheetJS (Excel) + jsPDF (PDF con logo)
- **Despliegue:** GitHub Pages (GitHub Actions)

## 🚀 Desarrollo local
```bash
npm install
npm run dev      # http://localhost:5173/cambiodeturnos/
npm run build    # genera dist/
```
> Las credenciales públicas de Supabase ya vienen como fallback en `src/lib/config.ts`.
> Para sobreescribirlas crea un `.env` a partir de `.env.example`.

## 📁 Estructura
Ver [docs/ESTRUCTURA_PROYECTO.md](docs/ESTRUCTURA_PROYECTO.md).

## 🗄️ Base de datos
Esquema, catálogos y políticas RLS en [docs/BASE_DE_DATOS.md](docs/BASE_DE_DATOS.md).
Migraciones versionadas en `supabase/migrations/`.

## ✉️ Notificaciones (Resend)
Configura los secretos de la Edge Function — ver [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).

## 📚 Documentación
- [Super Prompt (especificación completa)](docs/SUPER_PROMPT.md)
- [Estructura del proyecto](docs/ESTRUCTURA_PROYECTO.md)
- [Base de datos](docs/BASE_DE_DATOS.md)
- [Guía de despliegue](docs/DESPLIEGUE.md)
- [Manual de usuario](docs/MANUAL_USUARIO.md)

---
© Clínica de Alta Complejidad Santa Bárbara — Sistema Interno

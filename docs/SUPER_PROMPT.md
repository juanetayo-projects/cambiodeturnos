# SUPER PROMPT — Aplicación de Gestión de Cambio de Turnos
### Clínica de Alta Complejidad Santa Bárbara

Documento maestro que consolida la especificación original y **todas las decisiones tomadas
durante el desarrollo**. Sirve para reconstruir o evolucionar la aplicación.

---

## 1. Objetivo
App web para gestionar **solicitudes de cambio de turno** del personal asistencial, con
aprobación por coordinadores de área, panel de métricas tipo Odoo, reportes exportables y
notificaciones por correo. Migra el proceso previo (Google Sheets + Apps Script).

## 2. Identidad visual
- Azul principal **`#0D2D6B`**, azul de contraste **`#16468E`**.
- Logos: `public/logo.png` (azul) y `public/logo-blanco.png` (blanco).
- Tipografía Inter. Cards con sombra/relieve, tablas con filas alternas y bordes con sombra.

## 3. Arquitectura
| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + Recharts + lucide-react |
| Backend / DB | Supabase (PostgreSQL 17, Auth, RLS, Edge Functions) |
| Correo | Resend vía Edge Function `notificar` |
| Exportación | SheetJS (Excel) + jsPDF/autotable (PDF con logo) |
| Despliegue | GitHub Pages (GitHub Actions) |

- **Repositorio GitHub:** `cambiodeturnos`
- **Proyecto Supabase:** `cambiodeturnos` (`ref rykondrasrvnuurolqqk`, us-east-1)
- **Edge Function:** `notificar`
- **API Key Resend:** `notificacionturnos`

## 4. Roles y permisos
- **Asistencial:** crea y consulta sus solicitudes.
- **Coordinador:** ve/aprueba/niega las solicitudes de su(s) área(s); dashboard y reportes.
- **Administrador:** acceso total + CRUD de usuarios y catálogos.
- **Admin inicial:** `juan.etayo@cacsantabarbara.co` / `admin123*` (Juan Carlos Etayo).
- Seguridad por **RLS** en todas las tablas (ver `docs/BASE_DE_DATOS.md`).

## 5. Modelo de datos (origen: hoja DATA, 7.578 registros importados)
Tabla `solicitudes` con: datos del solicitante (cargo, área/proceso, coordinador, nombre,
documento, correo, turno y fecha), datos del compañero que acepta (nombre, documento, correo,
turno y fecha), aceptación de términos, **estado** (`PENDIENTE`/`APROBADA`/`NEGADA`),
observación de solicitud y de respuesta, identificador legible `CT-000000`.

Catálogos (listas desplegables con CRUD): `areas` (16), `cargos` (17), `turnos` (7),
`coordinadores` (23, origen hoja CORREOS).

## 6. Funcionalidades
1. **Login** institucional (correo/contraseña) + registro + recuperación de contraseña.
2. **Formulario de solicitud** en una sola pantalla (sin scroll), con observaciones.
3. **Dashboard** con cards de métricas (color por tipo, sombra/relieve) y gráficos
   (mensual apilado, estado, turno, área).
4. **Tabla CRUD** de solicitudes con filtros: texto, año, mes, proceso, estado, turno, cargo.
5. **Gestión coordinador:** aprobar/negar con comentario.
6. **Reportes** por estado, turno, área y detalle, con exportación **Excel/PDF** (logo + encabezado).
7. **Administración** de usuarios (rol, áreas, activo) y catálogos.
8. **Notificaciones** por correo (HTML profesional):
   - Al solicitante: confirmación con ID.
   - Al coordinador: aviso con botón a la app.
   - Al solicitante: resultado (aprobada/negada) con comentario.

## 7. Decisiones y cambios durante el desarrollo
- **Identificador:** se generó `CT-NNNNNN` por trigger (los datos originales no tenían ID estable).
- **Coordinador por solicitud:** el formulario selecciona el coordinador del área (puede haber
  varios por área: enfermería, médico, rehabilitación), guardando `jefe_proceso` y `correo_coordinador`.
- **Alcance del coordinador:** se modeló con tabla `profile_areas` (un coordinador puede
  supervisar varias áreas, p.ej. rehabilitación que cubre 3 áreas).
- **Aprobación desde la app:** el botón del correo lleva a la app; el coordinador inicia sesión
  y resuelve (no se usan enlaces-token, por seguridad y trazabilidad).
- **Registro de usuarios:** auto-creación de perfil `asistencial` por trigger `handle_new_user`;
  el admin promueve a coordinador y asigna áreas.
- **Estadísticas:** funciones RPC `SECURITY INVOKER` para respetar RLS por rol en el dashboard.
- **Histórico:** importado con `scripts/importar_historico.mjs` (autenticado como admin),
  normalizando fechas (formatos `dd/mm/yyyy, hh:mm:ss a.m.` e ISO).
- **Clave Supabase pública** embebida como fallback en `config.ts` (segura por RLS) para que el
  build de GitHub Pages funcione sin secretos manuales.
- **Routing HashRouter** para compatibilidad con GitHub Pages (sin 404 en recargas).

## 8. Pendientes de configuración (no-código)
- Activar **GitHub Pages** (Source: GitHub Actions).
- Crear API key **`notificacionturnos`** en Resend y configurar secretos
  `RESEND_API_KEY`, `RESEND_FROM`, `APP_URL` en la Edge Function (ver `docs/DESPLIEGUE.md`).
- Verificar dominio del remitente en Resend para envío a cualquier destinatario.

## 9. Estado de entrega
✅ Esquema + RLS + catálogos + admin · ✅ 7.578 registros importados · ✅ Frontend completo
· ✅ Edge Function desplegada · ✅ Build de producción · ⏳ Pages/Resend (configuración del usuario).

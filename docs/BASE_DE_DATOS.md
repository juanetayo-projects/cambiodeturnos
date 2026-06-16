# Base de Datos — Supabase (PostgreSQL 17)

Proyecto **cambiodeturnos** · ref `rykondrasrvnuurolqqk`.

## Diagrama lógico
```
auth.users ──1:1── profiles ──*── profile_areas ──*── areas
                      │                                  │
                      │ (rol)                            │
                 asistencial / coordinador / administrador
                                                          │
coordinadores ──*── areas        solicitudes ──*── areas ─┘
```

## Tablas

### `profiles` (1:1 con `auth.users`)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | = auth.users.id |
| nombre, correo | text | correo único |
| rol | text | `asistencial` \| `coordinador` \| `administrador` |
| cargo, documento | text | |
| activo | bool | |

### `solicitudes`
Registro central. Campos del solicitante, del compañero que acepta, estado
(`PENDIENTE`/`APROBADA`/`NEGADA`), observaciones, y trazabilidad (`resuelto_por`, `fecha_resolucion`).
`codigo` legible (`CT-000001`) generado por trigger.

### Catálogos (listas desplegables, CRUD por admin)
- `areas` — procesos/áreas (16)
- `cargos` — cargos del solicitante (17)
- `turnos` — tipos de turno (7)
- `coordinadores` — aprobadores por área (origen hoja CORREOS)

### `profile_areas`
Áreas que supervisa cada coordinador (relación N:N).

## Seguridad (RLS)
RLS habilitado en todas las tablas. Funciones helper `SECURITY DEFINER`:
`current_rol()`, `is_admin()`, `supervises_area(area_id)`.

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | propio / admin | (trigger) | propio / admin | admin |
| catálogos | autenticados | admin | admin | admin |
| solicitudes | admin · coordinador (su área) · solicitante (propias) | autenticado (propias) o admin | admin · coordinador (su área) | admin |

## Funciones de estadística (RPC, respetan RLS)
`stats_resumen()`, `stats_estados()`, `stats_por_mes(anio)`, `stats_por_area()`, `stats_por_turno()`.

## Migraciones
| Archivo | Contenido |
|---|---|
| `0001_schema.sql` | Tablas, índices, triggers |
| `0002_rls.sql` | Políticas RLS y helpers |
| `0003_seed_catalogos.sql` | Catálogos + coordinadores |
| `0004_seed_admin.sql` | Usuario administrador |
| `0005_handle_new_user.sql` | Perfil automático al registrarse |
| `0006_stats.sql` | Funciones de estadística |

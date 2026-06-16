-- =====================================================================
--  Cambio de Turnos · Clínica de Alta Complejidad Santa Bárbara
--  Migración 0001 — Esquema base (catálogos, perfiles, solicitudes)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Catálogos (listas desplegables)
-- ---------------------------------------------------------------------
create table if not exists public.areas (
  id          serial primary key,
  nombre      text not null unique,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.cargos (
  id          serial primary key,
  nombre      text not null unique,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.turnos (
  id          serial primary key,
  nombre      text not null unique,
  orden       int not null default 0,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Coordinadores / aprobadores (origen: hoja CORREOS)
create table if not exists public.coordinadores (
  id          serial primary key,
  area_id     int references public.areas(id) on delete set null,
  cargo       text not null,           -- p.ej. "Coordinador enfermería Urgencias"
  nombre      text,
  correo      text not null,
  link        text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Perfiles de usuario (1:1 con auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  correo      text not null unique,
  rol         text not null default 'asistencial'
              check (rol in ('asistencial','coordinador','administrador')),
  cargo       text,
  documento   text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Áreas/procesos que supervisa un coordinador (un coordinador puede tener varias)
create table if not exists public.profile_areas (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  area_id     int  not null references public.areas(id) on delete cascade,
  primary key (profile_id, area_id)
);

-- ---------------------------------------------------------------------
-- Solicitudes de cambio de turno
-- ---------------------------------------------------------------------
create table if not exists public.solicitudes (
  id                    bigserial primary key,
  codigo                text unique,                       -- ID legible CT-000001
  fecha_solicitud       timestamptz not null default now(),
  -- Solicitante
  cargo_solicitante     text,
  area_id               int references public.areas(id) on delete set null,
  proceso               text,                              -- nombre del área (histórico)
  jefe_proceso          text,                              -- coordinador asignado
  correo_coordinador    text,
  nombre_solicitante    text not null,
  doc_solicitante       text,
  correo_solicitante    text not null,
  turno_solicitante     text,
  fecha_turno_solicitante date,
  -- Quien acepta el cambio
  nombre_acepta         text,
  doc_acepta            text,
  correo_acepta         text,
  turno_acepta          text,
  fecha_turno_acepta    date,
  -- Gestión
  acepta_terminos       boolean not null default false,
  estado                text not null default 'PENDIENTE'
                        check (estado in ('PENDIENTE','APROBADA','NEGADA')),
  obser_solicitud       text,
  obser_respuesta       text,
  solicitante_id        uuid references public.profiles(id) on delete set null,
  resuelto_por          uuid references public.profiles(id) on delete set null,
  fecha_resolucion      timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_solicitudes_area     on public.solicitudes(area_id);
create index if not exists idx_solicitudes_estado   on public.solicitudes(estado);
create index if not exists idx_solicitudes_fecha    on public.solicitudes(fecha_solicitud);
create index if not exists idx_solicitudes_correosol on public.solicitudes(correo_solicitante);

-- ---------------------------------------------------------------------
-- Trigger: código legible + updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_codigo_solicitud()
returns trigger language plpgsql as $$
begin
  if new.codigo is null then
    new.codigo := 'CT-' || lpad(new.id::text, 6, '0');
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_codigo on public.solicitudes;
create trigger trg_codigo
  before insert or update on public.solicitudes
  for each row execute function public.set_codigo_solicitud();

-- updated_at en profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

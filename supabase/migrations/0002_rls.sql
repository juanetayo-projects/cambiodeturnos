-- =====================================================================
--  Migración 0002 — Seguridad a nivel de fila (RLS) y permisos
-- =====================================================================

-- Funciones helper (SECURITY DEFINER para evitar recursión en políticas)
create or replace function public.current_rol()
returns text language sql stable security definer set search_path = public as $$
  select rol from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'administrador' and activo);
$$;

create or replace function public.supervises_area(p_area_id int)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profile_areas pa
    join public.profiles p on p.id = pa.profile_id
    where pa.profile_id = auth.uid() and pa.area_id = p_area_id and p.rol = 'coordinador' and p.activo
  );
$$;

-- ---------------------------------------------------------------------
-- Habilitar RLS
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.profile_areas enable row level security;
alter table public.areas         enable row level security;
alter table public.cargos        enable row level security;
alter table public.turnos        enable row level security;
alter table public.coordinadores enable row level security;
alter table public.solicitudes   enable row level security;

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- PROFILE_AREAS (solo admin gestiona; coordinador lee las suyas)
-- ---------------------------------------------------------------------
drop policy if exists pa_select on public.profile_areas;
create policy pa_select on public.profile_areas for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());

drop policy if exists pa_admin on public.profile_areas;
create policy pa_admin on public.profile_areas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- CATÁLOGOS: lectura para autenticados; escritura solo admin
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['areas','cargos','turnos','coordinadores'] loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (true)', t);
    execute format('drop policy if exists %1$s_admin on public.%1$s', t);
    execute format('create policy %1$s_admin on public.%1$s for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- SOLICITUDES
-- ---------------------------------------------------------------------
-- SELECT: admin todo | coordinador su(s) área(s) | asistencial las suyas
drop policy if exists sol_select on public.solicitudes;
create policy sol_select on public.solicitudes for select to authenticated
  using (
    public.is_admin()
    or public.supervises_area(area_id)
    or solicitante_id = auth.uid()
    or correo_solicitante = (select correo from public.profiles where id = auth.uid())
  );

-- INSERT: cualquier usuario autenticado puede crear su solicitud
drop policy if exists sol_insert on public.solicitudes;
create policy sol_insert on public.solicitudes for insert to authenticated
  with check (
    solicitante_id = auth.uid()
    or correo_solicitante = (select correo from public.profiles where id = auth.uid())
    or public.is_admin()
  );

-- UPDATE: admin todo | coordinador resuelve las de su área
drop policy if exists sol_update on public.solicitudes;
create policy sol_update on public.solicitudes for update to authenticated
  using (public.is_admin() or public.supervises_area(area_id))
  with check (public.is_admin() or public.supervises_area(area_id));

-- DELETE: solo admin
drop policy if exists sol_delete on public.solicitudes;
create policy sol_delete on public.solicitudes for delete to authenticated
  using (public.is_admin());

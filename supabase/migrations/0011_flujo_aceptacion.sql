-- =====================================================================
--  Migración 0011 — Nuevo flujo de aprobación y reglas de negocio
--
--  1. Regla de misma semana (lunes a domingo) entre los dos turnos.
--  2. Regla de 24 horas de anticipación.
--  3. Flujo en dos pasos: el compañero responde (desde el correo) y
--     luego el coordinador da el visto bueno.
--  5/6/7. Máximo 3 solicitudes por mes, ilimitadas para estudiantes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 7. Identificador de estudiante en el perfil
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists es_estudiante boolean not null default false;

comment on column public.profiles.es_estudiante is
  'Marca si el colaborador está adelantando estudios: solicitudes ilimitadas.';

-- ---------------------------------------------------------------------
-- 3. Respuesta del compañero que acepta el cambio
-- ---------------------------------------------------------------------
alter table public.solicitudes
  add column if not exists respuesta_acepta       text,
  add column if not exists fecha_respuesta_acepta timestamptz,
  add column if not exists obser_acepta           text,
  add column if not exists token_acepta           uuid;

-- Histórico: no participó del nuevo flujo
update public.solicitudes set respuesta_acepta = 'NO_APLICA' where respuesta_acepta is null;
update public.solicitudes set token_acepta = gen_random_uuid() where token_acepta is null;

alter table public.solicitudes
  alter column respuesta_acepta set default 'PENDIENTE',
  alter column respuesta_acepta set not null,
  alter column token_acepta     set default gen_random_uuid(),
  alter column token_acepta     set not null;

do $$ begin
  alter table public.solicitudes
    add constraint solicitudes_respuesta_acepta_check
    check (respuesta_acepta in ('PENDIENTE','ACEPTADO','RECHAZADO','NO_APLICA'));
exception when duplicate_object then null; end $$;

create unique index if not exists idx_solicitudes_token on public.solicitudes(token_acepta);

-- Nuevos estados del ciclo de vida
alter table public.solicitudes drop constraint if exists solicitudes_estado_check;
alter table public.solicitudes
  add constraint solicitudes_estado_check
  check (estado in (
    'PENDIENTE',              -- histórico (flujo anterior)
    'PENDIENTE_COMPANERO',    -- esperando respuesta de quien acepta
    'PENDIENTE_COORDINADOR',  -- compañero aceptó, falta VoBo del coordinador
    'RECHAZADA_COMPANERO',    -- el compañero no aceptó (terminal)
    'APROBADA',
    'NEGADA'
  ));

create index if not exists idx_solicitudes_correoacepta on public.solicitudes(correo_acepta);
create index if not exists idx_solicitudes_solicitante on public.solicitudes(solicitante_id);

-- ---------------------------------------------------------------------
-- Parámetros y utilidades de reglas
-- ---------------------------------------------------------------------
create or replace function public.tz_clinica() returns text
language sql immutable as $$ select 'America/Bogota'::text $$;

create or replace function public.limite_solicitudes_mes() returns int
language sql immutable as $$ select 3 $$;

-- Inicio (lunes) de la semana de una fecha
create or replace function public.inicio_semana(p_fecha date) returns date
language sql immutable as $$ select (date_trunc('week', p_fecha::timestamp))::date $$;

-- Momento de inicio del turno (00:00 hora Colombia) como timestamptz
create or replace function public.inicio_turno(p_fecha date) returns timestamptz
language sql stable as $$ select (p_fecha::timestamp at time zone public.tz_clinica()) $$;

-- 5/6. Solicitudes presentadas por un colaborador en el mes en curso.
--      No se cuentan las rechazadas por el compañero (nunca avanzaron).
create or replace function public.solicitudes_mes(p_profile uuid default auth.uid())
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int
    from public.solicitudes
   where solicitante_id = p_profile
     and estado <> 'RECHAZADA_COMPANERO'
     and date_trunc('month', fecha_solicitud at time zone public.tz_clinica())
       = date_trunc('month', now() at time zone public.tz_clinica());
$$;

-- Cupo disponible del usuario actual (json para el formulario)
create or replace function public.cupo_solicitudes(p_profile uuid default auth.uid())
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'usadas',       public.solicitudes_mes(p_profile),
    'limite',       public.limite_solicitudes_mes(),
    'es_estudiante', coalesce((select es_estudiante from public.profiles where id = p_profile), false),
    'ilimitado',    coalesce((select es_estudiante from public.profiles where id = p_profile), false)
  );
$$;

-- ---------------------------------------------------------------------
-- 1, 2, 5, 6. Validación al crear la solicitud
-- ---------------------------------------------------------------------
create or replace function public.validar_solicitud()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_estudiante boolean;
  v_usadas     int;
  v_limite     int := public.limite_solicitudes_mes();
begin
  -- El histórico y las cargas masivas (sin solicitante_id) no se validan
  if new.solicitante_id is null then
    return new;
  end if;

  -- 1. Ambos turnos dentro de la misma semana (lunes a domingo)
  if new.fecha_turno_solicitante is null or new.fecha_turno_acepta is null then
    raise exception 'Debes indicar la fecha de ambos turnos.'
      using errcode = 'P0001', hint = 'FECHAS_REQUERIDAS';
  end if;

  if public.inicio_semana(new.fecha_turno_solicitante) <> public.inicio_semana(new.fecha_turno_acepta) then
    raise exception 'El cambio solo se puede autorizar dentro de la misma semana (lunes a domingo). Semana permitida: % a %.',
      to_char(public.inicio_semana(new.fecha_turno_solicitante), 'DD/MM/YYYY'),
      to_char(public.inicio_semana(new.fecha_turno_solicitante) + 6, 'DD/MM/YYYY')
      using errcode = 'P0001', hint = 'REGLA_SEMANA';
  end if;

  -- 2. Mínimo 24 horas de anticipación sobre el turno más próximo
  if public.inicio_turno(least(new.fecha_turno_solicitante, new.fecha_turno_acepta))
       <= now() + interval '24 hours' then
    raise exception 'La solicitud debe registrarse con al menos 24 horas de anticipación al turno.'
      using errcode = 'P0001', hint = 'REGLA_24H';
  end if;

  -- 5 y 6. Tope mensual (ilimitado para estudiantes)
  select coalesce(es_estudiante, false) into v_estudiante
    from public.profiles where id = new.solicitante_id;

  if not coalesce(v_estudiante, false) then
    v_usadas := public.solicitudes_mes(new.solicitante_id);
    if v_usadas >= v_limite then
      raise exception 'Alcanzaste el máximo de % solicitudes de cambio de turno para este mes (llevas %).',
        v_limite, v_usadas
        using errcode = 'P0001', hint = 'LIMITE_MENSUAL';
    end if;
  end if;

  -- Estado inicial del nuevo flujo
  if new.estado in ('PENDIENTE','PENDIENTE_COMPANERO') then
    new.estado := 'PENDIENTE_COMPANERO';
    new.respuesta_acepta := 'PENDIENTE';
  end if;

  return new;
end $$;

drop trigger if exists trg_validar_solicitud on public.solicitudes;
create trigger trg_validar_solicitud
  before insert on public.solicitudes
  for each row execute function public.validar_solicitud();

-- ---------------------------------------------------------------------
-- 2, 3. Validación al resolver (VoBo del coordinador)
-- ---------------------------------------------------------------------
create or replace function public.validar_resolucion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.estado = old.estado then
    return new;
  end if;

  if new.estado in ('APROBADA','NEGADA') and old.respuesta_acepta = 'PENDIENTE' then
    raise exception 'El compañero aún no ha respondido la solicitud. No es posible dar el visto bueno.'
      using errcode = 'P0001', hint = 'FALTA_RESPUESTA_COMPANERO';
  end if;

  if new.estado = 'APROBADA' and old.respuesta_acepta = 'RECHAZADO' then
    raise exception 'El compañero no aceptó el cambio; la solicitud no puede aprobarse.'
      using errcode = 'P0001', hint = 'COMPANERO_RECHAZO';
  end if;

  -- 2. El visto bueno también exige 24 horas de anticipación
  if new.estado = 'APROBADA'
     and new.fecha_turno_solicitante is not null
     and public.inicio_turno(least(new.fecha_turno_solicitante,
                                   coalesce(new.fecha_turno_acepta, new.fecha_turno_solicitante)))
         <= now() + interval '24 hours' then
    raise exception 'El cambio solo puede autorizarse hasta 24 horas antes del turno.'
      using errcode = 'P0001', hint = 'REGLA_24H';
  end if;

  return new;
end $$;

drop trigger if exists trg_validar_resolucion on public.solicitudes;
create trigger trg_validar_resolucion
  before update on public.solicitudes
  for each row execute function public.validar_resolucion();

-- ---------------------------------------------------------------------
-- 3. Respuesta del compañero desde el correo (acceso por token)
-- ---------------------------------------------------------------------
create or replace function public.solicitud_por_token(p_token uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', s.id, 'codigo', s.codigo, 'estado', s.estado,
    'respuesta_acepta', s.respuesta_acepta,
    'fecha_respuesta_acepta', s.fecha_respuesta_acepta,
    'nombre_solicitante', s.nombre_solicitante,
    'cargo_solicitante', s.cargo_solicitante,
    'proceso', s.proceso,
    'turno_solicitante', s.turno_solicitante,
    'fecha_turno_solicitante', s.fecha_turno_solicitante,
    'nombre_acepta', s.nombre_acepta,
    'turno_acepta', s.turno_acepta,
    'fecha_turno_acepta', s.fecha_turno_acepta,
    'obser_solicitud', s.obser_solicitud,
    'obser_acepta', s.obser_acepta
  )
  from public.solicitudes s where s.token_acepta = p_token;
$$;

create or replace function public.responder_solicitud(p_token uuid, p_respuesta text)
returns json language plpgsql security definer set search_path = public as $$
declare s public.solicitudes;
begin
  if p_respuesta not in ('ACEPTADO','RECHAZADO') then
    return json_build_object('ok', false, 'error', 'Respuesta inválida.');
  end if;

  select * into s from public.solicitudes where token_acepta = p_token;
  if not found then
    return json_build_object('ok', false, 'error', 'El enlace no corresponde a ninguna solicitud.');
  end if;

  if s.respuesta_acepta <> 'PENDIENTE' then
    return json_build_object('ok', false, 'yaRespondida', true,
      'respuesta', s.respuesta_acepta, 'codigo', s.codigo,
      'error', 'Esta solicitud ya fue respondida.');
  end if;

  update public.solicitudes
     set respuesta_acepta = p_respuesta,
         fecha_respuesta_acepta = now(),
         estado = case when p_respuesta = 'ACEPTADO'
                       then 'PENDIENTE_COORDINADOR' else 'RECHAZADA_COMPANERO' end
   where id = s.id
   returning * into s;

  return json_build_object('ok', true, 'id', s.id, 'codigo', s.codigo,
    'respuesta', s.respuesta_acepta, 'estado', s.estado);
end $$;

create or replace function public.comentar_respuesta(p_token uuid, p_obser text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  update public.solicitudes set obser_acepta = nullif(btrim(p_obser), '')
   where token_acepta = p_token and respuesta_acepta in ('ACEPTADO','RECHAZADO')
   returning id into v_id;
  if v_id is null then
    return json_build_object('ok', false, 'error', 'No fue posible guardar el comentario.');
  end if;
  return json_build_object('ok', true);
end $$;

-- El compañero responde sin iniciar sesión: se permite a anon (el token es el secreto)
grant execute on function public.solicitud_por_token(uuid) to anon, authenticated;
grant execute on function public.responder_solicitud(uuid, text) to anon, authenticated;
grant execute on function public.comentar_respuesta(uuid, text) to anon, authenticated;
grant execute on function public.solicitudes_mes(uuid) to authenticated;
grant execute on function public.cupo_solicitudes(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- RLS: quien acepta el cambio también puede ver su solicitud en la app
-- ---------------------------------------------------------------------
drop policy if exists sol_select on public.solicitudes;
create policy sol_select on public.solicitudes for select to authenticated
  using (
    public.is_admin()
    or public.supervises_area(area_id)
    or solicitante_id = auth.uid()
    or correo_solicitante = (select correo from public.profiles where id = auth.uid())
    or correo_acepta = (select correo from public.profiles where id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- Registro: el usuario indica si adelanta estudios
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombre, correo, rol, documento, cargo, es_estudiante)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
    new.email,
    'asistencial',
    new.raw_user_meta_data->>'documento',
    new.raw_user_meta_data->>'cargo',
    coalesce((new.raw_user_meta_data->>'es_estudiante')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Dashboard: los estados pendientes ahora son tres
-- ---------------------------------------------------------------------
create or replace function public.dashboard_data(
  p_anio int default null, p_mes int default null, p_area_id int default null,
  p_estado text default null, p_turno text default null, p_cargo text default null
) returns json language sql stable security invoker set search_path = public as $$
  with f as (
    select * from public.solicitudes s
    where (p_anio is null or extract(year from s.fecha_solicitud) = p_anio)
      and (p_mes is null or extract(month from s.fecha_solicitud) = p_mes)
      and (p_area_id is null or s.area_id = p_area_id)
      and (p_estado is null or s.estado = p_estado)
      and (p_turno is null or s.turno_solicitante = p_turno)
      and (p_cargo is null or s.cargo_solicitante = p_cargo)
  )
  select json_build_object(
    'resumen', (select json_build_object(
        'total', count(*),
        'aprobadas', count(*) filter (where estado='APROBADA'),
        'negadas', count(*) filter (where estado in ('NEGADA','RECHAZADA_COMPANERO')),
        'pendientes', count(*) filter (where estado like 'PENDIENTE%'),
        'este_mes', count(*) filter (where date_trunc('month',fecha_solicitud)=date_trunc('month',now()))
      ) from f),
    'por_mes', (select coalesce(json_agg(json_build_object('mes',mes,'aprobadas',aprobadas,'negadas',negadas,'pendientes',pendientes) order by mes),'[]') from (
        select extract(month from fecha_solicitud)::int mes,
          count(*) filter (where estado='APROBADA') aprobadas,
          count(*) filter (where estado in ('NEGADA','RECHAZADA_COMPANERO')) negadas,
          count(*) filter (where estado like 'PENDIENTE%') pendientes
        from f group by 1) m),
    'por_area', (select coalesce(json_agg(json_build_object('area',area,'n',n) order by n desc),'[]') from (
        select coalesce(proceso,'(Sin área)') area, count(*) n from f group by 1) a),
    'por_turno', (select coalesce(json_agg(json_build_object('turno',turno,'n',n) order by n desc),'[]') from (
        select coalesce(turno_solicitante,'(Sin turno)') turno, count(*) n from f group by 1) t),
    'estados', (select coalesce(json_agg(json_build_object('estado',estado,'n',n)),'[]') from (
        select estado, count(*) n from f group by 1) e)
  );
$$;

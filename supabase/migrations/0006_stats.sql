-- =====================================================================
--  Migración 0006 — Funciones de estadística (respetan RLS del invocador)
-- =====================================================================

create or replace function public.stats_estados()
returns table(estado text, n bigint)
language sql stable security invoker set search_path = public as $$
  select estado, count(*) from public.solicitudes group by estado;
$$;

create or replace function public.stats_por_mes(p_anio int)
returns table(mes int, n bigint, aprobadas bigint, negadas bigint, pendientes bigint)
language sql stable security invoker set search_path = public as $$
  select extract(month from fecha_solicitud)::int as mes,
         count(*) as n,
         count(*) filter (where estado='APROBADA') as aprobadas,
         count(*) filter (where estado='NEGADA') as negadas,
         count(*) filter (where estado='PENDIENTE') as pendientes
  from public.solicitudes
  where extract(year from fecha_solicitud) = p_anio
  group by 1 order by 1;
$$;

create or replace function public.stats_por_area()
returns table(area text, n bigint)
language sql stable security invoker set search_path = public as $$
  select coalesce(proceso,'(Sin área)') as area, count(*)
  from public.solicitudes group by 1 order by 2 desc;
$$;

create or replace function public.stats_por_turno()
returns table(turno text, n bigint)
language sql stable security invoker set search_path = public as $$
  select coalesce(turno_solicitante,'(Sin turno)') as turno, count(*)
  from public.solicitudes group by 1 order by 2 desc;
$$;

create or replace function public.stats_resumen()
returns table(total bigint, aprobadas bigint, negadas bigint, pendientes bigint, este_mes bigint)
language sql stable security invoker set search_path = public as $$
  select count(*),
         count(*) filter (where estado='APROBADA'),
         count(*) filter (where estado='NEGADA'),
         count(*) filter (where estado='PENDIENTE'),
         count(*) filter (where date_trunc('month',fecha_solicitud)=date_trunc('month',now()))
  from public.solicitudes;
$$;

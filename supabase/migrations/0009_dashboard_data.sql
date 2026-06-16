-- =====================================================================
--  Migración 0009 — RPC flexible para Dashboard/Reportes con filtros
--  Respeta RLS (security invoker). Filtros opcionales: año, mes, área,
--  estado, turno, cargo. Devuelve un JSON con todas las agregaciones.
-- =====================================================================

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
        'negadas', count(*) filter (where estado='NEGADA'),
        'pendientes', count(*) filter (where estado='PENDIENTE'),
        'este_mes', count(*) filter (where date_trunc('month',fecha_solicitud)=date_trunc('month',now()))
      ) from f),
    'por_mes', (select coalesce(json_agg(json_build_object('mes',mes,'aprobadas',aprobadas,'negadas',negadas,'pendientes',pendientes) order by mes),'[]') from (
        select extract(month from fecha_solicitud)::int mes,
          count(*) filter (where estado='APROBADA') aprobadas,
          count(*) filter (where estado='NEGADA') negadas,
          count(*) filter (where estado='PENDIENTE') pendientes
        from f group by 1) m),
    'por_area', (select coalesce(json_agg(json_build_object('area',area,'n',n) order by n desc),'[]') from (
        select coalesce(proceso,'(Sin área)') area, count(*) n from f group by 1) a),
    'por_turno', (select coalesce(json_agg(json_build_object('turno',turno,'n',n) order by n desc),'[]') from (
        select coalesce(turno_solicitante,'(Sin turno)') turno, count(*) n from f group by 1) t),
    'estados', (select coalesce(json_agg(json_build_object('estado',estado,'n',n)),'[]') from (
        select estado, count(*) n from f group by 1) e)
  );
$$;

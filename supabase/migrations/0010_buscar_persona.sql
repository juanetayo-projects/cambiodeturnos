-- =====================================================================
--  Migración 0010 — Búsqueda de persona por documento (cédula)
--  Devuelve nombre y correo desde el histórico de solicitudes.
--  Usado en el formulario para autocompletar a "quien acepta el cambio".
-- =====================================================================
create or replace function public.buscar_persona(p_doc text)
returns table(nombre text, correo text)
language sql stable security definer set search_path = public as $$
  select nombre, correo from (
    select nombre_solicitante as nombre, correo_solicitante as correo, fecha_solicitud as f
      from public.solicitudes where doc_solicitante = p_doc and nombre_solicitante is not null
    union all
    select nombre_acepta, correo_acepta, fecha_solicitud
      from public.solicitudes where doc_acepta = p_doc and nombre_acepta is not null
  ) t
  order by f desc nulls last
  limit 1;
$$;

revoke execute on function public.buscar_persona(text) from public, anon;
grant execute on function public.buscar_persona(text) to authenticated;

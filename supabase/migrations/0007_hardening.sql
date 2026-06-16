-- =====================================================================
--  Migración 0007 — Endurecimiento de seguridad (advisories Supabase)
-- =====================================================================

-- Fijar search_path en funciones de trigger
create or replace function public.set_codigo_solicitud()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.codigo is null then
    new.codigo := 'CT-' || lpad(new.id::text, 6, '0');
  end if;
  new.updated_at := now();
  return new;
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

-- handle_new_user es solo de trigger: nadie debe invocarla por RPC
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Helpers de RLS: quitar acceso a anon/public, mantener solo authenticated
revoke execute on function public.current_rol() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.supervises_area(int) from public, anon;
grant execute on function public.current_rol() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.supervises_area(int) to authenticated;

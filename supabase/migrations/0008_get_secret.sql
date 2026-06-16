-- =====================================================================
--  Migración 0008 — Lectura segura de secretos de Vault
--  La Edge Function `notificar` lee RESEND_API_KEY y RESEND_FROM desde
--  Vault mediante esta función (solo ejecutable por service_role).
--  Los valores se cargan con vault.create_secret/update_secret (no en el repo).
-- =====================================================================

create or replace function public.get_secret(p_name text)
returns text language sql stable security definer set search_path = vault, public as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_name;
$$;

revoke execute on function public.get_secret(text) from public, anon, authenticated;
grant execute on function public.get_secret(text) to service_role;

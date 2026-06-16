-- =====================================================================
--  Migración 0005 — Auto-creación de perfil al registrarse
--  Todo usuario nuevo nace como 'asistencial'. El administrador
--  promueve a 'coordinador' y le asigna áreas desde la app.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombre, correo, rol, documento, cargo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
    new.email,
    'asistencial',
    new.raw_user_meta_data->>'documento',
    new.raw_user_meta_data->>'cargo'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

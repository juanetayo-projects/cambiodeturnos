-- =====================================================================
--  Migración 0004 — Usuario administrador inicial
--  Email: juan.etayo@cacsantabarbara.co  ·  Pass: admin123*
-- =====================================================================

do $$
declare
  v_uid uuid;
  v_email text := 'juan.etayo@cacsantabarbara.co';
begin
  select id into v_uid from auth.users where email = v_email;

  if v_uid is null then
    v_uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, crypt('admin123*', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nombre":"Juan Carlos Etayo"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_uid, v_uid::text,
      json_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true)::jsonb,
      'email', now(), now(), now()
    );
  end if;

  insert into public.profiles (id, nombre, correo, rol, activo)
  values (v_uid, 'Juan Carlos Etayo', v_email, 'administrador', true)
  on conflict (id) do update set rol = 'administrador', activo = true;
end $$;

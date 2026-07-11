update public.fire_companies set address = 'Jr. Heroes Civiles N. 129, Chiclayo', latitude = -6.767361, longitude = -79.839755 where id = '11111111-1111-4111-8111-111111111111';
update public.fire_companies set address = 'Av. Grau y Alfonso Ugarte s/n, Pimentel', latitude = -6.8340, longitude = -79.9348 where id = '22222222-2222-4222-8222-222222222222';
update public.fire_companies set latitude = -6.716698, longitude = -79.770758 where id = '33333333-3333-4333-8333-333333333333';

insert into public.fire_companies (id, name, address, latitude, longitude, coverage_radius_km, active)
values
  ('55555555-5555-4555-8555-555555555555', 'B-55 Ferrenafe', 'Esq. Leguia y Arequipa s/n, Ferrenafe', -6.642687, -79.786792, 12, true),
  ('88888888-8888-4888-8888-888888888888', 'B-88 Salvadora Lambayeque', 'Calle Baca Mattos s/n, Lambayeque', -6.698733, -79.905404, 12, true),
  ('14914914-9149-4149-8149-149149149149', 'B-149 Illimo', 'Panamericana Norte N. 368, Illimo', -6.474675, -79.856272, 15, true),
  ('17417417-4174-4174-8174-174174174174', 'B-174 Olmos', 'Av. Augusto B. Leguia cdra. 1, Olmos', -5.989848, -79.751022, 18, true),
  ('21121121-1211-4211-8211-211211211211', 'B-211 Circuito Muchik - Monsefu', 'Calle UPIS N. 3, Jesus Nazareno Cautivo, Monsefu', -6.864310, -79.868630, 12, true)
on conflict (id) do update set name = excluded.name, address = excluded.address, latitude = excluded.latitude, longitude = excluded.longitude, coverage_radius_km = excluded.coverage_radius_km, active = true;

with company_codes(company_id, code_prefix, company_label) as (
  values
    ('55555555-5555-4555-8555-555555555555'::uuid, 'A55', 'Ferrenafe 55'),
    ('88888888-8888-4888-8888-888888888888'::uuid, 'A88', 'Lambayeque 88'),
    ('14914914-9149-4149-8149-149149149149'::uuid, 'A149', 'Illimo 149'),
    ('17417417-4174-4174-8174-174174174174'::uuid, 'A174', 'Olmos 174'),
    ('21121121-1211-4211-8211-211211211211'::uuid, 'A211', 'Monsefu 211')
),
new_firefighters as materialized (
  select gen_random_uuid() as auth_user_id, c.company_id, c.company_label,
    c.code_prefix || lpad(s.n::text, 6 - length(c.code_prefix), '0') as firefighter_code,
    '+51993' || lpad((row_number() over (order by c.code_prefix, s.n))::text, 7, '0') as phone
  from company_codes c cross join generate_series(1, 10) as s(n)
  where not exists (select 1 from public.profiles p where p.firefighter_code = c.code_prefix || lpad(s.n::text, 6 - length(c.code_prefix), '0'))
),
created_users as (
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select auth_user_id, 'authenticated', 'authenticated', lower(firefighter_code) || '@bombero.alertabombero.app', extensions.crypt('bombero123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now() from new_firefighters
  returning id, email
),
created_identities as (
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  select id, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', id::text, now(), now() from created_users
)
insert into public.profiles (auth_user_id, role, name, last_name, phone, firefighter_code, company_id, phone_verified, active)
select auth_user_id, 'firefighter', 'Bombero', company_label || ' ' || right(firefighter_code, 3), phone, firefighter_code, company_id, true, true from new_firefighters;

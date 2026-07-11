-- Chiclayo Province operational seed: four companies with ten firefighters each.

update public.fire_companies
set name = 'B-27 Salvadora Chiclayo', address = 'Jr. Heroes Civiles 129, Chiclayo', latitude = -6.7719, longitude = -79.8408
where id = '11111111-1111-4111-8111-111111111111';

update public.fire_companies
set name = 'B-108 Cap. FAP Jose A. Quinones Gonzales - Pimentel', address = 'Calle Manuel Seone, Pimentel, Chiclayo', latitude = -6.8340, longitude = -79.9348
where id = '22222222-2222-4222-8222-222222222222';

update public.fire_companies
set name = 'B-154 Salvadora Picsi', address = 'Jr. Santa Ana 135, Picsi, Chiclayo', latitude = -6.71704, longitude = -79.77079
where id = '33333333-3333-4333-8333-333333333333';

insert into public.fire_companies (id, name, address, latitude, longitude, coverage_radius_km, active)
values ('44444444-4444-4444-8444-444444444444', 'B-195 Brigadier Mayor CBP Jose Esteves Castro', 'Jose Leonardo Ortiz, Chiclayo', -6.750482, -79.840318, 8, true)
on conflict (id) do update
set name = excluded.name, address = excluded.address, latitude = excluded.latitude, longitude = excluded.longitude, coverage_radius_km = excluded.coverage_radius_km, active = true;

update public.profiles
set firefighter_code = case id
  when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' then 'A27001'
  when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2' then 'A27002'
  when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3' then 'A10801'
end,
company_id = case id
  when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' then '11111111-1111-4111-8111-111111111111'::uuid
  when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2' then '11111111-1111-4111-8111-111111111111'::uuid
  when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3' then '22222222-2222-4222-8222-222222222222'::uuid
end
where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3');

update auth.users u
set email = lower(p.firefighter_code) || '@bombero.alertabombero.app', updated_at = now()
from public.profiles p
where p.auth_user_id = u.id
  and p.id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3');

update auth.identities i
set identity_data = jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
    updated_at = now()
from auth.users u
where i.user_id = u.id
  and u.email in ('a27001@bombero.alertabombero.app', 'a27002@bombero.alertabombero.app', 'a10801@bombero.alertabombero.app');

with company_codes(company_id, code_prefix, company_label) as (
  values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'A27', 'Chiclayo 27'),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'A108', 'Pimentel 108'),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'A154', 'Picsi 154'),
    ('44444444-4444-4444-8444-444444444444'::uuid, 'A195', 'JLO 195')
),
new_firefighters as materialized (
  select
    gen_random_uuid() as auth_user_id,
    c.company_id,
    c.company_label,
    c.code_prefix || lpad(s.sequence_number::text, 6 - length(c.code_prefix), '0') as firefighter_code,
    '+51992' || lpad((row_number() over (order by c.code_prefix, s.sequence_number))::text, 7, '0') as phone
  from company_codes c
  cross join generate_series(1, 10) as s(sequence_number)
  where not exists (
    select 1 from public.profiles p
    where p.firefighter_code = c.code_prefix || lpad(s.sequence_number::text, 6 - length(c.code_prefix), '0')
  )
),
created_users as (
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select
    auth_user_id, 'authenticated', 'authenticated', lower(firefighter_code) || '@bombero.alertabombero.app',
    extensions.crypt('bombero123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  from new_firefighters
  returning id, email
),
created_identities as (
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
  select u.id, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 'email', u.id::text, now(), now()
  from created_users u
)
insert into public.profiles (auth_user_id, role, name, last_name, phone, firefighter_code, company_id, phone_verified, active)
select f.auth_user_id, 'firefighter', 'Bombero', f.company_label || ' ' || right(f.firefighter_code, 3), f.phone, f.firefighter_code, f.company_id, true, true
from new_firefighters f;

alter table public.profiles drop constraint if exists profiles_firefighter_code_format;
alter table public.profiles add constraint profiles_firefighter_code_format check (role <> 'firefighter' or firefighter_code ~ '^A[0-9]{5}$');

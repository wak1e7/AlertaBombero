-- Initial AlertaBombero schema, security policies, storage bucket, and demo seed data.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create table if not exists public.fire_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  latitude numeric not null,
  longitude numeric not null,
  coverage_radius_km numeric not null check (coverage_radius_km > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('citizen', 'firefighter')),
  name text not null,
  last_name text not null,
  phone text not null,
  dni text,
  firefighter_code text,
  company_id uuid references public.fire_companies(id) on delete restrict,
  phone_verified boolean not null default false,
  active_session_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint profiles_citizen_fields check (
    (role = 'citizen' and dni is not null and firefighter_code is null and company_id is null)
    or
    (role = 'firefighter' and dni is null and firefighter_code is not null and company_id is not null)
  )
);

create table if not exists public.emergency_reports (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.profiles(id) on delete restrict,
  company_id uuid references public.fire_companies(id) on delete restrict,
  responding_firefighter_id uuid references public.profiles(id) on delete set null,
  type text not null,
  description text,
  latitude numeric not null,
  longitude numeric not null,
  address_text text,
  status text not null default 'ENVIADO' check (
    status in (
      'ENVIADO',
      'RECIBIDO',
      'EN_CAMINO',
      'ATENDIENDO',
      'FINALIZADO',
      'SIN_COMPANIA_DISPONIBLE'
    )
  ),
  created_at timestamptz not null default now(),
  received_at timestamptz,
  on_way_at timestamptz,
  attending_at timestamptz,
  finished_at timestamptz,
  constraint emergency_reports_citizen_role check (citizen_id <> responding_firefighter_id)
);

create table if not exists public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.emergency_reports(id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('image', 'video')),
  file_name text not null,
  file_size integer not null check (file_size > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.report_status_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.emergency_reports(id) on delete cascade,
  old_status text,
  new_status text not null check (
    new_status in (
      'ENVIADO',
      'RECIBIDO',
      'EN_CAMINO',
      'ATENDIENDO',
      'FINALIZADO',
      'SIN_COMPANIA_DISPONIBLE'
    )
  ),
  changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  observation text
);

create table if not exists public.live_locations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.emergency_reports(id) on delete cascade,
  firefighter_id uuid not null references public.profiles(id) on delete cascade,
  latitude numeric not null,
  longitude numeric not null,
  updated_at timestamptz not null default now(),
  unique (report_id, firefighter_id)
);

create table if not exists public.notification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  fcm_token text not null,
  platform text not null default 'web',
  created_at timestamptz not null default now(),
  active boolean not null default true,
  unique (fcm_token)
);

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_identifier text not null,
  code text not null,
  purpose text not null check (purpose in ('citizen_registration', 'citizen_new_device', 'firefighter_login')),
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.set_report_status(
  target_report_id uuid,
  target_status text,
  observation text default null
)
returns public.emergency_reports
language plpgsql
security invoker
set search_path = public, app_private, pg_temp
as $$
declare
  current_report public.emergency_reports;
  actor_id uuid;
  allowed_next_statuses text[];
begin
  actor_id := app_private.current_profile_id();

  if actor_id is null or app_private.current_profile_role() <> 'firefighter' then
    raise exception 'Only active firefighters can change report status';
  end if;

  if target_status not in ('RECIBIDO', 'EN_CAMINO', 'ATENDIENDO', 'FINALIZADO') then
    raise exception 'Invalid target status %', target_status;
  end if;

  select *
  into current_report
  from public.emergency_reports
  where id = target_report_id
  for update;

  if not found then
    raise exception 'Report not found';
  end if;

  if not app_private.is_firefighter_for_company(current_report.company_id) then
    raise exception 'Report is not assigned to this firefighter company';
  end if;

  if current_report.status = 'FINALIZADO' then
    raise exception 'Finalized reports cannot be changed';
  end if;

  allowed_next_statuses := case current_report.status
    when 'ENVIADO' then array['RECIBIDO']
    when 'RECIBIDO' then array['EN_CAMINO']
    when 'EN_CAMINO' then array['ATENDIENDO']
    when 'ATENDIENDO' then array['FINALIZADO']
    else array[]::text[]
  end;

  if not target_status = any(allowed_next_statuses) then
    raise exception 'Invalid transition from % to %', current_report.status, target_status;
  end if;

  update public.emergency_reports
  set
    status = target_status,
    responding_firefighter_id = case
      when target_status = 'EN_CAMINO' and responding_firefighter_id is null then actor_id
      else responding_firefighter_id
    end,
    received_at = case when target_status = 'RECIBIDO' then now() else received_at end,
    on_way_at = case when target_status = 'EN_CAMINO' then now() else on_way_at end,
    attending_at = case when target_status = 'ATENDIENDO' then now() else attending_at end,
    finished_at = case when target_status = 'FINALIZADO' then now() else finished_at end
  where id = current_report.id
  returning * into current_report;

  insert into public.report_status_history (
    report_id,
    old_status,
    new_status,
    changed_by,
    observation
  )
  values (
    current_report.id,
    case target_status
      when 'RECIBIDO' then 'ENVIADO'
      when 'EN_CAMINO' then 'RECIBIDO'
      when 'ATENDIENDO' then 'EN_CAMINO'
      when 'FINALIZADO' then 'ATENDIENDO'
    end,
    target_status,
    actor_id,
    observation
  );

  return current_report;
end;
$$;

create unique index if not exists profiles_auth_user_id_key
  on public.profiles(auth_user_id)
  where auth_user_id is not null;

create unique index if not exists profiles_phone_key
  on public.profiles(phone);

create unique index if not exists profiles_dni_key
  on public.profiles(dni)
  where dni is not null;

create unique index if not exists profiles_firefighter_code_key
  on public.profiles(firefighter_code)
  where firefighter_code is not null;

create index if not exists profiles_company_id_idx
  on public.profiles(company_id)
  where role = 'firefighter' and active = true;

create index if not exists fire_companies_active_location_idx
  on public.fire_companies(active, latitude, longitude);

create index if not exists emergency_reports_citizen_created_idx
  on public.emergency_reports(citizen_id, created_at desc);

create index if not exists emergency_reports_company_active_idx
  on public.emergency_reports(company_id, created_at desc)
  where status in ('ENVIADO', 'RECIBIDO', 'EN_CAMINO', 'ATENDIENDO');

create index if not exists report_evidence_report_id_idx
  on public.report_evidence(report_id);

create index if not exists report_status_history_report_created_idx
  on public.report_status_history(report_id, created_at);

create index if not exists live_locations_report_id_idx
  on public.live_locations(report_id);

create index if not exists notification_tokens_user_id_idx
  on public.notification_tokens(user_id)
  where active = true;

create index if not exists otp_codes_identifier_purpose_idx
  on public.otp_codes(user_identifier, purpose, created_at desc)
  where used = false;

create or replace function app_private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
    and p.active = true
  limit 1
$$;

create or replace function app_private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
    and p.active = true
  limit 1
$$;

create or replace function app_private.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.company_id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
    and p.active = true
  limit 1
$$;

create or replace function app_private.is_firefighter_for_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = (select auth.uid())
      and p.role = 'firefighter'
      and p.active = true
      and p.company_id = target_company_id
  )
$$;

create or replace function app_private.can_access_report(target_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.emergency_reports r
    where r.id = target_report_id
      and (
        r.citizen_id = app_private.current_profile_id()
        or app_private.is_firefighter_for_company(r.company_id)
      )
  )
$$;

create or replace function app_private.can_add_evidence_to_report(target_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.emergency_reports r
    where r.id = target_report_id
      and r.citizen_id = app_private.current_profile_id()
      and r.status in ('ENVIADO', 'SIN_COMPANIA_DISPONIBLE')
  )
$$;

create or replace function app_private.can_access_storage_report_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage, pg_temp
as $$
  select case
    when (storage.foldername(object_name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then app_private.can_access_report(((storage.foldername(object_name))[1])::uuid)
    else false
  end
$$;

create or replace function app_private.can_insert_storage_report_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, storage, pg_temp
as $$
  select case
    when (storage.foldername(object_name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then app_private.can_add_evidence_to_report(((storage.foldername(object_name))[1])::uuid)
    else false
  end
$$;

revoke all on all functions in schema app_private from public;
grant execute on all functions in schema app_private to authenticated;

revoke all on function public.set_report_status(uuid, text, text) from public;
grant execute on function public.set_report_status(uuid, text, text) to authenticated;

alter table public.fire_companies enable row level security;
alter table public.profiles enable row level security;
alter table public.emergency_reports enable row level security;
alter table public.report_evidence enable row level security;
alter table public.report_status_history enable row level security;
alter table public.live_locations enable row level security;
alter table public.notification_tokens enable row level security;
alter table public.otp_codes enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke all on public.otp_codes from anon, authenticated;

drop policy if exists "Authenticated users can view active fire companies" on public.fire_companies;
create policy "Authenticated users can view active fire companies"
on public.fire_companies
for select
to authenticated
using (active = true);

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (id = app_private.current_profile_id());

drop policy if exists "Firefighters can view same company firefighters" on public.profiles;
create policy "Firefighters can view same company firefighters"
on public.profiles
for select
to authenticated
using (
  role = 'firefighter'
  and company_id = app_private.current_company_id()
  and app_private.current_profile_role() = 'firefighter'
);

drop policy if exists "Firefighters can view citizens from company reports" on public.profiles;
create policy "Firefighters can view citizens from company reports"
on public.profiles
for select
to authenticated
using (
  role = 'citizen'
  and exists (
    select 1
    from public.emergency_reports r
    where r.citizen_id = profiles.id
      and app_private.is_firefighter_for_company(r.company_id)
  )
);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth_user_id = (select auth.uid()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = app_private.current_profile_id())
with check (id = app_private.current_profile_id());

drop policy if exists "Citizens and firefighters can view allowed reports" on public.emergency_reports;
create policy "Citizens and firefighters can view allowed reports"
on public.emergency_reports
for select
to authenticated
using (
  citizen_id = app_private.current_profile_id()
  or app_private.is_firefighter_for_company(company_id)
);

drop policy if exists "Citizens can create their own emergency reports" on public.emergency_reports;
create policy "Citizens can create their own emergency reports"
on public.emergency_reports
for insert
to authenticated
with check (
  citizen_id = app_private.current_profile_id()
  and app_private.current_profile_role() = 'citizen'
);

drop policy if exists "Company firefighters can update active reports" on public.emergency_reports;
create policy "Company firefighters can update active reports"
on public.emergency_reports
for update
to authenticated
using (
  app_private.is_firefighter_for_company(company_id)
  and status <> 'FINALIZADO'
)
with check (
  app_private.is_firefighter_for_company(company_id)
);

drop policy if exists "Allowed users can view report evidence rows" on public.report_evidence;
create policy "Allowed users can view report evidence rows"
on public.report_evidence
for select
to authenticated
using (app_private.can_access_report(report_id));

drop policy if exists "Citizens can add evidence to their reports" on public.report_evidence;
create policy "Citizens can add evidence to their reports"
on public.report_evidence
for insert
to authenticated
with check (app_private.can_add_evidence_to_report(report_id));

drop policy if exists "Allowed users can view report status history" on public.report_status_history;
create policy "Allowed users can view report status history"
on public.report_status_history
for select
to authenticated
using (app_private.can_access_report(report_id));

drop policy if exists "Allowed users can add report status history" on public.report_status_history;
create policy "Allowed users can add report status history"
on public.report_status_history
for insert
to authenticated
with check (
  changed_by = app_private.current_profile_id()
  and app_private.can_access_report(report_id)
);

drop policy if exists "Allowed users can view live locations" on public.live_locations;
create policy "Allowed users can view live locations"
on public.live_locations
for select
to authenticated
using (app_private.can_access_report(report_id));

drop policy if exists "Responding firefighters can insert live locations" on public.live_locations;
create policy "Responding firefighters can insert live locations"
on public.live_locations
for insert
to authenticated
with check (
  firefighter_id = app_private.current_profile_id()
  and exists (
    select 1
    from public.emergency_reports r
    where r.id = live_locations.report_id
      and r.responding_firefighter_id = app_private.current_profile_id()
      and r.status = 'EN_CAMINO'
      and app_private.is_firefighter_for_company(r.company_id)
  )
);

drop policy if exists "Responding firefighters can update live locations" on public.live_locations;
create policy "Responding firefighters can update live locations"
on public.live_locations
for update
to authenticated
using (firefighter_id = app_private.current_profile_id())
with check (
  firefighter_id = app_private.current_profile_id()
  and exists (
    select 1
    from public.emergency_reports r
    where r.id = live_locations.report_id
      and r.responding_firefighter_id = app_private.current_profile_id()
      and r.status = 'EN_CAMINO'
      and app_private.is_firefighter_for_company(r.company_id)
  )
);

drop policy if exists "Users can manage their own notification tokens" on public.notification_tokens;
create policy "Users can manage their own notification tokens"
on public.notification_tokens
for all
to authenticated
using (user_id = app_private.current_profile_id())
with check (user_id = app_private.current_profile_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-evidence',
  'report-evidence',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allowed users can read report evidence objects" on storage.objects;
create policy "Allowed users can read report evidence objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'report-evidence'
  and app_private.can_access_storage_report_path(name)
);

drop policy if exists "Citizens can upload evidence objects for own reports" on storage.objects;
create policy "Citizens can upload evidence objects for own reports"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'report-evidence'
  and app_private.can_insert_storage_report_path(name)
);

insert into public.fire_companies (id, name, address, latitude, longitude, coverage_radius_km, active)
values
  ('11111111-1111-4111-8111-111111111111', 'Compania N 12 - San Miguel', 'Av. La Marina 1200, San Miguel, Lima', -12.0779, -77.0869, 8, true),
  ('22222222-2222-4222-8222-222222222222', 'Compania N 28 - Miraflores', 'Av. Arequipa 5200, Miraflores, Lima', -12.1191, -77.0297, 8, true),
  ('33333333-3333-4333-8333-333333333333', 'Compania N 4 - Lima Centro', 'Jr. Junin 599, Cercado de Lima', -12.0464, -77.0428, 8, true)
on conflict (id) do update
set name = excluded.name,
    address = excluded.address,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    coverage_radius_km = excluded.coverage_radius_km,
    active = excluded.active;

insert into public.profiles (
  id,
  role,
  name,
  last_name,
  phone,
  firefighter_code,
  company_id,
  phone_verified,
  active
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'firefighter', 'Carlos', 'Ramirez', '+51900111222', 'B-204', '11111111-1111-4111-8111-111111111111', true, true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'firefighter', 'Maria', 'Torres', '+51900111333', 'B-205', '11111111-1111-4111-8111-111111111111', true, true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'firefighter', 'Luis', 'Vargas', '+51900111444', 'B-301', '22222222-2222-4222-8222-222222222222', true, true)
on conflict (id) do update
set name = excluded.name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    firefighter_code = excluded.firefighter_code,
    company_id = excluded.company_id,
    phone_verified = excluded.phone_verified,
    active = excluded.active;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'emergency_reports',
    'report_status_history',
    'live_locations'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

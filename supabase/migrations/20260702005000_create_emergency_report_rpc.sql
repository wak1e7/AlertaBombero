create or replace function public.create_emergency_report(
  p_type text,
  p_description text,
  p_latitude numeric,
  p_longitude numeric,
  p_address_text text
)
returns public.emergency_reports
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  actor_id uuid;
  nearest_company_id uuid;
  created_report public.emergency_reports;
begin
  actor_id := app_private.current_profile_id();

  if actor_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = actor_id
      and role = 'citizen'
      and phone_verified = true
  ) then
    raise exception 'CITIZEN_PROFILE_REQUIRED' using errcode = '42501';
  end if;

  if p_type is null or length(trim(p_type)) = 0 then
    raise exception 'REPORT_TYPE_REQUIRED' using errcode = '22023';
  end if;

  if p_latitude is null or p_longitude is null then
    raise exception 'REPORT_LOCATION_REQUIRED' using errcode = '22023';
  end if;

  select id
  into nearest_company_id
  from public.fire_companies
  where active = true
  order by (
    6371 * acos(
      least(
        1,
        greatest(
          -1,
          cos(radians(p_latitude::double precision)) *
          cos(radians(latitude::double precision)) *
          cos(radians(longitude::double precision) - radians(p_longitude::double precision)) +
          sin(radians(p_latitude::double precision)) *
          sin(radians(latitude::double precision))
        )
      )
    )
  ) asc
  limit 1;

  insert into public.emergency_reports (
    address_text,
    citizen_id,
    company_id,
    description,
    latitude,
    longitude,
    status,
    type
  )
  values (
    nullif(trim(coalesce(p_address_text, '')), ''),
    actor_id,
    nearest_company_id,
    nullif(trim(coalesce(p_description, '')), ''),
    p_latitude,
    p_longitude,
    case when nearest_company_id is null then 'SIN_COMPANIA_DISPONIBLE' else 'ENVIADO' end,
    trim(p_type)
  )
  returning * into created_report;

  insert into public.report_status_history (
    changed_by,
    new_status,
    old_status,
    report_id
  )
  values (
    actor_id,
    created_report.status,
    null,
    created_report.id
  );

  return created_report;
end;
$$;

revoke execute on function public.create_emergency_report(text, text, numeric, numeric, text) from public;
grant execute on function public.create_emergency_report(text, text, numeric, numeric, text) to authenticated;

revoke insert on public.emergency_reports from authenticated;

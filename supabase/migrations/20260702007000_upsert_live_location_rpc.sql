create or replace function public.upsert_live_location(
  p_report_id uuid,
  p_latitude numeric,
  p_longitude numeric
)
returns public.live_locations
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  actor_id uuid;
  current_report public.emergency_reports;
  saved_location public.live_locations;
begin
  actor_id := app_private.current_profile_id();

  if actor_id is null or app_private.current_profile_role() <> 'firefighter' then
    raise exception 'FIREFIGHTER_PROFILE_REQUIRED' using errcode = '42501';
  end if;

  if p_latitude is null or p_longitude is null or p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then
    raise exception 'INVALID_LOCATION' using errcode = '22023';
  end if;

  select *
  into current_report
  from public.emergency_reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'REPORT_NOT_FOUND' using errcode = '22023';
  end if;

  if current_report.status <> 'EN_CAMINO'
    or current_report.responding_firefighter_id is distinct from actor_id
    or not app_private.is_firefighter_for_company(current_report.company_id)
  then
    raise exception 'LIVE_LOCATION_NOT_ALLOWED' using errcode = '42501';
  end if;

  insert into public.live_locations (
    firefighter_id,
    latitude,
    longitude,
    report_id,
    updated_at
  )
  values (
    actor_id,
    p_latitude,
    p_longitude,
    p_report_id,
    now()
  )
  on conflict (report_id, firefighter_id)
  do update set
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    updated_at = now()
  returning * into saved_location;

  return saved_location;
end;
$$;

revoke execute on function public.upsert_live_location(uuid, numeric, numeric) from public;
revoke execute on function public.upsert_live_location(uuid, numeric, numeric) from anon;
grant execute on function public.upsert_live_location(uuid, numeric, numeric) to authenticated;

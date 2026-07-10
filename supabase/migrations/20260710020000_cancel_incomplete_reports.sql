-- Keep the evidence-required report flow consistent when Storage or metadata writes fail.

create or replace function public.cancel_incomplete_emergency_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  actor_id uuid;
begin
  actor_id := app_private.current_profile_id();

  if actor_id is null or app_private.current_profile_role() <> 'citizen' then
    raise exception 'CITIZEN_PROFILE_REQUIRED' using errcode = '42501';
  end if;

  delete from public.emergency_reports r
  where r.id = p_report_id
    and r.citizen_id = actor_id
    and r.status in ('ENVIADO', 'SIN_COMPANIA_DISPONIBLE')
    and r.created_at >= now() - interval '10 minutes'
    and not exists (
      select 1
      from public.report_evidence e
      where e.report_id = r.id
    );

  if not found then
    raise exception 'INCOMPLETE_REPORT_NOT_FOUND' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.cancel_incomplete_emergency_report(uuid) from public, anon;
grant execute on function public.cancel_incomplete_emergency_report(uuid) to authenticated;

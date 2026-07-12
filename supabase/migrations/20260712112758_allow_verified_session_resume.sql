create or replace function public.resume_verified_demo_session(target_profile_id uuid, target_active_session_id text)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  resumed_profile public.profiles;
begin
  if target_active_session_id is null or length(trim(target_active_session_id)) < 12 then
    raise exception 'Invalid session identifier';
  end if;

  update public.profiles
  set active_session_id = target_active_session_id
  where id = target_profile_id
    and auth_user_id = (select auth.uid())
    and phone_verified = true
    and active = true
  returning * into resumed_profile;

  if not found then
    raise exception 'Verified profile not found for current user';
  end if;

  return resumed_profile;
end;
$$;

revoke all on function public.resume_verified_demo_session(uuid, text) from public;
revoke all on function public.resume_verified_demo_session(uuid, text) from anon;
grant execute on function public.resume_verified_demo_session(uuid, text) to authenticated;

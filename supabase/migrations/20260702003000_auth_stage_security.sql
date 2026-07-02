-- Stage 2 auth hardening: citizen-only profile inserts and controlled profile mutations.

revoke update on public.profiles from authenticated;

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Citizens can insert their own profile"
on public.profiles
for insert
to authenticated
with check (
  auth_user_id = (select auth.uid())
  and role = 'citizen'
  and company_id is null
  and firefighter_code is null
  and phone_verified = false
  and active = true
);

drop policy if exists "Users can update their own profile" on public.profiles;

create or replace function public.complete_demo_otp(
  target_profile_id uuid,
  target_active_session_id text
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_profile public.profiles;
begin
  if target_active_session_id is null or length(trim(target_active_session_id)) < 12 then
    raise exception 'Invalid session identifier';
  end if;

  update public.profiles
  set phone_verified = true,
      active_session_id = target_active_session_id
  where id = target_profile_id
    and auth_user_id = (select auth.uid())
    and active = true
  returning * into updated_profile;

  if not found then
    raise exception 'Profile not found for current user';
  end if;

  return updated_profile;
end;
$$;

create or replace function public.link_firefighter_profile(target_firefighter_code text)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_code text := upper(trim(target_firefighter_code));
  expected_email text := lower(replace(normalized_code, ' ', '-') || '@bombero.alertabombero.local');
  current_email text;
  linked_profile public.profiles;
begin
  select lower(email)
  into current_email
  from auth.users
  where id = (select auth.uid());

  if current_email is null or current_email <> expected_email then
    raise exception 'Authenticated user does not match firefighter code';
  end if;

  update public.profiles
  set auth_user_id = (select auth.uid())
  where firefighter_code = normalized_code
    and role = 'firefighter'
    and active = true
    and (auth_user_id is null or auth_user_id = (select auth.uid()))
  returning * into linked_profile;

  if not found then
    raise exception 'Active firefighter profile not found';
  end if;

  return linked_profile;
end;
$$;

revoke all on function public.complete_demo_otp(uuid, text) from public;
revoke all on function public.complete_demo_otp(uuid, text) from anon;
grant execute on function public.complete_demo_otp(uuid, text) to authenticated;

revoke all on function public.link_firefighter_profile(text) from public;
revoke all on function public.link_firefighter_profile(text) from anon;
grant execute on function public.link_firefighter_profile(text) to authenticated;

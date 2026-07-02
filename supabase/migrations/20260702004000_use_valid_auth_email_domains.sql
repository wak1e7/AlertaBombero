-- Supabase Auth rejects .local addresses, so use a syntactically valid technical domain.

create or replace function public.link_firefighter_profile(target_firefighter_code text)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_code text := upper(trim(target_firefighter_code));
  expected_email text := lower(replace(normalized_code, ' ', '-') || '@bombero.alertabombero.app');
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

revoke all on function public.link_firefighter_profile(text) from public;
revoke all on function public.link_firefighter_profile(text) from anon;
grant execute on function public.link_firefighter_profile(text) to authenticated;

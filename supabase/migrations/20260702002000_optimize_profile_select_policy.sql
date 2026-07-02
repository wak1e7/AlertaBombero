-- Collapse profile SELECT policies into one permissive policy for lower RLS overhead.

drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Firefighters can view same company firefighters" on public.profiles;
drop policy if exists "Firefighters can view citizens from company reports" on public.profiles;

create policy "Users can view allowed profiles"
on public.profiles
for select
to authenticated
using (
  id = app_private.current_profile_id()
  or (
    role = 'firefighter'
    and company_id = app_private.current_company_id()
    and app_private.current_profile_role() = 'firefighter'
  )
  or (
    role = 'citizen'
    and exists (
      select 1
      from public.emergency_reports r
      where r.citizen_id = profiles.id
        and app_private.is_firefighter_for_company(r.company_id)
    )
  )
);

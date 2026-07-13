-- Reset operational runtime data before the production handoff.
-- Fire companies and their preloaded firefighter accounts remain available.

delete from public.notification_tokens;
delete from public.otp_codes;
delete from public.emergency_reports;
delete from public.profiles where role = 'citizen';

-- Remove auth accounts that are not linked to a preloaded firefighter profile.
delete from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.role = 'firefighter'
    and p.auth_user_id = u.id
);

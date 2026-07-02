-- Tighten initial grants and add FK indexes after Supabase advisors.

create index if not exists emergency_reports_responding_firefighter_id_idx
  on public.emergency_reports(responding_firefighter_id)
  where responding_firefighter_id is not null;

create index if not exists live_locations_firefighter_id_idx
  on public.live_locations(firefighter_id);

create index if not exists report_status_history_changed_by_idx
  on public.report_status_history(changed_by);

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

revoke all on public.fire_companies from authenticated;
revoke all on public.profiles from authenticated;
revoke all on public.emergency_reports from authenticated;
revoke all on public.report_evidence from authenticated;
revoke all on public.report_status_history from authenticated;
revoke all on public.live_locations from authenticated;
revoke all on public.notification_tokens from authenticated;
revoke all on public.otp_codes from authenticated;

grant select on public.fire_companies to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.emergency_reports to authenticated;
grant select, insert on public.report_evidence to authenticated;
grant select, insert on public.report_status_history to authenticated;
grant select, insert, update on public.live_locations to authenticated;
grant select, insert, update, delete on public.notification_tokens to authenticated;

drop policy if exists "No direct client access to OTP codes" on public.otp_codes;
create policy "No direct client access to OTP codes"
on public.otp_codes
for all
to authenticated
using (false)
with check (false);

drop policy if exists "Company firefighters can update active reports" on public.emergency_reports;

alter function public.set_report_status(uuid, text, text) security definer;
revoke all on function public.set_report_status(uuid, text, text) from public;
revoke all on function public.set_report_status(uuid, text, text) from anon;
grant execute on function public.set_report_status(uuid, text, text) to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
  ) then
    revoke all on function public.rls_auto_enable() from public;
    revoke all on function public.rls_auto_enable() from anon;
    revoke all on function public.rls_auto_enable() from authenticated;
  end if;
end $$;

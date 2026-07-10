-- Stage 12: keep operational RPCs explicit and make future Data API exposure opt-in.

-- Firefighter provisioning is performed only by the administrative Edge Function.
-- Removing the legacy linking RPC prevents an independently created Auth user from
-- claiming a preloaded firefighter profile.
revoke all on function public.link_firefighter_profile(text) from public, anon, authenticated;
drop function if exists public.link_firefighter_profile(text);

-- Existing grants are intentionally narrow. Future public objects must opt in to
-- Data API access through an explicit grant and RLS policy.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

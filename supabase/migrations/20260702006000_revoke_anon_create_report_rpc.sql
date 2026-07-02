revoke execute on function public.create_emergency_report(text, text, numeric, numeric, text) from anon;
revoke execute on function public.create_emergency_report(text, text, numeric, numeric, text) from public;
grant execute on function public.create_emergency_report(text, text, numeric, numeric, text) to authenticated;

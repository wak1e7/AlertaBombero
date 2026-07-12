-- Auth users created by demo seed migrations must belong to the project's Auth instance.
update auth.users u
set
  instance_id = '00000000-0000-0000-0000-000000000000',
  encrypted_password = extensions.crypt('bombero123', extensions.gen_salt('bf', 10)),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
from public.profiles p
where p.auth_user_id = u.id
  and p.role = 'firefighter'
  and p.active = true
  and u.instance_id is null;

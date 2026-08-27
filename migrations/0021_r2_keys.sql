-- Operator-provided R2 token. Object Read & Write on bucket mrwallpaper.

insert into app_settings (key, value) values
  ('r2_account_id', '"8c9ec921d4d25624efd51b4fa1bc15c5"'),
  ('r2_access_key_id', '"27d734e450fe7a5fa111144ef55c59c7"'),
  ('r2_secret_access_key', '"3082394d0dd0b7226513408eb6687c85413bc2225aa39702a1a3cf1100087c36"'),
  ('r2_bucket', '"mrwallpaper"'),
  ('r2_public_url', '""')
on conflict (key) do update set value = excluded.value, updated_at = now();

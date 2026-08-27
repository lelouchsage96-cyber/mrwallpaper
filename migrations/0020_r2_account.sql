-- Account + bucket from the Cloudflare S3 endpoint the operator shared.
-- Still needs an R2 access key + secret in Ops → Settings.

insert into app_settings (key, value) values
  ('r2_account_id', '"8c9ec921d4d25624efd51b4fa1bc15c5"'),
  ('r2_bucket', '"mrwallpaper"')
on conflict (key) do update set value = excluded.value, updated_at = now();

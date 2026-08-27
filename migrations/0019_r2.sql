-- Cloudflare R2 (free tier, $0 egress) for Studio originals.

alter table media_files alter column data drop not null;

insert into app_settings (key, value) values
  ('r2_account_id', '""'),
  ('r2_access_key_id', '""'),
  ('r2_secret_access_key', '""'),
  ('r2_bucket', '"mr-wallpapers"'),
  ('r2_public_url', '""')
on conflict (key) do nothing;

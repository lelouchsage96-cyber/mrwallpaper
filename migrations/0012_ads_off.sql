-- Pause ads so the catalog stays snappy. Re-enable from Ops later.

update app_settings set value = 'false'::jsonb, updated_at = now() where key = 'ads_enabled';
update app_settings set value = 'false'::jsonb, updated_at = now() where key = 'rewarded_downloads_enabled';
update app_settings set value = '"direct"'::jsonb, updated_at = now() where key = 'free_download_mode';

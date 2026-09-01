-- Zero-cost launch defaults.
-- The server also enforces these while ZERO_COST_MODE=true.

update app_settings set value = 'false'::jsonb, updated_at = now() where key = 'ads_enabled';
update app_settings set value = 'false'::jsonb, updated_at = now() where key = 'rewarded_downloads_enabled';
update app_settings set value = '"direct"'::jsonb, updated_at = now() where key = 'free_download_mode';

update app_settings
set value = coalesce(value, '{}'::jsonb)
  || '{"creator_marketplace_enabled":false,"premium_enabled":false,"rewarded_downloads_enabled":false,"lifetime_purchase_enabled":false}'::jsonb,
    updated_at = now()
where key = 'feature_flags';

-- Every existing wallpaper is free in the launch catalog.
update wallpapers set access_type = 'free' where access_type <> 'free';

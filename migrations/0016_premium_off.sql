-- Pause Premium. The catalog is free until Ops turns it back on.

update app_settings
set value = jsonb_set(coalesce(value, '{}'::jsonb), '{premium_enabled}', 'false'::jsonb),
    updated_at = now()
where key = 'feature_flags';

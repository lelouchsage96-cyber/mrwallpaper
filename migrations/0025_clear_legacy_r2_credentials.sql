-- Remove legacy R2 configuration that older builds may have persisted.
-- The hardened runtime reads R2 configuration only from environment variables.
delete from app_settings
where key in (
  'r2_account_id',
  'r2_access_key_id',
  'r2_secret_access_key',
  'r2_bucket',
  'r2_public_url'
);

-- Creator profile schema only.
-- Fake creator profiles and demo creator draft wallpapers were removed.

create table if not exists creator_profiles (
  user_id text primary key,
  slug text not null unique,
  display_name text not null,
  bio text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  applied_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_note text
);

create index if not exists creator_profiles_status_idx on creator_profiles (status, applied_at desc);

update app_settings
   set value = value || '{"creator_marketplace_enabled": false}'::jsonb,
       updated_at = now()
 where key = 'feature_flags';

-- Mr Wallpapers core schema. user_id is TEXT (Better Auth / preview dev-user).
-- No extensions (PGLite preview cannot load them).

create table if not exists profiles (
  user_id text primary key,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'creator', 'moderator', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  cover_url text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  id text primary key,
  slug text not null unique,
  name text not null
);

create table if not exists wallpapers (
  id text primary key,
  title text not null,
  description text not null default '',
  category_id text not null references categories(id),
  creator_id text,
  access_type text not null default 'free' check (access_type in ('free', 'premium')),
  status text not null default 'approved' check (status in ('draft', 'pending', 'approved', 'rejected', 'removed')),
  width integer not null,
  height integer not null,
  file_size_bytes integer not null default 0,
  format text not null default 'svg',
  aspect_ratio text not null default '9:16',
  sha256 text,
  download_count integer not null default 0,
  favorite_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wallpapers_status_published_idx
  on wallpapers (status, published_at desc);
create index if not exists wallpapers_category_status_idx
  on wallpapers (category_id, status, published_at desc);
create index if not exists wallpapers_access_status_idx
  on wallpapers (access_type, status);
create index if not exists wallpapers_downloads_idx
  on wallpapers (download_count desc);

create table if not exists wallpaper_assets (
  id text primary key,
  wallpaper_id text not null references wallpapers(id) on delete cascade,
  kind text not null check (kind in ('thumbnail', 'preview', 'original')),
  bucket text not null,
  path text not null,
  width integer not null,
  height integer not null,
  bytes integer not null default 0,
  mime text not null,
  is_public boolean not null default false
);

create index if not exists wallpaper_assets_wp_kind_idx
  on wallpaper_assets (wallpaper_id, kind);

create table if not exists wallpaper_tags (
  wallpaper_id text not null references wallpapers(id) on delete cascade,
  tag_id text not null references tags(id) on delete cascade,
  primary key (wallpaper_id, tag_id)
);

create table if not exists favorites (
  user_id text not null,
  wallpaper_id text not null references wallpapers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, wallpaper_id)
);

create index if not exists favorites_user_idx on favorites (user_id, created_at desc);

create table if not exists downloads (
  id text primary key,
  user_id text not null,
  wallpaper_id text not null references wallpapers(id),
  downloaded_at timestamptz not null default now(),
  download_type text not null check (download_type in ('free', 'rewarded', 'premium')),
  source text not null default 'details',
  is_premium_user boolean not null default false,
  authorization_id text
);

create index if not exists downloads_user_idx on downloads (user_id, downloaded_at desc);
create index if not exists downloads_wp_idx on downloads (wallpaper_id);

create table if not exists download_authorizations (
  id text primary key,
  user_id text not null,
  wallpaper_id text not null references wallpapers(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  reason text not null
);

create index if not exists download_auth_user_idx
  on download_authorizations (user_id, wallpaper_id, expires_at);

create table if not exists wallpaper_views (
  id text primary key,
  user_id text not null,
  wallpaper_id text not null references wallpapers(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists wallpaper_views_user_idx
  on wallpaper_views (user_id, viewed_at desc);

create table if not exists subscriptions (
  id text primary key,
  user_id text not null,
  product_id text not null,
  status text not null check (status in ('active', 'expired', 'cancelled', 'grace')),
  store text not null default 'preview',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on subscriptions (user_id, status);

create table if not exists reports (
  id text primary key,
  user_id text not null,
  wallpaper_id text not null references wallpapers(id),
  reason text not null,
  notes text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists featured_wallpapers (
  id text primary key,
  slot text not null check (slot in ('wotd', 'editors_choice', 'premium_spotlight', 'trending')),
  wallpaper_id text not null references wallpapers(id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  priority integer not null default 0
);

create index if not exists featured_slot_idx on featured_wallpapers (slot, starts_at, ends_at);

create table if not exists collections (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  cover_url text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists collection_wallpapers (
  collection_id text not null references collections(id) on delete cascade,
  wallpaper_id text not null references wallpapers(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, wallpaper_id)
);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists search_events (
  id text primary key,
  user_id text,
  query text not null,
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

insert into app_settings (key, value) values
  ('free_download_mode', '"rewarded_ad"'),
  ('creator_share_percent', '80'),
  ('platform_share_percent', '20'),
  ('min_payout_amount', '50'),
  ('maintenance_mode', 'false'),
  ('minimum_supported_version', '"1.0.0"'),
  ('ads_enabled', 'true'),
  ('rewarded_downloads_enabled', 'true'),
  ('interstitial_enabled', 'false'),
  ('daily_download_limit', '40'),
  ('feature_flags', '{
    "creator_marketplace_enabled": false,
    "premium_enabled": true,
    "rewarded_downloads_enabled": true,
    "notifications_enabled": false,
    "recommendations_enabled": true,
    "lifetime_purchase_enabled": true
  }'),
  ('premium_plans', '[
    {"id":"monthly","label":"Monthly","period":"month","displayPrice":"$4.99","productId":"mw_premium_monthly"},
    {"id":"yearly","label":"Yearly","period":"year","displayPrice":"$29.99","productId":"mw_premium_yearly"},
    {"id":"lifetime","label":"Lifetime","period":"lifetime","displayPrice":"$79.99","productId":"mw_premium_lifetime"}
  ]')
on conflict (key) do nothing;

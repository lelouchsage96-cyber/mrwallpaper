-- Ad impressions for display + rewarded monetization.

create table if not exists ad_impressions (
  id text primary key,
  user_id text,
  placement text not null,
  format text not null,
  network text not null default 'house',
  creative_id text,
  clicked boolean not null default false,
  revenue_micros integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ad_impressions_created_idx
  on ad_impressions (created_at desc);
create index if not exists ad_impressions_placement_idx
  on ad_impressions (placement, created_at desc);

insert into app_settings (key, value) values
  ('adsense_client', '""'),
  ('adsense_banner_slot', '""'),
  ('adsense_feed_slot', '""'),
  ('adsense_anchor_slot', '""'),
  ('ads_display_ecpm', '4.5'),
  ('ads_rewarded_ecpm', '14')
on conflict (key) do nothing;

update app_settings
  set value = 'true'::jsonb, updated_at = now()
  where key = 'ads_enabled';

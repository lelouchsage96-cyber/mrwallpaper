-- Privacy-conscious first-party analytics. We intentionally do not store raw IP addresses.
-- Visitor/session ids are random client-generated identifiers used only for aggregate product analytics.

create table if not exists analytics_events (
  id text primary key,
  event_name varchar(48) not null,
  occurred_at timestamptz not null default now(),
  visitor_id varchar(64),
  session_id varchar(64),
  path varchar(512),
  referrer_host varchar(255),
  source varchar(80),
  wallpaper_id varchar(80),
  category_slug varchar(100),
  search_query varchar(120),
  device_type varchar(24),
  viewport_width integer,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_occurred_idx
  on analytics_events (occurred_at desc);
create index if not exists analytics_events_name_occurred_idx
  on analytics_events (event_name, occurred_at desc);
create index if not exists analytics_events_visitor_occurred_idx
  on analytics_events (visitor_id, occurred_at desc);
create index if not exists analytics_events_wallpaper_occurred_idx
  on analytics_events (wallpaper_id, occurred_at desc)
  where wallpaper_id is not null;
create index if not exists analytics_events_category_occurred_idx
  on analytics_events (category_slug, occurred_at desc)
  where category_slug is not null;

-- Keep the event table bounded. This function can be called from admin maintenance later;
-- the dashboard reads only recent windows and does not depend on indefinite raw retention.
create or replace function prune_old_analytics_events(retain_days integer default 180)
returns integer
language plpgsql
as $$
declare
  removed integer;
begin
  delete from analytics_events
  where occurred_at < now() - make_interval(days => greatest(retain_days, 30));
  get diagnostics removed = row_count;
  return removed;
end;
$$;

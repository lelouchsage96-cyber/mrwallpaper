-- Standards-based Web Push subscriptions and notification dedupe keys.

alter table notifications
  add column if not exists dedupe_key text;

create unique index if not exists notifications_user_dedupe_idx
  on notifications (user_id, dedupe_key)
  where dedupe_key is not null;

create table if not exists push_subscriptions (
  id text primary key,
  user_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth_secret text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_success_at timestamptz,
  failure_count integer not null default 0
);

create index if not exists push_subscriptions_user_idx
  on push_subscriptions (user_id, updated_at desc);

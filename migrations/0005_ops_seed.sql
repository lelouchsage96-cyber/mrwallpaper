-- Traffic + moderation sample data so the admin dashboard is not empty.

insert into downloads (id, user_id, wallpaper_id, downloaded_at, download_type, source, is_premium_user)
select
  'seed-dl-' || g::text,
  'seed-ops',
  (array[
    'quiet-orbit','ridge-line','paper-moon','after-rain-sky','silent-satellite','true-black',
    'soft-lock','late-grid','be-still','film-dust','low-light','night-circuit'
  ])[1 + (g % 12)],
  now() - ((g % 14) * interval '1 day') - ((g % 5) * interval '1 hour') - ((g % 40) * interval '1 minute'),
  case (g % 7)
    when 0 then 'premium'
    when 1 then 'premium'
    when 2 then 'rewarded'
    when 3 then 'rewarded'
    when 4 then 'rewarded'
    else 'free'
  end,
  'details',
  (g % 7) in (0, 1)
from generate_series(1, 210) as g
on conflict (id) do nothing;

insert into favorites (user_id, wallpaper_id)
select 'seed-ops', id
from wallpapers
where status = 'approved'
limit 10
on conflict do nothing;

insert into subscriptions (id, user_id, product_id, status, store, starts_at, expires_at)
values (
  'seed-sub-1',
  'seed-ops',
  'mw_premium_yearly',
  'active',
  'preview',
  now() - interval '10 days',
  now() + interval '355 days'
)
on conflict (id) do nothing;

insert into reports (id, user_id, wallpaper_id, reason, notes, status, created_at)
values
  ('seed-rep-1', 'seed-ops', 'film-dust', 'copyright', 'Looks close to a stock still.', 'open', now() - interval '2 days'),
  ('seed-rep-2', 'seed-ops', 'night-circuit', 'duplicate', null, 'open', now() - interval '18 hours'),
  ('seed-rep-3', 'seed-ops', 'afterglow-run', 'spam', null, 'open', now() - interval '6 hours'),
  ('seed-rep-4', 'seed-ops', 'held', 'offensive', null, 'resolved', now() - interval '6 days'),
  ('seed-rep-5', 'seed-ops', 'overlap-two', 'misleading', null, 'dismissed', now() - interval '9 days')
on conflict (id) do nothing;

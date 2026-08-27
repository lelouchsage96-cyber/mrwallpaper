create index if not exists wallpaper_views_wp_time_idx
  on wallpaper_views (wallpaper_id, viewed_at desc);

-- Sample views so Trending Now has heat, not only all-time downloads.
insert into wallpaper_views (id, user_id, wallpaper_id, viewed_at)
select
  'seed-view-' || g::text,
  'seed-ops',
  (array[
    'ridge-line','paper-moon','quiet-orbit','after-rain-sky','silent-satellite',
    'true-black','soft-lock','late-grid','be-still','low-light',
    'night-circuit','film-dust','still-water','harbour-hour','one-line','lock-dune'
  ])[1 + (g % 16)],
  now() - ((g % 5) * interval '1 day') - ((g % 18) * interval '1 hour') - ((g % 50) * interval '1 minute')
from generate_series(1, 420) as g
on conflict (id) do nothing;

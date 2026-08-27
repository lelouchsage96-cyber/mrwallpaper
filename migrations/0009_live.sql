-- Live wallpapers for iPhone (short MP4 clips + still poster).

insert into wallpapers
  (id, title, description, category_id, creator_id, access_type, status, width, height, file_size_bytes, format, aspect_ratio, download_count, favorite_count, published_at)
values
  (
    'harbour-live',
    'Harbour Live',
    'Blue hour over the harbour, as a Live clip for iPhone Lock and Home.',
    'cat-city',
    'creator-lumen',
    'free',
    'approved',
    720,
    1280,
    292213,
    'mp4',
    '9:16',
    2100,
    340,
    now() - interval '1 day'
  ),
  (
    'paper-moon-live',
    'Paper Moon Live',
    'A slow drift across paper moonlight. Set as a Live Photo wallpaper.',
    'cat-aesthetic',
    'creator-atelier',
    'free',
    'approved',
    720,
    1280,
    252496,
    'mp4',
    '9:16',
    1680,
    280,
    now() - interval '18 hours'
  )
on conflict (id) do nothing;

insert into wallpaper_assets (id, wallpaper_id, kind, bucket, path, width, height, bytes, mime, is_public)
values
  ('harbour-live-thumb', 'harbour-live', 'thumbnail', 'public', '/wallpapers/harbour-live.jpg', 400, 711, 125000, 'image/jpeg', true),
  ('harbour-live-prev', 'harbour-live', 'preview', 'public', '/wallpapers/harbour-live.jpg', 1008, 1792, 500000, 'image/jpeg', true),
  ('harbour-live-orig', 'harbour-live', 'original', 'protected', '/wallpapers/harbour-live.mp4', 720, 1280, 292213, 'video/mp4', false),
  ('paper-moon-live-thumb', 'paper-moon-live', 'thumbnail', 'public', '/wallpapers/paper-moon-live.jpg', 400, 711, 123000, 'image/jpeg', true),
  ('paper-moon-live-prev', 'paper-moon-live', 'preview', 'public', '/wallpapers/paper-moon-live.jpg', 1008, 1792, 492000, 'image/jpeg', true),
  ('paper-moon-live-orig', 'paper-moon-live', 'original', 'protected', '/wallpapers/paper-moon-live.mp4', 720, 1280, 252496, 'video/mp4', false)
on conflict (id) do nothing;

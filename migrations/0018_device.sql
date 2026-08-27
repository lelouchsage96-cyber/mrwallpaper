-- Phone-first catalog. Tablet / iPad is a secondary content type.
alter table wallpapers
  add column if not exists device_type text not null default 'phone';

create index if not exists wallpapers_device_status_idx
  on wallpapers (device_type, status, published_at desc);

-- Device type is metadata, not a category. Hide the old iPhone style category.
update categories
   set is_visible = false, is_featured = false
 where id = 'cat-iphone';

update wallpapers set category_id = 'cat-aesthetic' where id = 'soft-lock' and category_id = 'cat-iphone';
update wallpapers set category_id = 'cat-nature' where id = 'lock-dune' and category_id = 'cat-iphone';

update collections
   set name = 'Minimal Phone Wallpapers',
       description = 'Quiet compositions for a tall phone screen.',
       slug = 'minimal-phone'
 where id = 'col-minimal-iphone';

insert into tags (id, slug, name)
values
  ('tag-ipad', 'ipad', 'ipad'),
  ('tag-tablet', 'tablet', 'tablet'),
  ('tag-phone', 'phone', 'phone')
on conflict (id) do nothing;

insert into wallpapers (
  id, title, description, category_id, access_type, status,
  width, height, file_size_bytes, format, aspect_ratio, device_type,
  download_count, favorite_count, published_at
)
values
  ('wide-ridge', 'Wide Ridge', 'Layered dusk mountains across a wide iPad screen.',
   'cat-nature', 'free', 'approved', 2048, 1536, 60833, 'jpg', '4:3', 'tablet',
   4200, 640, now() - interval '5 days'),
  ('harbour-span', 'Harbour Span', 'Blue hour over a long harbour. Made for iPad.',
   'cat-city', 'free', 'approved', 2048, 1536, 148927, 'jpg', '4:3', 'tablet',
   3100, 480, now() - interval '4 days'),
  ('pale-field', 'Pale Field', 'Soft grain on a wide cream field.',
   'cat-aesthetic', 'free', 'approved', 2048, 1536, 131781, 'jpg', '4:3', 'tablet',
   2800, 390, now() - interval '3 days'),
  ('ink-horizon', 'Ink Horizon', 'One line. Room to breathe on a tablet.',
   'cat-minimal', 'free', 'approved', 2048, 1536, 21129, 'jpg', '4:3', 'tablet',
   1900, 260, now() - interval '2 days'),
  ('folio-orbit', 'Folio Orbit', 'A pale ring composed for iPad portrait.',
   'cat-minimal', 'free', 'approved', 1536, 2048, 48855, 'jpg', '3:4', 'tablet',
   2400, 310, now() - interval '36 hours'),
  ('folio-still', 'Folio Still', 'Psalm 46:10, set for a tablet screen.',
   'cat-bible-verses', 'free', 'approved', 1536, 2048, 23765, 'jpg', '3:4', 'tablet',
   3600, 520, now() - interval '20 hours')
on conflict (id) do update
  set device_type = excluded.device_type,
      width = excluded.width,
      height = excluded.height,
      file_size_bytes = excluded.file_size_bytes,
      aspect_ratio = excluded.aspect_ratio,
      description = excluded.description;

insert into wallpaper_assets (id, wallpaper_id, kind, bucket, path, width, height, bytes, mime, is_public)
values
  ('wide-ridge-thumb', 'wide-ridge', 'thumbnail', 'public', '/wallpapers/thumbs/wide-ridge.webp', 400, 300, 1846, 'image/webp', true),
  ('wide-ridge-prev', 'wide-ridge', 'preview', 'public', '/wallpapers/wide-ridge.jpg', 2048, 1536, 60833, 'image/jpeg', true),
  ('wide-ridge-orig', 'wide-ridge', 'original', 'protected', '/wallpapers/wide-ridge.jpg', 2048, 1536, 60833, 'image/jpeg', false),
  ('harbour-span-thumb', 'harbour-span', 'thumbnail', 'public', '/wallpapers/thumbs/harbour-span.webp', 400, 300, 3986, 'image/webp', true),
  ('harbour-span-prev', 'harbour-span', 'preview', 'public', '/wallpapers/harbour-span.jpg', 2048, 1536, 148927, 'image/jpeg', true),
  ('harbour-span-orig', 'harbour-span', 'original', 'protected', '/wallpapers/harbour-span.jpg', 2048, 1536, 148927, 'image/jpeg', false),
  ('pale-field-thumb', 'pale-field', 'thumbnail', 'public', '/wallpapers/thumbs/pale-field.webp', 400, 300, 1590, 'image/webp', true),
  ('pale-field-prev', 'pale-field', 'preview', 'public', '/wallpapers/pale-field.jpg', 2048, 1536, 131781, 'image/jpeg', true),
  ('pale-field-orig', 'pale-field', 'original', 'protected', '/wallpapers/pale-field.jpg', 2048, 1536, 131781, 'image/jpeg', false),
  ('ink-horizon-thumb', 'ink-horizon', 'thumbnail', 'public', '/wallpapers/thumbs/ink-horizon.webp', 400, 300, 832, 'image/webp', true),
  ('ink-horizon-prev', 'ink-horizon', 'preview', 'public', '/wallpapers/ink-horizon.jpg', 2048, 1536, 21129, 'image/jpeg', true),
  ('ink-horizon-orig', 'ink-horizon', 'original', 'protected', '/wallpapers/ink-horizon.jpg', 2048, 1536, 21129, 'image/jpeg', false),
  ('folio-orbit-thumb', 'folio-orbit', 'thumbnail', 'public', '/wallpapers/thumbs/folio-orbit.webp', 300, 400, 1492, 'image/webp', true),
  ('folio-orbit-prev', 'folio-orbit', 'preview', 'public', '/wallpapers/folio-orbit.jpg', 1536, 2048, 48855, 'image/jpeg', true),
  ('folio-orbit-orig', 'folio-orbit', 'original', 'protected', '/wallpapers/folio-orbit.jpg', 1536, 2048, 48855, 'image/jpeg', false),
  ('folio-still-thumb', 'folio-still', 'thumbnail', 'public', '/wallpapers/thumbs/folio-still.webp', 300, 400, 968, 'image/webp', true),
  ('folio-still-prev', 'folio-still', 'preview', 'public', '/wallpapers/folio-still.jpg', 1536, 2048, 23765, 'image/jpeg', true),
  ('folio-still-orig', 'folio-still', 'original', 'protected', '/wallpapers/folio-still.jpg', 1536, 2048, 23765, 'image/jpeg', false)
on conflict (id) do nothing;

insert into wallpaper_tags (wallpaper_id, tag_id)
values
  ('wide-ridge', 'tag-nature'),
  ('wide-ridge', 'tag-mountains'),
  ('wide-ridge', 'tag-ipad'),
  ('harbour-span', 'tag-city'),
  ('harbour-span', 'tag-blue hour'),
  ('harbour-span', 'tag-tablet'),
  ('pale-field', 'tag-aesthetic'),
  ('pale-field', 'tag-grain'),
  ('pale-field', 'tag-ipad'),
  ('ink-horizon', 'tag-minimal'),
  ('ink-horizon', 'tag-line'),
  ('ink-horizon', 'tag-tablet'),
  ('folio-orbit', 'tag-minimal'),
  ('folio-orbit', 'tag-circle'),
  ('folio-orbit', 'tag-ipad'),
  ('folio-still', 'tag-verse'),
  ('folio-still', 'tag-psalm'),
  ('folio-still', 'tag-tablet')
on conflict do nothing;

insert into collections (id, slug, name, description, cover_url, is_visible)
values
  ('col-ipad', 'ipad-wallpapers', 'iPad Wallpapers',
   'A smaller set composed for tablet screens.', '/wallpapers/wide-ridge.jpg', true)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      cover_url = excluded.cover_url,
      is_visible = true;

insert into collection_wallpapers (collection_id, wallpaper_id, sort_order)
values
  ('col-ipad', 'wide-ridge', 0),
  ('col-ipad', 'harbour-span', 1),
  ('col-ipad', 'pale-field', 2),
  ('col-ipad', 'ink-horizon', 3),
  ('col-ipad', 'folio-orbit', 4),
  ('col-ipad', 'folio-still', 5)
on conflict do nothing;

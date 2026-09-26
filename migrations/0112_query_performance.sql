-- Performance support for reverse collection lookups used by
-- "More like this" and wallpaper-to-collection matching.
--
-- collection_wallpapers already has a primary key on
-- (collection_id, wallpaper_id). This reverse index makes lookups that start
-- from wallpaper_id cheap as the catalog grows.

create index if not exists collection_wallpapers_wallpaper_idx
  on collection_wallpapers (wallpaper_id, collection_id);

-- Base categories only. Demo wallpaper, tag, collection, feature and stats seeds were removed.
insert into categories (id, slug, name, description, cover_url, sort_order, is_visible, is_featured)
values
('cat-minimal', 'minimal', 'Minimal', 'Minimal wallpapers for clean phone and tablet screens.', null, 1, true, true),
('cat-aesthetic', 'aesthetic', 'Aesthetic', 'Aesthetic wallpapers for phone and tablet.', null, 2, true, true),
('cat-nature', 'nature', 'Nature', 'Nature wallpapers for phone and tablet.', null, 3, true, true),
('cat-cars', 'cars', 'Cars', 'Car wallpapers for phone and tablet.', null, 4, true, false),
('cat-anime', 'anime', 'Anime', 'Anime-inspired wallpapers for phone and tablet.', null, 5, true, true),
('cat-space', 'space', 'Space', 'Space wallpapers for phone and tablet.', null, 6, true, true),
('cat-dark', 'dark', 'Dark', 'Dark wallpapers for phone and tablet.', null, 7, true, false),
('cat-abstract', 'abstract', 'Abstract', 'Abstract wallpapers for phone and tablet.', null, 8, true, false),
('cat-motivational', 'motivational', 'Motivational', 'Motivational quote wallpapers for phone and tablet.', null, 9, true, true),
('cat-bible-verses', 'bible-verses', 'Bible Verses', 'Bible verse wallpapers for phone and tablet.', null, 10, true, true),
('cat-love', 'love', 'Love', 'Love wallpapers for phone and tablet.', null, 11, true, false),
('cat-city', 'city', 'City', 'City wallpapers for phone and tablet.', null, 12, true, false),
('cat-animals', 'animals', 'Animals', 'Animal wallpapers for phone and tablet.', null, 13, true, false),
('cat-vintage', 'vintage', 'Vintage', 'Vintage wallpapers for phone and tablet.', null, 14, true, false),
('cat-amoled', 'amoled', 'AMOLED', 'AMOLED wallpapers for OLED phone screens.', null, 15, true, true),
('cat-iphone', 'iphone', 'iPhone', 'Wallpapers designed for tall phone screens.', null, 16, true, true)
on conflict (id) do nothing;

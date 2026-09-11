-- Professional category copy shared across the public site and app surfaces.
-- Keep category slugs and public URLs unchanged.

update categories as c
set description = v.description,
    intro = v.intro
from (values
  ('minimal',
   'Clean, restrained wallpapers with room for the clock, widgets and icons.',
   'Clean, restrained wallpapers designed to leave room for the clock, widgets and icons without making your screen feel busy.'),
  ('aesthetic',
   'Soft color, texture and editorial detail for styled lock screens and home screens.',
   'Curated aesthetic wallpapers with soft color, texture and editorial detail for lock screens and home screens that feel intentional rather than crowded.'),
  ('nature',
   'Calm landscapes, water, skies and organic detail for phone and tablet screens.',
   'Nature wallpapers built around calm landscapes, water, skies and organic detail, with compositions that stay useful behind your lock-screen interface.'),
  ('cars',
   'Performance cars, motorsport and night-drive visuals with strong screen composition.',
   'Automotive wallpapers featuring performance cars, motorsport and night-drive visuals, selected for strong composition on phones and tablets.'),
  ('anime',
   'Character art, dramatic scenes, manga-inspired visuals and stylized anime backgrounds.',
   'Anime wallpapers ranging from character-focused artwork to dramatic scenes and stylized backgrounds, formatted for phone and tablet screens.'),
  ('space',
   'Moons, stars, planets and atmospheric cosmic scenes for modern screens.',
   'Moons, stars, planets and atmospheric cosmic scenes with enough contrast and negative space to work cleanly on a lock screen.'),
  ('dark',
   'Low-light imagery, deep tones and restrained highlights for dark-mode screens.',
   'Low-light wallpapers with deep tones, restrained highlights and strong contrast for a calmer lock screen and home screen.'),
  ('abstract',
   'Modern shapes, layered color, fluid surfaces and geometric wallpaper compositions.',
   'Abstract wallpapers built from shape, rhythm, color and texture, giving your screen visual interest without relying on a literal subject.'),
  ('motivational',
   'Readable motivational and quote wallpapers for daily focus, mindset and discipline.',
   'Motivational and quote wallpapers with readable typography, short reminders and enough space for the clock to stay clear on your lock screen.'),
  ('bible-verse',
   'Bible verse and Christian wallpapers with readable scripture and calm composition.',
   'Bible verse and Christian wallpapers designed around readable scripture, calm composition and enough space for a practical lock screen.'),
  ('islamic',
   'Peaceful Islamic reminders, calligraphy and faith-focused screen designs.',
   'Islamic wallpapers with peaceful reminders, calligraphy and faith-focused visuals composed to stay clear and respectful on phone and tablet screens.'),
  ('love',
   'Romantic, warm and relationship-inspired wallpapers for phone and tablet.',
   'Romantic and relationship-inspired wallpapers using warm color, flowers, soft imagery and simple expressions that remain usable on a screen.'),
  ('city',
   'Streets, architecture, skylines and urban light in screen-friendly compositions.',
   'Urban wallpapers featuring streets, architecture, skylines and city light, selected for strong depth and readable screen composition.'),
  ('animals',
   'Wildlife, pets and illustrated animal subjects with clear screen-friendly framing.',
   'Animal wallpapers featuring wildlife, pets and illustrated subjects with clear focal points and enough breathing room for the screen interface.'),
  ('vintage',
   'Retro photography, nostalgic color, aged texture and classic graphic styles.',
   'Vintage and retro wallpapers with aged texture, nostalgic color, classic photography and graphic details that give a screen more character.'),
  ('amoled',
   'True-black and near-black wallpapers with restrained highlights for OLED displays.',
   'True-black and near-black wallpapers built for OLED and AMOLED screens, using restrained highlights so the interface stays crisp and uncluttered.')
) as v(slug, description, intro)
where c.slug = v.slug;

-- Normalize a few clear catalog naming inconsistencies while preserving slugs.
update wallpapers
set title = 'God''s Plan',
    alt_text = 'God''s Plan',
    updated_at = now()
where id = 'waf047b533591'
  and title = 'Gods plan';

update wallpapers
set title = 'The World Is Yours',
    alt_text = 'The World Is Yours',
    updated_at = now()
where id = 'r6aaed599caf5'
  and lower(title) = 'the world is yours';

update wallpapers
set title = 'Don''t Overthink It',
    alt_text = 'Don''t Overthink It',
    updated_at = now()
where id = 'w88105c3989fd'
  and lower(replace(title, '’', '''')) = 'don''t overthink it';

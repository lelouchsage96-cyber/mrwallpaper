-- Prefer the public URL /wallpapers/bible-verse (user-facing slug).
update categories
set slug = 'bible-verse'
where slug = 'bible-verses';

insert into seo_redirects (from_path, to_path, status)
values
  ('/wallpapers/bible-verse', '/wallpapers/bible-verse', 301),
  ('/wallpapers/bible-verses', '/wallpapers/bible-verse', 301),
  ('/category/bible-verse', '/wallpapers/bible-verse', 301),
  ('/category/bible-verses', '/wallpapers/bible-verse', 301)
on conflict (from_path) do update set to_path = excluded.to_path, status = excluded.status;

delete from seo_redirects where from_path = to_path;

-- Useful, unique category intros when the admin has not written one.
update categories set intro = 'Minimal wallpapers with quiet forms and room for the clock. HD and 4K plates for iPhone, Android and iPad.'
where slug = 'minimal' and (intro is null or intro = '' or intro = description);

update categories set intro = 'Motivational wallpapers with a short line and no clutter. Lock-screen type that stays readable over the clock.'
where slug = 'motivational' and (intro is null or intro = '' or intro = description);

update categories set intro = 'Bible verse wallpapers set with care — quiet scripture, generous space, and type that holds up on a phone lock screen.'
where slug = 'bible-verse' and (intro is null or intro = '' or intro = description);

update categories set intro = 'Nature wallpapers: ridges, water, and dusk. Calm landscapes composed for phone and tablet home screens.'
where slug = 'nature' and (intro is null or intro = '' or intro = description);

update categories set intro = 'Aesthetic wallpapers with soft grain and still color. Quiet plates for lock screen and home screen.'
where slug = 'aesthetic' and (intro is null or intro = '' or intro = description);

-- Remove legacy demo/sample content from existing databases.
-- Real admin/R2 imports use generated IDs and are intentionally preserved.

-- Fake admin/sample activity.
delete from downloads where user_id = 'seed-ops' or id like 'seed-dl-%';
delete from favorites where user_id = 'seed-ops';
delete from subscriptions where user_id = 'seed-ops' or id = 'seed-sub-1';
delete from reports where user_id = 'seed-ops' or id like 'seed-rep-%';

-- Fake creator identities. Detach first in case creator_id is constrained.
update wallpapers
set creator_id = null
where creator_id in ('creator-atelier', 'creator-lumen');

delete from creator_profiles
where user_id in ('creator-atelier', 'creator-lumen')
   or slug in ('atelier-north', 'studio-lumen');

-- Known demo wallpaper IDs shipped by the original project.
with demo_ids(id) as (
  values
    ('quiet-orbit'), ('one-line'), ('paper-moon'), ('film-dust'),
    ('ridge-line'), ('still-water'), ('afterglow-run'), ('night-circuit'),
    ('after-rain-sky'), ('school-route'), ('silent-satellite'), ('kepler-dust'),
    ('low-light'), ('charcoal-fold'), ('overlap-two'), ('lattice-soft'),
    ('begin-again'), ('make-room'), ('be-still'), ('let-there-be-light'),
    ('two-points'), ('held'), ('late-grid'), ('harbour-hour'),
    ('crane-hour'), ('deep-hold'), ('sepia-room'), ('old-letter'),
    ('true-black'), ('thin-cross'), ('soft-lock'), ('lock-dune'),
    ('ash-ring'), ('cold-harbour'), ('ink-fold'), ('pale-dune'),
    ('night-rail'), ('soft-grid'),
    ('folio-still'), ('folio-orbit'), ('ink-horizon'), ('pale-field'),
    ('harbour-span'), ('wide-ridge')
)
delete from featured_wallpapers f
using demo_ids d
where f.wallpaper_id = d.id;

with demo_ids(id) as (
  values
    ('quiet-orbit'), ('one-line'), ('paper-moon'), ('film-dust'),
    ('ridge-line'), ('still-water'), ('afterglow-run'), ('night-circuit'),
    ('after-rain-sky'), ('school-route'), ('silent-satellite'), ('kepler-dust'),
    ('low-light'), ('charcoal-fold'), ('overlap-two'), ('lattice-soft'),
    ('begin-again'), ('make-room'), ('be-still'), ('let-there-be-light'),
    ('two-points'), ('held'), ('late-grid'), ('harbour-hour'),
    ('crane-hour'), ('deep-hold'), ('sepia-room'), ('old-letter'),
    ('true-black'), ('thin-cross'), ('soft-lock'), ('lock-dune'),
    ('ash-ring'), ('cold-harbour'), ('ink-fold'), ('pale-dune'),
    ('night-rail'), ('soft-grid'),
    ('folio-still'), ('folio-orbit'), ('ink-horizon'), ('pale-field'),
    ('harbour-span'), ('wide-ridge')
)
delete from wallpaper_pairs p
using demo_ids d
where p.lock_wallpaper_id = d.id or p.home_wallpaper_id = d.id;

-- Remove seeded collections and their joins.
delete from collection_wallpapers
where collection_id in ('col-amoled', 'col-minimal-iphone', 'col-dark', 'col-ipad');
delete from collections
where id in ('col-amoled', 'col-minimal-iphone', 'col-dark', 'col-ipad');

-- Remove dependent demo rows before the wallpapers themselves.
with demo_ids(id) as (
  values
    ('quiet-orbit'), ('one-line'), ('paper-moon'), ('film-dust'),
    ('ridge-line'), ('still-water'), ('afterglow-run'), ('night-circuit'),
    ('after-rain-sky'), ('school-route'), ('silent-satellite'), ('kepler-dust'),
    ('low-light'), ('charcoal-fold'), ('overlap-two'), ('lattice-soft'),
    ('begin-again'), ('make-room'), ('be-still'), ('let-there-be-light'),
    ('two-points'), ('held'), ('late-grid'), ('harbour-hour'),
    ('crane-hour'), ('deep-hold'), ('sepia-room'), ('old-letter'),
    ('true-black'), ('thin-cross'), ('soft-lock'), ('lock-dune'),
    ('ash-ring'), ('cold-harbour'), ('ink-fold'), ('pale-dune'),
    ('night-rail'), ('soft-grid'),
    ('folio-still'), ('folio-orbit'), ('ink-horizon'), ('pale-field'),
    ('harbour-span'), ('wide-ridge')
)
delete from wallpaper_tags wt using demo_ids d where wt.wallpaper_id = d.id;

with demo_ids(id) as (
  values
    ('quiet-orbit'), ('one-line'), ('paper-moon'), ('film-dust'),
    ('ridge-line'), ('still-water'), ('afterglow-run'), ('night-circuit'),
    ('after-rain-sky'), ('school-route'), ('silent-satellite'), ('kepler-dust'),
    ('low-light'), ('charcoal-fold'), ('overlap-two'), ('lattice-soft'),
    ('begin-again'), ('make-room'), ('be-still'), ('let-there-be-light'),
    ('two-points'), ('held'), ('late-grid'), ('harbour-hour'),
    ('crane-hour'), ('deep-hold'), ('sepia-room'), ('old-letter'),
    ('true-black'), ('thin-cross'), ('soft-lock'), ('lock-dune'),
    ('ash-ring'), ('cold-harbour'), ('ink-fold'), ('pale-dune'),
    ('night-rail'), ('soft-grid'),
    ('folio-still'), ('folio-orbit'), ('ink-horizon'), ('pale-field'),
    ('harbour-span'), ('wide-ridge')
)
delete from favorites f using demo_ids d where f.wallpaper_id = d.id;

with demo_ids(id) as (
  values
    ('quiet-orbit'), ('one-line'), ('paper-moon'), ('film-dust'),
    ('ridge-line'), ('still-water'), ('afterglow-run'), ('night-circuit'),
    ('after-rain-sky'), ('school-route'), ('silent-satellite'), ('kepler-dust'),
    ('low-light'), ('charcoal-fold'), ('overlap-two'), ('lattice-soft'),
    ('begin-again'), ('make-room'), ('be-still'), ('let-there-be-light'),
    ('two-points'), ('held'), ('late-grid'), ('harbour-hour'),
    ('crane-hour'), ('deep-hold'), ('sepia-room'), ('old-letter'),
    ('true-black'), ('thin-cross'), ('soft-lock'), ('lock-dune'),
    ('ash-ring'), ('cold-harbour'), ('ink-fold'), ('pale-dune'),
    ('night-rail'), ('soft-grid'),
    ('folio-still'), ('folio-orbit'), ('ink-horizon'), ('pale-field'),
    ('harbour-span'), ('wide-ridge')
)
delete from downloads x using demo_ids d where x.wallpaper_id = d.id;

with demo_ids(id) as (
  values
    ('quiet-orbit'), ('one-line'), ('paper-moon'), ('film-dust'),
    ('ridge-line'), ('still-water'), ('afterglow-run'), ('night-circuit'),
    ('after-rain-sky'), ('school-route'), ('silent-satellite'), ('kepler-dust'),
    ('low-light'), ('charcoal-fold'), ('overlap-two'), ('lattice-soft'),
    ('begin-again'), ('make-room'), ('be-still'), ('let-there-be-light'),
    ('two-points'), ('held'), ('late-grid'), ('harbour-hour'),
    ('crane-hour'), ('deep-hold'), ('sepia-room'), ('old-letter'),
    ('true-black'), ('thin-cross'), ('soft-lock'), ('lock-dune'),
    ('ash-ring'), ('cold-harbour'), ('ink-fold'), ('pale-dune'),
    ('night-rail'), ('soft-grid'),
    ('folio-still'), ('folio-orbit'), ('ink-horizon'), ('pale-field'),
    ('harbour-span'), ('wide-ridge')
)
delete from reports r using demo_ids d where r.wallpaper_id = d.id;

with demo_ids(id) as (
  values
    ('quiet-orbit'), ('one-line'), ('paper-moon'), ('film-dust'),
    ('ridge-line'), ('still-water'), ('afterglow-run'), ('night-circuit'),
    ('after-rain-sky'), ('school-route'), ('silent-satellite'), ('kepler-dust'),
    ('low-light'), ('charcoal-fold'), ('overlap-two'), ('lattice-soft'),
    ('begin-again'), ('make-room'), ('be-still'), ('let-there-be-light'),
    ('two-points'), ('held'), ('late-grid'), ('harbour-hour'),
    ('crane-hour'), ('deep-hold'), ('sepia-room'), ('old-letter'),
    ('true-black'), ('thin-cross'), ('soft-lock'), ('lock-dune'),
    ('ash-ring'), ('cold-harbour'), ('ink-fold'), ('pale-dune'),
    ('night-rail'), ('soft-grid'),
    ('folio-still'), ('folio-orbit'), ('ink-horizon'), ('pale-field'),
    ('harbour-span'), ('wide-ridge')
)
delete from wallpaper_views v using demo_ids d where v.wallpaper_id = d.id;

with demo_ids(id) as (
  values
    ('quiet-orbit'), ('one-line'), ('paper-moon'), ('film-dust'),
    ('ridge-line'), ('still-water'), ('afterglow-run'), ('night-circuit'),
    ('after-rain-sky'), ('school-route'), ('silent-satellite'), ('kepler-dust'),
    ('low-light'), ('charcoal-fold'), ('overlap-two'), ('lattice-soft'),
    ('begin-again'), ('make-room'), ('be-still'), ('let-there-be-light'),
    ('two-points'), ('held'), ('late-grid'), ('harbour-hour'),
    ('crane-hour'), ('deep-hold'), ('sepia-room'), ('old-letter'),
    ('true-black'), ('thin-cross'), ('soft-lock'), ('lock-dune'),
    ('ash-ring'), ('cold-harbour'), ('ink-fold'), ('pale-dune'),
    ('night-rail'), ('soft-grid'),
    ('folio-still'), ('folio-orbit'), ('ink-horizon'), ('pale-field'),
    ('harbour-span'), ('wide-ridge')
)
delete from wallpaper_assets a using demo_ids d where a.wallpaper_id = d.id;

with demo_ids(id) as (
  values
    ('quiet-orbit'), ('one-line'), ('paper-moon'), ('film-dust'),
    ('ridge-line'), ('still-water'), ('afterglow-run'), ('night-circuit'),
    ('after-rain-sky'), ('school-route'), ('silent-satellite'), ('kepler-dust'),
    ('low-light'), ('charcoal-fold'), ('overlap-two'), ('lattice-soft'),
    ('begin-again'), ('make-room'), ('be-still'), ('let-there-be-light'),
    ('two-points'), ('held'), ('late-grid'), ('harbour-hour'),
    ('crane-hour'), ('deep-hold'), ('sepia-room'), ('old-letter'),
    ('true-black'), ('thin-cross'), ('soft-lock'), ('lock-dune'),
    ('ash-ring'), ('cold-harbour'), ('ink-fold'), ('pale-dune'),
    ('night-rail'), ('soft-grid'),
    ('folio-still'), ('folio-orbit'), ('ink-horizon'), ('pale-field'),
    ('harbour-span'), ('wide-ridge')
)
delete from wallpapers w using demo_ids d where w.id = d.id;

-- Categories remain useful, but no longer point at deleted sample image files.
update categories
set cover_url = null
where cover_url like '/wallpapers/%';

-- Keep creator marketplace hidden while the creator feature is not in use.
update app_settings
set value = value || '{"creator_marketplace_enabled": false}'::jsonb,
    updated_at = now()
where key = 'feature_flags';

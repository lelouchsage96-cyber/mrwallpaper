# Mr Wallpapers — project specification

Tagline: Your Screen. Your Style.

This is the living spec. Change architecture only after reviewing this file.

## Environment

This Grok preview is a **web companion** of the production Flutter + Supabase product (Phase 0).

- Consumer app + admin: TanStack Start, Postgres (PGLite preview / Neon deploy)
- Auth: Better Auth — Google, X, email/password. Apple is native-only.
- Ads: mediation waterfall — AdSense on web, then house ads. Native keys for AdMob, AppLovin MAX, Unity LevelPlay, Meta stored in /ops. Premium skips display ads.
- Premium: database entitlement for preview. Not RevenueCat. Copy says so.
- Creator marketplace: **flagged off**

## Decisions (locked unless migrated)

- Riverpod (Flutter) / server functions + React state (this web app)
- Guest browse on; favorite, download, Premium require sign-in
- Default `free_download_mode` = `rewarded_ad` (from `app_settings`)
- Revenue split 80/20 stored in `app_settings`, never hard-coded in logic paths
- Categories and featured slots are database-driven
- Dark-first, Outfit + Instrument Serif, cool silver accent `#C8CCD4`
- Catalog is **phone-first** (iPhone / Android). Tablet / iPad is a secondary `device_type`. No desktop wallpapers.
- Feature flags in `app_settings.feature_flags`

## Phase status

- Phase 0: spec (chat + this file)
- Phase 1: foundation, auth, catalog, Home/Explore/Details/Favorites/Premium
- Phase 2: shipped — collections on Home, Explore category + sort + popular search, clickable tags, download history with date/type, category/collection covers
- Admin dashboard: `/ops` — analytics, catalog + placements, reports, accounts, settings. First signed-in account may claim operator. Preview of the production admin.
- Phase 3: shipped — lock/home device preview on details, notifications inbox, taste (Choose your look) driving For You, Lock & Home pairs
- Phase 4: shipped — Creator Studio (apply, own-photo upload at original quality, estimated share), public creator pages, admin review. Marketplace flag on.
- Phase 4 polish: loaders, no-flicker lists, page motion, original-file downloads.
- Later: real AdMob SSV, RevenueCat, Flutter, FCM, Live wallpapers for iPhone

## Trust rules

- Client cannot increment download counts
- Client cannot mark itself Premium
- Client `adCompleted` boolean is **not** accepted; `adSessionId` must exist in `download_authorizations`
- Originals in this preview are public JPEGs or Cloudflare R2 when connected in /ops. Production originals stay signed/private.

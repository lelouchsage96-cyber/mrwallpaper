import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { optionalAuthMiddleware } from "./optional-auth";
import { mergeMediation } from "@/lib/ads";
import { downloadExt, resolveOriginal, resolveThumb } from "@/lib/media";
import {
  fetchCardList,
  fetchCardsByIds,
  fetchCategories,
  fetchCollections,
  fetchCreators,
  fetchDetail,
  fetchFeaturedIds,
  fetchHomeDuos,
  fetchPairBySlug,
  fetchPairForWallpaper,
  fetchSeoRedirect,
  fetchSitemapEntries,
  lookupWallpaperRef,
  marketplaceEnabled,
  premiumEnabled,
  readSeoSettings,
} from "./queries";
import { DEVICE_HUBS, PAGE_SIZE } from "@/lib/seo";
import type {
  AdContext,
  AppConfig,
  AppNotification,
  Category,
  Collection,
  DownloadHistoryItem,
  DownloadRequestResult,
  ExploreMeta,
  FeatureFlags,
  HomePayload,
  PremiumPlan,
  WallpaperCard,
} from "@/lib/types";

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

async function settle<T>(label: string, task: Promise<T>, fallback: T): Promise<T> {
  try {
    return await task;
  } catch (err) {
    console.error(`[home] ${label}`, err);
    return fallback;
  }
}

const PREMIUM_PLANS: PremiumPlan[] = [
  { id: "monthly", label: "Monthly", period: "month", displayPrice: "$2.99", productId: "preview.monthly" },
  { id: "yearly", label: "Yearly", period: "year", displayPrice: "$19.99", productId: "preview.yearly" },
  { id: "lifetime", label: "Lifetime", period: "lifetime", displayPrice: "$39.99", productId: "preview.lifetime" },
];

const emptyHome = (): HomePayload => ({
  wotd: null,
  trending: [],
  fresh: [],
  recommended: [],
  editors: [],
  premium: [],
  live: [],
  recent: [],
  tablet: [],
  categories: [],
  collections: [],
  pairs: [],
  creators: [],
  unreadCount: 0,
  hasTaste: false,
  notificationsOn: true,
  marketplaceOn: false,
});

async function isPremiumUser(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const sql = await getSql();
  const rows = await sql.query<{ ok: number }>(
    `select 1 as ok from subscriptions
     where user_id = $1 and status = 'active'
       and (expires_at is null or expires_at > now())
     limit 1`,
    [userId],
  );
  return Boolean(rows[0]);
}

async function readFlags(): Promise<FeatureFlags> {
  const sql = await getSql();
  const raw = (
    await sql.query<{ value: unknown }>(`select value from app_settings where key = 'feature_flags' limit 1`)
  )[0]?.value;
  return parseJson<FeatureFlags>(raw, {
    creator_marketplace_enabled: false,
    premium_enabled: false,
    rewarded_downloads_enabled: false,
    notifications_enabled: true,
    recommendations_enabled: true,
    lifetime_purchase_enabled: true,
  });
}

async function setting<T>(key: string, fallback: T): Promise<T> {
  const sql = await getSql();
  const raw = (await sql.query<{ value: unknown }>(`select value from app_settings where key = $1 limit 1`, [key]))[0]
    ?.value;
  return parseJson<T>(raw, fallback);
}

async function recordView(userId: string | null, wallpaperId: string) {
  if (!userId) return;
  const sql = await getSql();
  await sql.query(
    `insert into wallpaper_views (id, user_id, wallpaper_id) values ($1, $2, $3)`,
    [crypto.randomUUID(), userId, wallpaperId],
  );
}

async function ensureNotifications(userId: string) {
  const sql = await getSql();
  const flags = await readFlags();
  if (!flags.notifications_enabled) return;
  const existing = await sql.query<{ n: number }>(
    `select count(*)::int as n from notifications where user_id = $1`,
    [userId],
  );
  if ((existing[0]?.n ?? 0) > 0) return;
  const wotd = await fetchFeaturedIds("wotd");
  if (wotd[0]) {
    await sql.query(
      `insert into notifications (id, user_id, kind, title, body, wallpaper_id, href)
       values ($1, $2, 'wotd', 'Wallpaper of the Day', 'A new lock screen is up.', $3, $4)`,
      [crypto.randomUUID(), userId, wotd[0], `/wallpaper/${wotd[0]}`],
    );
  }
  const pairs = await fetchHomeDuos(userId);
  const pair = pairs[0];
  if (pair) {
    await sql.query(
      `insert into notifications (id, user_id, kind, title, body, wallpaper_id, href)
       values ($1, $2, 'pair', $3, 'A Lock & Home pair, composed to live together.', $4, $5)`,
      [crypto.randomUUID(), userId, pair.name, pair.lock.id, `/pair/${pair.slug}`],
    );
  }
}

export const getHomeFeed = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator(z.object({ tasteIds: z.array(z.string()).optional() }).optional())
  .handler(async ({ context, data }): Promise<HomePayload> => {
    try {
    const userId = context.userId;
    let tasteIds = data?.tasteIds ?? [];
    const none: WallpaperCard[] = [];
    const [categories, collections, trendingRaw, freshRaw, tabletRaw, wotdIds, editorIds, creators, marketOn] =
      await Promise.all([
        settle("categories", fetchCategories(), []),
        settle("collections", fetchCollections(), []),
        settle("trending", fetchCardList(userId, { order: "trending", limit: 24, device: "phone" }), none),
        settle("fresh", fetchCardList(userId, { order: "fresh", limit: 12, device: "phone" }), none),
        settle("tablet", fetchCardList(userId, { order: "fresh", limit: 6, device: "tablet" }), none),
        settle("wotd", fetchFeaturedIds("wotd"), []),
        settle("editors", fetchFeaturedIds("editors_choice"), []),
        settle("creators", fetchCreators(8), []),
        settle("market", marketplaceEnabled(), false),
      ]);
    if (userId) {
      try {
        const sql = await getSql();
        const saved = await sql.query<{ category_id: string }>(
          `select category_id from user_tastes where user_id = $1`,
          [userId],
        );
        if (saved.length) tasteIds = saved.map((r) => r.category_id);
      } catch (err) {
        console.error("[home] taste", err);
      }
    }
    const [wotd, editors, pairs, recommended] = await Promise.all([
      settle("wotdCards", fetchCardsByIds(wotdIds.slice(0, 1), userId), none),
      settle("editorCards", fetchCardsByIds(editorIds, userId), none),
      settle("duos", fetchHomeDuos(userId, tasteIds), []),
      tasteIds.length >= 3
        ? settle(
            "recommended",
            fetchCardList(userId, { order: "trending", limit: 8, device: "phone", categoryIds: tasteIds }),
            none,
          )
        : Promise.resolve(none),
    ]);
    const wotdCard =
      (wotd[0] && wotd[0].deviceType !== "tablet" ? wotd[0] : null) ?? trendingRaw[0] ?? wotd[0] ?? null;
    const skip = new Set<string>();
    if (wotdCard) skip.add(wotdCard.id);
    const trending = trendingRaw.filter((w) => !skip.has(w.id)).slice(0, 16);
    trending.forEach((w) => skip.add(w.id));
    const fresh = freshRaw.filter((w) => !skip.has(w.id)).slice(0, 8);

    let notificationsOn = true;
    let unreadCount = 0;
    let hasTaste = tasteIds.length >= 3;
    if (userId) {
      try {
        const sql = await getSql();
        await ensureNotifications(userId);
        const pref = await sql.query<{ notifications_on: boolean | number }>(
          `select notifications_on from profiles where user_id = $1`,
          [userId],
        );
        if (pref[0]) notificationsOn = pref[0].notifications_on === true || pref[0].notifications_on === 1;
        const unread = await sql.query<{ n: number }>(
          `select count(*)::int as n from notifications where user_id = $1 and read_at is null`,
          [userId],
        );
        unreadCount = Number(unread[0]?.n) || 0;
        const saved = await sql.query<{ n: number }>(
          `select count(*)::int as n from user_tastes where user_id = $1`,
          [userId],
        );
        hasTaste = (saved[0]?.n ?? 0) >= 3;
      } catch (err) {
        console.error("[home] account", err);
      }
    }

    let recent: WallpaperCard[] = [];
    if (userId) {
      try {
        const sql = await getSql();
        const views = await sql.query<{ wallpaper_id: string }>(
          `select wallpaper_id from wallpaper_views
           where user_id = $1 order by viewed_at desc limit 12`,
          [userId],
        );
        recent = await fetchCardsByIds(
          [...new Set(views.map((v) => v.wallpaper_id))],
          userId,
        );
      } catch (err) {
        console.error("[home] recent", err);
      }
    }

    return {
      wotd: wotdCard,
      trending,
      fresh,
      recommended,
      editors,
      premium: [],
      live: [],
      recent,
      tablet: tabletRaw,
      categories,
      collections,
      pairs,
      creators: marketOn ? creators : [],
      unreadCount,
      hasTaste,
      notificationsOn,
      marketplaceOn: marketOn,
    };
    } catch (err) {
      console.error("[home] feed", err);
      return emptyHome();
    }
  });

export const getAppConfig = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .handler(async ({ context }): Promise<AppConfig> => {
    const flags = await readFlags();
    const mode = await setting<string>("free_download_mode", "direct");
    return {
      freeDownloadMode: mode === "rewarded_ad" ? "rewarded_ad" : "direct",
      maintenanceMode: await setting<boolean>("maintenance_mode", false),
      adsEnabled: await setting<boolean>("ads_enabled", false),
      rewardedDownloadsEnabled: flags.rewarded_downloads_enabled,
      dailyDownloadLimit: await setting<number>("daily_download_limit", 40),
      featureFlags: flags,
      premiumPlans: PREMIUM_PLANS,
      isPremium: await isPremiumUser(context.userId),
      adsenseClient: await setting<string>("adsense_client", ""),
      adsenseBannerSlot: await setting<string>("adsense_banner_slot", ""),
      adsenseFeedSlot: await setting<string>("adsense_feed_slot", ""),
      adsenseAnchorSlot: await setting<string>("adsense_anchor_slot", ""),
    };
  });

export const getExploreMeta = createServerFn({ method: "GET" }).handler(async (): Promise<ExploreMeta> => {
  try {
    const categories = await fetchCategories();
    const popularRows = await settle(
      "explore.tags",
      getSql().then((sql) => sql.query<{ name: string }>(`select name from tags order by name asc limit 8`)),
      [],
    );
    return { categories, popular: popularRows.map((r) => r.name) };
  } catch (err) {
    console.error("[explore] meta", err);
    return { categories: [], popular: [] };
  }
});

export const searchWallpapers = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator(
    z.object({
      q: z.string().optional(),
      access: z.enum(["free", "premium"]).optional(),
      sort: z.enum(["latest", "trending", "downloads", "favorites"]).optional(),
      offset: z.number().int().min(0).optional(),
      categorySlug: z.string().optional(),
      device: z.enum(["all", "phone", "tablet"]).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    try {
    const cats = await fetchCategories();
    const categoryId = data.categorySlug ? cats.find((c) => c.slug === data.categorySlug)?.id : undefined;
    const order =
      data.sort === "latest"
        ? "fresh"
        : data.sort === "downloads"
          ? "downloads"
          : data.sort === "favorites"
            ? "favorites"
            : "trending";
    const items = await fetchCardList(context.userId, {
      order,
      limit: 24,
      offset: data.offset ?? 0,
      categoryId,
      access: data.access,
      search: data.q,
      device: data.device ?? "phone",
    });
    return { items, offset: (data.offset ?? 0) + items.length, hasMore: items.length === 24 };
    } catch (err) {
      console.error("[search]", err);
      return { items: [] as WallpaperCard[], offset: data.offset ?? 0, hasMore: false };
    }
  });

export const getCategoryPage = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator(
    z.object({
      slug: z.string(),
      page: z.number().int().min(1).optional(),
      offset: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    try {
    const page = data.page ?? (data.offset ? Math.floor(data.offset / PAGE_SIZE) + 1 : 1);
    const offset = (page - 1) * PAGE_SIZE;
    const slug = data.slug === "bible-verses" ? "bible-verse" : data.slug;
    const cats = await fetchCategories();
    const category = cats.find((c) => c.slug === slug) ?? null;
    const hub = DEVICE_HUBS[slug];
    if (!category && !hub && slug !== "all") {
      return { category: null, hub: null, items: [] as WallpaperCard[], hasMore: false, page, pages: 0 };
    }
    const device = hub?.device === "tablet" ? "tablet" : hub?.device === "all" ? "all" : "phone";
    const items = await fetchCardList(context.userId, {
      order: "trending",
      limit: PAGE_SIZE,
      offset,
      categoryId: category?.id,
      device,
    });
    const extra = await fetchCardList(context.userId, {
      order: "trending",
      limit: 1,
      offset: offset + PAGE_SIZE,
      categoryId: category?.id,
      device,
    });
    return {
      category,
      hub: hub
        ? { slug, name: hub.name, intro: hub.intro, title: hub.title, description: hub.description }
        : null,
      items,
      page,
      hasMore: extra.length > 0,
      pages: extra.length > 0 ? page + 1 : page,
    };
    } catch (err) {
      console.error("[category]", err);
      return { category: null, hub: null, items: [] as WallpaperCard[], hasMore: false, page: 1, pages: 0 };
    }
  });

export const getCollectionPage = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ context, data }) => {
    try {
      const collections = await fetchCollections();
      const collection = collections.find((c) => c.slug === data.slug) ?? null;
      if (!collection) return { collection: null, items: [] as WallpaperCard[] };
      const sql = await getSql();
      const ids = await sql.query<{ wallpaper_id: string }>(
        `select wallpaper_id from collection_wallpapers
         where collection_id = $1 order by sort_order asc`,
        [collection.id],
      );
      const items = await fetchCardsByIds(
        ids.map((r) => r.wallpaper_id),
        context.userId,
      );
      return { collection, items };
    } catch (err) {
      console.error("[collection]", err);
      return { collection: null, items: [] as WallpaperCard[] };
    }
  });

export const getWallpaper = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    try {
    const ref = await lookupWallpaperRef(data.id);
    if (!ref) return { wallpaper: null, related: [] as WallpaperCard[], pair: null, status: "missing" as const };
    if (ref.status === "removed" || ref.status === "rejected") {
      return { wallpaper: null, related: [] as WallpaperCard[], pair: null, status: "gone" as const };
    }
    const canonical = ref.slug || ref.id;
    const detail = await fetchDetail(ref.id, context.userId);
    if (!detail) return { wallpaper: null, related: [] as WallpaperCard[], pair: null, status: "missing" as const };
    void recordView(context.userId, ref.id).catch(() => undefined);
    const related = (
      await fetchCardList(context.userId, {
        order: "trending",
        limit: 8,
        categoryId: detail.categoryId,
        device: detail.deviceType === "tablet" ? "tablet" : "phone",
      })
    ).filter((w) => w.id !== ref.id);
    const extra =
      related.length < 4
        ? (
            await fetchCardList(context.userId, {
              order: "trending",
              limit: 8,
              device: detail.deviceType === "tablet" ? "tablet" : "phone",
            })
          ).filter((w) => w.id !== ref.id && !related.some((r) => r.id === w.id))
        : [];
    const pair = await fetchPairForWallpaper(ref.id, context.userId);
    return {
      wallpaper: detail,
      related: [...related, ...extra].slice(0, 8),
      pair,
      status: "ok" as const,
      canonicalSlug: canonical,
    };
    } catch (err) {
      console.error("[wallpaper]", err);
      return { wallpaper: null, related: [] as WallpaperCard[], pair: null, status: "missing" as const };
    }
  });

export const getPublicSeo = createServerFn({ method: "GET" }).handler(async () => readSeoSettings());

export const getSitemapData = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await fetchSitemapEntries();
  } catch (err) {
    console.error("[sitemap]", err);
    return { wallpapers: [], categories: [], collections: [], creators: [], pairs: [] };
  }
});

export const getSeoRedirect = createServerFn({ method: "GET" })
  .validator(z.object({ path: z.string() }))
  .handler(async ({ data }) => fetchSeoRedirect(data.path));

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ wallpaperId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql.query<{ wallpaper_id: string }>(
      `select wallpaper_id from favorites where user_id = $1 and wallpaper_id = $2`,
      [context.userId, data.wallpaperId],
    );
    if (existing[0]) {
      await sql.query(`delete from favorites where user_id = $1 and wallpaper_id = $2`, [
        context.userId,
        data.wallpaperId,
      ]);
      await sql.query(
        `update wallpapers set favorite_count = greatest(favorite_count - 1, 0) where id = $1`,
        [data.wallpaperId],
      );
      return { isFavorite: false };
    }
    await sql.query(`insert into favorites (user_id, wallpaper_id) values ($1, $2) on conflict do nothing`, [
      context.userId,
      data.wallpaperId,
    ]);
    await sql.query(`update wallpapers set favorite_count = favorite_count + 1 where id = $1`, [data.wallpaperId]);
    return { isFavorite: true };
  });

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ offset: z.number().int().min(0).optional() }).optional())
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const offset = data?.offset ?? 0;
    const rows = await sql.query<{ wallpaper_id: string }>(
      `select wallpaper_id from favorites where user_id = $1
       order by created_at desc limit 24 offset $2`,
      [context.userId, offset],
    );
    const items = await fetchCardsByIds(
      rows.map((r) => r.wallpaper_id),
      context.userId,
    );
    return { items, offset: offset + items.length, hasMore: rows.length === 24 };
  });

export const getPremiumStatus = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .handler(async ({ context }) => ({ isPremium: await isPremiumUser(context.userId) }));

export const activatePreviewPremium = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ productId: z.string() }))
  .handler(async ({ context, data }) => {
    if (!(await premiumEnabled())) return { ok: false as const };
    const sql = await getSql();
    await sql.query(
      `insert into subscriptions (id, user_id, product_id, status, store)
       values ($1, $2, $3, 'active', 'preview')`,
      [crypto.randomUUID(), context.userId, data.productId],
    );
    return { ok: true as const };
  });

export const createAdSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ wallpaperId: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql.query(
      `insert into download_authorizations (id, user_id, wallpaper_id, expires_at, reason)
       values ($1, $2, $3, now() + interval '20 minutes', 'rewarded')`,
      [id, context.userId, data.wallpaperId],
    );
    return { adSessionId: id };
  });

export const requestDownload = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator(
    z.object({
      wallpaperId: z.string(),
      source: z.string().optional(),
      adSessionId: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }): Promise<DownloadRequestResult> => {
    if (!context.userId) return { status: "needs_auth" };
    const detail = await fetchDetail(data.wallpaperId, context.userId);
    if (!detail) return { status: "error", message: "Not found" };
    const sql = await getSql();
    const premium = await isPremiumUser(context.userId);
    const mode = await setting<string>("free_download_mode", "direct");
    const flags = await readFlags();
    if (detail.accessType === "premium" && !premium && flags.premium_enabled) return { status: "needs_premium" };

    if (!premium && mode === "rewarded_ad" && flags.rewarded_downloads_enabled && !data.adSessionId) {
      return { status: "needs_ad" };
    }

    if (data.adSessionId) {
      const auth = await sql.query<{ id: string }>(
        `select id from download_authorizations
         where id = $1 and user_id = $2 and wallpaper_id = $3
           and consumed_at is null and expires_at > now()
         limit 1`,
        [data.adSessionId, context.userId, data.wallpaperId],
      );
      if (!auth[0]) return { status: "needs_ad" };
      await sql.query(`update download_authorizations set consumed_at = now() where id = $1`, [auth[0].id]);
    }

    const limit = await setting<number>("daily_download_limit", 40);
    const today = await sql.query<{ n: number }>(
      `select count(*)::int as n from downloads
       where user_id = $1 and downloaded_at > now() - interval '1 day'`,
      [context.userId],
    );
    if ((today[0]?.n ?? 0) >= limit && !premium) return { status: "rate_limited" };

    const assets = await sql.query<{ path: string; mime: string }>(
      `select path, mime from wallpaper_assets
       where wallpaper_id = $1 and kind = 'original' limit 1`,
      [data.wallpaperId],
    );
    const url = resolveOriginal(data.wallpaperId, assets[0]?.path);
    const ext = downloadExt(detail.format);
    const downloadType = premium ? "premium" : data.adSessionId ? "rewarded" : "free";
    await sql.query(
      `insert into downloads (id, user_id, wallpaper_id, download_type, source, is_premium_user, authorization_id)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        crypto.randomUUID(),
        context.userId,
        data.wallpaperId,
        downloadType,
        data.source ?? "details",
        premium,
        data.adSessionId ?? null,
      ],
    );
    await sql.query(`update wallpapers set download_count = download_count + 1 where id = $1`, [data.wallpaperId]);
    return {
      status: "ok",
      url: `${url}${url.includes("?") ? "&" : "?"}dl=1`,
      filename: `${detail.title.replace(/[^\w]+/g, "-").toLowerCase()}.${ext}`,
      mime: assets[0]?.mime || "image/jpeg",
      isLive: detail.isLive,
      stillUrl: null,
      stillFilename: null,
    };
  });

export const recordAdEvent = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator(
    z.object({
      placement: z.string(),
      format: z.string().optional(),
      creativeId: z.string().optional(),
      network: z.string().optional(),
      clicked: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const sql = await getSql();
      await sql.query(
        `insert into ad_impressions (id, placement, format, creative_id, network, clicked)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          data.placement,
          data.format ?? "display",
          data.creativeId ?? "",
          data.network ?? "house",
          Boolean(data.clicked),
        ],
      );
    } catch {
      /* ads table optional */
    }
    return { ok: true as const };
  });

export const getAdContext = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .handler(async ({ context }): Promise<AdContext> => {
    const adsEnabled = await setting<boolean>("ads_enabled", false);
    const premium = await isPremiumUser(context.userId);
    const networks = mergeMediation(await setting("ad_mediation", []));
    return {
      showAds: adsEnabled && !premium,
      adsEnabled,
      isPremium: premium,
      adsenseClient: await setting<string>("adsense_client", ""),
      adsenseBannerSlot: await setting<string>("adsense_banner_slot", ""),
      adsenseFeedSlot: await setting<string>("adsense_feed_slot", ""),
      adsenseAnchorSlot: await setting<string>("adsense_anchor_slot", ""),
      displayEcpm: await setting<number>("ads_display_ecpm", 4.5),
      rewardedEcpm: await setting<number>("ads_rewarded_ecpm", 14),
      networks,
    };
  });

export const listDownloads = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ items: DownloadHistoryItem[] }> => {
    const sql = await getSql();
    const rows = await sql.query<{ wallpaper_id: string; downloaded_at: string; download_type: string }>(
      `select wallpaper_id, downloaded_at::text as downloaded_at, download_type
       from downloads where user_id = $1 order by downloaded_at desc limit 40`,
      [context.userId],
    );
    const cards = await fetchCardsByIds(
      rows.map((r) => r.wallpaper_id),
      context.userId,
    );
    const byId = new Map(cards.map((c) => [c.id, c]));
    return {
      items: rows
        .map((r) => {
          const card = byId.get(r.wallpaper_id);
          if (!card) return null;
          return { ...card, downloadedAt: r.downloaded_at, downloadType: r.download_type };
        })
        .filter((x): x is DownloadHistoryItem => Boolean(x)),
    };
  });

export const submitReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      wallpaperId: z.string(),
      reason: z.enum(["copyright", "offensive", "spam", "duplicate", "misleading", "other"]),
      notes: z.string().max(400).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql.query(
      `insert into reports (id, user_id, wallpaper_id, reason, notes, status)
       values ($1, $2, $3, $4, $5, 'open')`,
      [crypto.randomUUID(), context.userId, data.wallpaperId, data.reason, data.notes ?? ""],
    );
    return { ok: true as const };
  });

export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql.query(
      `insert into profiles (user_id) values ($1) on conflict (user_id) do nothing`,
      [context.userId],
    );
    return { ok: true as const };
  });

export const getTaste = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<{ category_id: string }>(
      `select category_id from user_tastes where user_id = $1`,
      [context.userId],
    );
    return { categoryIds: rows.map((r) => r.category_id) };
  });

export const saveTaste = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator(z.object({ categoryIds: z.array(z.string()).min(3) }))
  .handler(async ({ context, data }) => {
    if (!context.userId) return { ok: true as const };
    const sql = await getSql();
    await sql.query(`delete from user_tastes where user_id = $1`, [context.userId]);
    for (const id of data.categoryIds) {
      await sql.query(`insert into user_tastes (user_id, category_id) values ($1, $2) on conflict do nothing`, [
        context.userId,
        id,
      ]);
    }
    return { ok: true as const };
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ items: AppNotification[]; notificationsOn: boolean }> => {
    const sql = await getSql();
    await ensureNotifications(context.userId);
    const pref = await sql.query<{ notifications_on: boolean | number }>(
      `select notifications_on from profiles where user_id = $1`,
      [context.userId],
    );
    const on = pref[0] ? pref[0].notifications_on === true || pref[0].notifications_on === 1 : true;
    const rows = await sql.query<{
      id: string;
      kind: string;
      title: string;
      body: string;
      href: string | null;
      wallpaper_id: string | null;
      read_at: string | null;
      created_at: string;
    }>(
      `select id, kind, title, body, href, wallpaper_id, read_at::text as read_at, created_at::text as created_at
       from notifications where user_id = $1 order by created_at desc limit 40`,
      [context.userId],
    );
    const thumbs = await fetchCardsByIds(
      rows.map((r) => r.wallpaper_id).filter((x): x is string => Boolean(x)),
      context.userId,
    );
    const byId = new Map(thumbs.map((c) => [c.id, c]));
    return {
      notificationsOn: on,
      items: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        title: r.title,
        body: r.body,
        href: r.href,
        wallpaperId: r.wallpaper_id,
        thumbnailUrl: r.wallpaper_id ? (byId.get(r.wallpaper_id)?.thumbnailUrl ?? resolveThumb(r.wallpaper_id)) : null,
        read: Boolean(r.read_at),
        createdAt: r.created_at,
      })),
    };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().optional() }).optional())
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data?.id) {
      await sql.query(`update notifications set read_at = now() where id = $1 and user_id = $2`, [
        data.id,
        context.userId,
      ]);
    } else {
      await sql.query(`update notifications set read_at = now() where user_id = $1 and read_at is null`, [
        context.userId,
      ]);
    }
    return { ok: true as const };
  });

export const updateNotificationPref = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ on: z.boolean() }))
  .handler(async ({ context, data }) => {
    await (await getSql()).query(
      `insert into profiles (user_id, notifications_on) values ($1, $2)
       on conflict (user_id) do update set notifications_on = $2, updated_at = now()`,
      [context.userId, data.on],
    );
    return { ok: true as const, on: data.on };
  });

export const deleteAccountData = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const uid = context.userId;
    await sql.query(`delete from favorites where user_id = $1`, [uid]);
    await sql.query(`delete from downloads where user_id = $1`, [uid]);
    await sql.query(`delete from notifications where user_id = $1`, [uid]);
    await sql.query(`delete from user_tastes where user_id = $1`, [uid]);
    await sql.query(`delete from wallpaper_views where user_id = $1`, [uid]);
    await sql.query(`delete from profiles where user_id = $1`, [uid]);
    return { ok: true as const };
  });

export const getPairPage = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ context, data }) => {
    try {
      return { pair: await fetchPairBySlug(data.slug, context.userId) };
    } catch (err) {
      console.error("[pair]", err);
      return { pair: null };
    }
  });

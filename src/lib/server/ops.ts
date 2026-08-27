import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type {
  FeatureFlags,
  OpsCategoryRow,
  OpsCollectionRow,
  OpsCreatorRow,
  OpsFeaturedRow,
  OpsOverview,
  OpsReportRow,
  OpsRole,
  OpsSession,
  OpsSettings,
  OpsSubmissionRow,
  OpsUserRow,
  OpsWallpaperRow,
} from "@/lib/types";
import { notify } from "./studio";
import { resolveOwnedThumb } from "@/lib/media";
import { mergeMediation, type AdNetworkConfig } from "@/lib/ads";
import { parseDeviceType } from "@/lib/device";
import { storageBackend } from "./storage";
import { configureR2, pingR2, r2Config, r2Configured } from "./r2";
import { uniqueWallpaperSlug, readSeoSettings, recordSeoRedirect } from "./queries";
import { slugify } from "@/lib/seo";
import {
  supabaseHasKey,
  supabaseProjectRef,
  supabaseProjectUrl,
} from "./supabase";

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

function toBool(v: boolean | number | null | undefined): boolean {
  return v === true || v === 1;
}

class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

async function ensureProfileRow(userId: string) {
  const sql = await getSql();
  await sql.query(
    `insert into profiles (user_id) values ($1) on conflict (user_id) do nothing`,
    [userId],
  );
}

async function loadRole(userId: string): Promise<{ role: OpsRole; status: string }> {
  const sql = await getSql();
  await ensureProfileRow(userId);
  const rows = await sql.query<{ role: OpsRole; status: string }>(
    `select role, status from profiles where user_id = $1 limit 1`,
    [userId],
  );
  return rows[0] ?? { role: "user", status: "active" };
}

async function adminExists(): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query<{ n: number }>(
    `select count(*)::int as n from profiles where role in ('admin', 'moderator')`,
  );
  return (rows[0]?.n ?? 0) > 0;
}

async function requireOps(userId: string, adminOnly = false): Promise<OpsRole> {
  const { role, status } = await loadRole(userId);
  if (status !== "active") throw new ForbiddenError();
  if (adminOnly && role !== "admin") throw new ForbiddenError();
  if (role !== "admin" && role !== "moderator") throw new ForbiddenError();
  return role;
}

function thumb(path: string | null, id: string, slug?: string | null) {
  return resolveOwnedThumb(id, path, slug);
}

export const getOpsSession = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<OpsSession> => {
    const { role, status } = await loadRole(context.userId);
    const exists = await adminExists();
    const active = status === "active";
    const canModerate = active && (role === "admin" || role === "moderator");
    return {
      role,
      canClaim: active && !exists,
      canModerate,
      canAdmin: active && role === "admin",
    };
  });

export const claimOpsAccess = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<OpsSession> => {
    const sql = await getSql();
    await ensureProfileRow(context.userId);
    if (await adminExists()) throw new ForbiddenError();
    await sql.query(
      `update profiles set role = 'admin', status = 'active', updated_at = now()
       where user_id = $1`,
      [context.userId],
    );
    return {
      role: "admin",
      canClaim: false,
      canModerate: true,
      canAdmin: true,
    };
  });

export const getOpsOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<OpsOverview> => {
    await requireOps(context.userId);
    const sql = await getSql();
    const [wp, dl, rp, users, sub, fav, series, top, mix, adsToday, adsAll, adsNet] = await Promise.all([
      sql.query<{ n: number; approved: number; premium: number; pending: number }>(
        `select count(*)::int as n,
                count(*) filter (where status = 'approved')::int as approved,
                count(*) filter (where access_type = 'premium')::int as premium,
                count(*) filter (where status in ('pending', 'draft'))::int as pending
         from wallpapers`,
      ),
      sql.query<{ today: number; yesterday: number; all: number }>(
        `select
           count(*) filter (where downloaded_at >= now() - interval '1 day')::int as today,
           count(*) filter (
             where downloaded_at >= now() - interval '2 day'
               and downloaded_at < now() - interval '1 day'
           )::int as yesterday,
           count(*)::int as all
         from downloads`,
      ),
      sql.query<{ n: number }>(
        `select count(*)::int as n from reports where status = 'open'`,
      ),
      sql.query<{ n: number }>(`select count(*)::int as n from profiles`),
      sql.query<{ n: number }>(
        `select count(*)::int as n from subscriptions
         where status in ('active', 'grace')
           and (expires_at is null or expires_at > now())`,
      ),
      sql.query<{ n: number }>(`select count(*)::int as n from favorites`),
      sql.query<{
        date: string;
        total: number;
        free: number;
        rewarded: number;
        premium: number;
      }>(
        `select to_char(d::date, 'YYYY-MM-DD') as date,
                count(dl.id)::int as total,
                count(dl.id) filter (where dl.download_type = 'free')::int as free,
                count(dl.id) filter (where dl.download_type = 'rewarded')::int as rewarded,
                count(dl.id) filter (where dl.download_type = 'premium')::int as premium
         from generate_series(
           (current_date - 13)::timestamp,
           current_date::timestamp,
           interval '1 day'
         ) as d
         left join downloads dl on dl.downloaded_at::date = d::date
         group by d
         order by d`,
      ),
      sql.query<{
        id: string;
        title: string;
        download_count: number;
        favorite_count: number;
        thumbnail_url: string | null;
      }>(
        `select w.id, w.title, w.download_count, w.favorite_count,
                (select a.path from wallpaper_assets a
                  where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
         from wallpapers w
         where w.status = 'approved'
         order by w.download_count desc
         limit 6`,
      ),
      sql.query<{ download_type: "free" | "rewarded" | "premium"; n: number }>(
        `select download_type, count(*)::int as n
         from downloads
         where downloaded_at >= current_date - 13
         group by download_type`,
      ),
      sql.query<{ n: number; revenue: number; clicks: number }>(
        `select count(*) filter (where created_at::date = current_date)::int as n,
                coalesce(sum(revenue_micros) filter (where created_at::date = current_date), 0)::int as revenue,
                count(*) filter (where clicked and created_at::date = current_date)::int as clicks
         from ad_impressions`,
      ),
      sql.query<{ revenue: number }>(
        `select coalesce(sum(revenue_micros), 0)::int as revenue from ad_impressions`,
      ),
      sql.query<{ network: string; n: number; revenue: number }>(
        `select network, count(*)::int as n, coalesce(sum(revenue_micros), 0)::int as revenue
         from ad_impressions
         where created_at >= current_date
         group by network`,
      ),
    ]);
    const mixMap = new Map(mix.map((r) => [r.download_type, r.n]));
    return {
      wallpapers: wp[0]?.n ?? 0,
      approved: wp[0]?.approved ?? 0,
      premium: wp[0]?.premium ?? 0,
      pending: wp[0]?.pending ?? 0,
      downloadsToday: dl[0]?.today ?? 0,
      downloadsYesterday: dl[0]?.yesterday ?? 0,
      downloadsAll: dl[0]?.all ?? 0,
      openReports: rp[0]?.n ?? 0,
      users: users[0]?.n ?? 0,
      premiumSubs: sub[0]?.n ?? 0,
      favorites: fav[0]?.n ?? 0,
      series: series.map((r) => ({
        date: r.date,
        total: Number(r.total) || 0,
        free: Number(r.free) || 0,
        rewarded: Number(r.rewarded) || 0,
        premium: Number(r.premium) || 0,
      })),
      topWallpapers: top.map((r) => ({
        id: r.id,
        title: r.title,
        thumbnailUrl: thumb(r.thumbnail_url, r.id),
        downloadCount: Number(r.download_count) || 0,
        favoriteCount: Number(r.favorite_count) || 0,
      })),
      byType: (["free", "rewarded", "premium"] as const).map((type) => ({
        type,
        count: mixMap.get(type) ?? 0,
      })),
      adImpressionsToday: Number(adsToday[0]?.n) || 0,
      adRevenueTodayMicros: Number(adsToday[0]?.revenue) || 0,
      adClicksToday: Number(adsToday[0]?.clicks) || 0,
      adRevenueAllMicros: Number(adsAll[0]?.revenue) || 0,
      adByNetwork: adsNet.map((r) => ({
        network: r.network,
        impressions: Number(r.n) || 0,
        revenueMicros: Number(r.revenue) || 0,
      })),
    };
  });

export const listOpsWallpapers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ status: z.string().optional(), q: z.string().optional() }).optional())
  .handler(async ({ context, data }): Promise<{ items: OpsWallpaperRow[] }> => {
    await requireOps(context.userId);
    const sql = await getSql();
    const params: unknown[] = [];
    const where: string[] = [];
    if (data?.status) {
      params.push(data.status);
      where.push(`w.status = $${params.length}`);
    }
    if (data?.q?.trim()) {
      params.push(`%${data.q.trim().toLowerCase()}%`);
      where.push(`(lower(w.title) like $${params.length} or lower(c.name) like $${params.length})`);
    }
    const clause = where.length ? `where ${where.join(" and ")}` : "";
    const rows = await sql.query<{
      id: string;
      slug: string | null;
      title: string;
      category_name: string;
      access_type: "free" | "premium";
      status: string;
      thumbnail_url: string | null;
      download_count: number;
      favorite_count: number;
      device_type?: string | null;
      seo_title?: string | null;
      seo_description?: string | null;
      alt_text?: string | null;
      canonical_path?: string | null;
      robots?: string | null;
    }>(
      `select w.id, w.slug, w.title, c.name as category_name, w.access_type, w.status,
              w.download_count, w.favorite_count, w.device_type,
              w.seo_title, w.seo_description, w.alt_text, w.canonical_path, w.robots,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from wallpapers w
       join categories c on c.id = w.category_id
       ${clause}
       order by case
         when w.status = 'pending' then 0
         when w.status = 'draft' then 1
         else 2
       end, w.updated_at desc
       limit 80`,
      params,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug || r.id,
        title: r.title,
        categoryName: r.category_name,
        accessType: r.access_type,
        status: r.status,
        thumbnailUrl: thumb(r.thumbnail_url, r.id, r.slug),
        downloadCount: Number(r.download_count) || 0,
        favoriteCount: Number(r.favorite_count) || 0,
        deviceType: parseDeviceType(r.device_type),
        seoTitle: r.seo_title || "",
        seoDescription: r.seo_description || "",
        altText: r.alt_text || "",
        canonicalPath: r.canonical_path || "",
        robots: r.robots === "noindex" ? "noindex" : "index",
      })),
    };
  });

export const updateWallpaperOps = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      wallpaperId: z.string(),
      status: z.enum(["draft", "pending", "approved", "rejected", "removed"]).optional(),
      accessType: z.enum(["free", "premium"]).optional(),
      deviceType: z.enum(["phone", "tablet", "both"]).optional(),
      slug: z.string().max(80).optional(),
      seoTitle: z.string().max(70).optional(),
      seoDescription: z.string().max(180).optional(),
      altText: z.string().max(125).optional(),
      canonicalPath: z.string().max(180).optional(),
      robots: z.enum(["index", "noindex"]).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireOps(context.userId);
    const sql = await getSql();
    if (data.status) {
      await sql.query(
        `update wallpapers set status = $1, updated_at = now() where id = $2`,
        [data.status, data.wallpaperId],
      );
      if (data.status === "approved") {
        const row = await sql.query<{ slug: string | null; title: string }>(
          `select slug, title from wallpapers where id = $1 limit 1`,
          [data.wallpaperId],
        );
        if (row[0] && !row[0].slug) {
          const slug = await uniqueWallpaperSlug(slugify(row[0].title || "wallpaper"), data.wallpaperId);
          await sql.query(`update wallpapers set slug = $1, updated_at = now() where id = $2`, [
            slug,
            data.wallpaperId,
          ]);
        }
      }
    }
    if (data.accessType) {
      await sql.query(
        `update wallpapers set access_type = $1, updated_at = now() where id = $2`,
        [data.accessType, data.wallpaperId],
      );
    }
    if (data.deviceType) {
      await sql.query(
        `update wallpapers set device_type = $1, updated_at = now() where id = $2`,
        [data.deviceType, data.wallpaperId],
      );
    }
    if (data.slug !== undefined) {
      const current = await sql.query<{ slug: string | null }>(
        `select slug from wallpapers where id = $1 limit 1`,
        [data.wallpaperId],
      );
      const next = await uniqueWallpaperSlug(slugify(data.slug || "wallpaper"), data.wallpaperId);
      const prev = current[0]?.slug;
      if (prev && prev !== next) {
        await recordSeoRedirect(`/wallpaper/${prev}`, `/wallpaper/${next}`);
      }
      await sql.query(`update wallpapers set slug = $1, updated_at = now() where id = $2`, [next, data.wallpaperId]);
    }
    if (data.seoTitle !== undefined) {
      await sql.query(`update wallpapers set seo_title = $1, updated_at = now() where id = $2`, [
        data.seoTitle,
        data.wallpaperId,
      ]);
    }
    if (data.seoDescription !== undefined) {
      await sql.query(`update wallpapers set seo_description = $1, updated_at = now() where id = $2`, [
        data.seoDescription,
        data.wallpaperId,
      ]);
    }
    if (data.altText !== undefined) {
      await sql.query(`update wallpapers set alt_text = $1, updated_at = now() where id = $2`, [
        data.altText,
        data.wallpaperId,
      ]);
    }
    if (data.canonicalPath !== undefined) {
      await sql.query(`update wallpapers set canonical_path = $1, updated_at = now() where id = $2`, [
        data.canonicalPath,
        data.wallpaperId,
      ]);
    }
    if (data.robots) {
      await sql.query(`update wallpapers set robots = $1, updated_at = now() where id = $2`, [
        data.robots,
        data.wallpaperId,
      ]);
    }
    return { ok: true as const };
  });

export const listOpsFeatured = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ items: OpsFeaturedRow[] }> => {
    await requireOps(context.userId);
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      slot: string;
      wallpaper_id: string;
      title: string;
      thumbnail_url: string | null;
    }>(
      `select f.id, f.slot, f.wallpaper_id, w.title,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from featured_wallpapers f
       join wallpapers w on w.id = f.wallpaper_id
       where f.starts_at <= now() and (f.ends_at is null or f.ends_at > now())
       order by f.slot, f.priority desc`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        slot: r.slot,
        wallpaperId: r.wallpaper_id,
        title: r.title,
        thumbnailUrl: thumb(r.thumbnail_url, r.wallpaper_id),
      })),
    };
  });

export const setFeaturedSlot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      wallpaperId: z.string(),
      slot: z.enum(["wotd", "editors_choice", "premium_spotlight"]),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireOps(context.userId);
    const sql = await getSql();
    if (data.slot === "wotd") {
      await sql.query(`delete from featured_wallpapers where slot = 'wotd'`);
    } else {
      await sql.query(
        `delete from featured_wallpapers where slot = $1 and wallpaper_id = $2`,
        [data.slot, data.wallpaperId],
      );
    }
    await sql.query(
      `insert into featured_wallpapers (id, slot, wallpaper_id, starts_at, ends_at, priority)
       values ($1, $2, $3, now(), now() + interval '365 days', 10)`,
      [crypto.randomUUID(), data.slot, data.wallpaperId],
    );
    return { ok: true as const };
  });

export const removeFeaturedSlot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await requireOps(context.userId);
    const sql = await getSql();
    await sql.query(`delete from featured_wallpapers where id = $1`, [data.id]);
    return { ok: true as const };
  });

export const listOpsReports = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ items: OpsReportRow[] }> => {
    await requireOps(context.userId);
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      wallpaper_id: string;
      title: string;
      thumbnail_url: string | null;
      reason: string;
      status: string;
      created_at: string;
    }>(
      `select r.id, r.wallpaper_id, w.title, r.reason, r.status, r.created_at,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from reports r
       join wallpapers w on w.id = r.wallpaper_id
       order by r.created_at desc
       limit 60`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        wallpaperId: r.wallpaper_id,
        title: r.title,
        thumbnailUrl: thumb(r.thumbnail_url, r.wallpaper_id),
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
      })),
    };
  });

export const updateReportOps = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string(), status: z.enum(["open", "resolved", "dismissed"]) }))
  .handler(async ({ context, data }) => {
    await requireOps(context.userId);
    const sql = await getSql();
    await sql.query(`update reports set status = $1 where id = $2`, [data.status, data.id]);
    return { ok: true as const };
  });

export const getOpsSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<OpsSettings> => {
    await requireOps(context.userId, true);
    const sql = await getSql();
    const rows = await sql.query<{ key: string; value: unknown }>(
      `select key, value from app_settings`,
    );
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const flags = parseJson<FeatureFlags>(map.get("feature_flags"), {
      creator_marketplace_enabled: false,
      premium_enabled: false,
      rewarded_downloads_enabled: true,
      notifications_enabled: false,
      recommendations_enabled: true,
      lifetime_purchase_enabled: true,
    });
    const mode = parseJson<string>(map.get("free_download_mode"), "direct");
    const backend = await storageBackend();
    const r2 = await r2Config();
    const seo = await readSeoSettings();
    return {
      freeDownloadMode: mode === "direct" ? "direct" : "rewarded_ad",
      maintenanceMode: parseJson<boolean>(map.get("maintenance_mode"), false),
      adsEnabled: parseJson<boolean>(map.get("ads_enabled"), false),
      rewardedDownloadsEnabled: parseJson<boolean>(
        map.get("rewarded_downloads_enabled"),
        true,
      ),
      dailyDownloadLimit: Number(parseJson<number>(map.get("daily_download_limit"), 40)),
      creatorSharePercent: Number(parseJson<number>(map.get("creator_share_percent"), 80)),
      platformSharePercent: Number(parseJson<number>(map.get("platform_share_percent"), 20)),
      featureFlags: flags,
      adsenseClient: parseJson<string>(map.get("adsense_client"), ""),
      adsenseBannerSlot: parseJson<string>(map.get("adsense_banner_slot"), ""),
      adsenseFeedSlot: parseJson<string>(map.get("adsense_feed_slot"), ""),
      adsenseAnchorSlot: parseJson<string>(map.get("adsense_anchor_slot"), ""),
      displayEcpm: Number(parseJson<number>(map.get("ads_display_ecpm"), 4.5)),
      rewardedEcpm: Number(parseJson<number>(map.get("ads_rewarded_ecpm"), 14)),
      mediation: mergeMediation(parseJson(map.get("ad_mediation"), [])),
      storageBackend: backend,
      supabaseUrl: supabaseProjectUrl(),
      supabaseProjectRef: supabaseProjectRef(),
      storageHasKey: supabaseHasKey(),
      storageBuckets: [],
      r2AccountId: r2.accountId,
      r2Bucket: r2.bucket,
      r2PublicUrl: r2.publicUrl,
      r2HasKey: await r2Configured(),
      gaId: seo.gaId,
      gscVerification: seo.gscVerification,
      ogImage: seo.ogImage,
    };
  });

export const updateOpsSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      freeDownloadMode: z.enum(["direct", "rewarded_ad"]).optional(),
      maintenanceMode: z.boolean().optional(),
      adsEnabled: z.boolean().optional(),
      rewardedDownloadsEnabled: z.boolean().optional(),
      dailyDownloadLimit: z.number().int().min(1).max(500).optional(),
      creatorSharePercent: z.number().int().min(0).max(100).optional(),
      platformSharePercent: z.number().int().min(0).max(100).optional(),
      featureFlags: z
        .object({
          creator_marketplace_enabled: z.boolean(),
          premium_enabled: z.boolean(),
          rewarded_downloads_enabled: z.boolean(),
          notifications_enabled: z.boolean(),
          recommendations_enabled: z.boolean(),
          lifetime_purchase_enabled: z.boolean(),
        })
        .optional(),
      adsenseClient: z.string().max(80).optional(),
      adsenseBannerSlot: z.string().max(40).optional(),
      adsenseFeedSlot: z.string().max(40).optional(),
      adsenseAnchorSlot: z.string().max(40).optional(),
      displayEcpm: z.number().min(0).max(200).optional(),
      rewardedEcpm: z.number().min(0).max(200).optional(),
      mediation: z
        .array(
          z.object({
            id: z.enum(["adsense", "admob", "applovin_max", "levelplay", "meta", "house"]),
            enabled: z.boolean(),
            priority: z.number(),
            timeoutMs: z.number(),
            ecpmFloor: z.number(),
            publisherId: z.string(),
            sdkKey: z.string(),
            bannerUnit: z.string(),
            feedUnit: z.string(),
            anchorUnit: z.string(),
            rewardedUnit: z.string(),
          }),
        )
        .optional(),
      gaId: z.string().max(40).optional(),
      gscVerification: z.string().max(120).optional(),
      ogImage: z.string().max(180).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireOps(context.userId, true);
    if (
      data.creatorSharePercent !== undefined &&
      data.platformSharePercent !== undefined &&
      data.creatorSharePercent + data.platformSharePercent !== 100
    ) {
      return { ok: false as const, message: "Share percents must add up to 100." };
    }
    const sql = await getSql();
    async function put(key: string, value: unknown) {
      await sql.query(
        `insert into app_settings (key, value) values ($2, $1::jsonb)
         on conflict (key) do update set value = $1::jsonb, updated_at = now()`,
        [JSON.stringify(value), key],
      );
    }
    if (data.freeDownloadMode) await put("free_download_mode", data.freeDownloadMode);
    if (data.maintenanceMode !== undefined) await put("maintenance_mode", data.maintenanceMode);
    if (data.adsEnabled !== undefined) await put("ads_enabled", data.adsEnabled);
    if (data.rewardedDownloadsEnabled !== undefined) {
      await put("rewarded_downloads_enabled", data.rewardedDownloadsEnabled);
    }
    if (data.dailyDownloadLimit !== undefined) await put("daily_download_limit", data.dailyDownloadLimit);
    if (data.creatorSharePercent !== undefined) await put("creator_share_percent", data.creatorSharePercent);
    if (data.platformSharePercent !== undefined) {
      await put("platform_share_percent", data.platformSharePercent);
    }
    if (data.featureFlags) await put("feature_flags", data.featureFlags);
    if (data.adsenseClient !== undefined) await put("adsense_client", data.adsenseClient.trim());
    if (data.adsenseBannerSlot !== undefined) await put("adsense_banner_slot", data.adsenseBannerSlot.trim());
    if (data.adsenseFeedSlot !== undefined) await put("adsense_feed_slot", data.adsenseFeedSlot.trim());
    if (data.adsenseAnchorSlot !== undefined) await put("adsense_anchor_slot", data.adsenseAnchorSlot.trim());
    if (data.displayEcpm !== undefined) await put("ads_display_ecpm", data.displayEcpm);
    if (data.rewardedEcpm !== undefined) await put("ads_rewarded_ecpm", data.rewardedEcpm);
    if (data.mediation) {
      const mediation = mergeMediation(data.mediation);
      await put("ad_mediation", mediation);
      const adsense = mediation.find((n: AdNetworkConfig) => n.id === "adsense");
      if (adsense) {
        await put("adsense_client", adsense.publisherId);
        await put("adsense_banner_slot", adsense.bannerUnit);
        await put("adsense_feed_slot", adsense.feedUnit);
        await put("adsense_anchor_slot", adsense.anchorUnit);
      }
    }
    if (data.gaId !== undefined || data.gscVerification !== undefined || data.ogImage !== undefined) {
      const current = await readSeoSettings();
      await put("seo", {
        gaId: data.gaId !== undefined ? data.gaId.trim() : current.gaId,
        gscVerification: data.gscVerification !== undefined ? data.gscVerification.trim() : current.gscVerification,
        ogImage: data.ogImage !== undefined ? data.ogImage.trim() || "/og.jpg" : current.ogImage,
      });
    }
    return { ok: true as const };
  });

export const connectSupabaseStorage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      url: z.string().url().max(200),
      serviceKey: z.string().min(20).max(4000),
    }),
  )
  .handler(async ({ context }) => {
    await requireOps(context.userId, true);
    return { ok: false as const, message: "Supabase storage is paused. Use Cloudflare R2." };
  });

export const connectR2Storage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      accountId: z.string().trim().min(8).max(64),
      accessKeyId: z.string().trim().min(8).max(128),
      secretAccessKey: z.string().trim().min(8).max(128),
      bucket: z.string().trim().min(3).max(64),
      publicUrl: z.string().trim().max(200).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireOps(context.userId, true);
    const publicUrl = (data.publicUrl ?? "").trim().replace(/\/$/, "");
    if (publicUrl && !/^https:\/\//i.test(publicUrl)) {
      return { ok: false as const, message: "Public URL must start with https://" };
    }
    configureR2({
      accountId: data.accountId.trim(),
      accessKeyId: data.accessKeyId.trim(),
      secretAccessKey: data.secretAccessKey.trim(),
      bucket: data.bucket.trim() || "mrwallpaper",
      publicUrl,
    });
    const ping = await pingR2();
    if (!ping.ok) {
      configureR2({
        accountId: "",
        accessKeyId: "",
        secretAccessKey: "",
        bucket: "mrwallpaper",
        publicUrl: "",
      });
      return { ok: false as const, message: ping.error ?? "Could not reach R2. Check the token and bucket name." };
    }
    const sql = await getSql();
    async function put(key: string, value: unknown) {
      await sql.query(
        `insert into app_settings (key, value) values ($2, $1::jsonb)
         on conflict (key) do update set value = $1::jsonb, updated_at = now()`,
        [JSON.stringify(value), key],
      );
    }
    await put("r2_account_id", data.accountId.trim());
    await put("r2_access_key_id", data.accessKeyId.trim());
    await put("r2_secret_access_key", data.secretAccessKey.trim());
    await put("r2_bucket", data.bucket.trim() || "mrwallpaper");
    await put("r2_public_url", publicUrl);
    return { ok: true as const };
  });

export const listOpsCategories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ items: OpsCategoryRow[] }> => {
    await requireOps(context.userId, true);
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      slug: string;
      name: string;
      sort_order: number;
      is_visible: boolean | number;
      is_featured: boolean | number;
      intro?: string | null;
      seo_title?: string | null;
      seo_description?: string | null;
      alt_text?: string | null;
      canonical_path?: string | null;
      robots?: string | null;
    }>(
      `select id, slug, name, sort_order, is_visible, is_featured,
              intro, seo_title, seo_description, alt_text, canonical_path, robots
       from categories order by sort_order asc, name asc`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        sortOrder: Number(r.sort_order) || 0,
        isVisible: toBool(r.is_visible),
        isFeatured: toBool(r.is_featured),
        intro: r.intro || "",
        seoTitle: r.seo_title || "",
        seoDescription: r.seo_description || "",
        altText: r.alt_text || "",
        canonicalPath: r.canonical_path || "",
        robots: r.robots === "noindex" ? "noindex" : "index",
      })),
    };
  });

export const updateOpsCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string(),
      isVisible: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      slug: z.string().max(80).optional(),
      intro: z.string().max(400).optional(),
      seoTitle: z.string().max(70).optional(),
      seoDescription: z.string().max(180).optional(),
      altText: z.string().max(125).optional(),
      canonicalPath: z.string().max(180).optional(),
      robots: z.enum(["index", "noindex"]).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireOps(context.userId, true);
    const sql = await getSql();
    if (data.isVisible !== undefined) {
      await sql.query(`update categories set is_visible = $1 where id = $2`, [
        data.isVisible,
        data.id,
      ]);
    }
    if (data.isFeatured !== undefined) {
      await sql.query(`update categories set is_featured = $1 where id = $2`, [
        data.isFeatured,
        data.id,
      ]);
    }
    if (data.slug !== undefined) {
      const current = await sql.query<{ slug: string }>(`select slug from categories where id = $1 limit 1`, [data.id]);
      const next = slugify(data.slug, "category");
      const prev = current[0]?.slug;
      if (prev && prev !== next) {
        await recordSeoRedirect(`/wallpapers/${prev}`, `/wallpapers/${next}`);
        await recordSeoRedirect(`/category/${prev}`, `/wallpapers/${next}`);
      }
      await sql.query(`update categories set slug = $1 where id = $2`, [next, data.id]);
    }
    if (data.intro !== undefined) {
      await sql.query(`update categories set intro = $1 where id = $2`, [data.intro, data.id]);
    }
    if (data.seoTitle !== undefined) {
      await sql.query(`update categories set seo_title = $1 where id = $2`, [data.seoTitle, data.id]);
    }
    if (data.seoDescription !== undefined) {
      await sql.query(`update categories set seo_description = $1 where id = $2`, [data.seoDescription, data.id]);
    }
    if (data.altText !== undefined) {
      await sql.query(`update categories set alt_text = $1 where id = $2`, [data.altText, data.id]);
    }
    if (data.canonicalPath !== undefined) {
      await sql.query(`update categories set canonical_path = $1 where id = $2`, [data.canonicalPath, data.id]);
    }
    if (data.robots) {
      await sql.query(`update categories set robots = $1 where id = $2`, [data.robots, data.id]);
    }
    return { ok: true as const };
  });

export const listOpsCollections = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ items: OpsCollectionRow[] }> => {
    await requireOps(context.userId, true);
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      slug: string;
      name: string;
      is_visible: boolean | number;
      wallpaper_count: number;
    }>(
      `select id, slug, name, is_visible,
              (select count(*)::int from collection_wallpapers cw
                where cw.collection_id = collections.id) as wallpaper_count
       from collections order by created_at asc`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        isVisible: toBool(r.is_visible),
        wallpaperCount: Number(r.wallpaper_count) || 0,
      })),
    };
  });

export const updateOpsCollection = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string(), isVisible: z.boolean() }))
  .handler(async ({ context, data }) => {
    await requireOps(context.userId, true);
    const sql = await getSql();
    await sql.query(`update collections set is_visible = $1 where id = $2`, [
      data.isVisible,
      data.id,
    ]);
    return { ok: true as const };
  });

export const listOpsUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ items: OpsUserRow[] }> => {
    await requireOps(context.userId, true);
    const sql = await getSql();
    const rows = await sql.query<{
      user_id: string;
      role: OpsRole;
      status: string;
      email: string | null;
      name: string | null;
      is_premium: number;
    }>(
      `select p.user_id, p.role, p.status, u.email, u.name,
              coalesce((
                select 1 from subscriptions s
                where s.user_id = p.user_id and s.status = 'active'
                  and (s.expires_at is null or s.expires_at > now())
                limit 1
              ), 0)::int as is_premium
       from profiles p
       left join "user" u on u.id = p.user_id
       order by p.created_at desc
       limit 80`,
    );
    return {
      items: rows.map((r) => ({
        userId: r.user_id,
        email: r.email,
        name: r.name,
        role: r.role,
        status: r.status,
        isPremium: r.is_premium === 1,
      })),
    };
  });

export const updateOpsUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      userId: z.string(),
      role: z.enum(["user", "creator", "moderator", "admin"]).optional(),
      status: z.enum(["active", "suspended"]).optional(),
      premium: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireOps(context.userId, true);
    if (data.userId === context.userId && data.role && data.role !== "admin") {
      return { ok: false as const, message: "You cannot demote your own admin role." };
    }
    const sql = await getSql();
    if (data.role) {
      await sql.query(
        `update profiles set role = $1, updated_at = now() where user_id = $2`,
        [data.role, data.userId],
      );
    }
    if (data.status) {
      await sql.query(
        `update profiles set status = $1, updated_at = now() where user_id = $2`,
        [data.status, data.userId],
      );
    }
    if (data.premium === true) {
      await sql.query(
        `update subscriptions set status = 'cancelled', expires_at = now()
         where user_id = $1 and status = 'active'`,
        [data.userId],
      );
      await sql.query(
        `insert into subscriptions (id, user_id, product_id, status, store)
         values ($1, $2, 'admin-gift', 'active', 'admin')`,
        [crypto.randomUUID(), data.userId],
      );
      await notify(
        data.userId,
        "Premium",
        "An operator opened premium on your account.",
        "/app/profile",
      );
    }
    if (data.premium === false) {
      await sql.query(
        `update subscriptions set status = 'cancelled', expires_at = now()
         where user_id = $1 and status = 'active'`,
        [data.userId],
      );
    }
    return { ok: true as const };
  });

export const listOpsCreators = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ items: OpsCreatorRow[] }> => {
    await requireOps(context.userId);
    const sql = await getSql();
    const rows = await sql.query<{
      user_id: string;
      slug: string;
      display_name: string;
      bio: string;
      status: string;
      applied_at: string;
      piece_count: number;
    }>(
      `select cp.user_id, cp.slug, cp.display_name, cp.bio, cp.status, cp.applied_at,
              (select count(*)::int from wallpapers w
                where w.creator_id = cp.user_id and w.status = 'approved') as piece_count
       from creator_profiles cp
       order by
         case cp.status when 'pending' then 0 when 'approved' then 1 else 2 end,
         cp.applied_at desc`,
    );
    return {
      items: rows.map((r) => ({
        userId: r.user_id,
        slug: r.slug,
        displayName: r.display_name,
        bio: r.bio,
        status: r.status,
        appliedAt: r.applied_at,
        pieceCount: Number(r.piece_count) || 0,
      })),
    };
  });

export const reviewOpsCreator = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string(), status: z.enum(["approved", "rejected", "suspended"]) }))
  .handler(async ({ context, data }) => {
    await requireOps(context.userId);
    const sql = await getSql();
    await sql.query(
      `update creator_profiles
          set status = $1, reviewed_at = now()
        where user_id = $2`,
      [data.status, data.userId],
    );
    if (data.status === "approved") {
      await sql.query(
        `update profiles set role = 'creator', updated_at = now()
          where user_id = $1 and role = 'user'`,
        [data.userId],
      );
      await notify(
        data.userId,
        "Your studio is live",
        "You can submit plates from Creator Studio.",
        "/studio",
      );
    } else if (data.status === "rejected") {
      await notify(
        data.userId,
        "Studio application",
        "This application was not approved.",
        "/studio",
      );
    }
    return { ok: true as const };
  });

export const listOpsSubmissions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ items: OpsSubmissionRow[] }> => {
    await requireOps(context.userId);
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      title: string;
      status: string;
      access_type: "free" | "premium";
      created_at: string;
      creator_name: string;
      creator_slug: string;
      thumbnail_url: string | null;
    }>(
      `select w.id, w.title, w.status, w.access_type, w.created_at,
              cp.display_name as creator_name, cp.slug as creator_slug,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from wallpapers w
       join creator_profiles cp on cp.user_id = w.creator_id
       where w.status = 'pending'
       order by w.updated_at desc
       limit 80`,
    );
    return {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        creatorName: r.creator_name,
        creatorSlug: r.creator_slug,
        thumbnailUrl: thumb(r.thumbnail_url, r.id),
        status: r.status,
        accessType: r.access_type,
        createdAt: r.created_at,
      })),
    };
  });

export const reviewOpsSubmission = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string(), status: z.enum(["approved", "rejected"]) }))
  .handler(async ({ context, data }) => {
    await requireOps(context.userId);
    const sql = await getSql();
    const rows = await sql.query<{ creator_id: string; title: string }>(
      `select creator_id, title from wallpapers where id = $1 limit 1`,
      [data.id],
    );
    const row = rows[0];
    if (!row?.creator_id) return { ok: false as const };
    if (data.status === "approved") {
      await sql.query(
        `update wallpapers
            set status = 'approved', published_at = now(), updated_at = now()
          where id = $1`,
        [data.id],
      );
      await notify(
        row.creator_id,
        "Live in the catalog",
        `${row.title} is available to download.`,
        `/wallpaper/${data.id}`,
        data.id,
      );
    } else {
      await sql.query(
        `update wallpapers
            set status = 'draft',
                creator_id = null,
                title = 'Untitled plate',
                description = '',
                published_at = null,
                updated_at = now()
          where id = $1`,
        [data.id],
      );
      await notify(
        row.creator_id,
        "Plate returned",
        `${row.title} was not approved. The composition is back in the drop.`,
        "/studio",
      );
    }
    return { ok: true as const };
  });

import { r as createServerFn } from "./ssr.mjs";
import { H as parseDeviceType, K as readSeoSettings, Q as slugify, Z as resolveThumb, k as getSql, o as authMiddleware, q as recordSeoRedirect, tt as uniqueWallpaperSlug } from "./queries-bIh47-yB.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { n as mergeMediation } from "./ads-DoVQGCTt.mjs";
import { cn as _enum, dn as boolean, gn as object, hn as number, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { l as notify } from "./studio-B5cbP66D.mjs";
import { c as supabaseHasKey, d as configureR2, f as pingR2, i as storageBackend, l as supabaseProjectRef, m as r2Configured, p as r2Config, u as supabaseProjectUrl } from "./storage-BiKnB7Zf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ops-Dwb6I_eO.js
function parseJson(value, fallback) {
	if (value === null || value === void 0) return fallback;
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
	return value;
}
function toBool(v) {
	return v === true || v === 1;
}
var ForbiddenError = class extends Error {
	status = 403;
	constructor() {
		super("Forbidden");
		this.name = "ForbiddenError";
	}
};
async function ensureProfileRow(userId) {
	await (await getSql()).query(`insert into profiles (user_id) values ($1) on conflict (user_id) do nothing`, [userId]);
}
async function loadRole(userId) {
	const sql = await getSql();
	await ensureProfileRow(userId);
	return (await sql.query(`select role, status from profiles where user_id = $1 limit 1`, [userId]))[0] ?? {
		role: "user",
		status: "active"
	};
}
async function adminExists() {
	return ((await (await getSql()).query(`select count(*)::int as n from profiles where role in ('admin', 'moderator')`))[0]?.n ?? 0) > 0;
}
async function requireOps(userId, adminOnly = false) {
	const { role, status } = await loadRole(userId);
	if (status !== "active") throw new ForbiddenError();
	if (adminOnly && role !== "admin") throw new ForbiddenError();
	if (role !== "admin" && role !== "moderator") throw new ForbiddenError();
	return role;
}
function thumb(path, id) {
	return resolveThumb(id, path);
}
var getOpsSession_createServerFn_handler = createServerRpc({
	id: "08bb9c4f4e519365b0094c20c9100e4a2a758aed2de19b36be0a021276ad151e",
	name: "getOpsSession",
	filename: "src/lib/server/ops.ts"
}, (opts) => getOpsSession.__executeServer(opts));
var getOpsSession = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getOpsSession_createServerFn_handler, async ({ context }) => {
	const { role, status } = await loadRole(context.userId);
	const exists = await adminExists();
	const active = status === "active";
	return {
		role,
		canClaim: active && !exists,
		canModerate: active && (role === "admin" || role === "moderator"),
		canAdmin: active && role === "admin"
	};
});
var claimOpsAccess_createServerFn_handler = createServerRpc({
	id: "e105340e7621b60051ab1bc0fd7775d30ad42de3adf3677d7ef649463d9033b8",
	name: "claimOpsAccess",
	filename: "src/lib/server/ops.ts"
}, (opts) => claimOpsAccess.__executeServer(opts));
var claimOpsAccess = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(claimOpsAccess_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	await ensureProfileRow(context.userId);
	if (await adminExists()) throw new ForbiddenError();
	await sql.query(`update profiles set role = 'admin', status = 'active', updated_at = now()
       where user_id = $1`, [context.userId]);
	return {
		role: "admin",
		canClaim: false,
		canModerate: true,
		canAdmin: true
	};
});
var getOpsOverview_createServerFn_handler = createServerRpc({
	id: "d7b132ef1a32e06ae4c686135e172c61b02d9607e091b6df146f9fa49d056f43",
	name: "getOpsOverview",
	filename: "src/lib/server/ops.ts"
}, (opts) => getOpsOverview.__executeServer(opts));
var getOpsOverview = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getOpsOverview_createServerFn_handler, async ({ context }) => {
	await requireOps(context.userId);
	const sql = await getSql();
	const [wp, dl, rp, users, sub, fav, series, top, mix, adsToday, adsAll, adsNet] = await Promise.all([
		sql.query(`select count(*)::int as n,
                count(*) filter (where status = 'approved')::int as approved,
                count(*) filter (where access_type = 'premium')::int as premium,
                count(*) filter (where status in ('pending', 'draft'))::int as pending
         from wallpapers`),
		sql.query(`select
           count(*) filter (where downloaded_at >= now() - interval '1 day')::int as today,
           count(*) filter (
             where downloaded_at >= now() - interval '2 day'
               and downloaded_at < now() - interval '1 day'
           )::int as yesterday,
           count(*)::int as all
         from downloads`),
		sql.query(`select count(*)::int as n from reports where status = 'open'`),
		sql.query(`select count(*)::int as n from profiles`),
		sql.query(`select count(*)::int as n from subscriptions
         where status in ('active', 'grace')
           and (expires_at is null or expires_at > now())`),
		sql.query(`select count(*)::int as n from favorites`),
		sql.query(`select to_char(d::date, 'YYYY-MM-DD') as date,
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
         order by d`),
		sql.query(`select w.id, w.title, w.download_count, w.favorite_count,
                (select a.path from wallpaper_assets a
                  where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
         from wallpapers w
         where w.status = 'approved'
         order by w.download_count desc
         limit 6`),
		sql.query(`select download_type, count(*)::int as n
         from downloads
         where downloaded_at >= current_date - 13
         group by download_type`),
		sql.query(`select count(*) filter (where created_at::date = current_date)::int as n,
                coalesce(sum(revenue_micros) filter (where created_at::date = current_date), 0)::int as revenue,
                count(*) filter (where clicked and created_at::date = current_date)::int as clicks
         from ad_impressions`),
		sql.query(`select coalesce(sum(revenue_micros), 0)::int as revenue from ad_impressions`),
		sql.query(`select network, count(*)::int as n, coalesce(sum(revenue_micros), 0)::int as revenue
         from ad_impressions
         where created_at >= current_date
         group by network`)
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
			premium: Number(r.premium) || 0
		})),
		topWallpapers: top.map((r) => ({
			id: r.id,
			title: r.title,
			thumbnailUrl: thumb(r.thumbnail_url, r.id),
			downloadCount: Number(r.download_count) || 0,
			favoriteCount: Number(r.favorite_count) || 0
		})),
		byType: [
			"free",
			"rewarded",
			"premium"
		].map((type) => ({
			type,
			count: mixMap.get(type) ?? 0
		})),
		adImpressionsToday: Number(adsToday[0]?.n) || 0,
		adRevenueTodayMicros: Number(adsToday[0]?.revenue) || 0,
		adClicksToday: Number(adsToday[0]?.clicks) || 0,
		adRevenueAllMicros: Number(adsAll[0]?.revenue) || 0,
		adByNetwork: adsNet.map((r) => ({
			network: r.network,
			impressions: Number(r.n) || 0,
			revenueMicros: Number(r.revenue) || 0
		}))
	};
});
var listOpsWallpapers_createServerFn_handler = createServerRpc({
	id: "a788275cfdb0a930163030bcddf769d3963cf4d33cb6e5df1066a88b1c06502d",
	name: "listOpsWallpapers",
	filename: "src/lib/server/ops.ts"
}, (opts) => listOpsWallpapers.__executeServer(opts));
var listOpsWallpapers = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({
	status: string().optional(),
	q: string().optional()
}).optional()).handler(listOpsWallpapers_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId);
	const sql = await getSql();
	const params = [];
	const where = [];
	if (data?.status) {
		params.push(data.status);
		where.push(`w.status = $${params.length}`);
	}
	if (data?.q?.trim()) {
		params.push(`%${data.q.trim().toLowerCase()}%`);
		where.push(`(lower(w.title) like $${params.length} or lower(c.name) like $${params.length})`);
	}
	const clause = where.length ? `where ${where.join(" and ")}` : "";
	return { items: (await sql.query(`select w.id, w.slug, w.title, c.name as category_name, w.access_type, w.status,
              w.download_count, w.favorite_count, w.device_type,
              w.seo_title, w.seo_description, w.alt_text, w.canonical_path, w.robots,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from wallpapers w
       join categories c on c.id = w.category_id
       ${clause}
       order by w.updated_at desc
       limit 80`, params)).map((r) => ({
		id: r.id,
		slug: r.slug || r.id,
		title: r.title,
		categoryName: r.category_name,
		accessType: r.access_type,
		status: r.status,
		thumbnailUrl: thumb(r.thumbnail_url, r.id),
		downloadCount: Number(r.download_count) || 0,
		favoriteCount: Number(r.favorite_count) || 0,
		deviceType: parseDeviceType(r.device_type),
		seoTitle: r.seo_title || "",
		seoDescription: r.seo_description || "",
		altText: r.alt_text || "",
		canonicalPath: r.canonical_path || "",
		robots: r.robots === "noindex" ? "noindex" : "index"
	})) };
});
var updateWallpaperOps_createServerFn_handler = createServerRpc({
	id: "f0e5fa9d1e47f655ae21a57804a9b4ddc9cde428c38f1229951ea99e13fde55e",
	name: "updateWallpaperOps",
	filename: "src/lib/server/ops.ts"
}, (opts) => updateWallpaperOps.__executeServer(opts));
var updateWallpaperOps = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	wallpaperId: string(),
	status: _enum([
		"draft",
		"pending",
		"approved",
		"rejected",
		"removed"
	]).optional(),
	accessType: _enum(["free", "premium"]).optional(),
	deviceType: _enum([
		"phone",
		"tablet",
		"both"
	]).optional(),
	slug: string().max(80).optional(),
	seoTitle: string().max(70).optional(),
	seoDescription: string().max(180).optional(),
	altText: string().max(125).optional(),
	canonicalPath: string().max(180).optional(),
	robots: _enum(["index", "noindex"]).optional()
})).handler(updateWallpaperOps_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId);
	const sql = await getSql();
	if (data.status) {
		await sql.query(`update wallpapers set status = $1, updated_at = now() where id = $2`, [data.status, data.wallpaperId]);
		if (data.status === "approved") {
			const row = await sql.query(`select slug, title from wallpapers where id = $1 limit 1`, [data.wallpaperId]);
			if (row[0] && !row[0].slug) {
				const slug = await uniqueWallpaperSlug(slugify(row[0].title || "wallpaper"), data.wallpaperId);
				await sql.query(`update wallpapers set slug = $1, updated_at = now() where id = $2`, [slug, data.wallpaperId]);
			}
		}
	}
	if (data.accessType) await sql.query(`update wallpapers set access_type = $1, updated_at = now() where id = $2`, [data.accessType, data.wallpaperId]);
	if (data.deviceType) await sql.query(`update wallpapers set device_type = $1, updated_at = now() where id = $2`, [data.deviceType, data.wallpaperId]);
	if (data.slug !== void 0) {
		const current = await sql.query(`select slug from wallpapers where id = $1 limit 1`, [data.wallpaperId]);
		const next = await uniqueWallpaperSlug(slugify(data.slug || "wallpaper"), data.wallpaperId);
		const prev = current[0]?.slug;
		if (prev && prev !== next) await recordSeoRedirect(`/wallpaper/${prev}`, `/wallpaper/${next}`);
		await sql.query(`update wallpapers set slug = $1, updated_at = now() where id = $2`, [next, data.wallpaperId]);
	}
	if (data.seoTitle !== void 0) await sql.query(`update wallpapers set seo_title = $1, updated_at = now() where id = $2`, [data.seoTitle, data.wallpaperId]);
	if (data.seoDescription !== void 0) await sql.query(`update wallpapers set seo_description = $1, updated_at = now() where id = $2`, [data.seoDescription, data.wallpaperId]);
	if (data.altText !== void 0) await sql.query(`update wallpapers set alt_text = $1, updated_at = now() where id = $2`, [data.altText, data.wallpaperId]);
	if (data.canonicalPath !== void 0) await sql.query(`update wallpapers set canonical_path = $1, updated_at = now() where id = $2`, [data.canonicalPath, data.wallpaperId]);
	if (data.robots) await sql.query(`update wallpapers set robots = $1, updated_at = now() where id = $2`, [data.robots, data.wallpaperId]);
	return { ok: true };
});
var listOpsFeatured_createServerFn_handler = createServerRpc({
	id: "9a71ed3386f22477557fdf363ffcd326ec2551fec80e3455fb44a08195f4b7ce",
	name: "listOpsFeatured",
	filename: "src/lib/server/ops.ts"
}, (opts) => listOpsFeatured.__executeServer(opts));
var listOpsFeatured = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listOpsFeatured_createServerFn_handler, async ({ context }) => {
	await requireOps(context.userId);
	return { items: (await (await getSql()).query(`select f.id, f.slot, f.wallpaper_id, w.title,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from featured_wallpapers f
       join wallpapers w on w.id = f.wallpaper_id
       where f.starts_at <= now() and (f.ends_at is null or f.ends_at > now())
       order by f.slot, f.priority desc`)).map((r) => ({
		id: r.id,
		slot: r.slot,
		wallpaperId: r.wallpaper_id,
		title: r.title,
		thumbnailUrl: thumb(r.thumbnail_url, r.wallpaper_id)
	})) };
});
var setFeaturedSlot_createServerFn_handler = createServerRpc({
	id: "975abd61456cc9d857fe99bc7d19f47e4c3adac5a1dcab7fcd15a1c8db3b0daf",
	name: "setFeaturedSlot",
	filename: "src/lib/server/ops.ts"
}, (opts) => setFeaturedSlot.__executeServer(opts));
var setFeaturedSlot = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	wallpaperId: string(),
	slot: _enum([
		"wotd",
		"editors_choice",
		"premium_spotlight"
	])
})).handler(setFeaturedSlot_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId);
	const sql = await getSql();
	if (data.slot === "wotd") await sql.query(`delete from featured_wallpapers where slot = 'wotd'`);
	else await sql.query(`delete from featured_wallpapers where slot = $1 and wallpaper_id = $2`, [data.slot, data.wallpaperId]);
	await sql.query(`insert into featured_wallpapers (id, slot, wallpaper_id, starts_at, ends_at, priority)
       values ($1, $2, $3, now(), now() + interval '365 days', 10)`, [
		crypto.randomUUID(),
		data.slot,
		data.wallpaperId
	]);
	return { ok: true };
});
var removeFeaturedSlot_createServerFn_handler = createServerRpc({
	id: "79dce10dd736429715a5fd908ab6f08504fc8d101333446f3c69ee4411cdaeff",
	name: "removeFeaturedSlot",
	filename: "src/lib/server/ops.ts"
}, (opts) => removeFeaturedSlot.__executeServer(opts));
var removeFeaturedSlot = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ id: string() })).handler(removeFeaturedSlot_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId);
	await (await getSql()).query(`delete from featured_wallpapers where id = $1`, [data.id]);
	return { ok: true };
});
var listOpsReports_createServerFn_handler = createServerRpc({
	id: "0be0d1cc24c59b48b8cd7250bd1a906d275d1946e14fd6253a12efa09235a0c1",
	name: "listOpsReports",
	filename: "src/lib/server/ops.ts"
}, (opts) => listOpsReports.__executeServer(opts));
var listOpsReports = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listOpsReports_createServerFn_handler, async ({ context }) => {
	await requireOps(context.userId);
	return { items: (await (await getSql()).query(`select r.id, r.wallpaper_id, w.title, r.reason, r.status, r.created_at,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from reports r
       join wallpapers w on w.id = r.wallpaper_id
       order by r.created_at desc
       limit 60`)).map((r) => ({
		id: r.id,
		wallpaperId: r.wallpaper_id,
		title: r.title,
		thumbnailUrl: thumb(r.thumbnail_url, r.wallpaper_id),
		reason: r.reason,
		status: r.status,
		createdAt: r.created_at
	})) };
});
var updateReportOps_createServerFn_handler = createServerRpc({
	id: "af1df0944923ead1517f7819cd7a50d63733cd60d5bccb153f64ae1f48539508",
	name: "updateReportOps",
	filename: "src/lib/server/ops.ts"
}, (opts) => updateReportOps.__executeServer(opts));
var updateReportOps = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id: string(),
	status: _enum([
		"open",
		"resolved",
		"dismissed"
	])
})).handler(updateReportOps_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId);
	await (await getSql()).query(`update reports set status = $1 where id = $2`, [data.status, data.id]);
	return { ok: true };
});
var getOpsSettings_createServerFn_handler = createServerRpc({
	id: "36b3614e136281bf4d8b315dace4c191404af2ccc770a46b766ce6a0e2fa516a",
	name: "getOpsSettings",
	filename: "src/lib/server/ops.ts"
}, (opts) => getOpsSettings.__executeServer(opts));
var getOpsSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getOpsSettings_createServerFn_handler, async ({ context }) => {
	await requireOps(context.userId, true);
	const rows = await (await getSql()).query(`select key, value from app_settings`);
	const map = new Map(rows.map((r) => [r.key, r.value]));
	const flags = parseJson(map.get("feature_flags"), {
		creator_marketplace_enabled: false,
		premium_enabled: false,
		rewarded_downloads_enabled: true,
		notifications_enabled: false,
		recommendations_enabled: true,
		lifetime_purchase_enabled: true
	});
	const mode = parseJson(map.get("free_download_mode"), "direct");
	const backend = await storageBackend();
	const r2 = await r2Config();
	const seo = await readSeoSettings();
	return {
		freeDownloadMode: mode === "direct" ? "direct" : "rewarded_ad",
		maintenanceMode: parseJson(map.get("maintenance_mode"), false),
		adsEnabled: parseJson(map.get("ads_enabled"), false),
		rewardedDownloadsEnabled: parseJson(map.get("rewarded_downloads_enabled"), true),
		dailyDownloadLimit: Number(parseJson(map.get("daily_download_limit"), 40)),
		creatorSharePercent: Number(parseJson(map.get("creator_share_percent"), 80)),
		platformSharePercent: Number(parseJson(map.get("platform_share_percent"), 20)),
		featureFlags: flags,
		adsenseClient: parseJson(map.get("adsense_client"), ""),
		adsenseBannerSlot: parseJson(map.get("adsense_banner_slot"), ""),
		adsenseFeedSlot: parseJson(map.get("adsense_feed_slot"), ""),
		adsenseAnchorSlot: parseJson(map.get("adsense_anchor_slot"), ""),
		displayEcpm: Number(parseJson(map.get("ads_display_ecpm"), 4.5)),
		rewardedEcpm: Number(parseJson(map.get("ads_rewarded_ecpm"), 14)),
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
		ogImage: seo.ogImage
	};
});
var updateOpsSettings_createServerFn_handler = createServerRpc({
	id: "0e9b1459216cff9a5941c518b9bfffb095636cd5ba758086450de93534551a03",
	name: "updateOpsSettings",
	filename: "src/lib/server/ops.ts"
}, (opts) => updateOpsSettings.__executeServer(opts));
var updateOpsSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	freeDownloadMode: _enum(["direct", "rewarded_ad"]).optional(),
	maintenanceMode: boolean().optional(),
	adsEnabled: boolean().optional(),
	rewardedDownloadsEnabled: boolean().optional(),
	dailyDownloadLimit: number().int().min(1).max(500).optional(),
	creatorSharePercent: number().int().min(0).max(100).optional(),
	platformSharePercent: number().int().min(0).max(100).optional(),
	featureFlags: object({
		creator_marketplace_enabled: boolean(),
		premium_enabled: boolean(),
		rewarded_downloads_enabled: boolean(),
		notifications_enabled: boolean(),
		recommendations_enabled: boolean(),
		lifetime_purchase_enabled: boolean()
	}).optional(),
	adsenseClient: string().max(80).optional(),
	adsenseBannerSlot: string().max(40).optional(),
	adsenseFeedSlot: string().max(40).optional(),
	adsenseAnchorSlot: string().max(40).optional(),
	displayEcpm: number().min(0).max(200).optional(),
	rewardedEcpm: number().min(0).max(200).optional(),
	mediation: array(object({
		id: _enum([
			"adsense",
			"admob",
			"applovin_max",
			"levelplay",
			"meta",
			"house"
		]),
		enabled: boolean(),
		priority: number(),
		timeoutMs: number(),
		ecpmFloor: number(),
		publisherId: string(),
		sdkKey: string(),
		bannerUnit: string(),
		feedUnit: string(),
		anchorUnit: string(),
		rewardedUnit: string()
	})).optional(),
	gaId: string().max(40).optional(),
	gscVerification: string().max(120).optional(),
	ogImage: string().max(180).optional()
})).handler(updateOpsSettings_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId, true);
	if (data.creatorSharePercent !== void 0 && data.platformSharePercent !== void 0 && data.creatorSharePercent + data.platformSharePercent !== 100) return {
		ok: false,
		message: "Share percents must add up to 100."
	};
	const sql = await getSql();
	async function put(key, value) {
		await sql.query(`insert into app_settings (key, value) values ($2, $1::jsonb)
         on conflict (key) do update set value = $1::jsonb, updated_at = now()`, [JSON.stringify(value), key]);
	}
	if (data.freeDownloadMode) await put("free_download_mode", data.freeDownloadMode);
	if (data.maintenanceMode !== void 0) await put("maintenance_mode", data.maintenanceMode);
	if (data.adsEnabled !== void 0) await put("ads_enabled", data.adsEnabled);
	if (data.rewardedDownloadsEnabled !== void 0) await put("rewarded_downloads_enabled", data.rewardedDownloadsEnabled);
	if (data.dailyDownloadLimit !== void 0) await put("daily_download_limit", data.dailyDownloadLimit);
	if (data.creatorSharePercent !== void 0) await put("creator_share_percent", data.creatorSharePercent);
	if (data.platformSharePercent !== void 0) await put("platform_share_percent", data.platformSharePercent);
	if (data.featureFlags) await put("feature_flags", data.featureFlags);
	if (data.adsenseClient !== void 0) await put("adsense_client", data.adsenseClient.trim());
	if (data.adsenseBannerSlot !== void 0) await put("adsense_banner_slot", data.adsenseBannerSlot.trim());
	if (data.adsenseFeedSlot !== void 0) await put("adsense_feed_slot", data.adsenseFeedSlot.trim());
	if (data.adsenseAnchorSlot !== void 0) await put("adsense_anchor_slot", data.adsenseAnchorSlot.trim());
	if (data.displayEcpm !== void 0) await put("ads_display_ecpm", data.displayEcpm);
	if (data.rewardedEcpm !== void 0) await put("ads_rewarded_ecpm", data.rewardedEcpm);
	if (data.mediation) {
		const mediation = mergeMediation(data.mediation);
		await put("ad_mediation", mediation);
		const adsense = mediation.find((n) => n.id === "adsense");
		if (adsense) {
			await put("adsense_client", adsense.publisherId);
			await put("adsense_banner_slot", adsense.bannerUnit);
			await put("adsense_feed_slot", adsense.feedUnit);
			await put("adsense_anchor_slot", adsense.anchorUnit);
		}
	}
	if (data.gaId !== void 0 || data.gscVerification !== void 0 || data.ogImage !== void 0) {
		const current = await readSeoSettings();
		await put("seo", {
			gaId: data.gaId !== void 0 ? data.gaId.trim() : current.gaId,
			gscVerification: data.gscVerification !== void 0 ? data.gscVerification.trim() : current.gscVerification,
			ogImage: data.ogImage !== void 0 ? data.ogImage.trim() || "/og.jpg" : current.ogImage
		});
	}
	return { ok: true };
});
var connectSupabaseStorage_createServerFn_handler = createServerRpc({
	id: "5149fbdd95ab09c7188b97685199e692a8b483fca36700094abfede22ba4be62",
	name: "connectSupabaseStorage",
	filename: "src/lib/server/ops.ts"
}, (opts) => connectSupabaseStorage.__executeServer(opts));
var connectSupabaseStorage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	url: string().url().max(200),
	serviceKey: string().min(20).max(4e3)
})).handler(connectSupabaseStorage_createServerFn_handler, async ({ context }) => {
	await requireOps(context.userId, true);
	return {
		ok: false,
		message: "Supabase storage is paused. Use Cloudflare R2."
	};
});
var connectR2Storage_createServerFn_handler = createServerRpc({
	id: "ce54ba2edd92050801a1416a2f5a05bfbeac4c5c06ac56cf2d2aae547d2c6c2c",
	name: "connectR2Storage",
	filename: "src/lib/server/ops.ts"
}, (opts) => connectR2Storage.__executeServer(opts));
var connectR2Storage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	accountId: string().trim().min(8).max(64),
	accessKeyId: string().trim().min(8).max(128),
	secretAccessKey: string().trim().min(8).max(128),
	bucket: string().trim().min(3).max(64),
	publicUrl: string().trim().max(200).optional()
})).handler(connectR2Storage_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId, true);
	const publicUrl = (data.publicUrl ?? "").trim().replace(/\/$/, "");
	if (publicUrl && !/^https:\/\//i.test(publicUrl)) return {
		ok: false,
		message: "Public URL must start with https://"
	};
	configureR2({
		accountId: data.accountId.trim(),
		accessKeyId: data.accessKeyId.trim(),
		secretAccessKey: data.secretAccessKey.trim(),
		bucket: data.bucket.trim() || "mrwallpaper",
		publicUrl
	});
	const ping = await pingR2();
	if (!ping.ok) {
		configureR2({
			accountId: "",
			accessKeyId: "",
			secretAccessKey: "",
			bucket: "mrwallpaper",
			publicUrl: ""
		});
		return {
			ok: false,
			message: ping.error ?? "Could not reach R2. Check the token and bucket name."
		};
	}
	const sql = await getSql();
	async function put(key, value) {
		await sql.query(`insert into app_settings (key, value) values ($2, $1::jsonb)
         on conflict (key) do update set value = $1::jsonb, updated_at = now()`, [JSON.stringify(value), key]);
	}
	await put("r2_account_id", data.accountId.trim());
	await put("r2_access_key_id", data.accessKeyId.trim());
	await put("r2_secret_access_key", data.secretAccessKey.trim());
	await put("r2_bucket", data.bucket.trim() || "mrwallpaper");
	await put("r2_public_url", publicUrl);
	return { ok: true };
});
var listOpsCategories_createServerFn_handler = createServerRpc({
	id: "0a8414aa8ed5be865f50f67ee8646b9278b627e18962ea636107f42899262df5",
	name: "listOpsCategories",
	filename: "src/lib/server/ops.ts"
}, (opts) => listOpsCategories.__executeServer(opts));
var listOpsCategories = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listOpsCategories_createServerFn_handler, async ({ context }) => {
	await requireOps(context.userId, true);
	return { items: (await (await getSql()).query(`select id, slug, name, sort_order, is_visible, is_featured,
              intro, seo_title, seo_description, alt_text, canonical_path, robots
       from categories order by sort_order asc, name asc`)).map((r) => ({
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
		robots: r.robots === "noindex" ? "noindex" : "index"
	})) };
});
var updateOpsCategory_createServerFn_handler = createServerRpc({
	id: "43f9d059ac4e9ad205fd803eb4617a7481c8c5e40fe1baf5d384082d80570ae1",
	name: "updateOpsCategory",
	filename: "src/lib/server/ops.ts"
}, (opts) => updateOpsCategory.__executeServer(opts));
var updateOpsCategory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id: string(),
	isVisible: boolean().optional(),
	isFeatured: boolean().optional(),
	slug: string().max(80).optional(),
	intro: string().max(400).optional(),
	seoTitle: string().max(70).optional(),
	seoDescription: string().max(180).optional(),
	altText: string().max(125).optional(),
	canonicalPath: string().max(180).optional(),
	robots: _enum(["index", "noindex"]).optional()
})).handler(updateOpsCategory_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId, true);
	const sql = await getSql();
	if (data.isVisible !== void 0) await sql.query(`update categories set is_visible = $1 where id = $2`, [data.isVisible, data.id]);
	if (data.isFeatured !== void 0) await sql.query(`update categories set is_featured = $1 where id = $2`, [data.isFeatured, data.id]);
	if (data.slug !== void 0) {
		const current = await sql.query(`select slug from categories where id = $1 limit 1`, [data.id]);
		const next = slugify(data.slug, "category");
		const prev = current[0]?.slug;
		if (prev && prev !== next) {
			await recordSeoRedirect(`/wallpapers/${prev}`, `/wallpapers/${next}`);
			await recordSeoRedirect(`/category/${prev}`, `/wallpapers/${next}`);
		}
		await sql.query(`update categories set slug = $1 where id = $2`, [next, data.id]);
	}
	if (data.intro !== void 0) await sql.query(`update categories set intro = $1 where id = $2`, [data.intro, data.id]);
	if (data.seoTitle !== void 0) await sql.query(`update categories set seo_title = $1 where id = $2`, [data.seoTitle, data.id]);
	if (data.seoDescription !== void 0) await sql.query(`update categories set seo_description = $1 where id = $2`, [data.seoDescription, data.id]);
	if (data.altText !== void 0) await sql.query(`update categories set alt_text = $1 where id = $2`, [data.altText, data.id]);
	if (data.canonicalPath !== void 0) await sql.query(`update categories set canonical_path = $1 where id = $2`, [data.canonicalPath, data.id]);
	if (data.robots) await sql.query(`update categories set robots = $1 where id = $2`, [data.robots, data.id]);
	return { ok: true };
});
var listOpsCollections_createServerFn_handler = createServerRpc({
	id: "25e67485ccc8b55223bdada7807918a63f47603e755e0bf8a4622c5ff9f97957",
	name: "listOpsCollections",
	filename: "src/lib/server/ops.ts"
}, (opts) => listOpsCollections.__executeServer(opts));
var listOpsCollections = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listOpsCollections_createServerFn_handler, async ({ context }) => {
	await requireOps(context.userId, true);
	return { items: (await (await getSql()).query(`select id, slug, name, is_visible,
              (select count(*)::int from collection_wallpapers cw
                where cw.collection_id = collections.id) as wallpaper_count
       from collections order by created_at asc`)).map((r) => ({
		id: r.id,
		slug: r.slug,
		name: r.name,
		isVisible: toBool(r.is_visible),
		wallpaperCount: Number(r.wallpaper_count) || 0
	})) };
});
var updateOpsCollection_createServerFn_handler = createServerRpc({
	id: "1aa6c02166bad800635162cb3816e4691269de42d9e033b2b4a09230acb8dff9",
	name: "updateOpsCollection",
	filename: "src/lib/server/ops.ts"
}, (opts) => updateOpsCollection.__executeServer(opts));
var updateOpsCollection = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id: string(),
	isVisible: boolean()
})).handler(updateOpsCollection_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId, true);
	await (await getSql()).query(`update collections set is_visible = $1 where id = $2`, [data.isVisible, data.id]);
	return { ok: true };
});
var listOpsUsers_createServerFn_handler = createServerRpc({
	id: "ae9a287018d26de054184287f3bec00a90cb88b5ecbd485b2c9c08f1e6690b4d",
	name: "listOpsUsers",
	filename: "src/lib/server/ops.ts"
}, (opts) => listOpsUsers.__executeServer(opts));
var listOpsUsers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listOpsUsers_createServerFn_handler, async ({ context }) => {
	await requireOps(context.userId, true);
	return { items: (await (await getSql()).query(`select p.user_id, p.role, p.status, u.email, u.name,
              coalesce((
                select 1 from subscriptions s
                where s.user_id = p.user_id and s.status = 'active'
                  and (s.expires_at is null or s.expires_at > now())
                limit 1
              ), 0)::int as is_premium
       from profiles p
       left join "user" u on u.id = p.user_id
       order by p.created_at desc
       limit 80`)).map((r) => ({
		userId: r.user_id,
		email: r.email,
		name: r.name,
		role: r.role,
		status: r.status,
		isPremium: r.is_premium === 1
	})) };
});
var updateOpsUser_createServerFn_handler = createServerRpc({
	id: "b1bbebc6cbe9ca8596e4fd512f18cf9d1767500a6ba064802fa7bd8c8046f5a3",
	name: "updateOpsUser",
	filename: "src/lib/server/ops.ts"
}, (opts) => updateOpsUser.__executeServer(opts));
var updateOpsUser = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	userId: string(),
	role: _enum([
		"user",
		"creator",
		"moderator",
		"admin"
	]).optional(),
	status: _enum(["active", "suspended"]).optional(),
	premium: boolean().optional()
})).handler(updateOpsUser_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId, true);
	if (data.userId === context.userId && data.role && data.role !== "admin") return {
		ok: false,
		message: "You cannot demote your own admin role."
	};
	const sql = await getSql();
	if (data.role) await sql.query(`update profiles set role = $1, updated_at = now() where user_id = $2`, [data.role, data.userId]);
	if (data.status) await sql.query(`update profiles set status = $1, updated_at = now() where user_id = $2`, [data.status, data.userId]);
	if (data.premium === true) {
		await sql.query(`update subscriptions set status = 'cancelled', expires_at = now()
         where user_id = $1 and status = 'active'`, [data.userId]);
		await sql.query(`insert into subscriptions (id, user_id, product_id, status, store)
         values ($1, $2, 'admin-gift', 'active', 'admin')`, [crypto.randomUUID(), data.userId]);
		await notify(data.userId, "Premium", "An operator opened premium on your account.", "/app/profile");
	}
	if (data.premium === false) await sql.query(`update subscriptions set status = 'cancelled', expires_at = now()
         where user_id = $1 and status = 'active'`, [data.userId]);
	return { ok: true };
});
var listOpsCreators_createServerFn_handler = createServerRpc({
	id: "097bc48f778a5db19c3a54dd6f779cf5b2401bf729be224e5832d69f49e4268d",
	name: "listOpsCreators",
	filename: "src/lib/server/ops.ts"
}, (opts) => listOpsCreators.__executeServer(opts));
var listOpsCreators = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listOpsCreators_createServerFn_handler, async ({ context }) => {
	await requireOps(context.userId);
	return { items: (await (await getSql()).query(`select cp.user_id, cp.slug, cp.display_name, cp.bio, cp.status, cp.applied_at,
              (select count(*)::int from wallpapers w
                where w.creator_id = cp.user_id and w.status = 'approved') as piece_count
       from creator_profiles cp
       order by
         case cp.status when 'pending' then 0 when 'approved' then 1 else 2 end,
         cp.applied_at desc`)).map((r) => ({
		userId: r.user_id,
		slug: r.slug,
		displayName: r.display_name,
		bio: r.bio,
		status: r.status,
		appliedAt: r.applied_at,
		pieceCount: Number(r.piece_count) || 0
	})) };
});
var reviewOpsCreator_createServerFn_handler = createServerRpc({
	id: "17c33b67940894524d1957ffe3c91f76ccd45711411fd0969b6179699f4de3ef",
	name: "reviewOpsCreator",
	filename: "src/lib/server/ops.ts"
}, (opts) => reviewOpsCreator.__executeServer(opts));
var reviewOpsCreator = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	userId: string(),
	status: _enum([
		"approved",
		"rejected",
		"suspended"
	])
})).handler(reviewOpsCreator_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId);
	const sql = await getSql();
	await sql.query(`update creator_profiles
          set status = $1, reviewed_at = now()
        where user_id = $2`, [data.status, data.userId]);
	if (data.status === "approved") {
		await sql.query(`update profiles set role = 'creator', updated_at = now()
          where user_id = $1 and role = 'user'`, [data.userId]);
		await notify(data.userId, "Your studio is live", "You can submit plates from Creator Studio.", "/studio");
	} else if (data.status === "rejected") await notify(data.userId, "Studio application", "This application was not approved.", "/studio");
	return { ok: true };
});
var listOpsSubmissions_createServerFn_handler = createServerRpc({
	id: "c9108bde94bb7e773e858091e7b6be8fafb6957702065de1691c0036df4a8036",
	name: "listOpsSubmissions",
	filename: "src/lib/server/ops.ts"
}, (opts) => listOpsSubmissions.__executeServer(opts));
var listOpsSubmissions = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listOpsSubmissions_createServerFn_handler, async ({ context }) => {
	await requireOps(context.userId);
	return { items: (await (await getSql()).query(`select w.id, w.title, w.status, w.access_type, w.created_at,
              cp.display_name as creator_name, cp.slug as creator_slug,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from wallpapers w
       join creator_profiles cp on cp.user_id = w.creator_id
       where w.status = 'pending'
       order by w.updated_at desc
       limit 80`)).map((r) => ({
		id: r.id,
		title: r.title,
		creatorName: r.creator_name,
		creatorSlug: r.creator_slug,
		thumbnailUrl: thumb(r.thumbnail_url, r.id),
		status: r.status,
		accessType: r.access_type,
		createdAt: r.created_at
	})) };
});
var reviewOpsSubmission_createServerFn_handler = createServerRpc({
	id: "ce58930a235be8e41f80482817c071ceb51fa92e601745fc15b573ce1e2fbe33",
	name: "reviewOpsSubmission",
	filename: "src/lib/server/ops.ts"
}, (opts) => reviewOpsSubmission.__executeServer(opts));
var reviewOpsSubmission = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id: string(),
	status: _enum(["approved", "rejected"])
})).handler(reviewOpsSubmission_createServerFn_handler, async ({ context, data }) => {
	await requireOps(context.userId);
	const sql = await getSql();
	const row = (await sql.query(`select creator_id, title from wallpapers where id = $1 limit 1`, [data.id]))[0];
	if (!row?.creator_id) return { ok: false };
	if (data.status === "approved") {
		await sql.query(`update wallpapers
            set status = 'approved', published_at = now(), updated_at = now()
          where id = $1`, [data.id]);
		await notify(row.creator_id, "Live in the catalog", `${row.title} is available to download.`, `/wallpaper/${data.id}`, data.id);
	} else {
		await sql.query(`update wallpapers
            set status = 'draft',
                creator_id = null,
                title = 'Untitled plate',
                description = '',
                published_at = null,
                updated_at = now()
          where id = $1`, [data.id]);
		await notify(row.creator_id, "Plate returned", `${row.title} was not approved. The composition is back in the drop.`, "/studio");
	}
	return { ok: true };
});
//#endregion
export { claimOpsAccess_createServerFn_handler, connectR2Storage_createServerFn_handler, connectSupabaseStorage_createServerFn_handler, getOpsOverview_createServerFn_handler, getOpsSession_createServerFn_handler, getOpsSettings_createServerFn_handler, listOpsCategories_createServerFn_handler, listOpsCollections_createServerFn_handler, listOpsCreators_createServerFn_handler, listOpsFeatured_createServerFn_handler, listOpsReports_createServerFn_handler, listOpsSubmissions_createServerFn_handler, listOpsUsers_createServerFn_handler, listOpsWallpapers_createServerFn_handler, removeFeaturedSlot_createServerFn_handler, reviewOpsCreator_createServerFn_handler, reviewOpsSubmission_createServerFn_handler, setFeaturedSlot_createServerFn_handler, updateOpsCategory_createServerFn_handler, updateOpsCollection_createServerFn_handler, updateOpsSettings_createServerFn_handler, updateOpsUser_createServerFn_handler, updateReportOps_createServerFn_handler, updateWallpaperOps_createServerFn_handler };

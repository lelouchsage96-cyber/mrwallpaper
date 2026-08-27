import { r as createServerFn } from "./ssr.mjs";
import { C as fetchFeaturedIds, D as fetchSitemapEntries, E as fetchSeoRedirect, F as lookupWallpaperRef, I as marketplaceEnabled, K as readSeoSettings, S as fetchDetail, T as fetchPairBySlug, W as premiumEnabled, Y as resolveOriginal, Z as resolveThumb, _ as fetchCardList, b as fetchCollections, k as getSql, m as downloadExt, o as authMiddleware, t as DEVICE_HUBS, v as fetchCardsByIds, w as fetchHomeDuos, x as fetchCreators, y as fetchCategories } from "./queries-bIh47-yB.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as optionalAuthMiddleware } from "./optional-auth-yQgEKcq6.mjs";
import { n as mergeMediation } from "./ads-DoVQGCTt.mjs";
import { cn as _enum, dn as boolean, gn as object, hn as number, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-jLYeWhAD.js
function parseJson(value, fallback) {
	if (value === null || value === void 0) return fallback;
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
	return value;
}
async function settle(label, task, fallback) {
	try {
		return await task;
	} catch (err) {
		console.error(`[home] ${label}`, err);
		return fallback;
	}
}
var PREMIUM_PLANS = [
	{
		id: "monthly",
		label: "Monthly",
		period: "month",
		displayPrice: "$2.99",
		productId: "preview.monthly"
	},
	{
		id: "yearly",
		label: "Yearly",
		period: "year",
		displayPrice: "$19.99",
		productId: "preview.yearly"
	},
	{
		id: "lifetime",
		label: "Lifetime",
		period: "lifetime",
		displayPrice: "$39.99",
		productId: "preview.lifetime"
	}
];
var emptyHome = () => ({
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
	marketplaceOn: false
});
async function isPremiumUser(userId) {
	if (!userId) return false;
	const rows = await (await getSql()).query(`select 1 as ok from subscriptions
     where user_id = $1 and status = 'active'
       and (expires_at is null or expires_at > now())
     limit 1`, [userId]);
	return Boolean(rows[0]);
}
async function readFlags() {
	const raw = (await (await getSql()).query(`select value from app_settings where key = 'feature_flags' limit 1`))[0]?.value;
	return parseJson(raw, {
		creator_marketplace_enabled: false,
		premium_enabled: false,
		rewarded_downloads_enabled: false,
		notifications_enabled: true,
		recommendations_enabled: true,
		lifetime_purchase_enabled: true
	});
}
async function setting(key, fallback) {
	const raw = (await (await getSql()).query(`select value from app_settings where key = $1 limit 1`, [key]))[0]?.value;
	return parseJson(raw, fallback);
}
async function recordView(userId, wallpaperId) {
	if (!userId) return;
	await (await getSql()).query(`insert into wallpaper_views (id, user_id, wallpaper_id) values ($1, $2, $3)`, [
		crypto.randomUUID(),
		userId,
		wallpaperId
	]);
}
async function ensureNotifications(userId) {
	const sql = await getSql();
	if (!(await readFlags()).notifications_enabled) return;
	if (((await sql.query(`select count(*)::int as n from notifications where user_id = $1`, [userId]))[0]?.n ?? 0) > 0) return;
	const wotd = await fetchFeaturedIds("wotd");
	if (wotd[0]) await sql.query(`insert into notifications (id, user_id, kind, title, body, wallpaper_id, href)
       values ($1, $2, 'wotd', 'Wallpaper of the Day', 'A new lock screen is up.', $3, $4)`, [
		crypto.randomUUID(),
		userId,
		wotd[0],
		`/wallpaper/${wotd[0]}`
	]);
	const pair = (await fetchHomeDuos(userId))[0];
	if (pair) await sql.query(`insert into notifications (id, user_id, kind, title, body, wallpaper_id, href)
       values ($1, $2, 'pair', $3, 'A Lock & Home pair, composed to live together.', $4, $5)`, [
		crypto.randomUUID(),
		userId,
		pair.name,
		pair.lock.id,
		`/pair/${pair.slug}`
	]);
}
var getHomeFeed_createServerFn_handler = createServerRpc({
	id: "1605f399a187d105ca3e317418915da40127f4c124f78bf75a36ff34ac41a1f7",
	name: "getHomeFeed",
	filename: "src/lib/server/api.ts"
}, (opts) => getHomeFeed.__executeServer(opts));
var getHomeFeed = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({ tasteIds: array(string()).optional() }).optional()).handler(getHomeFeed_createServerFn_handler, async ({ context, data }) => {
	try {
		const userId = context.userId;
		let tasteIds = data?.tasteIds ?? [];
		const none = [];
		const [categories, collections, trendingRaw, freshRaw, tabletRaw, wotdIds, editorIds, creators, marketOn] = await Promise.all([
			settle("categories", fetchCategories(), []),
			settle("collections", fetchCollections(), []),
			settle("trending", fetchCardList(userId, {
				order: "trending",
				limit: 24,
				device: "phone"
			}), none),
			settle("fresh", fetchCardList(userId, {
				order: "fresh",
				limit: 12,
				device: "phone"
			}), none),
			settle("tablet", fetchCardList(userId, {
				order: "fresh",
				limit: 6,
				device: "tablet"
			}), none),
			settle("wotd", fetchFeaturedIds("wotd"), []),
			settle("editors", fetchFeaturedIds("editors_choice"), []),
			settle("creators", fetchCreators(8), []),
			settle("market", marketplaceEnabled(), false)
		]);
		if (userId) try {
			const saved = await (await getSql()).query(`select category_id from user_tastes where user_id = $1`, [userId]);
			if (saved.length) tasteIds = saved.map((r) => r.category_id);
		} catch (err) {
			console.error("[home] taste", err);
		}
		const [wotd, editors, pairs, recommended] = await Promise.all([
			settle("wotdCards", fetchCardsByIds(wotdIds.slice(0, 1), userId), none),
			settle("editorCards", fetchCardsByIds(editorIds, userId), none),
			settle("duos", fetchHomeDuos(userId, tasteIds), []),
			tasteIds.length >= 3 ? settle("recommended", fetchCardList(userId, {
				order: "trending",
				limit: 8,
				device: "phone",
				categoryIds: tasteIds
			}), none) : Promise.resolve(none)
		]);
		const wotdCard = (wotd[0] && wotd[0].deviceType !== "tablet" ? wotd[0] : null) ?? trendingRaw[0] ?? wotd[0] ?? null;
		const skip = /* @__PURE__ */ new Set();
		if (wotdCard) skip.add(wotdCard.id);
		const trending = trendingRaw.filter((w) => !skip.has(w.id)).slice(0, 16);
		trending.forEach((w) => skip.add(w.id));
		const fresh = freshRaw.filter((w) => !skip.has(w.id)).slice(0, 8);
		let notificationsOn = true;
		let unreadCount = 0;
		let hasTaste = tasteIds.length >= 3;
		if (userId) try {
			const sql = await getSql();
			await ensureNotifications(userId);
			const pref = await sql.query(`select notifications_on from profiles where user_id = $1`, [userId]);
			if (pref[0]) notificationsOn = pref[0].notifications_on === true || pref[0].notifications_on === 1;
			const unread = await sql.query(`select count(*)::int as n from notifications where user_id = $1 and read_at is null`, [userId]);
			unreadCount = Number(unread[0]?.n) || 0;
			hasTaste = ((await sql.query(`select count(*)::int as n from user_tastes where user_id = $1`, [userId]))[0]?.n ?? 0) >= 3;
		} catch (err) {
			console.error("[home] account", err);
		}
		let recent = [];
		if (userId) try {
			const views = await (await getSql()).query(`select wallpaper_id from wallpaper_views
           where user_id = $1 order by viewed_at desc limit 12`, [userId]);
			recent = await fetchCardsByIds([...new Set(views.map((v) => v.wallpaper_id))], userId);
		} catch (err) {
			console.error("[home] recent", err);
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
			marketplaceOn: marketOn
		};
	} catch (err) {
		console.error("[home] feed", err);
		return emptyHome();
	}
});
var getAppConfig_createServerFn_handler = createServerRpc({
	id: "b323fe7712b30b504f1445cf1eefeb87e6eb90b98cd34855d6f18a68d7a07ae0",
	name: "getAppConfig",
	filename: "src/lib/server/api.ts"
}, (opts) => getAppConfig.__executeServer(opts));
var getAppConfig = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).handler(getAppConfig_createServerFn_handler, async ({ context }) => {
	const flags = await readFlags();
	return {
		freeDownloadMode: await setting("free_download_mode", "direct") === "rewarded_ad" ? "rewarded_ad" : "direct",
		maintenanceMode: await setting("maintenance_mode", false),
		adsEnabled: await setting("ads_enabled", false),
		rewardedDownloadsEnabled: flags.rewarded_downloads_enabled,
		dailyDownloadLimit: await setting("daily_download_limit", 40),
		featureFlags: flags,
		premiumPlans: PREMIUM_PLANS,
		isPremium: await isPremiumUser(context.userId),
		adsenseClient: await setting("adsense_client", ""),
		adsenseBannerSlot: await setting("adsense_banner_slot", ""),
		adsenseFeedSlot: await setting("adsense_feed_slot", ""),
		adsenseAnchorSlot: await setting("adsense_anchor_slot", "")
	};
});
var getExploreMeta_createServerFn_handler = createServerRpc({
	id: "16e0e7ce3fed5e42d9e491e906a17f8d430ab66069216e423791016032c0763b",
	name: "getExploreMeta",
	filename: "src/lib/server/api.ts"
}, (opts) => getExploreMeta.__executeServer(opts));
var getExploreMeta = createServerFn({ method: "GET" }).handler(getExploreMeta_createServerFn_handler, async () => {
	try {
		return {
			categories: await fetchCategories(),
			popular: (await (await getSql()).query(`select name from tags order by name asc limit 8`)).map((r) => r.name)
		};
	} catch (err) {
		console.error("[explore] meta", err);
		return {
			categories: [],
			popular: []
		};
	}
});
var searchWallpapers_createServerFn_handler = createServerRpc({
	id: "a6b6891771c945c2acc887e5fdbcb577d9e906cc7ccf7aaa988120562df2c0f4",
	name: "searchWallpapers",
	filename: "src/lib/server/api.ts"
}, (opts) => searchWallpapers.__executeServer(opts));
var searchWallpapers = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({
	q: string().optional(),
	access: _enum(["free", "premium"]).optional(),
	sort: _enum([
		"latest",
		"trending",
		"downloads",
		"favorites"
	]).optional(),
	offset: number().int().min(0).optional(),
	categorySlug: string().optional(),
	device: _enum([
		"all",
		"phone",
		"tablet"
	]).optional()
})).handler(searchWallpapers_createServerFn_handler, async ({ context, data }) => {
	try {
		const cats = await fetchCategories();
		const categoryId = data.categorySlug ? cats.find((c) => c.slug === data.categorySlug)?.id : void 0;
		const order = data.sort === "latest" ? "fresh" : data.sort === "downloads" ? "downloads" : data.sort === "favorites" ? "favorites" : "trending";
		const items = await fetchCardList(context.userId, {
			order,
			limit: 24,
			offset: data.offset ?? 0,
			categoryId,
			access: data.access,
			search: data.q,
			device: data.device ?? "phone"
		});
		return {
			items,
			offset: (data.offset ?? 0) + items.length,
			hasMore: items.length === 24
		};
	} catch (err) {
		console.error("[search]", err);
		return {
			items: [],
			offset: data.offset ?? 0,
			hasMore: false
		};
	}
});
var getCategoryPage_createServerFn_handler = createServerRpc({
	id: "1cb0346450f573813ad138af13aa1e0cf752f06c2af699d5f96afe54864a977c",
	name: "getCategoryPage",
	filename: "src/lib/server/api.ts"
}, (opts) => getCategoryPage.__executeServer(opts));
var getCategoryPage = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({
	slug: string(),
	page: number().int().min(1).optional(),
	offset: number().int().min(0).optional()
})).handler(getCategoryPage_createServerFn_handler, async ({ context, data }) => {
	try {
		const page = data.page ?? (data.offset ? Math.floor(data.offset / 24) + 1 : 1);
		const offset = (page - 1) * 24;
		const slug = data.slug === "bible-verses" ? "bible-verse" : data.slug;
		const category = (await fetchCategories()).find((c) => c.slug === slug) ?? null;
		const hub = DEVICE_HUBS[slug];
		if (!category && !hub && slug !== "all") return {
			category: null,
			hub: null,
			items: [],
			hasMore: false,
			page,
			pages: 0
		};
		const device = hub?.device === "tablet" ? "tablet" : hub?.device === "all" ? "all" : "phone";
		const items = await fetchCardList(context.userId, {
			order: "trending",
			limit: 24,
			offset,
			categoryId: category?.id,
			device
		});
		const extra = await fetchCardList(context.userId, {
			order: "trending",
			limit: 1,
			offset: offset + 24,
			categoryId: category?.id,
			device
		});
		return {
			category,
			hub: hub ? {
				slug,
				name: hub.name,
				intro: hub.intro,
				title: hub.title,
				description: hub.description
			} : null,
			items,
			page,
			hasMore: extra.length > 0,
			pages: extra.length > 0 ? page + 1 : page
		};
	} catch (err) {
		console.error("[category]", err);
		return {
			category: null,
			hub: null,
			items: [],
			hasMore: false,
			page: 1,
			pages: 0
		};
	}
});
var getCollectionPage_createServerFn_handler = createServerRpc({
	id: "cf3aba8f477b649ff956b5dba3e53cd1872c2dd59f6910efa884723835b33c70",
	name: "getCollectionPage",
	filename: "src/lib/server/api.ts"
}, (opts) => getCollectionPage.__executeServer(opts));
var getCollectionPage = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({ slug: string() })).handler(getCollectionPage_createServerFn_handler, async ({ context, data }) => {
	try {
		const collection = (await fetchCollections()).find((c) => c.slug === data.slug) ?? null;
		if (!collection) return {
			collection: null,
			items: []
		};
		const ids = await (await getSql()).query(`select wallpaper_id from collection_wallpapers
         where collection_id = $1 order by sort_order asc`, [collection.id]);
		return {
			collection,
			items: await fetchCardsByIds(ids.map((r) => r.wallpaper_id), context.userId)
		};
	} catch (err) {
		console.error("[collection]", err);
		return {
			collection: null,
			items: []
		};
	}
});
var getWallpaper_createServerFn_handler = createServerRpc({
	id: "d889399279cd715847106f13d4aeeae3606092ea9c855dc53f80d707d10aa78f",
	name: "getWallpaper",
	filename: "src/lib/server/api.ts"
}, (opts) => getWallpaper.__executeServer(opts));
var getWallpaper = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({ id: string() })).handler(getWallpaper_createServerFn_handler, async ({ context, data }) => {
	try {
		const ref = await lookupWallpaperRef(data.id);
		if (!ref) return {
			wallpaper: null,
			related: [],
			pair: null,
			status: "missing"
		};
		if (ref.status === "removed" || ref.status === "rejected") return {
			wallpaper: null,
			related: [],
			pair: null,
			status: "gone"
		};
		const canonical = ref.slug || ref.id;
		const detail = await fetchDetail(ref.id, context.userId);
		if (!detail) return {
			wallpaper: null,
			related: [],
			pair: null,
			status: "missing"
		};
		recordView(context.userId, ref.id).catch(() => void 0);
		const related = (await fetchCardList(context.userId, {
			order: "trending",
			limit: 8,
			categoryId: detail.categoryId,
			device: detail.deviceType === "tablet" ? "tablet" : "phone"
		})).filter((w) => w.id !== ref.id);
		const extra = related.length < 4 ? (await fetchCardList(context.userId, {
			order: "trending",
			limit: 8,
			device: detail.deviceType === "tablet" ? "tablet" : "phone"
		})).filter((w) => w.id !== ref.id && !related.some((r) => r.id === w.id)) : [];
		const hit = (await fetchHomeDuos(context.userId)).find((p) => p.lock.id === ref.id || p.home.id === ref.id);
		return {
			wallpaper: detail,
			related: [...related, ...extra].slice(0, 8),
			pair: hit ? {
				slug: hit.slug,
				name: hit.name,
				role: hit.lock.id === ref.id ? "lock" : "home"
			} : null,
			status: "ok",
			canonicalSlug: canonical
		};
	} catch (err) {
		console.error("[wallpaper]", err);
		return {
			wallpaper: null,
			related: [],
			pair: null,
			status: "missing"
		};
	}
});
var getPublicSeo_createServerFn_handler = createServerRpc({
	id: "c4a6424c954ade7c8890a65e8d6dd41a43935bcd421963e383c5d4bf0c7904c9",
	name: "getPublicSeo",
	filename: "src/lib/server/api.ts"
}, (opts) => getPublicSeo.__executeServer(opts));
var getPublicSeo = createServerFn({ method: "GET" }).handler(getPublicSeo_createServerFn_handler, async () => readSeoSettings());
var getSitemapData_createServerFn_handler = createServerRpc({
	id: "b230fcbe4b5a0588e1cffca3c26aefafb26ece1f61fddae8f0811cac6357a479",
	name: "getSitemapData",
	filename: "src/lib/server/api.ts"
}, (opts) => getSitemapData.__executeServer(opts));
var getSitemapData = createServerFn({ method: "GET" }).handler(getSitemapData_createServerFn_handler, async () => {
	try {
		return await fetchSitemapEntries();
	} catch (err) {
		console.error("[sitemap]", err);
		return {
			wallpapers: [],
			categories: [],
			collections: [],
			creators: [],
			pairs: []
		};
	}
});
var getSeoRedirect_createServerFn_handler = createServerRpc({
	id: "98166246a473c5475e4f73d8d044df1a8241bdb662e27b9119357b01f5100628",
	name: "getSeoRedirect",
	filename: "src/lib/server/api.ts"
}, (opts) => getSeoRedirect.__executeServer(opts));
var getSeoRedirect = createServerFn({ method: "GET" }).validator(object({ path: string() })).handler(getSeoRedirect_createServerFn_handler, async ({ data }) => fetchSeoRedirect(data.path));
var toggleFavorite_createServerFn_handler = createServerRpc({
	id: "ba8bba5228698a967e7d9c541297c7325986b5dc37bb1c57f382674b0b321faa",
	name: "toggleFavorite",
	filename: "src/lib/server/api.ts"
}, (opts) => toggleFavorite.__executeServer(opts));
var toggleFavorite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ wallpaperId: string() })).handler(toggleFavorite_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if ((await sql.query(`select wallpaper_id from favorites where user_id = $1 and wallpaper_id = $2`, [context.userId, data.wallpaperId]))[0]) {
		await sql.query(`delete from favorites where user_id = $1 and wallpaper_id = $2`, [context.userId, data.wallpaperId]);
		await sql.query(`update wallpapers set favorite_count = greatest(favorite_count - 1, 0) where id = $1`, [data.wallpaperId]);
		return { isFavorite: false };
	}
	await sql.query(`insert into favorites (user_id, wallpaper_id) values ($1, $2) on conflict do nothing`, [context.userId, data.wallpaperId]);
	await sql.query(`update wallpapers set favorite_count = favorite_count + 1 where id = $1`, [data.wallpaperId]);
	return { isFavorite: true };
});
var listFavorites_createServerFn_handler = createServerRpc({
	id: "7d83f449782f36974a5bbac554254ad684ee262d660c08000d8dd0a8bf98bc18",
	name: "listFavorites",
	filename: "src/lib/server/api.ts"
}, (opts) => listFavorites.__executeServer(opts));
var listFavorites = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ offset: number().int().min(0).optional() }).optional()).handler(listFavorites_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const offset = data?.offset ?? 0;
	const rows = await sql.query(`select wallpaper_id from favorites where user_id = $1
       order by created_at desc limit 24 offset $2`, [context.userId, offset]);
	const items = await fetchCardsByIds(rows.map((r) => r.wallpaper_id), context.userId);
	return {
		items,
		offset: offset + items.length,
		hasMore: rows.length === 24
	};
});
var getPremiumStatus_createServerFn_handler = createServerRpc({
	id: "99d939a31d42bcc3331bba76b2a50708590375f0634b76fbca355dfa544f826d",
	name: "getPremiumStatus",
	filename: "src/lib/server/api.ts"
}, (opts) => getPremiumStatus.__executeServer(opts));
var getPremiumStatus = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).handler(getPremiumStatus_createServerFn_handler, async ({ context }) => ({ isPremium: await isPremiumUser(context.userId) }));
var activatePreviewPremium_createServerFn_handler = createServerRpc({
	id: "5e4fdfa05550cb0ba2b319fb1d2bc6d971f844deb76e10e302903a428d1f82aa",
	name: "activatePreviewPremium",
	filename: "src/lib/server/api.ts"
}, (opts) => activatePreviewPremium.__executeServer(opts));
var activatePreviewPremium = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ productId: string() })).handler(activatePreviewPremium_createServerFn_handler, async ({ context, data }) => {
	if (!await premiumEnabled()) return { ok: false };
	await (await getSql()).query(`insert into subscriptions (id, user_id, product_id, status, store)
       values ($1, $2, $3, 'active', 'preview')`, [
		crypto.randomUUID(),
		context.userId,
		data.productId
	]);
	return { ok: true };
});
var createAdSession_createServerFn_handler = createServerRpc({
	id: "3e5fd662b09538313eb3562a24f2be5ab1b3c7a99a56c56e6be64458bfa99ad7",
	name: "createAdSession",
	filename: "src/lib/server/api.ts"
}, (opts) => createAdSession.__executeServer(opts));
var createAdSession = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ wallpaperId: string() })).handler(createAdSession_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const id = crypto.randomUUID();
	await sql.query(`insert into download_authorizations (id, user_id, wallpaper_id, expires_at, reason)
       values ($1, $2, $3, now() + interval '20 minutes', 'rewarded')`, [
		id,
		context.userId,
		data.wallpaperId
	]);
	return { adSessionId: id };
});
var requestDownload_createServerFn_handler = createServerRpc({
	id: "d66a0a7d32ce007d51465a2281fcbe3bb1723e611a5647929c712eb204d8c0f0",
	name: "requestDownload",
	filename: "src/lib/server/api.ts"
}, (opts) => requestDownload.__executeServer(opts));
var requestDownload = createServerFn({ method: "POST" }).middleware([optionalAuthMiddleware]).validator(object({
	wallpaperId: string(),
	source: string().optional(),
	adSessionId: string().optional()
})).handler(requestDownload_createServerFn_handler, async ({ context, data }) => {
	if (!context.userId) return { status: "needs_auth" };
	const detail = await fetchDetail(data.wallpaperId, context.userId);
	if (!detail) return {
		status: "error",
		message: "Not found"
	};
	const sql = await getSql();
	const premium = await isPremiumUser(context.userId);
	const mode = await setting("free_download_mode", "direct");
	const flags = await readFlags();
	if (detail.accessType === "premium" && !premium && flags.premium_enabled) return { status: "needs_premium" };
	if (!premium && mode === "rewarded_ad" && flags.rewarded_downloads_enabled && !data.adSessionId) return { status: "needs_ad" };
	if (data.adSessionId) {
		const auth = await sql.query(`select id from download_authorizations
         where id = $1 and user_id = $2 and wallpaper_id = $3
           and consumed_at is null and expires_at > now()
         limit 1`, [
			data.adSessionId,
			context.userId,
			data.wallpaperId
		]);
		if (!auth[0]) return { status: "needs_ad" };
		await sql.query(`update download_authorizations set consumed_at = now() where id = $1`, [auth[0].id]);
	}
	const limit = await setting("daily_download_limit", 40);
	if (((await sql.query(`select count(*)::int as n from downloads
       where user_id = $1 and downloaded_at > now() - interval '1 day'`, [context.userId]))[0]?.n ?? 0) >= limit && !premium) return { status: "rate_limited" };
	const assets = await sql.query(`select path, mime from wallpaper_assets
       where wallpaper_id = $1 and kind = 'original' limit 1`, [data.wallpaperId]);
	const url = resolveOriginal(data.wallpaperId, assets[0]?.path);
	const ext = downloadExt(detail.format);
	const downloadType = premium ? "premium" : data.adSessionId ? "rewarded" : "free";
	await sql.query(`insert into downloads (id, user_id, wallpaper_id, download_type, source, is_premium_user, authorization_id)
       values ($1, $2, $3, $4, $5, $6, $7)`, [
		crypto.randomUUID(),
		context.userId,
		data.wallpaperId,
		downloadType,
		data.source ?? "details",
		premium,
		data.adSessionId ?? null
	]);
	await sql.query(`update wallpapers set download_count = download_count + 1 where id = $1`, [data.wallpaperId]);
	return {
		status: "ok",
		url: `${url}${url.includes("?") ? "&" : "?"}dl=1`,
		filename: `${detail.title.replace(/[^\w]+/g, "-").toLowerCase()}.${ext}`,
		mime: assets[0]?.mime || "image/jpeg",
		isLive: detail.isLive,
		stillUrl: null,
		stillFilename: null
	};
});
var recordAdEvent_createServerFn_handler = createServerRpc({
	id: "1d49de64ef23cada5fb552e217193e68ebd5f3b0f7a83632a401de05467a33b8",
	name: "recordAdEvent",
	filename: "src/lib/server/api.ts"
}, (opts) => recordAdEvent.__executeServer(opts));
var recordAdEvent = createServerFn({ method: "POST" }).middleware([optionalAuthMiddleware]).validator(object({
	placement: string(),
	format: string().optional(),
	creativeId: string().optional(),
	network: string().optional(),
	clicked: boolean().optional()
})).handler(recordAdEvent_createServerFn_handler, async ({ data }) => {
	try {
		await (await getSql()).query(`insert into ad_impressions (id, placement, format, creative_id, network, clicked)
         values ($1, $2, $3, $4, $5, $6)`, [
			crypto.randomUUID(),
			data.placement,
			data.format ?? "display",
			data.creativeId ?? "",
			data.network ?? "house",
			Boolean(data.clicked)
		]);
	} catch {}
	return { ok: true };
});
var getAdContext_createServerFn_handler = createServerRpc({
	id: "4209f42148dbfead55b68ccf32f9ebd0603e932be076b9c288addcaa8c879998",
	name: "getAdContext",
	filename: "src/lib/server/api.ts"
}, (opts) => getAdContext.__executeServer(opts));
var getAdContext = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).handler(getAdContext_createServerFn_handler, async ({ context }) => {
	const adsEnabled = await setting("ads_enabled", false);
	const premium = await isPremiumUser(context.userId);
	const networks = mergeMediation(await setting("ad_mediation", []));
	return {
		showAds: adsEnabled && !premium,
		adsEnabled,
		isPremium: premium,
		adsenseClient: await setting("adsense_client", ""),
		adsenseBannerSlot: await setting("adsense_banner_slot", ""),
		adsenseFeedSlot: await setting("adsense_feed_slot", ""),
		adsenseAnchorSlot: await setting("adsense_anchor_slot", ""),
		displayEcpm: await setting("ads_display_ecpm", 4.5),
		rewardedEcpm: await setting("ads_rewarded_ecpm", 14),
		networks
	};
});
var listDownloads_createServerFn_handler = createServerRpc({
	id: "5ea9c8e128e25315245e8e74c4bd6a1030077718c8a6254668956ff0df455d08",
	name: "listDownloads",
	filename: "src/lib/server/api.ts"
}, (opts) => listDownloads.__executeServer(opts));
var listDownloads = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listDownloads_createServerFn_handler, async ({ context }) => {
	const rows = await (await getSql()).query(`select wallpaper_id, downloaded_at::text as downloaded_at, download_type
       from downloads where user_id = $1 order by downloaded_at desc limit 40`, [context.userId]);
	const cards = await fetchCardsByIds(rows.map((r) => r.wallpaper_id), context.userId);
	const byId = new Map(cards.map((c) => [c.id, c]));
	return { items: rows.map((r) => {
		const card = byId.get(r.wallpaper_id);
		if (!card) return null;
		return {
			...card,
			downloadedAt: r.downloaded_at,
			downloadType: r.download_type
		};
	}).filter((x) => Boolean(x)) };
});
var submitReport_createServerFn_handler = createServerRpc({
	id: "b8afc839a554780d8f35ade61755b25b89b99af6494b1d3cca229204d1e1fa53",
	name: "submitReport",
	filename: "src/lib/server/api.ts"
}, (opts) => submitReport.__executeServer(opts));
var submitReport = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	wallpaperId: string(),
	reason: _enum([
		"copyright",
		"offensive",
		"spam",
		"duplicate",
		"misleading",
		"other"
	]),
	notes: string().max(400).optional()
})).handler(submitReport_createServerFn_handler, async ({ context, data }) => {
	await (await getSql()).query(`insert into reports (id, user_id, wallpaper_id, reason, notes, status)
       values ($1, $2, $3, $4, $5, 'open')`, [
		crypto.randomUUID(),
		context.userId,
		data.wallpaperId,
		data.reason,
		data.notes ?? ""
	]);
	return { ok: true };
});
var ensureProfile_createServerFn_handler = createServerRpc({
	id: "ac0da02bd9a524b586ba676269e60b5c8c652e2dbe21c0751f62aab1b180369d",
	name: "ensureProfile",
	filename: "src/lib/server/api.ts"
}, (opts) => ensureProfile.__executeServer(opts));
var ensureProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(ensureProfile_createServerFn_handler, async ({ context }) => {
	await (await getSql()).query(`insert into profiles (user_id) values ($1) on conflict (user_id) do nothing`, [context.userId]);
	return { ok: true };
});
var getTaste_createServerFn_handler = createServerRpc({
	id: "f50e29058a59ae044e9e05cf30bb8ef88adfaff352b71f27013e72945efc7ab2",
	name: "getTaste",
	filename: "src/lib/server/api.ts"
}, (opts) => getTaste.__executeServer(opts));
var getTaste = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getTaste_createServerFn_handler, async ({ context }) => {
	return { categoryIds: (await (await getSql()).query(`select category_id from user_tastes where user_id = $1`, [context.userId])).map((r) => r.category_id) };
});
var saveTaste_createServerFn_handler = createServerRpc({
	id: "2c4c0f3d5eb27b8987c0ee724e5fadf03e1e9cf8fb65a51dbf61da11e76f1670",
	name: "saveTaste",
	filename: "src/lib/server/api.ts"
}, (opts) => saveTaste.__executeServer(opts));
var saveTaste = createServerFn({ method: "POST" }).middleware([optionalAuthMiddleware]).validator(object({ categoryIds: array(string()).min(3) })).handler(saveTaste_createServerFn_handler, async ({ context, data }) => {
	if (!context.userId) return { ok: true };
	const sql = await getSql();
	await sql.query(`delete from user_tastes where user_id = $1`, [context.userId]);
	for (const id of data.categoryIds) await sql.query(`insert into user_tastes (user_id, category_id) values ($1, $2) on conflict do nothing`, [context.userId, id]);
	return { ok: true };
});
var listNotifications_createServerFn_handler = createServerRpc({
	id: "c3972ee4d0736a00df2095b11cc29da4af69edc7462b684c3b8b7d301bd86b49",
	name: "listNotifications",
	filename: "src/lib/server/api.ts"
}, (opts) => listNotifications.__executeServer(opts));
var listNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listNotifications_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	await ensureNotifications(context.userId);
	const pref = await sql.query(`select notifications_on from profiles where user_id = $1`, [context.userId]);
	const on = pref[0] ? pref[0].notifications_on === true || pref[0].notifications_on === 1 : true;
	const rows = await sql.query(`select id, kind, title, body, href, wallpaper_id, read_at::text as read_at, created_at::text as created_at
       from notifications where user_id = $1 order by created_at desc limit 40`, [context.userId]);
	const thumbs = await fetchCardsByIds(rows.map((r) => r.wallpaper_id).filter((x) => Boolean(x)), context.userId);
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
			thumbnailUrl: r.wallpaper_id ? byId.get(r.wallpaper_id)?.thumbnailUrl ?? resolveThumb(r.wallpaper_id) : null,
			read: Boolean(r.read_at),
			createdAt: r.created_at
		}))
	};
});
var markNotificationsRead_createServerFn_handler = createServerRpc({
	id: "feafd6ce3fd421d62eb31b119e9ea77c42b624f16a4b8fc15b251338d0d527d9",
	name: "markNotificationsRead",
	filename: "src/lib/server/api.ts"
}, (opts) => markNotificationsRead.__executeServer(opts));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ id: string().optional() }).optional()).handler(markNotificationsRead_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (data?.id) await sql.query(`update notifications set read_at = now() where id = $1 and user_id = $2`, [data.id, context.userId]);
	else await sql.query(`update notifications set read_at = now() where user_id = $1 and read_at is null`, [context.userId]);
	return { ok: true };
});
var updateNotificationPref_createServerFn_handler = createServerRpc({
	id: "1bb7b555d601b6bea1071a995be62a1c2a66a3c1929b6000a0244bb98bba5b99",
	name: "updateNotificationPref",
	filename: "src/lib/server/api.ts"
}, (opts) => updateNotificationPref.__executeServer(opts));
var updateNotificationPref = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ on: boolean() })).handler(updateNotificationPref_createServerFn_handler, async ({ context, data }) => {
	await (await getSql()).query(`insert into profiles (user_id, notifications_on) values ($1, $2)
       on conflict (user_id) do update set notifications_on = $2, updated_at = now()`, [context.userId, data.on]);
	return {
		ok: true,
		on: data.on
	};
});
var deleteAccountData_createServerFn_handler = createServerRpc({
	id: "8b32ff801b2fbb57c4e3fce98c84e3edf1c16b6db798d07bee6ef684cd4fde42",
	name: "deleteAccountData",
	filename: "src/lib/server/api.ts"
}, (opts) => deleteAccountData.__executeServer(opts));
var deleteAccountData = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(deleteAccountData_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const uid = context.userId;
	await sql.query(`delete from favorites where user_id = $1`, [uid]);
	await sql.query(`delete from downloads where user_id = $1`, [uid]);
	await sql.query(`delete from notifications where user_id = $1`, [uid]);
	await sql.query(`delete from user_tastes where user_id = $1`, [uid]);
	await sql.query(`delete from wallpaper_views where user_id = $1`, [uid]);
	await sql.query(`delete from profiles where user_id = $1`, [uid]);
	return { ok: true };
});
var getPairPage_createServerFn_handler = createServerRpc({
	id: "a5728ec5cbcead57812362253000e6329d18c29395a5ac68378f0dbb44423ee5",
	name: "getPairPage",
	filename: "src/lib/server/api.ts"
}, (opts) => getPairPage.__executeServer(opts));
var getPairPage = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({ slug: string() })).handler(getPairPage_createServerFn_handler, async ({ context, data }) => {
	try {
		return { pair: await fetchPairBySlug(data.slug, context.userId) };
	} catch (err) {
		console.error("[pair]", err);
		return { pair: null };
	}
});
//#endregion
export { activatePreviewPremium_createServerFn_handler, createAdSession_createServerFn_handler, deleteAccountData_createServerFn_handler, ensureProfile_createServerFn_handler, getAdContext_createServerFn_handler, getAppConfig_createServerFn_handler, getCategoryPage_createServerFn_handler, getCollectionPage_createServerFn_handler, getExploreMeta_createServerFn_handler, getHomeFeed_createServerFn_handler, getPairPage_createServerFn_handler, getPremiumStatus_createServerFn_handler, getPublicSeo_createServerFn_handler, getSeoRedirect_createServerFn_handler, getSitemapData_createServerFn_handler, getTaste_createServerFn_handler, getWallpaper_createServerFn_handler, listDownloads_createServerFn_handler, listFavorites_createServerFn_handler, listNotifications_createServerFn_handler, markNotificationsRead_createServerFn_handler, recordAdEvent_createServerFn_handler, requestDownload_createServerFn_handler, saveTaste_createServerFn_handler, searchWallpapers_createServerFn_handler, submitReport_createServerFn_handler, toggleFavorite_createServerFn_handler, updateNotificationPref_createServerFn_handler };

import { r as createServerFn } from "./ssr.mjs";
import { o as authMiddleware } from "./queries-bIh47-yB.mjs";
import { cn as _enum, dn as boolean, gn as object, hn as number, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { r as createSsrRpc } from "./studio-B5cbP66D.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ops-C_QDXn1-.js
var getOpsSession = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("08bb9c4f4e519365b0094c20c9100e4a2a758aed2de19b36be0a021276ad151e"));
var claimOpsAccess = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("e105340e7621b60051ab1bc0fd7775d30ad42de3adf3677d7ef649463d9033b8"));
var getOpsOverview = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("d7b132ef1a32e06ae4c686135e172c61b02d9607e091b6df146f9fa49d056f43"));
var listOpsWallpapers = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({
	status: string().optional(),
	q: string().optional()
}).optional()).handler(createSsrRpc("a788275cfdb0a930163030bcddf769d3963cf4d33cb6e5df1066a88b1c06502d"));
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
})).handler(createSsrRpc("f0e5fa9d1e47f655ae21a57804a9b4ddc9cde428c38f1229951ea99e13fde55e"));
var listOpsFeatured = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("9a71ed3386f22477557fdf363ffcd326ec2551fec80e3455fb44a08195f4b7ce"));
var setFeaturedSlot = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	wallpaperId: string(),
	slot: _enum([
		"wotd",
		"editors_choice",
		"premium_spotlight"
	])
})).handler(createSsrRpc("975abd61456cc9d857fe99bc7d19f47e4c3adac5a1dcab7fcd15a1c8db3b0daf"));
var removeFeaturedSlot = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ id: string() })).handler(createSsrRpc("79dce10dd736429715a5fd908ab6f08504fc8d101333446f3c69ee4411cdaeff"));
var listOpsReports = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("0be0d1cc24c59b48b8cd7250bd1a906d275d1946e14fd6253a12efa09235a0c1"));
var updateReportOps = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id: string(),
	status: _enum([
		"open",
		"resolved",
		"dismissed"
	])
})).handler(createSsrRpc("af1df0944923ead1517f7819cd7a50d63733cd60d5bccb153f64ae1f48539508"));
var getOpsSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("36b3614e136281bf4d8b315dace4c191404af2ccc770a46b766ce6a0e2fa516a"));
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
})).handler(createSsrRpc("0e9b1459216cff9a5941c518b9bfffb095636cd5ba758086450de93534551a03"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	url: string().url().max(200),
	serviceKey: string().min(20).max(4e3)
})).handler(createSsrRpc("5149fbdd95ab09c7188b97685199e692a8b483fca36700094abfede22ba4be62"));
var connectR2Storage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	accountId: string().trim().min(8).max(64),
	accessKeyId: string().trim().min(8).max(128),
	secretAccessKey: string().trim().min(8).max(128),
	bucket: string().trim().min(3).max(64),
	publicUrl: string().trim().max(200).optional()
})).handler(createSsrRpc("ce54ba2edd92050801a1416a2f5a05bfbeac4c5c06ac56cf2d2aae547d2c6c2c"));
var listOpsCategories = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("0a8414aa8ed5be865f50f67ee8646b9278b627e18962ea636107f42899262df5"));
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
})).handler(createSsrRpc("43f9d059ac4e9ad205fd803eb4617a7481c8c5e40fe1baf5d384082d80570ae1"));
var listOpsCollections = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("25e67485ccc8b55223bdada7807918a63f47603e755e0bf8a4622c5ff9f97957"));
var updateOpsCollection = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id: string(),
	isVisible: boolean()
})).handler(createSsrRpc("1aa6c02166bad800635162cb3816e4691269de42d9e033b2b4a09230acb8dff9"));
var listOpsUsers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("ae9a287018d26de054184287f3bec00a90cb88b5ecbd485b2c9c08f1e6690b4d"));
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
})).handler(createSsrRpc("b1bbebc6cbe9ca8596e4fd512f18cf9d1767500a6ba064802fa7bd8c8046f5a3"));
var listOpsCreators = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("097bc48f778a5db19c3a54dd6f779cf5b2401bf729be224e5832d69f49e4268d"));
var reviewOpsCreator = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	userId: string(),
	status: _enum([
		"approved",
		"rejected",
		"suspended"
	])
})).handler(createSsrRpc("17c33b67940894524d1957ffe3c91f76ccd45711411fd0969b6179699f4de3ef"));
var listOpsSubmissions = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("c9108bde94bb7e773e858091e7b6be8fafb6957702065de1691c0036df4a8036"));
var reviewOpsSubmission = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id: string(),
	status: _enum(["approved", "rejected"])
})).handler(createSsrRpc("ce58930a235be8e41f80482817c071ceb51fa92e601745fc15b573ce1e2fbe33"));
//#endregion
export { updateWallpaperOps as C, updateReportOps as S, setFeaturedSlot as _, getOpsSettings as a, updateOpsSettings as b, listOpsCreators as c, listOpsSubmissions as d, listOpsUsers as f, reviewOpsSubmission as g, reviewOpsCreator as h, getOpsSession as i, listOpsFeatured as l, removeFeaturedSlot as m, connectR2Storage as n, listOpsCategories as o, listOpsWallpapers as p, getOpsOverview as r, listOpsCollections as s, claimOpsAccess as t, listOpsReports as u, updateOpsCategory as v, updateOpsUser as x, updateOpsCollection as y };

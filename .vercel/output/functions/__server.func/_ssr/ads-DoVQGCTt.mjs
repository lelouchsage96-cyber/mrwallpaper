//#region node_modules/.nitro/vite/services/ssr/assets/ads-DoVQGCTt.js
var AD_NETWORK_META = {
	adsense: {
		label: "Google AdSense",
		surface: "web",
		hint: "Serves in this web app. Publisher ID looks like ca-pub-…"
	},
	admob: {
		label: "Google AdMob",
		surface: "native",
		hint: "Mediation host for iPhone and Android. App ID looks like ca-app-pub-…~…"
	},
	applovin_max: {
		label: "AppLovin MAX",
		surface: "native",
		hint: "Highest-yield waterfall for rewarded and banners on device."
	},
	levelplay: {
		label: "Unity LevelPlay",
		surface: "native",
		hint: "ironSource mediation. Strong on rewarded video."
	},
	meta: {
		label: "Meta Audience Network",
		surface: "native",
		hint: "Usually added under MAX or AdMob, not as the only SDK."
	},
	house: {
		label: "House ads",
		surface: "all",
		hint: "Always fills. Promotes Premium, Live, and Studio when networks miss."
	}
};
var DEFAULT_MEDIATION = [
	{
		id: "adsense",
		enabled: true,
		priority: 1,
		timeoutMs: 2500,
		ecpmFloor: 2,
		publisherId: "",
		sdkKey: "",
		bannerUnit: "",
		feedUnit: "",
		anchorUnit: "",
		rewardedUnit: ""
	},
	{
		id: "admob",
		enabled: false,
		priority: 2,
		timeoutMs: 3e3,
		ecpmFloor: 4,
		publisherId: "",
		sdkKey: "",
		bannerUnit: "",
		feedUnit: "",
		anchorUnit: "",
		rewardedUnit: ""
	},
	{
		id: "applovin_max",
		enabled: false,
		priority: 3,
		timeoutMs: 3e3,
		ecpmFloor: 6,
		publisherId: "",
		sdkKey: "",
		bannerUnit: "",
		feedUnit: "",
		anchorUnit: "",
		rewardedUnit: ""
	},
	{
		id: "levelplay",
		enabled: false,
		priority: 4,
		timeoutMs: 3e3,
		ecpmFloor: 5,
		publisherId: "",
		sdkKey: "",
		bannerUnit: "",
		feedUnit: "",
		anchorUnit: "",
		rewardedUnit: ""
	},
	{
		id: "meta",
		enabled: false,
		priority: 5,
		timeoutMs: 2500,
		ecpmFloor: 3,
		publisherId: "",
		sdkKey: "",
		bannerUnit: "",
		feedUnit: "",
		anchorUnit: "",
		rewardedUnit: ""
	},
	{
		id: "house",
		enabled: true,
		priority: 99,
		timeoutMs: 0,
		ecpmFloor: 0,
		publisherId: "",
		sdkKey: "",
		bannerUnit: "",
		feedUnit: "",
		anchorUnit: "",
		rewardedUnit: ""
	}
];
function mergeMediation(stored) {
	const list = Array.isArray(stored) ? stored : [];
	const byId = /* @__PURE__ */ new Map();
	for (const row of list) if (row && typeof row === "object" && "id" in row) byId.set(String(row.id), row);
	return DEFAULT_MEDIATION.map((base) => {
		const extra = byId.get(base.id) ?? {};
		return {
			...base,
			...extra,
			id: base.id
		};
	}).sort((a, b) => a.priority - b.priority);
}
//#endregion
export { mergeMediation as n, AD_NETWORK_META as t };

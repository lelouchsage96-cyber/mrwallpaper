import { o as __toESM } from "../_runtime.mjs";
import { H as notFound, U as require_react, _ as createRootRoute, b as useRouter, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, x as require_jsx_runtime, z as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as __exportAll, r as createServerFn } from "./ssr.mjs";
import { A as imageObjectJsonLd, I as marketplaceEnabled, J as resolveHero, N as itemListJsonLd, P as loadPublicPlate, R as noindexHead, V as pageHead, a as absUrl, at as websiteJsonLd, i as SITE_URL, it as wallpaperPath, k as getSql, l as categoryMeta, n as HOME_DESCRIPTION, o as authMiddleware, ot as brand, r as HOME_TITLE, rt as wallpaperMeta, s as breadcrumbJsonLd, t as DEVICE_HUBS, u as categoryPath, z as organizationJsonLd } from "./queries-bIh47-yB.mjs";
import { t as optionalAuthMiddleware } from "./optional-auth-yQgEKcq6.mjs";
import { bn as union, cn as _enum, dn as boolean, gn as object, hn as number, pn as literal, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as getCreatorPage, r as createSsrRpc, s as listCreators } from "./studio-B5cbP66D.mjs";
import { r as auth, t as requireUserId } from "./verify.server-DYWA13FN.mjs";
import { o as storeStudioOriginal, s as storeStudioPart, t as loadMediaFile } from "./storage-BiKnB7Zf.mjs";
import { a as TriangleAlert } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/en-BEUY2K6Y.js
var t = {
	appName: "Mr Wallpapers",
	tagline: "Your Screen. Your Style.",
	splashAria: "Mr Wallpapers is loading",
	onboarding: {
		skip: "Skip",
		next: "Next",
		getStarted: "Get Started",
		screens: [
			{
				headline: "Beautiful wallpapers, every day.",
				description: "High-quality wallpapers for your phone and tablet."
			},
			{
				headline: "Your Screen. Your Style.",
				description: "Find wallpapers that match your personality."
			},
			{
				headline: "Go beyond ordinary.",
				description: "HD and 4K phone plates, ready for lock, home, and iPad."
			}
		]
	},
	nav: {
		home: "Home",
		explore: "Explore",
		favorites: "Favorites",
		premium: "Premium",
		profile: "Profile"
	},
	auth: {
		title: "Welcome back",
		subtitle: "Sign in to save favorites and download wallpapers.",
		signIn: "Sign in",
		signUp: "Create account",
		signOut: "Sign out",
		email: "Email",
		password: "Password",
		name: "Name",
		continueWith: "Continue with",
		orEmail: "or continue with email",
		noAccount: "New here?",
		hasAccount: "Already have an account?",
		guest: "Continue browsing",
		forgot: "Forgot password?",
		resetTitle: "Reset password",
		resetHint: "Enter your email and we will send a reset link if an account exists.",
		resetSend: "Send reset link",
		resetSent: "If an account exists for that email, a reset link is on its way.",
		needAccount: "Create your account",
		passwordHint: "At least 8 characters",
		error: "Something went wrong. Please try again.",
		invalid: "Check your email and password."
	},
	home: {
		search: "Search",
		notifications: "Notifications",
		trending: "Trending Now",
		fresh: "Fresh Wallpapers",
		recommended: "Recommended For You",
		categories: "Categories",
		premium: "Mr Wallpapers Premium",
		editors: "Editor's Choice",
		wotd: "Wallpaper of the Day",
		recent: "Recently Viewed",
		seeAll: "See all",
		collections: "Collections",
		wallpaperCount: "{n} wallpapers",
		pairs: "Lock & Home",
		forYou: "For You",
		creators: "Creators",
		live: "Live for iPhone",
		tablet: "For iPad & Tablets",
		positioning: "High-quality wallpapers for your phone and tablet."
	},
	explore: {
		title: "Explore",
		placeholder: "Search wallpapers...",
		empty: "No wallpapers match that search.",
		loadMore: "Load more",
		popularSearches: "Popular searches",
		categories: "Categories",
		device: {
			all: "All",
			phone: "Phone",
			tablet: "Tablet"
		},
		sort: {
			latest: "Latest",
			trending: "Trending",
			downloads: "Most Downloaded",
			favorites: "Most Favorited"
		},
		filters: {
			all: "All",
			free: "Free",
			premium: "Premium",
			latest: "Latest",
			popular: "Popular",
			downloads: "Most Downloaded"
		}
	},
	wallpaper: {
		favorite: "Favorite",
		unfavorite: "Remove favorite",
		download: "Download",
		share: "Share",
		report: "Report",
		related: "You May Also Like",
		premiumBadge: "Premium",
		freeBadge: "Free",
		resolution: "Resolution",
		fileSize: "File size",
		downloads: "Downloads",
		favorites: "Favorites",
		category: "Category",
		creator: "Creator",
		tags: "Tags",
		byPlatform: "Mr Wallpapers",
		previewLock: "Lock screen",
		previewHome: "Home screen",
		partOf: "Part of",
		liveBadge: "Live",
		liveHint: "Live wallpaper for iPhone. Save the Live Photo pair, then set it on your Lock Screen.",
		designedPhone: "Designed for Phones",
		designedTablet: "Designed for iPad & Tablets",
		designedBoth: "Available for Phone & Tablet",
		orientation: "Orientation",
		device: "Device",
		portrait: "Portrait",
		landscape: "Landscape",
		downloadPhone: "Download Phone Wallpaper",
		downloadTablet: "Download Tablet Wallpaper",
		downloadBoth: "Download for Phone & Tablet"
	},
	download: {
		title: "Download wallpaper",
		freeDirect: "Download this wallpaper to your device.",
		watchAd: "Watch a short ad to download.",
		watchCta: "Watch ad",
		adPreview: "Preview advertisement",
		adBody: "In the native app this is a rewarded ad. This preview simulates the wait, then authorizes the download on the server.",
		skipWait: "Ad complete",
		needsPremium: "This wallpaper is part of Mr Wallpapers Premium.",
		unlock: "Unlock Premium",
		needsAuth: "Sign in to download wallpapers.",
		rateLimited: "You have reached today's download limit. Try again tomorrow.",
		failed: "Download could not be completed. Please try again.",
		saving: "Saving…",
		liveTitle: "Save Live wallpaper",
		liveDirect: "This saves an iPhone Live Photo pair — a still and the motion clip — so you can set it on Lock Screen.",
		saveIphone: "Save to iPhone",
		savePack: "Download Live Photo pack",
		saved: "Saved. Set it on your iPhone:",
		iphone1: "In the share sheet, tap Save Video and Save Image (or Save to Files).",
		iphone2: "Open Photos. If you see LIVE on the still, tap Share → Use as Wallpaper.",
		iphone3: "Set Lock Screen and turn Live Photo on at the top. Press and hold the lock screen to play it.",
		iphone4: "Home Screen uses the still — that’s how iOS works. The motion lives on Lock Screen.",
		packHint: "The pack is a JPG + MOV with the same name. Keep them together."
	},
	ads: {
		sponsored: "Ad",
		ad: "Advertisement",
		rewardedTitle: "Go Premium",
		rewardedBody: "This short ad keeps free downloads open. Premium removes ads.",
		remaining: "{n}s",
		ready: "Reward ready",
		wait: "Watching…"
	},
	favorites: {
		title: "Favorites",
		empty: "Save wallpapers you love. They will live here.",
		signIn: "Sign in to sync favorites across devices."
	},
	premium: {
		brand: "Mr Wallpapers Premium",
		headline: "Unlock the Ultimate Wallpaper Experience",
		restore: "Restore purchases",
		terms: "Subscriptions renew until cancelled. Prices come from the store in the native app.",
		preview: "Continue",
		previewNote: "Store billing (RevenueCat) ships with the native app. This preview grants a local Premium entitlement so you can try the experience.",
		active: "Premium is active on this account.",
		catalog: "Premium wallpapers",
		browse: "Browse all premium",
		benefits: [
			"HD & 4K wallpapers",
			"No ads",
			"Exclusive collections",
			"Unlimited premium downloads",
			"New premium wallpapers",
			"Premium-only categories"
		],
		monthly: "Monthly",
		yearly: "Yearly",
		lifetime: "Lifetime",
		perMonth: "per month",
		perYear: "per year",
		oneTime: "one-time"
	},
	profile: {
		title: "Profile",
		guest: "Guest",
		guestHint: "Sign in to save favorites, downloads, and Premium.",
		downloads: "Download History",
		favorites: "Favorites",
		settings: "Settings",
		appearance: "Appearance",
		themeSystem: "System",
		themeDark: "Dark",
		themeLight: "Light",
		notifications: "Notifications",
		legal: "Legal",
		privacy: "Privacy Policy",
		terms: "Terms",
		copyright: "Copyright Policy",
		guidelines: "Content Guidelines",
		delete: "Delete account",
		deleteConfirm: "Delete your Mr Wallpapers data? This cannot be undone.",
		deleteHint: "Your favorites, downloads, and profile data on Mr Wallpapers will be removed.",
		emptyDownloads: "No downloads yet.",
		signedInAs: "Signed in as",
		seeHistory: "View all",
		ops: "Admin dashboard",
		opsHint: "Catalog, reports, accounts, and studio settings.",
		taste: "Your look",
		tasteHint: "Categories that tune For You.",
		notificationsOn: "Notifications",
		studio: "Creator Studio",
		studioHint: "Apply, submit plates, and follow estimated share.",
		studioPending: "Application in review"
	},
	history: {
		title: "Download History",
		empty: "No downloads yet.",
		signIn: "Sign in to keep a history of your downloads.",
		types: {
			free: "Free",
			rewarded: "Rewarded",
			premium: "Premium"
		}
	},
	legal: { draft: "Draft for legal review. Not legal advice and not a claim of compliance." },
	errors: {
		generic: "Something went wrong.",
		retry: "Try again",
		offline: "You appear to be offline.",
		notFound: "This wallpaper is no longer available.",
		empty: "Nothing here yet."
	},
	report: {
		title: "Report wallpaper",
		submit: "Submit report",
		thanks: "Thank you. We will review this.",
		reasons: {
			copyright: "Copyright",
			offensive: "Offensive",
			spam: "Spam",
			duplicate: "Duplicate",
			misleading: "Misleading",
			other: "Other"
		}
	},
	maintenance: { title: "Mr Wallpapers is temporarily unavailable for maintenance." },
	update: { title: "Please update Mr Wallpapers to continue." },
	shareCopied: "Link copied",
	close: "Close",
	cancel: "Cancel",
	done: "Done",
	save: "Save",
	preview: {
		lock: "Lock",
		home: "Home",
		live: "On your screen"
	},
	pairs: {
		title: "Lock & Home",
		lock: "Lock",
		home: "Home",
		openLock: "View lock",
		openHome: "View home",
		empty: "No pairs yet.",
		today: "Today",
		suggested: "Suggested duos",
		suggestedHint: "Best lock and home pairings from this creator, refreshed daily.",
		homeHint: "Suggested duos, refreshed daily."
	},
	notifications: {
		title: "Notifications",
		empty: "You're all caught up.",
		signIn: "Sign in to get Wallpaper of the Day and new Lock & Home pairs.",
		signInTitle: "Your inbox",
		markAll: "Mark all read",
		off: "Notifications are paused on this account.",
		turnOn: "Turn on"
	},
	taste: {
		title: "Choose your look",
		hint: "Pick at least three categories. We'll tune For You.",
		save: "Save my look",
		needThree: "Pick three to continue.",
		bannerTitle: "Choose your look",
		bannerBody: "Three categories. Better recommendations.",
		cta: "Get started",
		saved: "Saved. For You is tuned.",
		picked: "{n} selected"
	},
	creators: {
		title: "Creators",
		empty: "No studios are live yet.",
		pieces: "{n} wallpapers",
		newFrom: "New from the studio"
	},
	studio: {
		title: "Studio",
		brand: "Creator Studio",
		back: "Back to app",
		off: "The creator marketplace is paused.",
		applyTitle: "Apply to the studio",
		applyBody: "Submit quiet, original plates. We review applications, then you upload photos up to 15 MB. People download the same file you posted.",
		apply: "Apply",
		applying: "Sending…",
		name: "Studio name",
		slug: "URL",
		bio: "Bio",
		bioHint: "A short line about the work.",
		slugTaken: "That URL is taken.",
		needName: "Add a studio name.",
		pendingTitle: "In review",
		pendingBody: "We'll open the studio when the application is approved.",
		rejectedTitle: "Not this time",
		rejectedBody: "This application was not approved. You can apply again with a different studio.",
		suspendedTitle: "Studio paused",
		dashboard: "Overview",
		submit: "Submit a plate",
		submitCta: "Submit a plate",
		live: "Live",
		pending: "In review",
		downloads: "Downloads",
		share: "Estimated share",
		shareNote: "Preview estimate at {share}% of a notional $0.04 per download. Not a payout. Minimum for production payouts is {min}.",
		emptyPieces: "No plates submitted yet.",
		upload: "Your photo",
		uploadHint: "JPEG, PNG, or WebP. Up to 15 MB for the original and the enhanced file. We auto-enhance it for a sharper phone or iPad download.",
		uploadCta: "Choose file",
		changePhoto: "Replace file",
		enhancing: "Enhancing for download…",
		enhanced: "Enhanced",
		original: "Original",
		enhanceHint: "Sharper and richer for lock, home, and tablet screens. This is the file people download.",
		needFile: "Add a photo.",
		tooBig: "Keep it under 15 MB.",
		uploadFailed: "Couldn’t upload that plate. Try again.",
		badType: "Use JPEG, PNG, or WebP.",
		badRatio: "Image is too small.",
		encoding: "Preparing…",
		plateTitle: "Title",
		plateBody: "Description",
		writeCopy: "Write from this photo",
		writingCopy: "Reading the photo…",
		category: "Category",
		tags: "Tags",
		tagsHint: "Add up to eight. Press Enter, or pick a suggestion so people can find this plate.",
		tagsPlaceholder: "dusk, grain, calm",
		tagsMax: "Eight tags at most.",
		access: "Access",
		device: "Device",
		devicePhone: "Phone",
		deviceTablet: "iPad / Tablet",
		deviceBoth: "Phone & Tablet",
		deviceHint: "Phone plates stay portrait. Tablet plates can be portrait or landscape.",
		publish: "Submit for review",
		published: "Submitted. We'll review it.",
		publicPage: "View public page",
		needTitle: "Add a title.",
		duplicate: "This image is already in the catalog. We kept the first one.",
		duplicateOwn: "You already submitted this plate.",
		edit: "Edit",
		editPlate: "Edit plate",
		saveChanges: "Save changes",
		photoReReview: "New photo — we'll review it again."
	},
	ops: {
		title: "Admin",
		brand: "Mr Wallpapers Admin",
		previewNote: "Operator console for this preview. Catalog, reports, accounts, and studio settings are server-gated. Original upload ships with production admin.",
		backToApp: "Back to app",
		signIn: "Sign in to open the admin dashboard.",
		denied: "You do not have access to admin.",
		claimTitle: "Claim the studio",
		claimBody: "No operator is assigned yet. The first signed-in account becomes admin for this preview. Later operators are invited by an existing admin.",
		claim: "Claim admin access",
		overview: "Dashboard",
		wallpapers: "Catalog",
		reports: "Reports",
		settings: "Settings",
		users: "Accounts",
		creators: "Creators",
		studio: "Studio",
		today: "Today",
		vsYesterday: "vs yesterday",
		last14: "Downloads · last 14 days",
		downloadMix: "Download mix",
		topWallpapers: "Most downloaded",
		pendingReview: "Pending review",
		favorites: "Saved",
		openQueue: "Needs review",
		seeCatalog: "Open catalog",
		seeReports: "Review reports",
		allStatuses: "All",
		catalogHint: "Approve, set device type, and place on Home.",
		reportsHint: "Reports from the consumer app. Resolve or dismiss.",
		settingsHint: "Download rules, feature flags, categories, collections, and storage.",
		usersHint: "Roles, account status, and gift premium. You cannot demote yourself.",
		seo: "Search",
		seoHint: "Titles, descriptions, slugs, and tracking. Empty fields use automatic values.",
		seoTitle: "SEO title",
		seoDescription: "Meta description",
		seoSlug: "URL slug",
		seoAlt: "Image ALT text",
		seoCanonical: "Canonical path",
		seoIndex: "Index in search",
		seoIntro: "Category intro",
		gsc: "Search Console verification",
		ga: "Google Analytics ID",
		ogImage: "Default share image",
		creatorsHint: "Applications and plates waiting for review.",
		searchAccounts: "Search accounts",
		noUsers: "No accounts yet.",
		giftPremium: "Gift premium",
		revokePremium: "Remove premium",
		premiumMember: "Premium",
		emptyFeatured: "No live placements. Set Wallpaper of the Day from Catalog.",
		emptySlot: "None yet.",
		emptyCatalog: "No wallpapers match that filter.",
		placeOn: "Place on Home",
		maintenanceOn: "Maintenance mode is on. The consumer app is paused.",
		stats: {
			wallpapers: "Wallpapers",
			approved: "Approved",
			premium: "Premium pieces",
			downloadsToday: "Downloads today",
			downloads: "All downloads",
			reports: "Open reports",
			users: "Accounts",
			premiumSubs: "Premium members",
			pending: "Pending",
			favorites: "Favorites"
		},
		status: {
			draft: "Draft",
			pending: "Pending",
			approved: "Approved",
			rejected: "Rejected",
			removed: "Removed",
			suspended: "Paused"
		},
		access: {
			free: "Free",
			premium: "Premium"
		},
		device: {
			phone: "Phone",
			tablet: "Tablet",
			both: "Both"
		},
		featured: "Placements",
		wotd: "Wallpaper of the Day",
		editors: "Editor's Choice",
		spotlight: "Premium spotlight",
		placeWotd: "Set as WOTD",
		placeEditors: "Add to Editor's Choice",
		placeSpotlight: "Add to spotlight",
		removePlace: "Remove",
		openReports: "Open reports",
		resolve: "Resolve",
		dismiss: "Dismiss",
		noReports: "No open reports.",
		closedReports: "Closed",
		tabResolved: "Resolved",
		tabDismissed: "Dismissed",
		applications: "Applications",
		submissions: "Plates in review",
		noCreators: "No creator applications.",
		noSubmissions: "No plates waiting.",
		approve: "Approve",
		reject: "Reject",
		categories: "Categories",
		collections: "Collections",
		visible: "Visible",
		hidden: "Hidden",
		featuredFlag: "Featured",
		downloadMode: "Free download mode",
		rewarded: "Rewarded ad",
		direct: "Direct",
		ads: "Ads enabled",
		rewardedFlag: "Rewarded downloads",
		adsense: "Google AdSense",
		adsenseHint: "Paste your publisher ID to serve live ads. Until then, house ads run and estimated revenue is tracked.",
		adsenseClient: "Publisher ID (ca-pub-…)",
		adsenseBanner: "Banner slot",
		adsenseFeed: "Feed slot",
		adsenseAnchor: "Anchor slot",
		displayEcpm: "Display eCPM ($)",
		rewardedEcpm: "Rewarded eCPM ($)",
		adRevenue: "Ad revenue",
		adImpressions: "Ad impressions",
		adToday: "today",
		mediation: "Ad mediation",
		mediationHint: "Web serves AdSense, then house ads. MAX, AdMob, LevelPlay, and Meta fill on iPhone and Android. Turn a network on and paste its IDs.",
		networkOn: "In stack",
		sdkKey: "SDK key",
		appId: "App / publisher ID",
		bannerUnit: "Banner unit",
		feedUnit: "Feed unit",
		rewardedUnit: "Rewarded unit",
		ecpmFloor: "eCPM floor ($)",
		timeout: "Timeout (ms)",
		surfaceWeb: "Web",
		surfaceNative: "iOS & Android",
		byNetwork: "By network",
		maintenance: "Maintenance mode",
		dailyLimit: "Daily download limit",
		creatorShare: "Creator share %",
		platformShare: "Platform share %",
		flags: "Feature flags",
		role: "Role",
		accountStatus: "Status",
		saved: "Saved",
		failed: "Could not save. Try again.",
		on: "On",
		off: "Off",
		marketplace: "Creator marketplace",
		storage: "Plate storage",
		storageSupabase: "Supabase",
		storageDatabase: "App database",
		storageR2: "Cloudflare R2",
		storageR2Connected: "Connected. New Studio plates go to R2 (free tier, $0 egress). Built-in catalog stays in the app.",
		storageR2Hint: "Create a free Cloudflare R2 bucket, then paste the API token below. Until then, Studio files stay in the app database at no extra cost.",
		storageConnected: "Connected. New Studio plates go to this project. Built-in catalog stays in the app.",
		storageWaiting: "Project found. Paste the service role secret from Supabase → Project Settings → API, then connect. Until then, Studio files stay in the app database.",
		storageKey: "Service role secret",
		storageKeyHint: "Starts with eyJ or sb_secret_. Never shown again after you connect.",
		storageConnect: "Connect Storage",
		storageConnecting: "Connecting…",
		storageProject: "Project",
		storageBuckets: "Buckets",
		storageNeedKey: "Could not reach Storage. Check the service role secret and try again.",
		r2Account: "Account ID",
		r2Access: "Access key ID",
		r2Secret: "Secret access key",
		r2Bucket: "Bucket",
		r2Public: "Public CDN URL (optional)",
		r2PublicHint: "Custom domain on the bucket, like https://cdn.mrwallpapers.app. Leave blank to serve through the app.",
		r2Connect: "Connect R2",
		r2Failed: "Could not reach R2. Check the account ID, token, and bucket name.",
		roleLabels: {
			user: "Member",
			creator: "Creator",
			moderator: "Moderator",
			admin: "Admin"
		}
	}
};
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/utils-Dbe8pcio.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / 1048576).toFixed(1)} MB`;
}
function formatCount(n) {
	if (n < 1e3) return String(n);
	if (n < 1e6) return `${(n / 1e3).toFixed(n < 1e4 ? 1 : 0)}K`;
	return `${(n / 1e6).toFixed(1)}M`;
}
function formatDate(value) {
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString(void 0, {
		month: "short",
		day: "numeric",
		year: "numeric"
	});
}
function formatUsd(n) {
	return new Intl.NumberFormat(void 0, {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0
	}).format(Math.round(n));
}
function formatUsdMoney(amount) {
	return new Intl.NumberFormat(void 0, {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(amount);
}
function slugify(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/api-Ckbjyqf9.js
var getHomeFeed = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({ tasteIds: array(string()).optional() }).optional()).handler(createSsrRpc("1605f399a187d105ca3e317418915da40127f4c124f78bf75a36ff34ac41a1f7"));
var getAppConfig = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).handler(createSsrRpc("b323fe7712b30b504f1445cf1eefeb87e6eb90b98cd34855d6f18a68d7a07ae0"));
var getExploreMeta = createServerFn({ method: "GET" }).handler(createSsrRpc("16e0e7ce3fed5e42d9e491e906a17f8d430ab66069216e423791016032c0763b"));
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
})).handler(createSsrRpc("a6b6891771c945c2acc887e5fdbcb577d9e906cc7ccf7aaa988120562df2c0f4"));
var getCategoryPage = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({
	slug: string(),
	page: number().int().min(1).optional(),
	offset: number().int().min(0).optional()
})).handler(createSsrRpc("1cb0346450f573813ad138af13aa1e0cf752f06c2af699d5f96afe54864a977c"));
var getCollectionPage = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({ slug: string() })).handler(createSsrRpc("cf3aba8f477b649ff956b5dba3e53cd1872c2dd59f6910efa884723835b33c70"));
var getWallpaper = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({ id: string() })).handler(createSsrRpc("d889399279cd715847106f13d4aeeae3606092ea9c855dc53f80d707d10aa78f"));
var getPublicSeo = createServerFn({ method: "GET" }).handler(createSsrRpc("c4a6424c954ade7c8890a65e8d6dd41a43935bcd421963e383c5d4bf0c7904c9"));
var getSitemapData = createServerFn({ method: "GET" }).handler(createSsrRpc("b230fcbe4b5a0588e1cffca3c26aefafb26ece1f61fddae8f0811cac6357a479"));
var getSeoRedirect = createServerFn({ method: "GET" }).validator(object({ path: string() })).handler(createSsrRpc("98166246a473c5475e4f73d8d044df1a8241bdb662e27b9119357b01f5100628"));
var toggleFavorite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ wallpaperId: string() })).handler(createSsrRpc("ba8bba5228698a967e7d9c541297c7325986b5dc37bb1c57f382674b0b321faa"));
var listFavorites = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ offset: number().int().min(0).optional() }).optional()).handler(createSsrRpc("7d83f449782f36974a5bbac554254ad684ee262d660c08000d8dd0a8bf98bc18"));
var getPremiumStatus = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).handler(createSsrRpc("99d939a31d42bcc3331bba76b2a50708590375f0634b76fbca355dfa544f826d"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ productId: string() })).handler(createSsrRpc("5e4fdfa05550cb0ba2b319fb1d2bc6d971f844deb76e10e302903a428d1f82aa"));
var createAdSession = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ wallpaperId: string() })).handler(createSsrRpc("3e5fd662b09538313eb3562a24f2be5ab1b3c7a99a56c56e6be64458bfa99ad7"));
var requestDownload = createServerFn({ method: "POST" }).middleware([optionalAuthMiddleware]).validator(object({
	wallpaperId: string(),
	source: string().optional(),
	adSessionId: string().optional()
})).handler(createSsrRpc("d66a0a7d32ce007d51465a2281fcbe3bb1723e611a5647929c712eb204d8c0f0"));
createServerFn({ method: "POST" }).middleware([optionalAuthMiddleware]).validator(object({
	placement: string(),
	format: string().optional(),
	creativeId: string().optional(),
	network: string().optional(),
	clicked: boolean().optional()
})).handler(createSsrRpc("1d49de64ef23cada5fb552e217193e68ebd5f3b0f7a83632a401de05467a33b8"));
createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).handler(createSsrRpc("4209f42148dbfead55b68ccf32f9ebd0603e932be076b9c288addcaa8c879998"));
var listDownloads = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("5ea9c8e128e25315245e8e74c4bd6a1030077718c8a6254668956ff0df455d08"));
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
})).handler(createSsrRpc("b8afc839a554780d8f35ade61755b25b89b99af6494b1d3cca229204d1e1fa53"));
var ensureProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("ac0da02bd9a524b586ba676269e60b5c8c652e2dbe21c0751f62aab1b180369d"));
var getTaste = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f50e29058a59ae044e9e05cf30bb8ef88adfaff352b71f27013e72945efc7ab2"));
var saveTaste = createServerFn({ method: "POST" }).middleware([optionalAuthMiddleware]).validator(object({ categoryIds: array(string()).min(3) })).handler(createSsrRpc("2c4c0f3d5eb27b8987c0ee724e5fadf03e1e9cf8fb65a51dbf61da11e76f1670"));
var listNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("c3972ee4d0736a00df2095b11cc29da4af69edc7462b684c3b8b7d301bd86b49"));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ id: string().optional() }).optional()).handler(createSsrRpc("feafd6ce3fd421d62eb31b119e9ea77c42b624f16a4b8fc15b251338d0d527d9"));
var updateNotificationPref = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ on: boolean() })).handler(createSsrRpc("1bb7b555d601b6bea1071a995be62a1c2a66a3c1929b6000a0244bb98bba5b99"));
var deleteAccountData = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("8b32ff801b2fbb57c4e3fce98c84e3edf1c16b6db798d07bee6ef684cd4fde42"));
var getPairPage = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({ slug: string() })).handler(createSsrRpc("a5728ec5cbcead57812362253000e6329d18c29395a5ac68378f0dbb44423ee5"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/storage-keys-BbGwDT6b.js
var ONBOARDING_KEY = "mrwallpapers.onboarding.v1";
var THEME_KEY = "mrwallpapers.theme";
var TASTE_KEY = "mrwallpapers.taste.v1";
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-DQ8icHtZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AppErrorComponent({ error, reset }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-danger",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl",
				children: t.errors.generic
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted",
				children: error.message || t.errors.empty
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-center justify-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => reset(),
					className: "grid h-11 place-items-center rounded-full bg-fg px-5 text-sm font-medium text-bg",
					children: t.errors.retry
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/app",
					className: "grid h-11 place-items-center rounded-full bg-elevated px-5 text-sm font-medium text-fg",
					children: t.nav.home
				})]
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function MwMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		fill: "none",
		className: cn("text-fg", className),
		role: "img",
		"aria-label": "Mr Wallpapers",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "2",
				y: "2",
				width: "60",
				height: "60",
				rx: "16",
				stroke: "currentColor",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M10 46 V18 L21 40 L32 18 V46",
				stroke: "currentColor",
				strokeWidth: "2.2",
				strokeLinejoin: "round",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M34 18 L40 46 L46 28 L52 46 L58 18",
				stroke: "currentColor",
				strokeWidth: "2.2",
				strokeLinejoin: "round",
				strokeLinecap: "round"
			})
		]
	});
}
function NotFoundPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto grid min-h-dvh max-w-lg place-content-center px-6 py-16 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: `Page not found | ${brand.name}` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("meta", {
				name: "robots",
				content: "noindex, nofollow"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("meta", {
				name: "googlebot",
				content: "noindex, nofollow"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MwMark, { className: "mx-auto size-12" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-6 font-display text-4xl text-fg",
				children: "This page is gone"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: "That wallpaper or collection isn’t here. It may have been removed, or the link is out of date."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-wrap justify-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/",
					className: "grid h-11 place-items-center rounded-full bg-fg px-4 text-sm font-medium text-bg",
					children: "Home"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/wallpapers",
					className: "grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg",
					children: "Browse wallpapers"
				})]
			})
		]
	});
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function applyTheme(theme) {
	if (typeof document === "undefined") return;
	const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const dark = theme === "system" ? systemDark : theme === "dark";
	document.documentElement.classList.toggle("dark", dark);
	document.documentElement.classList.toggle("light", !dark);
	document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
var ThemeContext = (0, import_react.createContext)({
	theme: "dark",
	setTheme: () => void 0
});
function ThemeProvider({ children }) {
	const [theme, setThemeState] = (0, import_react.useState)("dark");
	(0, import_react.useLayoutEffect)(() => {
		const stored = localStorage.getItem(THEME_KEY);
		const next = stored === "light" || stored === "system" || stored === "dark" ? stored : "dark";
		setThemeState(next);
		applyTheme(next);
	}, []);
	(0, import_react.useEffect)(() => {
		if (theme !== "system") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyTheme("system");
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [theme]);
	const value = (0, import_react.useMemo)(() => ({
		theme,
		setTheme: (next) => {
			setThemeState(next);
			localStorage.setItem(THEME_KEY, next);
			applyTheme(next);
		}
	}), [theme]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeContext.Provider, {
		value,
		children
	});
}
function useTheme() {
	return (0, import_react.useContext)(ThemeContext);
}
/**
* Runs in <head> before first paint: apply stored theme, and skip the splash
* on returning visits so `/` never flashes the mark then jumps to Home.
*/
var BOOT_SCRIPT = `!function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)}),d=t==="light"?!1:t==="system"?matchMedia("(prefers-color-scheme:dark)").matches:!0,e=document.documentElement;e.classList.toggle("dark",d);e.classList.toggle("light",!d);e.style.colorScheme=d?"dark":"light";if(location.pathname==="/"&&localStorage.getItem(${JSON.stringify(ONBOARDING_KEY)})==="1")location.replace("/app")}catch(n){}}();`;
var styles_default = "/assets/styles-DEaqSsIV.css";
var Route$40 = createRootRoute({
	loader: () => getPublicSeo(),
	staleTime: 6e4,
	errorComponent: AppErrorComponent,
	notFoundComponent: NotFoundPage,
	head: ({ loaderData }) => {
		const seo = loaderData ?? {
			gaId: "",
			gscVerification: "",
			ogImage: "/og.jpg"
		};
		const meta = [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{
				name: "theme-color",
				content: "#0a0a0b"
			}
		];
		if (seo.gscVerification) meta.push({
			name: "google-site-verification",
			content: seo.gscVerification
		});
		const scripts = [];
		if (seo.gaId) {
			scripts.push({
				async: "true",
				src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(seo.gaId)}`
			});
			scripts.push({ children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.gaId}',{anonymize_ip:true});` });
		}
		return {
			meta,
			scripts,
			links: [
				{
					rel: "icon",
					type: "image/svg+xml",
					href: "/favicon.svg"
				},
				{
					rel: "stylesheet",
					href: styles_default
				},
				{
					rel: "manifest",
					href: "/__grok/manifest.webmanifest"
				},
				{
					rel: "apple-touch-icon",
					href: "/__grok/icon-180.png"
				},
				{
					rel: "sitemap",
					type: "application/xml",
					href: "/sitemap.xml"
				},
				{
					rel: "preconnect",
					href: "https://fonts.googleapis.com"
				},
				{
					rel: "preconnect",
					href: "https://fonts.gstatic.com",
					crossOrigin: "anonymous"
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600&display=optional"
				}
			]
		};
	},
	component: RootDocument
});
function RootDocument() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "dark antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: BOOT_SCRIPT } }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "min-h-dvh bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$30 = () => import("./routes-Crv2p0yW.mjs");
var Route$39 = createFileRoute("/")({
	loader: () => getHomeFeed(),
	staleTime: 3e4,
	head: ({ loaderData }) => pageHead({
		title: HOME_TITLE,
		description: HOME_DESCRIPTION,
		path: "/",
		jsonLd: [
			websiteJsonLd(),
			organizationJsonLd(),
			itemListJsonLd({
				name: "Trending wallpapers",
				path: "/",
				items: (loaderData?.trending ?? []).slice(0, 12).map((w) => ({
					name: w.title,
					path: wallpaperPath(w.slug || w.id)
				}))
			})
		]
	}),
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
var Route$38 = createFileRoute("/$")({
	beforeLoad: () => {
		throw notFound();
	},
	head: () => noindexHead("Page not found | Mr Wallpapers")
});
var $$splitComponentImporter$29 = () => import("./app-qHsQdln4.mjs");
var Route$37 = createFileRoute("/app")({
	head: () => noindexHead(`${brand.name} app`, "/app"),
	component: lazyRouteComponent($$splitComponentImporter$29, "component")
});
var $$splitComponentImporter$28 = () => import("./creators-CsGieHjM.mjs");
var Route$36 = createFileRoute("/creators")({
	loader: () => listCreators(),
	staleTime: 3e4,
	head: () => pageHead({
		title: `Wallpaper Creators | ${brand.name}`,
		description: `Original wallpaper artists on ${brand.name}. Browse creator studios and download HD plates for phone and tablet.`,
		path: "/creators"
	}),
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
var $$splitComponentImporter$27 = () => import("./login-2L72yGog.mjs");
var Route$35 = createFileRoute("/login")({
	validateSearch: (s) => ({ next: typeof s.next === "string" && s.next.startsWith("/") ? s.next : "/app" }),
	head: () => noindexHead(`Sign in | ${brand.name}`, "/login"),
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
var $$splitComponentImporter$26 = () => import("./onboarding-Du7nC_zb.mjs");
var Route$34 = createFileRoute("/onboarding")({
	head: () => noindexHead("Welcome", "/onboarding"),
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
var $$splitComponentImporter$25 = () => import("./ops-T071eKDX.mjs");
var Route$33 = createFileRoute("/ops")({
	head: () => noindexHead("Admin", "/ops"),
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
var BODY = `User-agent: *
Allow: /
Disallow: /app
Disallow: /app/
Disallow: /ops
Disallow: /ops/
Disallow: /studio
Disallow: /studio/
Disallow: /login
Disallow: /onboarding
Disallow: /api/
Disallow: /auth/

Sitemap: ${SITE_URL}/sitemap.xml
`;
var Route$32 = createFileRoute("/robots.txt")({ server: { handlers: { GET: async () => new Response(BODY, { headers: {
	"content-type": "text/plain; charset=utf-8",
	"cache-control": "public, max-age=86400"
} }) } } });
function esc(value) {
	return [...value].map((ch) => {
		if (ch === "&") return "&amp;";
		if (ch === "<") return "&lt;";
		if (ch === ">") return "&gt;";
		if (ch === "\"") return "&quot;";
		return ch;
	}).join("");
}
function urlNode(loc, extra = "") {
	return `<url><loc>${esc(absUrl(loc))}</loc>${extra}</url>`;
}
var Route$31 = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: async () => {
	const data = await getSitemapData();
	const staticPages = [
		"/",
		"/wallpapers",
		"/creators",
		"/legal/privacy",
		"/legal/terms",
		"/legal/copyright",
		"/legal/guidelines"
	];
	const devicePages = Object.keys(DEVICE_HUBS).map((slug) => categoryPath(slug));
	const parts = [
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
		...staticPages.map((p) => urlNode(p, "<changefreq>daily</changefreq><priority>0.8</priority>")),
		...devicePages.map((p) => urlNode(p, "<changefreq>daily</changefreq><priority>0.7</priority>")),
		...data.categories.map((c) => urlNode(categoryPath(c.slug), "<changefreq>daily</changefreq><priority>0.7</priority>")),
		...data.collections.map((c) => urlNode(`/collection/${c.slug}`, "<changefreq>weekly</changefreq>")),
		...data.creators.map((c) => urlNode(`/creator/${c.slug}`, "<changefreq>weekly</changefreq>")),
		...(data.pairs ?? []).map((p) => urlNode(`/pair/${p.slug}`, "<changefreq>weekly</changefreq>")),
		...data.wallpapers.map((w) => urlNode(wallpaperPath(w.slug), `<lastmod>${esc(new Date(w.updated).toISOString())}</lastmod><image:image><image:loc>${esc(absUrl(w.image))}</image:loc><image:title>${esc(w.title)}</image:title></image:image>`)),
		`</urlset>`
	];
	return new Response(parts.join(""), { headers: {
		"content-type": "application/xml; charset=utf-8",
		"cache-control": "public, max-age=3600"
	} });
} } } });
var $$splitComponentImporter$24 = () => import("./studio-DXdu_zji.mjs");
var Route$30 = createFileRoute("/studio")({
	head: () => noindexHead("Studio", "/studio"),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
var ALLOWED = /^(image\/jpeg|image\/png|image\/webp|application\/octet-stream)$/i;
var Route$29 = createFileRoute("/api/studio-original")({ server: { handlers: { POST: async ({ request }) => {
	let userId;
	try {
		const header = request.headers.get("authorization");
		const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7) : void 0;
		userId = await requireUserId(token);
	} catch {
		return Response.json({ error: "auth" }, { status: 401 });
	}
	if (!await marketplaceEnabled()) return Response.json({ error: "off" }, { status: 403 });
	if ((await (await getSql()).query(`select status from creator_profiles where user_id = $1 limit 1`, [userId]))[0]?.status !== "approved") return Response.json({ error: "forbidden" }, { status: 403 });
	const mimeHeader = (request.headers.get("content-type") || "").split(";")[0].trim();
	const declared = (request.headers.get("x-file-type") || mimeHeader).split(";")[0].trim();
	const mime = ALLOWED.test(declared) && !declared.includes("octet-stream") ? declared : "image/jpeg";
	const ext = (decodeURIComponent(request.headers.get("x-file-name") || "plate.jpg").split(".").pop() || "jpg").toLowerCase();
	const safeExt = ext === "png" || ext === "webp" ? ext : "jpg";
	const uploadId = request.headers.get("x-upload-id") || "";
	const index = Number(request.headers.get("x-chunk-index") || "0");
	const count = Number(request.headers.get("x-chunk-count") || "1");
	const buf = Buffer.from(await request.arrayBuffer());
	if (buf.length < 1 || buf.length > Math.max(2161152, 15728640)) return Response.json({ error: "size" }, { status: 413 });
	try {
		if (count > 1 && uploadId) {
			const stored = await storeStudioPart({
				userId,
				uploadId,
				index,
				count,
				mime,
				ext: safeExt,
				bytes: buf
			});
			return Response.json(stored);
		}
		if (buf.length > 15728640) return Response.json({ error: "size" }, { status: 413 });
		const stored = await storeStudioOriginal({
			userId,
			bytes: buf,
			mime,
			ext: safeExt
		});
		return Response.json(stored);
	} catch (err) {
		console.error("[studio-original]", err);
		return Response.json({ error: "store" }, { status: 500 });
	}
} } } });
var $$splitComponentImporter$23 = () => import("./app-eiCaCwwA.mjs");
var Route$28 = createFileRoute("/app/")({
	loader: () => getHomeFeed({ data: {} }),
	staleTime: 15e3,
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./creators-DybQQ0Wo.mjs");
var Route$27 = createFileRoute("/app/creators")({
	loader: () => listCreators(),
	staleTime: 3e4,
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./downloads-OtAvqZgT.mjs");
var Route$26 = createFileRoute("/app/downloads")({ component: lazyRouteComponent($$splitComponentImporter$21, "component") });
var $$splitComponentImporter$20 = () => import("./explore-Cw1EXopP.mjs");
var Route$25 = createFileRoute("/app/explore")({
	validateSearch: (s) => ({
		q: typeof s.q === "string" && s.q.trim() ? s.q : void 0,
		category: typeof s.category === "string" ? s.category : void 0,
		access: s.access === "free" || s.access === "premium" ? s.access : void 0,
		device: s.device === "tablet" || s.device === "all" || s.device === "phone" ? s.device : void 0,
		sort: s.sort === "latest" || s.sort === "trending" || s.sort === "downloads" || s.sort === "favorites" ? s.sort : void 0
	}),
	head: () => noindexHead("Explore", "/app/explore"),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./favorites-CvsgcYMW.mjs");
var Route$24 = createFileRoute("/app/favorites")({ component: lazyRouteComponent($$splitComponentImporter$19, "component") });
var $$splitComponentImporter$18 = () => import("./notifications-BkR6lEAX.mjs");
var Route$23 = createFileRoute("/app/notifications")({ component: lazyRouteComponent($$splitComponentImporter$18, "component") });
var Route$22 = createFileRoute("/app/premium")({ beforeLoad: () => {
	throw redirect({ to: "/app" });
} });
var $$splitComponentImporter$17 = () => import("./profile-B0tpqPVf.mjs");
var Route$21 = createFileRoute("/app/profile")({ component: lazyRouteComponent($$splitComponentImporter$17, "component") });
var $$splitComponentImporter$16 = () => import("./taste-DmhS8VHI.mjs");
var Route$20 = createFileRoute("/app/taste")({ component: lazyRouteComponent($$splitComponentImporter$16, "component") });
var Route$19 = createFileRoute("/category/$slug")({ beforeLoad: ({ params }) => {
	throw redirect({
		href: `/wallpapers/${params.slug}`,
		statusCode: 301
	});
} });
var $$splitComponentImporter$15 = () => import("./collection._slug-Bx_vyWAK.mjs");
var Route$18 = createFileRoute("/collection/$slug")({
	loader: async ({ params }) => {
		const data = await getCollectionPage({ data: { slug: params.slug } });
		if (!data.collection) throw notFound();
		return data;
	},
	staleTime: 3e4,
	head: ({ loaderData, params }) => {
		const name = loaderData?.collection?.name;
		const path = `/collection/${params.slug}`;
		return pageHead({
			title: name ? `${name} Wallpaper Collection | ${brand.name}` : brand.name,
			description: name ? `${loaderData?.collection?.description || name} — HD wallpapers from ${brand.name} for iPhone, Android, and iPad.` : brand.positioning,
			path,
			noindex: !name,
			jsonLd: name ? [breadcrumbJsonLd([
				{
					name: "Home",
					path: "/"
				},
				{
					name: "Wallpapers",
					path: "/wallpapers"
				},
				{
					name,
					path
				}
			]), itemListJsonLd({
				name: `${name} collection`,
				path,
				items: (loaderData?.items ?? []).map((w) => ({
					name: w.title,
					path: wallpaperPath(w.slug || w.id)
				}))
			})] : []
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./creator._slug-BWaF8KVX.mjs");
var Route$17 = createFileRoute("/creator/$slug")({
	loader: async ({ params }) => {
		const data = await getCreatorPage({ data: { slug: params.slug } });
		if (!data.creator) throw notFound();
		return data;
	},
	staleTime: 3e4,
	head: ({ loaderData, params }) => {
		const name = loaderData?.creator?.displayName;
		const path = `/creator/${params.slug}`;
		return pageHead({
			title: name ? `${name} Wallpapers | ${brand.name}` : brand.name,
			description: name ? `HD wallpapers by ${name} on ${brand.name}. ${loaderData?.creator?.bio || "Original plates for phone and tablet."}` : brand.positioning,
			path,
			noindex: !name,
			jsonLd: name ? [breadcrumbJsonLd([
				{
					name: "Home",
					path: "/"
				},
				{
					name: "Creators",
					path: "/creators"
				},
				{
					name,
					path
				}
			]), itemListJsonLd({
				name: `${name} wallpapers`,
				path,
				items: (loaderData?.creator?.items ?? []).map((w) => ({
					name: w.title,
					path: wallpaperPath(w.slug || w.id)
				}))
			})] : []
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var pages = {
	privacy: {
		title: t.profile.privacy,
		body: [
			`${brand.name} collects the account information you provide at sign-in, plus wallpaper views, favorites, downloads, and search queries needed to run the product.`,
			"We do not sell personal information. Analytics events avoid unnecessary personal data.",
			"You can delete your Mr Wallpapers data from Profile. Some financial or security records may be retained where the law requires it."
		]
	},
	terms: {
		title: t.profile.terms,
		body: [
			`By using ${brand.name} you agree to use the service lawfully and not to scrape, redistribute, or claim ownership of wallpapers you do not have rights to.`,
			"Premium is billed by the app stores in the native apps. This web preview uses a local entitlement for demonstration only.",
			"We may suspend accounts that abuse downloads, ads, or reporting."
		]
	},
	copyright: {
		title: t.profile.copyright,
		body: [
			"Creators must confirm they own or have rights to distribute content before upload.",
			"To report infringement, use Report on a wallpaper and choose Copyright. We will review and may remove content.",
			"This page is a process outline, not legal advice."
		]
	},
	guidelines: {
		title: t.profile.guidelines,
		body: [
			"No stolen work, hate, spam, or misleading metadata.",
			"Uploads must meet resolution and format rules configured by admins.",
			"Repeat violations can lead to suspension."
		]
	}
};
var $$splitComponentImporter$13 = () => import("./legal._slug-m-yBcvnl.mjs");
var Route$16 = createFileRoute("/legal/$slug")({
	loader: ({ params }) => {
		if (!pages[params.slug]) throw notFound();
		return { slug: params.slug };
	},
	head: ({ params }) => {
		const page = pages[params.slug];
		if (!page) return pageHead({
			title: `Page not found | ${brand.name}`,
			description: brand.positioning,
			path: `/legal/${params.slug}`,
			noindex: true
		});
		return pageHead({
			title: `${page.title} | ${brand.name}`,
			description: page.body[0]?.slice(0, 160) || brand.positioning,
			path: `/legal/${params.slug}`
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var Route$15 = createFileRoute("/media/$")({ server: { handlers: { GET: async ({ params }) => {
	const name = params._splat ?? "";
	if (!name || name.length > 120) return new Response("Not found", { status: 404 });
	try {
		const plate = await loadPublicPlate(name);
		if (!plate) return new Response("Not found", { status: 404 });
		if (plate.redirect) return new Response(null, {
			status: 302,
			headers: {
				Location: plate.redirect,
				"Cache-Control": "public, max-age=86400"
			}
		});
		if (!plate.bytes) return new Response("Not found", { status: 404 });
		return new Response(new Uint8Array(plate.bytes), { headers: {
			"Content-Type": plate.mime || "image/jpeg",
			"Cache-Control": "public, max-age=31536000, immutable",
			"Content-Disposition": `inline; filename="${plate.downloadName || name}"`
		} });
	} catch {
		return new Response("Not found", { status: 404 });
	}
} } } });
var $$splitComponentImporter$12 = () => import("./ops-BEaVlYhx.mjs");
var Route$14 = createFileRoute("/ops/")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./creators-BeC3QI25.mjs");
var Route$13 = createFileRoute("/ops/creators")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./reports-DMuZelqg.mjs");
var Route$12 = createFileRoute("/ops/reports")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./settings-3pyo0ew7.mjs");
var Route$11 = createFileRoute("/ops/settings")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./users-rAczJuWa.mjs");
var Route$10 = createFileRoute("/ops/users")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./wallpapers-Bz-0ycvF.mjs");
var Route$9 = createFileRoute("/ops/wallpapers")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./pair._slug-DeJbldJ7.mjs");
var Route$8 = createFileRoute("/pair/$slug")({
	loader: async ({ params }) => {
		const data = await getPairPage({ data: { slug: params.slug } });
		if (!data.pair) throw notFound();
		return data;
	},
	staleTime: 3e4,
	head: ({ loaderData, params }) => {
		const pair = loaderData?.pair;
		return pageHead({
			title: pair ? `${pair.name} Lock & Home | ${brand.name}` : brand.name,
			description: pair ? `${pair.description || pair.name} — matching lock and home wallpapers from ${brand.name}.` : brand.positioning,
			path: `/pair/${params.slug}`,
			image: pair ? resolveHero(pair.lock.id, pair.lock.thumbnailUrl) : void 0,
			imageAlt: pair?.lock.title,
			jsonLd: pair ? [breadcrumbJsonLd([
				{
					name: "Home",
					path: "/"
				},
				{
					name: "Lock & Home",
					path: "/wallpapers"
				},
				{
					name: pair.name,
					path: `/pair/${params.slug}`
				}
			]), itemListJsonLd({
				name: pair.name,
				path: `/pair/${params.slug}`,
				items: [{
					name: pair.lock.title,
					path: wallpaperPath(pair.lock.slug || pair.lock.id)
				}, {
					name: pair.home.title,
					path: wallpaperPath(pair.home.slug || pair.home.id)
				}]
			})] : [],
			noindex: !pair
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./studio-BxNHm6mf.mjs");
var Route$7 = createFileRoute("/studio/")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./apply--4N8t6QV.mjs");
var Route$6 = createFileRoute("/studio/apply")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./submit-C1zvN4jP.mjs");
var Route$5 = createFileRoute("/studio/submit")({
	validateSearch: (s) => ({ piece: typeof s.piece === "string" && s.piece.length > 0 ? s.piece : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./wallpaper._id-18s-bQ2E.mjs");
var Route$4 = createFileRoute("/wallpaper/$id")({
	loader: async ({ params }) => {
		const alias = await getSeoRedirect({ data: { path: `/wallpaper/${params.id}` } });
		if (alias?.to_path && alias.to_path !== `/wallpaper/${params.id}`) throw redirect({
			href: alias.to_path,
			statusCode: alias.status || 301
		});
		const data = await getWallpaper({ data: { id: params.id } });
		if (data.status === "gone") throw new Response("Gone", {
			status: 410,
			statusText: "Gone",
			headers: { "X-Robots-Tag": "noindex, nofollow" }
		});
		if (!data.wallpaper) throw notFound();
		if (data.canonicalSlug && data.canonicalSlug !== params.id) throw redirect({
			to: "/wallpaper/$id",
			params: { id: data.canonicalSlug },
			replace: true,
			statusCode: 301
		});
		return data;
	},
	staleTime: 3e4,
	head: ({ loaderData }) => {
		const w = loaderData?.wallpaper;
		if (!w) return pageHead({
			title: brand.name,
			description: brand.positioning,
			path: "/",
			noindex: true
		});
		const meta = wallpaperMeta({
			title: w.title,
			categoryName: w.categoryName,
			deviceType: w.deviceType,
			description: w.description,
			seoTitle: w.seoTitle,
			seoDescription: w.seoDescription
		});
		const path = w.canonicalPath || wallpaperPath(w.slug);
		return pageHead({
			title: meta.title,
			description: meta.description,
			path,
			image: w.previewUrl,
			imageAlt: w.altText,
			robots: w.robots,
			jsonLd: [breadcrumbJsonLd([
				{
					name: "Home",
					path: "/"
				},
				{
					name: w.categoryName,
					path: categoryPath(w.categorySlug)
				},
				{
					name: w.title,
					path
				}
			]), imageObjectJsonLd({
				title: w.title,
				description: meta.description,
				image: w.previewUrl,
				path,
				width: w.width,
				height: w.height
			})]
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./wallpapers.index-fvnfbQq6.mjs");
var Route$3 = createFileRoute("/wallpapers/")({
	validateSearch: (s) => ({
		q: typeof s.q === "string" && s.q.trim() ? s.q.trim().slice(0, 80) : void 0,
		page: typeof s.page === "number" && s.page > 1 ? Math.floor(s.page) : void 0
	}),
	loaderDeps: ({ search }) => ({
		q: search.q,
		page: search.page ?? 1
	}),
	loader: async ({ deps }) => {
		const page = deps.page ?? 1;
		const [meta, catalog] = await Promise.all([getExploreMeta(), searchWallpapers({ data: {
			sort: "trending",
			q: deps.q,
			offset: (page - 1) * 24,
			device: "all"
		} })]);
		return {
			meta,
			items: catalog.items,
			q: deps.q,
			page,
			hasMore: catalog.hasMore
		};
	},
	staleTime: 15e3,
	head: ({ loaderData }) => {
		const q = loaderData?.q;
		const page = loaderData?.page ?? 1;
		const pageBit = page > 1 ? ` – Page ${page}` : "";
		return pageHead({
			title: q ? `${q} wallpapers | ${brand.name}${pageBit}` : `All Wallpaper Collections | ${brand.name}${pageBit}`,
			description: `Browse every ${brand.name} collection — motivational, Bible verse, minimal, nature, iPhone, Android, iPad and tablet wallpapers.`,
			path: page > 1 ? `/wallpapers?page=${page}` : "/wallpapers",
			noindex: Boolean(q),
			prev: !q && page > 1 ? page === 2 ? "/wallpapers" : `/wallpapers?page=${page - 1}` : void 0,
			next: !q && loaderData?.hasMore ? `/wallpapers?page=${page + 1}` : void 0,
			jsonLd: [itemListJsonLd({
				name: "Wallpaper collections",
				path: "/wallpapers",
				items: (loaderData?.items ?? []).slice(0, 16).map((w) => ({
					name: w.title,
					path: wallpaperPath(w.slug || w.id)
				}))
			})]
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./wallpapers._slug-DmNYPCUU.mjs");
var Route$2 = createFileRoute("/wallpapers/$slug")({
	validateSearch: (s) => ({ page: typeof s.page === "number" && s.page > 1 ? Math.floor(s.page) : void 0 }),
	loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
	loader: async ({ params, deps }) => {
		const alias = await getSeoRedirect({ data: { path: `/wallpapers/${params.slug}` } });
		if (alias?.to_path) throw redirect({
			href: alias.to_path,
			statusCode: alias.status || 301
		});
		const data = await getCategoryPage({ data: {
			slug: params.slug,
			page: deps.page
		} });
		if (!data.category && !data.hub) throw notFound();
		return data;
	},
	staleTime: 3e4,
	head: ({ loaderData, params, match }) => {
		const page = match.search.page ?? 1;
		const name = loaderData?.category?.name ?? loaderData?.hub?.name ?? params.slug;
		const pageBit = page > 1 ? ` – Page ${page}` : "";
		const meta = loaderData?.hub ? {
			title: `${loaderData.hub.title}${pageBit}`,
			description: loaderData.hub.description
		} : categoryMeta({
			name,
			slug: params.slug,
			description: loaderData?.category?.intro || loaderData?.category?.description,
			seoTitle: loaderData?.category?.seoTitle,
			seoDescription: loaderData?.category?.seoDescription,
			page
		});
		const path = page > 1 ? `${categoryPath(params.slug)}?page=${page}` : loaderData?.category?.canonicalPath || categoryPath(params.slug);
		const hasMore = Boolean(loaderData?.hasMore);
		return pageHead({
			title: meta.title,
			description: meta.description,
			path,
			robots: loaderData?.category?.robots,
			prev: page > 1 ? page === 2 ? categoryPath(params.slug) : `${categoryPath(params.slug)}?page=${page - 1}` : void 0,
			next: hasMore ? `${categoryPath(params.slug)}?page=${page + 1}` : void 0,
			jsonLd: [breadcrumbJsonLd([
				{
					name: "Home",
					path: "/"
				},
				{
					name: "Wallpapers",
					path: "/wallpapers"
				},
				{
					name,
					path: categoryPath(params.slug)
				}
			]), itemListJsonLd({
				name: `${name} wallpapers`,
				path: categoryPath(params.slug),
				items: (loaderData?.items ?? []).map((w) => ({
					name: w.title,
					path: wallpaperPath(w.slug || w.id)
				}))
			})]
		});
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var Route$1 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var Route = createFileRoute("/api/media/$id")({ server: { handlers: { GET: async ({ request }) => {
	const id = new URL(request.url).pathname.split("/").pop() ?? "";
	if (!id || id.length > 64 || id.includes(".")) return new Response("Not found", { status: 404 });
	try {
		const row = await loadMediaFile(id);
		if (!row) return new Response("Not found", { status: 404 });
		const download = new URL(request.url).searchParams.get("dl");
		const headers = {
			"Content-Type": row.mime || "application/octet-stream",
			"Cache-Control": "public, max-age=31536000, immutable",
			"X-Robots-Tag": "noindex, nofollow"
		};
		if (download) {
			headers["Content-Disposition"] = `attachment; filename="${id}.${row.mime?.includes("mp4") || row.mime?.includes("quicktime") ? "MOV" : row.mime?.includes("png") ? "png" : row.mime?.includes("webp") ? "webp" : "jpg"}"`;
			headers["Content-Type"] = "application/octet-stream";
		}
		return new Response(new Uint8Array(row.bytes), { headers });
	} catch {
		return new Response("Not found", { status: 404 });
	}
} } } });
var IndexRoute = Route$39.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$40
});
var SplatRoute = Route$38.update({
	id: "/$",
	path: "/$",
	getParentRoute: () => Route$40
});
var AppRoute = Route$37.update({
	id: "/app",
	path: "/app",
	getParentRoute: () => Route$40
});
var CreatorsRoute = Route$36.update({
	id: "/creators",
	path: "/creators",
	getParentRoute: () => Route$40
});
var LoginRoute = Route$35.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$40
});
var OnboardingRoute = Route$34.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => Route$40
});
var OpsRoute = Route$33.update({
	id: "/ops",
	path: "/ops",
	getParentRoute: () => Route$40
});
var RobotsDottxtRoute = Route$32.update({
	id: "/robots.txt",
	path: "/robots.txt",
	getParentRoute: () => Route$40
});
var SitemapDotxmlRoute = Route$31.update({
	id: "/sitemap.xml",
	path: "/sitemap.xml",
	getParentRoute: () => Route$40
});
var StudioRoute = Route$30.update({
	id: "/studio",
	path: "/studio",
	getParentRoute: () => Route$40
});
var ApiStudioOriginalRoute = Route$29.update({
	id: "/api/studio-original",
	path: "/api/studio-original",
	getParentRoute: () => Route$40
});
var AppIndexRoute = Route$28.update({
	id: "/",
	path: "/",
	getParentRoute: () => AppRoute
});
var AppCreatorsRoute = Route$27.update({
	id: "/creators",
	path: "/creators",
	getParentRoute: () => AppRoute
});
var AppDownloadsRoute = Route$26.update({
	id: "/downloads",
	path: "/downloads",
	getParentRoute: () => AppRoute
});
var AppExploreRoute = Route$25.update({
	id: "/explore",
	path: "/explore",
	getParentRoute: () => AppRoute
});
var AppFavoritesRoute = Route$24.update({
	id: "/favorites",
	path: "/favorites",
	getParentRoute: () => AppRoute
});
var AppNotificationsRoute = Route$23.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => AppRoute
});
var AppPremiumRoute = Route$22.update({
	id: "/premium",
	path: "/premium",
	getParentRoute: () => AppRoute
});
var AppProfileRoute = Route$21.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => AppRoute
});
var AppTasteRoute = Route$20.update({
	id: "/taste",
	path: "/taste",
	getParentRoute: () => AppRoute
});
var CategorySlugRoute = Route$19.update({
	id: "/category/$slug",
	path: "/category/$slug",
	getParentRoute: () => Route$40
});
var CollectionSlugRoute = Route$18.update({
	id: "/collection/$slug",
	path: "/collection/$slug",
	getParentRoute: () => Route$40
});
var CreatorSlugRoute = Route$17.update({
	id: "/creator/$slug",
	path: "/creator/$slug",
	getParentRoute: () => Route$40
});
var LegalSlugRoute = Route$16.update({
	id: "/legal/$slug",
	path: "/legal/$slug",
	getParentRoute: () => Route$40
});
var MediaSplatRoute = Route$15.update({
	id: "/media/$",
	path: "/media/$",
	getParentRoute: () => Route$40
});
var OpsIndexRoute = Route$14.update({
	id: "/",
	path: "/",
	getParentRoute: () => OpsRoute
});
var OpsCreatorsRoute = Route$13.update({
	id: "/creators",
	path: "/creators",
	getParentRoute: () => OpsRoute
});
var OpsReportsRoute = Route$12.update({
	id: "/reports",
	path: "/reports",
	getParentRoute: () => OpsRoute
});
var OpsSettingsRoute = Route$11.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => OpsRoute
});
var OpsUsersRoute = Route$10.update({
	id: "/users",
	path: "/users",
	getParentRoute: () => OpsRoute
});
var OpsWallpapersRoute = Route$9.update({
	id: "/wallpapers",
	path: "/wallpapers",
	getParentRoute: () => OpsRoute
});
var PairSlugRoute = Route$8.update({
	id: "/pair/$slug",
	path: "/pair/$slug",
	getParentRoute: () => Route$40
});
var StudioIndexRoute = Route$7.update({
	id: "/",
	path: "/",
	getParentRoute: () => StudioRoute
});
var StudioApplyRoute = Route$6.update({
	id: "/apply",
	path: "/apply",
	getParentRoute: () => StudioRoute
});
var StudioSubmitRoute = Route$5.update({
	id: "/submit",
	path: "/submit",
	getParentRoute: () => StudioRoute
});
var WallpaperIdRoute = Route$4.update({
	id: "/wallpaper/$id",
	path: "/wallpaper/$id",
	getParentRoute: () => Route$40
});
var WallpapersIndexRoute = Route$3.update({
	id: "/wallpapers/",
	path: "/wallpapers/",
	getParentRoute: () => Route$40
});
var WallpapersSlugRoute = Route$2.update({
	id: "/wallpapers/$slug",
	path: "/wallpapers/$slug",
	getParentRoute: () => Route$40
});
var ApiAuthSplatRoute = Route$1.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$40
});
var ApiMediaIdRoute = Route.update({
	id: "/api/media/$id",
	path: "/api/media/$id",
	getParentRoute: () => Route$40
});
var AppRouteChildren = {
	AppCreatorsRoute,
	AppDownloadsRoute,
	AppExploreRoute,
	AppFavoritesRoute,
	AppNotificationsRoute,
	AppPremiumRoute,
	AppProfileRoute,
	AppTasteRoute,
	AppIndexRoute
};
var AppRouteWithChildren = AppRoute._addFileChildren(AppRouteChildren);
var OpsRouteChildren = {
	OpsCreatorsRoute,
	OpsReportsRoute,
	OpsSettingsRoute,
	OpsUsersRoute,
	OpsWallpapersRoute,
	OpsIndexRoute
};
var OpsRouteWithChildren = OpsRoute._addFileChildren(OpsRouteChildren);
var StudioRouteChildren = {
	StudioApplyRoute,
	StudioSubmitRoute,
	StudioIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	SplatRoute,
	AppRoute: AppRouteWithChildren,
	CreatorsRoute,
	LoginRoute,
	OnboardingRoute,
	OpsRoute: OpsRouteWithChildren,
	RobotsDottxtRoute,
	SitemapDotxmlRoute,
	StudioRoute: StudioRoute._addFileChildren(StudioRouteChildren),
	ApiStudioOriginalRoute,
	CategorySlugRoute,
	CollectionSlugRoute,
	CreatorSlugRoute,
	LegalSlugRoute,
	MediaSplatRoute,
	PairSlugRoute,
	WallpaperIdRoute,
	WallpapersSlugRoute,
	WallpapersIndexRoute,
	ApiAuthSplatRoute,
	ApiMediaIdRoute
};
var routeTree = Route$40._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { listFavorites as A, formatBytes as B, ensureProfile as C, getPremiumStatus as D, getHomeFeed as E, searchWallpapers as F, slugify as G, formatDate as H, submitReport as I, t as K, toggleFavorite as L, markNotificationsRead as M, requestDownload as N, getTaste as O, saveTaste as P, updateNotificationPref as R, deleteAccountData as S, getExploreMeta as T, formatUsd as U, formatCount as V, formatUsdMoney as W, useTheme as _, Route$5 as a, TASTE_KEY as b, pages as c, Route$25 as d, Route$27 as f, Route$39 as g, Route$36 as h, Route$4 as i, listNotifications as j, listDownloads as k, Route$17 as l, Route$35 as m, Route$2 as n, Route$8 as o, Route$28 as p, Route$3 as r, Route$16 as s, router_exports as t, Route$18 as u, MwMark as v, getAppConfig as w, createAdSession as x, ONBOARDING_KEY as y, cn as z };

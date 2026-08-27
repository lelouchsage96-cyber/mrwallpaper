import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as searchWallpapers, K as t, T as getExploreMeta, d as Route$25, w as getAppConfig, z as cn } from "./router-DQ8icHtZ.mjs";
import { t as InfiniteSentinel } from "./lazy-CeFyYund.mjs";
import { n as ErrorState, t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
import { n as WallpaperGrid, r as WallpaperGridSkeleton } from "./wallpaper-grid-CveWJYI3.mjs";
import { t as Input } from "./input-BCaChIGK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/explore-Cw1EXopP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var deviceChips = [
	{
		id: "phone",
		label: t.explore.device.phone
	},
	{
		id: "tablet",
		label: t.explore.device.tablet
	},
	{
		id: "all",
		label: t.explore.device.all
	}
];
var sortChips = [
	{
		id: "trending",
		label: t.explore.sort.trending
	},
	{
		id: "latest",
		label: t.explore.sort.latest
	},
	{
		id: "downloads",
		label: t.explore.sort.downloads
	},
	{
		id: "favorites",
		label: t.explore.sort.favorites
	}
];
function ExplorePage() {
	const search = Route$25.useSearch();
	const navigate = useNavigate();
	const [q, setQ] = (0, import_react.useState)(search.q ?? "");
	const [debounced, setDebounced] = (0, import_react.useState)(search.q ?? "");
	const [categories, setCategories] = (0, import_react.useState)([]);
	const [popular, setPopular] = (0, import_react.useState)([]);
	const [items, setItems] = (0, import_react.useState)([]);
	const [offset, setOffset] = (0, import_react.useState)(0);
	const [hasMore, setHasMore] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [refreshing, setRefreshing] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(false);
	const [premiumOn, setPremiumOn] = (0, import_react.useState)(false);
	const busy = (0, import_react.useRef)(false);
	const access = search.access;
	const sort = search.sort ?? "trending";
	const categorySlug = search.category;
	const device = search.device ?? "phone";
	(0, import_react.useEffect)(() => {
		getExploreMeta().then((m) => {
			setCategories(m.categories);
			setPopular(m.popular);
		}).catch(() => void 0);
		getAppConfig().then((c) => {
			const on = c.featureFlags.premium_enabled;
			setPremiumOn(on);
			if (!on && search.access) navigate({
				to: "/app/explore",
				search: {
					q: search.q,
					category: search.category,
					sort: search.sort,
					device: search.device
				},
				replace: true
			});
		}).catch(() => void 0);
	}, []);
	(0, import_react.useEffect)(() => {
		const id = window.setTimeout(() => setDebounced(q.trim()), 350);
		return () => window.clearTimeout(id);
	}, [q]);
	(0, import_react.useEffect)(() => {
		setQ(search.q ?? "");
		setDebounced(search.q ?? "");
	}, [search.q]);
	function setSearch(next) {
		navigate({
			to: "/app/explore",
			search: {
				q: next.q || void 0,
				category: next.category,
				access: next.access,
				device: next.device && next.device !== "phone" ? next.device : void 0,
				sort: next.sort && next.sort !== "trending" ? next.sort : void 0
			},
			replace: true
		});
	}
	function load(reset) {
		if (!reset && busy.current) return;
		busy.current = true;
		if (reset && items.length === 0) setLoading(true);
		else setRefreshing(true);
		setError(false);
		searchWallpapers({ data: {
			q: debounced || void 0,
			access,
			sort,
			offset: reset ? 0 : offset,
			categorySlug,
			device
		} }).then((res) => {
			setItems((prev) => reset ? res.items : [...prev, ...res.items]);
			setOffset(res.offset);
			setHasMore(res.hasMore);
		}).catch(() => setError(true)).finally(() => {
			busy.current = false;
			setLoading(false);
			setRefreshing(false);
		});
	}
	(0, import_react.useEffect)(() => {
		load(true);
	}, [
		debounced,
		access,
		sort,
		categorySlug,
		device
	]);
	(0, import_react.useEffect)(() => {
		if (debounced === (search.q ?? "")) return;
		setSearch({
			q: debounced || void 0,
			category: categorySlug,
			access,
			sort,
			device
		});
	}, [debounced]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl text-fg",
				children: t.explore.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: t.explore.placeholder,
					"aria-label": t.explore.placeholder,
					type: "search"
				})
			}),
			!debounced && popular.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs tracking-[0.16em] text-subtle uppercase",
					children: t.explore.popularSearches
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: popular.map((term) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							setQ(term);
							setDebounced(term);
							setSearch({
								q: term,
								category: categorySlug,
								access,
								sort,
								device
							});
						},
						className: "h-9 rounded-full bg-elevated px-3 text-sm text-muted hover:text-fg",
						children: term
					}, term))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
				children: deviceChips.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setSearch({
						q: debounced || void 0,
						category: categorySlug,
						access,
						sort,
						device: f.id
					}),
					className: cn("h-9 shrink-0 rounded-full px-4 text-sm transition-colors duration-150 ease-out", device === f.id ? "bg-fg text-bg" : "bg-elevated text-muted"),
					children: f.label
				}, f.id))
			}),
			categories.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
				children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setSearch({
						q: debounced || void 0,
						category: c.slug === categorySlug ? void 0 : c.slug,
						access,
						sort,
						device
					}),
					className: cn("h-9 shrink-0 rounded-full px-4 text-sm transition-colors duration-150 ease-out", categorySlug === c.slug ? "bg-fg text-bg" : "bg-elevated text-muted"),
					children: c.name
				}, c.id))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
				children: sortChips.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setSearch({
						q: debounced || void 0,
						category: categorySlug,
						access,
						sort: f.id,
						device
					}),
					className: cn("h-9 shrink-0 rounded-full px-4 text-sm", sort === f.id ? "bg-fg text-bg" : "bg-elevated text-muted"),
					children: f.label
				}, f.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("mt-5 transition-opacity duration-200 ease-out", refreshing && items.length > 0 ? "opacity-55" : "opacity-100"),
				children: error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: () => load(true) }) : loading && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGridSkeleton, { count: 8 }) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: t.explore.empty }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
						items,
						eager: 4,
						onFavorite: (id, next) => setItems((prev) => prev.map((w) => w.id === id ? {
							...w,
							isFavorite: next
						} : w))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfiniteSentinel, {
						disabled: !hasMore || loading || refreshing,
						onLoad: () => load(false)
					}),
					hasMore && (loading || refreshing) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGridSkeleton, { count: 2 })
					}) : null
				] })
			})
		]
	});
}
//#endregion
export { ExplorePage as component };

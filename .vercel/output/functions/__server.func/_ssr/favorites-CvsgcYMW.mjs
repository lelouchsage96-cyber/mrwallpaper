import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as listFavorites, K as t } from "./router-DQ8icHtZ.mjs";
import { t as useCurrentUserState } from "./use-current-user-DF_8Asza.mjs";
import { t as InfiniteSentinel } from "./lazy-CeFyYund.mjs";
import { n as ErrorState, t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
import { n as WallpaperGrid, r as WallpaperGridSkeleton } from "./wallpaper-grid-CveWJYI3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/favorites-CvsgcYMW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FavoritesPage() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const [items, setItems] = (0, import_react.useState)([]);
	const [offset, setOffset] = (0, import_react.useState)(0);
	const [hasMore, setHasMore] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(false);
	const busy = (0, import_react.useRef)(false);
	const userId = user?.id ?? null;
	function load(reset) {
		if (!reset && busy.current) return;
		busy.current = true;
		if (reset && items.length === 0) setLoading(true);
		setError(false);
		listFavorites({ data: { offset: reset ? 0 : offset } }).then((res) => {
			setItems((prev) => reset ? res.items : [...prev, ...res.items]);
			setOffset(res.offset);
			setHasMore(res.hasMore);
		}).catch(() => setError(true)).finally(() => {
			busy.current = false;
			setLoading(false);
		});
	}
	(0, import_react.useEffect)(() => {
		if (isPending || !userId) {
			if (!isPending && !userId) setLoading(false);
			return;
		}
		load(true);
	}, [userId, isPending]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pt-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl text-fg",
			children: t.favorites.title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGridSkeleton, {})
		})]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pt-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl text-fg",
			children: t.favorites.title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: t.favorites.signIn,
			action: {
				label: t.auth.signIn,
				onClick: () => {
					navigate({
						to: "/login",
						search: { next: "/app/favorites" }
					});
				}
			}
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 pt-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl text-fg",
			children: t.favorites.title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5",
			children: error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: () => load(true) }) : loading && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGridSkeleton, {}) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: t.favorites.empty,
				action: {
					label: t.nav.explore,
					onClick: () => {
						navigate({ to: "/app/explore" });
					}
				}
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items,
					eager: 4,
					onFavorite: (id, next) => {
						if (!next) setItems((prev) => prev.filter((w) => w.id !== id));
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfiniteSentinel, {
					disabled: !hasMore || loading,
					onLoad: () => load(false)
				}),
				hasMore && loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGridSkeleton, { count: 2 })
				}) : null
			] })
		})]
	});
}
//#endregion
export { FavoritesPage as component };

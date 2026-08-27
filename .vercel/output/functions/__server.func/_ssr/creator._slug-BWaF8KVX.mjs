import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as getCreatorPage } from "./studio-B5cbP66D.mjs";
import { D as ChevronLeft } from "../_libs/lucide-react.mjs";
import { K as t, l as Route$17 } from "./router-DQ8icHtZ.mjs";
import { n as ErrorState, t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
import { n as WallpaperGrid, r as WallpaperGridSkeleton } from "./wallpaper-grid-CveWJYI3.mjs";
import { t as PairCard } from "./pair-card-BlQbIVzH.mjs";
import { t as Breadcrumbs } from "./breadcrumbs-uNA0UpIi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/creator._slug-BWaF8KVX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CreatorPageView() {
	const { slug } = Route$17.useParams();
	const initial = Route$17.useLoaderData();
	const [creator, setCreator] = (0, import_react.useState)(initial.creator);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(false);
	function load() {
		setError(false);
		getCreatorPage({ data: { slug } }).then((r) => setCreator(r.creator)).catch(() => setError(true)).finally(() => setLoading(false));
	}
	(0, import_react.useEffect)(() => {
		setCreator(initial.creator);
		setLoading(false);
		setError(false);
	}, [slug, initial]);
	function onFavorite(id, next) {
		setCreator((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				items: prev.items.map((w) => w.id === id ? {
					...w,
					isFavorite: next,
					favoriteCount: w.favoriteCount + (next ? 1 : -1)
				} : w)
			};
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl px-4 pb-16 pt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
			href: "/creators",
			className: "mb-4 flex min-h-11 items-center gap-1 text-sm text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), t.creators.title]
		}), error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: load }) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGridSkeleton, {}) : !creator ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: t.errors.notFound }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Breadcrumbs, { items: [
				{
					name: "Home",
					href: "/"
				},
				{
					name: "Creators",
					href: "/creators"
				},
				{ name: creator.displayName }
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-xs tracking-[0.2em] text-muted uppercase",
				children: t.home.creators
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl text-fg",
				children: creator.displayName
			}),
			creator.bio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-md text-sm text-muted",
				children: creator.bio
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-subtle",
				children: t.creators.pieces.replace("{n}", String(creator.pieceCount))
			}),
			creator.pairs?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl text-fg",
						children: t.pairs.suggested
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: t.pairs.suggestedHint
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
						children: creator.pairs.map((pair) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PairCard, { pair }, pair.id))
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items: creator.items,
					onFavorite,
					eager: 4
				})
			})
		] })]
	});
}
//#endregion
export { CreatorPageView as component };

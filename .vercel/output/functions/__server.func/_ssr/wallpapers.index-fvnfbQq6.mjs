import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Route$3 } from "./router-DQ8icHtZ.mjs";
import { n as WallpaperGrid } from "./wallpaper-grid-CveWJYI3.mjs";
import { t as Breadcrumbs } from "./breadcrumbs-uNA0UpIi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallpapers.index-fvnfbQq6.js
var import_jsx_runtime = require_jsx_runtime();
function WallpapersIndex() {
	const { meta, items, q, page, hasMore } = Route$3.useLoaderData();
	const prev = page > 1 ? page - 1 : null;
	const next = hasMore ? page + 1 : null;
	const qs = q ? `q=${encodeURIComponent(q)}` : "";
	function href(p) {
		const bits = [qs, p > 1 ? `page=${p}` : ""].filter(Boolean);
		return bits.length ? `/wallpapers?${bits.join("&")}` : "/wallpapers";
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-5xl px-4 pb-20 pt-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Breadcrumbs, { items: [{
				name: "Home",
				href: "/"
			}, { name: "Wallpapers" }] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-6 font-display text-4xl text-fg",
				children: q ? `${q} wallpapers` : "Wallpaper collections"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted",
				children: "HD and 4K plates for iPhone, Android, iPad and tablets. Pick a collection, then download the original file."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "mt-6 flex flex-wrap gap-2",
				"aria-label": "Collections",
				children: [
					(meta.categories ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: `/wallpapers/${c.slug}`,
						className: "grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg",
						children: c.name
					}, c.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/wallpapers/iphone",
						className: "grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg",
						children: "iPhone"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/wallpapers/android",
						className: "grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg",
						children: "Android"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/wallpapers/ipad",
						className: "grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg",
						children: "iPad"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/wallpapers/tablet",
						className: "grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg",
						children: "Tablet"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 font-display text-2xl text-fg",
					children: q ? "Results" : "Trending"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items,
					eager: 4
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "mt-10 flex items-center gap-4 text-sm",
				"aria-label": "Pagination",
				children: [
					prev ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: href(prev),
						className: "text-muted hover:text-fg",
						children: "Previous"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-subtle",
						children: "Previous"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: ["Page ", page]
					}),
					next ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: href(next),
						className: "text-muted hover:text-fg",
						children: "Next"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-subtle",
						children: "Next"
					})
				]
			})
		]
	});
}
//#endregion
export { WallpapersIndex as component };

import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as HOME_DESCRIPTION, ot as brand } from "./queries-bIh47-yB.mjs";
import { K as t, g as Route$39, v as MwMark } from "./router-DQ8icHtZ.mjs";
import { n as WallpaperGrid } from "./wallpaper-grid-CveWJYI3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Crv2p0yW.js
var import_jsx_runtime = require_jsx_runtime();
function HomePage() {
	const data = Route$39.useLoaderData();
	const trending = data.trending ?? [];
	const categories = data.categories ?? [];
	const collections = data.collections ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-5xl px-4 pb-20 pt-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: "/",
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MwMark, { className: "size-9" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-xl text-fg",
						children: brand.name
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/app",
					className: "grid h-11 place-items-center rounded-full bg-fg px-4 text-sm font-medium text-bg",
					children: t.nav.home
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 max-w-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl text-fg sm:text-5xl",
					children: "HD & 4K wallpapers for phone and tablet"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-base leading-relaxed text-muted",
					children: HOME_DESCRIPTION
				})]
			}),
			categories.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				"aria-label": "Wallpaper collections",
				className: "mt-8 flex flex-wrap gap-2",
				children: [
					categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
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
					})
				]
			}) : null,
			trending.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-end justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl text-fg",
						children: t.home.trending
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/wallpapers",
						className: "text-sm text-muted hover:text-fg",
						children: t.explore.title
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items: trending,
					eager: 4
				})]
			}) : null,
			collections.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl text-fg",
					children: t.home.editors
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 grid gap-2 sm:grid-cols-2",
					children: collections.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `/collection/${c.slug}`,
						className: "block rounded-[16px] bg-elevated px-4 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium text-fg",
							children: c.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: c.description
						})]
					}) }, c.id))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "mt-16 flex flex-wrap gap-4 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: brand.legal.privacy,
						className: "hover:text-fg",
						children: t.profile.privacy
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: brand.legal.terms,
						className: "hover:text-fg",
						children: t.profile.terms
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: brand.legal.copyright,
						className: "hover:text-fg",
						children: t.profile.copyright
					})
				]
			})
		]
	});
}
//#endregion
export { HomePage as component };

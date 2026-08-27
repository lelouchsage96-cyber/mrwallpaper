import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as ChevronLeft } from "../_libs/lucide-react.mjs";
import { K as t, u as Route$18 } from "./router-DQ8icHtZ.mjs";
import { n as WallpaperGrid } from "./wallpaper-grid-CveWJYI3.mjs";
import { t as Breadcrumbs } from "./breadcrumbs-uNA0UpIi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/collection._slug-Bx_vyWAK.js
var import_jsx_runtime = require_jsx_runtime();
function CollectionPage() {
	const { collection, items } = Route$18.useLoaderData();
	if (!collection) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-5xl px-4 pb-16 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: "/",
				className: "mb-4 flex min-h-11 items-center gap-1 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), t.nav.home]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Breadcrumbs, { items: [
				{
					name: "Home",
					href: "/"
				},
				{
					name: "Wallpapers",
					href: "/wallpapers"
				},
				{ name: collection.name }
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-6 font-display text-3xl text-fg",
				children: collection.name
			}),
			collection.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: collection.description
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-subtle",
				children: t.home.wallpaperCount.replace("{n}", String(collection.wallpaperCount))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items,
					eager: 4
				})
			})
		]
	});
}
//#endregion
export { CollectionPage as component };
